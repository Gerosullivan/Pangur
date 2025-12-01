export type Column = 'A' | 'B' | 'C' | 'D' | 'E';
export type Row = 1 | 2 | 3 | 4 | 5;
export type CellId = `${Column}${Row}`;
export type Screen = 'start' | 'tutorial' | 'game';
export type ModeId = 'tutorial' | 'classic' | 'easy' | 'hard';

export type Phase = 'setup' | 'cat' | 'stepper';

export interface DeterrencePreview extends Record<string, unknown> {
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
  wokenByAttack?: boolean;
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
  modeId: ModeId;
  phase: Phase;
  turn: number;
  grainLoss: number;
  wave: number;
  showOpeningOverlay: boolean;
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
  log: LogEvent[];
  status: GameStatus;
  outcomeRecorded: boolean;
}

export interface GameStatus {
  state: 'playing' | 'lost' | 'won';
  reason?: string;
}

export interface AppState extends GameState {
  screen: Screen;
  scoreboard: ScoreEntry[];
  settings: SettingsState;
}

export type EventPhase = Phase | StepPhase | 'setup' | StepFrame['phase'];

export interface LogEvent {
  seq: number;
  turn: number;
  phase: EventPhase;
  action: string;
  actorType?: 'cat' | 'mouse' | 'system';
  actorId?: string;
  from?: CellId;
  to?: CellId;
  targetId?: string;
  payload?: Record<string, unknown>;
  description?: string;
}

export interface TutorialAction {
  action: LogEvent['action'];
  actorId?: string;
  targetId?: string;
  from?: CellId;
  to?: CellId;
  phase?: EventPhase;
  count?: number;
}

export interface TutorialStep {
  id: string;
  order: number;
  title: string;
  highlights?: string[];
  text: string;
  instruction?: string;
  showNext?: boolean;
  lockBoard?: boolean;
  completeOn?: TutorialAction | TutorialAction[];
}

export interface TutorialState {
  active: boolean;
  steps: TutorialStep[];
  index: number;
  locked: boolean;
  completedStepIds: Set<string>;
  guardMessage?: string;
}

export type InitialMiceConfig = {
  placements: Array<{
    cell: CellId;
    tier?: number;
  }>;
};

export interface ScoreEntry {
  modeId: ModeId;
  result: 'win' | 'loss';
  score?: number;
  finishWave?: number;
  grainSaved?: number;
  grainLoss: number;
  wave: number;
  catsLost: number;
  catsFullHealth?: number;
  reason?: string;
  timestamp: number;
}

export interface SettingsState {
  muted: boolean;
  musicVolume: number;
}
