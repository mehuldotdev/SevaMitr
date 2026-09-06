export interface RecommendedGame {
  id: string;
  title: string;
  domain: string;
  frequency: string;
  clinicalRationale: string;
  priority: 'HIGH' | 'MEDIUM' | 'MAINTENANCE';
}

export interface DoctorReportData {
  triageStatus: 'LOW_RISK' | 'BORDERLINE_MCI' | 'HIGH_IMPAIRMENT' | 'PENDING';
  triageLabel: string;
  dciScore: number;
  aiPowered: boolean;
  modelUsed?: string;
  generatedAt: string;
  isPreliminary?: boolean;
  hasRecordedData?: boolean;
  sbar: {
    situation: string;
    background: string;
    assessment: string;
    recommendation: string;
  };
  domainBreakdown: {
    visualSpeed: { latencyMs: number; status: string; interpretation: string };
    auditoryDiscrimination: { latencyMs: number; status: string; interpretation: string };
    dividedAttention: { accuracyPct: number; status: string; interpretation: string };
    motorHesitation: { latencyMs: number; status: string; interpretation: string };
  };
  recommendedGames: RecommendedGame[];
  doctorDiscussionPrompts: string[];
  caregiverHomeSlip: string;
}

export interface PatientContext {
  id?: string;
  fullName: string;
  age: number;
  gender?: string;
  region?: string;
  dementiaStage?: string;
  caregiverName?: string;
  primaryLanguage?: string;
}

export interface TelemetryData {
  sightSpeedMs?: number;
  soundSweepsMs?: number;
  targetTrackerScore?: number;
  hesitationMs?: number;
  sessionsCount?: number;
  sundowningDivergencePct?: number;
}

export function computeDeterministicReport(
  patient: PatientContext,
  telemetry: TelemetryData = {},
  language: string = 'en',
  isPreliminary: boolean = false
): DoctorReportData {
  const patientName = patient.fullName || 'Patient';
  const hasRecordedData =
    (telemetry.sessionsCount !== undefined && telemetry.sessionsCount > 0) ||
    telemetry.sightSpeedMs !== undefined ||
    telemetry.soundSweepsMs !== undefined ||
    telemetry.targetTrackerScore !== undefined ||
    telemetry.hesitationMs !== undefined;

  // Case 1: No assessments completed yet for this patient
  if (!hasRecordedData) {
    const caregiverHomeSlip =
      language === 'as'
        ? `${patientName}ৰ প্ৰাৰম্ভিক পঞ্জীয়ন সম্পন্ন হৈছে। মূল্যায়নৰ বাবে অনুগ্ৰহ কৰি পেচেণ্ট কিঅ’স্কত নিৰ্ধাৰিত খেলসমূহ খেলি মূল্যায়ন সমাপ্ত কৰক।`
        : language === 'bn'
        ? `${patientName}-র প্রাথমিক নিবন্ধন সম্পন্ন হয়েছে। মূল্যায়নের জন্য অনুগ্রহ করে পেশেন্ট কিয়স্কে নির্ধারিত খেলাগুলো খেলে মূল্যায়ন সম্পন্ন করুন।`
        : language === 'hi'
        ? `${patientName} जी का प्रारंभिक पंजीकरण हो गया है। क्लिनिकल मूल्यांकन के लिए कृपया पेशेंट कियोस्क पर निर्धारित परीक्षण सत्र पूरा करें।`
        : `${patientName} is registered. Please have the patient complete the waiting-room cognitive games to generate their neuro-triage baseline.`;

    return {
      triageStatus: 'PENDING',
      triageLabel: 'Awaiting Baseline Screening',
      dciScore: 0,
      aiPowered: false,
      isPreliminary,
      hasRecordedData: false,
      generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      sbar: {
        situation: `${patientName} (${patient.age}y, ${patient.region || 'NER'}). Baseline cognitive screening pending.`,
        background: `Patient profile active. Primary language: ${(patient.primaryLanguage || language || 'en').toUpperCase()}. Stage: ${patient.dementiaStage || 'MCI'}. 0 completed assessment sessions on record.`,
        assessment: `No objective game telemetry recorded yet. Awaiting completion of waiting-room neuro-attentional trials (Double Decision, Sound Sweeps, Target Tracker, Speed Maze).`,
        recommendation: `1. Direct patient to complete initial screening circuit on Patient Home.\n2. Inquire with family about subjective changes in daily memory, orientation, and navigation.\n3. Conduct standard clinical intake interview.`,
      },
      domainBreakdown: {
        visualSpeed: {
          latencyMs: 0,
          status: 'Not Tested',
          interpretation: 'Visual speed of processing (UFOV) trial not yet attempted.',
        },
        auditoryDiscrimination: {
          latencyMs: 0,
          status: 'Not Tested',
          interpretation: 'Acoustic sweep frequency discrimination trial not yet attempted.',
        },
        dividedAttention: {
          accuracyPct: 0,
          status: 'Not Tested',
          interpretation: 'Multiple object spatial tracking trial not yet attempted.',
        },
        motorHesitation: {
          latencyMs: 0,
          status: 'Not Tested',
          interpretation: 'Psychomotor initiation latency trial not yet attempted.',
        },
      },
      doctorDiscussionPrompts: [
        'Have family members observed recent memory lapses or difficulty managing medications?',
        'Does the patient experience increased disorientation or restlessness during dusk or evening hours?',
        'Are there any vision, hearing, or fine-motor challenges affecting daily independence?',
      ],
      recommendedGames: [
        {
          id: 'bijuli-tap',
          title: 'Bijuli Tap',
          domain: 'Visual Processing Speed & UFOV',
          frequency: '1 trial (5 mins) for baseline setup',
          clinicalRationale: 'Measures millisecond psychomotor reaction time and peripheral detection.',
          priority: 'HIGH',
        },
        {
          id: 'target-tracker',
          title: 'Target Tracker',
          domain: 'Divided Visuospatial Attention',
          frequency: '1 trial (5 mins) for baseline setup',
          clinicalRationale: 'Evaluates parietal dorsal stream multiple-object tracking accuracy.',
          priority: 'HIGH',
        },
        {
          id: 'sound-sweeps',
          title: 'Sound Sweeps',
          domain: 'Auditory Frequency Discrimination',
          frequency: '1 trial (5 mins) for baseline setup',
          clinicalRationale: 'Tests temporal acoustic frequency sweep perception and inter-stimulus interval.',
          priority: 'MEDIUM',
        },
      ],
      caregiverHomeSlip,
    };
  }

  // Case 2: Real assessment telemetry available
  const sightSpeedMs = telemetry.sightSpeedMs;
  const soundSweepsMs = telemetry.soundSweepsMs;
  const targetTrackerScore = telemetry.targetTrackerScore;
  const hesitationMs = telemetry.hesitationMs;
  const sundowningPct = telemetry.sundowningDivergencePct ?? 0;

  // Domain score normalization (0-100) for available metrics
  const domainDcis: number[] = [];
  if (sightSpeedMs !== undefined) {
    domainDcis.push(Math.max(20, Math.min(100, Math.round(100 - (sightSpeedMs - 150) * 0.25))));
  }
  if (soundSweepsMs !== undefined) {
    domainDcis.push(Math.max(20, Math.min(100, Math.round(100 - (soundSweepsMs - 60) * 0.4))));
  }
  if (targetTrackerScore !== undefined) {
    domainDcis.push(Math.max(0, Math.min(100, targetTrackerScore)));
  }
  if (hesitationMs !== undefined) {
    domainDcis.push(Math.max(20, Math.min(100, Math.round(100 - (hesitationMs - 800) * 0.05))));
  }

  const calculatedDci = domainDcis.length > 0
    ? Math.round(domainDcis.reduce((a, b) => a + b, 0) / domainDcis.length)
    : 70;

  const isHighRisk = calculatedDci < 55 || (sightSpeedMs !== undefined && sightSpeedMs > 380) || (targetTrackerScore !== undefined && targetTrackerScore < 50);
  const isMci = calculatedDci < 75 || (sightSpeedMs !== undefined && sightSpeedMs > 260) || (soundSweepsMs !== undefined && soundSweepsMs > 130);

  const triageStatus: 'LOW_RISK' | 'BORDERLINE_MCI' | 'HIGH_IMPAIRMENT' = isHighRisk
    ? 'HIGH_IMPAIRMENT'
    : isMci
    ? 'BORDERLINE_MCI'
    : 'LOW_RISK';

  const triageLabel = isHighRisk
    ? 'High Neuro-Attentional Bottleneck'
    : isMci
    ? 'Borderline Mild Cognitive Impairment'
    : 'Stable Age-Appropriate Baseline';

  const visualStatus = sightSpeedMs === undefined
    ? 'Not Tested'
    : sightSpeedMs > 300
    ? 'Significant Deficit'
    : sightSpeedMs > 220
    ? 'Mild Delay'
    : 'Normal';

  const auditoryStatus = soundSweepsMs === undefined
    ? 'Not Tested'
    : soundSweepsMs > 120
    ? 'Mild Delay'
    : 'Normal';

  const attentionStatus = targetTrackerScore === undefined
    ? 'Not Tested'
    : targetTrackerScore < 65
    ? 'Impaired'
    : targetTrackerScore < 80
    ? 'Mild Bottleneck'
    : 'Preserved';

  const motorStatus = hesitationMs === undefined
    ? 'Not Tested'
    : hesitationMs > 2000
    ? 'High Hesitation'
    : hesitationMs > 1300
    ? 'Moderate Hesitation'
    : 'Fluid';

  const caregiverHomeSlip =
    language === 'as'
      ? `${patientName}ৰ দৃষ্টি আৰু মনোযোগ পৰীক্ষা সম্পন্ন হৈছে। দৈনিক পৰ্যবেক্ষণ আৰু শান্ত পৰিৱেশ অব্যাহত ৰাখক।`
      : language === 'bn'
      ? `${patientName}-র মনোযোগ ও প্রতিক্রিয়া পরীক্ষা সম্পন্ন হয়েছে। ডাক্তারের পরামর্শ অনুযায়ী পরিচর্যা বজায় রাখুন।`
      : language === 'hi'
      ? `${patientName} जी की प्रतिक्रिया गति और एकाग्रता की जांच की गई है। डॉक्टर के परामर्श अनुसार नियमित दिनचर्या बनाए रखें।`
      : `${patientName} completed cognitive screening (${telemetry.sessionsCount || 1} sessions). Assessment metrics logged for review with consulting physician.`;

  const assessmentParts: string[] = [];
  if (sightSpeedMs !== undefined) assessmentParts.push(`Visual UFOV: ${sightSpeedMs}ms (${visualStatus})`);
  if (soundSweepsMs !== undefined) assessmentParts.push(`Auditory ISI: ${soundSweepsMs}ms (${auditoryStatus})`);
  if (targetTrackerScore !== undefined) assessmentParts.push(`Divided Attention MOT: ${targetTrackerScore}% (${attentionStatus})`);
  if (hesitationMs !== undefined) assessmentParts.push(`Motor Latency: ${hesitationMs}ms (${motorStatus})`);
  if (sundowningPct > 0) assessmentParts.push(`Circadian Divergence: +${sundowningPct}%`);

  const recGames: RecommendedGame[] = [];

  // 1. Attention & Object Tracking (Accuracy metric)
  if (targetTrackerScore !== undefined) {
    if (targetTrackerScore < 75) {
      recGames.push({
        id: 'target-tracker',
        title: 'Target Tracker',
        domain: 'Divided Attention (MOT)',
        frequency: '8-10 mins daily',
        clinicalRationale: `Accuracy at ${targetTrackerScore}% reflects attentional bottleneck; retrains parietal dynamic tracking.`,
        priority: 'HIGH',
      });
    } else if (targetTrackerScore < 85) {
      recGames.push({
        id: 'target-tracker',
        title: 'Target Tracker',
        domain: 'Divided Attention (MOT)',
        frequency: '5-8 mins daily',
        clinicalRationale: `Accuracy at ${targetTrackerScore}%; strengthens multi-object tracking stability.`,
        priority: 'MEDIUM',
      });
    }
  }

  // 2. Visual Speed & UFOV (Reaction latency metric)
  if (sightSpeedMs !== undefined) {
    if (sightSpeedMs > 240) {
      recGames.push({
        id: 'bijuli-tap',
        title: 'Bijuli Tap',
        domain: 'Visual Speed & UFOV',
        frequency: '8-10 mins daily (morning)',
        clinicalRationale: `Visual latency at ${sightSpeedMs}ms (threshold <200ms); improves central & peripheral reaction speed.`,
        priority: 'HIGH',
      });
    } else if (sightSpeedMs > 190) {
      recGames.push({
        id: 'double-decision',
        title: 'Double Decision',
        domain: 'Central-Peripheral Integration',
        frequency: '6-8 mins daily',
        clinicalRationale: `Visual latency at ${sightSpeedMs}ms; expands useful field of view to reduce fall risk.`,
        priority: 'MEDIUM',
      });
    }
  }

  // 3. Auditory Frequency Discrimination (Acoustic latency metric)
  if (soundSweepsMs !== undefined) {
    if (soundSweepsMs > 110) {
      recGames.push({
        id: 'sound-sweeps',
        title: 'Sound Sweeps',
        domain: 'Auditory Frequency Discrimination',
        frequency: '8 mins daily in quiet room',
        clinicalRationale: `Auditory ISI at ${soundSweepsMs}ms (normal <100ms); sharpens primary auditory cortex frequency sweep discrimination.`,
        priority: soundSweepsMs > 135 ? 'HIGH' : 'MEDIUM',
      });
    }
  }

  // 4. Motor Latency / Visuomotor Planning (Hesitation metric)
  if (hesitationMs !== undefined && hesitationMs > 1300) {
    recGames.push({
      id: 'speed-maze',
      title: 'Speed Maze',
      domain: 'Visuomotor Planning & Navigation',
      frequency: '10 mins daily',
      clinicalRationale: `Motor hesitation latency is ${hesitationMs}ms; activates frontostriatal motor planning circuits.`,
      priority: hesitationMs > 1800 ? 'HIGH' : 'MEDIUM',
    });
  }

  // If patient has high performance or fewer than 2 deficits, add maintenance games
  if (recGames.length < 2) {
    recGames.push({
      id: 'double-decision',
      title: 'Double Decision',
      domain: 'Useful Field of View (UFOV)',
      frequency: '5 mins daily maintenance',
      clinicalRationale: 'Maintains rapid central visual recognition and peripheral spatial localization.',
      priority: 'MAINTENANCE',
    });
  }
  if (recGames.length < 2) {
    recGames.push({
      id: 'bikhama-khoj',
      title: 'Bikhama Khoj',
      domain: 'Visual Feature Binding',
      frequency: '5 mins daily maintenance',
      clinicalRationale: 'Preserves occipital-temporal feature discrimination and visual search accuracy.',
      priority: 'MAINTENANCE',
    });
  }

  const recommendedGames = recGames.slice(0, 3);

  return {
    triageStatus,
    triageLabel,
    dciScore: calculatedDci,
    aiPowered: false,
    isPreliminary,
    hasRecordedData: true,
    generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    sbar: {
      situation: `${patientName} (${patient.age}y, ${patient.region || 'Assam'}) DCI: ${calculatedDci}/100. Triage: ${triageLabel}.`,
      background: `OPD waiting-room psychophysics screening (${telemetry.sessionsCount || 1} sessions). Primary language: ${(patient.primaryLanguage || language || 'en').toUpperCase()}.`,
      assessment: assessmentParts.join('. ') + '.',
      recommendation: `1. Cross-validate with formal MoCA 5-word recall & trail-making.\n2. Review ambient domestic lighting at dusk${sundowningPct > 0 ? ` (+${sundowningPct}% sundowning divergence)` : ''}.\n3. Screen for extrapyramidal / psychomotor medication effects.`,
    },
    domainBreakdown: {
      visualSpeed: {
        latencyMs: sightSpeedMs || 0,
        status: visualStatus,
        interpretation: sightSpeedMs === undefined ? 'Visual speed trial pending.' : sightSpeedMs > 220 ? 'Prolonged UFOV peripheral search; elevated collision & fall risk.' : 'Central & peripheral visual localization is swift and intact.',
      },
      auditoryDiscrimination: {
        latencyMs: soundSweepsMs || 0,
        status: auditoryStatus,
        interpretation: soundSweepsMs === undefined ? 'Auditory sweep trial pending.' : soundSweepsMs > 120 ? 'Temporal acoustic frequency processing slowed; difficulty parsing speech in noise.' : 'Primary auditory cortex frequency sweep discrimination is sharp.',
      },
      dividedAttention: {
        accuracyPct: targetTrackerScore || 0,
        status: attentionStatus,
        interpretation: targetTrackerScore === undefined ? 'Divided attention trial pending.' : targetTrackerScore < 80 ? 'Parietal attentional bottleneck when tracking concurrent targets.' : 'Excellent parietal dorsal stream visuospatial tracking maintained.',
      },
      motorHesitation: {
        latencyMs: hesitationMs || 0,
        status: motorStatus,
        interpretation: hesitationMs === undefined ? 'Motor latency trial pending.' : hesitationMs > 1300 ? 'Prolonged response initiation suggests psychomotor slowing or mild extrapyramidal delay.' : 'Smooth, fluid motor initiation without signs of hesitation.',
      },
    },
    recommendedGames,
    doctorDiscussionPrompts: [
      'Have you noticed recent hesitancy or balance issues when walking in dim light or evening hours?',
      'Does the patient struggle to follow conversations in noisy environments or family gatherings?',
      'Are there any fine-motor stiffness or tremor episodes during routine activities like writing or buttoning?',
    ],
    caregiverHomeSlip,
  };
}
