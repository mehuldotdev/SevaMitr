'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Users, Search, PhoneCall, Activity, ChevronRight, CheckCircle2, ShieldAlert, ArrowUpRight, UserPlus, Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import { offlineDb, PatientProfile, DEFAULT_PATIENT } from '@/lib/db/offlineDb';
import { useAuth } from '@/lib/auth/AuthContext';
import { useStaleWhileRevalidate } from '@/lib/hooks/useStaleWhileRevalidate';
import { RegisterPatientModal } from '@/components/RegisterPatientModal';

export default function PatientsDirectoryPage() {
  const router = useRouter();
  const { user, isLoggedIn, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeId, setActiveId] = useState(DEFAULT_PATIENT.id);
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [patientToDelete, setPatientToDelete] = useState<PatientProfile | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Stale-While-Revalidate data hook: 0ms cached return + background network revalidation
  const fetchPatients = async (): Promise<PatientProfile[]> => {
    const res = await fetch('/api/patients');
    if (!res.ok) throw new Error('Failed to fetch patients');
    const data = await res.json();
    return data.patients && data.patients.length > 0 ? data.patients : [DEFAULT_PATIENT];
  };

  const {
    data: patients,
    isValidating,
    mutate,
  } = useStaleWhileRevalidate<PatientProfile[]>(
    isLoggedIn && user?.role !== 'PATIENT' ? 'patients_directory' : null,
    fetchPatients,
    {
      initialData: [DEFAULT_PATIENT],
      revalidateOnFocus: true,
      dedupingInterval: 4000,
      persistKey: 'sevamitr_cached_patients',
    }
  );

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
  }, [isLoading, isLoggedIn, user, router]);

  const handleSelectPatient = (p: PatientProfile) => {
    offlineDb.savePatient(p);
    setActiveId(p.id);
  };

  const handleDeletePatient = async () => {
    if (!patientToDelete) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/patients?id=${encodeURIComponent(patientToDelete.id)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to delete patient');
      }

      // Optimistically update SWR data
      const remaining = patients.filter((p) => p.id !== patientToDelete.id);
      mutate(remaining, false);

      // Update persistent cache
      try {
        localStorage.setItem('sevamitr_cached_patients', JSON.stringify(remaining));
      } catch {}

      // If deleting currently active patient, switch to first remaining or default
      if (activeId === patientToDelete.id) {
        const nextActive = remaining[0] || DEFAULT_PATIENT;
        offlineDb.savePatient(nextActive);
        setActiveId(nextActive.id);
      }

      setPatientToDelete(null);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error deleting patient.';
      alert(msg);
    } finally {
      setIsDeleting(false);
    }
  };

  const filteredPatients = patients.filter(
    (p) =>
      p.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.region.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!mounted || isLoading || !isLoggedIn || user?.role === 'PATIENT') {
    return (
      <div style={{ minHeight: 'calc(100vh - 74px)', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f4f7f4', padding: '1.5rem' }}>
        <div className="neo-card font-clash-semibold" style={{ background: '#ffffff', padding: '2.25rem 2rem', textAlign: 'center', maxWidth: '420px', width: '100%' }}>
          <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#faebe6', border: '2px solid #1c1b1b', boxShadow: '3px 3px 0px #1c1b1b', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', color: '#c85a32', margin: '0 auto 1.25rem' }}>
            <ShieldAlert size={28} />
          </div>
          <h2 className="font-clash-bold" style={{ fontSize: '1.4rem', color: '#1c1b1b', margin: '0 0 0.5rem', textTransform: 'uppercase' }}>
            Login Required
          </h2>
          <p className="font-clash-regular" style={{ fontSize: '0.88rem', color: '#57534e', margin: '0 0 1.5rem', lineHeight: 1.4 }}>
            Please log in as an authorized caregiver to access the patient directory.
          </p>
          <Link href="/" className="neo-card font-clash-semibold" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.45rem', background: '#214935', color: '#ffffff', textDecoration: 'none', padding: '0.75rem 1.25rem', borderRadius: '12px', textTransform: 'uppercase', fontSize: '0.92rem' }}>
            <span>Go to Login</span>
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem 0 5rem' }}>
      <div className="container-narrow">
        {/* Navigation */}
        <div style={{ marginBottom: '1.5rem' }}>
          <Link
            href="/caregiver"
            className="neo-pill font-clash-semibold"
            style={{
              background: '#ffffff',
              color: '#1c1b1b',
              padding: '0.45rem 1rem',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              textDecoration: 'none',
              fontSize: '0.88rem',
            }}
          >
            <ArrowLeft size={16} />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* Header */}
        <div
          className="neo-card"
          style={{
            background: '#ffffff',
            padding: '1.75rem',
            marginBottom: '1.75rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.35rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div
                style={{
                  width: '42px',
                  height: '42px',
                  borderRadius: '12px',
                  background: '#e8f5e9',
                  border: '2px solid #1c1b1b',
                  boxShadow: '2px 2px 0px #1c1b1b',
                  color: '#073220',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <Users size={22} />
              </div>
              <h1 className="font-clash-bold" style={{ fontSize: '1.8rem', fontWeight: 700, color: '#1c1b1b', margin: 0, textTransform: 'uppercase' }}>
                Patient Directory
              </h1>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              {isValidating && (
                <span
                  className="neo-pill font-clash-semibold"
                  style={{
                    background: '#fef9c3',
                    color: '#854d0e',
                    border: '1.5px solid #1c1b1b',
                    padding: '0.3rem 0.65rem',
                    fontSize: '0.72rem',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                  }}
                >
                  <Activity size={12} className="animate-spin" />
                  <span>SYNCING</span>
                </span>
              )}

              <button
                onClick={() => setShowRegisterModal(true)}
                className="neo-pill font-clash-bold"
                style={{
                  background: '#214935',
                  color: '#ffffff',
                  border: '2px solid #1c1b1b',
                  boxShadow: '2px 2px 0px #1c1b1b',
                  padding: '0.5rem 1.15rem',
                  fontSize: '0.85rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                }}
              >
                <UserPlus size={16} />
                <span>+ Register Patient</span>
              </button>
            </div>
          </div>
          <p className="font-clash-regular" style={{ fontSize: '0.92rem', color: '#57534e', margin: '0.2rem 0 0', fontWeight: 400 }}>
            Rural ASHA household registry & active cognitive telemetry.
          </p>

          {/* Search bar */}
          <div style={{ marginTop: '1.25rem', position: 'relative' }}>
            <input
              type="text"
              placeholder="Search by name or district..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="font-clash-regular"
              style={{
                width: '100%',
                padding: '0.75rem 1rem 0.75rem 2.75rem',
                borderRadius: '14px',
                border: '2px solid #1c1b1b',
                boxShadow: '2px 2px 0px #1c1b1b',
                fontSize: '0.95rem',
                outline: 'none',
                background: '#ffffff',
                boxSizing: 'border-box',
              }}
            />
            <Search
              size={18}
              color="#57534e"
              style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }}
            />
          </div>
        </div>

        {/* Patient List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filteredPatients.length === 0 ? (
            <div
              className="neo-card"
              style={{
                background: '#ffffff',
                padding: '2.75rem 1.5rem',
                textAlign: 'center',
                border: '2px dashed #1c1b1b',
              }}
            >
              <div
                style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '14px',
                  background: '#f4f7f4',
                  border: '2px solid #1c1b1b',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#57534e',
                  marginBottom: '1rem',
                }}
              >
                <Users size={26} />
              </div>
              <h3
                className="font-clash-bold"
                style={{ fontSize: '1.25rem', color: '#1c1b1b', margin: '0 0 0.4rem', textTransform: 'uppercase' }}
              >
                No Patients Found
              </h3>
              <p className="font-clash-regular" style={{ fontSize: '0.9rem', color: '#57534e', margin: '0 0 1.35rem' }}>
                {searchQuery
                  ? `No matching records found for "${searchQuery}".`
                  : 'You have not registered any elderly patients yet.'}
              </p>
              <button
                onClick={() => setShowRegisterModal(true)}
                className="neo-pill font-clash-bold"
                style={{
                  background: '#214935',
                  color: '#ffffff',
                  border: '2px solid #1c1b1b',
                  boxShadow: '2px 2px 0px #1c1b1b',
                  padding: '0.6rem 1.25rem',
                  fontSize: '0.9rem',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  cursor: 'pointer',
                  textTransform: 'uppercase',
                  margin: '0 auto',
                }}
              >
                <UserPlus size={16} />
                <span>Register Patient Now</span>
              </button>
            </div>
          ) : (
            filteredPatients.map((p) => {
              const isCurrent = p.id === activeId;
              return (
                <div
                  key={p.id}
                  className="neo-card"
                  style={{
                    background: isCurrent ? '#f4faf5' : '#ffffff',
                    border: '2px solid #1c1b1b',
                    boxShadow: isCurrent ? '4px 4px 0px #214935' : '3px 3px 0px #1c1b1b',
                    padding: '1.35rem 1.5rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    flexWrap: 'wrap',
                    gap: '1rem',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '0.25rem' }}>
                      <h2 className="font-clash-bold" style={{ fontSize: '1.4rem', fontWeight: 700, color: '#1c1b1b', margin: 0, textTransform: 'uppercase' }}>
                        {p.fullName}
                      </h2>

                      <span className="neo-pill neo-pill-green font-clash-wide" style={{ fontSize: '0.68rem', padding: '0.12rem 0.45rem' }}>
                        {p.dementiaStage}
                      </span>

                      {isCurrent && (
                        <span className="neo-pill neo-pill-terracotta font-clash-wide" style={{ fontSize: '0.68rem', padding: '0.12rem 0.45rem' }}>
                          ACTIVE
                        </span>
                      )}
                    </div>

                    <div className="font-clash-regular" style={{ fontSize: '0.88rem', color: '#57534e', marginBottom: '0.15rem', fontWeight: 400 }}>
                      {p.age}y • {p.gender} • <strong>{p.region}</strong>
                    </div>

                    <div className="font-clash-light" style={{ fontSize: '0.8rem', color: '#78716c', fontWeight: 300 }}>
                      Caregiver: {p.caregiverName} ({p.caregiverPhone})
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <button
                      onClick={() => handleSelectPatient(p)}
                      className="font-clash-semibold"
                      style={{
                        background: isCurrent ? '#214935' : '#ffffff',
                        color: isCurrent ? '#ffffff' : '#1c1b1b',
                        border: '2px solid #1c1b1b',
                        boxShadow: '2px 2px 0px #1c1b1b',
                        borderRadius: '12px',
                        height: '40px',
                        minHeight: '40px',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        textTransform: 'uppercase',
                        padding: '0.4rem 1rem',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        transition: 'all 0.15s ease',
                        boxSizing: 'border-box',
                      }}
                    >
                      <span>{isCurrent ? 'Viewing' : 'Select'}</span>
                      <ChevronRight size={16} />
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPatientToDelete(p);
                      }}
                      className="font-clash-semibold"
                      style={{
                        background: '#fee2e2',
                        color: '#991b1b',
                        border: '2px solid #1c1b1b',
                        boxShadow: '2px 2px 0px #1c1b1b',
                        borderRadius: '12px',
                        width: '40px',
                        height: '40px',
                        minHeight: '40px',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                        boxSizing: 'border-box',
                        padding: 0,
                      }}
                      title={`Delete ${p.fullName}`}
                      aria-label={`Delete ${p.fullName}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Register Patient Modal */}
        <RegisterPatientModal
          isOpen={showRegisterModal}
          onClose={() => setShowRegisterModal(false)}
          onPatientRegistered={(newPatient) => {
            setActiveId(newPatient.id);
            mutate((prev) => {
              const current = prev || [];
              if (current.some((p) => p.id === newPatient.id)) return current;
              return [newPatient, ...current];
            }, false);
          }}
        />

        {/* Delete Confirmation Modal */}
        {patientToDelete && (
          <div
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(28, 27, 27, 0.65)',
              backdropFilter: 'blur(6px)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1.25rem',
            }}
            onClick={() => !isDeleting && setPatientToDelete(null)}
          >
            <div
              className="neo-card font-clash-regular"
              style={{
                background: '#ffffff',
                maxWidth: '440px',
                width: '100%',
                padding: '2rem 1.75rem',
                border: '2px solid #1c1b1b',
                boxShadow: '4px 4px 0px #1c1b1b',
                borderRadius: '16px',
                textAlign: 'center',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  width: '54px',
                  height: '54px',
                  borderRadius: '16px',
                  background: '#fee2e2',
                  border: '2px solid #1c1b1b',
                  boxShadow: '2px 2px 0px #1c1b1b',
                  color: '#dc2626',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                }}
              >
                <AlertTriangle size={28} />
              </div>

              <h2
                className="font-clash-bold"
                style={{
                  fontSize: '1.35rem',
                  fontWeight: 700,
                  color: '#1c1b1b',
                  margin: '0 0 0.5rem',
                  textTransform: 'uppercase',
                }}
              >
                Delete Patient?
              </h2>

              <p
                className="font-clash-regular"
                style={{
                  fontSize: '0.92rem',
                  color: '#57534e',
                  lineHeight: 1.45,
                  margin: '0 0 1.5rem',
                }}
              >
                Are you sure you want to remove <strong>{patientToDelete.fullName}</strong> ({patientToDelete.age}y, {patientToDelete.region}) from the directory? This action cannot be undone.
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setPatientToDelete(null)}
                  className="font-clash-semibold"
                  style={{
                    flex: 1,
                    padding: '0.65rem 1rem',
                    background: '#f4f7f4',
                    color: '#1c1b1b',
                    border: '2px solid #1c1b1b',
                    boxShadow: '2px 2px 0px #1c1b1b',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                  }}
                >
                  Cancel
                </button>

                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeletePatient}
                  className="font-clash-bold"
                  style={{
                    flex: 1,
                    padding: '0.65rem 1rem',
                    background: '#dc2626',
                    color: '#ffffff',
                    border: '2px solid #1c1b1b',
                    boxShadow: '2px 2px 0px #1c1b1b',
                    borderRadius: '12px',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    cursor: isDeleting ? 'not-allowed' : 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.4rem',
                  }}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} />
                      <span>Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
