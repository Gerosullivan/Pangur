import { catDefinitions, CAT_STARTING_HEARTS } from './cats';
import { columns, rows, isShadowBonus, buildInitialCells, getNeighborCells, getMeowZone, getWaveSize, parseCell } from './board';
import { resetShadowBonusForTurn } from './shadowBonus';
import type { CatId, GameState, MouseState, CellId, StepFrame, DeterrencePreview } from '../types';
import initialMice from '../data/initialMice.json';
import { logEvent, resetLogSequence } from './logger';

export type CatStatContext = Pick<GameState, 'cats' | 'cells'>;

type InitialMiceFile = {
  placements: Array<{
    cell: CellId;
    tier?: number;
  }>;
};

export function createInitialGameState(
  initialMiceFile: InitialMiceFile = initialMice as InitialMiceFile,
  options?: { openingOverlay?: boolean }
): GameState {
  const cells = buildInitialCells();

  const cats: GameState['cats'] = {
    pangur: createCatState('pangur'),
    guardian: createCatState('guardian'),
    baircne: createCatState('baircne'),
  };

  const mice: Record<string, MouseState> = {};
  let mouseIdCounter = 0;
  const initialMiceConfig = parseInitialMiceConfig(initialMiceFile);
  const seededMice = initialMiceConfig.map(({ cell, tier }) => ({
    cell,
    tier,
    id: `mouse-${++mouseIdCounter}`,
  }));
  seededMice.forEach(({ cell, tier, id }) => {
    const mouse = createMouse(id, tier, cell);
    mice[id] = mouse;
    cells[cell].occupant = { type: 'mouse', id };
  });

  const incomingQueue = Array.from({ length: getWaveSize() }, (_, index) => createMouse(`queue-${index + 1}`, 1));

  const baseState: GameState = {
    phase: 'setup',
    turn: 1,
    wave: 1,
    grainLoss: 0,
    showOpeningOverlay: options?.openingOverlay ?? true,
    nextMouseId: mouseIdCounter + 1,
    cells,
    cats,
    mice,
    catOrder: ['pangur', 'baircne', 'guardian'],
    handCats: ['pangur', 'baircne', 'guardian'],
    selectedCatId: undefined,
    incomingQueue,
    deterPreview: { meowge: 0, deterred: 0, entering: incomingQueue.length },
    stepper: undefined,
    log: [],
    status: { state: 'playing' },
  };

  resetLogSequence();
  logEvent(baseState, {
    action: 'init-state',
    actorType: 'system',
    payload: {
      catOrder: baseState.catOrder,
      initialMice: seededMice.map(({ cell, tier, id }) => ({ cell, tier, id })),
      incomingQueueSize: incomingQueue.length,
    },
  });
  seededMice.forEach(({ cell, tier, id }) => {
    logEvent(baseState, {
      action: 'mouse-spawn',
      actorType: 'mouse',
      actorId: id,
      to: cell,
      payload: { tier },
    });
  });

  applyDeterrence(baseState);
  return baseState;
}

function parseInitialMiceConfig(config: InitialMiceFile): Array<{ cell: CellId; tier: number }> {
  const placements = config?.placements ?? [];
  const seen = new Set<CellId>();
  return placements.map((entry, idx) => {
    const cell = entry.cell;
    const tier = entry.tier && entry.tier > 0 ? entry.tier : 1;
    validateCell(cell, idx);
    if (seen.has(cell)) {
      throw new Error(`Initial mice config has duplicate cell ${cell}`);
    }
    seen.add(cell);
    return { cell, tier };
  });
}

function validateCell(cell: CellId, index: number): void {
  const { column, row } = parseCell(cell);
  if (!columns.includes(column) || !rows.includes(row)) {
    throw new Error(`Initial mice config row ${index} references invalid cell ${cell}`);
  }
}

export function applyDeterrence(state: GameState): void {
  state.deterPreview = getDeterrenceSnapshot(state);
}

export function getDeterrenceSnapshot(state: GameState): DeterrencePreview {
  const meowge = state.catOrder.reduce((sum, catId) => sum + getCatDeterrenceMeow(state, catId), 0);
  const queued = state.incomingQueue.length;
  const deterred = Math.min(meowge, queued);
  const entering = Math.max(queued - deterred, 0);
  return { meowge, deterred, entering };
}

export function getCatEffectiveCatch(state: CatStatContext, catId: CatId): number {
  const cat = state.cats[catId];
  const definition = catDefinitions[catId];
  let total = definition.baseCatch;
  if (!cat.position) return total;
  if (catId === 'baircne' && isBaircneShielded(state)) {
    total += 1;
  }
  if (cat.shadowBonusActive) {
    total += 1;
  } else if (cat.shadowBonusPrimed && cat.position && isShadowBonus(cat.position)) {
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
  return catDefinitions[catId].baseMeow;
}

export function getCatDeterrenceMeow(state: CatStatContext, catId: CatId): number {
  const cat = state.cats[catId];
  if (!cat.position) return 0;
  const zone = getMeowZone(cat.position);
  if (zone !== 'gate') return 0;
  return catDefinitions[catId].baseMeow;
}

export function isBaircneShielded(state: CatStatContext): boolean {
  const baircne = state.cats.baircne;
  const pangur = state.cats.pangur;
  if (!baircne?.position || !pangur?.position) return false;
  const neighbors = new Set(getNeighborCells(baircne.position));
  return neighbors.has(pangur.position);
}

export function resetCatTurnState(state: GameState): void {
  for (const cat of Object.values(state.cats)) {
    cat.catchSpent = 0;
    cat.movesRemaining = cat.id === 'pangur' ? 2 : 1;
    cat.attackCommitted = false;
    cat.turnEnded = false;
    cat.wokenByAttack = false;
    resetShadowBonusForTurn(cat);
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

export function upgradeMouse(mouse: MouseState): void {
  mouse.tier += 1;
  mouse.attack = mouse.tier;
  mouse.maxHearts = mouse.tier;
  mouse.hearts = mouse.maxHearts;
  mouse.stunned = false;
}

export function resetMouseAfterTurn(mouse: MouseState): void {
  mouse.stunned = false;
  mouse.hearts = mouse.maxHearts;
}

export function createMouse(id: string, tier: number, position?: CellId): MouseState {
  return {
    id,
    position,
    tier,
    attack: tier,
    hearts: tier,
    maxHearts: tier,
    stunned: false,
  };
}

function createCatState(catId: CatId) {
  return {
    id: catId,
    hearts: CAT_STARTING_HEARTS,
    catchSpent: 0,
    movesRemaining: catId === 'pangur' ? 2 : 1,
    attackCommitted: false,
    turnEnded: false,
    shadowBonusPrimed: false,
    shadowBonusActive: false,
    wokenByAttack: false,
  };
}
