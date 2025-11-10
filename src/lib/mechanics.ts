import { catDefinitions, CAT_STARTING_HEARTS } from './cats';
import {
  columns,
  rows,
  isShadowBonus,
  buildInitialCells,
  isPerimeter,
  getNeighborCells,
  getMeowZone,
  getEntryCells,
  getNearestEntryCells,
} from './board';
import type { CatId, GameState, MouseState, CellId, StepFrame, DeterrencePreview } from '../types';

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

  const incomingQueues: GameState['incomingQueues'] = {};
  const entryCells = getEntryCells();
  for (const entry of entryCells) {
    incomingQueues[entry.id] = Array.from({ length: entry.incomingMice }, (_, index) => ({
      id: `queue-${entry.id}-${index + 1}`,
      attack: 1,
      hearts: 1,
      stunned: false,
      grainFed: false,
    }));
  }

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
    incomingQueues,
    deterPreview: { scared: 0, entering: 0, totalMeow: 0, perEntry: {} },
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

export function getDeterrenceSnapshot(state: GameState): DeterrencePreview {
  const entryCells = getEntryCells();
  const perEntry: DeterrencePreview['perEntry'] = {};
  entryCells.forEach((entry) => {
    const queueLength = state.incomingQueues[entry.id]?.length ?? 0;
    perEntry[entry.id] = {
      cellId: entry.id,
      direction: entry.direction,
      incoming: queueLength,
      deterred: 0,
      entering: queueLength,
      meow: 0,
    };
  });

  const catMeowValues = state.catOrder.map((catId) => ({
    catId,
    meow: getCatEffectiveMeow(state, catId),
  }));
  const totalMeow = catMeowValues.reduce((sum, item) => sum + item.meow, 0);

  if (entryCells.length === 0) {
    return { scared: 0, entering: 0, totalMeow, perEntry };
  }

  const buckets: Partial<Record<CellId, number>> = {};
  entryCells.forEach((entry) => {
    buckets[entry.id] = 0;
  });

  catMeowValues.forEach(({ catId, meow }) => {
    if (meow <= 0) return;
    const cat = state.cats[catId];
    if (!cat.position) return;
    const nearestEntries = getNearestEntryCells(cat.position);
    if (nearestEntries.length === 0) return;
    const sortedEntries = [...nearestEntries].sort();
    const share = Math.floor(meow / sortedEntries.length);
    let remainder = meow % sortedEntries.length;
    sortedEntries.forEach((entryId) => {
      const allocation = share + (remainder > 0 ? 1 : 0);
      remainder = Math.max(remainder - 1, 0);
      buckets[entryId] = (buckets[entryId] ?? 0) + allocation;
    });
  });

  Object.entries(buckets).forEach(([entryId, meow]) => {
    const detail = perEntry[entryId as CellId];
    if (!detail) return;
    detail.meow = meow;
    detail.deterred = Math.min(meow, detail.incoming);
    detail.entering = Math.max(detail.incoming - detail.deterred, 0);
  });

  const scared = Object.values(perEntry).reduce((sum, detail) => sum + detail.deterred, 0);
  const entering = Object.values(perEntry).reduce((sum, detail) => sum + detail.entering, 0);

  return { scared, entering, totalMeow, perEntry };
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
