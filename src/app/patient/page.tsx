'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Play,
  PhoneCall,
  Zap,
  Target,
  Brain,
  Sparkles,
  Volume2,
  Home,
  CheckCircle2,
  Clock,
  ShieldAlert,
  ArrowRight,
  Sun,
  Heart,
  Stethoscope,
  FileText,
  Compass,
  Bell,
  Eye,
} from 'lucide-react';
import { offlineDb, PatientProfile, DEFAULT_PATIENT } from '@/lib/db/offlineDb';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { DoctorReportModal } from '@/components/DoctorReportModal';

export default function PatientHomePage() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const [patient, setPatient] = useState<PatientProfile>(DEFAULT_PATIENT);
  const [mounted, setMounted] = useState(false);
  const { language, t } = useLanguage();
  const [activeNav, setActiveNav] = useState<'games' | 'kiosk'>('games');
  const [showDoctorModal, setShowDoctorModal] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    setPatient(offlineDb.getPatient());
    if (!isLoading && !isLoggedIn) {
      router.push('/');
    }
  }, [isLoading, isLoggedIn, router]);

  // Silent background prefetch for Doctor Report so clicking it opens instantly (0ms)
  useEffect(() => {
    if (!mounted || !patient) return;
    const timer = setTimeout(() => {
      fetch('/api/ai/clinical-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient,
          telemetry: {
            sightSpeedMs: 220,
            soundSweepsMs: 95,
            targetTrackerScore: 82,
            hesitationMs: 1450,
            sessionsCount: 3,
            sundowningDivergencePct: 14,
          },
          language: patient.primaryLanguage || 'en',
        }),
      }).catch(() => {});
    }, 1200);

    return () => clearTimeout(timer);
  }, [mounted, patient]);

  const brainHqExercises = [
    {
      id: 'double-decision',
      title: 'Sight Speed',
      categoryTag: 'VISUAL UFOV',
      tagColorClass: 'neo-pill-terracotta',
      metricTag: '50-450ms',
      icon: <Zap size={38} strokeWidth={2.3} />,
      href: '/patient/games/double-decision',
      badgeBg: '#e8f5e9',
      accentColor: '#214935',
    },
    {
      id: 'sound-sweeps',
      title: 'Sound Sweeps',
      categoryTag: 'AUDITORY',
      tagColorClass: 'neo-pill-amber',
      metricTag: 'Binaural',
      icon: <Volume2 size={38} strokeWidth={2.3} />,
      href: '/patient/games/sound-sweeps',
      badgeBg: '#e3f2fd',
      accentColor: '#0f4c81',
    },
    {
      id: 'target-tracker',
      title: 'Target Tracker',
      categoryTag: 'ATTENTION',
      tagColorClass: 'neo-pill-green',
      metricTag: 'Multi-Object',
      icon: <Target size={38} strokeWidth={2.3} />,
      href: '/patient/games/target-tracker',
      badgeBg: '#fff3e0',
      accentColor: '#c85a32',
    },
    {
      id: 'speed-maze',
      title: 'Speed Maze',
      categoryTag: 'SPATIAL SPEED',
      tagColorClass: 'neo-pill-purple',
      metricTag: 'Visuomotor',
      icon: <Compass size={38} strokeWidth={2.3} />,
      href: '/patient/games/speed-maze',
      badgeBg: '#f3e8ff',
      accentColor: '#6b21a8',
    },
    {
      id: 'bijuli-tap',
      title: 'Bijuli Tap',
      categoryTag: 'REACTION SPEED',
      tagColorClass: 'neo-pill-amber',
      metricTag: '150-400ms SRT',
      icon: <Bell size={38} strokeWidth={2.3} />,
      href: '/patient/games/bijuli-tap',
      badgeBg: '#fef3c7',
      accentColor: '#b45309',
    },
    {
      id: 'bikhama-khoj',
      title: 'Odd One Out',
      categoryTag: 'VISUAL SEARCH',
      tagColorClass: 'neo-pill-green',
      metricTag: 'Search Speed',
      icon: <Eye size={38} strokeWidth={2.3} />,
      href: '/patient/games/bikhama-khoj',
      badgeBg: '#e0f2fe',
      accentColor: '#0369a1',
    },
  ];

  const firstName = (patient?.fullName ? patient.fullName.split(' ')[0] : 'Mridula');

  // Auth restriction guard for logged-out visitors
  if (!mounted || isLoading || !isLoggedIn) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 74px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem 1rem',
          background: '#f4f7f4',
        }}
      >
        <div
          className="neo-card"
          style={{
            background: '#ffffff',
            padding: '2.25rem 1.75rem',
            maxWidth: '440px',
            width: '100%',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: '#fee2e2',
              border: '2px solid #1c1b1b',
              boxShadow: '3px 3px 0px #1c1b1b',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#991b1b',
              margin: '0 auto 1.25rem',
            }}
          >
            <ShieldAlert size={28} />
          </div>

          <h2
            className="font-clash-bold"
            style={{
              fontSize: '1.45rem',
              fontWeight: 700,
              textTransform: 'uppercase',
              color: '#1c1b1b',
              margin: '0 0 0.5rem',
            }}
          >
            Authentication Required
          </h2>

          <p
            className="font-clash-regular"
            style={{
              fontSize: '0.92rem',
              color: '#57534e',
              lineHeight: 1.5,
              margin: '0 0 1.5rem',
            }}
          >
            Please sign in to access the Patient Kiosk exercises and games.
          </p>

          <Link
            href="/"
            className="neo-card font-clash-semibold"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              width: '100%',
              padding: '0.75rem 1rem',
              background: '#214935',
              color: '#ffffff',
              textDecoration: 'none',
              textTransform: 'uppercase',
              fontSize: '0.95rem',
              borderRadius: '12px',
            }}
          >
            <span>Return to Log In</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 74px)',
        background: '#f4f7f4',
        padding: '1.75rem 1.25rem 6.5rem',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ maxWidth: '1040px', width: '100%' }}>
        {/* VIEW 1: GAMES SECTION (activeNav === 'games') */}
        {activeNav === 'games' && (
          <>
            {/* Header Bar */}
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.25rem',
                marginBottom: '1.75rem',
              }}
            >
              {/* Greeting */}
              <h1
                className="font-clash-bold"
                suppressHydrationWarning
                style={{
                  fontSize: 'clamp(1.6rem, 3.2vw, 2.15rem)',
                  fontWeight: 700,
                  color: '#1c1b1b',
                  margin: 0,
                  lineHeight: 1,
                  letterSpacing: '-0.015em',
                  textTransform: 'uppercase',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                Hello, {firstName}
              </h1>

              {/* Speed Trials Badge & Doctor Handover Action */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                <div
                  className="neo-pill font-clash-wide"
                  style={{
                    background: '#214935',
                    color: '#ffffff',
                    height: '42px',
                    padding: '0 1.25rem',
                    border: '2px solid #1c1b1b',
                    boxShadow: '3px 3px 0px #1c1b1b',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    borderRadius: '9999px',
                    letterSpacing: '0.03em',
                  }}
                >
                  <Brain size={18} />
                  <span>SPEED TRIALS SUITE (6 EXERCISES)</span>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDoctorModal(true)}
                  className="neo-pill font-clash-semibold"
                  style={{
                    background: '#ffffff',
                    color: '#1c1b1b',
                    padding: '0 1.1rem',
                    height: '42px',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    border: '2px solid #1c1b1b',
                    boxShadow: '3px 3px 0px #1c1b1b',
                    borderRadius: '9999px',
                  }}
                  title="Generate Doctor Handover Slip"
                >
                  <Stethoscope size={16} color="#214935" />
                  <span>Doctor Handover</span>
                </button>
              </div>
            </div>

            {/* BrainHQ Speed Trials 6 Cards Grid */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.75rem',
                marginBottom: '2rem',
                alignItems: 'stretch',
              }}
            >
                {brainHqExercises.map((ex) => (
                  <div
                    key={ex.id}
                    className="neo-card"
                    style={{
                      padding: '1.5rem',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      background: '#ffffff',
                      minHeight: '295px',
                      height: '100%',
                      boxSizing: 'border-box',
                    }}
                  >
                    {/* Top Card Tabs (Uniform 28px height, no text wrap) */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '28px', marginBottom: '1.25rem', gap: '0.5rem' }}>
                      <div
                        className={`neo-pill ${ex.tagColorClass}`}
                        style={{
                          height: '28px',
                          padding: '0 0.65rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          whiteSpace: 'nowrap',
                          boxSizing: 'border-box',
                        }}
                      >
                        <span className="font-clash-wide" style={{ fontSize: '0.68rem', letterSpacing: '0.04em' }}>{ex.categoryTag}</span>
                      </div>
                      <span
                        className="neo-pill font-clash-wide"
                        style={{
                          background: '#f4f7f4',
                          fontSize: '0.66rem',
                          color: '#57534e',
                          height: '28px',
                          padding: '0 0.65rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          whiteSpace: 'nowrap',
                          boxSizing: 'border-box',
                        }}
                      >
                        {ex.metricTag}
                      </span>
                    </div>

                    {/* Main Content (Aligned Icon & Single-Line Title) */}
                    <div style={{ textAlign: 'center', margin: '0.5rem 0 1.25rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <div
                        style={{
                          width: '74px',
                          height: '74px',
                          margin: '0 0 0.85rem',
                          borderRadius: '20px',
                          background: ex.badgeBg,
                          border: '2px solid #1c1b1b',
                          boxShadow: '3px 3px 0px #1c1b1b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: ex.accentColor,
                        }}
                      >
                        {ex.icon}
                      </div>

                      <h2
                        className="font-clash-bold"
                        style={{
                          fontSize: 'clamp(1.22rem, 2.1vw, 1.38rem)',
                          fontWeight: 700,
                          color: '#1c1b1b',
                          margin: 0,
                          lineHeight: 1,
                          textTransform: 'uppercase',
                          whiteSpace: 'nowrap',
                          height: '36px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {ex.title}
                      </h2>
                    </div>

                    {/* Tactile Action Duo (Equal 50px height alignment) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', width: '100%', height: '50px' }}>
                      <Link
                        href={ex.href}
                        className="font-clash-semibold"
                        style={{
                          flex: 1,
                          background: ex.accentColor,
                          color: '#ffffff',
                          height: '50px',
                          minHeight: '50px',
                          borderRadius: '14px',
                          border: '2px solid #1c1b1b',
                          boxShadow: '3px 3px 0px #1c1b1b',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.5rem',
                          fontSize: '1.05rem',
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          textDecoration: 'none',
                          letterSpacing: '0.02em',
                          transition: 'all 0.15s ease',
                          boxSizing: 'border-box',
                        }}
                      >
                        <Play size={16} fill="#ffffff" />
                        <span>Play</span>
                      </Link>

                      <Link
                        href={ex.href}
                        className="neo-fab-circle"
                        style={{
                          background: ex.accentColor,
                          width: '50px',
                          height: '50px',
                          minWidth: '50px',
                          minHeight: '50px',
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          boxSizing: 'border-box',
                        }}
                        aria-label={`Launch ${ex.title}`}
                      >
                        <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>↗</span>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
          </>
        )}

        {/* VIEW 2: KIOSK OVERVIEW (activeNav === 'kiosk') */}
        {activeNav === 'kiosk' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', marginBottom: '2rem' }}>
            {/* Welcoming Kiosk Hero Card */}
            <div
              className="neo-card"
              style={{
                background: '#ffffff',
                padding: '2rem 1.75rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '1.5rem',
              }}
            >
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  <Sun size={20} color="#b8860b" />
                  <span className="font-clash-wide" style={{ fontSize: '0.78rem', color: '#78716c' }}>
                    PATIENT KIOSK PORTAL
                  </span>
                </div>
                <h1
                  className="font-clash-bold"
                  style={{
                    fontSize: 'clamp(1.75rem, 3.5vw, 2.4rem)',
                    fontWeight: 700,
                    color: '#1c1b1b',
                    margin: '0 0 0.4rem',
                    textTransform: 'uppercase',
                    lineHeight: 1.1,
                  }}
                >
                  Namaste, {firstName}
                </h1>
                <p className="font-clash-regular" style={{ fontSize: '0.95rem', color: '#57534e', margin: 0 }}>
                  Ready for today's cognitive training session?
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveNav('games')}
                className="neo-card font-clash-semibold"
                style={{
                  background: '#214935',
                  color: '#ffffff',
                  padding: '0.9rem 1.75rem',
                  borderRadius: '14px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  cursor: 'pointer',
                  border: '2px solid #1c1b1b',
                  boxShadow: '4px 4px 0px #1c1b1b',
                }}
              >
                <Brain size={20} />
                <span>Go to Games</span>
              </button>
            </div>

            {/* Quick Access Dual Panels */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
              {/* Card 1: Speed Trials Direct Launch */}
              <div
                className="neo-card"
                style={{
                  background: '#ffffff',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '190px',
                }}
              >
                <div>
                  <span className="neo-pill neo-pill-terracotta font-clash-wide" style={{ fontSize: '0.68rem', marginBottom: '0.75rem', display: 'inline-block' }}>
                    EXERCISES
                  </span>
                  <h3 className="font-clash-bold" style={{ fontSize: '1.3rem', color: '#1c1b1b', margin: '0 0 0.35rem', textTransform: 'uppercase' }}>
                    BrainHQ Speed Trials
                  </h3>
                  <p className="font-clash-regular" style={{ fontSize: '0.86rem', color: '#57534e', margin: 0 }}>
                    Visual UFOV, sound sweeps, and multi-object attention games.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setActiveNav('games');
                  }}
                  className="neo-card font-clash-semibold"
                  style={{
                    background: '#214935',
                    color: '#ffffff',
                    padding: '0.65rem 1rem',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    fontSize: '0.92rem',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    marginTop: '1.25rem',
                  }}
                >
                  <Play size={15} fill="#ffffff" />
                  <span>Start Exercises</span>
                </button>
              </div>

              {/* Card 2: Caregiver Contact & Support */}
              <div
                className="neo-card"
                style={{
                  background: '#ffffff',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '190px',
                }}
              >
                <div>
                  <span className="neo-pill neo-pill-amber font-clash-wide" style={{ fontSize: '0.68rem', marginBottom: '0.75rem', display: 'inline-block' }}>
                    CAREGIVER
                  </span>
                  <h3 className="font-clash-bold" style={{ fontSize: '1.3rem', color: '#1c1b1b', margin: '0 0 0.35rem', textTransform: 'uppercase' }}>
                    {patient.caregiverName || 'Anuradha Baruah'}
                  </h3>
                  <p className="font-clash-regular" style={{ fontSize: '0.86rem', color: '#57534e', margin: 0 }}>
                    Primary caregiver assistance & emergency hotline.
                  </p>
                </div>

                <a
                  href={`tel:${patient.caregiverPhone}`}
                  className="neo-card font-clash-semibold"
                  style={{
                    background: '#faebe6',
                    color: '#432406',
                    padding: '0.65rem 1rem',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    fontSize: '0.92rem',
                    textTransform: 'uppercase',
                    textDecoration: 'none',
                    marginTop: '1.25rem',
                  }}
                >
                  <PhoneCall size={15} />
                  <span>Call {patient.caregiverPhone || '+91 94350 98765'}</span>
                </a>
              </div>

              {/* Card 3: Doctor Handover Report */}
              <div
                className="neo-card"
                style={{
                  background: '#ffffff',
                  padding: '1.5rem',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '190px',
                }}
              >
                <div>
                  <span className="neo-pill neo-pill-green font-clash-wide" style={{ fontSize: '0.68rem', marginBottom: '0.75rem', display: 'inline-block' }}>
                    CLINICAL SBAR
                  </span>
                  <h3 className="font-clash-bold" style={{ fontSize: '1.3rem', color: '#1c1b1b', margin: '0 0 0.35rem', textTransform: 'uppercase' }}>
                    Doctor Handover Slip
                  </h3>
                  <p className="font-clash-regular" style={{ fontSize: '0.86rem', color: '#57534e', margin: 0 }}>
                    Auto-synthesizes waiting room psychophysics into an SBAR handover for the doctor.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDoctorModal(true)}
                  className="neo-card font-clash-semibold"
                  style={{
                    background: '#214935',
                    color: '#ffffff',
                    padding: '0.65rem 1rem',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.45rem',
                    fontSize: '0.92rem',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    marginTop: '1.25rem',
                  }}
                >
                  <Stethoscope size={15} />
                  <span>View Doctor Sheet</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Floating Pill Navigation Dock (Zero Emojis, Pure Icons, Aligned Active State) */}
      <nav className="neo-bottom-dock font-clash-semibold" aria-label="Quick Patient Navigation">
        <button
          type="button"
          onClick={() => setActiveNav('kiosk')}
          className={`neo-dock-btn ${activeNav === 'kiosk' ? 'active' : ''}`}
        >
          <Home size={18} />
          <span>Kiosk</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveNav('games')}
          className={`neo-dock-btn ${activeNav === 'games' ? 'active' : ''}`}
        >
          <Brain size={18} />
          <span>Games</span>
        </button>

        <a
          href={`tel:${patient.caregiverPhone}`}
          suppressHydrationWarning
          className="neo-dock-btn"
          style={{ background: '#fee2e2', color: '#991b1b', border: '2px solid #1c1b1b' }}
        >
          <PhoneCall size={18} />
          <span>Emergency</span>
        </a>
      </nav>

      {/* Clinical Handover Report Modal */}
      <DoctorReportModal
        isOpen={showDoctorModal}
        onClose={() => setShowDoctorModal(false)}
        patient={patient}
      />
    </div>
  );
}
