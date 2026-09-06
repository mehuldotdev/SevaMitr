import { NextResponse } from 'next/server';
import { analyzePatientCognitiveData } from '@/lib/ai/sundowningDetector';
import { offlineDb, CognitiveSessionRecord } from '@/lib/db/offlineDb';
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

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId') || 'patient-ner-001';

  let sessions: CognitiveSessionRecord[] = [];

  // 1. Try Prisma PostgreSQL if connected
  if (prisma) {
    try {
      const dbSessions = await prisma.cognitiveSession.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
      });
      if (dbSessions && dbSessions.length > 0) {
        sessions = dbSessions.map((s) => ({
          id: s.id,
          patientId: s.patientId,
          gameId: s.gameId,
          gameTitle: s.gameTitle,
          difficultyLevel: s.difficultyLevel,
          score: s.score,
          durationSec: s.durationSec,
          hesitationMs: s.hesitationMs,
          errorCount: s.errorCount,
          confusionLoops: s.confusionLoops,
          completed: s.completed,
          timeOfDay: (s.timeOfDay as 'morning' | 'afternoon' | 'evening' | 'night') || 'morning',
          timestamp: s.createdAt.getTime(),
          synced: true,
        }));
      }
    } catch (e) {
      console.warn('Prisma fetch in /api/analytics warning:', e);
    }
  }

  // 2. Try server-side in-memory session store (populated by /api/sync)
  if (sessions.length === 0) {
    const srvSessions = serverSessionStore.getSessions(patientId);
    if (srvSessions.length > 0) {
      sessions = srvSessions;
    }
  }

  // 3. Fallback to offlineDb default sessions
  if (sessions.length === 0) {
    sessions = offlineDb.getSessions(patientId);
  }

  const analysis = analyzePatientCognitiveData(sessions);

  return NextResponse.json(
    {
      patientId,
      timestamp: Date.now(),
      analysis,
      totalSessionsRecorded: sessions.length,
      lastActivity: sessions[0]?.timestamp || Date.now(),
    },
    { headers: corsHeaders }
  );
}

