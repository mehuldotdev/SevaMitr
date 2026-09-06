'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowRight, LogIn, UserPlus, User, Stethoscope, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/lib/auth/AuthContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { SevaMitrIcon } from '@/components/SevaMitrIcon';
import { offlineDb } from '@/lib/db/offlineDb';

function HomeAuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab = searchParams.get('tab') === 'signup' ? 'signup' : 'login';

  const { user, isLoggedIn, login, signup, logout } = useAuth();
  const { t } = useLanguage();

  const [tab, setTab] = useState<'login' | 'signup'>(initialTab);
  const [mounted, setMounted] = useState(false);
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [caregiverRole, setCaregiverRole] = useState('Family Member / Primary Caregiver');
  const [region, setRegion] = useState('Kamrup, Assam');
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    const res = await login(identifier, password);
    setLoading(false);

    if (res.success) {
      if (res.role === 'PATIENT') {
        router.push('/patient');
      } else {
        const hasPatient = res.user?.id ? offlineDb.hasPatient(res.user.id) : false;
        if (!hasPatient && res.user?.id !== 'demo-caregiver-001') {
          router.push('/patient');
        } else {
          router.push('/caregiver');
        }
      }
    } else {
      setErrorMsg(res.error || 'Login failed. Please check credentials.');
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
      role: 'CAREGIVER',
      region: `${region} (${caregiverRole})`,
    });
    setLoading(false);

    if (res.success) {
      router.push('/patient');
    } else {
      setErrorMsg(res.error || 'Sign up failed.');
    }
  };

  return (
    <div
      style={{
        minHeight: 'calc(100vh - 74px)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '2rem 1.25rem 4rem',
        boxSizing: 'border-box',
        background: '#f4f7f4',
      }}
    >
      <div style={{ maxWidth: '460px', width: '100%', margin: '0 auto' }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div
            style={{
              width: '58px',
              height: '58px',
              borderRadius: '16px',
              background: '#ffffff',
              border: '2px solid #1c1b1b',
              boxShadow: '3px 3px 0px #1c1b1b',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 0.75rem',
            }}
          >
            <SevaMitrIcon size={32} />
          </div>
          <h1
            className="font-clash-bold"
            style={{
              fontSize: '1.75rem',
              fontWeight: 700,
              color: '#1c1b1b',
              margin: '0 0 0.35rem',
              textTransform: 'uppercase',
              letterSpacing: '0.01em',
            }}
          >
            Seva<span style={{ color: '#214935' }}>Mitr</span>
          </h1>
          <p
            className="font-clash-regular"
            style={{
              fontSize: '0.88rem',
              color: '#57534e',
              margin: 0,
              fontWeight: 400,
            }}
          >
            Cognitive health & circadian memory care platform.
          </p>
        </div>

        {/* If already logged in: Active Session Card */}
        {mounted && isLoggedIn && user ? (
          <div
            className="neo-card"
            style={{
              background: '#ffffff',
              padding: '1.75rem',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: '52px',
                height: '52px',
                borderRadius: '50%',
                background: '#c0edd1',
                border: '2px solid #1c1b1b',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#073220',
                marginBottom: '1rem',
              }}
            >
              <CheckCircle2 size={28} />
            </div>

            <div className="font-clash-bold" style={{ fontSize: '1.35rem', color: '#1c1b1b', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
              Welcome Back
            </div>

            <div className="font-clash-medium" style={{ fontSize: '0.95rem', color: '#57534e', marginBottom: '1.25rem' }}>
              Signed in as <strong>{user.fullName}</strong> ({user.role})
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <Link
                href={user.role === 'PATIENT' ? '/patient' : '/caregiver'}
                className="neo-card font-clash-semibold"
                style={{
                  background: '#214935',
                  color: '#ffffff',
                  padding: '0.85rem 1.25rem',
                  borderRadius: '12px',
                  textDecoration: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  textTransform: 'uppercase',
                }}
              >
                <span>Continue to {user.role === 'PATIENT' ? 'Patient Kiosk' : 'Dashboard'}</span>
                <ArrowRight size={18} />
              </Link>

              <button
                onClick={logout}
                className="font-clash-semibold"
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: '0.5rem',
                  cursor: 'pointer',
                  color: '#78716c',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                }}
              >
                Sign In With Another Account
              </button>
            </div>
          </div>
        ) : (
          /* Authentication Card */
          <div
            className="neo-card"
            style={{
              background: '#ffffff',
              padding: '1.75rem',
            }}
          >
            {/* Segmented Pill Tabs */}
            <div
              style={{
                display: 'flex',
                background: '#f4f7f4',
                borderRadius: '9999px',
                border: '2px solid #1c1b1b',
                padding: '3px',
                marginBottom: '1.5rem',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setTab('login');
                  setErrorMsg('');
                }}
                className="font-clash-semibold"
                style={{
                  flex: 1,
                  padding: '0.6rem 0',
                  borderRadius: '9999px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  textTransform: 'uppercase',
                  border: 'none',
                  background: tab === 'login' ? '#214935' : 'transparent',
                  color: tab === 'login' ? '#ffffff' : '#1c1b1b',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                }}
              >
                <LogIn size={15} />
                <span>Log In</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab('signup');
                  setErrorMsg('');
                }}
                className="font-clash-semibold"
                style={{
                  flex: 1,
                  padding: '0.6rem 0',
                  borderRadius: '9999px',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  textTransform: 'uppercase',
                  border: 'none',
                  background: tab === 'signup' ? '#214935' : 'transparent',
                  color: tab === 'signup' ? '#ffffff' : '#1c1b1b',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.45rem',
                }}
              >
                <UserPlus size={15} />
                <span>Register</span>
              </button>
            </div>

            {/* Error Notification */}
            {errorMsg && (
              <div
                className="font-clash-medium"
                style={{
                  background: '#fee2e2',
                  border: '2px solid #991b1b',
                  borderRadius: '10px',
                  padding: '0.65rem 0.85rem',
                  color: '#991b1b',
                  fontSize: '0.82rem',
                  marginBottom: '1.25rem',
                }}
              >
                {errorMsg}
              </div>
            )}

            {/* TAB 1: LOG IN FORM */}
            {tab === 'login' ? (
              <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '1rem' }}>
                  <label
                    className="font-clash-semibold"
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#1c1b1b',
                      marginBottom: '0.35rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.02em',
                    }}
                  >
                    Phone / Username
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+919876543210 or dadi"
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    className="font-clash-regular"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '2px solid #1c1b1b',
                      background: '#fcf9f8',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label
                    className="font-clash-semibold"
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#1c1b1b',
                      marginBottom: '0.35rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.02em',
                    }}
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="font-clash-regular"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '2px solid #1c1b1b',
                      background: '#fcf9f8',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="neo-card font-clash-semibold"
                  style={{
                    width: '100%',
                    background: '#214935',
                    color: '#ffffff',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    fontSize: '0.98rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    letterSpacing: '0.02em',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    border: '2px solid #1c1b1b',
                  }}
                >
                  <span>{loading ? 'Signing In...' : 'Sign In'}</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            ) : (
              /* TAB 2: REGISTER FORM */
              <form onSubmit={handleSignup}>
                <div style={{ marginBottom: '0.85rem' }}>
                  <label
                    className="font-clash-semibold"
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#1c1b1b',
                      marginBottom: '0.35rem',
                      textTransform: 'uppercase',
                    }}
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dadi Ji (Prabha Sharma)"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="font-clash-regular"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '2px solid #1c1b1b',
                      background: '#fcf9f8',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                {/* Caregiver Registration Banner & Guidance */}
                <div
                  style={{
                    background: '#e8f5e9',
                    border: '1.5px solid #214935',
                    borderRadius: '10px',
                    padding: '0.65rem 0.85rem',
                    marginBottom: '0.85rem',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '0.5rem',
                  }}
                >
                  <Stethoscope size={18} style={{ color: '#214935', marginTop: '2px', flexShrink: 0 }} />
                  <div style={{ fontSize: '0.78rem', color: '#1c1b1b', lineHeight: 1.4 }}>
                    <strong>Caregiver Registration:</strong> Patients cannot self-register directly. Once signed up, you can register and oversee elderly patients securely from your Caregiver Dashboard.
                  </div>
                </div>

                <div style={{ marginBottom: '0.85rem' }}>
                  <label
                    className="font-clash-semibold"
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#1c1b1b',
                      marginBottom: '0.35rem',
                      textTransform: 'uppercase',
                    }}
                  >
                    Caregiver Designation
                  </label>
                  <select
                    value={caregiverRole}
                    onChange={(e) => setCaregiverRole(e.target.value)}
                    className="font-clash-regular"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '2px solid #1c1b1b',
                      background: '#fcf9f8',
                      fontSize: '0.88rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="Family Member / Primary Caregiver">Family Member / Primary Caregiver</option>
                    <option value="ASHA Community Health Worker">ASHA / Anganwadi Community Health Worker</option>
                    <option value="Clinical Doctor / Medical Officer">Clinical Doctor / Medical Officer</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.85rem' }}>
                  <div>
                    <label
                      className="font-clash-semibold"
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: '#1c1b1b',
                        marginBottom: '0.35rem',
                        textTransform: 'uppercase',
                      }}
                    >
                      Phone / ID
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="+919..."
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      className="font-clash-regular"
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.75rem',
                        borderRadius: '10px',
                        border: '2px solid #1c1b1b',
                        background: '#fcf9f8',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>

                  <div>
                    <label
                      className="font-clash-semibold"
                      style={{
                        display: 'block',
                        fontSize: '0.78rem',
                        fontWeight: 600,
                        color: '#1c1b1b',
                        marginBottom: '0.35rem',
                        textTransform: 'uppercase',
                      }}
                    >
                      Region
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Kamrup"
                      value={region}
                      onChange={(e) => setRegion(e.target.value)}
                      className="font-clash-regular"
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.75rem',
                        borderRadius: '10px',
                        border: '2px solid #1c1b1b',
                        background: '#fcf9f8',
                        fontSize: '0.88rem',
                        outline: 'none',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>

                <div style={{ marginBottom: '1.25rem' }}>
                  <label
                    className="font-clash-semibold"
                    style={{
                      display: 'block',
                      fontSize: '0.8rem',
                      fontWeight: 600,
                      color: '#1c1b1b',
                      marginBottom: '0.35rem',
                      textTransform: 'uppercase',
                    }}
                  >
                    Password
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Create a password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="font-clash-regular"
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      borderRadius: '10px',
                      border: '2px solid #1c1b1b',
                      background: '#fcf9f8',
                      fontSize: '0.92rem',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="neo-card font-clash-semibold"
                  style={{
                    width: '100%',
                    background: '#214935',
                    color: '#ffffff',
                    padding: '0.75rem 1rem',
                    borderRadius: '12px',
                    fontSize: '0.98rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    border: '2px solid #1c1b1b',
                  }}
                >
                  <span>{loading ? 'Creating...' : 'Create Account'}</span>
                  <ArrowRight size={16} />
                </button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={<div style={{ padding: '3rem', textAlign: 'center' }}>Loading...</div>}>
      <HomeAuthContent />
    </Suspense>
  );
}
