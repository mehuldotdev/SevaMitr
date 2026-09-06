'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Star, CheckCircle, Home, Activity } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { computeGrade } from '@/lib/scoring/gradingEngine';

interface CelebrationModalProps {
  isOpen: boolean;
  gameTitle: string;
  score: number;
  timeSpentSec: number;
  message?: string;
  biomarkerLabel?: string;
  onPlayAgain: () => void;
  nextGameUrl?: string;
}

export function CelebrationModal({
  isOpen,
  gameTitle,
  score,
  timeSpentSec,
  message,
  biomarkerLabel,
  onPlayAgain,
  nextGameUrl = '/patient',
}: CelebrationModalProps) {
  const { language, t } = useLanguage();
  const grade = computeGrade(score, biomarkerLabel);

  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#d4af37', '#2d6a4f', '#c85a32', '#fbc02d'],
        });
      } catch {
        // Fallback
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const defaultSubtext =
    language === 'as'
      ? 'আপোনাৰ স্মৃতি আৰু মনোযোগ বৰ সুন্দৰভাৱে সক্ৰিয় হৈ আছে।'
      : language === 'bn'
      ? 'আপনার স্মৃতি ও মনোযোগ চমৎকারভাবে সক্রিয় রয়েছে।'
      : language === 'hi'
      ? 'आपकी याददाश्त और एकाग्रता बहुत अच्छी तरह सक्रिय है।'
      : 'Wonderful effort! Your mind and memory are active and strong.';

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(43, 43, 43, 0.6)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
        zIndex: 9999,
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          padding: '2.5rem 2rem',
          borderRadius: '24px',
          background: 'var(--color-surface)',
          boxShadow: '0 20px 50px rgba(0,0,0,0.2)',
        }}
      >
        <div
          style={{
            width: '72px',
            height: '72px',
            margin: '0 auto 1rem',
            borderRadius: '50%',
            background: 'var(--color-primary-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)',
          }}
        >
          <CheckCircle size={44} />
        </div>

        {/* Dynamic 1-3 Stars */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '0.85rem' }}>
          {[1, 2, 3].map((starIndex) => {
            const isFilled = starIndex <= grade.stars;
            return (
              <Star
                key={starIndex}
                size={34}
                fill={isFilled ? '#fbc02d' : '#e2e8f0'}
                color={isFilled ? '#f57f17' : '#94a3b8'}
                style={{
                  filter: isFilled ? 'drop-shadow(0 2px 4px rgba(251, 192, 45, 0.35))' : 'none',
                }}
              />
            );
          })}
        </div>

        {/* Letter Grade Pill */}
        <div style={{ marginBottom: '0.85rem' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.35rem 0.95rem',
              borderRadius: '999px',
              background: grade.badgeBg,
              color: grade.badgeColor,
              fontWeight: 700,
              fontSize: '0.88rem',
              border: `1.5px solid ${grade.badgeColor}33`,
              textTransform: 'uppercase',
              letterSpacing: '0.02em',
            }}
          >
            <span style={{ fontSize: '1.05rem', fontWeight: 800 }}>Grade {grade.letterGrade}</span>
            <span>•</span>
            <span>{grade.gradeLabel}</span>
          </div>
        </div>

        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '0.4rem' }}>
          {t('wonderfulJob')}
        </h2>
        <p style={{ fontSize: '1.05rem', color: 'var(--color-text-muted)', marginBottom: '1.4rem', lineHeight: 1.45 }}>
          {message || defaultSubtext}
        </p>

        {/* Standardized Metrics Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: grade.biomarkerLabel ? '1fr 1fr 1fr' : '1fr 1fr',
            gap: '0.75rem',
            background: 'var(--color-bg)',
            padding: '1rem',
            borderRadius: '16px',
            marginBottom: '1.75rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
              {t('activity')}
            </div>
            <div style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-text-main)', marginTop: '0.2rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {gameTitle}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
              {t('score')}
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-success)', marginTop: '0.1rem' }}>
              {grade.score}%
            </div>
          </div>
          {grade.biomarkerLabel && (
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--color-text-dim)', fontWeight: 600, textTransform: 'uppercase' }}>
                Biomarker
              </div>
              <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#0f4c81', marginTop: '0.25rem' }}>
                {grade.biomarkerLabel}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            onClick={onPlayAgain}
            className="btn-elderly btn-elderly-primary"
            style={{ width: '100%' }}
          >
            {t('playAgain')}
          </button>

          <Link href={nextGameUrl} className="btn-elderly btn-elderly-secondary" style={{ width: '100%' }}>
            <Home size={20} />
            <span>{t('returnHome')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
