'use client';

import React, { useState } from 'react';
import {
  X,
  UserPlus,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { PatientProfile, offlineDb } from '@/lib/db/offlineDb';
import { useAuth } from '@/lib/auth/AuthContext';

interface RegisterPatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPatientRegistered: (patient: PatientProfile) => void;
}

export function RegisterPatientModal({
  isOpen,
  onClose,
  onPatientRegistered,
}: RegisterPatientModalProps) {
  const { user } = useAuth();

  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState<number | ''>(72);
  const [gender, setGender] = useState<'Female' | 'Male' | 'Other'>('Female');
  const [region, setRegion] = useState(user?.region || 'Kamrup Rural, Assam');
  const [primaryLanguage, setPrimaryLanguage] = useState<'as' | 'bn' | 'hi' | 'en'>('en');
  const [dementiaStage, setDementiaStage] = useState<'MCI' | 'Mild' | 'Moderate'>('Mild');
  const [emergencyContact, setEmergencyContact] = useState(user?.identifier?.startsWith('+') ? user.identifier : '+91 94350 12345');
  
  // Optional Kiosk Login
  const [enableKiosk, setEnableKiosk] = useState(false);
  const [kioskIdentifier, setKioskIdentifier] = useState('');
  const [kioskPassword, setKioskPassword] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (!fullName.trim()) {
      setErrorMessage('Please enter the patient’s full name.');
      return;
    }

    setLoading(true);

    try {
      const payload = {
        fullName: fullName.trim(),
        age: typeof age === 'number' ? age : 70,
        gender,
        region: region.trim() || 'Assam, North Eastern Region',
        primaryLanguage,
        dementiaStage,
        emergencyContact: emergencyContact.trim(),
        caregiverId: user?.id || `cg-${user?.identifier || Date.now()}`,
        caregiverName: user?.fullName || 'Primary Caregiver',
        caregiverPhone: user?.identifier || emergencyContact.trim(),
        ...(enableKiosk && kioskIdentifier.trim()
          ? {
              patientIdentifier: kioskIdentifier.trim().toLowerCase(),
              patientPassword: kioskPassword || 'password123',
            }
          : {}),
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

      // Save to local offline store so kiosk and local views immediately resolve
      offlineDb.savePatient(createdPatient);

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onPatientRegistered(createdPatient);
        onClose();
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(28, 27, 27, 0.72)',
        backdropFilter: 'blur(6px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        boxSizing: 'border-box',
      }}
      onClick={onClose}
    >
      <div
        className="neo-card"
        style={{
          background: '#ffffff',
          maxWidth: '560px',
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
        {/* Header */}
        <div
          style={{
            padding: '1.2rem 1.5rem',
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
              <UserPlus size={20} />
            </div>
            <div>
              <div
                className="font-clash-bold"
                style={{ fontSize: '1.1rem', color: '#1c1b1b', textTransform: 'uppercase', lineHeight: 1.1 }}
              >
                Register New Patient
              </div>
              <div className="font-clash-regular" style={{ fontSize: '0.78rem', color: '#57534e' }}>
                Caregiver Supervision & Household Telemetry
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close dialog"
            style={{
              background: '#ffffff',
              border: '2px solid #1c1b1b',
              borderRadius: '8px',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '1px 1px 0px #1c1b1b',
            }}
          >
            <X size={18} color="#1c1b1b" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div style={{ padding: '1.5rem', overflowY: 'auto', flex: 1 }}>
          {errorMessage && (
            <div
              className="neo-pill"
              style={{
                width: '100%',
                background: '#fee2e2',
                color: '#991b1b',
                border: '1.5px solid #991b1b',
                padding: '0.6rem 0.8rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                boxSizing: 'border-box',
              }}
            >
              <AlertCircle size={16} />
              <span>{errorMessage}</span>
            </div>
          )}

          {success && (
            <div
              className="neo-pill"
              style={{
                width: '100%',
                background: '#dcfce7',
                color: '#166534',
                border: '1.5px solid #166534',
                padding: '0.6rem 0.8rem',
                marginBottom: '1rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                fontSize: '0.85rem',
                boxSizing: 'border-box',
              }}
            >
              <CheckCircle2 size={16} />
              <span>Patient successfully registered and linked!</span>
            </div>
          )}

          <form onSubmit={handleSubmit} id="register-patient-form">
            {/* Section: Demographics */}
            <div style={{ marginBottom: '1.25rem' }}>
              <span
                className="font-clash-bold"
                style={{ fontSize: '0.78rem', color: '#214935', textTransform: 'uppercase', letterSpacing: '0.04em' }}
              >
                1. Patient Demographics
              </span>

              <div style={{ marginTop: '0.6rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div>
                  <label
                    className="font-regus"
                    style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}
                  >
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rohini Kalita"
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label
                      className="font-regus"
                      style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}
                    >
                      Age (Years)
                    </label>
                    <input
                      type="number"
                      min={40}
                      max={115}
                      required
                      value={age}
                      onChange={(e) => setAge(e.target.value === '' ? '' : parseInt(e.target.value, 10))}
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

                  <div>
                    <label
                      className="font-regus"
                      style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}
                    >
                      Gender
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value as 'Female' | 'Male' | 'Other')}
                      style={{
                        width: '100%',
                        padding: '0.6rem 0.75rem',
                        borderRadius: '10px',
                        border: '2px solid #1c1b1b',
                        fontSize: '0.9rem',
                        background: '#ffffff',
                        boxSizing: 'border-box',
                      }}
                    >
                      <option value="Female">Female</option>
                      <option value="Male">Male</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label
                    className="font-regus"
                    style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}
                  >
                    Region / District / Village
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Nalbari, Assam"
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
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
              </div>
            </div>

            {/* Section: Clinical Baseline */}
            <div style={{ marginBottom: '1.25rem' }}>
              <span
                className="font-clash-bold"
                style={{ fontSize: '0.78rem', color: '#214935', textTransform: 'uppercase', letterSpacing: '0.04em' }}
              >
                2. Clinical & Language Profile
              </span>

              <div style={{ marginTop: '0.6rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label
                    className="font-regus"
                    style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}
                  >
                    Primary Language
                  </label>
                  <select
                    value={primaryLanguage}
                    onChange={(e) => setPrimaryLanguage(e.target.value as 'as' | 'bn' | 'hi' | 'en')}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '10px',
                      border: '2px solid #1c1b1b',
                      fontSize: '0.9rem',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="en">English</option>
                    <option value="as">অসমীয়া (Assamese)</option>
                    <option value="bn">বাংলা (Bengali)</option>
                    <option value="hi">हिन्दी (Hindi)</option>
                  </select>
                </div>

                <div>
                  <label
                    className="font-regus"
                    style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}
                  >
                    Dementia Stage
                  </label>
                  <select
                    value={dementiaStage}
                    onChange={(e) => setDementiaStage(e.target.value as 'MCI' | 'Mild' | 'Moderate')}
                    style={{
                      width: '100%',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '10px',
                      border: '2px solid #1c1b1b',
                      fontSize: '0.9rem',
                      background: '#ffffff',
                      boxSizing: 'border-box',
                    }}
                  >
                    <option value="MCI">MCI (Mild Impairment)</option>
                    <option value="Mild">Mild Dementia</option>
                    <option value="Moderate">Moderate Dementia</option>
                  </select>
                </div>
              </div>

              <div style={{ marginTop: '0.75rem' }}>
                <label
                  className="font-regus"
                  style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.25rem' }}
                >
                  Emergency / Family Contact Phone
                </label>
                <input
                  type="tel"
                  required
                  placeholder="+91 94350 12345"
                  value={emergencyContact}
                  onChange={(e) => setEmergencyContact(e.target.value)}
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
            </div>

            {/* Section: Optional Kiosk Passkey */}
            <div
              style={{
                marginBottom: '1rem',
                padding: '0.85rem',
                borderRadius: '12px',
                background: '#f8fafc',
                border: '1.5px solid #cbd5e1',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <label
                  htmlFor="enable-kiosk-toggle"
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}
                >
                  <input
                    id="enable-kiosk-toggle"
                    type="checkbox"
                    checked={enableKiosk}
                    onChange={(e) => setEnableKiosk(e.target.checked)}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                  />
                  <span className="font-clash-semibold" style={{ fontSize: '0.85rem', color: '#1c1b1b' }}>
                    Enable Dedicated Tablet / Kiosk Login
                  </span>
                </label>
                <KeyRound size={16} color="#64748b" />
              </div>
              <p
                className="font-clash-regular"
                style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.35rem 0 0 1.5rem', lineHeight: 1.3 }}
              >
                Allows the elder to log in on household or clinic tablets without using your caregiver account.
              </p>

              {enableKiosk && (
                <div style={{ marginTop: '0.85rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <label
                      className="font-regus"
                      style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.2rem' }}
                    >
                      Patient Username
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. rohini"
                      value={kioskIdentifier}
                      onChange={(e) => setKioskIdentifier(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.65rem',
                        borderRadius: '8px',
                        border: '1.5px solid #1c1b1b',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                  <div>
                    <label
                      className="font-regus"
                      style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.2rem' }}
                    >
                      Simple PIN / Passkey
                    </label>
                    <input
                      type="password"
                      placeholder="e.g. 1234"
                      value={kioskPassword}
                      onChange={(e) => setKioskPassword(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.5rem 0.65rem',
                        borderRadius: '8px',
                        border: '1.5px solid #1c1b1b',
                        fontSize: '0.85rem',
                        boxSizing: 'border-box',
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Supervising Caregiver Callout */}
            <div
              style={{
                background: '#f4f7f4',
                padding: '0.75rem 0.9rem',
                borderRadius: '10px',
                border: '1.5px dashed #214935',
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                marginBottom: '0.5rem',
              }}
            >
              <ShieldCheck size={18} color="#214935" style={{ flexShrink: 0 }} />
              <div className="font-clash-regular" style={{ fontSize: '0.76rem', color: '#214935', lineHeight: 1.3 }}>
                This patient will be supervised under <strong>{user?.fullName || 'Caregiver'}</strong>. Daily cognitive metrics will automatically stream to your dashboard.
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '1rem 1.5rem',
            borderTop: '2px solid #1c1b1b',
            background: '#fbfdfb',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: '0.75rem',
          }}
        >
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="font-regus"
            style={{
              padding: '0.65rem 1.25rem',
              borderRadius: '10px',
              border: '2px solid #1c1b1b',
              background: '#ffffff',
              color: '#1c1b1b',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: 'pointer',
              textTransform: 'uppercase',
            }}
          >
            Cancel
          </button>

          <button
            type="submit"
            form="register-patient-form"
            disabled={loading}
            className="font-regus"
            style={{
              padding: '0.65rem 1.4rem',
              borderRadius: '10px',
              border: '2px solid #1c1b1b',
              boxShadow: '3px 3px 0px #1c1b1b',
              background: '#214935',
              color: '#ffffff',
              fontWeight: 800,
              fontSize: '0.88rem',
              cursor: loading ? 'not-allowed' : 'pointer',
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
            }}
          >
            <UserPlus size={16} />
            <span>{loading ? 'Registering...' : 'Register Patient'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
