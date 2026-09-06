'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
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
  UserPlus,
  Loader2,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { brainHqAudio } from '@/lib/audio/brainHqAudio';
import { offlineDb, PatientProfile, DEFAULT_PATIENT } from '@/lib/db/offlineDb';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { DoctorReportModal } from '@/components/DoctorReportModal';

function PatientPageContent() {
  const { user, isLoggedIn, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialView = searchParams.get('view') === 'games' ? 'games' : 'home';
  const [patient, setPatient] = useState<PatientProfile | null>(null);
  const [checkingPatient, setCheckingPatient] = useState(true);
  const [mounted, setMounted] = useState(false);
  const { language, t } = useLanguage();
  const [activeNav, setActiveNav] = useState<'games' | 'home'>(initialView);
  const [showDoctorModal, setShowDoctorModal] = useState<boolean>(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Add Patient Form state
  const [formName, setFormName] = useState('');
  const [formAge, setFormAge] = useState<number | ''>(72);
  const [formGender, setFormGender] = useState<'Female' | 'Male' | 'Other'>('Female');
  const [formRegion, setFormRegion] = useState('Kamrup Rural, Assam');
  const [formLanguage, setFormLanguage] = useState<'as' | 'bn' | 'hi' | 'en'>('en');
  const [formStage, setFormStage] = useState<'MCI' | 'Mild' | 'Moderate'>('Mild');
  const [formEmergency, setFormEmergency] = useState('+91 94350 12345');
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const v = searchParams.get('view');
    if (v === 'games') {
      setActiveNav('games');
    } else if (v === 'home') {
      setActiveNav('home');
    }
  }, [searchParams]);

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

  useEffect(() => {
    setMounted(true);
    if (!isLoading && !isLoggedIn) {
      router.push('/');
      return;
    }

    if (isLoggedIn && user) {
      if (user.region) {
        setFormRegion(user.region);
      }
      if (user.identifier && user.identifier.startsWith('+')) {
        setFormEmergency(user.identifier);
      }

      // 1. If user is demo patient or has PATIENT role
      if (user.role === 'PATIENT' || user.identifier === 'bhaben') {
        const p = offlineDb.getPatient() || DEFAULT_PATIENT;
        setPatient(p);
        setCheckingPatient(false);
        return;
      }

      // 2. If demo caregiver
      if (user.id === 'demo-caregiver-001') {
        setPatient(DEFAULT_PATIENT);
        setCheckingPatient(false);
        return;
      }

      // 3. Check locally saved patient for this caregiver
      const scoped = offlineDb.getPatient(user.id);
      if (scoped) {
        setPatient(scoped);
        setCheckingPatient(false);
        return;
      }

      // 4. Check cached patients in localStorage
      try {
        const cached = localStorage.getItem(`sevamitr_cached_patients_${user.id}`);
        if (cached) {
          const list = JSON.parse(cached);
          if (Array.isArray(list) && list.length > 0) {
            setPatient(list[0]);
            offlineDb.savePatient(list[0], user.id);
            setCheckingPatient(false);
            return;
          }
        }
      } catch {}

      // 5. Fetch scoped patient from API
      fetch(`/api/patients?caregiverId=${encodeURIComponent(user.id)}`)
        .then((res) => res.json())
        .then((data) => {
          if (data.patients && Array.isArray(data.patients) && data.patients.length > 0) {
            const first = data.patients[0];
            setPatient(first);
            offlineDb.savePatient(first, user.id);
          } else {
            setPatient(null);
          }
        })
        .catch(() => {
          setPatient(null);
        })
        .finally(() => {
          setCheckingPatient(false);
        });
    }
  }, [isLoading, isLoggedIn, user, router]);

  const handleQuickFillDemo = () => {
    setFormName('Bhaben Baruah');
    setFormAge(74);
    setFormGender('Male');
    setFormRegion('Tezpur, Sonitpur, Assam');
    setFormLanguage('as');
    setFormStage('Mild');
    setFormEmergency('+91 94350 98765');
  };

  const handleAddPatientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formName.trim()) {
      setFormError('Please enter the patient’s full name.');
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        fullName: formName.trim(),
        age: typeof formAge === 'number' ? formAge : 70,
        gender: formGender,
        region: formRegion.trim() || 'Assam, North Eastern Region',
        primaryLanguage: formLanguage,
        dementiaStage: formStage,
        emergencyContact: formEmergency.trim() || user?.identifier || '+91 94350 00000',
        caregiverId: user?.id || `cg-${user?.identifier || Date.now()}`,
        caregiverName: user?.fullName || 'Primary Caregiver',
        caregiverPhone: user?.identifier || formEmergency.trim(),
      };

      const res = await fetch('/api/patients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to register patient.');
      }

      const createdPatient: PatientProfile = data.patient;

      offlineDb.savePatient(createdPatient, user?.id);
      offlineDb.savePatient(createdPatient);
      if (user?.id) {
        try {
          const prev = localStorage.getItem(`sevamitr_cached_patients_${user.id}`);
          const list = prev ? JSON.parse(prev) : [];
          list.unshift(createdPatient);
          localStorage.setItem(`sevamitr_cached_patients_${user.id}`, JSON.stringify(list));
        } catch {}
      }

      brainHqAudio.playSuccessChime();
      confetti({ particleCount: 75, spread: 60, origin: { y: 0.6 } });
      setPatient(createdPatient);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

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

  const firstName = (patient?.fullName ? patient.fullName.split(' ')[0] : 'Patient');

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
            Please sign in to access the Patient Home exercises and games.
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

  // 1. Loading state while checking patient profile
  if (checkingPatient) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 74px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: '#f4f7f4',
          padding: '2rem',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              border: '3px solid #c9dcd0',
              borderTopColor: '#214935',
              borderRadius: '50%',
              animation: 'spin 0.8s linear infinite',
              margin: '0 auto 1rem',
            }}
          />
          <p className="font-clash-medium" style={{ color: '#57534e', fontSize: '0.95rem' }}>
            Loading patient profile...
          </p>
        </div>
      </div>
    );
  }

  // 2. IF LOGGED IN BUT NO PATIENT ADDED YET -> SHOW SCREEN TO ADD PATIENTS RATHER THAN THE GAMES
  if (!patient) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 74px)',
          background: '#f4f7f4',
          padding: '2rem 1.25rem 5rem',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <div style={{ maxWidth: '640px', width: '100%' }}>
          {/* Welcome / Registration Header Card */}
          <div
            className="neo-card"
            style={{
              background: '#ffffff',
              padding: '2.25rem 1.75rem',
              textAlign: 'center',
              marginBottom: '1.75rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.9rem',
                marginBottom: '1.25rem',
                flexWrap: 'wrap',
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '16px',
                  background: '#e8f5e9',
                  border: '2px solid #1c1b1b',
                  boxShadow: '3px 3px 0px #1c1b1b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#214935',
                  flexShrink: 0,
                }}
              >
                <UserPlus size={26} />
              </div>

              <span
                className="neo-pill font-clash-wide"
                style={{
                  background: '#214935',
                  color: '#ffffff',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  padding: '0.45rem 1.15rem',
                  letterSpacing: '0.05em',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                PATIENT REGISTRATION REQUIRED
              </span>
            </div>

            <h1
              className="font-clash-bold"
              style={{
                fontSize: 'clamp(1.5rem, 3.5vw, 1.95rem)',
                color: '#1c1b1b',
                margin: '0 0 0.5rem',
                textTransform: 'uppercase',
                lineHeight: 1.15,
              }}
            >
              Add a Patient to Start Games
            </h1>

            <p
              className="font-clash-regular"
              style={{
                fontSize: '0.95rem',
                color: '#57534e',
                maxWidth: '500px',
                margin: '0 auto',
                lineHeight: 1.5,
              }}
            >
              Welcome, <strong>{user?.fullName || 'Caregiver'}</strong>. You haven&apos;t added any patient yet. Register the elder or loved one under your care to unlock the cognitive games and personalized speed trials.
            </p>
          </div>

          {/* Patient Form Card */}
          <div
            className="neo-card"
            style={{
              background: '#ffffff',
              padding: '2rem 1.75rem',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem',
                flexWrap: 'wrap',
                gap: '0.75rem',
                borderBottom: '1px solid #e7e5e4',
                paddingBottom: '1rem',
              }}
            >
              <div>
                <h2
                  className="font-clash-bold"
                  style={{ fontSize: '1.2rem', color: '#1c1b1b', margin: 0, textTransform: 'uppercase' }}
                >
                  Patient Details
                </h2>
                <span className="font-clash-regular" style={{ fontSize: '0.82rem', color: '#78716c' }}>
                  Stored securely &amp; available 100% offline
                </span>
              </div>

              <button
                type="button"
                onClick={handleQuickFillDemo}
                className="neo-pill font-clash-semibold"
                style={{
                  background: '#fef3c7',
                  border: '1.5px solid #1c1b1b',
                  color: '#92400e',
                  fontSize: '0.78rem',
                  padding: '0.35rem 0.75rem',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <Sparkles size={14} />
                <span>Prefill Sample (Assam)</span>
              </button>
            </div>

            {formError && (
              <div
                className="neo-card font-clash-medium"
                style={{
                  background: '#fef2f2',
                  border: '2px solid #ef4444',
                  color: '#991b1b',
                  padding: '0.75rem 1rem',
                  fontSize: '0.88rem',
                  marginBottom: '1.25rem',
                }}
              >
                {formError}
              </div>
            )}

            <form onSubmit={handleAddPatientSubmit}>
              {/* Full Name */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label
                  className="font-clash-bold"
                  style={{ display: 'block', fontSize: '0.85rem', color: '#1c1b1b', marginBottom: '0.45rem', textTransform: 'uppercase' }}
                >
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Bhaben Baruah or Nilima Devi"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '2px solid #1c1b1b',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                    background: '#fcfbf9',
                  }}
                />
              </div>

              {/* Age & Gender */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.3fr', gap: '1rem', marginBottom: '1.25rem' }}>
                <div>
                  <label
                    className="font-clash-bold"
                    style={{ display: 'block', fontSize: '0.85rem', color: '#1c1b1b', marginBottom: '0.45rem', textTransform: 'uppercase' }}
                  >
                    Age
                  </label>
                  <input
                    type="number"
                    min={45}
                    max={120}
                    value={formAge}
                    onChange={(e) => setFormAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
                    style={{
                      width: '100%',
                      padding: '0.75rem 1rem',
                      borderRadius: '10px',
                      border: '2px solid #1c1b1b',
                      fontSize: '0.95rem',
                      boxSizing: 'border-box',
                      background: '#fcfbf9',
                    }}
                  />
                </div>

                <div>
                  <label
                    className="font-clash-bold"
                    style={{ display: 'block', fontSize: '0.85rem', color: '#1c1b1b', marginBottom: '0.45rem', textTransform: 'uppercase' }}
                  >
                    Gender
                  </label>
                  <div style={{ display: 'flex', gap: '0.4rem' }}>
                    {(['Female', 'Male', 'Other'] as const).map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setFormGender(g)}
                        style={{
                          flex: 1,
                          padding: '0.75rem 0.35rem',
                          borderRadius: '10px',
                          border: '2px solid #1c1b1b',
                          background: formGender === g ? '#214935' : '#ffffff',
                          color: formGender === g ? '#ffffff' : '#1c1b1b',
                          fontWeight: 600,
                          fontSize: '0.85rem',
                          cursor: 'pointer',
                          textAlign: 'center',
                        }}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Region */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label
                  className="font-clash-bold"
                  style={{ display: 'block', fontSize: '0.85rem', color: '#1c1b1b', marginBottom: '0.45rem', textTransform: 'uppercase' }}
                >
                  Region / District (North Eastern Region)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kamrup Rural, Assam"
                  value={formRegion}
                  onChange={(e) => setFormRegion(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '2px solid #1c1b1b',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                    background: '#fcfbf9',
                  }}
                />
              </div>

              {/* Primary Language */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label
                  className="font-clash-bold"
                  style={{ display: 'block', fontSize: '0.85rem', color: '#1c1b1b', marginBottom: '0.45rem', textTransform: 'uppercase' }}
                >
                  Primary Language
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.5rem' }}>
                  {[
                    { key: 'en', label: 'English' },
                    { key: 'as', label: 'অসমীয়া (Assamese)' },
                    { key: 'bn', label: 'বাংলা (Bengali)' },
                    { key: 'hi', label: 'हिन्दी (Hindi)' },
                  ].map((l) => (
                    <button
                      key={l.key}
                      type="button"
                      onClick={() => setFormLanguage(l.key as any)}
                      style={{
                        padding: '0.65rem 0.75rem',
                        borderRadius: '10px',
                        border: '2px solid #1c1b1b',
                        background: formLanguage === l.key ? '#214935' : '#ffffff',
                        color: formLanguage === l.key ? '#ffffff' : '#1c1b1b',
                        fontWeight: 600,
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        textAlign: 'left',
                      }}
                    >
                      {l.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dementia Stage */}
              <div style={{ marginBottom: '1.25rem' }}>
                <label
                  className="font-clash-bold"
                  style={{ display: 'block', fontSize: '0.85rem', color: '#1c1b1b', marginBottom: '0.45rem', textTransform: 'uppercase' }}
                >
                  Dementia Stage / Cognitive Assessment
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                  {[
                    { key: 'MCI', label: 'MCI', sub: 'Early Signs' },
                    { key: 'Mild', label: 'Mild', sub: 'Recommended' },
                    { key: 'Moderate', label: 'Moderate', sub: 'Assisted' },
                  ].map((s) => (
                    <button
                      key={s.key}
                      type="button"
                      onClick={() => setFormStage(s.key as any)}
                      style={{
                        padding: '0.65rem 0.5rem',
                        borderRadius: '10px',
                        border: '2px solid #1c1b1b',
                        background: formStage === s.key ? '#214935' : '#ffffff',
                        color: formStage === s.key ? '#ffffff' : '#1c1b1b',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{s.label}</div>
                      <div style={{ fontSize: '0.72rem', opacity: formStage === s.key ? 0.9 : 0.7 }}>{s.sub}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Emergency Contact Phone */}
              <div style={{ marginBottom: '1.75rem' }}>
                <label
                  className="font-clash-bold"
                  style={{ display: 'block', fontSize: '0.85rem', color: '#1c1b1b', marginBottom: '0.45rem', textTransform: 'uppercase' }}
                >
                  Emergency / Caregiver Contact Phone
                </label>
                <input
                  type="tel"
                  placeholder="+91 94350 12345"
                  value={formEmergency}
                  onChange={(e) => setFormEmergency(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem',
                    borderRadius: '10px',
                    border: '2px solid #1c1b1b',
                    fontSize: '0.95rem',
                    boxSizing: 'border-box',
                    background: '#fcfbf9',
                  }}
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="neo-pill font-clash-bold"
                style={{
                  width: '100%',
                  background: '#214935',
                  color: '#ffffff',
                  border: '2px solid #1c1b1b',
                  boxShadow: '3px 3px 0px #1c1b1b',
                  padding: '0.95rem 1.5rem',
                  fontSize: '1.05rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.65rem',
                  transition: 'transform 0.1s ease',
                }}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    <span>Registering Patient...</span>
                  </>
                ) : (
                  <>
                    <UserPlus size={20} />
                    <span>Save Patient &amp; Start Games</span>
                  </>
                )}
              </button>
            </form>
          </div>
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

                    {/* Tactile Action Button (Full-width, Dementia-friendly tap target) */}
                    <div style={{ width: '100%', height: '50px' }}>
                      <Link
                        href={ex.href}
                        className="font-clash-semibold"
                        style={{
                          width: '100%',
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
                    </div>
                  </div>
                ))}
              </div>
          </>
        )}

        {/* VIEW 2: HOME OVERVIEW (activeNav === 'home') */}
        {activeNav === 'home' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', marginBottom: '2rem' }}>
            {/* Welcoming Home Hero Card */}
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
                    PATIENT HOME PORTAL
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
                  <span className="neo-pill font-clash-wide" style={{ fontSize: '0.68rem', marginBottom: '0.75rem', display: 'inline-block', background: '#fee2e2', color: '#991b1b', border: '1.5px solid #1c1b1b' }}>
                    EMERGENCY CALL
                  </span>
                  <h3 className="font-clash-bold" style={{ fontSize: '1.3rem', color: '#1c1b1b', margin: '0 0 0.35rem', textTransform: 'uppercase' }}>
                    Emergency Helpline
                  </h3>
                  <p className="font-clash-regular" style={{ fontSize: '0.86rem', color: '#57534e', margin: 0 }}>
                    24/7 urgent medical & rapid SOS emergency response.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleCopyPhone('9846198473')}
                  className="neo-card font-clash-semibold"
                  style={{
                    background: copiedPhone ? '#dcfce7' : '#fee2e2',
                    color: copiedPhone ? '#15803d' : '#991b1b',
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
                    border: '1.5px solid #1c1b1b',
                    boxShadow: '2px 2px 0px #1c1b1b',
                  }}
                  title="Click to copy emergency number 9846198473"
                >
                  <PhoneCall size={15} />
                  <span>{copiedPhone ? 'Copied Emergency Number!' : 'Emergency Call: 9846198473'}</span>
                </button>
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
          onClick={() => setActiveNav('home')}
          className={`neo-dock-btn ${activeNav === 'home' ? 'active' : ''}`}
        >
          <Home size={18} />
          <span>Home</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveNav('games')}
          className={`neo-dock-btn ${activeNav === 'games' ? 'active' : ''}`}
        >
          <Brain size={18} />
          <span>Games</span>
        </button>

        <button
          type="button"
          onClick={() => handleCopyPhone('9846198473')}
          suppressHydrationWarning
          className="neo-dock-btn"
          style={{
            background: copiedPhone ? '#dcfce7' : '#fee2e2',
            color: copiedPhone ? '#15803d' : '#991b1b',
            border: '2px solid #1c1b1b',
            cursor: 'pointer',
          }}
          title="Emergency Call: 9846198473 (Click to copy)"
        >
          <PhoneCall size={18} />
          <span>{copiedPhone ? 'Copied!' : 'Emergency Call'}</span>
        </button>
      </nav>

      {/* Clinical Handover Report Modal */}
      {patient && (
        <DoctorReportModal
          isOpen={showDoctorModal}
          onClose={() => setShowDoctorModal(false)}
          patient={patient}
        />
      )}
    </div>
  );
}

export default function PatientHomePage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#f4f7f4' }} />}>
      <PatientPageContent />
    </Suspense>
  );
}
