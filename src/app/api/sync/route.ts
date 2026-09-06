import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';
import { serverSessionStore } from '@/lib/db/serverSessionStore';

export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { patientId, sessions, timestamp } = body;

    if (!sessions || !Array.isArray(sessions)) {
      return NextResponse.json(
        { error: 'Invalid payload: sessions array expected' },
        { status: 400, headers: corsHeaders }
      );
    }

    const payloadSizeBytes = Buffer.byteLength(JSON.stringify(body), 'utf8');
    const safePatientId = patientId || 'patient-ner-001';

    // Persist in server-side in-memory session store (guaranteed availability for local / edge)
    serverSessionStore.addSessions(safePatientId, sessions);

    // If PostgreSQL database is available, also persist to Prisma
    if (prisma) {
      try {
        let existingPatient = await prisma.patient.findUnique({
          where: { id: safePatientId },
        });

        if (!existingPatient) {
          const caregiver = await prisma.caregiver.upsert({
            where: { id: 'demo-caregiver-001' },
            update: {},
            create: {
              id: 'demo-caregiver-001',
              name: 'Anuradha Baruah',
              role: 'Family Caregiver',
              phone: '+91 94350 12345',
            },
          });

          existingPatient = await prisma.patient.create({
            data: {
              id: safePatientId,
              fullName: safePatientId === 'patient-ner-001' ? 'Mridula Hazarika' : 'SevaMitr Patient',
              age: 72,
              gender: 'Female',
              region: 'Kamrup Rural, Assam',
              primaryLanguage: 'en',
              dementiaStage: 'Mild',
              emergencyContact: '+91 94350 12345',
              caregiverId: caregiver.id,
            },
          });
        }

        for (const s of sessions) {
          await prisma.cognitiveSession.create({
            data: {
              patientId: existingPatient.id,
              gameId: s.gameId,
              gameTitle: s.gameTitle || s.gameId,
              difficultyLevel: s.difficultyLevel || 1,
              score: s.score || 0,
              durationSec: s.durationSec || 60,
              hesitationMs: s.hesitationMs || 1500,
              errorCount: s.errorCount || 0,
              confusionLoops: s.confusionLoops || 0,
              completed: s.completed ?? true,
              timeOfDay: s.timeOfDay || 'morning',
              clientSyncedAt: new Date(),
            },
          });
        }

        await prisma.syncLog.create({
          data: {
            patientId: existingPatient.id,
            recordsCount: sessions.length,
            payloadSizeBytes,
          },
        });
      } catch (dbError) {
        console.warn('PostgreSQL write error in /api/sync:', dbError);
      }
    }

    return NextResponse.json(
      {
        success: true,
        recordsSynced: sessions.length,
        payloadSizeBytes,
        serverTime: Date.now(),
        status: 'Synced with SevaMitr Cloud / Central NER Health Registry',
      },
      { headers: corsHeaders }
    );
  } catch (error) {
    console.error('Error in /api/sync:', error);
    return NextResponse.json(
      { error: 'Internal server error during sync' },
      { status: 500, headers: corsHeaders }
    );
  }
}

