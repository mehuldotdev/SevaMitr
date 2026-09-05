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
  };

  const morningSessions: CognitiveSessionRecord[] = [];
  const eveningSessions: CognitiveSessionRecord[] = [];
  let totalLatency = 0;

  sessions.forEach((s) => {
    if (byGame[s.gameId]) {
      byGame[s.gameId].push(s.score);
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

  const memAvg = getAvg(byGame.smriti_setu);
  const execAvg = getAvg(byGame.doharani);
  const attAvg = getAvg(byGame.rang_tanti) ?? getAvg(byGame.target_tracker);
  const audAvg = getAvg(byGame.shabda_tarang) ?? getAvg(byGame.sound_sweeps);
  const mathAvg = getAvg(byGame.bazaar_saathi) ?? getAvg(byGame.double_decision);

  const availableScores = [memAvg, execAvg, attAvg, audAvg, mathAvg].filter(
    (s): s is number => s !== null
  );

  const overallDci =
    availableScores.length > 0
      ? Math.round(availableScores.reduce((a, b) => a + b, 0) / availableScores.length)
      : Math.round(sessions.reduce((acc, s) => acc + s.score, 0) / sessions.length);

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
      memory: memAvg ?? 0,
      executive: execAvg ?? 0,
      attention: attAvg ?? 0,
      auditory: audAvg ?? 0,
      math: mathAvg ?? 0,
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
