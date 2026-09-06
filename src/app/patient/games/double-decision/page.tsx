'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Sparkles, CheckCircle2, RotateCcw, Zap, Maximize2, Minimize2 } from 'lucide-react';
import { brainHqAudio } from '@/lib/audio/brainHqAudio';
import { offlineDb } from '@/lib/db/offlineDb';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { scoreDoubleDecision } from '@/lib/scoring/gradingEngine';
import { CelebrationModal } from '@/components/CelebrationModal';
import { CONTRASTING_PAIRS, shuffleArray } from '@/lib/games/emojiPool';

interface CenterChoice {
  id: string;
  name: string;
  symbol: string;
}

const EMOJI_NAMES: Record<string, string> = {
  '🍃': 'Green Leaf',
  '🍂': 'Golden Leaf',
  '🪷': 'Lotus',
  '🌸': 'Blossom',
  '🌕': 'Full Moon',
  '☀️': 'Bright Sun',
  '🌻': 'Sunflower',
  '🌺': 'Hibiscus',
  '🍎': 'Fresh Apple',
  '🥭': 'Ripe Mango',
  '🥥': 'Coconut',
  '🍌': 'Banana',
  '🪔': 'Diya Lamp',
  '🏮': 'Lantern',
  '🔔': 'Temple Bell',
  '🥁': 'Dhol Drum',
  '🧺': 'Tea Basket',
  '📦': 'Parcel Box',
  '🛶': 'Canoe',
  '⛵': 'Sailboat',
  '🛺': 'Auto Rickshaw',
  '🚲': 'Bicycle',
  '⭐': 'Star',
  '✨': 'Sparkles',
  '☁️': 'Cloud',
  '🌧️': 'Raincloud',
  '🦋': 'Butterfly',
  '🐝': 'Honeybee',
  '🌾': 'Paddy Rice',
  '🎋': 'Bamboo',
  '🏆': 'Assam Xorai',
  '🦏': 'Kaziranga Rhino',
  '🦜': 'Hornbill Bird',
  '🚗': 'Vintage Car',
};

function generateCenterPairs(): [CenterChoice, CenterChoice][] {
  const distinct = CONTRASTING_PAIRS.filter((p) => !p.isOrientationFlip);
  const shuffled = shuffleArray(distinct);
  return shuffled.slice(0, 6).map((p, idx) => [
    { id: `c_${idx}_a`, name: EMOJI_NAMES[p.distractor] || p.title, symbol: p.distractor },
    { id: `c_${idx}_b`, name: EMOJI_NAMES[p.target] || p.title, symbol: p.target },
  ]);
}

// 8 Peripheral Radial Angles (0 to 315 deg)
const RADIAL_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

export default function DoubleDecisionGame() {
  const router = useRouter();
  const { language, t } = useLanguage();

  // Psychophysics exposure duration (ms) - adaptive threshold
  const [exposureMs, setExposureMs] = useState<number>(450);
  const [trial, setTrial] = useState<number>(1);
  const maxTrials = 6;

  // Game phases: 'READY' | 'FLASHING' | 'MASK' | 'CENTER_INPUT' | 'PERIPHERAL_INPUT' | 'FEEDBACK' | 'COMPLETE'
  const [phase, setPhase] = useState<
    'READY' | 'FLASHING' | 'MASK' | 'CENTER_INPUT' | 'PERIPHERAL_INPUT' | 'FEEDBACK' | 'COMPLETE'
  >('READY');

  // Stimulus state
  const [centerPairs, setCenterPairs] = useState<[CenterChoice, CenterChoice][]>(() => generateCenterPairs());
  const [currentPairIndex, setCurrentPairIndex] = useState<number>(0);
  const [centerTargetIndex, setCenterTargetIndex] = useState<0 | 1>(0); // which item from the pair
  const [peripheralAngleIndex, setPeripheralAngleIndex] = useState<number>(0);

  // User responses
  const [userCenterChoice, setUserCenterChoice] = useState<string | null>(null);
  const [userAngleChoice, setUserAngleChoice] = useState<number | null>(null);
  const [lastTrialSuccess, setLastTrialSuccess] = useState<boolean | null>(null);

  // Metrics
  const [score, setScore] = useState<number>(0);
  const [biomarkerLabel, setBiomarkerLabel] = useState<string>('UFOV Threshold: 220ms');
  const [thresholdsAchieved, setThresholdsAchieved] = useState<number[]>([]);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const trialStartTimeRef = useRef<number>(Date.now());
  const errorCountRef = useRef<number>(0);
  const correctCountRef = useRef<number>(0);
  const totalDurationStartRef = useRef<number>(Date.now());
  const thresholdsRef = useRef<number[]>([]);
  const exposureMsRef = useRef<number>(450);

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

  // Start trial
  const launchTrial = () => {
    // Pick pair & targets
    const pairIdx = Math.floor(Math.random() * centerPairs.length);
    const targetIdx = Math.random() < 0.5 ? 0 : 1;
    const angleIdx = Math.floor(Math.random() * RADIAL_ANGLES.length);

    setCurrentPairIndex(pairIdx);
    setCenterTargetIndex(targetIdx as 0 | 1);
    setPeripheralAngleIndex(angleIdx);
    setUserCenterChoice(null);
    setUserAngleChoice(null);
    setLastTrialSuccess(null);

    // Audio cue
    brainHqAudio.playBihuDhol();

    setPhase('FLASHING');
    trialStartTimeRef.current = Date.now();

    // After exposureMs, flash mask
    setTimeout(() => {
      setPhase('MASK');
      setTimeout(() => {
        setPhase('CENTER_INPUT');
      }, 90); // 90ms visual masking
    }, exposureMsRef.current);
  };

  // Center target selection
  const handleCenterSelect = (chosenId: string) => {
    setUserCenterChoice(chosenId);
    setPhase('PERIPHERAL_INPUT');
  };

  // Peripheral star selection
  const handleAngleSelect = (angleIndex: number) => {
    setUserAngleChoice(angleIndex);
    const isCenterCorrect = userCenterChoice === centerTarget.id;
    const isAngleCorrect = angleIndex === peripheralAngleIndex;
    const isSuccess = isCenterCorrect && isAngleCorrect;

    setLastTrialSuccess(isSuccess);
    setPhase('FEEDBACK');

    const currentExp = exposureMsRef.current;
    if (isSuccess) {
      brainHqAudio.playSuccessChime();
      correctCountRef.current += 1;
      setScore(Math.round((correctCountRef.current / maxTrials) * 100));
      thresholdsRef.current.push(currentExp);
      setThresholdsAchieved((prev) => [...prev, currentExp]);

      // Adaptive Staircase: Speed increases (exposure drops)
      const nextExp = Math.max(60, Math.round(currentExp * 0.78));
      exposureMsRef.current = nextExp;
      setExposureMs(nextExp);
    } else {
      brainHqAudio.playGentleError();
      errorCountRef.current += 1;
      // Adaptive Staircase: Slow down slightly to accommodate patient
      const nextExp = Math.min(650, Math.round(currentExp * 1.25));
      exposureMsRef.current = nextExp;
      setExposureMs(nextExp);
    }

    // Move to next trial or finish
    setTimeout(() => {
      if (trial >= maxTrials) {
        finishGame();
      } else {
        setTrial((prev) => prev + 1);
        setPhase('READY');
      }
    }, 1200);
  };

  const finishGame = () => {
    setPhase('COMPLETE');
    const totalDurationSec = Math.round((Date.now() - totalDurationStartRef.current) / 1000);
    const achieved = thresholdsRef.current.length > 0 ? thresholdsRef.current : thresholdsAchieved;
    const bestThreshold =
      achieved.length > 0 ? Math.min(...achieved) : exposureMsRef.current;

    const { score: calibratedScore, biomarker } = scoreDoubleDecision(
      correctCountRef.current,
      maxTrials,
      bestThreshold
    );

    setScore(calibratedScore);
    setBiomarkerLabel(biomarker);

    // Save session to offlineDb & Neon Cloud
    offlineDb.saveSession({
      patientId: offlineDb.getPatient().id,
      gameId: 'double_decision',
      gameTitle: 'BrainHQ: Double Decision (UFOV Visual Speed)',
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

  // Current pair items
  const currentPair = centerPairs[currentPairIndex] || centerPairs[0];
  const centerTarget = currentPair[centerTargetIndex];

  // Radius for peripheral ring in px
  const ringRadius = 110;

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
        {/* Top Navigation & Status Bar */}
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

          {/* Neuro Clinical Badge */}
          <div
            className="neo-pill neo-pill-green font-clash-wide"
            style={{ fontSize: '0.72rem' }}
          >
            <Zap size={14} />
            <span>SPEED: {exposureMs} MS</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <button
              onClick={toggleFullscreen}
              className="neo-pill font-clash-semibold"
              style={{
                background: '#ffffff',
                color: '#1c1b1b',
                padding: '0.45rem 0.85rem',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
              }}
              title="Toggle Fullscreen"
            >
              {isFullscreen ? <Minimize2 size={15} /> : <Maximize2 size={15} />}
              <span>{isFullscreen ? 'Exit' : 'Fullscreen'}</span>
            </button>
          </div>
        </div>

        {/* Main Test Card */}
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
            <div className="neo-pill neo-pill-terracotta" style={{ marginBottom: '0.5rem' }}>
              <span className="font-clash-wide" style={{ fontSize: '0.7rem' }}>BRAINHQ SPEED TRIAL</span>
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
              {t('doubleDecisionTitle')}
            </h1>
            <p className="font-clash-medium" style={{ color: '#57534e', fontSize: '0.9rem', margin: 0, fontWeight: 500 }}>
              Trial {trial} / {maxTrials} • {exposureMs} ms
            </p>
          </div>

          {/* Stimulus Arena (UFOV Field of View) */}
          <div
            style={{
              width: '320px',
              height: '320px',
              margin: '0 auto',
              position: 'relative',
              borderRadius: '50%',
              background: phase === 'MASK' ? '#374151' : '#f8faf9',
              border: '3px dashed #c9dcd0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              overflow: 'hidden',
              boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.04)',
            }}
          >
            {/* Visual Mask Noise */}
            {phase === 'MASK' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  backgroundImage:
                    'repeating-radial-gradient(circle, #214935 0, #214935 3px, #ffffff 4px, #ffffff 8px)',
                  opacity: 0.65,
                }}
              />
            )}

            {/* Central Target Flash */}
            {phase === 'FLASHING' && (
              <div
                style={{
                  fontSize: '3.6rem',
                  lineHeight: 1,
                  filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))',
                  animation: 'pulse 0.3s ease-in-out',
                }}
              >
                {centerTarget.symbol}
              </div>
            )}

            {/* Peripheral Star Flash */}
            {phase === 'FLASHING' && (() => {
              const rad = (RADIAL_ANGLES[peripheralAngleIndex] * Math.PI) / 180;
              const x = Math.cos(rad) * ringRadius;
              const y = Math.sin(rad) * ringRadius;
              return (
                <div
                  style={{
                    position: 'absolute',
                    left: `calc(50% + ${x}px - 22px)`,
                    top: `calc(50% + ${y}px - 22px)`,
                    width: '44px',
                    height: '44px',
                    borderRadius: '50%',
                    background: '#f59e0b',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.8rem',
                    boxShadow: '0 0 16px #f59e0b',
                  }}
                >
                  ⭐
                </div>
              );
            })()}

            {/* Ready State Prompt */}
            {phase === 'READY' && (
              <div style={{ padding: '1rem' }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>👁️</div>
                <div style={{ fontWeight: 700, color: '#214935', fontSize: '1.1rem' }}>
                  Fixate on Center
                </div>
                <div style={{ fontSize: '0.85rem', color: '#688071', marginTop: '0.2rem' }}>
                  Notice the center icon & edge star
                </div>
                <button
                  onClick={launchTrial}
                  style={{
                    marginTop: '1rem',
                    background: '#214935',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.65rem 1.6rem',
                    borderRadius: '9999px',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(33,73,53,0.25)',
                  }}
                >
                  Start Flash ({exposureMs}ms)
                </button>
              </div>
            )}

            {/* Step 1: Center Input Phase */}
            {phase === 'CENTER_INPUT' && (
              <div style={{ padding: '0.75rem', width: '100%' }}>
                <div
                  style={{
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: '#214935',
                    marginBottom: '0.75rem',
                  }}
                >
                  Step 1: Which was in the center?
                </div>
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  {currentPair.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => handleCenterSelect(item.id)}
                      style={{
                        background: '#ffffff',
                        border: '2px solid #214935',
                        borderRadius: '20px',
                        padding: '1rem',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.4rem',
                        cursor: 'pointer',
                        width: '110px',
                        boxShadow: '0 4px 10px rgba(0,0,0,0.06)',
                      }}
                    >
                      <span style={{ fontSize: '2.5rem' }}>{item.symbol}</span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, color: '#214935' }}>
                        {item.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Step 2: Peripheral Input Phase (Radial 8-direction clock) */}
            {phase === 'PERIPHERAL_INPUT' && (
              <>
                <div
                  style={{
                    position: 'absolute',
                    zIndex: 2,
                    fontSize: '0.85rem',
                    fontWeight: 700,
                    color: '#214935',
                    maxWidth: '180px',
                  }}
                >
                  Step 2: Touch where the star ⭐ flashed
                </div>
                {RADIAL_ANGLES.map((angle, idx) => {
                  const rad = (angle * Math.PI) / 180;
                  const x = Math.cos(rad) * ringRadius;
                  const y = Math.sin(rad) * ringRadius;
                  return (
                    <button
                      key={angle}
                      onClick={() => handleAngleSelect(idx)}
                      style={{
                        position: 'absolute',
                        left: `calc(50% + ${x}px - 24px)`,
                        top: `calc(50% + ${y}px - 24px)`,
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: '#ffffff',
                        border: '2px solid #214935',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: '1.2rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                        zIndex: 3,
                      }}
                    >
                      ⭐
                    </button>
                  );
                })}
              </>
            )}

            {/* Feedback Phase */}
            {phase === 'FEEDBACK' && (
              <div style={{ textAlign: 'center' }}>
                {lastTrialSuccess ? (
                  <>
                    <div style={{ fontSize: '3rem', marginBottom: '0.2rem' }}>🎉</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#2e7d32' }}>
                      Fast & Accurate!
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#4a7556', marginTop: '0.2rem' }}>
                      Speed improved to {exposureMs}ms
                    </div>
                  </>
                ) : (
                  <>
                    <div style={{ fontSize: '3rem', marginBottom: '0.2rem' }}>🤝</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: '#c85a32' }}>
                      Good Try!
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#688071', marginTop: '0.2rem' }}>
                      Adjusting exposure for comfort
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Lower Neuro-Metrics Strip */}
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
                THRESHOLD
              </div>
              <div className="font-regus-metric" style={{ fontSize: '1.6rem', color: '#214935', marginTop: '0.2rem' }}>
                {exposureMs} ms
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
              <div className="font-regus-metric" style={{ fontSize: '1.6rem', color: '#214935', marginTop: '0.2rem' }}>
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
              <div className="font-regus-metric" style={{ fontSize: '1.6rem', color: '#214935', marginTop: '0.2rem' }}>
                {score}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <CelebrationModal
        isOpen={phase === 'COMPLETE'}
        gameTitle="BrainHQ: Double Decision"
        score={score}
        timeSpentSec={Math.round((Date.now() - totalDurationStartRef.current) / 1000)}
        message={`Visual Speed of Processing: ${exposureMs}ms. Saccadic eye tracking and peripheral field tested.`}
        biomarkerLabel={biomarkerLabel}
        onPlayAgain={() => {
          setCenterPairs(generateCenterPairs());
          setTrial(1);
          setScore(0);
          correctCountRef.current = 0;
          setExposureMs(450);
          setThresholdsAchieved([]);
          errorCountRef.current = 0;
          setPhase('READY');
          totalDurationStartRef.current = Date.now();
        }}
        nextGameUrl="/patient/games/sound-sweeps"
      />
    </div>
  );
}
