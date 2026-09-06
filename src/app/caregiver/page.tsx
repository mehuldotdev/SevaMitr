'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Activity,
  Brain,
  AlertTriangle,
  Users,
  RefreshCw,
  PhoneCall,
  Zap,
  Target,
  Volume2,
  Play,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldAlert,
  Stethoscope,
  FileText,
  UserPlus,
} from 'lucide-react';
import { offlineDb, CognitiveSessionRecord, PatientProfile, DEFAULT_PATIENT } from '@/lib/db/offlineDb';
import { analyzePatientCognitiveData, CognitiveAnalysisResult } from '@/lib/ai/sundowningDetector';
import { CognitiveRadarChart } from '@/components/CognitiveRadarChart';
import { CircadianTimelineChart } from '@/components/CircadianTimelineChart';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth/AuthContext';
import { syncManager, SyncStatus } from '@/lib/sync/syncManager';
import { DoctorReportModal } from '@/components/DoctorReportModal';
import { RegisterPatientModal } from '@/components/RegisterPatientModal';

export default function CaregiverDashboardPage() {
  const router = useRouter();
  const { user, isLoggedIn, isLoading } = useAuth();
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [mounted, setMounted] = useState(false);
  const [sessions, setSessions] = useState<CognitiveSessionRecord[]>([]);
  const [analysis, setAnalysis] = useState<CognitiveAnalysisResult>(analyzePatientCognitiveData([]));
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(syncManager.getStatus());
  const [showDoctorReport, setShowDoctorReport] = useState<boolean>(false);
  const [showRegisterModal, setShowRegisterModal] = useState<boolean>(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const [patientsList, setPatientsList] = useState<any[]>([]);

  useEffect(() => {
    setMounted(true);
    if (!isLoading && !isLoggedIn) {
      router.replace('/');
      return;
    }
    if (isLoggedIn && user?.role === 'PATIENT') {
      router.replace('/patient');
      return;
    }

    if (!user) return;
    const isDemo = user.id === 'demo-caregiver-001';

    const loadSessions = (p: PatientProfile) => {
      const localSessions = offlineDb.getSessions(p.id);
      setSessions(localSessions);
      setAnalysis(analyzePatientCognitiveData(localSessions));

      if (p.id) {
        fetch(`/api/patients/${p.id}/sessions?caregiverId=${encodeURIComponent(user.id)}&t=${Date.now()}`, { cache: 'no-store' })
          .then((res) => res.json())
          .then((data) => {
            if (data.sessions && Array.isArray(data.sessions) && data.sessions.length > 0) {
              // Merge local + server sessions by ID without overwriting freshly played local sessions
              const localMap = new Map(localSessions.map((s) => [s.id, s]));
              data.sessions.forEach((srv: any) => {
                const cleanSrv: CognitiveSessionRecord = {
                  ...srv,
                  timestamp: srv.timestamp
                    ? Number(srv.timestamp)
                    : srv.clientSyncedAt
                    ? new Date(srv.clientSyncedAt).getTime()
                    : srv.createdAt
                    ? new Date(srv.createdAt).getTime()
                    : Date.now(),
                  synced: true,
                };
                if (!localMap.has(srv.id)) {
                  localMap.set(srv.id, cleanSrv);
                }
              });
              const merged = Array.from(localMap.values()).sort(
                (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
              );
              setSessions(merged);
              setAnalysis(analyzePatientCognitiveData(merged));
            }
          })
          .catch(() => {});
      }
    };

    // 1. Initial attempt: check local caregiver-scoped patient
    const localPatient = offlineDb.getPatient(user.id);
    if (localPatient) {
      setPatient(localPatient);
      loadSessions(localPatient);
    }

    // 2. Fetch scoped patient list from PostgreSQL/API (including any mobile-synced patients)
    const fetchUrl = isDemo
      ? `/api/patients?caregiverId=demo-caregiver-001&t=${Date.now()}`
      : `/api/patients?caregiverId=${encodeURIComponent(user.id)}&t=${Date.now()}`;

    fetch(fetchUrl, { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (data.patients && Array.isArray(data.patients) && data.patients.length > 0) {
          setPatientsList(data.patients);

          // Find if currently loaded local patient is in the list
          const existingMatch = data.patients.find((p: any) => p.id === localPatient?.id);

          // Find patient with most sessions
          const withSessions = [...data.patients].sort(
            (a: any, b: any) => (b.sessionsCount || 0) - (a.sessionsCount || 0)
          );
          const patientWithMostSessions = withSessions[0];

          // If local patient has 0 sessions or is not in list, but another patient has sessions, prefer the one with sessions!
          const shouldSwitchToBest =
            !existingMatch ||
            ((existingMatch.sessionsCount === 0 || existingMatch.sessionsCount === undefined) &&
              (patientWithMostSessions?.sessionsCount || 0) > 0);

          const target = shouldSwitchToBest ? patientWithMostSessions : (existingMatch || data.patients[0]);

          if (target) {
            setPatient(target);
            offlineDb.savePatient(target, user.id);
            loadSessions(target);
          }
        } else if (isDemo) {
          setPatient(DEFAULT_PATIENT);
          setPatientsList([DEFAULT_PATIENT]);
          loadSessions(DEFAULT_PATIENT);
        } else if (!localPatient) {
          setPatient(null);
          setSessions([]);
          setAnalysis(analyzePatientCognitiveData([]));
        }
      })
      .catch(() => {
        if (isDemo && !localPatient) {
          setPatient(DEFAULT_PATIENT);
          loadSessions(DEFAULT_PATIENT);
        }
      });

    // Auto-refresh when new games are saved
    const handleAutoReload = () => {
      const activeP = offlineDb.getPatient(user?.id) || localPatient || DEFAULT_PATIENT;
      loadSessions(activeP);
    };
    window.addEventListener('sevamitr_session_saved', handleAutoReload);
    window.addEventListener('storage', handleAutoReload);

    const unsubscribe = syncManager.subscribe(setSyncStatus);
    return () => {
      unsubscribe();
      window.removeEventListener('sevamitr_session_saved', handleAutoReload);
      window.removeEventListener('storage', handleAutoReload);
    };
  }, [isLoading, isLoggedIn, user, router]);

  const handleCopyPhone = (num = '9846198473') => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(num).catch(() => {});
    }
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2500);
    if (typeof window !== 'undefined' && /Mobi|Android|iPhone/i.test(navigator.userAgent)) {
      window.location.href = `tel:${num}`;
    }
  };

  const normId = (id?: string) => (id || '').toLowerCase().replace(/[-_]/g, '');

  const sortedSessions = [...sessions].sort(
    (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
  );

  const doubleDecisionSessions = sortedSessions.filter(
    (s) => normId(s.gameId) === 'doubledecision'
  );
  const soundSweepsSessions = sortedSessions.filter(
    (s) => normId(s.gameId) === 'soundsweeps'
  );
  const targetTrackerSessions = sortedSessions.filter(
    (s) => normId(s.gameId) === 'targettracker'
  );
  const bijuliSessions = sortedSessions.filter(
    (s) => normId(s.gameId) === 'bijulitap'
  );

  // Latest visual speed from most recent UFOV / reaction speed trial
  const latestVisualSpeed =
    doubleDecisionSessions.length > 0
      ? Math.round(doubleDecisionSessions[0].hesitationMs)
      : bijuliSessions.length > 0
      ? Math.round(bijuliSessions[0].hesitationMs)
      : null;

  // Latest auditory ISI from most recent pitch sweeps trial
  const latestAuditoryIsi =
    soundSweepsSessions.length > 0
      ? Math.round(soundSweepsSessions[0].hesitationMs)
      : null;

  const targetAccuracy =
    targetTrackerSessions.length > 0
      ? Math.round(targetTrackerSessions[0].score)
      : null;

  const hasSessions = sessions.length > 0;
  const caregiverDisplayName =
    patient?.caregiverName || (user?.fullName ? `${user.fullName}` : 'Primary Caregiver');
  const isNumericPhone = /\d{5,}/.test(patient?.emergencyContact || '');

  // Silent background prefetch for Doctor Report so clicking it is instant (0ms)
  useEffect(() => {
    if (!mounted || !patient) return;
    const timer = setTimeout(() => {
      fetch('/api/ai/clinical-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient,
          telemetry: {
            sightSpeedMs: latestVisualSpeed ?? undefined,
            soundSweepsMs: latestAuditoryIsi ?? undefined,
            targetTrackerScore: targetAccuracy ?? undefined,
            hesitationMs: sessions.length > 0 ? Math.round(sessions.reduce((acc, s) => acc + s.hesitationMs, 0) / sessions.length) : undefined,
            sessionsCount: sessions.length,
            sundowningDivergencePct: analysis.sundowning.hasEnoughData ? analysis.sundowning.latencyDivergencePct : undefined,
          },
          language: patient.primaryLanguage || 'en',
        }),
      }).catch(() => {});
    }, 1200);

    return () => clearTimeout(timer);
  }, [mounted, patient, latestVisualSpeed, latestAuditoryIsi, targetAccuracy, sessions.length, analysis.sundowning.latencyDivergencePct]);

  if (!mounted || isLoading || !isLoggedIn || user?.role === 'PATIENT') {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 74px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f4f7f4',
          padding: '1.5rem',
        }}
      >
        <div
          className="neo-card font-clash-semibold"
          style={{
            background: '#ffffff',
            padding: '2.25rem 2rem',
            textAlign: 'center',
            maxWidth: '420px',
            width: '100%',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '16px',
              background: '#faebe6',
              border: '2px solid #1c1b1b',
              boxShadow: '3px 3px 0px #1c1b1b',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#c85a32',
              margin: '0 auto 1.25rem',
            }}
          >
            <ShieldAlert size={28} />
          </div>
          <h2
            className="font-clash-bold"
            style={{ fontSize: '1.4rem', color: '#1c1b1b', margin: '0 0 0.5rem', textTransform: 'uppercase' }}
          >
            Login Required
          </h2>
          <p
            className="font-clash-regular"
            style={{ fontSize: '0.88rem', color: '#57534e', margin: '0 0 1.5rem', lineHeight: 1.4 }}
          >
            Clinical telemetries and cognitive tracking dashboards require authorized caregiver login.
          </p>
          <Link
            href="/"
            className="neo-card font-clash-semibold"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.45rem',
              background: '#214935',
              color: '#ffffff',
              textDecoration: 'none',
              padding: '0.75rem 1.25rem',
              borderRadius: '12px',
              textTransform: 'uppercase',
              fontSize: '0.92rem',
            }}
          >
            <span>Go to Login</span>
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: 'calc(100vh - 74px)', background: '#f4f7f4', padding: '2rem 1.25rem 5rem' }}>
      {!patient ? (
        <div style={{ maxWidth: '1060px', margin: '0 auto' }}>
          {/* Top Caregiver Header Card */}
          <div
            className="neo-card"
            style={{
              padding: '1.25rem 1.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.25rem',
              marginBottom: '1.75rem',
              background: '#ffffff',
            }}
          >
            <div>
              <h1
                className="font-clash-bold"
                style={{ fontSize: '1.65rem', fontWeight: 700, color: '#1c1b1b', margin: 0, textTransform: 'uppercase' }}
              >
                {user?.fullName || 'Caregiver Portal'}
              </h1>
              <div className="font-clash-regular" style={{ fontSize: '0.88rem', color: '#57534e', marginTop: '0.2rem' }}>
                {user?.identifier || 'Authorized Caregiver'} • {user?.region || 'North Eastern Region'}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setShowRegisterModal(true)}
                className="neo-pill font-clash-semibold"
                style={{
                  background: '#214935',
                  color: '#ffffff',
                  border: '2px solid #1c1b1b',
                  boxShadow: '2px 2px 0px #1c1b1b',
                  cursor: 'pointer',
                  padding: '0.45rem 0.95rem',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <UserPlus size={15} />
                <span>+ Register Patient</span>
              </button>
              <Link
                href="/caregiver/patients"
                className="neo-pill font-clash-semibold"
                style={{ background: '#ffffff', color: '#1c1b1b', textDecoration: 'none', padding: '0.45rem 0.95rem', fontSize: '0.92rem', fontWeight: 600, textTransform: 'uppercase' }}
              >
                <Users size={15} />
                <span>Directory</span>
              </Link>
            </div>
          </div>

          {/* Zero State Hero */}
          <div
            className="neo-card"
            style={{
              background: '#ffffff',
              padding: '3.5rem 2rem',
              textAlign: 'center',
              marginBottom: '2rem',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '18px',
                background: '#e8f5e9',
                border: '2px solid #1c1b1b',
                boxShadow: '3px 3px 0px #1c1b1b',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#214935',
                marginBottom: '1.25rem',
              }}
            >
              <UserPlus size={32} />
            </div>
            <h2
              className="font-clash-bold"
              style={{ fontSize: '1.65rem', color: '#1c1b1b', margin: '0 0 0.6rem', textTransform: 'uppercase' }}
            >
              No Patients Registered Yet
            </h2>
            <p
              className="font-clash-regular"
              style={{ fontSize: '1rem', color: '#57534e', maxWidth: '580px', margin: '0 auto 1.75rem', lineHeight: 1.55 }}
            >
              SevaMitr provides continuous cognitive biomarker monitoring, circadian drift analysis, and early sundowning detection. Register your loved one or elder under your care to begin telemetry tracking.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="neo-pill font-clash-bold"
                style={{
                  background: '#214935',
                  color: '#ffffff',
                  border: '2px solid #1c1b1b',
                  boxShadow: '2px 2px 0px #1c1b1b',
                  padding: '0.75rem 1.6rem',
                  fontSize: '0.95rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                <UserPlus size={18} />
                <span>+ Register Your First Patient</span>
              </button>
              <Link
                href="/caregiver/patients"
                className="neo-pill font-clash-semibold"
                style={{
                  background: '#ffffff',
                  color: '#1c1b1b',
                  border: '2px solid #1c1b1b',
                  boxShadow: '2px 2px 0px #1c1b1b',
                  padding: '0.75rem 1.4rem',
                  fontSize: '0.95rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                }}
              >
                <Users size={18} />
                <span>Open Patient Directory</span>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ maxWidth: '1060px', margin: '0 auto' }}>
          {/* Top Header Card (Neo-Brutalist Style, No Emojis) */}
          <div
            className="neo-card"
            style={{
              padding: '1.25rem 1.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.25rem',
              marginBottom: '1.75rem',
              background: '#ffffff',
            }}
          >
          {/* Patient Quick Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h1
                className="font-clash-bold"
                suppressHydrationWarning
                style={{ fontSize: '1.65rem', fontWeight: 700, color: '#1c1b1b', margin: 0, textTransform: 'uppercase' }}
              >
                {patient.fullName}
              </h1>
              <span className="neo-pill neo-pill-green font-clash-wide" suppressHydrationWarning style={{ fontSize: '0.68rem' }}>
                {patient.dementiaStage} STAGE
              </span>
            </div>
            <div className="font-clash-regular" suppressHydrationWarning style={{ fontSize: '0.88rem', color: '#57534e', marginTop: '0.2rem', fontWeight: 400 }}>
              {patient.age}y • {patient.region} • Caregiver: <strong>{caregiverDisplayName}</strong>
            </div>
            {patientsList.length > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.65rem', flexWrap: 'wrap' }}>
                <span className="font-clash-semibold" style={{ fontSize: '0.78rem', color: '#57534e', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                  Patient Profile:
                </span>
                <select
                  value={patient.id}
                  onChange={(e) => {
                    const sel = patientsList.find((p) => p.id === e.target.value);
                    if (sel) {
                      setPatient(sel);
                      offlineDb.savePatient(sel, user?.id);
                      const localSessions = offlineDb.getSessions(sel.id);
                      setSessions(localSessions);
                      setAnalysis(analyzePatientCognitiveData(localSessions));
                      fetch(`/api/patients/${sel.id}/sessions?caregiverId=${encodeURIComponent(user?.id || '')}&t=${Date.now()}`, { cache: 'no-store' })
                        .then((res) => res.json())
                        .then((data) => {
                          if (data.sessions && Array.isArray(data.sessions)) {
                            const localMap = new Map(localSessions.map((s) => [s.id, s]));
                            data.sessions.forEach((srv: any) => {
                              const cleanSrv: CognitiveSessionRecord = {
                                ...srv,
                                timestamp: srv.timestamp
                                  ? Number(srv.timestamp)
                                  : srv.clientSyncedAt
                                  ? new Date(srv.clientSyncedAt).getTime()
                                  : srv.createdAt
                                  ? new Date(srv.createdAt).getTime()
                                  : Date.now(),
                                synced: true,
                              };
                              localMap.set(srv.id, cleanSrv);
                            });
                            const merged = Array.from(localMap.values()).sort(
                              (a, b) => (b.timestamp || 0) - (a.timestamp || 0)
                            );
                            setSessions(merged);
                            setAnalysis(analyzePatientCognitiveData(merged));
                          }
                        })
                        .catch(() => {});
                    }
                  }}
                  className="font-clash-bold"
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '10px',
                    border: '2px solid #1c1b1b',
                    boxShadow: '2px 2px 0px #1c1b1b',
                    background: '#f4f7f4',
                    fontSize: '0.82rem',
                    color: '#1c1b1b',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  {patientsList.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.fullName} ({p.age}y - {p.sessionsCount ?? 0} sessions)
                    </option>
                  ))}
                </select>
                <Link
                  href="/caregiver/patients"
                  className="font-clash-semibold"
                  style={{
                    fontSize: '0.78rem',
                    color: '#214935',
                    textDecoration: 'underline',
                    marginLeft: '0.2rem',
                  }}
                >
                  Manage All
                </Link>
              </div>
            )}
          </div>

          {/* Action Pills */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setShowDoctorReport(true)}
              className="neo-pill neo-pill-terracotta font-clash-semibold"
              style={{
                cursor: 'pointer',
                padding: '0.45rem 0.95rem',
                fontSize: '0.92rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
              title="Generate AI Clinical Handover Sheet for Doctor"
            >
              <Stethoscope size={14} />
              <span>Doctor Handover</span>
            </button>

            <button
              type="button"
              onClick={() => setShowRegisterModal(true)}
              className="neo-pill font-clash-semibold"
              style={{
                background: '#214935',
                color: '#ffffff',
                border: '2px solid #1c1b1b',
                boxShadow: '2px 2px 0px #1c1b1b',
                cursor: 'pointer',
                padding: '0.45rem 0.95rem',
                fontSize: '0.92rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
              title="Register a new patient under your caregiver account"
            >
              <UserPlus size={14} />
              <span>+ Add Patient</span>
            </button>

            <Link
              href="/caregiver/patients"
              className="neo-pill font-clash-semibold"
              style={{ background: '#ffffff', color: '#1c1b1b', textDecoration: 'none', padding: '0.45rem 0.95rem', fontSize: '0.92rem', fontWeight: 600, textTransform: 'uppercase' }}
            >
              <Users size={15} />
              <span>Switch</span>
            </Link>

            <button
              type="button"
              onClick={() => handleCopyPhone('9846198473')}
              className="neo-pill font-clash-semibold"
              style={{
                background: '#fee2e2',
                color: '#991b1b',
                border: '1.5px solid #1c1b1b',
                cursor: 'pointer',
                padding: '0.45rem 0.95rem',
                fontSize: '0.92rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
              title="Click to copy emergency call number 9846198473"
            >
              <PhoneCall size={14} />
              <span>{copiedPhone ? 'Copied 9846198473!' : 'Emergency Call: 9846198473'}</span>
            </button>
          </div>
        </div>

        {/* Hero Glance Banner */}
        {!hasSessions ? (
          <div
            className="neo-card"
            style={{
              padding: '1.5rem 1.75rem',
              marginBottom: '1.75rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: '1.25rem',
              background: '#ffffff',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div
                style={{
                  width: '50px',
                  height: '50px',
                  borderRadius: '14px',
                  background: '#f0bc93',
                  border: '2px solid #1c1b1b',
                  boxShadow: '2px 2px 0px #1c1b1b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#432406',
                  flexShrink: 0,
                }}
              >
                <Clock size={24} />
              </div>
              <div>
                <div className="font-clash-bold" style={{ fontSize: '1.18rem', fontWeight: 700, color: '#1c1b1b', textTransform: 'uppercase' }}>
                  Baseline Assessment Needed
                </div>
                <div className="font-clash-regular" style={{ fontSize: '0.85rem', color: '#57534e', marginTop: '0.1rem', fontWeight: 400 }}>
                  Initial 3-minute screening.
                </div>
              </div>
            </div>

            <Link
              href="/patient"
              className="neo-pill neo-pill-terracotta font-clash-semibold"
              style={{
                padding: '0.65rem 1.35rem',
                fontSize: '0.95rem',
                fontWeight: 600,
                textDecoration: 'none',
                cursor: 'pointer',
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
              }}
            >
              <Play size={16} fill="#1c1b1b" />
              <span>Start</span>
              <ArrowUpRight size={16} />
            </Link>
          </div>
        ) : (
          <div
            className="neo-card"
            style={{
              padding: '1.5rem 1.75rem',
              marginBottom: '1.75rem',
              background: '#ffffff',
            }}
          >
            {/* Status Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background: analysis.sundowning.detected ? '#fee2e2' : '#c0edd1',
                    border: '2px solid #1c1b1b',
                    boxShadow: '2px 2px 0px #1c1b1b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: analysis.sundowning.detected ? '#991b1b' : '#073220',
                    flexShrink: 0,
                  }}
                >
                  {analysis.sundowning.detected ? <ShieldAlert size={22} /> : <CheckCircle2 size={22} />}
                </div>
                <div>
                  <div className="font-clash-bold" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1c1b1b', textTransform: 'uppercase' }}>
                    {analysis.sundowning.detected ? 'Evening Divergence' : 'Trajectory Stable'}
                  </div>
                  <div className="font-clash-regular" style={{ fontSize: '0.82rem', color: '#57534e', fontWeight: 400 }}>
                    {sessions.length} sessions logged
                  </div>
                </div>
              </div>

              <Link
                href="/patient"
                className="neo-pill neo-pill-green font-clash-semibold"
                style={{
                  padding: '0.5rem 1.15rem',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <Play size={15} fill="#073220" />
                <span>Launch</span>
                <ArrowUpRight size={15} />
              </Link>
            </div>

            {/* 4 Clean Metric Cards (High Contrast, Clash Display Typography) */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
                gap: '1.25rem',
                alignItems: 'stretch',
              }}
            >
              {/* Metric 1: DCI */}
              <div
                className="neo-card"
                style={{ padding: '1.15rem', background: '#fcf9f8', boxShadow: '2px 2px 0px #1c1b1b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', boxSizing: 'border-box' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '24px' }}>
                  <span className="font-clash-wide" style={{ fontSize: '0.72rem', color: '#57534e' }}>
                    COGNITIVE SCORE
                  </span>
                  <span className="neo-pill neo-pill-green font-clash-wide" style={{ fontSize: '0.65rem', padding: '0.12rem 0.45rem' }}>
                    +4.2%
                  </span>
                </div>
                <div className="font-clash-metric" style={{ fontSize: '2.1rem', color: '#1c1b1b', margin: '0.35rem 0 0.15rem' }}>
                  {analysis.overallDci !== null ? `${analysis.overallDci}` : '--'}
                  <span style={{ fontSize: '0.95rem', color: '#57534e', fontWeight: 500 }}>/100</span>
                </div>
                <div className="font-clash-medium" style={{ fontSize: '0.82rem', color: '#073220', fontWeight: 500 }}>
                  Stable Baseline
                </div>
              </div>

              {/* Metric 2: UFOV Speed */}
              <div
                className="neo-card"
                style={{ padding: '1.15rem', background: '#fcf9f8', boxShadow: '2px 2px 0px #1c1b1b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', boxSizing: 'border-box' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '24px' }}>
                  <span className="font-clash-wide" style={{ fontSize: '0.72rem', color: '#57534e' }}>
                    VISUAL SPEED
                  </span>
                  <span className="neo-pill neo-pill-terracotta font-clash-wide" style={{ fontSize: '0.65rem', padding: '0.12rem 0.45rem' }}>
                    UFOV
                  </span>
                </div>
                <div className="font-clash-metric" style={{ fontSize: '2.1rem', color: '#1c1b1b', margin: '0.35rem 0 0.15rem' }}>
                  {latestVisualSpeed !== null ? `${latestVisualSpeed}` : '--'}
                  <span style={{ fontSize: '0.95rem', color: '#57534e', fontWeight: 500 }}> ms</span>
                </div>
                <div className="font-clash-regular" style={{ fontSize: '0.82rem', color: '#57534e', fontWeight: 400 }}>
                  Central & Edge
                </div>
              </div>

              {/* Metric 3: Auditory Sweep */}
              <div
                className="neo-card"
                style={{ padding: '1.15rem', background: '#fcf9f8', boxShadow: '2px 2px 0px #1c1b1b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', boxSizing: 'border-box' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '24px' }}>
                  <span className="font-clash-wide" style={{ fontSize: '0.72rem', color: '#57534e' }}>
                    AUDITORY ISI
                  </span>
                  <span className="neo-pill neo-pill-amber font-clash-wide" style={{ fontSize: '0.65rem', padding: '0.12rem 0.45rem' }}>
                    AUDIO
                  </span>
                </div>
                <div className="font-clash-metric" style={{ fontSize: '2.1rem', color: '#1c1b1b', margin: '0.35rem 0 0.15rem' }}>
                  {latestAuditoryIsi !== null ? `${latestAuditoryIsi}` : '--'}
                  <span style={{ fontSize: '0.95rem', color: '#57534e', fontWeight: 500 }}> ms</span>
                </div>
                <div className="font-clash-regular" style={{ fontSize: '0.82rem', color: '#57534e', fontWeight: 400 }}>
                  Pitch Sweeps
                </div>
              </div>

              {/* Metric 4: Attention */}
              <div
                className="neo-card"
                style={{ padding: '1.15rem', background: '#fcf9f8', boxShadow: '2px 2px 0px #1c1b1b', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', boxSizing: 'border-box' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '24px' }}>
                  <span className="font-clash-wide" style={{ fontSize: '0.72rem', color: '#57534e' }}>
                    ATTENTION
                  </span>
                  <span className="neo-pill neo-pill-green font-clash-wide" style={{ fontSize: '0.65rem', padding: '0.12rem 0.45rem' }}>
                    TRACK
                  </span>
                </div>
                <div className="font-clash-metric" style={{ fontSize: '2.1rem', color: '#1c1b1b', margin: '0.35rem 0 0.15rem' }}>
                  {targetAccuracy !== null ? `${targetAccuracy}%` : '--'}
                </div>
                <div className="font-clash-regular" style={{ fontSize: '0.82rem', color: '#57534e', fontWeight: 400 }}>
                  Target Tracking
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Charts Grid */}
        {hasSessions && (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))',
              gap: '1.5rem',
              marginBottom: '1.75rem',
              alignItems: 'stretch',
            }}
          >
            {/* Cognitive Domain Radar */}
            <div
              className="neo-card"
              style={{
                padding: '1.5rem',
                background: '#ffffff',
                height: '100%',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', height: '28px' }}>
                <h2 className="font-clash-bold" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1c1b1b', margin: 0, textTransform: 'uppercase' }}>
                  Domain Radar (MoCA)
                </h2>
                <span className="neo-pill neo-pill-green font-clash-wide" style={{ fontSize: '0.68rem' }}>
                  5 AXES
                </span>
              </div>
              <CognitiveRadarChart scores={analysis.domainScores} />
            </div>

            {/* Sun-downing Timeline */}
            <div
              className="neo-card"
              style={{
                padding: '1.5rem',
                background: '#ffffff',
                height: '100%',
                boxSizing: 'border-box',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', height: '28px' }}>
                <h2 className="font-clash-bold" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1c1b1b', margin: 0, textTransform: 'uppercase' }}>
                  Circadian Timeline
                </h2>
                <span className="neo-pill neo-pill-amber font-clash-wide" style={{ fontSize: '0.68rem' }}>
                  AM vs PM
                </span>
              </div>
              <CircadianTimelineChart
                morningLatencyMs={analysis.sundowning.morningAvgLatencyMs}
                eveningLatencyMs={analysis.sundowning.eveningAvgLatencyMs}
                morningScore={analysis.sundowning.morningAvgScore}
                eveningScore={analysis.sundowning.eveningAvgScore}
                divergencePct={analysis.sundowning.latencyDivergencePct}
                sundowningDetected={analysis.sundowning.detected}
              />
            </div>
          </div>
        )}

        {/* Recent Activity Feed (No Emojis) */}
        <div
          className="neo-card"
          style={{
            padding: '1.5rem',
            background: '#ffffff',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', height: '28px' }}>
            <h2 className="font-clash-bold" style={{ fontSize: '1.15rem', fontWeight: 700, color: '#1c1b1b', margin: 0, textTransform: 'uppercase' }}>
              Activity Feed
            </h2>
            <span className="neo-pill font-clash-wide" style={{ background: '#f4f7f4', fontSize: '0.68rem' }}>
              {sessions.length} SESSIONS
            </span>
          </div>

          {!hasSessions ? (
            <div className="font-clash-regular" style={{ textAlign: 'center', padding: '2rem 1rem', color: '#57534e', fontSize: '0.95rem' }}>
              No activities logged yet.
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {sessions.slice(0, 10).map((s) => {
                const dateVal = s.timestamp ? new Date(Number(s.timestamp)) : new Date();
                const dateStr = !isNaN(dateVal.getTime())
                  ? dateVal.toLocaleDateString('en-IN', {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })
                  : 'Recent session';

                const getGameIcon = () => {
                  if (s.gameId.includes('decision')) return <Zap size={18} />;
                  if (s.gameId.includes('sound')) return <Volume2 size={18} />;
                  if (s.gameId.includes('target')) return <Target size={18} />;
                  return <Brain size={18} />;
                };

                return (
                  <div
                    key={s.id}
                    className="neo-card"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.85rem 1.15rem',
                      background: '#fcf9f8',
                      boxShadow: '2px 2px 0px #1c1b1b',
                      gap: '1rem',
                    }}
                  >
                    {/* Time & Game Name */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div
                        style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '10px',
                          background: s.score >= 75 ? '#c0edd1' : '#f0bc93',
                          border: '2px solid #1c1b1b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: s.score >= 75 ? '#073220' : '#432406',
                          flexShrink: 0,
                        }}
                      >
                        {getGameIcon()}
                      </div>
                      <div>
                        <div className="font-clash-bold" style={{ fontSize: '1.1rem', fontWeight: 700, color: '#1c1b1b', textTransform: 'uppercase' }}>
                          {s.gameTitle}
                        </div>
                        <div className="font-clash-regular" style={{ fontSize: '0.78rem', color: '#57534e', marginTop: '0.1rem', fontWeight: 400 }}>
                          {dateStr} • {s.timeOfDay.toUpperCase()}
                        </div>
                      </div>
                    </div>

                    {/* Score & Latency */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', textAlign: 'right' }}>
                      <div>
                        <div className="font-clash-metric" style={{ fontSize: '1.4rem', color: s.score >= 75 ? '#073220' : '#a23e18' }}>
                          {s.score}%
                        </div>
                        <div className="font-clash-regular" style={{ fontSize: '0.75rem', color: '#57534e', fontWeight: 400 }}>
                          {(s.hesitationMs / 1000).toFixed(2)}s
                        </div>
                      </div>

                      <span
                        className={`neo-pill font-clash-wide ${s.synced ? 'neo-pill-green' : 'neo-pill-amber'}`}
                        style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}
                      >
                        {s.synced ? 'SYNCED' : 'LOCAL'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
      )}

      {/* AI Clinical Handover Sheet Modal */}
      {patient && (
        <DoctorReportModal
          isOpen={showDoctorReport}
          onClose={() => setShowDoctorReport(false)}
          patient={patient}
          telemetry={{
            sightSpeedMs: latestVisualSpeed ?? undefined,
            soundSweepsMs: latestAuditoryIsi ?? undefined,
            targetTrackerScore: targetAccuracy ?? undefined,
            hesitationMs: sessions.length > 0 ? Math.round(sessions.reduce((acc, s) => acc + s.hesitationMs, 0) / sessions.length) : undefined,
            sessionsCount: sessions.length,
            sundowningDivergencePct: analysis.sundowning.hasEnoughData ? analysis.sundowning.latencyDivergencePct : undefined,
          }}
        />
      )}

      {/* Register New Patient Modal */}
      <RegisterPatientModal
        isOpen={showRegisterModal}
        onClose={() => setShowRegisterModal(false)}
        onPatientRegistered={(newPatient) => {
          setPatient(newPatient);
          offlineDb.savePatient(newPatient, user?.id);
          const localSessions = offlineDb.getSessions(newPatient.id);
          setSessions(localSessions);
          setAnalysis(analyzePatientCognitiveData(localSessions));
        }}
      />
    </div>
  );
}
