import { catDefinitions, CAT_STARTING_HEARTS } from './cats';
import { columns, rows, isShadowBonus, buildInitialCells, isPerimeter, getNeighborCells, getMeowZone } from './board';
import type { CatId, GameState, MouseState, CellId, StepFrame, DeterrencePreview } from '../types';

export type CatStatContext = Pick<GameState, 'cats' | 'cells'>;

export function createInitialGameState(): GameState {
  const cells = buildInitialCells();

  const cats: GameState['cats'] = {
    pangur: createCatState('pangur'),
    guardian: createCatState('guardian'),
    baircne: createCatState('baircne'),
  };

  const mice: Record<string, MouseState> = {};
  let mouseIdCounter = 0;
  for (const column of columns) {
    for (const row of rows) {
      const id = `${column}${row}` as CellId;
      if (!isPerimeter(id)) continue;
      const mouseId = `mouse-${++mouseIdCounter}`;
      const mouse = createMouse(mouseId, 1, id);
      mice[mouseId] = mouse;
      cells[id].occupant = { type: 'mouse', id: mouseId };
    }
  }

  const incomingQueue = Array.from({ length: 6 }, (_, index) => createMouse(`queue-${index + 1}`, 1));

  const baseState: GameState = {
    phase: 'setup',
    turn: 1,
    wave: 1,
    grainLoss: 0,
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

  applyDeterrence(baseState);
  return baseState;
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
  if (cat.shadowBonusPrimed && cat.position && isShadowBonus(cat.position)) {
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
    cat.shadowBonusPrimed = !!(cat.position && isShadowBonus(cat.position));
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
  };
}
