export interface DoctorReportData {
  triageStatus: 'LOW_RISK' | 'BORDERLINE_MCI' | 'HIGH_IMPAIRMENT';
  triageLabel: string;
  dciScore: number;
  aiPowered: boolean;
  modelUsed?: string;
  generatedAt: string;
  isPreliminary?: boolean;
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
  const sightSpeedMs = telemetry.sightSpeedMs || 220;
  const soundSweepsMs = telemetry.soundSweepsMs || 95;
  const targetTrackerScore = telemetry.targetTrackerScore || 82;
  const hesitationMs = telemetry.hesitationMs || 1450;
  const sundowningPct = telemetry.sundowningDivergencePct || 14;

  const isMci = sightSpeedMs > 260 || targetTrackerScore < 70 || soundSweepsMs > 130;
  const isHighRisk = sightSpeedMs > 380 || targetTrackerScore < 55;

  const triageStatus: 'LOW_RISK' | 'BORDERLINE_MCI' | 'HIGH_IMPAIRMENT' = isHighRisk
    ? 'HIGH_IMPAIRMENT'
    : isMci
    ? 'BORDERLINE_MCI'
    : 'LOW_RISK';

  const calculatedDci = Math.round(
    Math.max(45, Math.min(95, 100 - (sightSpeedMs / 10) * 0.4 - (soundSweepsMs / 5) * 0.3 + (targetTrackerScore * 0.3)))
  );

  const triageLabel = isHighRisk
    ? 'High Neuro-Attentional Bottleneck'
    : isMci
    ? 'Borderline Mild Cognitive Impairment'
    : 'Stable Age-Appropriate Baseline';

  const visualStatus = sightSpeedMs > 300 ? 'Significant Deficit' : sightSpeedMs > 220 ? 'Mild Delay' : 'Normal';
  const auditoryStatus = soundSweepsMs > 120 ? 'Mild Delay' : 'Normal';
  const attentionStatus = targetTrackerScore < 65 ? 'Impaired' : targetTrackerScore < 80 ? 'Mild Bottleneck' : 'Preserved';
  const motorStatus = hesitationMs > 2000 ? 'High Hesitation' : hesitationMs > 1300 ? 'Moderate Hesitation' : 'Fluid';

  const caregiverHomeSlip =
    language === 'as'
      ? 'মৃদুলা বাইদেউৰ দৃষ্টি আৰু শ্ৰৱণ শক্তিৰ পৰীক্ষা সন্তোষজনক। সন্ধিয়াৰ সময়ত ভাগৰুৱা ভাব দেখা দিলে ঘৰত পৰ্যাপ্ত পোহৰৰ ব্যৱস্থা ৰাখিব।'
      : language === 'bn'
      ? 'মৃদুলা দেবীর প্রাথমিক স্মৃতি ও দৃষ্টি পরীক্ষা সম্পন্ন হয়েছে। সন্ধ্যার দিকে পর্যাপ্ত আলোর ব্যবস্থা রাখা জরুরি।'
      : language === 'hi'
      ? 'मृदुला जी की दृष्टि और प्रतिक्रिया गति की जांच की गई है। शाम के समय पर्याप्त रोशनी और शांत वातावरण बनाए रखें।'
      : 'Patient completed pre-consultation screening. Visual speed and attention scores logged for clinical review with consulting physician.';

  return {
    triageStatus,
    triageLabel,
    dciScore: calculatedDci,
    aiPowered: false,
    isPreliminary,
    generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    sbar: {
      situation: `${patient.fullName} (${patient.age}y, ${patient.region || 'Assam'}) DCI: ${calculatedDci}/100. Triage: ${triageLabel}.`,
      background: `OPD waiting-room psychophysics screening. Primary language: ${(patient.primaryLanguage || language || 'en').toUpperCase()}.`,
      assessment: `Visual UFOV: ${sightSpeedMs}ms (${visualStatus}). Auditory ISI: ${soundSweepsMs}ms (${auditoryStatus}). Divided Attention MOT: ${targetTrackerScore}% (${attentionStatus}). Motor Latency: ${hesitationMs}ms (${motorStatus}). Circadian Divergence: +${sundowningPct}%.`,
      recommendation: `1. Cross-validate with formal MoCA 5-word recall & trail-making.\n2. Review ambient domestic lighting at dusk (+${sundowningPct}% sundowning).\n3. Screen for extrapyramidal / psychomotor medication effects.`,
    },
    domainBreakdown: {
      visualSpeed: {
        latencyMs: sightSpeedMs,
        status: visualStatus,
        interpretation: sightSpeedMs > 220 ? 'Prolonged UFOV peripheral search; elevated collision & fall risk.' : 'Central & peripheral visual localization is swift and intact.',
      },
      auditoryDiscrimination: {
        latencyMs: soundSweepsMs,
        status: auditoryStatus,
        interpretation: soundSweepsMs > 120 ? 'Temporal acoustic frequency processing slowed; difficulty parsing speech in noise.' : 'Primary auditory cortex frequency sweep discrimination is sharp.',
      },
      dividedAttention: {
        accuracyPct: targetTrackerScore,
        status: attentionStatus,
        interpretation: targetTrackerScore < 80 ? 'Parietal attentional bottleneck when tracking 3+ concurrent targets.' : 'Excellent parietal dorsal stream visuospatial tracking maintained.',
      },
      motorHesitation: {
        latencyMs: hesitationMs,
        status: motorStatus,
        interpretation: hesitationMs > 1300 ? 'Prolonged response initiation suggests psychomotor slowing or mild extrapyramidal delay.' : 'Smooth, fluid motor initiation without signs of hesitation.',
      },
    },
    doctorDiscussionPrompts: [
      'Have you noticed recent hesitancy or balance issues when walking in dim light or evening hours?',
      'Does the patient struggle to follow conversations in noisy environments or family gatherings?',
      'Are there any fine-motor stiffness or tremor episodes during routine activities like writing or buttoning?',
    ],
    caregiverHomeSlip,
  };
}
