import { NextRequest, NextResponse } from 'next/server';
import {
  DoctorReportData,
  computeDeterministicReport,
  PatientContext,
  TelemetryData,
} from '@/lib/clinical/neuroTriageEngine';

export type { DoctorReportData };

// In-Memory Server Cache (10-minute TTL) for sub-millisecond repeated lookups
interface CacheEntry {
  data: DoctorReportData;
  timestamp: number;
}
const reportCache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 10 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      patient = {
        fullName: 'Mridula Hazarika',
        age: 72,
        gender: 'Female',
        region: 'Tezpur, Assam',
        dementiaStage: 'Mild',
      } as PatientContext,
      telemetry = {} as TelemetryData,
      language = 'en',
    } = body;

    const sightSpeedMs = telemetry.sightSpeedMs || 220;
    const soundSweepsMs = telemetry.soundSweepsMs || 95;
    const targetTrackerScore = telemetry.targetTrackerScore || 82;
    const hesitationMs = telemetry.hesitationMs || 1450;
    const sessionsCount = telemetry.sessionsCount || 3;
    const sundowningPct = telemetry.sundowningDivergencePct || 14;

    // Check in-memory server cache first
    const cacheKey = `${patient.fullName}-${patient.age}-${sightSpeedMs}-${soundSweepsMs}-${targetTrackerScore}-${hesitationMs}-${language}`;
    const cached = reportCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        data: {
          ...cached.data,
          fromCache: true,
        },
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;

    if (apiKey) {
      // Doctor-Centric High-Yield Clinical Prompt (Zero Fluff, Maximum Diagnostic Density)
      const systemPrompt = `You are a Senior Consulting Neuropsychologist for SevaMitr OPD clinic.
Patient: ${patient.fullName}, ${patient.age}y ${patient.gender || 'F'}, ${patient.region || 'Assam'}. Stage: ${patient.dementiaStage || 'Mild'}.
Telemetry: Visual UFOV ${sightSpeedMs}ms (Normal <200), Auditory ${soundSweepsMs}ms (Normal <100), Tracking ${targetTrackerScore}% (Normal >80), Motor Hesitation ${hesitationMs}ms (Normal <1200), Sundowning +${sundowningPct}%.

Provide ONLY high-yield OPD clinical details in strict JSON matching schema:
{
  "triageStatus": "LOW_RISK" | "BORDERLINE_MCI" | "HIGH_IMPAIRMENT",
  "triageLabel": "Concise 3-4 word clinical status",
  "dciScore": number (0-100),
  "sbar": {
    "situation": "1 punchy line: screening trigger & baseline index",
    "background": "1 punchy line: patient demographics & language (${language})",
    "assessment": "1-2 lines on anatomical localization: occipitoparietal visual vs temporal auditory vs parietal dorsal stream vs frontostriatal motor latency",
    "recommendation": "2-3 concise bulleted clinical next steps (MoCA subtests, medication check, ambient lighting)"
  },
  "domainBreakdown": {
    "visualSpeed": { "latencyMs": ${sightSpeedMs}, "status": "Normal | Mild Delay | Significant Deficit", "interpretation": "1 concise clinical note" },
    "auditoryDiscrimination": { "latencyMs": ${soundSweepsMs}, "status": "Normal | Mild Delay | Significant Deficit", "interpretation": "1 concise clinical note" },
    "dividedAttention": { "accuracyPct": ${targetTrackerScore}, "status": "Preserved | Mild Bottleneck | Impaired", "interpretation": "1 concise clinical note" },
    "motorHesitation": { "latencyMs": ${hesitationMs}, "status": "Fluid | Moderate Hesitation | High Hesitation", "interpretation": "1 concise clinical note" }
  },
  "doctorDiscussionPrompts": [
    "Targeted OPD clinical question 1 to ask family in clinic",
    "Targeted OPD clinical question 2 to ask family in clinic",
    "Targeted OPD clinical question 3 to ask family in clinic"
  ],
  "caregiverHomeSlip": "Warm 2-line family note in language '${language}'."
}`;

      const primaryModel = 'gemini-3.1-flash-lite';

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const geminiRes = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${primaryModel}:generateContent?key=${apiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: controller.signal,
            body: JSON.stringify({
              contents: [{ parts: [{ text: systemPrompt }] }],
              generationConfig: {
                responseMimeType: 'application/json',
                temperature: 0.1,
                maxOutputTokens: 1000,
              },
            }),
          }
        );
        clearTimeout(timeoutId);

        if (geminiRes.ok) {
          const geminiData = await geminiRes.json();
          let candidateText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
          if (candidateText) {
            candidateText = candidateText.trim();
            if (candidateText.startsWith('```json')) {
              candidateText = candidateText.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (candidateText.startsWith('```')) {
              candidateText = candidateText.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            const parsed = JSON.parse(candidateText);
            const fullReport: DoctorReportData = {
              ...parsed,
              aiPowered: true,
              modelUsed: primaryModel,
              generatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            };

            reportCache.set(cacheKey, { data: fullReport, timestamp: Date.now() });

            return NextResponse.json({
              success: true,
              data: fullReport,
            });
          }
        } else {
          console.warn(`Gemini primary model ${primaryModel} returned status ${geminiRes.status}`);
        }
      } catch (err: any) {
        console.warn(`Error calling Gemini model ${primaryModel}:`, err.message || err);
      }
    }

    // Fallback: Deterministic Neuro-Clinical Heuristics Engine (Offline Resilience for SIH)
    const fallbackReport = computeDeterministicReport(patient, telemetry, language);
    reportCache.set(cacheKey, { data: fallbackReport, timestamp: Date.now() });

    return NextResponse.json({ success: true, data: fallbackReport });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'Failed to generate report' }, { status: 500 });
  }
}
