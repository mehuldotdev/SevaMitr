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
        recommendation: 'Awaiting baseline cognitive sessions. Play an assessment on Patient Home to begin profiling.',
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
    const normGameId = (s.gameId || '').toLowerCase().replace(/-/g, '_');
    if (byGame[normGameId]) {
      byGame[normGameId].push(Math.max(0, Math.min(100, s.score)));
    }
    totalLatency += (s.hesitationMs || 1500);

    // Diurnal classification: Morning (8 AM - 3 PM / 08:00 - 15:59) vs Evening (4 PM - 11 PM / 16:00 - 23:59)
    const sessionHour = s.timestamp ? new Date(s.timestamp).getHours() : -1;
    const isMorning =
      (sessionHour >= 8 && sessionHour < 16) ||
      (sessionHour === -1 && s.timeOfDay === 'morning');
    const isEvening =
      (sessionHour >= 16 && sessionHour <= 23) ||
      (sessionHour >= 0 && sessionHour < 8) ||
      (sessionHour === -1 && (s.timeOfDay === 'evening' || s.timeOfDay === 'night' || s.timeOfDay === 'afternoon'));

    if (isMorning) {
      morningSessions.push(s);
    }
    if (isEvening) {
      eveningSessions.push(s);
    }
  });

  const getAvg = (arr: number[]) =>
    arr.length > 0 ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : null;

  // Clinically map traditional and 6 platform speed trial games to domains
  const memScores = [
    ...byGame.smriti_setu,
    ...byGame.doharani,
    ...byGame.target_tracker,
    ...byGame.speed_maze,
    ...byGame.double_decision,
  ];
  const execScores = [
    ...byGame.speed_maze,
    ...byGame.doharani,
    ...byGame.bikhama_khoj,
  ];
  const attScores = [
    ...byGame.rang_tanti,
    ...byGame.target_tracker,
    ...byGame.bijuli_tap,
    ...byGame.double_decision,
  ];
  const audScores = [
    ...byGame.shabda_tarang,
    ...byGame.sound_sweeps,
  ];
  const mathScores = [
    ...byGame.bazaar_saathi,
    ...byGame.double_decision,
    ...byGame.bikhama_khoj,
  ];

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

  // Dynamic baseline fallback: if a specific domain is not yet played, calibrate to overall score
  // so the radar chart remains clinically informative rather than collapsing to 0
  const baselineEstimate = overallDci > 0 ? overallDci : 75;

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
        'Sundowning pattern detected: significant reaction latency divergence and score decrease in evening window. Schedule critical cognitive activities before 15:00 (3 PM).';
    }
  } else if (morningSessions.length > 0 && eveningSessions.length === 0) {
    recommendation =
      'Morning baseline established. Play an assessment in the evening window (4 PM - 11 PM) to profile circadian stability.';
  } else if (eveningSessions.length > 0 && morningSessions.length === 0) {
    recommendation =
      'Evening baseline recorded. Play a morning assessment (8 AM - 3 PM) to complete circadian comparison.';
  } else {
    recommendation =
      'Circadian rhythm baseline pending. Requires both morning (8 AM - 3 PM) and evening (4 PM - 11 PM) game sessions.';
  }

  // Motor Hesitation
  const avgLatency = Math.round(totalLatency / (sessions.length || 1));
  const hesitationScore = Math.min(10, Math.max(1, Math.round((avgLatency / 400) * 10) / 10));
  const motorStatus =
    hesitationScore > 6.5 ? 'high_hesitation' : hesitationScore > 4.0 ? 'moderate' : 'fluid';

  return {
    overallDci,
    sessionsCount: sessions.length,
    domainScores: {
      memory: Math.max(0, Math.min(100, memAvg ?? baselineEstimate)),
      executive: Math.max(0, Math.min(100, execAvg ?? baselineEstimate)),
      attention: Math.max(0, Math.min(100, attAvg ?? baselineEstimate)),
      auditory: Math.max(0, Math.min(100, audAvg ?? baselineEstimate)),
      math: Math.max(0, Math.min(100, mathAvg ?? baselineEstimate)),
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
