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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, identifier, password, fullName, role, region } = body;

    // 1. LOGIN
    if (action === 'login') {
      if (!identifier || !password) {
        return NextResponse.json(
          { success: false, error: 'Please enter your username/email and password.' },
          { status: 400 }
        );
      }

      // Check demo accounts first
      const demoMatch = DEMO_ACCOUNTS.find(
        (d) =>
          d.identifier.toLowerCase() === identifier.toLowerCase() &&
          d.password === password
      );

      if (demoMatch) {
        // Ensure demo user is persisted in SQLite if database is reachable
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
          // Graceful fallback if SQLite is busy
        }

        return NextResponse.json({
          success: true,
          user: {
            id: demoMatch.id,
            fullName: demoMatch.fullName,
            identifier: demoMatch.identifier,
            role: demoMatch.role,
            region: demoMatch.region,
          },
        });
      }

      // Check SQLite database
      try {
        const user = await prisma.user.findUnique({
          where: { identifier: identifier.trim().toLowerCase() },
        });

        if (!user || user.password !== password) {
          return NextResponse.json(
            { success: false, error: 'Invalid identifier or password. Please try again.' },
            { status: 401 }
          );
        }

        return NextResponse.json({
          success: true,
          user: {
            id: user.id,
            fullName: user.fullName,
            identifier: user.identifier,
            role: user.role,
            region: user.region,
          },
        });
      } catch (dbErr) {
        console.error('Database query error:', dbErr);
        return NextResponse.json(
          { success: false, error: 'Database connection issue. Please try demo accounts.' },
          { status: 500 }
        );
      }
    }

    // 2. SIGN UP
    if (action === 'signup') {
      if (!fullName || !identifier || !password) {
        return NextResponse.json(
          { success: false, error: 'Please fill in all required fields.' },
          { status: 400 }
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
          { status: 400 }
        );
      }

      const cleanIdentifier = identifier.trim().toLowerCase();
      const userRole = role === 'DOCTOR' ? 'DOCTOR' : 'CAREGIVER';
      const userRegion = region?.trim() || 'Assam, North Eastern Region';

      try {
        // Check if identifier already exists
        const existing = await prisma.user.findUnique({
          where: { identifier: cleanIdentifier },
        });

        if (existing) {
          return NextResponse.json(
            { success: false, error: 'An account with this phone/email already exists.' },
            { status: 409 }
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

        return NextResponse.json({
          success: true,
          user: {
            id: newUser.id,
            fullName: newUser.fullName,
            identifier: newUser.identifier,
            role: newUser.role,
            region: newUser.region,
          },
        });
      } catch (err: unknown) {
        console.error('Signup error:', err);
        return NextResponse.json(
          { success: false, error: 'Failed to create user. Please try again.' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ success: false, error: 'Invalid action' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Auth API error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
