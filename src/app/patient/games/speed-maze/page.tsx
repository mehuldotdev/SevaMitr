'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft,
  RotateCcw,
  Compass,
  Lightbulb,
  Maximize2,
  Minimize2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Home,
  CheckCircle2,
  ShieldCheck,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { brainHqAudio } from '@/lib/audio/brainHqAudio';
import { offlineDb } from '@/lib/db/offlineDb';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import { CelebrationModal } from '@/components/CelebrationModal';
import { scoreSpeedMaze } from '@/lib/scoring/gradingEngine';
import { generateRandomMaze, GeneratedMaze } from '@/lib/games/mazeGenerator';

const TOTAL_ROUNDS = 3;

export default function SpeedMazeGame() {
  const router = useRouter();
  const { language } = useLanguage();

  const [currentRound, setCurrentRound] = useState<number>(1);
  const [currentLevel, setCurrentLevel] = useState<GeneratedMaze>(() => generateRandomMaze(1));

  const [playerPosition, setPlayerPosition] = useState<[number, number]>(currentLevel.start);
  const [visitedCells, setVisitedCells] = useState<string[]>([]);
  const [score, setScore] = useState<number>(0);
  const [biomarkerLabel, setBiomarkerLabel] = useState<string>('Planning Hesitation: 1250ms');
  const [isRoundComplete, setIsRoundComplete] = useState<boolean>(false);
  const [isGameOver, setIsGameOver] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [activeHint, setActiveHint] = useState<[number, number] | null>(null);
  const [wallCollision, setWallCollision] = useState<[number, number] | null>(null);

  // Psychophysical telemetry references
  const stepTimestampsRef = useRef<number[]>([]);
  const lastStepTimeRef = useRef<number>(Date.now());
  const wallHitsRef = useRef<number>(0);
  const hesitationDurationsRef = useRef<number[]>([]);
  const backtrackCountRef = useRef<number>(0);
  const sessionStartTimeRef = useRef<number>(Date.now());
  const usedArchetypesRef = useRef<string[]>([]);

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

  // Reset or setup round
  const setupRound = useCallback((roundNum: number) => {
    if (roundNum === 1) {
      usedArchetypesRef.current = [];
    }
    const lvl = generateRandomMaze(roundNum, usedArchetypesRef.current);
    if (lvl.archetype) {
      usedArchetypesRef.current.push(lvl.archetype);
    }
    setCurrentLevel(lvl);
    setPlayerPosition(lvl.start);
    setVisitedCells([`${lvl.start[0]},${lvl.start[1]}`]);
    setIsRoundComplete(false);
    setActiveHint(null);
    setWallCollision(null);
    lastStepTimeRef.current = Date.now();
  }, []);

  useEffect(() => {
    setupRound(currentRound);
  }, [currentRound, setupRound]);

  // Check if position is a fork/decision junction
  const isJunction = (r: number, c: number, grid: number[][]): boolean => {
    let openCount = 0;
    const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (const [dr, dc] of dirs) {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < grid.length && nc >= 0 && nc < grid[0].length && grid[nr][nc] === 0) {
        openCount++;
      }
    }
    return openCount >= 3;
  };

  // Core movement engine
  const tryMove = useCallback((dr: number, dc: number) => {
    if (isRoundComplete || isGameOver) return;

    const [currR, currC] = playerPosition;
    const nextR = currR + dr;
    const nextC = currC + dc;
    const { grid, size, goal } = currentLevel;

    // Check bounds & wall
    if (nextR < 0 || nextR >= size || nextC < 0 || nextC >= size || grid[nextR][nextC] === 1) {
      // Wall collision (non-punishing feedback)
      wallHitsRef.current += 1;
      setWallCollision([nextR, nextC]);
      brainHqAudio.playGentleError();
      setTimeout(() => setWallCollision(null), 350);
      return;
    }

    // Valid movement!
    const now = Date.now();
    const stepDelta = now - lastStepTimeRef.current;
    stepTimestampsRef.current.push(stepDelta);

    // Track junction hesitation
    if (isJunction(currR, currC, grid)) {
      hesitationDurationsRef.current.push(stepDelta);
    }
    lastStepTimeRef.current = now;

    // Check backtracking
    const nextKey = `${nextR},${nextC}`;
    if (visitedCells.includes(nextKey)) {
      backtrackCountRef.current += 1;
    }

    // Play subtle wooden step sound
    brainHqAudio.playStepTick();

    setPlayerPosition([nextR, nextC]);
    setVisitedCells((prev) => (prev.includes(nextKey) ? prev : [...prev, nextKey]));
    setActiveHint(null);

    // Check Goal
    if (nextR === goal[0] && nextC === goal[1]) {
      // Round Complete!
      setIsRoundComplete(true);
      brainHqAudio.playSuccessChime();
      brainHqAudio.playBihuDhol();

      setScore(Math.round((currentRound / TOTAL_ROUNDS) * 100));

      try {
        confetti({
          particleCount: 45,
          spread: 55,
          origin: { y: 0.6 },
          colors: ['#214935', '#b8860b', '#0f4c81', '#ffffff'],
        });
      } catch {
        // Fallback
      }

      setTimeout(() => {
        if (currentRound >= TOTAL_ROUNDS) {
          // Final Game Complete
          finishGame();
        } else {
          setCurrentRound((prev) => prev + 1);
        }
      }, 1600);
    }
  }, [playerPosition, isRoundComplete, isGameOver, currentLevel, visitedCells, currentRound]);

  // Complete game and save telemetry
  const finishGame = () => {
    setIsGameOver(true);
    const totalDurationSec = Math.max(8, Math.round((Date.now() - sessionStartTimeRef.current) / 1000));
    
    // Compute psychophysical metrics
    const avgHesitationMs = hesitationDurationsRef.current.length > 0
      ? Math.round(hesitationDurationsRef.current.reduce((a, b) => a + b, 0) / hesitationDurationsRef.current.length)
      : 1250;

    const { score: finalScore, biomarker } = scoreSpeedMaze(
      TOTAL_ROUNDS,
      TOTAL_ROUNDS,
      wallHitsRef.current,
      backtrackCountRef.current,
      avgHesitationMs
    );

    setScore(finalScore);
    setBiomarkerLabel(biomarker);

    offlineDb.saveSession({
      patientId: offlineDb.getPatient().id,
      gameId: 'speed_maze',
      gameTitle: 'BrainHQ: Speed Maze (Spatial Navigation & Visuomotor Speed)',
      difficultyLevel: 3,
      score: finalScore,
      durationSec: totalDurationSec,
      hesitationMs: avgHesitationMs,
      errorCount: wallHitsRef.current,
      confusionLoops: backtrackCountRef.current,
      completed: true,
      timeOfDay: new Date().getHours() >= 8 && new Date().getHours() < 16 ? 'morning' : 'evening',
    });
  };

  // Keyboard navigation for desktop testers / SIH judges
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'KeyW'].includes(e.code)) {
        e.preventDefault();
        tryMove(-1, 0);
      } else if (['ArrowDown', 'KeyS'].includes(e.code)) {
        e.preventDefault();
        tryMove(1, 0);
      } else if (['ArrowLeft', 'KeyA'].includes(e.code)) {
        e.preventDefault();
        tryMove(0, -1);
      } else if (['ArrowRight', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        tryMove(0, 1);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tryMove]);

  // Dementia-Safe Hint: Find next step on solution path
  const showHint = () => {
    const [currR, currC] = playerPosition;
    const { solutionPath } = currentLevel;
    const currIdx = solutionPath.findIndex(([r, c]) => r === currR && c === currC);

    if (currIdx !== -1 && currIdx < solutionPath.length - 1) {
      setActiveHint(solutionPath[currIdx + 1]);
    } else {
      // If off solution path, point back toward nearest solution node
      const nearest = solutionPath[Math.min(solutionPath.length - 1, currIdx + 1 || 0)];
      setActiveHint(nearest);
    }
    brainHqAudio.playStepTick();
  };


  // Cell tap handler (Direct tile clicking)
  const handleCellClick = (r: number, c: number) => {
    const [currR, currC] = playerPosition;
    const dr = r - currR;
    const dc = c - currC;
    // Only allow single orthogonal steps
    if (Math.abs(dr) + Math.abs(dc) === 1) {
      tryMove(dr, dc);
    }
  };

  const avgSpeedMs = stepTimestampsRef.current.length > 0
    ? Math.round(stepTimestampsRef.current.reduce((a, b) => a + b, 0) / stepTimestampsRef.current.length)
    : 450;

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
      {/* Neo-Brutalist Frame */}
      <div
        className="neo-card"
        style={{
          width: '100%',
          maxWidth: '560px',
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
                background: '#f3e8ff',
                color: '#6b21a8',
                border: '2px solid #1c1b1b',
                padding: '0.35rem 0.75rem',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}
            >
              ROUND {currentRound} OF {TOTAL_ROUNDS}
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '10px',
                  background: '#f3e8ff',
                  border: '2px solid #1c1b1b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#6b21a8',
                }}
              >
                <Compass size={20} strokeWidth={2.5} />
              </div>
              <h1 className="font-clash-bold" style={{ fontSize: '1.45rem', margin: 0, textTransform: 'uppercase', color: '#1c1b1b' }}>
                Speed Maze
              </h1>
            </div>
            <p className="font-clash-regular" style={{ fontSize: '0.8rem', color: '#57534e', margin: '0.2rem 0 0' }}>
              {currentLevel.title} • Spatial Processing Trial
            </p>
          </div>

        </div>

        {/* Maze Game Board */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            maxWidth: '380px',
            margin: '0.75rem auto',
            aspectRatio: '1 / 1',
            background: '#ffffff',
            border: '3px solid #1c1b1b',
            boxShadow: '4px 4px 0px #1c1b1b',
            borderRadius: '16px',
            padding: '8px',
            boxSizing: 'border-box',
            display: 'grid',
            gridTemplateColumns: `repeat(${currentLevel.size}, 1fr)`,
            gridTemplateRows: `repeat(${currentLevel.size}, 1fr)`,
            gap: currentLevel.size === 5 ? '6px' : currentLevel.size === 7 ? '4px' : '3px',
            touchAction: 'manipulation',
          }}
        >
          {currentLevel.grid.map((row, r) =>
            row.map((cell, c) => {
              const isPlayer = playerPosition[0] === r && playerPosition[1] === c;
              const isGoal = currentLevel.goal[0] === r && currentLevel.goal[1] === c;
              const isWall = cell === 1;
              const isVisited = visitedCells.includes(`${r},${c}`);
              const isHint = activeHint && activeHint[0] === r && activeHint[1] === c;
              const isWallBump = wallCollision && wallCollision[0] === r && wallCollision[1] === c;

              return (
                <div
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  style={{
                    borderRadius: currentLevel.size === 9 ? '6px' : '8px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: currentLevel.size === 5 ? '1.5rem' : currentLevel.size === 7 ? '1.2rem' : '0.95rem',
                    cursor: !isWall ? 'pointer' : 'default',
                    transition: 'all 0.12s ease',
                    position: 'relative',
                    background: isWall
                      ? '#1c1b1b'
                      : isPlayer
                      ? '#6b21a8'
                      : isGoal
                      ? '#fef9c3'
                      : isHint
                      ? '#fef08a'
                      : isVisited
                      ? '#e8f5e9'
                      : '#f4f7f4',
                    border: isPlayer
                      ? '2.5px solid #1c1b1b'
                      : isGoal
                      ? '2px dashed #b8860b'
                      : isHint
                      ? '2.5px solid #ca8a04'
                      : isWallBump
                      ? '2.5px solid #dc2626'
                      : isWall
                      ? '1px solid #1c1b1b'
                      : '1px solid #e7e5e4',
                    boxShadow: isPlayer
                      ? '0 0 10px rgba(107, 33, 168, 0.4)'
                      : isHint
                      ? '0 0 12px rgba(234, 179, 8, 0.6)'
                      : 'none',
                  }}
                >
                  {/* Player Token */}
                  {isPlayer && (
                    <span
                      style={{
                        transform: 'scale(1.15)',
                        display: 'inline-block',
                        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))',
                      }}
                    >
                      {currentLevel.playerToken}
                    </span>
                  )}

                  {/* Goal Sanctuary Token */}
                  {isGoal && !isPlayer && (
                    <span
                      style={{
                        transform: 'scale(1.15)',
                        display: 'inline-block',
                      }}
                    >
                      {currentLevel.goalToken}
                    </span>
                  )}

                  {/* Breadcrumb dot on visited paths */}
                  {!isPlayer && !isGoal && isVisited && (
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: '#2e7d32',
                        opacity: 0.6,
                      }}
                    />
                  )}

                  {/* Hint indicator */}
                  {isHint && !isPlayer && (
                    <div
                      style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: '#ca8a04',
                        animation: 'pulse 1s infinite',
                      }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Elderly-Friendly Neo-Brutalist D-Pad Controls */}
        <div
          style={{
            margin: '0.85rem auto 0.4rem',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.4rem',
            width: '100%',
            maxWidth: '240px',
          }}
        >
          {/* UP button */}
          <button
            onClick={() => tryMove(-1, 0)}
            className="neo-card"
            style={{
              width: '68px',
              height: '52px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#ffffff',
              border: '2.5px solid #1c1b1b',
              boxShadow: '3px 3px 0px #1c1b1b',
              borderRadius: '14px',
              cursor: 'pointer',
              color: '#1c1b1b',
            }}
            aria-label="Move Up"
          >
            <ChevronUp size={28} strokeWidth={3} />
          </button>

          {/* LEFT, HINT, RIGHT buttons */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <button
              onClick={() => tryMove(0, -1)}
              className="neo-card"
              style={{
                width: '68px',
                height: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff',
                border: '2.5px solid #1c1b1b',
                boxShadow: '3px 3px 0px #1c1b1b',
                borderRadius: '14px',
                cursor: 'pointer',
                color: '#1c1b1b',
              }}
              aria-label="Move Left"
            >
              <ChevronLeft size={28} strokeWidth={3} />
            </button>

            <button
              onClick={showHint}
              className="neo-card font-clash-bold"
              style={{
                width: '68px',
                height: '52px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#fef08a',
                border: '2.5px solid #1c1b1b',
                boxShadow: '3px 3px 0px #1c1b1b',
                borderRadius: '14px',
                cursor: 'pointer',
                color: '#854d0e',
                padding: 0,
              }}
              aria-label="Need a Hint"
            >
              <Lightbulb size={20} strokeWidth={2.5} />
              <span style={{ fontSize: '0.62rem', letterSpacing: '0.04em' }}>HINT</span>
            </button>

            <button
              onClick={() => tryMove(0, 1)}
              className="neo-card"
              style={{
                width: '68px',
                height: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#ffffff',
                border: '2.5px solid #1c1b1b',
                boxShadow: '3px 3px 0px #1c1b1b',
                borderRadius: '14px',
                cursor: 'pointer',
                color: '#1c1b1b',
              }}
              aria-label="Move Right"
            >
              <ChevronRight size={28} strokeWidth={3} />
            </button>
          </div>

          {/* DOWN button */}
          <button
            onClick={() => tryMove(1, 0)}
            className="neo-card"
            style={{
              width: '68px',
              height: '52px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#ffffff',
              border: '2.5px solid #1c1b1b',
              boxShadow: '3px 3px 0px #1c1b1b',
              borderRadius: '14px',
              cursor: 'pointer',
              color: '#1c1b1b',
            }}
            aria-label="Move Down"
          >
            <ChevronDown size={28} strokeWidth={3} />
          </button>
        </div>

        {/* Live Psychophysical Telemetry Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-around',
            alignItems: 'center',
            padding: '0.65rem 0.75rem',
            background: '#f4f7f4',
            border: '2px solid #1c1b1b',
            borderRadius: '12px',
            marginTop: '0.75rem',
          }}
        >
          <div style={{ textAlign: 'center' }}>
            <span className="font-clash-wide" style={{ fontSize: '0.65rem', color: '#57534e', display: 'block' }}>
              VISUOMOTOR
            </span>
            <span className="font-clash-bold" style={{ fontSize: '0.92rem', color: '#1c1b1b' }}>
              {avgSpeedMs}ms/step
            </span>
          </div>

          <div style={{ width: '1px', height: '24px', background: '#d6d3d1' }} />

          <div style={{ textAlign: 'center' }}>
            <span className="font-clash-wide" style={{ fontSize: '0.65rem', color: '#57534e', display: 'block' }}>
              WALL CHECKS
            </span>
            <span className="font-clash-bold" style={{ fontSize: '0.92rem', color: wallHitsRef.current > 4 ? '#c85a32' : '#214935' }}>
              {wallHitsRef.current}
            </span>
          </div>

          <div style={{ width: '1px', height: '24px', background: '#d6d3d1' }} />

          <div style={{ textAlign: 'center' }}>
            <span className="font-clash-wide" style={{ fontSize: '0.65rem', color: '#57534e', display: 'block' }}>
              SCORE
            </span>
            <span className="font-clash-bold" style={{ fontSize: '0.92rem', color: '#6b21a8' }}>
              {score}%
            </span>
          </div>
        </div>
      </div>

      <CelebrationModal
        isOpen={isGameOver}
        gameTitle="Speed Maze (Spatial Navigation)"
        score={score}
        timeSpentSec={Math.max(10, Math.round((Date.now() - sessionStartTimeRef.current) / 1000))}
        message={`Visuomotor speed: ${avgSpeedMs}ms/step • 3/3 Trails Cleared • Wall touches: ${wallHitsRef.current}`}
        biomarkerLabel={biomarkerLabel}
        onPlayAgain={() => {
          usedArchetypesRef.current = [];
          setCurrentRound(1);
          setScore(0);
          setIsGameOver(false);
          setupRound(1);
          sessionStartTimeRef.current = Date.now();
        }}
        nextGameUrl="/patient/games/bijuli-tap"
      />
    </div>
  );
}
