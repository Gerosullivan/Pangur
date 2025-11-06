// Core game types for Pangur

export type Column = 'A' | 'B' | 'C' | 'D';
export type Row = 1 | 2 | 3 | 4;

export interface Position {
  col: Column;
  row: Row;
}

export interface CatStats {
  catch: number;
  meow: number;
  name: string;
  role: string;
}

export interface Cat {
  id: string;
  name: string;
  role: string;
  baseCatch: number;
  baseMeow: number;
  hearts: number;
  maxHearts: number;
  position: Position | null; // null when in hand
  spentCatch: number;
  hasMoved: boolean;
  hasAttacked: boolean;
}

export interface Mouse {
  id: string;
  position: Position;
  attack: number;
  health: number;
  isStunned: boolean;
  isGrainFed: boolean; // 2/2 vs 1/1
}

export type GamePhase =
  | 'setup'           // Initial cat placement
  | 'cat-phase'       // Player's turn
  | 'mouse-phase'     // Mice attack and eat
  | 'wave-phase'      // Deterrence and new mice enter
  | 'win'
  | 'loss';

export interface GameState {
  phase: GamePhase;
  turn: number;
  cats: Cat[];
  mice: Mouse[];
  incomingQueue: number; // Number of mice waiting to enter
  grain: number;
  selectedCatId: string | null;
  activeCatId: string | null; // Cat currently taking actions
  setupCatsPlaced: number; // Track how many cats placed during setup
}

// Initial cat data from lore table
export const INITIAL_CATS: Omit<Cat, 'id' | 'position' | 'spentCatch' | 'hasMoved' | 'hasAttacked'>[] = [
  { name: 'Pangur (Cruibne)', role: 'Strongpaw', baseCatch: 3, baseMeow: 1, hearts: 5, maxHearts: 5 },
  { name: 'Baircne', role: 'Domestic Cat', baseCatch: 2, baseMeow: 2, hearts: 5, maxHearts: 5 },
  { name: 'Breoinne', role: 'Guardian', baseCatch: 1, baseMeow: 3, hearts: 5, maxHearts: 5 },
];

// Helper functions
export function positionToString(pos: Position): string {
  return `${pos.col}${pos.row}`;
}

export function positionsEqual(a: Position | null, b: Position | null): boolean {
  if (a === null || b === null) return a === b;
  return a.col === b.col && a.row === b.row;
}

export function isPerimeterCell(pos: Position): boolean {
  return pos.row === 1 || pos.row === 4 || pos.col === 'A' || pos.col === 'D';
}

export function isShadowBonusCell(pos: Position): boolean {
  // Shadow bonus: columns A or D, row 1. NOT B4 or C4 (open gate)
  if (pos.col === 'B' && pos.row === 4) return false;
  if (pos.col === 'C' && pos.row === 4) return false;
  return (pos.col === 'A' || pos.col === 'D') && pos.row === 1;
}

export function getMeowMultiplier(row: Row): number {
  switch (row) {
    case 4: return 2;
    case 3: return 1;
    case 2: return 0.5;
    case 1: return 0;
  }
}

export function getCatchBonus(pos: Position): number {
  return isShadowBonusCell(pos) ? 1 : 0;
}

export function calculateEffectiveCatch(cat: Cat): number {
  if (cat.position === null) return cat.baseCatch;
  return cat.baseCatch + getCatchBonus(cat.position);
}

export function calculateEffectiveMeow(cat: Cat): number {
  if (cat.position === null) return 0;
  return Math.floor(cat.baseMeow * getMeowMultiplier(cat.position.row));
}
