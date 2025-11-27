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
  portraitSrc: string;
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

export type MouseMoveFrame = {
  id: string;
  phase: 'mouse-move';
  description: string;
  payload: { mouseId: string; from: CellId; to: CellId };
};

export type MouseAttackFrame = {
  id: string;
  phase: 'mouse-attack';
  description: string;
  payload: { mouseId: string; targetId: CatId };
};

export type MouseFeedFrame = {
  id: string;
  phase: 'mouse-feed';
  description: string;
  payload: { eaters: string[] };
};

export type IncomingSummaryFrame = {
  id: string;
  phase: 'incoming-summary';
  description: string;
  payload: DeterrencePreview;
};

export type IncomingScareFrame = {
  id: string;
  phase: 'incoming-scare';
  description: string;
  payload: { amount: number };
};

export type IncomingPlaceFrame = {
  id: string;
  phase: 'incoming-place';
  description: string;
  payload: { cellId: CellId; gateId: CellId };
};

export type IncomingFinishFrame = {
  id: string;
  phase: 'incoming-finish';
  description: string;
  payload: DeterrencePreview;
};

export type StepFrame =
  | MouseMoveFrame
  | MouseAttackFrame
  | MouseFeedFrame
  | IncomingSummaryFrame
  | IncomingScareFrame
  | IncomingPlaceFrame
  | IncomingFinishFrame;

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
