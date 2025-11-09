export type Column = 'A' | 'B' | 'C' | 'D';
export type Row = 1 | 2 | 3 | 4;
export type CellId = `${Column}${Row}`;

export type Phase = 'setup' | 'cat' | 'stepper';

export interface CatDefinition {
  id: CatId;
  name: string;
  role: string;
  baseCatch: number;
  baseMeow: number;
  portrait: string;
}

export type CatId = 'pangur' | 'guardian' | 'baircne';

export type PangurSpecialSequence = 'move-attack-move' | 'attack-move-attack';
export type PangurSequenceLeg = 'idle' | 'attack-after-move' | 'second-move' | 'move-after-attack' | 'final-attack' | 'complete';

export interface CatState {
  id: CatId;
  hearts: number;
  position?: CellId;
  catchSpent: number;
  moveUsed: boolean;
  attackCommitted: boolean;
  stunned: false;
  turnEnded: boolean;
  specialSequence?: PangurSpecialSequence;
  specialLeg: PangurSequenceLeg;
  shadowBonusActive: boolean;
}

export interface MouseState {
  id: string;
  position?: CellId;
  attack: number;
  hearts: number;
  stunned: boolean;
  grainFed: boolean;
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
    | 'mouse-attack'
    | 'mouse-eat'
    | 'incoming-summary'
    | 'incoming-scare'
    | 'incoming-place'
    | 'incoming-overrun'
    | 'incoming-finish';
  description: string;
  payload?: Record<string, unknown>;
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
  grain: number;
  wave: number;
  nextMouseId: number;
  cells: Record<CellId, CellState>;
  cats: Record<CatId, CatState>;
  mice: Record<string, MouseState>;
  catOrder: CatId[];
  handCats: CatId[];
  selectedCatId?: CatId;
  incomingQueue: MouseState[];
  deterPreview: {
    scared: number;
    entering: number;
    totalMeow: number;
  };
  stepper?: StepperState;
  log: string[];
  status: GameStatus;
}

export interface GameStatus {
  state: 'playing' | 'lost' | 'won';
  reason?: string;
}
