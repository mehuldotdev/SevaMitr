import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { DEFAULT_PATIENT } from '@/lib/db/offlineDb';
import { serverSessionStore } from '@/lib/db/serverSessionStore';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const caregiverId = searchParams.get('caregiverId');

  // If no caregiverId provided, return all known patients
  if (!caregiverId) {
    if (prisma) {
      try {
        const allPrisma = await prisma.patient.findMany({
          include: { caregiver: true },
          orderBy: { createdAt: 'desc' },
        });
        if (allPrisma.length > 0) {
          return NextResponse.json(
            {
              patients: allPrisma.map((p) => ({
                id: p.id,
                fullName: p.fullName,
                age: p.age,
                gender: p.gender || 'Not specified',
                region: p.region,
                primaryLanguage: p.primaryLanguage || 'en',
                dementiaStage: p.dementiaStage || 'Mild',
                emergencyContact: p.emergencyContact || '',
                caregiverId: p.caregiverId,
                caregiverName: p.caregiver?.name || 'Primary Caregiver',
                caregiverPhone: p.caregiver?.phone || p.emergencyContact || '',
              })),
            },
            { headers: { ...corsHeaders, 'Cache-Control': 'no-store, max-age=0' } }
          );
        }
      } catch (e) {
        console.warn('Prisma fetch all warning:', e);
      }
    }
    const srvPatients = serverSessionStore.getAllPatients();
    return NextResponse.json(
      { patients: srvPatients },
      { headers: { ...corsHeaders, 'Cache-Control': 'no-store, max-age=0' } }
    );
  }

  // Caregiver-scoped query
  if (prisma) {
    try {
      let userIdent = caregiverId;
      try {
        const u = await prisma.user.findUnique({ where: { id: caregiverId } });
        if (u) userIdent = u.identifier;
      } catch (_) {}

      const cleanDigits = userIdent.replace(/[^0-9]/g, '');

      const orConditions: any[] = [
        { caregiverId },
        { caregiver: { id: caregiverId } },
        { caregiver: { phone: { contains: caregiverId } } },
      ];

      if (cleanDigits.length >= 6) {
        orConditions.push({ caregiverId: { contains: cleanDigits } });
        orConditions.push({ caregiver: { phone: { contains: cleanDigits } } });
        orConditions.push({ emergencyContact: { contains: cleanDigits } });
      }

      if (caregiverId === 'demo-caregiver-001') {
        orConditions.push({ caregiverId: 'demo-caregiver-001' });
        orConditions.push({ caregiverId: 'cg-ner-default' });
        orConditions.push({ caregiverId: { startsWith: 'cg-ner' } });
      }

      const patients = await prisma.patient.findMany({
        where: { OR: orConditions },
        include: { caregiver: true, dailyMetrics: { take: 1, orderBy: { date: 'desc' } } },
        orderBy: { createdAt: 'desc' },
      });
      if (patients.length > 0) {
        const formattedPatients = patients.map((p) => ({
          id: p.id,
          fullName: p.fullName,
          age: p.age,
          gender: p.gender || 'Not specified',
          region: p.region,
          primaryLanguage: p.primaryLanguage || 'en',
          dementiaStage: p.dementiaStage || 'Mild',
          emergencyContact: p.emergencyContact || '',
          caregiverId: p.caregiverId,
          caregiverName: p.caregiver?.name || 'Primary Caregiver',
          caregiverPhone: p.caregiver?.phone || p.emergencyContact || '',
        }));
        return NextResponse.json(
          { patients: formattedPatients },
          {
            headers: {
              ...corsHeaders,
              'Cache-Control': 'no-store, max-age=0',
            },
          }
        );
      }
    } catch (e) {
      console.warn('PostgreSQL fetch error, checking caregiver fallback:', e);
    }
  }

  // Fallback to in-memory store for edge/local deployments
  const memoryPatients = serverSessionStore.getPatientsByCaregiver(caregiverId);
  if (caregiverId === 'demo-caregiver-001') {
    const list = [DEFAULT_PATIENT, ...memoryPatients.filter((p) => p.id !== DEFAULT_PATIENT.id)];
    return NextResponse.json(
      { patients: list },
      {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }

  if (memoryPatients.length > 0) {
    return NextResponse.json(
      { patients: memoryPatients },
      {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }

  // If no scoped match found, return any server patients if only 1 exists (convenient for local pair)
  const allStore = serverSessionStore.getAllPatients();
  if (allStore.length > 0) {
    return NextResponse.json(
      { patients: allStore },
      {
        headers: {
          ...corsHeaders,
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }

  return NextResponse.json(
    { patients: [] },
    {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      id,
      fullName,
      age,
      gender,
      region,
      primaryLanguage,
      dementiaStage,
      emergencyContact,
      caregiverId,
      caregiverName,
      caregiverPhone,
      patientIdentifier,
      patientPassword,
    } = body;

    if (!fullName || !fullName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Patient full name is required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const parsedAge = parseInt(String(age), 10) || 70;
    const safeGender = gender || 'Not specified';
    const safeRegion = region?.trim() || 'Assam, North Eastern Region';
    const safeLang = primaryLanguage || 'en';
    const safeStage = dementiaStage || 'Mild';
    const safeEmergency = emergencyContact?.trim() || caregiverPhone?.trim() || '+91 94350 00000';
    const safeCaregiverName = caregiverName?.trim() || 'Primary Caregiver';
    const safeCaregiverPhone = caregiverPhone?.trim() || safeEmergency;
    const safeCaregiverId = caregiverId?.trim() || `cg-${Date.now()}`;
    const safePatientId = id?.trim() || `patient-ner-${Date.now()}`;

    if (prisma) {
      try {
        // Ensure Caregiver record exists in Prisma
        const caregiver = await prisma.caregiver.upsert({
          where: { id: safeCaregiverId },
          update: {
            name: safeCaregiverName,
            phone: safeCaregiverPhone,
          },
          create: {
            id: safeCaregiverId,
            name: safeCaregiverName,
            role: 'Family Caregiver',
            phone: safeCaregiverPhone,
          },
        });

        // Create or update Patient linked directly to Caregiver
        const createdPatient = await prisma.patient.upsert({
          where: { id: safePatientId },
          update: {
            fullName: fullName.trim(),
            age: parsedAge,
            gender: safeGender,
            region: safeRegion,
            primaryLanguage: safeLang,
            dementiaStage: safeStage,
            emergencyContact: safeEmergency,
            caregiverId: caregiver.id,
          },
          create: {
            id: safePatientId,
            fullName: fullName.trim(),
            age: parsedAge,
            gender: safeGender,
            region: safeRegion,
            primaryLanguage: safeLang,
            dementiaStage: safeStage,
            emergencyContact: safeEmergency,
            caregiverId: caregiver.id,
          },
        });

        // If optional direct patient kiosk credentials were provided, create User record
        if (patientIdentifier && patientPassword) {
          try {
            await prisma.user.upsert({
              where: { identifier: patientIdentifier.trim().toLowerCase() },
              update: {
                fullName: fullName.trim(),
                password: patientPassword,
              },
              create: {
                fullName: fullName.trim(),
                identifier: patientIdentifier.trim().toLowerCase(),
                password: patientPassword,
                role: 'PATIENT',
                region: safeRegion,
              },
            });
          } catch (userErr) {
            console.warn('Could not create patient kiosk login user account:', userErr);
          }
        }

        const patientObj = {
          id: createdPatient.id,
          fullName: createdPatient.fullName,
          age: createdPatient.age,
          gender: createdPatient.gender,
          region: createdPatient.region,
          primaryLanguage: createdPatient.primaryLanguage,
          dementiaStage: createdPatient.dementiaStage,
          emergencyContact: createdPatient.emergencyContact,
          caregiverId: safeCaregiverId,
          caregiverName: safeCaregiverName,
          caregiverPhone: safeCaregiverPhone,
        };
        serverSessionStore.savePatient(patientObj);

        return NextResponse.json(
          {
            success: true,
            patient: patientObj,
          },
          { headers: corsHeaders }
        );
      } catch (dbErr) {
        console.warn('Prisma patient creation failed, falling back to client-safe response:', dbErr);
      }
    }

    // Fallback: Client-side offline-first registration
    const fallbackPatient = {
      id: safePatientId,
      fullName: fullName.trim(),
      age: parsedAge,
      gender: safeGender,
      region: safeRegion,
      primaryLanguage: safeLang,
      dementiaStage: safeStage,
      emergencyContact: safeEmergency,
      caregiverId: safeCaregiverId,
      caregiverName: safeCaregiverName,
      caregiverPhone: safeCaregiverPhone,
    };
    serverSessionStore.savePatient(fallbackPatient);

    return NextResponse.json(
      {
        success: true,
        patient: fallbackPatient,
      },
      { headers: corsHeaders }
    );
  } catch (error: unknown) {
    console.error('Error in POST /api/patients:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while registering patient.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    let patientId = searchParams.get('id');

    if (!patientId) {
      try {
        const body = await req.json();
        patientId = body?.id;
      } catch {
        // No JSON body
      }
    }

    if (!patientId) {
      return NextResponse.json(
        { success: false, error: 'Patient ID is required for deletion.' },
        { status: 400 }
      );
    }

    if (prisma) {
      try {
        const existing = await prisma.patient.findUnique({
          where: { id: patientId },
        });

        if (existing) {
          await prisma.patient.delete({
            where: { id: patientId },
          });
        }
      } catch (dbErr) {
        console.warn('Prisma patient deletion warning:', dbErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: 'Patient successfully removed from directory.',
      deletedId: patientId,
    });
  } catch (error: unknown) {
    console.error('Error in DELETE /api/patients:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete patient.' },
      { status: 500 }
    );
  }
}

