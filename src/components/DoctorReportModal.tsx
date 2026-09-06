'use client';

import React, { useState, useEffect } from 'react';
import {
  X,
  Printer,
  Copy,
  Check,
  Stethoscope,
  Sparkles,
  Zap,
  Volume2,
  Target,
  Clock,
  FileText,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Gamepad2,
} from 'lucide-react';
import { PatientProfile, offlineDb } from '@/lib/db/offlineDb';
import {
  computeDeterministicReport,
  DoctorReportData,
  TelemetryData,
} from '@/lib/clinical/neuroTriageEngine';

export function extractPatientTelemetry(patientId?: string): TelemetryData {
  if (typeof window === 'undefined' || !patientId) {
    return { sessionsCount: 0 };
  }
  const sessions = offlineDb.getSessions(patientId);
  if (!sessions || sessions.length === 0) {
    return { sessionsCount: 0 };
  }

  const doubleDecisionSessions = sessions.filter((s) => s.gameId === 'double_decision');
  const soundSweepsSessions = sessions.filter((s) => s.gameId === 'sound_sweeps');
  const targetTrackerSessions = sessions.filter((s) => s.gameId === 'target_tracker');
  const speedMazeSessions = sessions.filter((s) => s.gameId === 'speed_maze');
  const bijuliTapSessions = sessions.filter((s) => s.gameId === 'bijuli_tap');
  const bikhamaSessions = sessions.filter((s) => s.gameId === 'bikhama_khoj');

  const visualPool = [...doubleDecisionSessions, ...bikhamaSessions];
  const sightSpeedMs =
    visualPool.length > 0
      ? Math.round(visualPool.reduce((acc, s) => acc + s.hesitationMs, 0) / visualPool.length)
      : undefined;

  const soundSweepsMs =
    soundSweepsSessions.length > 0
      ? Math.round(soundSweepsSessions.reduce((acc, s) => acc + s.hesitationMs, 0) / soundSweepsSessions.length)
      : undefined;

  const targetTrackerScore =
    targetTrackerSessions.length > 0
      ? Math.round(targetTrackerSessions.reduce((acc, s) => acc + s.score, 0) / targetTrackerSessions.length)
      : undefined;

  const motorPool = [...bijuliTapSessions, ...speedMazeSessions];
  const hesitationMs =
    motorPool.length > 0
      ? Math.round(motorPool.reduce((acc, s) => acc + s.hesitationMs, 0) / motorPool.length)
      : sessions.length > 0
      ? Math.round(sessions.reduce((acc, s) => acc + s.hesitationMs, 0) / sessions.length)
      : undefined;

  const morning = sessions.filter((s) => s.timeOfDay === 'morning');
  const evening = sessions.filter((s) => s.timeOfDay === 'evening' || s.timeOfDay === 'night');
  let sundowningDivergencePct: number | undefined = undefined;
  if (morning.length > 0 && evening.length > 0) {
    const avgMorning = morning.reduce((a, b) => a + b.hesitationMs, 0) / morning.length;
    const avgEvening = evening.reduce((a, b) => a + b.hesitationMs, 0) / evening.length;
    sundowningDivergencePct = Math.round(((avgEvening - avgMorning) / Math.max(1, avgMorning)) * 100);
  }

  return {
    sightSpeedMs,
    soundSweepsMs,
    targetTrackerScore,
    hesitationMs,
    sessionsCount: sessions.length,
    sundowningDivergencePct,
  };
}

// Module-level cache so reopening the modal for the same patient in session is 0ms
const clientReportCache = new Map<string, DoctorReportData>();

interface DoctorReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: PatientProfile;
  telemetry?: TelemetryData;
}

export function DoctorReportModal({
  isOpen,
  onClose,
  patient,
  telemetry,
}: DoctorReportModalProps) {
  const effectiveTelemetry = React.useMemo(() => {
    const hasProps =
      telemetry &&
      (telemetry.sightSpeedMs !== undefined ||
       telemetry.soundSweepsMs !== undefined ||
       telemetry.targetTrackerScore !== undefined ||
       telemetry.hesitationMs !== undefined ||
       (telemetry.sessionsCount !== undefined && telemetry.sessionsCount > 0));

    if (hasProps) return telemetry;
    return extractPatientTelemetry(patient?.id);
  }, [telemetry, patient?.id]);

  const [reportData, setReportData] = useState<DoctorReportData>(() =>
    computeDeterministicReport(patient, effectiveTelemetry, patient.primaryLanguage || 'en', true)
  );
  const [isAiRefining, setIsAiRefining] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen || !patient) return;

    const cacheKey = `${patient.fullName}-${patient.age}-${effectiveTelemetry.sightSpeedMs ?? 'none'}-${effectiveTelemetry.soundSweepsMs ?? 'none'}-${effectiveTelemetry.targetTrackerScore ?? 'none'}-${effectiveTelemetry.hesitationMs ?? 'none'}-${effectiveTelemetry.sessionsCount ?? 0}-${patient.primaryLanguage || 'en'}`;

    const cached = clientReportCache.get(cacheKey);
    if (cached) {
      setReportData(cached);
      setIsAiRefining(false);
      return;
    }

    // Instant Zero-Wait Render: deterministic psychophysics triage ready in 0ms
    const instantReport = computeDeterministicReport(
      patient,
      effectiveTelemetry,
      patient.primaryLanguage || 'en',
      true
    );
    setReportData(instantReport);
    setIsAiRefining(true);

    const controller = new AbortController();

    fetch('/api/ai/clinical-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        patient,
        telemetry: effectiveTelemetry,
        language: patient.primaryLanguage || 'en',
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.data) {
          setReportData(data.data);
          clientReportCache.set(cacheKey, data.data);
        }
      })
      .catch((err) => {
        if (err.name !== 'AbortError') {
          console.warn('AI report generation error, keeping deterministic triage', err);
        }
      })
      .finally(() => {
        setIsAiRefining(false);
      });

    return () => {
      controller.abort();
    };
  }, [isOpen, patient, effectiveTelemetry]);

  if (!isOpen) return null;

  const handleCopy = () => {
    if (!reportData) return;
    const recText = Array.isArray(reportData.sbar.recommendation)
      ? reportData.sbar.recommendation.map((r: string, i: number) => `${i + 1}. ${r}`).join('\n')
      : reportData.sbar.recommendation;

    const gamesText = reportData.recommendedGames?.length
      ? reportData.recommendedGames
          .map(
            (g, i) =>
              `${i + 1}. [${g.priority}] ${g.title} (${g.domain}) — ${g.frequency}\n   Rationale: ${g.clinicalRationale}`
          )
          .join('\n')
      : 'Initial 4-game baseline circuit on Patient Kiosk.';

    const text = `SEVAMITR CLINICAL NEURO-TRIAGE REPORT
Patient: ${patient.fullName} (${patient.age}y, ${patient.gender}) | Region: ${patient.region}
DCI Score: ${reportData.dciScore}/100 | Triage: ${reportData.triageLabel}

SBAR CLINICAL SUMMARY:
- Situation: ${reportData.sbar.situation}
- Background: ${reportData.sbar.background}
- Assessment: ${reportData.sbar.assessment}
- Recommendation:
${recText}

PRESCRIBED COGNITIVE INTERVENTIONS / RECOMMENDED GAMES:
${gamesText}

DOCTOR CONSULTATION QUESTIONS:
1. ${reportData.doctorDiscussionPrompts?.[0] || 'Any noticeable changes in daily motor coordination or balance?'}
2. ${reportData.doctorDiscussionPrompts?.[1] || 'Do attentional lapses worsen during evening hours?'}
3. ${reportData.doctorDiscussionPrompts?.[2] || 'Any challenges following conversational flow in crowded settings?'}`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const getTriageColor = (status: string) => {
    switch (status) {
      case 'HIGH_IMPAIRMENT':
        return { bg: '#fee2e2', border: '#991b1b', text: '#991b1b', label: '🔴 High Neuro-Attentional Deficit' };
      case 'BORDERLINE_MCI':
        return { bg: '#fef3c7', border: '#b45309', text: '#92400e', label: '🟡 Borderline MCI Flag' };
      case 'PENDING':
        return { bg: '#f4f7f4', border: '#78716c', text: '#57534e', label: '⚪ Baseline Screening Pending' };
      default:
        return { bg: '#e8f5e9', border: '#214935', text: '#073220', label: '🟢 Stable Age-Matched Baseline' };
    }
  };

  const triageStyle = getTriageColor(reportData.triageStatus);

  return (
    <div
      id="clinical-report-modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(28, 27, 27, 0.72)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.25rem',
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <div
        id="clinical-report-modal-card"
        className="neo-card"
        style={{
          background: '#ffffff',
          maxWidth: '780px',
          width: '100%',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
          overflow: 'hidden',
          padding: 0,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Top Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '2px solid #1c1b1b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#f4f7f4',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                background: '#214935',
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #1c1b1b',
              }}
            >
              <Stethoscope size={20} />
            </div>
            <div>
              <div className="font-clash-bold" style={{ fontSize: '1.05rem', color: '#1c1b1b', textTransform: 'uppercase', lineHeight: 1.1 }}>
                Clinical Neuro-Triage Report
              </div>
              <div className="font-clash-regular" style={{ fontSize: '0.78rem', color: '#57534e' }}>
                Pre-Consultation OPD Handover Sheet • SevaMitr
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="no-print"
            style={{
              background: '#ffffff',
              border: '2px solid #1c1b1b',
              borderRadius: '8px',
              width: '34px',
              height: '34px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body - Always Instant Zero-Wait Render */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
          {/* Patient Metadata Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '0.75rem',
              padding: '0.85rem 1rem',
              background: '#fcfbf9',
              borderRadius: '12px',
              border: '2px solid #1c1b1b',
            }}
          >
            <div>
              <span className="font-clash-bold" style={{ fontSize: '1.15rem', color: '#1c1b1b' }}>
                {patient.fullName}
              </span>
              <span className="font-clash-regular" style={{ fontSize: '0.85rem', color: '#78716c', marginLeft: '0.5rem' }}>
                ({patient.age}y • {patient.gender} • {patient.region})
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {isAiRefining ? (
                <span
                  className="neo-pill font-clash-wide"
                  style={{
                    background: '#fff3e0',
                    color: '#b45309',
                    border: '1.5px solid #b45309',
                    fontSize: '0.68rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    padding: '0.25rem 0.65rem',
                  }}
                >
                  <div
                    style={{
                      width: '7px',
                      height: '7px',
                      borderRadius: '50%',
                      background: '#b45309',
                      animation: 'aiPulse 1.2s infinite',
                    }}
                  />
                  <style>{`@keyframes aiPulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.3; transform: scale(0.75); } }`}</style>
                  <span>Generating Report with AI...</span>
                </span>
              ) : (
                <span
                  className="neo-pill font-clash-wide"
                  style={{
                    background: reportData.aiPowered ? '#e8f5e9' : '#f4f7f4',
                    color: reportData.aiPowered ? '#073220' : '#57534e',
                    border: reportData.aiPowered ? '1.5px solid #214935' : '1.5px solid #1c1b1b',
                    fontSize: '0.68rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.25rem 0.65rem',
                  }}
                >
                  <Sparkles size={12} />
                  <span>{reportData.aiPowered ? `AI Enhanced (${reportData.modelUsed || 'Gemini'})` : 'Clinical Heuristics'}</span>
                </span>
              )}
              <span className="font-clash-regular" style={{ fontSize: '0.78rem', color: '#78716c' }}>
                {reportData.generatedAt}
              </span>
            </div>
          </div>

          {/* Active AI Refinement Banner (Non-blocking) */}
          {isAiRefining && (
            <div
              style={{
                padding: '0.6rem 0.85rem',
                background: '#fffbeb',
                border: '1.5px solid #f59e0b',
                borderRadius: '10px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '0.5rem',
                fontSize: '0.78rem',
                color: '#92400e',
              }}
              className="font-clash-regular"
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div
                  style={{
                    width: '13px',
                    height: '13px',
                    borderRadius: '50%',
                    border: '2px solid #f59e0b',
                    borderTopColor: 'transparent',
                    animation: 'spin 0.8s linear infinite',
                  }}
                />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                <span>
                  <strong>Instant on-device psychophysics triaged.</strong> AI Doctor Synthesis is refining recommendations in background...
                </span>
              </div>
              <span className="font-clash-wide" style={{ fontSize: '0.65rem', letterSpacing: '0.05em', opacity: 0.85 }}>LIVE</span>
            </div>
          )}

          {/* Triage Banner & DCI Score */}
          <div
            style={{
              background: triageStyle.bg,
              border: `2px solid #1c1b1b`,
              boxShadow: '3px 3px 0px #1c1b1b',
              borderRadius: '14px',
              padding: '1.1rem 1.25rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <div className="font-clash-wide" style={{ fontSize: '0.72rem', letterSpacing: '0.04em', color: triageStyle.text, marginBottom: '0.2rem' }}>
                COGNITIVE TRIAGE CLASSIFICATION
              </div>
              <div className="font-clash-bold" style={{ fontSize: '1.35rem', color: '#1c1b1b', textTransform: 'uppercase' }}>
                {triageStyle.label}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div className="font-clash-wide" style={{ fontSize: '0.68rem', color: '#57534e' }}>DYNAMIC COGNITIVE INDEX</div>
              <div className="font-clash-bold" style={{ fontSize: '2rem', color: '#214935', lineHeight: 1 }}>
                {reportData.hasRecordedData === false || reportData.dciScore === 0 ? (
                  <span style={{ fontSize: '1.4rem', color: '#78716c' }}>Pending</span>
                ) : (
                  <>
                    {reportData.dciScore} <span style={{ fontSize: '1rem', color: '#78716c' }}>/ 100</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* 4 Psychophysics Telemetry Chips */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '0.75rem' }}>
            <div className="neo-card" style={{ padding: '0.75rem 0.85rem', background: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#214935', marginBottom: '0.35rem' }}>
                <Zap size={15} />
                <span className="font-clash-wide" style={{ fontSize: '0.66rem' }}>SIGHT SPEED (UFOV)</span>
              </div>
              <div className="font-clash-bold" style={{ fontSize: '1.25rem', color: '#1c1b1b', lineHeight: 1 }}>
                {reportData.domainBreakdown?.visualSpeed?.status === 'Not Tested' || !reportData.domainBreakdown?.visualSpeed?.latencyMs
                  ? 'Pending'
                  : `${reportData.domainBreakdown.visualSpeed.latencyMs} ms`}
              </div>
              <div className="font-clash-regular" style={{ fontSize: '0.72rem', color: '#57534e', marginTop: '0.25rem' }}>
                {reportData.domainBreakdown?.visualSpeed?.status || 'Not Tested'}
              </div>
            </div>

            <div className="neo-card" style={{ padding: '0.75rem 0.85rem', background: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#0f4c81', marginBottom: '0.35rem' }}>
                <Volume2 size={15} />
                <span className="font-clash-wide" style={{ fontSize: '0.66rem' }}>ACOUSTIC SWEEPS</span>
              </div>
              <div className="font-clash-bold" style={{ fontSize: '1.25rem', color: '#1c1b1b', lineHeight: 1 }}>
                {reportData.domainBreakdown?.auditoryDiscrimination?.status === 'Not Tested' || !reportData.domainBreakdown?.auditoryDiscrimination?.latencyMs
                  ? 'Pending'
                  : `${reportData.domainBreakdown.auditoryDiscrimination.latencyMs} ms`}
              </div>
              <div className="font-clash-regular" style={{ fontSize: '0.72rem', color: '#57534e', marginTop: '0.25rem' }}>
                {reportData.domainBreakdown?.auditoryDiscrimination?.status || 'Not Tested'}
              </div>
            </div>

            <div className="neo-card" style={{ padding: '0.75rem 0.85rem', background: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#c85a32', marginBottom: '0.35rem' }}>
                <Target size={15} />
                <span className="font-clash-wide" style={{ fontSize: '0.66rem' }}>DIVIDED ATTENTION</span>
              </div>
              <div className="font-clash-bold" style={{ fontSize: '1.25rem', color: '#1c1b1b', lineHeight: 1 }}>
                {reportData.domainBreakdown?.dividedAttention?.status === 'Not Tested' || reportData.domainBreakdown?.dividedAttention?.accuracyPct === undefined || reportData.domainBreakdown?.dividedAttention?.accuracyPct === 0
                  ? 'Pending'
                  : `${reportData.domainBreakdown.dividedAttention.accuracyPct}%`}
              </div>
              <div className="font-clash-regular" style={{ fontSize: '0.72rem', color: '#57534e', marginTop: '0.25rem' }}>
                {reportData.domainBreakdown?.dividedAttention?.status || 'Not Tested'}
              </div>
            </div>

            <div className="neo-card" style={{ padding: '0.75rem 0.85rem', background: '#ffffff' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#57534e', marginBottom: '0.35rem' }}>
                <Clock size={15} />
                <span className="font-clash-wide" style={{ fontSize: '0.66rem' }}>MOTOR LATENCY</span>
              </div>
              <div className="font-clash-bold" style={{ fontSize: '1.25rem', color: '#1c1b1b', lineHeight: 1 }}>
                {reportData.domainBreakdown?.motorHesitation?.status === 'Not Tested' || !reportData.domainBreakdown?.motorHesitation?.latencyMs
                  ? 'Pending'
                  : `${reportData.domainBreakdown.motorHesitation.latencyMs} ms`}
              </div>
              <div className="font-clash-regular" style={{ fontSize: '0.72rem', color: '#57534e', marginTop: '0.25rem' }}>
                {reportData.domainBreakdown?.motorHesitation?.status || 'Not Tested'}
              </div>
            </div>
          </div>

          {/* SBAR Clinical Synthesis (High-Yield for Consulting Physician) */}
          <div
            className="neo-card"
            style={{
              background: '#ffffff',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', borderBottom: '1px solid #e7e5e4', paddingBottom: '0.5rem' }}>
              <FileText size={17} color="#214935" />
              <span className="font-clash-bold" style={{ fontSize: '0.98rem', textTransform: 'uppercase' }}>
                Doctor Consultation SBAR Note
              </span>
            </div>

            <div>
              <span className="font-clash-bold" style={{ fontSize: '0.82rem', color: '#214935', textTransform: 'uppercase' }}>SITUATION: </span>
              <span className="font-clash-regular" style={{ fontSize: '0.86rem', color: '#1c1b1b', lineHeight: 1.45 }}>{reportData.sbar.situation}</span>
            </div>

            <div>
              <span className="font-clash-bold" style={{ fontSize: '0.82rem', color: '#214935', textTransform: 'uppercase' }}>ASSESSMENT: </span>
              <span className="font-clash-regular" style={{ fontSize: '0.86rem', color: '#1c1b1b', lineHeight: 1.45 }}>{reportData.sbar.assessment}</span>
            </div>

            <div>
              <span className="font-clash-bold" style={{ fontSize: '0.82rem', color: '#214935', textTransform: 'uppercase' }}>RECOMMENDATION: </span>
              {Array.isArray(reportData.sbar.recommendation) ? (
                <div style={{ marginTop: '0.35rem', display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                  {reportData.sbar.recommendation.map((rec: string, i: number) => (
                    <div key={i} className="font-clash-regular" style={{ fontSize: '0.86rem', color: '#1c1b1b', lineHeight: 1.45 }}>
                      • {rec}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="font-clash-regular" style={{ fontSize: '0.86rem', color: '#1c1b1b', lineHeight: 1.45, whiteSpace: 'pre-line' }}>{reportData.sbar.recommendation}</span>
              )}
            </div>
          </div>

          {/* Prescribed Cognitive Interventions • Recommended Follow-Up Games */}
          <div
            className="neo-card"
            style={{
              background: '#ffffff',
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid #e7e5e4',
                paddingBottom: '0.5rem',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <Gamepad2 size={17} color="#214935" />
                <span className="font-clash-bold" style={{ fontSize: '0.98rem', textTransform: 'uppercase', color: '#1c1b1b' }}>
                  Prescribed Cognitive Interventions • Recommended Games
                </span>
              </div>
              <span className="font-clash-regular" style={{ fontSize: '0.74rem', color: '#78716c' }}>
                Calibrated to psychophysical accuracy &amp; reaction latency
              </span>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
              {reportData.recommendedGames && reportData.recommendedGames.length > 0 ? (
                reportData.recommendedGames.map((game, idx) => {
                  const isHigh = game.priority === 'HIGH';
                  const isMedium = game.priority === 'MEDIUM';
                  const badgeStyle = isHigh
                    ? { bg: '#fee2e2', text: '#991b1b', border: '#991b1b', label: 'HIGH PRIORITY' }
                    : isMedium
                    ? { bg: '#fef3c7', text: '#92400e', border: '#b45309', label: 'TARGETED' }
                    : { bg: '#e8f5e9', text: '#073220', border: '#214935', label: 'MAINTENANCE' };

                  return (
                    <div
                      key={idx}
                      className="neo-card"
                      style={{
                        padding: '0.85rem 1rem',
                        background: '#fcfbf9',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        gap: '0.5rem',
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem', gap: '0.5rem' }}>
                          <span
                            className="font-clash-bold"
                            style={{ fontSize: '0.95rem', color: '#1c1b1b', textTransform: 'uppercase' }}
                          >
                            {game.title}
                          </span>
                          <span
                            className="neo-pill font-clash-wide"
                            style={{
                              background: badgeStyle.bg,
                              color: badgeStyle.text,
                              border: `1.5px solid ${badgeStyle.border}`,
                              fontSize: '0.62rem',
                              padding: '0.15rem 0.5rem',
                              flexShrink: 0,
                            }}
                          >
                            {badgeStyle.label}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem', marginBottom: '0.45rem' }}>
                          <span
                            className="neo-pill font-clash-semibold"
                            style={{
                              background: '#f4f7f4',
                              color: '#57534e',
                              fontSize: '0.66rem',
                              border: '1px solid #1c1b1b',
                              padding: '0.15rem 0.45rem',
                            }}
                          >
                            {game.domain}
                          </span>
                          <span
                            className="neo-pill font-clash-semibold"
                            style={{
                              background: '#e0f2fe',
                              color: '#0369a1',
                              fontSize: '0.66rem',
                              border: '1px solid #0369a1',
                              padding: '0.15rem 0.45rem',
                            }}
                          >
                            ⏱ {game.frequency}
                          </span>
                        </div>

                        <div
                          className="font-clash-regular"
                          style={{ fontSize: '0.82rem', color: '#44403c', lineHeight: 1.4 }}
                        >
                          {game.clinicalRationale}
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="font-clash-regular" style={{ fontSize: '0.85rem', color: '#78716c', fontStyle: 'italic' }}>
                  Complete baseline evaluation circuit (Bijuli Tap, Target Tracker, Sound Sweeps) to generate personalized game prescriptions.
                </div>
              )}
            </div>
          </div>

          {/* Doctor's Targeted Consultation Questions */}
          <div
            className="neo-card"
            style={{
              background: '#fef9e7',
              border: '2px solid #1c1b1b',
              padding: '1.25rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.75rem' }}>
              <HelpCircle size={17} color="#b45309" />
              <span className="font-clash-bold" style={{ fontSize: '0.95rem', color: '#78350f', textTransform: 'uppercase' }}>
                Targeted Clinical Discussion Questions for Doctor
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {reportData.doctorDiscussionPrompts?.map((q: string, idx: number) => (
                <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                  <span className="neo-pill neo-pill-amber font-clash-bold" style={{ fontSize: '0.7rem', padding: '0.1rem 0.45rem', flexShrink: 0 }}>
                    Q{idx + 1}
                  </span>
                  <span className="font-clash-regular" style={{ fontSize: '0.86rem', color: '#451a03', lineHeight: 1.4 }}>
                    {q}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Multilingual Family Take-Home Note */}
          <div
            style={{
              background: '#f4f7f4',
              borderRadius: '12px',
              border: '2px dashed #1c1b1b',
              padding: '0.9rem 1.1rem',
            }}
          >
            <div className="font-clash-bold" style={{ fontSize: '0.82rem', color: '#214935', textTransform: 'uppercase', marginBottom: '0.25rem' }}>
              Family Take-Home Summary ({patient.primaryLanguage?.toUpperCase() || 'REGIONAL'})
            </div>
            <div className="font-clash-regular" style={{ fontSize: '0.88rem', color: '#1c1b1b', fontStyle: 'italic', lineHeight: 1.45 }}>
              "{reportData.caregiverHomeSlip}"
            </div>
          </div>
        </div>

        {/* Modal Bottom Actions */}
        <div
          className="no-print"
          style={{
            padding: '1rem 1.5rem',
            borderTop: '2px solid #1c1b1b',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#ffffff',
            gap: '0.75rem',
          }}
        >
          <button
            onClick={handleCopy}
            className="neo-pill font-clash-semibold"
            style={{
              cursor: 'pointer',
              height: '38px',
              padding: '0 1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              fontSize: '0.85rem',
            }}
          >
            {copied ? <Check size={16} color="#2e7d32" /> : <Copy size={16} />}
            <span>{copied ? 'Copied SBAR' : 'Copy SBAR Note'}</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <button
              onClick={handlePrint}
              className="neo-pill font-clash-semibold"
              style={{
                cursor: 'pointer',
                height: '38px',
                padding: '0 1rem',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                fontSize: '0.85rem',
              }}
            >
              <Printer size={16} />
              <span>Print Slip</span>
            </button>

            <button
              onClick={onClose}
              className="neo-card font-clash-semibold"
              style={{
                background: '#214935',
                color: '#ffffff',
                height: '38px',
                padding: '0 1.25rem',
                borderRadius: '10px',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.88rem',
                textTransform: 'uppercase',
              }}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
