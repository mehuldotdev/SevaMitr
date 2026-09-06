import { NextRequest, NextResponse } from 'next/server';
import {
  DoctorReportData,
  computeDeterministicReport,
  PatientContext,
  TelemetryData,
} from '@/lib/clinical/neuroTriageEngine';

export type { DoctorReportData };

export const dynamic = 'force-dynamic';

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
      patient,
      telemetry = {} as TelemetryData,
      language = 'en',
    } = body;

    if (!patient || !patient.fullName) {
      return NextResponse.json({ success: false, error: 'Patient profile required' }, { status: 400 });
    }

    const hasData =
      (telemetry.sessionsCount !== undefined && telemetry.sessionsCount > 0) ||
      telemetry.sightSpeedMs !== undefined ||
      telemetry.soundSweepsMs !== undefined ||
      telemetry.targetTrackerScore !== undefined ||
      telemetry.hesitationMs !== undefined;

    // Check in-memory server cache first
    const cacheKey = `${patient.fullName}-${patient.age}-${telemetry.sightSpeedMs ?? 'none'}-${telemetry.soundSweepsMs ?? 'none'}-${telemetry.targetTrackerScore ?? 'none'}-${telemetry.hesitationMs ?? 'none'}-${telemetry.sessionsCount ?? 0}-${language}`;
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
      const telemetrySummary = hasData
        ? `Telemetry: Visual UFOV ${telemetry.sightSpeedMs !== undefined ? `${telemetry.sightSpeedMs}ms (Normal <200)` : 'Not Tested'}, Auditory ${telemetry.soundSweepsMs !== undefined ? `${telemetry.soundSweepsMs}ms (Normal <100)` : 'Not Tested'}, Tracking ${telemetry.targetTrackerScore !== undefined ? `${telemetry.targetTrackerScore}% (Normal >80)` : 'Not Tested'}, Motor Hesitation ${telemetry.hesitationMs !== undefined ? `${telemetry.hesitationMs}ms (Normal <1200)` : 'Not Tested'}, Sundowning Divergence: ${telemetry.sundowningDivergencePct !== undefined ? `+${telemetry.sundowningDivergencePct}%` : 'Insufficient diurnal data'}, Total Sessions: ${telemetry.sessionsCount || 1}.`
        : `Telemetry: Zero assessment sessions completed yet. Baseline screening is pending on the Patient Kiosk.`;

      const systemPrompt = `You are a Senior Consulting Neuropsychologist for SevaMitr OPD clinic.
Patient: ${patient.fullName}, ${patient.age}y ${patient.gender || 'Patient'}, ${patient.region || 'Assam'}. Stage: ${patient.dementiaStage || 'MCI'}.
${telemetrySummary}

Provide high-yield OPD clinical details in strict JSON matching schema:
{
  "triageStatus": "${hasData ? 'LOW_RISK | BORDERLINE_MCI | HIGH_IMPAIRMENT' : 'PENDING'}",
  "triageLabel": "Concise 3-4 word clinical status",
  "dciScore": number (${hasData ? '0-100' : '0'}),
  "hasRecordedData": ${hasData},
  "sbar": {
    "situation": "1 punchy line: screening trigger & baseline index for ${patient.fullName}",
    "background": "1 punchy line: patient demographics & language (${language})",
    "assessment": "1-2 lines on clinical/anatomical localization: ${hasData ? 'occipitoparietal visual vs temporal auditory vs parietal dorsal stream vs frontostriatal motor latency' : 'mention that baseline game sessions are pending on the Kiosk'}",
    "recommendation": "2-3 concise bulleted clinical next steps (MoCA subtests, medication check, ambient lighting)"
  },
  "domainBreakdown": {
    "visualSpeed": { "latencyMs": ${telemetry.sightSpeedMs || 0}, "status": "${telemetry.sightSpeedMs ? 'Normal | Mild Delay | Significant Deficit' : 'Not Tested'}", "interpretation": "1 concise clinical note" },
    "auditoryDiscrimination": { "latencyMs": ${telemetry.soundSweepsMs || 0}, "status": "${telemetry.soundSweepsMs ? 'Normal | Mild Delay | Significant Deficit' : 'Not Tested'}", "interpretation": "1 concise clinical note" },
    "dividedAttention": { "accuracyPct": ${telemetry.targetTrackerScore || 0}, "status": "${telemetry.targetTrackerScore ? 'Preserved | Mild Bottleneck | Impaired' : 'Not Tested'}", "interpretation": "1 concise clinical note" },
    "motorHesitation": { "latencyMs": ${telemetry.hesitationMs || 0}, "status": "${telemetry.hesitationMs ? 'Fluid | Moderate Hesitation | High Hesitation' : 'Not Tested'}", "interpretation": "1 concise clinical note" }
  },
  "recommendedGames": [
    {
      "id": "bijuli-tap | double-decision | sound-sweeps | target-tracker | speed-maze | bikhama-khoj",
      "title": "Clean Game Name",
      "domain": "Targeted Cognitive Domain",
      "frequency": "Concise prescription dosage (e.g. '8-10 mins daily before 3 PM')",
      "clinicalRationale": "1 concise line tying to patient's specific accuracy or reaction latency",
      "priority": "HIGH | MEDIUM | MAINTENANCE"
    }
  ],
  "doctorDiscussionPrompts": [
    "Targeted OPD clinical question 1 to ask family of ${patient.fullName} in clinic",
    "Targeted OPD clinical question 2 to ask family of ${patient.fullName} in clinic",
    "Targeted OPD clinical question 3 to ask family of ${patient.fullName} in clinic"
  ],
  "caregiverHomeSlip": "Warm 2-line family note mentioning '${patient.fullName}' in language '${language}'."
}

CRITICAL RULES:
- Keep all fields concise, high-yield, and professional for a rapid 30-second OPD physician review.
- In 'recommendedGames', provide exactly 2-3 games prioritized by the patient's weakest accuracy/latency metrics. Valid game IDs: bijuli-tap (Visual Speed/UFOV), double-decision (Useful Field of View), sound-sweeps (Auditory Discrimination), target-tracker (Divided Visuospatial Attention), speed-maze (Visuomotor Planning & Navigation), bikhama-khoj (Visual Search & Feature Binding).
- If hasRecordedData is false, recommend baseline initiation on bijuli-tap, target-tracker, and sound-sweeps.`;

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
