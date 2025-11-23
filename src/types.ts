export type Column = 'A' | 'B' | 'C' | 'D' | 'E';
export type Row = 1 | 2 | 3 | 4 | 5;
export type CellId = `${Column}${Row}`;
export type EntryDirection = 'north' | 'south' | 'east' | 'west';

export type Phase = 'setup' | 'cat' | 'stepper';

export interface DeterrencePreview {
  meowge: number;
  deterred: number;
  entering: number;
}

export interface CatDefinition {
  id: CatId;
  name: string;
  role: string;
  baseCatch: number;
  baseMeow: number;
  portrait: string;
}

export type CatId = 'pangur' | 'guardian' | 'baircne';

export interface CatState {
  id: CatId;
  hearts: number;
  position?: CellId;
  catchSpent: number;
  movesRemaining: number;
  attackCommitted: boolean;
  turnEnded: boolean;
  shadowBonusPrimed: boolean;
  shadowBonusActive: boolean;
}

export interface MouseState {
  id: string;
  position?: CellId;
  tier: number;
  attack: number;
  hearts: number;
  maxHearts: number;
  stunned: boolean;
}

export type OccupantRef =
  | { type: 'cat'; id: CatId }
  | { type: 'mouse'; id: string };

export interface CellState {
  id: CellId;
  terrain: 'interior' | 'shadow' | 'gate';
  occupant?: OccupantRef;
}

export interface StepFrame {
  id: string;
  phase:
    | 'mouse-move'
    | 'mouse-attack'
    | 'mouse-feed'
    | 'incoming-summary'
    | 'incoming-scare'
    | 'incoming-place'
    | 'incoming-finish';
  description: string;
  payload?: unknown;
}

export interface StepperState {
  frames: StepFrame[];
  index: number;
  label: string;
  currentPhase: StepPhase;
  remaining: StepPhase[];
}

export type StepPhase = 'resident-mice' | 'incoming-wave';

export interface GameState {
  phase: Phase;
  turn: number;
  grainLoss: number;
  wave: number;
  nextMouseId: number;
  cells: Record<CellId, CellState>;
  cats: Record<CatId, CatState>;
  mice: Record<string, MouseState>;
  catOrder: CatId[];
  handCats: CatId[];
  selectedCatId?: CatId;
  incomingQueue: MouseState[];
  deterPreview: DeterrencePreview;
  stepper?: StepperState;
  log: string[];
  status: GameStatus;
}

export interface GameStatus {
  state: 'playing' | 'lost' | 'won';
  reason?: string;
}
