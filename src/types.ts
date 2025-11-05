// Coordinate system: A-D columns (left to right), 1-4 rows (bottom to top)
export type Column = 'A' | 'B' | 'C' | 'D';
export type Row = 1 | 2 | 3 | 4;

export interface Position {
  col: Column;
  row: Row;
}

export interface Cat {
  id: string;
  name: string;
  role: string;
  baseCatch: number;
  baseMeow: number;
  hearts: number;
  maxHearts: number;
  position: Position | null; // null if in hand (during setup)
  spentCatch: number;
  hasMoved: boolean;
  isActive: boolean;
}

export interface Mouse {
  id: string;
  position: Position;
  attack: number;
  hearts: number;
  hasEaten: boolean;
  isStunned: boolean;
}

export type Phase = 'setup' | 'cat' | 'mouse' | 'incoming' | 'gameOver';

export interface GameState {
  phase: Phase;
  turn: number;
  grain: number;
  cats: Cat[];
  residentMice: Mouse[];
  incomingQueue: number; // Number of mice waiting to enter (0-12)
  selectedCatId: string | null;
  gameResult: 'win' | 'loss' | null;
  setupCatsPlaced: number;
}

export interface CellModifiers {
  isShadowBonus: boolean;
  isOpenGate: boolean;
  meowMultiplier: number;
}
