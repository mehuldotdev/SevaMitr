import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db/client';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const patientId = params.id;

  if (!patientId) {
    return NextResponse.json({ error: 'Patient ID is required' }, { status: 400 });
  }

  if (prisma) {
    try {
      const sessions = await prisma.cognitiveSession.findMany({
        where: { patientId },
        orderBy: { createdAt: 'desc' },
      });

      return NextResponse.json(
        { sessions },
        {
          headers: {
            'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=86400',
          },
        }
      );
    } catch (e) {
      console.warn('PostgreSQL fetch error for patient sessions:', e);
    }
  }

  return NextResponse.json(
    { sessions: [] },
    {
      headers: {
        'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=86400',
      },
    }
  );
}
