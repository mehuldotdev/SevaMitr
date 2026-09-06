'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowUpRight,
  Play,
  Activity,
  ShieldCheck,
  Users,
  LogIn,
  LogOut,
  Zap,
  Sparkles,
  Clock,
  User,
  Stethoscope,
} from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { offlineDb, DEFAULT_PATIENT, PatientProfile } from '@/lib/db/offlineDb';

export default function HomePage() {
  const router = useRouter();
  const { user, isLoggedIn, login, signup, logout } = useAuth();
  const { t } = useLanguage();

  const [showAuthModal, setShowAuthModal] = useState(false);
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'PATIENT' | 'CAREGIVER'>('CAREGIVER');
  const [region, setRegion] = useState('Kamrup Rural, Assam');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activePatient, setActivePatient] = useState<PatientProfile>(DEFAULT_PATIENT);

  useEffect(() => {
    setMounted(true);
    setActivePatient(offlineDb.getPatient());
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = await login(identifier, password);
    setLoading(false);

    if (res.success) {
      setShowAuthModal(false);
      if (res.role === 'PATIENT') {
        router.push('/patient');
      } else {
        router.push('/caregiver');
      }
    } else {
      setErrorMsg(res.error || 'Login failed. Check credentials.');
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = await signup({
      fullName,
      identifier,
      password,
      role,
      region,
    });
    setLoading(false);

    if (res.success) {
      setShowAuthModal(false);
      router.push('/caregiver');
    } else {
      setErrorMsg(res.error || 'Sign up failed.');
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 74px)',
        background: '#f4f7f4',
        padding: '2.5rem 1.25rem 4.5rem',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      }}
    >
      <div style={{ maxWidth: '920px', width: '100%' }}>
        {/* Top Eyebrow Tag & Punchy Hero Header */}
        <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
          <div
            className="neo-pill neo-pill-green"
            style={{ marginBottom: '1rem', padding: '0.35rem 1rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
          >
            <Sparkles size={13} color="#073220" />
            <span className="font-clash-wide" style={{ fontSize: '0.74rem' }}>AI COGNITIVE HEALTH • NER</span>
          </div>

          <h1
            className="font-clash-bold"
            style={{
              fontSize: 'clamp(1.85rem, 3.8vw, 2.65rem)',
              fontWeight: 700,
              color: '#1c1b1b',
              margin: '0 0 0.5rem',
              lineHeight: 1.1,
              letterSpacing: '-0.015em',
              textTransform: 'uppercase',
            }}
          >
            Dignity for Elders.
            <br />
            <span style={{ color: '#214935' }}>Peace for Families.</span>
          </h1>

          <p
            className="font-clash-medium"
            style={{
              fontSize: 'clamp(0.92rem, 1.4vw, 1.05rem)',
              color: '#57534e',
              maxWidth: '500px',
              margin: '0 auto',
              lineHeight: 1.4,
              fontWeight: 500,
            }}
          >
            Speed trials & circadian fatigue telemetry.
          </p>
        </div>

        {/* 2 Primary Portal Doors (Aligned Grid Deck) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
            gap: '1.75rem',
            marginBottom: '2rem',
            alignItems: 'stretch',
          }}
        >
          {/* DOOR 1: ELDERLY PATIENT HOME */}
          <div
            className="neo-card"
            style={{
              padding: '1.75rem 1.6rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: '#ffffff',
              minHeight: '280px',
              height: '100%',
              boxSizing: 'border-box',
            }}
          >
            {/* Top Peeking Tab */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '28px', marginBottom: '1.25rem' }}>
              <div className="neo-pill neo-pill-terracotta">
                <span className="font-clash-wide" style={{ fontSize: '0.72rem' }}>ELDERS</span>
              </div>
              <span className="font-clash-wide" style={{ fontSize: '0.72rem', color: '#57534e' }}>
                ONE-TOUCH
              </span>
            </div>

            <div style={{ margin: '0.5rem 0 1.25rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: '#e8f5e9',
                  border: '2px solid #1c1b1b',
                  boxShadow: '3px 3px 0px #1c1b1b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#073220',
                  marginBottom: '0.85rem',
                }}
              >
                <User size={28} strokeWidth={2.2} />
              </div>

              <h2
                className="font-clash-bold"
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 700,
                  color: '#1c1b1b',
                  margin: '0 0 0.3rem',
                  lineHeight: 1.15,
                  textTransform: 'uppercase',
                }}
              >
                Patient Home
              </h2>

              <p
                className="font-clash-regular"
                style={{
                  fontSize: '0.9rem',
                  color: '#57534e',
                  margin: 0,
                  fontWeight: 400,
                }}
              >
                Speed games & cognitive exercises.
              </p>
            </div>

            {/* Action Group: Identical 52px height alignment between button & circle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
              <Link
                href="/patient"
                className="font-clash-semibold"
                style={{
                  width: '100%',
                  background: '#214935',
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
                  textDecoration: 'none',
                  textTransform: 'uppercase',
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

          {/* DOOR 2: CAREGIVER DASHBOARD */}
          <div
            className="neo-card"
            style={{
              padding: '1.75rem 1.6rem',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              background: '#ffffff',
              minHeight: '280px',
              height: '100%',
              boxSizing: 'border-box',
            }}
          >
            {/* Top Peeking Tab */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '28px', marginBottom: '1.25rem' }}>
              <div className="neo-pill neo-pill-amber">
                <span className="font-clash-wide" style={{ fontSize: '0.72rem' }}>CAREGIVERS</span>
              </div>
              <span className="font-clash-wide" style={{ fontSize: '0.72rem', color: '#57534e' }}>
                TELEMETRY
              </span>
            </div>

            <div style={{ margin: '0.5rem 0 1.25rem' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '14px',
                  background: '#e3f2fd',
                  border: '2px solid #1c1b1b',
                  boxShadow: '3px 3px 0px #1c1b1b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0f4c81',
                  marginBottom: '0.85rem',
                }}
              >
                <Activity size={28} strokeWidth={2.2} />
              </div>

              <h2
                className="font-clash-bold"
                style={{
                  fontSize: '1.65rem',
                  fontWeight: 700,
                  color: '#1c1b1b',
                  margin: '0 0 0.3rem',
                  lineHeight: 1.15,
                  textTransform: 'uppercase',
                }}
              >
                Caregiver Portal
              </h2>

              <p
                className="font-clash-regular"
                style={{
                  fontSize: '0.9rem',
                  color: '#57534e',
                  margin: 0,
                  fontWeight: 400,
                }}
              >
                Cognitive telemetry & alerts.
              </p>
            </div>

            {/* Action Group: Identical 50px height alignment between button & circle */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%' }}>
              <Link
                href="/caregiver"
                className="font-clash-semibold"
                style={{
                  width: '100%',
                  background: '#1c1b1b',
                  color: '#ffffff',
                  height: '50px',
                  minHeight: '50px',
                  borderRadius: '14px',
                  border: '2px solid #1c1b1b',
                  boxShadow: '3px 3px 0px #214935',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  fontSize: '1.05rem',
                  fontWeight: 600,
                  textDecoration: 'none',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                  transition: 'all 0.15s ease',
                  boxSizing: 'border-box',
                }}
              >
                <Activity size={16} />
                <span>Dashboard</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Active Patient Summary Strip (Neo Card with Hydration Safety) */}
        <div
          className="neo-card"
          style={{
            padding: '1.15rem 1.5rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1rem',
            marginBottom: '2rem',
          }}
        >
          {/* Left: Active Profile */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '12px',
                background: '#e8f5e9',
                border: '2px solid #1c1b1b',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#073220',
                flexShrink: 0,
              }}
            >
              <User size={18} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span
                  className="font-clash-bold"
                  suppressHydrationWarning
                  style={{ fontSize: '1.05rem', fontWeight: 700, color: '#1c1b1b' }}
                >
                  {activePatient?.fullName || 'Bhaben Baruah'}
                </span>
                <span className="neo-pill neo-pill-green font-clash-wide" style={{ fontSize: '0.68rem', padding: '0.15rem 0.5rem' }}>
                  ACTIVE
                </span>
              </div>
              <div
                className="font-clash-regular"
                suppressHydrationWarning
                style={{ fontSize: '0.82rem', color: '#57534e', marginTop: '0.15rem' }}
              >
                {activePatient?.region || 'Kamrup Rural, Assam'} • {activePatient?.dementiaStage || 'Mild'} Stage
              </div>
            </div>
          </div>

          {/* Right: Auth Controls (Hydration Safe Mounted Pattern) */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {mounted && isLoggedIn && user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span className="font-clash-medium" style={{ fontSize: '0.86rem', color: '#57534e', fontWeight: 500 }}>
                  {user.fullName}
                </span>
                <button
                  onClick={logout}
                  className="neo-pill font-clash-semibold"
                  style={{ background: '#fee2e2', color: '#991b1b', cursor: 'pointer', padding: '0.35rem 0.85rem', fontSize: '0.82rem' }}
                >
                  <LogOut size={13} />
                  <span>Sign Out</span>
                </button>
              </div>
            ) : (
              <Link
                href="/"
                className="neo-pill font-clash-semibold"
                style={{
                  background: '#ffffff',
                  color: '#1c1b1b',
                  textDecoration: 'none',
                  padding: '0.42rem 0.95rem',
                  fontSize: '0.84rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                <LogIn size={14} />
                <span>Login / Register</span>
              </Link>
            )}
          </div>
        </div>

        {/* 3 Value Cards (Minimal, Aligned Grid Deck) */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
            gap: '1.25rem',
            alignItems: 'stretch',
          }}
        >
          {/* Card 1 */}
          <div className="neo-card" style={{ padding: '1.25rem', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '36px', marginBottom: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#c0edd1',
                  border: '2px solid #1c1b1b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#073220',
                  flexShrink: 0,
                }}
              >
                <Zap size={18} />
              </div>
              <span className="neo-pill neo-pill-green font-clash-wide" style={{ fontSize: '0.68rem' }}>
                -48% RISK
              </span>
            </div>
            <div>
              <div className="font-clash-semibold" style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1c1b1b', textTransform: 'uppercase' }}>
                BrainHQ Speed
              </div>
              <div className="font-clash-regular" style={{ fontSize: '0.82rem', color: '#57534e', marginTop: '0.15rem', fontWeight: 400 }}>
                UFOV Trials
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="neo-card" style={{ padding: '1.25rem', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '36px', marginBottom: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#f0bc93',
                  border: '2px solid #1c1b1b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#432406',
                  flexShrink: 0,
                }}
              >
                <Clock size={18} />
              </div>
              <span className="neo-pill neo-pill-amber font-clash-wide" style={{ fontSize: '0.68rem' }}>
                CIRCADIAN
              </span>
            </div>
            <div>
              <div className="font-clash-semibold" style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1c1b1b', textTransform: 'uppercase' }}>
                Circadian Clock
              </div>
              <div className="font-clash-regular" style={{ fontSize: '0.82rem', color: '#57534e', marginTop: '0.15rem', fontWeight: 400 }}>
                AM / PM Telemetry
              </div>
            </div>
          </div>

          {/* Card 3 */}
          <div className="neo-card" style={{ padding: '1.25rem', background: '#ffffff', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '100%', boxSizing: 'border-box' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '36px', marginBottom: '0.75rem' }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: '#fe8357',
                  border: '2px solid #1c1b1b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#1c1b1b',
                  flexShrink: 0,
                }}
              >
                <ShieldCheck size={18} />
              </div>
              <span className="neo-pill neo-pill-terracotta font-clash-wide" style={{ fontSize: '0.68rem' }}>
                OFFLINE
              </span>
            </div>
            <div>
              <div className="font-clash-semibold" style={{ fontSize: '1.1rem', fontWeight: 600, color: '#1c1b1b', textTransform: 'uppercase' }}>
                Offline Sync
              </div>
              <div className="font-clash-regular" style={{ fontSize: '0.82rem', color: '#57534e', marginTop: '0.15rem', fontWeight: 400 }}>
                Rural Ready
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sleek Auth Modal */}
      {showAuthModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(28, 27, 27, 0.65)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '1rem',
          }}
          onClick={() => setShowAuthModal(false)}
        >
          <div
            className="neo-card"
            style={{
              padding: '1.75rem',
              maxWidth: '420px',
              width: '100%',
              background: '#ffffff',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Tabs */}
            <div
              style={{
                display: 'flex',
                background: '#f4f7f4',
                borderRadius: '12px',
                border: '2px solid #1c1b1b',
                padding: '3px',
                marginBottom: '1.25rem',
              }}
            >
              <button
                onClick={() => {
                  setTab('login');
                  setErrorMsg('');
                }}
                className="font-regus"
                style={{
                  flex: 1,
                  padding: '0.5rem 0',
                  borderRadius: '9px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  border: 'none',
                  background: tab === 'login' ? '#214935' : 'transparent',
                  color: tab === 'login' ? '#ffffff' : '#57534e',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Log In
              </button>
              <button
                onClick={() => {
                  setTab('signup');
                  setErrorMsg('');
                }}
                className="font-regus"
                style={{
                  flex: 1,
                  padding: '0.5rem 0',
                  borderRadius: '9px',
                  fontWeight: 800,
                  fontSize: '0.9rem',
                  textTransform: 'uppercase',
                  border: 'none',
                  background: tab === 'signup' ? '#214935' : 'transparent',
                  color: tab === 'signup' ? '#ffffff' : '#57534e',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                Register
              </button>
            </div>

            {errorMsg && (
              <div
                className="neo-pill"
                style={{
                  width: '100%',
                  background: '#fee2e2',
                  color: '#991b1b',
                  marginBottom: '1rem',
                  justifyContent: 'center',
                }}
              >
                {errorMsg}
              </div>
            )}

            {tab === 'login' ? (
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '1rem' }}>
                  <label className="font-regus" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                    Username or Phone
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Enter phone or username"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '10px',
                      border: '2px solid #1c1b1b',
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label className="font-regus" style={{ display: 'block', fontSize: '0.8rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.3rem' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.75rem',
                      borderRadius: '10px',
                      border: '2px solid #1c1b1b',
                      fontSize: '0.95rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="font-regus"
                  style={{
                    width: '100%',
                    background: '#214935',
                    color: '#ffffff',
                    border: '2px solid #1c1b1b',
                    boxShadow: '3px 3px 0px #1c1b1b',
                    borderRadius: '12px',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  {loading ? 'Verifying...' : 'Sign In'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleSignup}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <label className="font-regus" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Anuradha Baruah"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '10px',
                      border: '2px solid #1c1b1b',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <label className="font-regus" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                    Phone or Identifier
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +91 94350 12345"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '10px',
                      border: '2px solid #1c1b1b',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <label className="font-regus" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Create password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '10px',
                      border: '2px solid #1c1b1b',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label className="font-regus" style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.2rem' }}>
                    Caregiver Designation
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'CAREGIVER')}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '10px',
                      border: '2px solid #1c1b1b',
                      fontSize: '0.9rem',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="CAREGIVER">Family Caregiver</option>
                    <option value="CAREGIVER">ASHA / Community Health Worker</option>
                    <option value="CAREGIVER">Clinician / Doctor</option>
                  </select>
                  <p style={{ margin: '0.4rem 0 0', fontSize: '0.72rem', color: '#57534e', lineHeight: 1.3 }}>
                    ℹ️ Elderly patients are registered directly by their caregiver once logged in.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="font-regus"
                  style={{
                    width: '100%',
                    background: '#214935',
                    color: '#ffffff',
                    border: '2px solid #1c1b1b',
                    boxShadow: '3px 3px 0px #1c1b1b',
                    borderRadius: '12px',
                    padding: '0.75rem',
                    fontSize: '1rem',
                    fontWeight: 800,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                  }}
                >
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </form>
            )}

            <button
              onClick={() => setShowAuthModal(false)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                marginTop: '0.75rem',
                color: '#57534e',
                fontSize: '0.85rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
