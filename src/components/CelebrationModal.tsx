'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Star, CheckCircle, Home } from 'lucide-react';
import Link from 'next/link';
import { useLanguage } from '@/lib/i18n/LanguageContext';

interface CelebrationModalProps {
  isOpen: boolean;
  gameTitle: string;
  score: number;
  timeSpentSec: number;
  message?: string;
  onPlayAgain: () => void;
  nextGameUrl?: string;
}

export function CelebrationModal({
  isOpen,
  gameTitle,
  score,
  timeSpentSec,
  message,
  onPlayAgain,
  nextGameUrl = '/patient',
}: CelebrationModalProps) {
  const { language, t } = useLanguage();

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
            width: '80px',
            height: '80px',
            margin: '0 auto 1.25rem',
            borderRadius: '50%',
            background: 'var(--color-primary-soft)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--color-primary)',
          }}
        >
          <CheckCircle size={48} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
          {[1, 2, 3].map((star) => (
            <Star key={star} size={34} fill="#fbc02d" color="#f57f17" />
          ))}
        </div>

        <h2 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--color-primary)', marginBottom: '0.5rem' }}>
          {t('wonderfulJob')}
        </h2>
        <p style={{ fontSize: '1.1rem', color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          {message || defaultSubtext}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '1rem',
            background: 'var(--color-bg)',
            padding: '1rem',
            borderRadius: '16px',
            marginBottom: '1.75rem',
          }}
        >
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)', fontWeight: 600 }}>
              {t('activity')}
            </div>
            <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text-main)' }}>{gameTitle}</div>
          </div>
          <div>
            <div style={{ fontSize: '0.85rem', color: 'var(--color-text-dim)', fontWeight: 600 }}>
              {t('score')}
            </div>
            <div style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--color-success)' }}>{score}%</div>
          </div>
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
