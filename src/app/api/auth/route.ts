import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

// Pre-configured demo accounts for instant hackathon evaluation
const DEMO_ACCOUNTS = [
  {
    id: 'demo-patient-001',
    fullName: 'Bhaben Baruah',
    identifier: 'bhaben',
    password: 'password123',
    role: 'PATIENT',
    region: 'Kamrup Rural, Assam',
  },
  {
    id: 'demo-caregiver-001',
    fullName: 'Anuradha Baruah',
    identifier: 'anuradha@sevamitr.org',
    aliases: ['9435012345', '+919435012345', '+91 94350 12345', 'anuradha'],
    password: 'care123',
    role: 'CAREGIVER',
    region: 'Guwahati, Assam',
  },
  {
    id: 'demo-doctor-001',
    fullName: 'Dr. N. Sharma',
    identifier: 'dr.sharma@gauhati-med.in',
    password: 'doctor123',
    role: 'DOCTOR',
    region: 'Gauhati Medical College',
  },
];

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, identifier, password, fullName, role, region } = body;

    // 1. LOGIN
    if (action === 'login') {
      if (!identifier || !password) {
        return NextResponse.json(
          { success: false, error: 'Please enter your username/email and password.' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Check demo accounts first
      const cleanIdent = identifier.trim().toLowerCase();
      const demoMatch = DEMO_ACCOUNTS.find(
        (d) =>
          (d.identifier.toLowerCase() === cleanIdent ||
            (d as any).aliases?.some((a: string) => a.toLowerCase() === cleanIdent)) &&
          d.password === password
      );

      if (demoMatch) {
        // Ensure demo user is persisted in database if reachable
        if (prisma) {
          try {
            await prisma.user.upsert({
              where: { identifier: demoMatch.identifier },
              update: {},
              create: {
                id: demoMatch.id,
                fullName: demoMatch.fullName,
                identifier: demoMatch.identifier,
                password: demoMatch.password,
                role: demoMatch.role,
                region: demoMatch.region,
              },
            });
          } catch {
            // Graceful fallback if DB is busy or migrating
          }
        }

        return NextResponse.json(
          {
            success: true,
            user: {
              id: demoMatch.id,
              fullName: demoMatch.fullName,
              identifier: demoMatch.identifier,
              role: demoMatch.role,
              region: demoMatch.region,
            },
          },
          { headers: corsHeaders }
        );
      }

      // Check database
      if (prisma) {
        try {
          const user = await prisma.user.findUnique({
            where: { identifier: cleanIdent },
          });

          if (user) {
            if (user.password !== password) {
              return NextResponse.json(
                { success: false, error: 'Invalid identifier or password. Please try again.' },
                { status: 401, headers: corsHeaders }
              );
            }

            return NextResponse.json(
              {
                success: true,
                user: {
                  id: user.id,
                  fullName: user.fullName,
                  identifier: user.identifier,
                  role: user.role,
                  region: user.region,
                },
              },
              { headers: corsHeaders }
            );
          }
        } catch (dbErr) {
          console.warn('Database query warning:', dbErr);
        }
      }

      // If user not found in demo or database
      return NextResponse.json(
        { success: false, error: 'Invalid identifier or password. Please check credentials or use demo accounts.' },
        { status: 401, headers: corsHeaders }
      );
    }

    // 2. SIGN UP
    if (action === 'signup') {
      if (!fullName || !identifier || !password) {
        return NextResponse.json(
          { success: false, error: 'Please fill in all required fields.' },
          { status: 400, headers: corsHeaders }
        );
      }

      // Disallow public patient self-registration: patients must be registered under a caregiver
      if (role === 'PATIENT') {
        return NextResponse.json(
          {
            success: false,
            error:
              'Patients cannot register directly. Please register as a Caregiver or ASHA worker, then add your patient securely from within the Caregiver Dashboard.',
          },
          { status: 400, headers: corsHeaders }
        );
      }

      const cleanIdentifier = identifier.trim().toLowerCase();
      const userRole = role === 'DOCTOR' ? 'DOCTOR' : 'CAREGIVER';
      const userRegion = region?.trim() || 'Assam, North Eastern Region';

      if (prisma) {
        try {
          const existing = await prisma.user.findUnique({
            where: { identifier: cleanIdentifier },
          });

          if (existing) {
            return NextResponse.json(
              { success: false, error: 'An account with this phone/email already exists.' },
              { status: 409, headers: corsHeaders }
            );
          }

          const newUser = await prisma.user.create({
            data: {
              fullName: fullName.trim(),
              identifier: cleanIdentifier,
              password,
              role: userRole,
              region: userRegion,
            },
          });

          return NextResponse.json(
            {
              success: true,
              user: {
                id: newUser.id,
                fullName: newUser.fullName,
                identifier: newUser.identifier,
                role: newUser.role,
                region: newUser.region,
              },
            },
            { headers: corsHeaders }
          );
        } catch (err: unknown) {
          console.warn('Signup database error, falling back to local session:', err);
        }
      }

      // Fallback if DB is not configured
      return NextResponse.json(
        {
          success: true,
          user: {
            id: `usr-${Date.now()}`,
            fullName: fullName.trim(),
            identifier: cleanIdentifier,
            role: userRole,
            region: userRegion,
          },
        },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400, headers: corsHeaders });
  } catch (error: unknown) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
