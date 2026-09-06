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

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const patientId = params.id;
  const { searchParams } = new URL(request.url);
  const caregiverId = searchParams.get('caregiverId');

  if (!patientId) {
    return NextResponse.json(
      { error: 'Patient ID is required' },
      { status: 400, headers: corsHeaders }
    );
  }

  let rawSessions: any[] = [];

  if (prisma) {
    try {
      if (patientId === 'all' && caregiverId) {
        rawSessions = await prisma.cognitiveSession.findMany({
          where: {
            patient: {
              OR: [
                { caregiverId },
                { caregiver: { id: caregiverId } },
                { caregiver: { phone: { contains: caregiverId.replace(/[^0-9]/g, '') } } },
              ],
            },
          },
          orderBy: { createdAt: 'desc' },
        });
      } else {
        rawSessions = await prisma.cognitiveSession.findMany({
          where: { patientId },
          orderBy: { createdAt: 'desc' },
        });
      }
    } catch (e) {
      console.warn('PostgreSQL fetch error for patient sessions:', e);
    }
  }

  if (rawSessions.length === 0) {
    rawSessions = serverSessionStore.getSessions(patientId);
  }

  const sessions = rawSessions.map((s: any) => ({
    id: s.id,
    patientId: s.patientId,
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
    timestamp: s.timestamp
      ? Number(s.timestamp)
      : s.clientSyncedAt
      ? new Date(s.clientSyncedAt).getTime()
      : s.createdAt
      ? new Date(s.createdAt).getTime()
      : Date.now(),
    synced: true,
    clientSyncedAt: s.clientSyncedAt,
    createdAt: s.createdAt,
  }));

  return NextResponse.json(
    { sessions },
    {
      headers: {
        ...corsHeaders,
        'Cache-Control': 'no-store, no-cache, must-revalidate, max-age=0',
      },
    }
  );
}

