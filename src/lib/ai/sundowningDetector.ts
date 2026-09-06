import { CognitiveSessionRecord } from '../db/offlineDb';

export interface CognitiveAnalysisResult {
  overallDci: number | null; // Dynamic Cognitive Index (0 - 100), null if no sessions
  sessionsCount: number;
  domainScores: {
    memory: number;       // Smriti Setu
    executive: number;    // Doharani
    attention: number;    // Rang & Tanti
    auditory: number;     // Shabda Tarang
    math: number;         // Bazaar Saathi
  };
  sundowning: {
    detected: boolean;
    hasEnoughData: boolean;
    morningAvgLatencyMs: number;
    eveningAvgLatencyMs: number;
    morningAvgScore: number;
    eveningAvgScore: number;
    latencyDivergencePct: number;
    recommendation: string;
  };
  motorHesitation: {
    avgLatencyMs: number;
    tremorHesitationScore: number; // 0 (fluid) to 10 (high hesitation)
    status: 'fluid' | 'moderate' | 'high_hesitation' | 'pending';
  };
}

export function analyzePatientCognitiveData(sessions: CognitiveSessionRecord[]): CognitiveAnalysisResult {
  if (!sessions || sessions.length === 0) {
    return {
      overallDci: null,
      sessionsCount: 0,
      domainScores: { memory: 0, executive: 0, attention: 0, auditory: 0, math: 0 },
      sundowning: {
        detected: false,
        hasEnoughData: false,
        morningAvgLatencyMs: 0,
        eveningAvgLatencyMs: 0,
        morningAvgScore: 0,
        eveningAvgScore: 0,
        latencyDivergencePct: 0,
        recommendation: 'Awaiting baseline cognitive sessions. Play an assessment on the Patient Kiosk to begin profiling.',
      },
      motorHesitation: {
        avgLatencyMs: 0,
        tremorHesitationScore: 0,
        status: 'pending',
      },
    };
  }

  // Split sessions by domain
  const byGame: Record<string, number[]> = {
    smriti_setu: [],
    doharani: [],
    rang_tanti: [],
    shabda_tarang: [],
    bazaar_saathi: [],
    double_decision: [],
    sound_sweeps: [],
    target_tracker: [],
    speed_maze: [],
    bijuli_tap: [],
    bikhama_khoj: [],
  };

  const morningSessions: CognitiveSessionRecord[] = [];
  const eveningSessions: CognitiveSessionRecord[] = [];
  let totalLatency = 0;

  sessions.forEach((s) => {
    if (byGame[s.gameId]) {
      byGame[s.gameId].push(Math.max(0, Math.min(100, s.score)));
    }
    totalLatency += s.hesitationMs;

    if (s.timeOfDay === 'morning') {
      morningSessions.push(s);
    } else if (s.timeOfDay === 'evening' || s.timeOfDay === 'night') {
      eveningSessions.push(s);
    }
  });

  const getAvg = (arr: number[]) =>
    arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

  // Clinically map traditional and speed trial games to domains
  const memScores = [...byGame.smriti_setu, ...byGame.doharani];
  const execScores = [...byGame.speed_maze, ...byGame.doharani];
  const attScores = [...byGame.rang_tanti, ...byGame.target_tracker, ...byGame.bijuli_tap];
  const audScores = [...byGame.shabda_tarang, ...byGame.sound_sweeps];
  const mathScores = [...byGame.bazaar_saathi, ...byGame.double_decision, ...byGame.bikhama_khoj];

  const memAvg = getAvg(memScores);
  const execAvg = getAvg(execScores);
  const attAvg = getAvg(attScores);
  const audAvg = getAvg(audScores);
  const mathAvg = getAvg(mathScores);

  const availableScores = [memAvg, execAvg, attAvg, audAvg, mathAvg].filter(
    (s): s is number => s !== null
  );

  const rawDci =
    availableScores.length > 0
      ? Math.round(availableScores.reduce((a, b) => a + b, 0) / availableScores.length)
      : Math.round(sessions.reduce((acc, s) => acc + Math.max(0, Math.min(100, s.score)), 0) / sessions.length);

  const overallDci = Math.max(0, Math.min(100, rawDci));

  // Sundowning calculation: requires both morning and evening data
  const hasEnoughData = morningSessions.length > 0 && eveningSessions.length > 0;

  const mLat =
    morningSessions.length > 0
      ? Math.round(morningSessions.reduce((acc, s) => acc + s.hesitationMs, 0) / morningSessions.length)
      : 0;
  const eLat =
    eveningSessions.length > 0
      ? Math.round(eveningSessions.reduce((acc, s) => acc + s.hesitationMs, 0) / eveningSessions.length)
      : 0;

  const mScore =
    morningSessions.length > 0
      ? Math.round(morningSessions.reduce((acc, s) => acc + s.score, 0) / morningSessions.length)
      : 0;
  const eScore =
    eveningSessions.length > 0
      ? Math.round(eveningSessions.reduce((acc, s) => acc + s.score, 0) / eveningSessions.length)
      : 0;

  let latencyDivergencePct = 0;
  let sundowningDetected = false;
  let recommendation = 'Cognitive performance is consistent between morning and evening.';

  if (hasEnoughData && mLat > 0) {
    latencyDivergencePct = Math.round(((eLat - mLat) / mLat) * 100);
    sundowningDetected = latencyDivergencePct > 35 || (mScore - eScore) > 15;

    if (sundowningDetected) {
      recommendation =
        'Noticeable evening cognitive fatigue detected. Reduce sensory clutter after 5:00 PM, maintain soft warm lighting, and serve calming warm tea before evening games.';
    }
  } else if (!hasEnoughData) {
    recommendation =
      'Circadian rhythm baseline pending. Requires both morning (08:00 - 12:00) and evening (17:00 - 20:00) game sessions.';
  }

  // Motor Hesitation
  const avgLatency = Math.round(totalLatency / sessions.length);
  const hesitationScore = Math.min(10, Math.max(1, Math.round((avgLatency / 400) * 10) / 10));
  const motorStatus =
    hesitationScore > 6.5 ? 'high_hesitation' : hesitationScore > 4.0 ? 'moderate' : 'fluid';

  return {
    overallDci,
    sessionsCount: sessions.length,
    domainScores: {
      memory: Math.max(0, Math.min(100, memAvg ?? 0)),
      executive: Math.max(0, Math.min(100, execAvg ?? 0)),
      attention: Math.max(0, Math.min(100, attAvg ?? 0)),
      auditory: Math.max(0, Math.min(100, audAvg ?? 0)),
      math: Math.max(0, Math.min(100, mathAvg ?? 0)),
    },
    sundowning: {
      detected: sundowningDetected,
      hasEnoughData,
      morningAvgLatencyMs: mLat,
      eveningAvgLatencyMs: eLat,
      morningAvgScore: mScore,
      eveningAvgScore: eScore,
      latencyDivergencePct,
      recommendation,
    },
    motorHesitation: {
      avgLatencyMs: avgLatency,
      tremorHesitationScore: hesitationScore,
      status: motorStatus,
    },
  };
}
