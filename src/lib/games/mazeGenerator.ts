/**
 * Multi-Archetype Guaranteed-Solvable Maze Generator with BFS Path Solver
 * Features 15+ architectural pattern archetypes across 5x5, 7x7, and 9x9 grids,
 * dynamic DFS organic labyrinth carving, 8 spatial transformations (rotations & reflections),
 * and dynamic dementia-friendly themes.
 */

import { getRandomMazeTheme } from './emojiPool';

export interface GeneratedMaze {
  round: number;
  size: number;
  grid: number[][]; // 0 = open path, 1 = wall/hedge
  start: [number, number];
  goal: [number, number];
  solutionPath: [number, number][];
  playerToken: string;
  goalToken: string;
  title: string;
  archetype?: string;
}

interface MazeTemplate {
  name: string;
  archetype: string;
  grid: number[][];
  start: [number, number];
  goal: [number, number];
}

// 5x5 Handcrafted Architectural Archetypes
export const TEMPLATES_5x5: MazeTemplate[] = [
  // 1. S-Curve
  {
    name: 'Terraced S-Curve',
    archetype: 's_curve',
    grid: [
      [0, 0, 0, 0, 0],
      [1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1],
      [0, 0, 0, 0, 0],
    ],
    start: [0, 0],
    goal: [4, 4],
  },
  // 2. Village Loop Trail
  {
    name: 'Village Loop Trail',
    archetype: 'loop',
    grid: [
      [0, 0, 1, 0, 0],
      [0, 1, 1, 1, 0],
      [0, 0, 0, 0, 0],
      [1, 1, 0, 1, 1],
      [0, 0, 0, 0, 0],
    ],
    start: [0, 0],
    goal: [4, 4],
  },
  // 3. Zigzag Trail
  {
    name: 'Zigzag Mountain Path',
    archetype: 'zigzag',
    grid: [
      [0, 0, 1, 1, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 0, 1],
      [1, 0, 0, 0, 1],
      [1, 1, 1, 0, 0],
    ],
    start: [0, 0],
    goal: [4, 4],
  },
  // 4. Garden Crossway
  {
    name: 'Garden Crossway',
    archetype: 'crossway',
    grid: [
      [0, 0, 1, 0, 0],
      [1, 0, 1, 0, 1],
      [0, 0, 0, 0, 0],
      [1, 0, 1, 0, 1],
      [0, 0, 1, 0, 0],
    ],
    start: [0, 0],
    goal: [4, 4],
  },
  // 5. Bamboo Perimeter Trail
  {
    name: 'Bamboo Grove Walk',
    archetype: 'perimeter',
    grid: [
      [0, 0, 0, 0, 0],
      [1, 1, 1, 1, 0],
      [0, 0, 0, 1, 0],
      [0, 1, 0, 1, 0],
      [0, 1, 0, 0, 0],
    ],
    start: [0, 0],
    goal: [4, 2],
  },
];

// 7x7 Handcrafted Architectural Archetypes
export const TEMPLATES_7x7: MazeTemplate[] = [
  // 1. Serpentine River
  {
    name: 'Serpentine Riverbank',
    archetype: 's_curve',
    grid: [
      [0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 0, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ],
    start: [0, 0],
    goal: [6, 6],
  },
  // 2. Tea Estate Trail
  {
    name: 'Tea Estate Junctions',
    archetype: 'junctions',
    grid: [
      [0, 0, 0, 1, 1, 1, 1],
      [1, 1, 0, 1, 0, 0, 0],
      [0, 0, 0, 0, 0, 1, 0],
      [0, 1, 1, 1, 0, 1, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [1, 1, 0, 1, 1, 1, 0],
      [1, 1, 0, 0, 0, 0, 0],
    ],
    start: [0, 0],
    goal: [6, 6],
  },
  // 3. Central Temple Plaza
  {
    name: 'Central Temple Plaza',
    archetype: 'plaza',
    grid: [
      [0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 0, 1, 1, 0],
      [0, 1, 0, 0, 0, 1, 0],
      [0, 0, 0, 1, 0, 0, 0],
      [0, 1, 0, 0, 0, 1, 0],
      [0, 1, 1, 0, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ],
    start: [0, 0],
    goal: [6, 6],
  },
  // 4. Brahmaputra Delta
  {
    name: 'Brahmaputra Braided Stream',
    archetype: 'braided',
    grid: [
      [0, 0, 1, 0, 0, 0, 0],
      [1, 0, 1, 0, 1, 1, 0],
      [0, 0, 0, 0, 0, 1, 0],
      [0, 1, 1, 1, 0, 0, 0],
      [0, 0, 0, 1, 1, 1, 0],
      [1, 1, 0, 0, 0, 1, 0],
      [0, 0, 0, 1, 0, 0, 0],
    ],
    start: [0, 0],
    goal: [6, 6],
  },
  // 5. Concentric Walk
  {
    name: 'Concentric Sanctuary Walk',
    archetype: 'spiral',
    grid: [
      [0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 1, 0],
      [0, 1, 1, 1, 0, 1, 0],
      [0, 1, 0, 0, 0, 1, 0],
      [0, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0],
    ],
    start: [0, 0],
    goal: [4, 2],
  },
];

// 9x9 Handcrafted Architectural Archetypes
export const TEMPLATES_9x9: MazeTemplate[] = [
  // 1. Brahmaputra Sanctuary
  {
    name: 'Brahmaputra Sanctuary',
    archetype: 'sanctuary',
    grid: [
      [0, 0, 0, 0, 1, 0, 0, 0, 0],
      [1, 1, 1, 0, 1, 0, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 1, 0, 0],
      [0, 1, 1, 1, 1, 0, 1, 0, 1],
      [0, 0, 0, 0, 1, 0, 0, 0, 1],
      [1, 1, 1, 0, 1, 1, 1, 0, 0],
      [0, 0, 0, 0, 0, 0, 1, 1, 0],
      [0, 1, 1, 1, 1, 0, 0, 0, 0],
      [0, 0, 0, 0, 1, 1, 1, 1, 0],
    ],
    start: [0, 0],
    goal: [8, 8],
  },
  // 2. Hillside Terraces
  {
    name: 'Hillside Tea Terraces',
    archetype: 's_curve',
    grid: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 1, 0, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [0, 1, 1, 1, 1, 1, 1, 1, 1],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    start: [0, 0],
    goal: [8, 8],
  },
  // 3. Palace Labyrinth
  {
    name: 'Royal Palace Labyrinth',
    archetype: 'palace',
    grid: [
      [0, 0, 0, 1, 0, 0, 0, 1, 0],
      [0, 1, 0, 1, 0, 1, 0, 1, 0],
      [0, 1, 0, 0, 0, 1, 0, 0, 0],
      [0, 1, 1, 1, 0, 1, 1, 1, 0],
      [0, 0, 0, 1, 0, 0, 0, 1, 0],
      [1, 1, 0, 1, 1, 1, 0, 1, 0],
      [0, 0, 0, 0, 0, 1, 0, 0, 0],
      [0, 1, 1, 1, 0, 1, 1, 1, 0],
      [0, 0, 0, 1, 0, 0, 0, 0, 0],
    ],
    start: [0, 0],
    goal: [8, 8],
  },
  // 4. Assam Quad Courtyards
  {
    name: 'Assam Quad Courtyards',
    archetype: 'quad',
    grid: [
      [0, 0, 0, 0, 1, 0, 0, 0, 0],
      [0, 1, 1, 0, 1, 0, 1, 1, 0],
      [0, 1, 1, 0, 0, 0, 1, 1, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 0],
      [1, 1, 0, 1, 1, 1, 0, 1, 1],
      [0, 0, 0, 0, 1, 0, 0, 0, 0],
      [0, 1, 1, 0, 0, 0, 1, 1, 0],
      [0, 1, 1, 0, 1, 0, 1, 1, 0],
      [0, 0, 0, 0, 1, 0, 0, 0, 0],
    ],
    start: [0, 0],
    goal: [8, 8],
  },
  // 5. River Fork Delta
  {
    name: 'Majuli Island Labyrinth',
    archetype: 'delta',
    grid: [
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
      [1, 1, 1, 0, 1, 1, 1, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 1, 0],
      [0, 1, 1, 1, 1, 1, 0, 1, 0],
      [0, 1, 0, 0, 0, 1, 0, 0, 0],
      [0, 1, 0, 1, 0, 1, 1, 1, 0],
      [0, 0, 0, 1, 0, 0, 0, 1, 0],
      [1, 1, 1, 1, 1, 1, 0, 1, 0],
      [0, 0, 0, 0, 0, 0, 0, 0, 0],
    ],
    start: [0, 0],
    goal: [8, 8],
  },
];

/**
 * Geometric Rotation & Reflection Helpers
 */
function rotateGrid(grid: number[][]): number[][] {
  const size = grid.length;
  const res = Array.from({ length: size }, () => Array(size).fill(0));
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      res[c][size - 1 - r] = grid[r][c];
    }
  }
  return res;
}

function rotateCoord([r, c]: [number, number], size: number): [number, number] {
  return [c, size - 1 - r];
}

function flipHorizontal(grid: number[][]): number[][] {
  return grid.map((row) => [...row].reverse());
}

function flipCoordH([r, c]: [number, number], size: number): [number, number] {
  return [r, size - 1 - c];
}

/**
 * Procedural DFS Recursive Backtracker Labyrinth Generator.
 * Generates an organic, unique hedge maze each time.
 */
function generateDFSLabyrinth(size: number): MazeTemplate {
  const grid = Array.from({ length: size }, () => Array(size).fill(1));
  const nodeCount = Math.floor(size / 2) + 1;
  const visited = Array.from({ length: nodeCount }, () => Array(nodeCount).fill(false));
  const stack: [number, number][] = [];

  visited[0][0] = true;
  grid[0][0] = 0;
  stack.push([0, 0]);

  const dirs = [
    [-1, 0],
    [1, 0],
    [0, -1],
    [0, 1],
  ];

  while (stack.length > 0) {
    const [cr, cc] = stack[stack.length - 1];
    const candidates: [number, number, number, number][] = [];

    for (const [dr, dc] of dirs) {
      const nr = cr + dr;
      const nc = cc + dc;
      if (nr >= 0 && nr < nodeCount && nc >= 0 && nc < nodeCount && !visited[nr][nc]) {
        candidates.push([nr, nc, dr, dc]);
      }
    }

    if (candidates.length > 0) {
      const [nr, nc, dr, dc] = candidates[Math.floor(Math.random() * candidates.length)];
      visited[nr][nc] = true;
      grid[cr * 2 + dr][cc * 2 + dc] = 0;
      grid[nr * 2][nc * 2] = 0;
      stack.push([nr, nc]);
    } else {
      stack.pop();
    }
  }

  // Add 1-2 loop braids to eliminate harsh dead-ends (dementia-friendly)
  const braids = Math.max(1, Math.floor(size / 3));
  for (let b = 0; b < braids; b++) {
    const wr = Math.floor(Math.random() * (size - 2)) + 1;
    const wc = Math.floor(Math.random() * (size - 2)) + 1;
    grid[wr][wc] = 0;
  }

  return {
    name: 'Kaziranga Organic Labyrinth',
    archetype: 'dfs_labyrinth',
    grid,
    start: [0, 0],
    goal: [size - 1, size - 1],
  };
}

/**
 * BFS Shortest Path Solver
 */
export function solveMazeBFS(grid: number[][], start: [number, number], goal: [number, number]): [number, number][] {
  const size = grid.length;
  const queue: [number, number, [number, number][]][] = [[start[0], start[1], [start]]];
  const visited = new Set<string>([`${start[0]},${start[1]}`]);

  const directions = [
    [0, 1],
    [1, 0],
    [0, -1],
    [-1, 0],
  ];

  while (queue.length > 0) {
    const [r, c, path] = queue.shift()!;

    if (r === goal[0] && c === goal[1]) {
      return path;
    }

    for (const [dr, dc] of directions) {
      const nr = r + dr;
      const nc = c + dc;
      const key = `${nr},${nc}`;

      if (
        nr >= 0 &&
        nr < size &&
        nc >= 0 &&
        nc < size &&
        grid[nr][nc] === 0 &&
        !visited.has(key)
      ) {
        visited.add(key);
        queue.push([nr, nc, [...path, [nr, nc]]]);
      }
    }
  }

  return [];
}

/**
 * Generates a diverse, non-repeating procedural maze for the specified round.
 * Supports an optional previousArchetypes list to prevent consecutive rounds
 * from sharing the same visual pattern archetype.
 */
export function generateRandomMaze(round: number, previousArchetypes: string[] = []): GeneratedMaze {
  const size = round === 1 ? 5 : round === 2 ? 7 : 9;
  const templates = round === 1 ? TEMPLATES_5x5 : round === 2 ? TEMPLATES_7x7 : TEMPLATES_9x9;

  // Decide whether to generate an organic DFS Labyrinth (35% probability) or architectural template (65%)
  const useDFS = Math.random() < 0.35 && !previousArchetypes.includes('dfs_labyrinth');
  let chosen: MazeTemplate;

  if (useDFS) {
    chosen = generateDFSLabyrinth(size);
  } else {
    // Filter templates to avoid recent archetypes
    const filtered = templates.filter((t) => !previousArchetypes.includes(t.archetype));
    const pool = filtered.length > 0 ? filtered : templates;
    chosen = pool[Math.floor(Math.random() * pool.length)];
  }

  let g = chosen.grid.map((row) => [...row]);
  let s: [number, number] = [chosen.start[0], chosen.start[1]];
  let e: [number, number] = [chosen.goal[0], chosen.goal[1]];

  // Apply random rotation (0°, 90°, 180°, 270°)
  const rotations = Math.floor(Math.random() * 4);
  for (let r = 0; r < rotations; r++) {
    g = rotateGrid(g);
    s = rotateCoord(s, size);
    e = rotateCoord(e, size);
  }

  // Apply random horizontal reflection (50% chance)
  if (Math.random() > 0.5) {
    g = flipHorizontal(g);
    s = flipCoordH(s, size);
    e = flipCoordH(e, size);
  }

  // Solve with BFS to confirm solvability & get hint path
  let solutionPath = solveMazeBFS(g, s, e);

  // Fallback safe path if needed (guaranteed 100% safety)
  if (solutionPath.length === 0) {
    const base = templates[0];
    g = base.grid.map((r) => [...r]);
    s = [base.start[0], base.start[1]];
    e = [base.goal[0], base.goal[1]];
    solutionPath = solveMazeBFS(g, s, e);
  }

  const theme = getRandomMazeTheme();

  return {
    round,
    size,
    grid: g,
    start: s,
    goal: e,
    solutionPath,
    playerToken: theme.player,
    goalToken: theme.goal,
    title: `${chosen.name} (${theme.title})`,
    archetype: chosen.archetype,
  };
}
