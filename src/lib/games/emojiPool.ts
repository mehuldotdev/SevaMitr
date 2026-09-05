/**
 * SevaMitr 75-Emoji Master Pool & Randomization Engine
 * Curated for high visual contrast, dementia accessibility, and North-East / Indian cultural resonance.
 */

export const EMOJI_POOL = {
  nature: ['🍃', '🍂', '🪷', '🌸', '🌺', '🌻', '🌾', '🌴', '🌲', '🍀', '🍁', '🎋', '🪴', '🌵', '🍄'],
  animals: ['🦏', '🐘', '🐅', '🦜', '🕊️', '🐟', '🐬', '🦆', '🦌', '🐎', '🐒', '🐢', '🦋', '🐝', '🦚'],
  heritage: ['🪔', '🔔', '🧺', '👒', '🏆', '🪕', '🥁', '🧵', '🏮', '📿', '🪙', '🏺', '📦', '🪁', '🧭'],
  travel: ['⛵', '🛶', '🛺', '🚗', '🚌', '🚲', '🚂', '🚜', '🛵', '✈️'],
  harvest: ['🥥', '🥭', '🍌', '🍎', '🌽', '🍚', '🫖', '🍯', '🍉', '🍇'],
  celestial: ['☀️', '🌕', '⭐', '🌈', '⚡', '☁️', '🌊', '🌙', '✨', '🌧️'],
};

export const ALL_75_EMOJIS: string[] = Object.values(EMOJI_POOL).flat();

/**
 * Shuffles an array randomly using Fisher-Yates.
 */
export function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Returns `count` unique random emojis from the 75-emoji master pool.
 */
export function getRandomEmojis(count: number, exclude: string[] = []): string[] {
  const candidates = ALL_75_EMOJIS.filter((e) => !exclude.includes(e));
  const shuffled = shuffleArray(candidates);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

/**
 * Contrasting emoji pairs for visual discrimination games (Double Decision, Bikhama Khoj).
 */
export const CONTRASTING_PAIRS: { distractor: string; target: string; isOrientationFlip?: boolean; title: string }[] = [
  // Orientation / Directional Anomalies
  { distractor: '🦏', target: '🦏', isOrientationFlip: true, title: 'Rhino Direction' },
  { distractor: '⛵', target: '⛵', isOrientationFlip: true, title: 'Boat Direction' },
  { distractor: '🐟', target: '🐟', isOrientationFlip: true, title: 'Fish Direction' },
  { distractor: '🐘', target: '🐘', isOrientationFlip: true, title: 'Elephant Direction' },
  { distractor: '🚗', target: '🚗', isOrientationFlip: true, title: 'Car Direction' },
  { distractor: '🐎', target: '🐎', isOrientationFlip: true, title: 'Horse Direction' },
  { distractor: '🕊️', target: '🕊️', isOrientationFlip: true, title: 'Dove Direction' },
  { distractor: '🦆', target: '🦆', isOrientationFlip: true, title: 'Duck Direction' },

  // Color & Feature Anomalies
  { distractor: '🍃', target: '🍂', isOrientationFlip: false, title: 'Tea Leaf Shift' },
  { distractor: '🪷', target: '🌸', isOrientationFlip: false, title: 'Lotus Blossom' },
  { distractor: '🌕', target: '☀️', isOrientationFlip: false, title: 'Sun & Moon' },
  { distractor: '🌻', target: '🌺', isOrientationFlip: false, title: 'Garden Blooms' },
  { distractor: '🍎', target: '🥭', isOrientationFlip: false, title: 'Orchard Harvest' },
  { distractor: '🥥', target: '🍌', isOrientationFlip: false, title: 'Village Fruits' },
  { distractor: '🪔', target: '🏮', isOrientationFlip: false, title: 'Festive Lights' },
  { distractor: '🔔', target: '🥁', isOrientationFlip: false, title: 'Temple Instruments' },
  { distractor: '🧺', target: '📦', isOrientationFlip: false, title: 'Baskets & Packs' },
  { distractor: '🛶', target: '⛵', isOrientationFlip: false, title: 'River Craft' },
  { distractor: '🛺', target: '🚲', isOrientationFlip: false, title: 'Village Wheels' },
  { distractor: '⭐', target: '✨', isOrientationFlip: false, title: 'Starlight Sparkle' },
  { distractor: '☁️', target: '🌧️', isOrientationFlip: false, title: 'Monsoon Clouds' },
  { distractor: '🦋', target: '🐝', isOrientationFlip: false, title: 'Meadow Wing' },
  { distractor: '🌾', target: '🎋', isOrientationFlip: false, title: 'Brahmaputra Reeds' },
];

/**
 * Returns a randomized contrasting pair for visual search.
 */
export function getRandomContrastingPair() {
  const shuffled = shuffleArray(CONTRASTING_PAIRS);
  return shuffled[0];
}

/**
 * Returns 5 unique randomized pairs for a 5-round game of Bikhama Khoj.
 */
export function getRandomVisualSearchRounds(count = 5) {
  const shuffled = shuffleArray(CONTRASTING_PAIRS);
  return shuffled.slice(0, count);
}

/**
 * Traveler & Goal sanctuary themes for Speed Maze.
 */
export const MAZE_THEMES = [
  { player: '⛵', goal: '🏡', title: 'Brahmaputra Voyager' },
  { player: '🐘', goal: '🪷', title: 'Elephant Sanctuary' },
  { player: '🛺', goal: '🏮', title: 'Bazaar Express' },
  { player: '🛶', goal: '⛺', title: 'River Crossing' },
  { player: '🚴', goal: '🏰', title: 'Valley Path' },
  { player: '🦏', goal: '🌾', title: 'Kaziranga Trail' },
  { player: '🐎', goal: '🚩', title: 'Highland Ridge' },
  { player: '🕊️', goal: '🌴', title: 'Forest Canopy' },
];

export function getRandomMazeTheme() {
  const shuffled = shuffleArray(MAZE_THEMES);
  return shuffled[0];
}
