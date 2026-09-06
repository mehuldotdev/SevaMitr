'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Heart, Activity, PhoneCall, Languages, LogOut, User, Stethoscope } from 'lucide-react';
import { SevaMitrIcon } from '@/components/SevaMitrIcon';
import { LANGUAGE_LABELS } from '@/lib/audio/speechHelper';
import { SupportedLanguage, useLanguage } from '@/lib/i18n/LanguageContext';
import { useAuth } from '@/lib/auth/AuthContext';
import { offlineDb } from '@/lib/db/offlineDb';
import { OfflineSyncBadge } from '@/components/OfflineSyncBadge';

export function Navbar() {
  const pathname = usePathname();
  const { language, setLanguage, t } = useLanguage();
  const { user, isLoggedIn, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [patientPhone, setPatientPhone] = useState('+919435098765');
  const [patientName, setPatientName] = useState('');

  useEffect(() => {
    setMounted(true);
    if (!user) {
      setPatientName('');
      return;
    }
    if (user.role === 'PATIENT' || user.id === 'demo-caregiver-001') {
      const patient = offlineDb.getPatient();
      if (patient) {
        setPatientPhone(patient.caregiverPhone || '+919435098765');
        setPatientName(patient.fullName ? patient.fullName.split(' ')[0] : 'Mridula');
      }
    } else {
      const scoped = offlineDb.getPatient(user.id);
      if (scoped) {
        setPatientPhone(scoped.caregiverPhone || '+919435098765');
        setPatientName(scoped.fullName ? scoped.fullName.split(' ')[0] : '');
      } else {
        setPatientName('');
      }
    }
  }, [user]);

  const isPatientArea = pathname.startsWith('/patient');
  const isCaregiverArea = pathname.startsWith('/caregiver');
  const isGamePage = pathname.startsWith('/patient/games');

  if (isGamePage) {
    return null;
  }

  return (
    <header
      style={{
        background: 'rgba(239, 235, 228, 0.94)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--color-border)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '68px',
          paddingTop: '0.4rem',
          paddingBottom: '0.4rem',
          gap: '1rem',
        }}
      >
        {/* Left: Brand & Logo */}
        <Link
          href="/"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.65rem',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '12px',
              background: '#ffffff',
              border: '2px solid #1c1b1b',
              boxShadow: '2px 2px 0px #1c1b1b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <SevaMitrIcon size={22} />
          </div>
          <span
            className="font-clash-bold brand-wordmark"
            style={{
              fontSize: '1.4rem',
              color: 'var(--color-primary)',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '0.01em',
            }}
          >
            Seva<span style={{ color: '#1c1b1b' }}>Mitr</span>
          </span>
        </Link>

        {/* Center: Primary Navigation Mode Switch (Only when logged in) */}
        {mounted && isLoggedIn && user && (
          <nav
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              background: '#ffffff',
              padding: '3px',
              borderRadius: 'var(--radius-full)',
              border: '2px solid #1c1b1b',
              boxShadow: '2px 2px 0px #1c1b1b',
              height: '42px',
              boxSizing: 'border-box',
            }}
          >
            <Link
              href="/patient"
              className="font-clash-semibold"
              style={{
                height: '32px',
                padding: '0 1.15rem',
                borderRadius: 'var(--radius-full)',
                fontWeight: 600,
                fontSize: '0.92rem',
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                background: isPatientArea ? 'var(--color-primary)' : 'transparent',
                color: isPatientArea ? '#ffffff' : 'var(--color-text-main)',
                transition: 'var(--transition-smooth)',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                boxSizing: 'border-box',
              }}
            >
              <Heart size={15} />
              <span>Patient</span>
            </Link>

            {user.role !== 'PATIENT' && (
              <Link
                href="/caregiver"
                className="font-clash-semibold"
                style={{
                  height: '32px',
                  padding: '0 1.15rem',
                  borderRadius: 'var(--radius-full)',
                  fontWeight: 600,
                  fontSize: '0.92rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.02em',
                  background: isCaregiverArea ? 'var(--color-primary)' : 'transparent',
                  color: isCaregiverArea ? '#ffffff' : 'var(--color-text-main)',
                  transition: 'var(--transition-smooth)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  boxSizing: 'border-box',
                }}
              >
                <Activity size={15} />
                <span>Dashboard</span>
              </Link>
            )}
          </nav>
        )}

        {/* Right Controls: User Profile + Utilities */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          {/* Active User Badge & Logout */}
          {mounted && isLoggedIn && user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span
                className="font-clash-semibold"
                style={{
                  height: '38px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.92rem',
                  fontWeight: 600,
                  textTransform: 'uppercase',
                  color: '#1c1b1b',
                  background: '#ffffff',
                  padding: '0 0.85rem',
                  borderRadius: '9999px',
                  border: '2px solid #1c1b1b',
                  boxShadow: '2px 2px 0px #1c1b1b',
                  boxSizing: 'border-box',
                }}
                title={
                  isPatientArea
                    ? `Patient: ${patientName}`
                    : `Signed in as ${user.fullName} (${user.role})`
                }
              >
                {isPatientArea || user.role === 'PATIENT' ? <User size={15} /> : <Stethoscope size={15} />}
                <span>{isPatientArea ? (patientName || (user.fullName ? user.fullName.split(' ')[0] : 'Patient')) : user.fullName.split(' ')[0]}</span>
              </span>

              <button
                onClick={logout}
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  border: '2px solid #1c1b1b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  boxShadow: '2px 2px 0px #1c1b1b',
                  color: '#1c1b1b',
                  transition: 'var(--transition-smooth)',
                  boxSizing: 'border-box',
                }}
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <Link
              href="/"
              className="font-clash-semibold"
              style={{
                height: '38px',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.92rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                letterSpacing: '0.02em',
                color: '#ffffff',
                background: '#214935',
                padding: '0 1.15rem',
                borderRadius: '9999px',
                border: '2px solid #1c1b1b',
                boxShadow: '2px 2px 0px #1c1b1b',
                transition: 'var(--transition-smooth)',
                textDecoration: 'none',
                boxSizing: 'border-box',
              }}
            >
              Login
            </Link>
          )}

          {/* Network & Offline Cache Telemetry Badge */}
          <OfflineSyncBadge />

          {/* Language Selector with Google Translate Icon */}
          <div
            style={{
              position: 'relative',
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              background: '#ffffff',
              border: '2px solid #1c1b1b',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '2px 2px 0px #1c1b1b',
            }}
            title={`Language: ${LANGUAGE_LABELS[language]?.name || 'English'}`}
          >
            <Languages size={18} color="#214935" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              style={{
                position: 'absolute',
                inset: 0,
                opacity: 0,
                cursor: 'pointer',
                width: '100%',
                height: '100%',
              }}
              aria-label="Language selection"
            >
              {(Object.keys(LANGUAGE_LABELS) as SupportedLanguage[]).map((key) => (
                <option key={key} value={key}>
                  {LANGUAGE_LABELS[key].nativeName} ({LANGUAGE_LABELS[key].name})
                </option>
              ))}
            </select>
          </div>

          {/* Emergency Call (Compact Icon) */}
          <a
            href={`tel:${patientPhone}`}
            suppressHydrationWarning
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fee2e2',
              color: '#991b1b',
              border: '2px solid #1c1b1b',
              textDecoration: 'none',
              boxShadow: '2px 2px 0px #1c1b1b',
              transition: 'var(--transition-smooth)',
            }}
            title={t('callCaregiver')}
            aria-label="Call registered caregiver"
          >
            <PhoneCall size={18} />
          </a>
        </div>
      </div>
    </header>
  );
}

