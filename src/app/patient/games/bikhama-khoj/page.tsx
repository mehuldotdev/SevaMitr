'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Eye,
  Maximize2,
  Minimize2,
  CheckCircle2,
  Lightbulb,
  Sparkles,
  Clock,
  ShieldCheck,
  RotateCcw,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { brainHqAudio } from '@/lib/audio/brainHqAudio';
import { offlineDb } from '@/lib/db/offlineDb';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { CelebrationModal } from '@/components/CelebrationModal';
import { scoreBikhamaKhoj } from '@/lib/scoring/gradingEngine';
import { getRandomVisualSearchRounds } from '@/lib/games/emojiPool';

interface RoundConfig {
  round: number;
  gridSize: number; // 3 = 3x3 (9 items), 4 = 4x4 (16 items)
  title: string;
  distractorSymbol: string;
  targetSymbol: string;
  distractorTransform?: string;
  targetTransform?: string;
  promptText: {
    en: string;
    as: string;
    bn: string;
    hi: string;
  };
}

function generateBikhamaRounds(): RoundConfig[] {
  const selectedPairs = getRandomVisualSearchRounds(5);
  return selectedPairs.map((pair, idx) => {
    const round = idx + 1;
    const gridSize = round <= 2 ? 3 : 4;
    const isFlip = pair.isOrientationFlip;
    return {
      round,
      gridSize,
      title: pair.title,
      distractorSymbol: pair.distractor,
      targetSymbol: pair.target,
      distractorTransform: isFlip ? 'scaleX(1)' : undefined,
      targetTransform: isFlip ? 'scaleX(-1)' : undefined,
      promptText: isFlip
        ? {
            en: `Find the one ${pair.title} facing the opposite way!`,
            as: `বিপৰীত দিশে মুখ কৰি থকা বিশেষটো বিচাৰি উলিয়াওক!`,
            bn: `বিপরীত দিকে মুখ করে থাকা অনন্যটি খুঁজুন!`,
            hi: `उल्टी दिशा में मुड़े हुए को पहचानें!`,
          }
        : {
            en: `Find the unique ${pair.target} among the ${pair.distractor}!`,
            as: `${pair.distractor} বোৰৰ মাজৰ সুকীয়া ${pair.target} টো চিনাক্ত কৰক!`,
            bn: `${pair.distractor} গুলোর মাঝে অনন্য ${pair.target} খুঁজুন!`,
            hi: `${pair.distractor} के बीच अनोखे ${pair.target} को पहचानें!`,
          },
    };
  });
}

interface GridItem {
  id: number;
  isTarget: boolean;
  symbol: string;
  transform?: string;
}

export default function BikhamaKhojGame() {
  const router = useRouter();
  const { language } = useLanguage();

  const [rounds, setRounds] = useState<RoundConfig[]>(() => generateBikhamaRounds());
  const totalRounds = rounds.length;
  const [currentRound, setCurrentRound] = useState<number>(1);
  const roundConfig = rounds[currentRound - 1] || rounds[0];

  const [gridItems, setGridItems] = useState<GridItem[]>([]);
  const [targetIndex, setTargetIndex] = useState<number>(0);
  const [roundSuccess, setRoundSuccess] = useState<boolean | null>(null);
  const [tappedWrongId, setTappedWrongId] = useState<number | null>(null);
  const [isHintActive, setIsHintActive] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [roundLatencies, setRoundLatencies] = useState<number[]>([]);
  const [finalScore, setFinalScore] = useState<number>(85);
  const [biomarkerLabel, setBiomarkerLabel] = useState<string>('Visual Search: 850ms');

  const stimulusStartTimeRef = useRef<number>(Date.now());
  const distractorTapsRef = useRef<number>(0);
  const sessionStartTimeRef = useRef<number>(Date.now());

  // Handle Fullscreen toggle
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

  // Generate randomized grid for the round
  const setupRound = useCallback((rNum: number, currentRounds: RoundConfig[] = rounds) => {
    const config = currentRounds[rNum - 1] || currentRounds[0];
    const totalCells = config.gridSize * config.gridSize;

    // Pick random target position
    const randomTargetIdx = Math.floor(Math.random() * totalCells);
    setTargetIndex(randomTargetIdx);

    const items: GridItem[] = [];
    for (let i = 0; i < totalCells; i++) {
      const isTarget = i === randomTargetIdx;
      items.push({
        id: i,
        isTarget,
        symbol: isTarget ? config.targetSymbol : config.distractorSymbol,
        transform: isTarget ? config.targetTransform : config.distractorTransform,
      });
    }

    setGridItems(items);
    setRoundSuccess(null);
    setTappedWrongId(null);
    setIsHintActive(false);
    stimulusStartTimeRef.current = performance.now();
  }, [rounds]);

  useEffect(() => {
    setupRound(currentRound);
  }, [currentRound, setupRound]);

  // Handle tile tap
  const handleItemTap = (item: GridItem) => {
    if (roundSuccess !== null || isGameOver) return;

    if (item.isTarget) {
      // Success! Found the odd one!
      const latency = Math.round(performance.now() - stimulusStartTimeRef.current);
      setRoundLatencies((prev) => [...prev, latency]);
      setRoundSuccess(true);
      brainHqAudio.playSuccessChime();
      brainHqAudio.playStepTick();

      try {
        confetti({
          particleCount: 35,
          spread: 50,
          origin: { y: 0.6 },
          colors: ['#0284c7', '#38bdf8', '#22c55e', '#ffffff'],
        });
      } catch {
        // Fallback
      }

      setTimeout(() => {
        if (currentRound >= totalRounds) {
          finishGame();
        } else {
          setCurrentRound((prev) => prev + 1);
        }
      }, 950);
    } else {
      // Distractor tapped
      distractorTapsRef.current += 1;
      setTappedWrongId(item.id);
      brainHqAudio.playGentleError();
      setTimeout(() => setTappedWrongId(null), 350);
    }
  };

  // Complete game and save session to offlineDb
  const finishGame = () => {
    setIsGameOver(true);
    const totalDurationSec = Math.max(8, Math.round((Date.now() - sessionStartTimeRef.current) / 1000));

    const avgLatency = roundLatencies.length > 0
      ? Math.round(roundLatencies.reduce((a, b) => a + b, 0) / roundLatencies.length)
      : 850;

    const { score: calculatedScore, biomarker } = scoreBikhamaKhoj(
      totalRounds,
      totalRounds,
      avgLatency,
      distractorTapsRef.current
    );
    setFinalScore(calculatedScore);
    setBiomarkerLabel(biomarker);

    brainHqAudio.playSuccessChime();
    brainHqAudio.playBihuDhol();

    offlineDb.saveSession({
      patientId: offlineDb.getPatient().id,
      gameId: 'bikhama_khoj',
      gameTitle: 'BrainHQ: Bikhama Khoj (Visual Search & Odd One Out)',
      difficultyLevel: 3,
      score: calculatedScore,
      durationSec: totalDurationSec,
      hesitationMs: avgLatency,
      errorCount: distractorTapsRef.current,
      confusionLoops: 0,
      completed: true,
      timeOfDay: new Date().getHours() >= 8 && new Date().getHours() < 16 ? 'morning' : 'evening',
    });
  };

  // Dementia-Safe Hint: Illuminates target row or cell
  const triggerHint = () => {
    setIsHintActive(true);
    brainHqAudio.playStepTick();
  };


  const avgSpeedMs = roundLatencies.length > 0
    ? Math.round(roundLatencies.reduce((a, b) => a + b, 0) / roundLatencies.length)
    : 0;

  const bestLatency = roundLatencies.length > 0 ? Math.min(...roundLatencies) : 0;

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
                background: '#e0f2fe',
                color: '#0369a1',
                border: '2px solid #1c1b1b',
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              ROUND {currentRound} OF {totalRounds}
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

        {/* Title & Speech Prompter */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: '#e0f2fe',
                  border: '2px solid #1c1b1b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#0369a1',
                }}
              >
                <Eye size={20} strokeWidth={2.5} />
              </div>
              <h1 className="font-clash-bold" style={{ fontSize: '1.45rem', margin: 0, textTransform: 'uppercase', color: '#1c1b1b' }}>
                Bikhama Khoj
              </h1>
            </div>
            <p className="font-clash-regular" style={{ fontSize: '0.8rem', color: '#57534e', margin: '0.2rem 0 0' }}>
              {roundConfig.title} • Visual Search Trial
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.4rem' }}>
            <button
              onClick={triggerHint}
              className="neo-pill font-clash-wide"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem',
                padding: '0.45rem 0.75rem',
                fontSize: '0.72rem',
                cursor: 'pointer',
                background: '#fef08a',
                border: '2px solid #1c1b1b',
                color: '#854d0e',
              }}
            >
              <Lightbulb size={15} />
              <span>HINT</span>
            </button>

          </div>
        </div>

        {/* Prompt Instruction Banner */}
        <div
          style={{
            background: '#f8fafc',
            border: '2px dashed #0369a1',
            borderRadius: '12px',
            padding: '0.55rem 0.85rem',
            marginBottom: '1rem',
            textAlign: 'center',
          }}
        >
          <span className="font-clash-semibold" style={{ fontSize: '0.85rem', color: '#0c4a6e' }}>
            {roundConfig.promptText[language as 'as' | 'bn' | 'hi' | 'en'] || roundConfig.promptText.en}
          </span>
        </div>

        {/* Interactive Visual Search Arena */}
        <div
          style={{
            width: '100%',
            maxWidth: '380px',
            margin: '0 auto 1.25rem',
            aspectRatio: '1 / 1',
            display: 'grid',
            gridTemplateColumns: `repeat(${roundConfig.gridSize}, 1fr)`,
            gridTemplateRows: `repeat(${roundConfig.gridSize}, 1fr)`,
            gap: roundConfig.gridSize === 3 ? '12px' : '8px',
            touchAction: 'manipulation',
          }}
        >
          {gridItems.map((item) => {
            const isTappedWrong = tappedWrongId === item.id;
            const isCorrectTarget = roundSuccess && item.isTarget;
            const isHintTarget = isHintActive && item.isTarget;

            return (
              <button
                key={item.id}
                onClick={() => handleItemTap(item)}
                className="neo-card"
                style={{
                  width: '100%',
                  height: '100%',
                  padding: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: roundConfig.gridSize === 3 ? '2.4rem' : '1.75rem',
                  background: isCorrectTarget
                    ? '#bbf7d0'
                    : isTappedWrong
                    ? '#fecaca'
                    : isHintTarget
                    ? '#fef08a'
                    : '#ffffff',
                  border: isCorrectTarget
                    ? '3px solid #15803d'
                    : isTappedWrong
                    ? '3px solid #dc2626'
                    : isHintTarget
                    ? '3px solid #ca8a04'
                    : '2.5px solid #1c1b1b',
                  boxShadow: isCorrectTarget
                    ? '0 0 15px rgba(34, 197, 94, 0.7)'
                    : isHintTarget
                    ? '0 0 12px rgba(234, 179, 8, 0.6)'
                    : '3px 3px 0px #1c1b1b',
                  borderRadius: roundConfig.gridSize === 3 ? '18px' : '14px',
                  cursor: 'pointer',
                  userSelect: 'none',
                  transition: 'transform 0.1s ease, background 0.15s ease',
                  transform: isTappedWrong ? 'scale(0.94)' : 'scale(1)',
                }}
              >
                <span
                  style={{
                    display: 'inline-block',
                    transform: item.transform || 'none',
                    filter: isCorrectTarget ? 'drop-shadow(0 2px 5px rgba(0,0,0,0.3))' : 'none',
                  }}
                >
                  {item.symbol}
                </span>
              </button>
            );
          })}
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
              SEARCH SPEED
            </span>
            <span className="font-clash-bold" style={{ fontSize: '0.96rem', color: '#1c1b1b' }}>
              {avgSpeedMs > 0 ? `${avgSpeedMs} ms` : '—'}
            </span>
          </div>

          <div style={{ width: '1px', height: '24px', background: '#d6d3d1' }} />

          <div style={{ textAlign: 'center' }}>
            <span className="font-clash-wide" style={{ fontSize: '0.65rem', color: '#57534e', display: 'block' }}>
              BEST TIME
            </span>
            <span className="font-clash-bold" style={{ fontSize: '0.96rem', color: '#0369a1' }}>
              {bestLatency > 0 ? `${bestLatency} ms` : '—'}
            </span>
          </div>

          <div style={{ width: '1px', height: '24px', background: '#d6d3d1' }} />

          <div style={{ textAlign: 'center' }}>
            <span className="font-clash-wide" style={{ fontSize: '0.65rem', color: '#57534e', display: 'block' }}>
              MISSES
            </span>
            <span className="font-clash-bold" style={{ fontSize: '0.96rem', color: distractorTapsRef.current > 0 ? '#c2410c' : '#214935' }}>
              {distractorTapsRef.current}
            </span>
          </div>
        </div>
      </div>

      {/* Celebration Modal upon completing all 5 rounds */}
      <CelebrationModal
        isOpen={isGameOver}
        gameTitle="Bikhama Khoj (Visual Search)"
        score={finalScore}
        timeSpentSec={Math.max(10, Math.round((Date.now() - sessionStartTimeRef.current) / 1000))}
        message={`Average search speed: ${avgSpeedMs}ms • 5/5 Target puzzles solved • Misses: ${distractorTapsRef.current}`}
        biomarkerLabel={biomarkerLabel}
        onPlayAgain={() => {
          const freshRounds = generateBikhamaRounds();
          setRounds(freshRounds);
          setCurrentRound(1);
          setRoundLatencies([]);
          distractorTapsRef.current = 0;
          sessionStartTimeRef.current = Date.now();
          setIsGameOver(false);
          setupRound(1, freshRounds);
        }}
        nextGameUrl={null}
      />
    </div>
  );
}
