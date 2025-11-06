import { catDefinitions, CAT_STARTING_HEARTS } from './cats';
import { columns, parseCell, rows, isShadowBonus } from './board';
import type {
  CatId,
  GameState,
  MouseState,
  CellId,
  StepFrame,
} from '../types';

export function createInitialGameState(): GameState {
  const cells = {} as GameState['cells'];
  for (const column of columns) {
    for (const row of rows) {
      const id = `${column}${row}` as CellId;
      const terrain = row === 1 && (column === 'A' || column === 'D') ? 'shadow' : id === 'B4' || id === 'C4' ? 'gate' : 'interior';
      cells[id] = { id, terrain };
    }
  }

  const cats: GameState['cats'] = {
    pangur: {
      id: 'pangur',
      hearts: CAT_STARTING_HEARTS,
      catchSpent: 0,
      moveUsed: false,
      attackCommitted: false,
      turnEnded: false,
      stunned: false,
    },
    guardian: {
      id: 'guardian',
      hearts: CAT_STARTING_HEARTS,
      catchSpent: 0,
      moveUsed: false,
      attackCommitted: false,
      turnEnded: false,
      stunned: false,
    },
    baircne: {
      id: 'baircne',
      hearts: CAT_STARTING_HEARTS,
      catchSpent: 0,
      moveUsed: false,
      attackCommitted: false,
      turnEnded: false,
      stunned: false,
    },
  };

  const mice: Record<string, MouseState> = {};
  let mouseIdCounter = 0;
  for (const column of columns) {
    for (const row of rows) {
      const id = `${column}${row}` as CellId;
      const isPerimeter = row === 1 || row === 4 || column === 'A' || column === 'D';
      if (!isPerimeter) continue;
      const mouseId = `mouse-${++mouseIdCounter}`;
      const mouse: MouseState = {
        id: mouseId,
        position: id,
        attack: 1,
        hearts: 1,
        stunned: false,
        grainFed: false,
      };
      mice[mouseId] = mouse;
      cells[id].occupant = { type: 'mouse', id: mouseId };
    }
  }

  const incomingQueue: MouseState[] = Array.from({ length: 12 }, (_, index) => ({
    id: `queue-${index + 1}`,
    attack: 1,
    hearts: 1,
    stunned: false,
    grainFed: false,
  }));

  const baseState: GameState = {
    phase: 'setup',
    turn: 1,
    wave: 1,
    grain: 16,
    cells,
    cats,
    mice,
    catOrder: ['pangur', 'baircne', 'guardian'],
    handCats: ['pangur', 'baircne', 'guardian'],
    selectedCatId: undefined,
    incomingQueue,
    deterPreview: { scared: 0, entering: incomingQueue.length, totalMeow: 0 },
    stepper: undefined,
    log: [],
    status: { state: 'playing' },
  };

  applyDeterrence(baseState);
  return baseState;
}

export function applyDeterrence(state: GameState): void {
  state.deterPreview = getDeterrenceSnapshot(state);
}

export function getDeterrenceSnapshot(state: GameState) {
  const totalMeow = state.catOrder.reduce((sum, catId) => sum + getCatEffectiveMeow(state, catId), 0);
  const scared = Math.min(totalMeow, state.incomingQueue.length);
  const entering = Math.max(state.incomingQueue.length - scared, 0);
  return { scared, entering, totalMeow };
}

export function getCatEffectiveCatch(state: GameState, catId: CatId): number {
  const cat = state.cats[catId];
  if (!cat.position) return catDefinitions[catId].baseCatch;
  const base = catDefinitions[catId].baseCatch;
  const bonus = isShadowBonus(cat.position) ? 1 : 0;
  return base + bonus;
}

export function getCatRemainingCatch(state: GameState, catId: CatId): number {
  return Math.max(getCatEffectiveCatch(state, catId) - state.cats[catId].catchSpent, 0);
}

export function getCatEffectiveMeow(state: GameState, catId: CatId): number {
  const cat = state.cats[catId];
  if (!cat.position) return 0;
  const base = catDefinitions[catId].baseMeow;
  const row = parseCell(cat.position).row;
  switch (row) {
    case 4:
      return base * 2;
    case 3:
      return base;
    case 2:
      return Math.floor(base * 0.5);
    case 1:
    default:
      return 0;
  }
}

export function resetCatTurnState(state: GameState): void {
  for (const cat of Object.values(state.cats)) {
    cat.catchSpent = 0;
    cat.moveUsed = false;
    cat.attackCommitted = false;
    cat.turnEnded = false;
  }
}

export function healCat(cat: GameState['cats'][CatId], amount: number): void {
  cat.hearts = Math.min(CAT_STARTING_HEARTS, cat.hearts + amount);
}

export function damageCat(cat: GameState['cats'][CatId], amount: number): void {
  cat.hearts = Math.max(0, cat.hearts - amount);
}

export function damageMouse(mouse: MouseState, amount: number): void {
  mouse.hearts = Math.max(0, mouse.hearts - amount);
}

export function downgradeMouse(mouse: MouseState): void {
  mouse.attack = 1;
  mouse.hearts = 1;
  mouse.grainFed = false;
  mouse.stunned = true;
}

export function upgradeMouse(mouse: MouseState): void {
  mouse.attack = 2;
  mouse.hearts = 2;
  mouse.grainFed = true;
}

export function queueMouseFrames(): StepFrame[] {
  return [];
}
