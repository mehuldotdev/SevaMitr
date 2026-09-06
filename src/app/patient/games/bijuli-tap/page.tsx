'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Zap,
  Bell,
  Maximize2,
  Minimize2,
  CheckCircle2,
  AlertCircle,
  Clock,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { brainHqAudio } from '@/lib/audio/brainHqAudio';
import { offlineDb } from '@/lib/db/offlineDb';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { CelebrationModal } from '@/components/CelebrationModal';
import { scoreBijuliTap } from '@/lib/scoring/gradingEngine';

interface TrialResult {
  trialIndex: number;
  type: 'GO' | 'NOGO';
  reactionTimeMs: number | null; // null if No-Go held correctly or false start
  success: boolean;
  isFalseStart: boolean;
}

export default function BijuliTapGame() {
  const router = useRouter();
  const { language } = useLanguage();

  const totalTrials = 5;
  const [currentTrial, setCurrentTrial] = useState<number>(1);
  const [phase, setPhase] = useState<
    'INTRO' | 'WAITING' | 'STIMULUS' | 'FEEDBACK' | 'FALSE_START' | 'COMPLETE'
  >('INTRO');

  const [stimulusType, setStimulusType] = useState<'GO' | 'NOGO'>('GO');
  const [lastReactionMs, setLastReactionMs] = useState<number | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [trialsResults, setTrialsResults] = useState<TrialResult[]>([]);
  const [finalScore, setFinalScore] = useState<number>(85);
  const [biomarkerLabel, setBiomarkerLabel] = useState<string>('Mean Reaction: 320ms');

  const stimulusStartTimeRef = useRef<number>(0);
  const waitTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const noGoTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const sessionStartTimeRef = useRef<number>(Date.now());
  const falseStartsCountRef = useRef<number>(0);

  // Fullscreen management
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

  // Clean up timers on unmount
  useEffect(() => {
    return () => {
      if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
      if (noGoTimeoutRef.current) clearTimeout(noGoTimeoutRef.current);
    };
  }, []);

  // Launch a new trial with unpredictable jitter
  const startTrial = useCallback((trialNum: number) => {
    if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
    if (noGoTimeoutRef.current) clearTimeout(noGoTimeoutRef.current);

    setPhase('WAITING');
    setLastReactionMs(null);

    // Trials 4 and 5 introduce Go/No-Go
    const isNoGo = trialNum === 4; // Trial 4 is No-Go test
    setStimulusType(isNoGo ? 'NOGO' : 'GO');

    // Unpredictable jitter interval between 1.5s and 3.4s
    const jitterMs = Math.floor(1500 + Math.random() * 1900);

    waitTimeoutRef.current = setTimeout(() => {
      setPhase('STIMULUS');
      stimulusStartTimeRef.current = performance.now();

      if (isNoGo) {
        brainHqAudio.playWarningGong();
        // If it's a No-Go trial and user successfully withholds for 1.6s, award success!
        noGoTimeoutRef.current = setTimeout(() => {
          handleNoGoSuccess(trialNum);
        }, 1600);
      } else {
        brainHqAudio.playBrassBell();
      }
    }, jitterMs);
  }, []);

  // Handle successful No-Go withholding
  const handleNoGoSuccess = (trialNum: number) => {
    brainHqAudio.playSuccessChime();
    setPhase('FEEDBACK');
    setFeedbackMessage('Great Restraint! No-Go Passed');
    setLastReactionMs(null);

    const result: TrialResult = {
      trialIndex: trialNum,
      type: 'NOGO',
      reactionTimeMs: null,
      success: true,
      isFalseStart: false,
    };
    setTrialsResults((prev) => [...prev, result]);

    setTimeout(() => {
      advanceTrial(trialNum);
    }, 1400);
  };

  // User taps the pad or screen
  const handlePadTap = () => {
    // 1. If in INTRO, start the trial
    if (phase === 'INTRO') {
      startTrial(1);
      return;
    }

    // 2. Early Tap / False Start (tapped while waiting)
    if (phase === 'WAITING') {
      if (waitTimeoutRef.current) clearTimeout(waitTimeoutRef.current);
      falseStartsCountRef.current += 1;
      setPhase('FALSE_START');
      brainHqAudio.playGentleError();

      setTimeout(() => {
        // Restart current trial
        startTrial(currentTrial);
      }, 1200);
      return;
    }

    // 3. Stimulus response
    if (phase === 'STIMULUS') {
      const tapTime = performance.now();
      const rt = Math.round(tapTime - stimulusStartTimeRef.current);

      if (stimulusType === 'NOGO') {
        // Commission Error: Tapped on Red Distractor!
        if (noGoTimeoutRef.current) clearTimeout(noGoTimeoutRef.current);
        brainHqAudio.playGentleError();
        setPhase('FEEDBACK');
        setFeedbackMessage('Restraint Check: Avoid tapping on Red Gong');
        setLastReactionMs(null);

        const result: TrialResult = {
          trialIndex: currentTrial,
          type: 'NOGO',
          reactionTimeMs: rt,
          success: false,
          isFalseStart: false,
        };
        setTrialsResults((prev) => [...prev, result]);

        setTimeout(() => {
          advanceTrial(currentTrial);
        }, 1600);
        return;
      }

      // Valid GO reaction!
      brainHqAudio.playStepTick();
      setPhase('FEEDBACK');
      setLastReactionMs(rt);

      let msg = 'Sharp & Focused!';
      if (rt < 260) {
        msg = 'Lightning Fast!';
        brainHqAudio.playSuccessChime();
      } else if (rt < 380) {
        msg = 'Great Reflexes!';
        brainHqAudio.playStepTick();
      } else {
        msg = 'Good Response!';
      }
      setFeedbackMessage(msg);

      const result: TrialResult = {
        trialIndex: currentTrial,
        type: 'GO',
        reactionTimeMs: rt,
        success: true,
        isFalseStart: false,
      };
      setTrialsResults((prev) => [...prev, result]);

      setTimeout(() => {
        advanceTrial(currentTrial);
      }, 1300);
    }
  };

  // Keyboard support (Spacebar or Enter to tap)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handlePadTap();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  // Advance to next trial or finish
  const advanceTrial = (finishedTrial: number) => {
    if (finishedTrial >= totalTrials) {
      finishGame();
    } else {
      const next = finishedTrial + 1;
      setCurrentTrial(next);
      startTrial(next);
    }
  };

  // Complete game and calculate psychomotor biomarkers
  const finishGame = () => {
    setPhase('COMPLETE');
    const validGoRTs = trialsResults
      .filter((r) => r.type === 'GO' && r.reactionTimeMs !== null)
      .map((r) => r.reactionTimeMs as number);

    const avgRT = validGoRTs.length > 0
      ? Math.round(validGoRTs.reduce((a, b) => a + b, 0) / validGoRTs.length)
      : 320;

    const bestRT = validGoRTs.length > 0 ? Math.min(...validGoRTs) : 250;

    const totalDurationSec = Math.max(8, Math.round((Date.now() - sessionStartTimeRef.current) / 1000));
    const { score: calculatedScore, biomarker } = scoreBijuliTap(
      avgRT,
      falseStartsCountRef.current
    );
    setFinalScore(calculatedScore);
    setBiomarkerLabel(biomarker);

    brainHqAudio.playSuccessChime();
    brainHqAudio.playBihuDhol();

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#b45309', '#fef3c7', '#214935', '#0f4c81'],
      });
    } catch {
      // Fallback
    }

    offlineDb.saveSession({
      patientId: offlineDb.getPatient().id,
      gameId: 'bijuli_tap',
      gameTitle: 'BrainHQ: Bijuli Tap (Psychomotor Vigilance & Reaction Speed)',
      difficultyLevel: 3,
      score: calculatedScore,
      durationSec: totalDurationSec,
      hesitationMs: avgRT,
      errorCount: falseStartsCountRef.current,
      confusionLoops: 0,
      completed: true,
      timeOfDay: 'morning',
    });
  };


  // Computed summary metrics
  const validGoRTs = trialsResults
    .filter((r) => r.type === 'GO' && r.reactionTimeMs !== null)
    .map((r) => r.reactionTimeMs as number);

  const avgRT = validGoRTs.length > 0
    ? Math.round(validGoRTs.reduce((a, b) => a + b, 0) / validGoRTs.length)
    : 0;

  const bestRT = validGoRTs.length > 0 ? Math.min(...validGoRTs) : 0;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f4f7f4',
        padding: '1.25rem 1rem',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        boxSizing: 'border-box',
      }}
    >
      {/* Neo-Brutalist Game Card */}
      <div
        className="neo-card"
        style={{
          width: '100%',
          maxWidth: '540px',
          padding: '1.5rem',
          background: '#ffffff',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        {/* Top Header Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1.15rem',
          }}
        >
          <button
            onClick={handleGoBack}
            className="neo-pill font-clash-bold"
            style={{
              padding: '0.45rem 0.85rem',
              fontSize: '0.78rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              cursor: 'pointer',
              background: '#ffffff',
              border: '2px solid #1c1b1b',
            }}
          >
            <ArrowLeft size={16} />
            <span>EXIT</span>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span
              className="neo-pill font-clash-wide"
              style={{
                background: '#fef3c7',
                color: '#b45309',
                border: '2px solid #1c1b1b',
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              TRIAL {phase === 'INTRO' ? 1 : currentTrial} OF {totalTrials}
            </span>

            <button
              onClick={toggleFullscreen}
              className="neo-pill"
              title="Fullscreen"
              style={{
                width: '34px',
                height: '34px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                background: '#ffffff',
                border: '2px solid #1c1b1b',
              }}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <Maximize2 size={16} />}
            </button>
          </div>
        </div>

        {/* Title & Multilingual Voice Prompter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: '#fef3c7',
                  border: '2px solid #1c1b1b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#b45309',
                }}
              >
                <Zap size={20} strokeWidth={2.5} />
              </div>
              <h1 className="font-clash-bold" style={{ fontSize: '1.45rem', margin: 0, textTransform: 'uppercase', color: '#1c1b1b' }}>
                Bijuli Tap
              </h1>
            </div>
            <p className="font-clash-regular" style={{ fontSize: '0.8rem', color: '#57534e', margin: '0.2rem 0 0' }}>
              Psychomotor Reaction & Vigilance Trial
            </p>
          </div>

        </div>

        {/* Massive Interactive Tap Arena */}
        <div
          onClick={handlePadTap}
          style={{
            position: 'relative',
            width: '100%',
            height: '270px',
            margin: '0.5rem 0 1.25rem',
            borderRadius: '20px',
            border: '3px solid #1c1b1b',
            boxShadow: '4px 4px 0px #1c1b1b',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            userSelect: 'none',
            transition: 'all 0.1s ease',
            background:
              phase === 'INTRO'
                ? '#f8fafc'
                : phase === 'WAITING'
                ? '#fffbeb'
                : phase === 'STIMULUS' && stimulusType === 'GO'
                ? '#bbf7d0'
                : phase === 'STIMULUS' && stimulusType === 'NOGO'
                ? '#fecaca'
                : phase === 'FALSE_START'
                ? '#fed7aa'
                : '#f0fdf4',
          }}
        >
          {/* INTRO Phase */}
          {phase === 'INTRO' && (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '50%',
                  background: '#fef3c7',
                  border: '2.5px solid #1c1b1b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  color: '#b45309',
                }}
              >
                <Bell size={42} strokeWidth={2.4} />
              </div>
              <h2 className="font-clash-bold" style={{ fontSize: '1.25rem', margin: '0 0 0.4rem', color: '#1c1b1b' }}>
                TAP TO BEGIN
              </h2>
              <p className="font-clash-regular" style={{ fontSize: '0.85rem', color: '#57534e', margin: 0, maxWidth: '320px' }}>
                Wait for the golden bell to ring, then tap the screen as fast as lightning!
              </p>
            </div>
          )}

          {/* WAITING Phase */}
          {phase === 'WAITING' && (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div
                style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  border: '2px dashed #b45309',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1rem',
                  animation: 'pulse 1.4s infinite',
                }}
              >
                <Clock size={36} color="#b45309" />
              </div>
              <h2 className="font-clash-bold" style={{ fontSize: '1.3rem', margin: '0 0 0.35rem', color: '#1c1b1b' }}>
                WAIT FOR THE BELL...
              </h2>
              <p className="font-clash-regular" style={{ fontSize: '0.82rem', color: '#78350f', margin: 0 }}>
                Keep your finger ready over the screen
              </p>
            </div>
          )}

          {/* FALSE START Alert */}
          {phase === 'FALSE_START' && (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div
                style={{
                  width: '74px',
                  height: '74px',
                  borderRadius: '50%',
                  background: '#ffedd5',
                  border: '2.5px solid #c2410c',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem',
                  color: '#c2410c',
                }}
              >
                <AlertCircle size={40} />
              </div>
              <h2 className="font-clash-bold" style={{ fontSize: '1.25rem', margin: '0 0 0.3rem', color: '#9a3412' }}>
                TOO EARLY!
              </h2>
              <p className="font-clash-regular" style={{ fontSize: '0.82rem', color: '#7c2d12', margin: 0 }}>
                Wait until the bell rings before tapping
              </p>
            </div>
          )}

          {/* STIMULUS Phase: GO Bell */}
          {phase === 'STIMULUS' && stimulusType === 'GO' && (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  border: '3.5px solid #1c1b1b',
                  boxShadow: '0 0 25px rgba(34, 197, 94, 0.7)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem',
                  color: '#15803d',
                  transform: 'scale(1.15)',
                  transition: 'transform 0.1s ease',
                }}
              >
                <Bell size={56} strokeWidth={2.8} />
              </div>
              <h2 className="font-clash-bold" style={{ fontSize: '1.8rem', margin: 0, color: '#14532d', letterSpacing: '0.04em' }}>
                TAP NOW!
              </h2>
            </div>
          )}

          {/* STIMULUS Phase: NOGO Gong */}
          {phase === 'STIMULUS' && stimulusType === 'NOGO' && (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              <div
                style={{
                  width: '100px',
                  height: '100px',
                  borderRadius: '50%',
                  background: '#ffffff',
                  border: '3.5px solid #dc2626',
                  boxShadow: '0 0 25px rgba(220, 38, 38, 0.6)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem',
                  color: '#dc2626',
                  transform: 'scale(1.15)',
                }}
              >
                <ShieldCheck size={56} strokeWidth={2.8} />
              </div>
              <h2 className="font-clash-bold" style={{ fontSize: '1.7rem', margin: 0, color: '#991b1b', letterSpacing: '0.04em' }}>
                DO NOT TAP!
              </h2>
              <p className="font-clash-regular" style={{ fontSize: '0.82rem', color: '#7f1d1d', margin: '0.3rem 0 0' }}>
                Hold still for a moment...
              </p>
            </div>
          )}

          {/* FEEDBACK Phase */}
          {phase === 'FEEDBACK' && (
            <div style={{ textAlign: 'center', padding: '1rem' }}>
              {lastReactionMs !== null ? (
                <>
                  <div
                    style={{
                      fontSize: '3rem',
                      fontWeight: 800,
                      color: '#1c1b1b',
                      lineHeight: 1,
                      marginBottom: '0.4rem',
                    }}
                    className="font-clash-bold"
                  >
                    {lastReactionMs}
                    <span style={{ fontSize: '1.4rem', fontWeight: 600, color: '#57534e', marginLeft: '4px' }}>
                      ms
                    </span>
                  </div>
                  <span
                    className="neo-pill font-clash-wide"
                    style={{
                      background: lastReactionMs < 260 ? '#dcfce7' : '#fef3c7',
                      color: lastReactionMs < 260 ? '#15803d' : '#b45309',
                      border: '2px solid #1c1b1b',
                      padding: '0.35rem 0.85rem',
                      fontSize: '0.82rem',
                    }}
                  >
                    {feedbackMessage}
                  </span>
                </>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <CheckCircle2 size={46} color="#15803d" />
                  <h3 className="font-clash-bold" style={{ fontSize: '1.3rem', margin: '0.5rem 0 0', color: '#15803d' }}>
                    {feedbackMessage}
                  </h3>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Real-time Telemetry Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '0.75rem 0.85rem',
            background: '#f4f7f4',
            border: '2px solid #1c1b1b',
            borderRadius: '14px',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <span className="font-clash-wide" style={{ fontSize: '0.65rem', color: '#57534e', display: 'block' }}>
              BEST SPEED
            </span>
            <span className="font-clash-bold" style={{ fontSize: '0.96rem', color: '#1c1b1b' }}>
              {bestRT > 0 ? `${bestRT} ms` : '—'}
            </span>
          </div>

          <div style={{ width: '1px', height: '24px', background: '#d6d3d1' }} />

          <div style={{ textAlign: 'center' }}>
            <span className="font-clash-wide" style={{ fontSize: '0.65rem', color: '#57534e', display: 'block' }}>
              AVERAGE RT
            </span>
            <span className="font-clash-bold" style={{ fontSize: '0.96rem', color: avgRT > 0 && avgRT < 320 ? '#15803d' : '#1c1b1b' }}>
              {avgRT > 0 ? `${avgRT} ms` : '—'}
            </span>
          </div>

          <div style={{ width: '1px', height: '24px', background: '#d6d3d1' }} />

          <div style={{ textAlign: 'center' }}>
            <span className="font-clash-wide" style={{ fontSize: '0.65rem', color: '#57534e', display: 'block' }}>
              FALSE STARTS
            </span>
            <span className="font-clash-bold" style={{ fontSize: '0.96rem', color: falseStartsCountRef.current > 0 ? '#c2410c' : '#1c1b1b' }}>
              {falseStartsCountRef.current}
            </span>
          </div>
        </div>
      </div>

      {/* Celebration Modal on Game Completion */}
      <CelebrationModal
        isOpen={phase === 'COMPLETE'}
        gameTitle="Bijuli Tap (Psychomotor Speed)"
        score={finalScore}
        timeSpentSec={Math.max(10, Math.round((Date.now() - sessionStartTimeRef.current) / 1000))}
        message={`Average RT: ${avgRT}ms • Fastest: ${bestRT}ms • False starts: ${falseStartsCountRef.current}`}
        biomarkerLabel={biomarkerLabel}
        onPlayAgain={() => {
          setCurrentTrial(1);
          setTrialsResults([]);
          falseStartsCountRef.current = 0;
          sessionStartTimeRef.current = Date.now();
          setPhase('INTRO');
        }}
        nextGameUrl="/patient"
      />
    </div>
  );
}
