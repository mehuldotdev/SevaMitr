'use client';

import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Star, CheckCircle, Home, Activity, ArrowRight, RotateCcw } from 'lucide-react';
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
  homeUrl?: string;
}

export function CelebrationModal({
  isOpen,
  gameTitle,
  score,
  timeSpentSec,
  message,
  biomarkerLabel,
  onPlayAgain,
  nextGameUrl,
  homeUrl = '/patient',
}: CelebrationModalProps) {
  const { language, t } = useLanguage();
  const grade = computeGrade(score, biomarkerLabel);

  // Cognitive circuit sequence mapping
  const DEFAULT_SEQUENCE: Record<string, string> = {
    'BrainHQ: Double Decision': '/patient/games/sound-sweeps',
    'BrainHQ: Sound Sweeps': '/patient/games/target-tracker',
    'BrainHQ: Target Tracker': '/patient/games/speed-maze',
    'Speed Maze (Spatial Navigation)': '/patient/games/bijuli-tap',
    'Bijuli Tap (Psychomotor Speed)': '/patient/games/bikhama-khoj',
    'Bikhama Khoj (Visual Search)': '/patient/games/double-decision',
  };

  const resolvedNextGameUrl =
    (nextGameUrl && nextGameUrl !== '/patient')
      ? nextGameUrl
      : DEFAULT_SEQUENCE[gameTitle] ||
        (gameTitle.includes('Double Decision') ? '/patient/games/sound-sweeps' :
         gameTitle.includes('Sound Sweeps') ? '/patient/games/target-tracker' :
         gameTitle.includes('Target Tracker') ? '/patient/games/speed-maze' :
         gameTitle.includes('Speed Maze') ? '/patient/games/bijuli-tap' :
         gameTitle.includes('Bijuli Tap') ? '/patient/games/bikhama-khoj' :
         gameTitle.includes('Bikhama Khoj') ? '/patient/games/double-decision' :
         '/patient/games/double-decision');

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
        padding: '1rem',
        zIndex: 9999,
        overflowY: 'auto',
      }}
    >
      <div
        className="card"
        style={{
          maxWidth: '520px',
          width: '100%',
          textAlign: 'center',
          padding: '2rem 1.5rem',
          borderRadius: '24px',
          background: 'var(--color-surface, #ffffff)',
          border: '2px solid var(--color-border, #1c1b1b)',
          boxShadow: '6px 6px 0px var(--color-border, #1c1b1b), 0 20px 40px rgba(0,0,0,0.12)',
          boxSizing: 'border-box',
          maxHeight: 'calc(100vh - 2rem)',
          overflowY: 'auto',
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

        {/* Standardized Metrics Bento Container */}
        {(() => {
          let bioName = 'Biomarker';
          let bioValue = grade.biomarkerLabel || '';
          if (grade.biomarkerLabel && grade.biomarkerLabel.includes(':')) {
            const colonIdx = grade.biomarkerLabel.indexOf(':');
            bioName = grade.biomarkerLabel.substring(0, colonIdx).trim();
            bioValue = grade.biomarkerLabel.substring(colonIdx + 1).trim();
          }

          return (
            <div
              style={{
                background: 'var(--color-bg, #f4f7f4)',
                border: '2px solid var(--color-border, #1c1b1b)',
                borderRadius: '16px',
                padding: '1rem',
                marginBottom: '1.5rem',
                boxShadow: '3px 3px 0px var(--color-border, #1c1b1b)',
                textAlign: 'left',
                boxSizing: 'border-box',
                width: '100%',
                overflow: 'hidden',
              }}
            >
              {/* Activity Header Strip */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '0.5rem',
                  paddingBottom: '0.65rem',
                  borderBottom: '1.5px dashed var(--color-border-subtle, #c9dcd0)',
                  marginBottom: '0.75rem',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexShrink: 0 }}>
                  <Activity size={16} color="var(--color-primary, #214935)" />
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      color: 'var(--color-text-dim, #78716c)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.05em',
                    }}
                  >
                    {t('activity')}
                  </span>
                </div>
                <span
                  style={{
                    fontSize: '0.92rem',
                    fontWeight: 700,
                    color: 'var(--color-text-main, #1c1b1b)',
                    textAlign: 'right',
                    wordBreak: 'break-word',
                    flex: '1 1 auto',
                  }}
                >
                  {gameTitle}
                </span>
              </div>

              {/* Stat Cards Grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: grade.biomarkerLabel ? '1fr 1fr' : '1fr',
                  gap: '0.65rem',
                  boxSizing: 'border-box',
                }}
              >
                {/* Score Card */}
                <div
                  style={{
                    background: 'var(--color-surface, #ffffff)',
                    border: '1.5px solid var(--color-border, #1c1b1b)',
                    borderRadius: '12px',
                    padding: '0.75rem 0.5rem',
                    textAlign: 'center',
                    boxShadow: '2px 2px 0px rgba(28,27,27,0.08)',
                    minWidth: 0,
                    boxSizing: 'border-box',
                  }}
                >
                  <div
                    style={{
                      fontSize: '0.72rem',
                      color: 'var(--color-text-dim, #78716c)',
                      fontWeight: 800,
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {t('score')}
                  </div>
                  <div
                    style={{
                      fontSize: '1.65rem',
                      fontWeight: 900,
                      color: 'var(--color-success, #15803d)',
                      marginTop: '0.15rem',
                      lineHeight: 1.15,
                      fontFeatureSettings: '"tnum"',
                    }}
                  >
                    {grade.score}%
                  </div>
                </div>

                {/* Biomarker Card */}
                {grade.biomarkerLabel && (
                  <div
                    style={{
                      background: 'var(--color-surface, #ffffff)',
                      border: '1.5px solid var(--color-border, #1c1b1b)',
                      borderRadius: '12px',
                      padding: '0.75rem 0.5rem',
                      textAlign: 'center',
                      boxShadow: '2px 2px 0px rgba(28,27,27,0.08)',
                      minWidth: 0,
                      boxSizing: 'border-box',
                    }}
                  >
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--color-text-dim, #78716c)',
                        fontWeight: 800,
                        textTransform: 'uppercase',
                        letterSpacing: '0.04em',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                      title={bioName}
                    >
                      {bioName}
                    </div>
                    <div
                      style={{
                        fontSize: '1.45rem',
                        fontWeight: 900,
                        color: '#0f4c81',
                        marginTop: '0.15rem',
                        lineHeight: 1.15,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        fontFeatureSettings: '"tnum"',
                      }}
                      title={bioValue}
                    >
                      {bioValue}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', width: '100%' }}>
          {/* 1. Play Again */}
          <button
            onClick={onPlayAgain}
            className="btn-elderly btn-elderly-secondary"
            style={{
              width: '100%',
              justifyContent: 'center',
              border: '2px solid var(--color-border, #1c1b1b)',
              boxShadow: '2px 2px 0px var(--color-border, #1c1b1b)',
              fontWeight: 700,
            }}
          >
            <RotateCcw size={20} />
            <span>{t('playAgain')}</span>
          </button>

          {/* 2. Next Game (Just above Return to Home) */}
          <Link
            href={resolvedNextGameUrl}
            className="btn-elderly btn-elderly-primary"
            style={{
              width: '100%',
              justifyContent: 'center',
              textDecoration: 'none',
              border: '2px solid var(--color-border, #1c1b1b)',
              boxShadow: '3px 3px 0px var(--color-border, #1c1b1b)',
              fontWeight: 700,
            }}
          >
            <span>{t('nextGame') || 'Next Game'}</span>
            <ArrowRight size={20} />
          </Link>

          {/* 3. Return to Home */}
          <Link
            href={homeUrl}
            className="btn-elderly btn-elderly-secondary"
            style={{
              width: '100%',
              justifyContent: 'center',
              textDecoration: 'none',
              border: '2px solid var(--color-border, #1c1b1b)',
              boxShadow: '2px 2px 0px var(--color-border, #1c1b1b)',
              fontWeight: 700,
            }}
          >
            <Home size={20} />
            <span>{t('returnHome')}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
