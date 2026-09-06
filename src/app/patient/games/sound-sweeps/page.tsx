'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Volume2, Play, CheckCircle2, RotateCcw, Activity, ArrowUp, ArrowDown, Maximize2, Minimize2 } from 'lucide-react';
import { brainHqAudio } from '@/lib/audio/brainHqAudio';
import { offlineDb } from '@/lib/db/offlineDb';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { CelebrationModal } from '@/components/CelebrationModal';
import { scoreSoundSweeps } from '@/lib/scoring/gradingEngine';

type SweepDirection = 'up' | 'down';

interface SweepPattern {
  id: string;
  s1: SweepDirection;
  s2: SweepDirection;
  label: string;
}

const PATTERNS: SweepPattern[] = [
  { id: 'up_up', s1: 'up', s2: 'up', label: 'Up • Up' },
  { id: 'up_down', s1: 'up', s2: 'down', label: 'Up • Down' },
  { id: 'down_up', s1: 'down', s2: 'up', label: 'Down • Up' },
  { id: 'down_down', s1: 'down', s2: 'down', label: 'Down • Down' },
];

export default function SoundSweepsGame() {
  const router = useRouter();
  const { language, t } = useLanguage();

  const [trial, setTrial] = useState<number>(1);
  const maxTrials = 5;
  const [isiMs, setIsiMs] = useState<number>(300); // Inter-stimulus interval temporal resolution
  const [state, setState] = useState<'READY' | 'PLAYING_AUDIO' | 'USER_INPUT' | 'FEEDBACK' | 'COMPLETE'>('READY');
  const [currentPattern, setCurrentPattern] = useState<SweepPattern>(PATTERNS[0]);
  const [userSelection, setUserSelection] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Metrics
  const [score, setScore] = useState<number>(0);
  const [biomarkerLabel, setBiomarkerLabel] = useState<string>('Temporal ISI: 120ms');
  const [thresholdsAchieved, setThresholdsAchieved] = useState<number[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const errorCountRef = useRef<number>(0);
  const correctCountRef = useRef<number>(0);
  const totalDurationStartRef = useRef<number>(Date.now());

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (typeof document === 'undefined') return;
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleGoBack = () => {
    if (typeof document !== 'undefined' && document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    }
    router.push('/patient');
  };

  const generateAndPlaySweeps = async () => {
    // Pick random pattern
    const nextPattern = PATTERNS[Math.floor(Math.random() * PATTERNS.length)];
    setCurrentPattern(nextPattern);
    setUserSelection(null);
    setIsCorrect(null);
    setState('PLAYING_AUDIO');

    // Play sweeps sequentially with current ISI gap
    await brainHqAudio.playSequentialSweeps(nextPattern.s1, nextPattern.s2, isiMs);

    setState('USER_INPUT');
  };

  const handleChoice = (patternId: string) => {
    setUserSelection(patternId);
    const correct = patternId === currentPattern.id;
    setIsCorrect(correct);
    setState('FEEDBACK');

    if (correct) {
      brainHqAudio.playSuccessChime();
      correctCountRef.current += 1;
      setScore(Math.round((correctCountRef.current / maxTrials) * 100));
      setThresholdsAchieved((prev) => [...prev, isiMs]);

      // Psychophysics 2-down 1-up staircase: make the temporal gap tighter (faster processing)
      setIsiMs((prev) => Math.max(50, Math.round(prev * 0.75)));
    } else {
      brainHqAudio.playGentleError();
      errorCountRef.current += 1;
      // Lengthen gap to give brain more auditory temporal resolution
      setIsiMs((prev) => Math.min(500, Math.round(prev * 1.25)));
    }

    setTimeout(() => {
      if (trial >= maxTrials) {
        finishGame();
      } else {
        setTrial((prev) => prev + 1);
        setState('READY');
      }
    }, 1300);
  };

  const finishGame = () => {
    setState('COMPLETE');
    const totalDurationSec = Math.round((Date.now() - totalDurationStartRef.current) / 1000);
    const bestThreshold = thresholdsAchieved.length > 0 ? Math.min(...thresholdsAchieved) : isiMs;

    const { score: calibratedScore, biomarker } = scoreSoundSweeps(
      correctCountRef.current,
      maxTrials,
      bestThreshold
    );

    setScore(calibratedScore);
    setBiomarkerLabel(biomarker);

    offlineDb.saveSession({
      patientId: offlineDb.getPatient().id,
      gameId: 'sound_sweeps',
      gameTitle: 'BrainHQ: Sound Sweeps (Auditory Temporal Processing)',
      difficultyLevel: 3,
      score: calibratedScore,
      durationSec: totalDurationSec,
      hesitationMs: bestThreshold,
      errorCount: errorCountRef.current,
      confusionLoops: 0,
      completed: true,
      timeOfDay: new Date().getHours() >= 5 && new Date().getHours() < 13 ? 'morning' : 'evening',
    });
  };

  const replayCurrent = async () => {
    setState('PLAYING_AUDIO');
    await brainHqAudio.playSequentialSweeps(currentPattern.s1, currentPattern.s2, isiMs);
    setState('USER_INPUT');
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f4f7f4',
        padding: '1.5rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
      }}
    >
      <div style={{ width: '100%', maxWidth: '720px' }}>
        {/* Top Header Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.25rem',
            gap: '0.65rem',
          }}
        >
          <button
            type="button"
            onClick={handleGoBack}
            className="neo-pill font-clash-semibold"
            style={{
              background: '#ffffff',
              color: '#1c1b1b',
              padding: '0.45rem 0.95rem',
              fontSize: '0.92rem',
              fontWeight: 600,
              textTransform: 'uppercase',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              cursor: 'pointer',
            }}
          >
            <ArrowLeft size={17} />
            <span>Go Back</span>
          </button>

          {/* Acoustic Metric Badge */}
          <div
            className="neo-pill neo-pill-amber font-clash-wide"
            style={{ fontSize: '0.72rem' }}
          >
            <Activity size={14} />
            <span>ISI: {isiMs} MS</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <button
              type="button"
              onClick={toggleFullscreen}
              className="neo-pill font-clash-semibold"
              style={{
                background: '#ffffff',
                color: '#1c1b1b',
                padding: '0.45rem 0.95rem',
                fontSize: '0.92rem',
                fontWeight: 600,
                textTransform: 'uppercase',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                cursor: 'pointer',
              }}
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
            </button>
          </div>
        </div>

        {/* Main Acoustic Test Card */}
        <div
          className="neo-card"
          style={{
            background: '#ffffff',
            padding: '1.75rem',
            textAlign: 'center',
          }}
        >
          {/* Header */}
          <div style={{ marginBottom: '1.25rem' }}>
            <div className="neo-pill neo-pill-amber" style={{ marginBottom: '0.5rem' }}>
              <span className="font-clash-wide" style={{ fontSize: '0.7rem' }}>AUDITORY SPEED</span>
            </div>
            <h1
              className="font-clash-bold"
              style={{
                fontSize: '1.65rem',
                fontWeight: 700,
                color: '#1c1b1b',
                margin: '0 0 0.25rem',
                textTransform: 'uppercase',
              }}
            >
              {t('soundSweepsTitle')}
            </h1>
            <p className="font-clash-medium" style={{ color: '#57534e', fontSize: '0.9rem', margin: 0, fontWeight: 500 }}>
              Trial {trial} / {maxTrials} • {isiMs} ms
            </p>
          </div>

          {/* Sound Arena */}
          <div
            style={{
              padding: '2rem 1.5rem',
              borderRadius: '24px',
              background: '#f8faf9',
              border: '2px dashed #c9dcd0',
              margin: '1rem 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '180px',
            }}
          >
            {state === 'READY' && (
              <div>
                <button
                  onClick={generateAndPlaySweeps}
                  style={{
                    background: '#214935',
                    color: '#ffffff',
                    border: 'none',
                    borderRadius: '9999px',
                    padding: '0.9rem 2.2rem',
                    fontSize: '1.15rem',
                    fontWeight: 700,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.65rem',
                    cursor: 'pointer',
                    boxShadow: '0 6px 16px rgba(33,73,53,0.25)',
                    transition: 'transform 0.15s ease',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.03)')}
                  onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <Play size={20} fill="#ffffff" />
                  <span>Play 2 Tones (Listen Carefully)</span>
                </button>
                <div style={{ marginTop: '0.6rem', fontSize: '0.85rem', color: '#688071' }}>
                  Two consecutive frequency sweeps will play via pure Web Audio
                </div>
              </div>
            )}

            {state === 'PLAYING_AUDIO' && (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
                <div
                  style={{
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#e6efe8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    animation: 'pulse 0.8s infinite alternate',
                  }}
                >
                  <Volume2 size={32} color="#214935" />
                </div>
                <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#214935' }}>
                  Listening to Sound Sweeps...
                </div>
              </div>
            )}

            {state === 'USER_INPUT' && (
              <div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: '#214935', marginBottom: '0.5rem' }}>
                  What direction did the two sounds sweep?
                </div>
                <button
                  onClick={replayCurrent}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #c9dcd0',
                    padding: '0.35rem 0.8rem',
                    borderRadius: '9999px',
                    fontSize: '0.85rem',
                    color: '#214935',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <RotateCcw size={13} />
                  <span>Replay Sound</span>
                </button>
              </div>
            )}

            {state === 'FEEDBACK' && (
              <div>
                {isCorrect ? (
                  <div style={{ color: '#2e7d32' }}>
                    <div style={{ fontSize: '2.4rem' }}>🌟</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>Sharp Ear! Correct!</div>
                    <div style={{ fontSize: '0.85rem' }}>Acoustic gap compressed to {isiMs}ms</div>
                  </div>
                ) : (
                  <div style={{ color: '#c85a32' }}>
                    <div style={{ fontSize: '2.4rem' }}>👂</div>
                    <div style={{ fontSize: '1.2rem', fontWeight: 800 }}>Good attempt!</div>
                    <div style={{ fontSize: '0.85rem' }}>Correct pattern was: {currentPattern.label}</div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 4 Large Tactile Input Options */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: '1rem',
              marginTop: '1.25rem',
            }}
          >
            {PATTERNS.map((p) => {
              const isSelected = userSelection === p.id;
              return (
                <button
                  key={p.id}
                  disabled={state !== 'USER_INPUT'}
                  onClick={() => handleChoice(p.id)}
                  style={{
                    background: isSelected ? '#e6efe8' : '#ffffff',
                    border: isSelected ? '2.5px solid #214935' : '1.5px solid #d3e2d6',
                    borderRadius: '20px',
                    padding: '1.15rem 1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '1rem',
                    cursor: state === 'USER_INPUT' ? 'pointer' : 'default',
                    opacity: state === 'USER_INPUT' ? 1 : 0.6,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (state === 'USER_INPUT') {
                      e.currentTarget.style.borderColor = '#214935';
                      e.currentTarget.style.transform = 'translateY(-2px)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  {/* Visual Arrows */}
                  <div style={{ display: 'flex', gap: '0.35rem' }}>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: p.s1 === 'up' ? '#e8f5e9' : '#fff3e0',
                        color: p.s1 === 'up' ? '#2e7d32' : '#e65100',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {p.s1 === 'up' ? <ArrowUp size={22} strokeWidth={3} /> : <ArrowDown size={22} strokeWidth={3} />}
                    </div>
                    <div
                      style={{
                        width: '38px',
                        height: '38px',
                        borderRadius: '50%',
                        background: p.s2 === 'up' ? '#e8f5e9' : '#fff3e0',
                        color: p.s2 === 'up' ? '#2e7d32' : '#e65100',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      {p.s2 === 'up' ? <ArrowUp size={22} strokeWidth={3} /> : <ArrowDown size={22} strokeWidth={3} />}
                    </div>
                  </div>

                  <div style={{ textAlign: 'left' }}>
                    <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#214935' }}>
                      {p.label}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#688071' }}>
                      {p.s1 === 'up' ? 'Low→High' : 'High→Low'} + {p.s2 === 'up' ? 'Low→High' : 'High→Low'}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Neuro-Metrics Strip */}
          <div
            style={{
              marginTop: '1.5rem',
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '0.75rem',
              paddingTop: '1.25rem',
              borderTop: '2px solid #1c1b1b',
            }}
          >
            <div
              className="neo-card"
              style={{
                background: '#fcf9f8',
                padding: '0.75rem',
                boxShadow: '2px 2px 0px #1c1b1b',
              }}
            >
              <div className="font-regus-wide" style={{ fontSize: '0.68rem', color: '#57534e' }}>
                ISI GAP
              </div>
              <div className="font-regus-metric" style={{ fontSize: '1.6rem', color: '#0f4c81', marginTop: '0.2rem' }}>
                {isiMs} ms
              </div>
            </div>

            <div
              className="neo-card"
              style={{
                background: '#fcf9f8',
                padding: '0.75rem',
                boxShadow: '2px 2px 0px #1c1b1b',
              }}
            >
              <div className="font-regus-wide" style={{ fontSize: '0.68rem', color: '#57534e' }}>
                ACCURACY
              </div>
              <div className="font-regus-metric" style={{ fontSize: '1.6rem', color: '#0f4c81', marginTop: '0.2rem' }}>
                {trial > 1
                  ? Math.round(((trial - 1 - errorCountRef.current) / (trial - 1)) * 100)
                  : 100}
                %
              </div>
            </div>

            <div
              className="neo-card"
              style={{
                background: '#fcf9f8',
                padding: '0.75rem',
                boxShadow: '2px 2px 0px #1c1b1b',
              }}
            >
              <div className="font-regus-wide" style={{ fontSize: '0.68rem', color: '#57534e' }}>
                ACCURACY
              </div>
              <div className="font-regus-metric" style={{ fontSize: '1.6rem', color: '#0f4c81', marginTop: '0.2rem' }}>
                {score}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <CelebrationModal
        isOpen={state === 'COMPLETE'}
        gameTitle="BrainHQ: Sound Sweeps"
        score={score}
        timeSpentSec={Math.round((Date.now() - totalDurationStartRef.current) / 1000)}
        message={`Acoustic Temporal Resolution: ${isiMs}ms. Primary auditory cortex frequency discrimination tested.`}
        biomarkerLabel={biomarkerLabel}
        onPlayAgain={() => {
          setTrial(1);
          setScore(0);
          correctCountRef.current = 0;
          setIsiMs(300);
          setState('READY');
          totalDurationStartRef.current = Date.now();
        }}
        nextGameUrl="/patient/games/target-tracker"
      />
    </div>
  );
}
