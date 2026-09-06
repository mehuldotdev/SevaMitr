'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Volume2, Eye, RotateCcw, Target, ShieldCheck, Maximize2, Minimize2 } from 'lucide-react';
import { brainHqAudio } from '@/lib/audio/brainHqAudio';
import { offlineDb } from '@/lib/db/offlineDb';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { CelebrationModal } from '@/components/CelebrationModal';
import { scoreTargetTracker } from '@/lib/scoring/gradingEngine';
import { getRandomEmojis } from '@/lib/games/emojiPool';

interface TrackingOrb {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  isTarget: boolean;
  symbol: string;
}

const ARENA_WIDTH = 340;
const ARENA_HEIGHT = 280;
const ORB_RADIUS = 28;

export default function TargetTrackerGame() {
  const router = useRouter();
  const { language, t } = useLanguage();

  const [round, setRound] = useState<number>(1);
  const maxRounds = 4;

  // Phases: 'READY' | 'HIGHLIGHT_TARGETS' | 'TRACKING' | 'SELECTING' | 'FEEDBACK' | 'COMPLETE'
  const [phase, setPhase] = useState<
    'READY' | 'HIGHLIGHT_TARGETS' | 'TRACKING' | 'SELECTING' | 'FEEDBACK' | 'COMPLETE'
  >('READY');

  const [orbs, setOrbs] = useState<TrackingOrb[]>([]);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [roundSuccess, setRoundSuccess] = useState<boolean | null>(null);
  
  // Metrics
  const [score, setScore] = useState<number>(0);
  const [biomarkerLabel, setBiomarkerLabel] = useState<string>('Tracking Accuracy: 100%');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  const animFrameRef = useRef<number | null>(null);
  const orbsRef = useRef<TrackingOrb[]>([]);
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

  // Initialize orbs
  const setupRound = () => {
    const symbols = getRandomEmojis(6);
    const newOrbs: TrackingOrb[] = [];

    // Target count is 2
    const targetIndices = [0, 1]; // Will designate 2 random
    const shuffledIdx = [0, 1, 2, 3, 4, 5].sort(() => Math.random() - 0.5);
    const chosenTargets = new Set([shuffledIdx[0], shuffledIdx[1]]);

    for (let i = 0; i < 6; i++) {
      // Non-overlapping initial positions
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = 50 + col * 105;
      const y = 50 + row * 130;

      // Speed increases slightly with round
      const speedMultiplier = 1.0 + (round - 1) * 0.2;
      const angle = Math.random() * 2 * Math.PI;

      newOrbs.push({
        id: i,
        x,
        y,
        vx: Math.cos(angle) * 1.8 * speedMultiplier,
        vy: Math.sin(angle) * 1.8 * speedMultiplier,
        isTarget: chosenTargets.has(i),
        symbol: symbols[i % symbols.length],
      });
    }

    setOrbs(newOrbs);
    orbsRef.current = newOrbs;
    setSelectedIds([]);
    setRoundSuccess(null);
  };

  useEffect(() => {
    setupRound();
  }, [round]);

  const startTrackingSequence = () => {
    setPhase('HIGHLIGHT_TARGETS');
    brainHqAudio.playBihuDhol();

    // Show targets with bright pulsing ring for 2.2 seconds
    setTimeout(() => {
      setPhase('TRACKING');

      // Animate movement for 4.2 seconds
      const startTime = Date.now();
      const duration = 4200;

      const animate = () => {
        const elapsed = Date.now() - startTime;
        if (elapsed < duration) {
          // Update physics
          const updated = orbsRef.current.map((orb) => {
            let nextX = orb.x + orb.vx;
            let nextY = orb.y + orb.vy;
            let nextVx = orb.vx;
            let nextVy = orb.vy;

            // Bounce off walls
            if (nextX <= ORB_RADIUS) {
              nextX = ORB_RADIUS;
              nextVx = -nextVx;
            } else if (nextX >= ARENA_WIDTH - ORB_RADIUS) {
              nextX = ARENA_WIDTH - ORB_RADIUS;
              nextVx = -nextVx;
            }

            if (nextY <= ORB_RADIUS) {
              nextY = ORB_RADIUS;
              nextVy = -nextVy;
            } else if (nextY >= ARENA_HEIGHT - ORB_RADIUS) {
              nextY = ARENA_HEIGHT - ORB_RADIUS;
              nextVy = -nextVy;
            }

            return {
              ...orb,
              x: nextX,
              y: nextY,
              vx: nextVx,
              vy: nextVy,
            };
          });

          orbsRef.current = updated;
          setOrbs(updated);
          animFrameRef.current = requestAnimationFrame(animate);
        } else {
          // Movement complete! Prompt user to choose
          setPhase('SELECTING');
        }
      };

      animFrameRef.current = requestAnimationFrame(animate);
    }, 2200);
  };

  useEffect(() => {
    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  const handleOrbClick = (id: number) => {
    if (phase !== 'SELECTING') return;

    let newSelected: number[];
    if (selectedIds.includes(id)) {
      newSelected = selectedIds.filter((item) => item !== id);
    } else {
      if (selectedIds.length >= 2) return;
      newSelected = [...selectedIds, id];
    }
    setSelectedIds(newSelected);

    // If 2 selected, evaluate!
    if (newSelected.length === 2) {
      setPhase('FEEDBACK');
      const targetIds = orbsRef.current.filter((o) => o.isTarget).map((o) => o.id);
      const allCorrect = newSelected.every((sel) => targetIds.includes(sel));

      setRoundSuccess(allCorrect);

      if (allCorrect) {
        brainHqAudio.playSuccessChime();
        correctCountRef.current += 1;
        setScore(Math.round((correctCountRef.current / maxRounds) * 100));
      } else {
        brainHqAudio.playGentleError();
        errorCountRef.current += 1;
      }

      setTimeout(() => {
        if (round >= maxRounds) {
          finishGame();
        } else {
          setRound((prev) => prev + 1);
          setPhase('READY');
        }
      }, 1500);
    }
  };

  const finishGame = () => {
    setPhase('COMPLETE');
    const totalDurationSec = Math.round((Date.now() - totalDurationStartRef.current) / 1000);
    const { score: calibratedScore, biomarker } = scoreTargetTracker(
      correctCountRef.current,
      maxRounds,
      totalDurationSec
    );

    setScore(calibratedScore);
    setBiomarkerLabel(biomarker);

    offlineDb.saveSession({
      patientId: offlineDb.getPatient().id,
      gameId: 'target_tracker',
      gameTitle: 'BrainHQ: Target Tracker (Multiple Object Tracking)',
      difficultyLevel: 3,
      score: calibratedScore,
      durationSec: totalDurationSec,
      hesitationMs: 2500,
      errorCount: errorCountRef.current,
      confusionLoops: 0,
      completed: true,
      timeOfDay: 'morning',
    });
  };

  const speakPrompt = () => {
    brainHqAudio.speakPrompt(
      'Target Tracker. Remember the two glowing items. Follow them with your eyes as they move, and touch them when they stop.',
      language
    );
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
        {/* Top Nav */}
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

          {/* Divided Attention Badge */}
          <div
            className="neo-pill neo-pill-green font-clash-wide"
            style={{ fontSize: '0.72rem' }}
          >
            <Target size={14} />
            <span>ROUND {round} / {maxRounds}</span>
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

            <button
              onClick={speakPrompt}
              className="neo-pill font-clash-semibold"
              style={{
                background: '#ffffff',
                color: '#1c1b1b',
                padding: '0.45rem 0.95rem',
                cursor: 'pointer',
                fontSize: '0.92rem',
                fontWeight: 600,
                textTransform: 'uppercase',
              }}
            >
              <Volume2 size={16} />
              <span>{t('listen')}</span>
            </button>
          </div>
        </div>

        {/* Main Card */}
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
              <span className="font-clash-wide" style={{ fontSize: '0.7rem' }}>ATTENTION TRACKER</span>
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
              {t('targetTrackerTitle')}
            </h1>
            <p className="font-clash-medium" style={{ color: '#57534e', fontSize: '0.9rem', margin: 0, fontWeight: 500 }}>
              Track 2 moving targets
            </p>
          </div>

          {/* Tracking Arena */}
          <div
            style={{
              width: `${ARENA_WIDTH}px`,
              height: `${ARENA_HEIGHT}px`,
              margin: '0 auto',
              position: 'relative',
              borderRadius: '24px',
              background: '#f8faf9',
              border: '2px solid #c9dcd0',
              overflow: 'hidden',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.03)',
            }}
          >
            {/* Tokens in Arena */}
            {orbs.map((orb) => {
              const isHighlighted = phase === 'HIGHLIGHT_TARGETS' && orb.isTarget;
              const isSelected = selectedIds.includes(orb.id);
              const isRevealedTarget = phase === 'FEEDBACK' && orb.isTarget;

              return (
                <div
                  key={orb.id}
                  onClick={() => handleOrbClick(orb.id)}
                  style={{
                    position: 'absolute',
                    left: `${orb.x - ORB_RADIUS}px`,
                    top: `${orb.y - ORB_RADIUS}px`,
                    width: `${ORB_RADIUS * 2}px`,
                    height: `${ORB_RADIUS * 2}px`,
                    borderRadius: '50%',
                    background: isHighlighted
                      ? '#d4edda'
                      : isSelected
                      ? '#214935'
                      : isRevealedTarget
                      ? '#fff3cd'
                      : '#ffffff',
                    border: isHighlighted
                      ? '3.5px solid #28a745'
                      : isSelected
                      ? '3px solid #214935'
                      : isRevealedTarget
                      ? '3px solid #f59e0b'
                      : '2px solid #c9dcd0',
                    boxShadow: isHighlighted
                      ? '0 0 16px rgba(40,167,69,0.7)'
                      : isSelected
                      ? '0 0 12px rgba(33,73,53,0.5)'
                      : '0 2px 6px rgba(0,0,0,0.08)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem',
                    cursor: phase === 'SELECTING' ? 'pointer' : 'default',
                    transition:
                      phase === 'TRACKING' ? 'none' : 'background 0.2s ease, transform 0.15s ease',
                    zIndex: isHighlighted || isSelected ? 3 : 1,
                  }}
                >
                  {orb.symbol}
                </div>
              );
            })}

            {/* Ready Overlay */}
            {phase === 'READY' && (
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  background: 'rgba(255,255,255,0.85)',
                  backdropFilter: 'blur(2px)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 10,
                  padding: '1rem',
                }}
              >
                <div style={{ fontSize: '2.5rem', marginBottom: '0.4rem' }}>🎯</div>
                <div style={{ fontWeight: 800, color: '#214935', fontSize: '1.2rem' }}>
                  Ready to Track?
                </div>
                <div style={{ fontSize: '0.85rem', color: '#688071', margin: '0.2rem 0 1rem' }}>
                  2 targets will highlight, then all 6 will drift
                </div>
                <button
                  onClick={startTrackingSequence}
                  style={{
                    background: '#214935',
                    color: '#ffffff',
                    border: 'none',
                    padding: '0.65rem 1.8rem',
                    borderRadius: '9999px',
                    fontWeight: 700,
                    fontSize: '1rem',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(33,73,53,0.25)',
                  }}
                >
                  Start Round {round}
                </button>
              </div>
            )}
          </div>

          {/* Phase Guidance Banner */}
          <div style={{ marginTop: '1rem', minHeight: '40px' }}>
            {phase === 'HIGHLIGHT_TARGETS' && (
              <div style={{ fontWeight: 700, color: '#2e7d32', fontSize: '1rem' }}>
                🌟 Remember the 2 glowing targets!
              </div>
            )}
            {phase === 'TRACKING' && (
              <div style={{ fontWeight: 700, color: '#214935', fontSize: '1rem' }}>
                👀 Track them with your eyes as they drift...
              </div>
            )}
            {phase === 'SELECTING' && (
              <div style={{ fontWeight: 700, color: '#214935', fontSize: '1rem' }}>
                👉 Touch the 2 targets you were tracking ({selectedIds.length}/2 chosen)
              </div>
            )}
            {phase === 'FEEDBACK' && (
              <div>
                {roundSuccess ? (
                  <div style={{ fontWeight: 800, color: '#2e7d32', fontSize: '1.1rem' }}>
                    🎉 Perfect Attention! Both targets identified!
                  </div>
                ) : (
                  <div style={{ fontWeight: 800, color: '#c85a32', fontSize: '1.05rem' }}>
                    🤝 Good effort! Gold circles indicate original targets.
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Metrics Footer Strip */}
          <div
            style={{
              marginTop: '1.25rem',
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
                ACCURACY
              </div>
              <div className="font-regus-metric" style={{ fontSize: '1.6rem', color: '#c85a32', marginTop: '0.2rem' }}>
                {round > 1
                  ? Math.round(((round - 1 - errorCountRef.current) / (round - 1)) * 100)
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
                FOCUS
              </div>
              <div className="font-regus-metric" style={{ fontSize: '1.6rem', color: '#c85a32', marginTop: '0.2rem' }}>
                2 Targets
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
              <div className="font-regus-metric" style={{ fontSize: '1.6rem', color: '#c85a32', marginTop: '0.2rem' }}>
                {score}%
              </div>
            </div>
          </div>
        </div>
      </div>

      <CelebrationModal
        isOpen={phase === 'COMPLETE'}
        gameTitle="BrainHQ: Target Tracker"
        score={score}
        timeSpentSec={Math.round((Date.now() - totalDurationStartRef.current) / 1000)}
        message="Multiple Object Tracking complete. Parietal lobe spatial tracking and divided visual attention exercised."
        biomarkerLabel={biomarkerLabel}
        onPlayAgain={() => {
          setRound(1);
          setScore(0);
          correctCountRef.current = 0;
          setPhase('READY');
          totalDurationStartRef.current = Date.now();
        }}
        nextGameUrl="/patient"
      />
    </div>
  );
}
