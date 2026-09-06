/**
 * SevaMitr Clinical Cognitive Grading Engine
 * 
 * Standardizes scoring across all Speed Trial & BrainHQ cognitive games:
 * - Strictly bounded percentages: 0% to 100%
 * - Standardized Letter Grades: A+, A, B, C, Needs Support
 * - Dynamic Stars: 1 to 3 stars based on clinical thresholds
 * - Meaningful clinical biomarker highlights
 */

export interface GradeResult {
  score: number; // 0 to 100
  letterGrade: 'A+' | 'A' | 'B' | 'C' | 'Needs Support';
  stars: number; // 1, 2, or 3
  gradeLabel: string;
  badgeBg: string;
  badgeColor: string;
  biomarkerLabel?: string;
}

export function clampScore(score: number): number {
  if (isNaN(score) || !isFinite(score)) return 50;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function computeGrade(rawScore: number, biomarkerLabel?: string): GradeResult {
  const score = clampScore(rawScore);

  let letterGrade: GradeResult['letterGrade'];
  let gradeLabel: string;
  let badgeBg: string;
  let badgeColor: string;
  let stars: number;

  if (score >= 90) {
    letterGrade = 'A+';
    gradeLabel = 'Optimal Cognitive Function';
    badgeBg = '#dcfce7'; // light green
    badgeColor = '#15803d'; // green-700
    stars = 3;
  } else if (score >= 80) {
    letterGrade = 'A';
    gradeLabel = 'Strong Cognitive Performance';
    badgeBg = '#e0f2fe'; // light sky
    badgeColor = '#0369a1'; // sky-700
    stars = 3;
  } else if (score >= 65) {
    letterGrade = 'B';
    gradeLabel = 'Good Performance • Stable';
    badgeBg = '#fef9c3'; // light yellow
    badgeColor = '#a16207'; // yellow-700
    stars = 2;
  } else if (score >= 50) {
    letterGrade = 'C';
    gradeLabel = 'Fair • Monitor Variations';
    badgeBg = '#ffedd5'; // light orange
    badgeColor = '#c2410c'; // orange-700
    stars = 2;
  } else {
    letterGrade = 'Needs Support';
    gradeLabel = 'Mild Variation • Needs Support';
    badgeBg = '#fee2e2'; // light red
    badgeColor = '#b91c1c'; // red-700
    stars = 1;
  }

  return {
    score,
    letterGrade,
    stars,
    gradeLabel,
    badgeBg,
    badgeColor,
    biomarkerLabel,
  };
}

/**
 * Double Decision (UFOV Visual Processing Speed)
 * 5 trials. Peripheral star angle + Center target discrimination.
 */
export function scoreDoubleDecision(
  correctTrials: number,
  totalTrials: number,
  bestExposureMs: number
): { score: number; biomarker: string } {
  const accuracyPct = (correctTrials / Math.max(1, totalTrials)) * 70; // 0 to 70 pts
  let speedBonus = 10;
  if (bestExposureMs <= 120) speedBonus = 30;
  else if (bestExposureMs <= 200) speedBonus = 25;
  else if (bestExposureMs <= 350) speedBonus = 20;
  else if (bestExposureMs <= 450) speedBonus = 15;

  const score = clampScore(accuracyPct + speedBonus);
  const biomarker = `UFOV Threshold: ${bestExposureMs}ms`;
  return { score, biomarker };
}

/**
 * Sound Sweeps (Auditory Temporal Processing)
 * 5 trials. Sequential sweep direction discrimination.
 */
export function scoreSoundSweeps(
  correctTrials: number,
  totalTrials: number,
  bestIsiMs: number
): { score: number; biomarker: string } {
  const accuracyPct = (correctTrials / Math.max(1, totalTrials)) * 70; // 0 to 70 pts
  let temporalBonus = 10;
  if (bestIsiMs <= 80) temporalBonus = 30;
  else if (bestIsiMs <= 150) temporalBonus = 25;
  else if (bestIsiMs <= 250) temporalBonus = 20;
  else if (bestIsiMs <= 380) temporalBonus = 15;

  const score = clampScore(accuracyPct + temporalBonus);
  const biomarker = `Temporal ISI: ${bestIsiMs}ms`;
  return { score, biomarker };
}

/**
 * Target Tracker (Multiple Object Tracking & Divided Attention)
 * 4 rounds tracking 2 moving target orbs.
 */
export function scoreTargetTracker(
  correctRounds: number,
  totalRounds: number,
  durationSec: number
): { score: number; biomarker: string } {
  const accuracyPct = (correctRounds / Math.max(1, totalRounds)) * 80; // 0 to 80 pts
  // Pace bonus: completing under 28 seconds gives 20 pts, up to 45s gives 12 pts
  const paceBonus = durationSec <= 28 ? 20 : durationSec <= 40 ? 15 : 10;

  const score = clampScore(accuracyPct + paceBonus);
  const accuracy = Math.round((correctRounds / Math.max(1, totalRounds)) * 100);
  const biomarker = `Tracking Accuracy: ${accuracy}%`;
  return { score, biomarker };
}

/**
 * Speed Maze (Visuomotor Planning & Spatial Navigation)
 * 3 levels completed.
 */
export function scoreSpeedMaze(
  levelsCompleted: number,
  totalLevels: number,
  wallHits: number,
  backtracks: number,
  avgHesitationMs: number
): { score: number; biomarker: string } {
  const base = (levelsCompleted / Math.max(1, totalLevels)) * 60; // 60 pts max
  const wallSafety = Math.max(0, 20 - wallHits * 3); // 20 pts max
  const efficiency = Math.max(0, 20 - backtracks * 2); // 20 pts max

  const score = clampScore(base + wallSafety + efficiency);
  const biomarker = `Planning Hesitation: ${avgHesitationMs}ms`;
  return { score, biomarker };
}

/**
 * Bijuli Tap (Psychomotor Vigilance & Go/No-Go Speed)
 * 8 trials. Fast tap on green (Go), withhold tap on red (No-Go).
 */
export function scoreBijuliTap(
  avgReactionMs: number,
  falseStarts: number
): { score: number; biomarker: string } {
  // RT component (max 65 pts)
  let rtScore = 65;
  if (avgReactionMs > 250) {
    rtScore = Math.max(15, 65 - Math.round((avgReactionMs - 250) / 8));
  }

  // Accuracy component (max 35 pts)
  const accuracyScore = Math.max(0, 35 - falseStarts * 10);

  const score = clampScore(rtScore + accuracyScore);
  const biomarker = `Mean Reaction: ${avgReactionMs}ms`;
  return { score, biomarker };
}

/**
 * Bikhama Khoj (Visual Search & Odd One Out)
 * 5 rounds. Find the anomalous symbol.
 */
export function scoreBikhamaKhoj(
  roundsCompleted: number,
  totalRounds: number,
  avgLatencyMs: number,
  distractorTaps: number
): { score: number; biomarker: string } {
  const accuracyPts = (roundsCompleted / Math.max(1, totalRounds)) * 70; // 70 pts
  let speedBonus = 10;
  if (avgLatencyMs <= 700) speedBonus = 30;
  else if (avgLatencyMs <= 1100) speedBonus = 22;
  else if (avgLatencyMs <= 1600) speedBonus = 15;

  const penalty = distractorTaps * 4;
  const score = clampScore(accuracyPts + speedBonus - penalty);
  const biomarker = `Visual Search: ${avgLatencyMs}ms`;
  return { score, biomarker };
}
