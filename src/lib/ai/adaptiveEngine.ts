/**
 * Client-Side Heuristic-Bayesian Adaptive Difficulty Engine
 * 
 * Specifically calibrated for Mild Cognitive Impairment (MCI) and early/moderate Dementia:
 * - Errorless Learning Principle: Never frustrates or scolds the elder
 * - Dynamic Assist Timing: Proactively highlights cards or offers audio hints if hesitation > threshold
 * - Circadian Adaptation: Accounts for late-afternoon fatigue / sun-downing syndrome
 */

export interface AdaptiveInput {
  currentLevel: number;         // 1 to 5
  reactionTimeMs: number;       // Time taken for current action
  expectedTimeMs: number;       // Baseline expected time for this stage
  isCorrect: boolean;
  consecutiveErrors: number;
  repeatedMistakesOnSameItem: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
}

export interface AdaptiveRecommendation {
  nextLevel: number;
  showVisualHint: boolean;
  playAudioHint: boolean;
  hintMessage: string;
  hintMessageAssamese: string;
  hintMessageBengali: string;
  hesitationFactor: number;
  status: 'calm' | 'hesitant' | 'fatigued' | 'confident';
}

export function evaluateAdaptiveStep(input: AdaptiveInput): AdaptiveRecommendation {
  const {
    currentLevel,
    reactionTimeMs,
    expectedTimeMs,
    isCorrect,
    consecutiveErrors,
    repeatedMistakesOnSameItem,
    timeOfDay,
  } = input;

  const hesitationFactor = reactionTimeMs / Math.max(expectedTimeMs, 500);

  let nextLevel = currentLevel;
  let showVisualHint = false;
  let playAudioHint = false;
  let status: 'calm' | 'hesitant' | 'fatigued' | 'confident' = 'calm';

  let hintMessage = 'Take your time, you are doing very well.';
  let hintMessageAssamese = 'লাহে লাহে কৰক, আপুনি বৰ ভাল কৰিছে।';
  let hintMessageBengali = 'ধীরে ধীরে করুন, আপনি খুব ভালো করছেন।';

  // Rule 1: High Hesitation / Confusion Loop Detected
  if (repeatedMistakesOnSameItem >= 1 || hesitationFactor > 2.0 || consecutiveErrors >= 2) {
    showVisualHint = true;
    playAudioHint = true;
    status = hesitationFactor > 2.5 ? 'fatigued' : 'hesitant';

    // Step down difficulty if consistently struggling
    if (consecutiveErrors >= 3 && currentLevel > 1) {
      nextLevel = currentLevel - 1;
    }

    hintMessage = 'Look closely at the glowing item. You can do it!';
    hintMessageAssamese = 'উজ্বলি থকা ছবিখনলৈ মন কৰক। আপুনি পাৰিব!';
    hintMessageBengali = 'উজ্জ্বল ছবিটি লক্ষ্য করুন। আপনি পারবেন!';
  } 
  // Rule 2: Confident, prompt mastery
  else if (isCorrect && hesitationFactor < 1.1 && consecutiveErrors === 0) {
    status = 'confident';
    // Promote difficulty if level < 5
    if (currentLevel < 5 && Math.random() > 0.4) {
      nextLevel = currentLevel + 1;
    }
  }

  // Rule 3: Circadian sun-downing adjustment (evening/night tolerance)
  if ((timeOfDay === 'evening' || timeOfDay === 'night') && hesitationFactor > 1.6) {
    status = 'fatigued';
    showVisualHint = true;
    hintMessage = 'Evening rest time is near. Relax and touch gently.';
    hintMessageAssamese = 'গধূলি সময় হৈছে, লাহেকৈ জিৰণি লৈ চুই দিয়ক।';
    hintMessageBengali = 'সন্ধ্যে হয়ে এসেছে, শান্ত মনে স্পর্শ করুন।';
  }

  return {
    nextLevel,
    showVisualHint,
    playAudioHint,
    hintMessage,
    hintMessageAssamese,
    hintMessageBengali,
    hesitationFactor,
    status,
  };
}

/**
 * Determine Time of Day for Circadian Tracking
 */
export function getCurrentTimeOfDay(): 'morning' | 'afternoon' | 'evening' | 'night' {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'morning';
  if (hour >= 12 && hour < 17) return 'afternoon';
  if (hour >= 17 && hour < 21) return 'evening';
  return 'night';
}
