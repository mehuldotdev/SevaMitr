import { NextResponse } from 'next/server';
import { analyzePatientCognitiveData } from '@/lib/ai/sundowningDetector';
import { offlineDb } from '@/lib/db/offlineDb';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const patientId = searchParams.get('patientId') || 'patient-ner-001';

  // In production, query Prisma. For offline and edge resilience, calculate from session data
  const sessions = offlineDb.getSessions();
  const analysis = analyzePatientCognitiveData(sessions);

  return NextResponse.json({
    patientId,
    timestamp: Date.now(),
    analysis,
    totalSessionsRecorded: sessions.length,
    lastActivity: sessions[0]?.timestamp || Date.now(),
  });
}
