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

  if (!patientId) {
    return NextResponse.json(
      { error: 'Patient ID is required' },
      { status: 400, headers: corsHeaders }
    );
  }

  let sessions: any[] = [];

  if (prisma) {
    try {
      const dbSessions = await prisma.cognitiveSession.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
      });
      if (dbSessions && dbSessions.length > 0) {
        sessions = dbSessions;
      }
    } catch (e) {
      console.warn('PostgreSQL fetch error for patient sessions:', e);
    }
  }

  if (sessions.length === 0) {
    sessions = serverSessionStore.getSessions(patientId);
  }

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

