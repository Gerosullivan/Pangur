// Game types for Pangur

export type Column = 'A' | 'B' | 'C' | 'D';
export type Row = 1 | 2 | 3 | 4;
export type Position = `${Column}${Row}`;

export interface CatStats {
  catch: number;
  meow: number;
}

export interface Cat {
  id: string;
  name: string;
  role: string;
  baseStats: CatStats;
  hearts: number;
  position: Position | 'hand';
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
  isGrainFed: boolean;
}

export type Phase = 'setup' | 'cat' | 'resident-mouse' | 'incoming-wave';

export interface PhaseFrame {
  type: string;
  description: string;
  data?: any;
}

export interface GameState {
  phase: Phase;
  subPhase: 'attack' | 'eat' | 'deter' | 'place' | null;
  wave: number;
  grain: number;
  cats: Cat[];
  mice: Mouse[];
  incomingQueue: number;
  selectedCatId: string | null;
  phaseFrames: PhaseFrame[];
  currentFrameIndex: number;
  gameOver: boolean;
  victory: boolean;
}
