import { GameState, Cat, Mouse, Position, Column, Row } from './types';

// Helper to generate position strings
export const pos = (col: Column, row: Row): Position => `${col}${row}`;

// Initial cats (off-board in hand)
export const createInitialCats = (): Cat[] => [
  {
    id: 'cat-1',
    name: 'Breoinne',
    role: 'Guardian',
    baseStats: { catch: 1, meow: 3 },
    hearts: 5,
    position: 'hand',
    spentCatch: 0,
    hasMoved: false,
    hasAttacked: false,
  },
  {
    id: 'cat-2',
    name: 'Pangur (Cruibne)',
    role: 'Strongpaw',
    baseStats: { catch: 3, meow: 1 },
    hearts: 5,
    position: 'hand',
    spentCatch: 0,
    hasMoved: false,
    hasAttacked: false,
  },
  {
    id: 'cat-3',
    name: 'Baircne',
    role: 'Domestic Cat',
    baseStats: { catch: 2, meow: 2 },
    hearts: 5,
    position: 'hand',
    spentCatch: 0,
    hasMoved: false,
    hasAttacked: false,
  },
];

// Initial mice on perimeter (12 total)
export const createInitialMice = (): Mouse[] => {
  const perimeterPositions: Position[] = [
    // Row 4 (top)
    'A4', 'B4', 'C4', 'D4',
    // Row 1 (bottom)
    'A1', 'B1', 'C1', 'D1',
    // Columns A and D (sides, excluding corners already covered)
    'A2', 'A3', 'D2', 'D3',
  ];

  return perimeterPositions.map((position, index) => ({
    id: `mouse-${index}`,
    position,
    attack: 1,
    health: 1,
    isStunned: false,
    isGrainFed: false,
  }));
};

export const createInitialGameState = (): GameState => ({
  phase: 'setup',
  subPhase: null,
  wave: 1,
  grain: 16,
  cats: createInitialCats(),
  mice: createInitialMice(),
  incomingQueue: 12,
  selectedCatId: null,
  phaseFrames: [],
  currentFrameIndex: 0,
  gameOver: false,
  victory: false,
});

// Helper functions
export const getPosition = (col: Column, row: Row): Position => `${col}${row}`;

export const parsePosition = (pos: Position): { col: Column; row: Row } => {
  const col = pos[0] as Column;
  const row = parseInt(pos[1]) as Row;
  return { col, row };
};

export const getCatAtPosition = (cats: Cat[], position: Position): Cat | undefined => {
  return cats.find(cat => cat.position === position);
};

export const getMouseAtPosition = (mice: Mouse[], position: Position): Mouse | undefined => {
  return mice.find(mouse => mouse.position === position);
};

export const isCellOccupied = (cats: Cat[], mice: Mouse[], position: Position): boolean => {
  return getCatAtPosition(cats, position) !== undefined ||
         getMouseAtPosition(mice, position) !== undefined;
};

// Check if position is a shadow bonus cell (A1, D1 only, not B4/C4)
export const isShadowBonusCell = (position: Position): boolean => {
  return position === 'A1' || position === 'D1';
};

// Check if position is open gate cell
export const isOpenGateCell = (position: Position): boolean => {
  return position === 'B4' || position === 'C4';
};

// Get meow modifier for a row
export const getMeowModifier = (row: Row): number => {
  switch (row) {
    case 4: return 2;
    case 3: return 1;
    case 2: return 0.5;
    case 1: return 0;
  }
};

// Calculate current cat stats with modifiers
export const getCurrentCatStats = (cat: Cat): { catch: number; meow: number } => {
  if (cat.position === 'hand') {
    return cat.baseStats;
  }

  const { row } = parsePosition(cat.position as Position);
  let catchBonus = 0;
  let meowMod = getMeowModifier(row);

  // Shadow bonus for catch
  if (isShadowBonusCell(cat.position as Position)) {
    catchBonus = 1;
  }

  return {
    catch: cat.baseStats.catch + catchBonus - cat.spentCatch,
    meow: Math.floor(cat.baseStats.meow * meowMod),
  };
};

// Calculate total meow deterrence
export const calculateTotalMeow = (cats: Cat[]): number => {
  return cats.reduce((total, cat) => {
    const stats = getCurrentCatStats(cat);
    return total + stats.meow;
  }, 0);
};
