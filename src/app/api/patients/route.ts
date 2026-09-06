import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { DEFAULT_PATIENT } from '@/lib/db/offlineDb';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const caregiverId = searchParams.get('caregiverId');

  // If no caregiverId provided, return empty array to guarantee strict privacy & isolation
  if (!caregiverId) {
    return NextResponse.json(
      { patients: [] },
      { headers: { 'Cache-Control': 'no-store, max-age=0' } }
    );
  }

  if (prisma) {
    try {
      const patients = await prisma.patient.findMany({
        where: { caregiverId },
        include: { caregiver: true, dailyMetrics: { take: 1, orderBy: { date: 'desc' } } },
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
          caregiverName: p.caregiver?.name || 'Primary Caregiver',
          caregiverPhone: p.caregiver?.phone || p.emergencyContact || '',
        }));
        return NextResponse.json(
          { patients: formattedPatients },
          {
            headers: {
              'Cache-Control': 'no-store, max-age=0',
            },
          }
        );
      }
    } catch (e) {
      console.warn('PostgreSQL fetch error, checking caregiver fallback:', e);
    }
  }

  // Only the pre-seeded demo caregiver account gets the mock patient for clinical demo.
  // Real caregivers start with strictly zero patients until registered.
  if (caregiverId === 'demo-caregiver-001') {
    return NextResponse.json(
      { patients: [DEFAULT_PATIENT] },
      {
        headers: {
          'Cache-Control': 'no-store, max-age=0',
        },
      }
    );
  }

  return NextResponse.json(
    { patients: [] },
    {
      headers: {
        'Cache-Control': 'no-store, max-age=0',
      },
    }
  );
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
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
        { status: 400 }
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

        // Create the Patient linked directly to Caregiver
        const createdPatient = await prisma.patient.create({
          data: {
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

        return NextResponse.json({
          success: true,
          patient: {
            id: createdPatient.id,
            fullName: createdPatient.fullName,
            age: createdPatient.age,
            gender: createdPatient.gender,
            region: createdPatient.region,
            primaryLanguage: createdPatient.primaryLanguage,
            dementiaStage: createdPatient.dementiaStage,
            emergencyContact: createdPatient.emergencyContact,
            caregiverName: safeCaregiverName,
            caregiverPhone: safeCaregiverPhone,
          },
        });
      } catch (dbErr) {
        console.warn('Prisma patient creation failed, falling back to client-safe response:', dbErr);
      }
    }

    // Fallback: Client-side offline-first registration
    const fallbackPatient = {
      id: `patient-reg-${Date.now()}`,
      fullName: fullName.trim(),
      age: parsedAge,
      gender: safeGender,
      region: safeRegion,
      primaryLanguage: safeLang,
      dementiaStage: safeStage,
      emergencyContact: safeEmergency,
      caregiverName: safeCaregiverName,
      caregiverPhone: safeCaregiverPhone,
    };

    return NextResponse.json({
      success: true,
      patient: fallbackPatient,
    });
  } catch (error: unknown) {
    console.error('Error in POST /api/patients:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error while registering patient.' },
      { status: 500 }
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

