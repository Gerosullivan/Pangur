import { catDefinitions, CAT_STARTING_HEARTS } from './cats';
import { columns, rows, isShadowBonus, buildInitialCells, isPerimeter, getNeighborCells, getMeowZone } from './board';
import type {
  CatId,
  GameState,
  MouseState,
  CellId,
  StepFrame,
} from '../types';

export type CatStatContext = Pick<GameState, 'cats' | 'cells'>;

export function createInitialGameState(): GameState {
  const cells = buildInitialCells();

  const cats: GameState['cats'] = {
    pangur: {
      id: 'pangur',
      hearts: CAT_STARTING_HEARTS,
      catchSpent: 0,
      moveUsed: false,
      attackCommitted: false,
      turnEnded: false,
      stunned: false,
      specialLeg: 'idle',
      shadowBonusActive: false,
    },
    guardian: {
      id: 'guardian',
      hearts: CAT_STARTING_HEARTS,
      catchSpent: 0,
      moveUsed: false,
      attackCommitted: false,
      turnEnded: false,
      stunned: false,
      specialLeg: 'idle',
      shadowBonusActive: false,
    },
    baircne: {
      id: 'baircne',
      hearts: CAT_STARTING_HEARTS,
      catchSpent: 0,
      moveUsed: false,
      attackCommitted: false,
      turnEnded: false,
      stunned: false,
      specialLeg: 'idle',
      shadowBonusActive: false,
    },
  };

  const mice: Record<string, MouseState> = {};
  let mouseIdCounter = 0;
  for (const column of columns) {
    for (const row of rows) {
      const id = `${column}${row}` as CellId;
      if (!isPerimeter(id)) continue;
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
    nextMouseId: mouseIdCounter + 1,
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

export function getCatEffectiveCatch(state: CatStatContext, catId: CatId): number {
  const cat = state.cats[catId];
  const definition = catDefinitions[catId];
  let total = definition.baseCatch;
  if (!cat.position) return total;
  if (catId === 'baircne') {
    const aura = getBaircneAuraSummary(state);
    total += aura.catchBonus;
  }
  if (cat.shadowBonusActive && isShadowBonus(cat.position)) {
    total += 1;
  }
  return total;
}

export function getCatRemainingCatch(state: CatStatContext, catId: CatId): number {
  return Math.max(getCatEffectiveCatch(state, catId) - state.cats[catId].catchSpent, 0);
}

export function getCatEffectiveMeow(state: CatStatContext, catId: CatId): number {
  const cat = state.cats[catId];
  if (!cat.position) return 0;
  const definition = catDefinitions[catId];
  let base = definition.baseMeow;
  if (catId === 'baircne') {
    const aura = getBaircneAuraSummary(state);
    base += aura.meowBonus;
  }
  const zone = getMeowZone(cat.position);
  if (zone === 'gate') {
    return base * 2;
  }
  if (zone === 'gateRing') {
    return base;
  }
  return 0;
}

export interface BaircneAuraSummary {
  catchBonus: number;
  meowBonus: number;
  catchSource?: CatId;
  meowSource?: CatId;
}

export function getBaircneAuraSummary(state: CatStatContext): BaircneAuraSummary {
  const guardian = state.cats.baircne;
  if (!guardian?.position) {
    return { catchBonus: 0, meowBonus: 0 };
  }
  const neighborCells = new Set(getNeighborCells(guardian.position));
  let hasMeowSource = false;
  let hasPangur = false;
  (Object.keys(state.cats) as CatId[])
    .filter((id) => id !== 'baircne')
    .forEach((catId) => {
      const candidate = state.cats[catId];
      if (!candidate?.position) return;
      if (!neighborCells.has(candidate.position)) return;
      const definition = catDefinitions[catId];
      if (definition.baseMeow > definition.baseCatch) {
        hasMeowSource = true;
      }
      if (catId === 'pangur') {
        hasPangur = true;
      }
    });
  if (hasMeowSource) {
    return { catchBonus: 0, meowBonus: 1 };
  }
  if (hasPangur) {
    return { catchBonus: 1, meowBonus: 0, catchSource: 'pangur' };
  }
  return { catchBonus: 0, meowBonus: 0 };
}

export function resetCatTurnState(state: GameState): void {
  for (const cat of Object.values(state.cats)) {
    cat.catchSpent = 0;
    cat.moveUsed = false;
    cat.attackCommitted = false;
    cat.turnEnded = false;
    cat.specialSequence = undefined;
    cat.specialLeg = 'idle';
    cat.shadowBonusActive = !!(cat.position && isShadowBonus(cat.position));
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
