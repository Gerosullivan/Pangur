import { create } from 'zustand';
import { produce } from 'immer';
import type { CatId, CellId, CatState, GameState, MouseState, StepFrame, StepPhase } from '../types';
import {
  applyDeterrence,
  createInitialGameState,
  createMouse,
  damageCat,
  damageMouse,
  getCatEffectiveCatch,
  getCatEffectiveMeow,
  getCatRemainingCatch,
  getDeterrenceSnapshot,
  healCat,
  resetCatTurnState,
  resetMouseAfterTurn,
  upgradeMouse,
} from '../lib/mechanics';
import {
  columns,
  getEntryCells,
  getNeighborCells,
  isGate,
  isPerimeter,
  isShadowBonus,
  pathCellsBetween,
  rows,
  terrainForCell,
} from '../lib/board';

const MAX_WAVE_SIZE = 6;
const MAX_GRAIN_LOSS = 32;

interface GameActions {
  resetGame: () => void;
  selectCat: (catId?: CatId) => void;
  placeCat: (catId: CatId, destination: CellId) => void;
  confirmFormation: () => void;
  moveCat: (catId: CatId, destination: CellId) => void;
  attackMouse: (catId: CatId, mouseId: string) => void;
  endCatPhase: () => void;
  advanceStepper: () => void;
  focusNextCat: () => void;
}

export type GameStore = GameState & GameActions;

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialGameState(),

  resetGame: () => {
    set(() => ({ ...createInitialGameState() }));
  },

  selectCat: (catId) => {
    set(
      produce<GameStore>((draft) => {
        if (!catId) {
          draft.selectedCatId = undefined;
          return;
        }
        if (draft.phase !== 'cat' && draft.phase !== 'setup') return;
        draft.selectedCatId = catId;
      })
    );
  },

  placeCat: (catId, destination) => {
    const state = get();
    if (state.phase !== 'setup') return;
    const cell = state.cells[destination];
    if (!cell || isPerimeter(destination) || cell.terrain === 'gate') return;

    set(
      produce<GameStore>((draft) => {
        const currentPos = draft.cats[catId].position;
        if (currentPos) {
          draft.cells[currentPos].occupant = undefined;
        }
        if (cell.occupant?.type === 'cat' && cell.occupant.id !== catId) {
          draft.cats[cell.occupant.id].position = undefined;
          draft.handCats.push(cell.occupant.id);
        }
        draft.cats[catId].position = destination;
        draft.cells[destination].occupant = { type: 'cat', id: catId };
        draft.handCats = draft.handCats.filter((id) => id !== catId);
        draft.selectedCatId = catId;
        applyDeterrence(draft);
      })
    );
  },

  confirmFormation: () => {
    const state = get();
    if (state.phase !== 'setup') return;
    if (state.handCats.length > 0) return;
    set(
      produce<GameStore>((draft) => {
        draft.phase = 'cat';
        resetCatTurnState(draft);
        draft.selectedCatId = draft.catOrder.find((id) => draft.cats[id].position);
        applyDeterrence(draft);
      })
    );
  },

  moveCat: (catId, destination) => {
    const state = get();
    if (state.phase !== 'cat' || state.status.state !== 'playing') return;
    const cat = state.cats[catId];
    if (!cat.position || cat.turnEnded) return;
    if (cat.movesRemaining <= 0) return;
    const destCell = state.cells[destination];
    if (!destCell || destCell.occupant) return;
    if (!validateQueenMove(cat.position, destination, state)) return;

    set(
      produce<GameStore>((draft) => {
        const movingCat = draft.cats[catId];
        draft.cells[movingCat.position!].occupant = undefined;
        movingCat.position = destination;
        movingCat.movesRemaining = Math.max(0, movingCat.movesRemaining - 1);
        if (movingCat.shadowBonusActive && !isShadowBonus(destination)) {
          movingCat.shadowBonusActive = false;
        }
        draft.cells[destination].occupant = { type: 'cat', id: catId };
        maybeFinalizeCatTurn(draft, catId);
        applyDeterrence(draft);
      })
    );
  },

  attackMouse: (catId, mouseId) => {
    const state = get();
    if (state.phase !== 'cat' || state.status.state !== 'playing') return;
    const cat = state.cats[catId];
    if (!cat.position || cat.turnEnded) return;
    const mouse = state.mice[mouseId];
    if (!mouse?.position) return;
    const adjacentCells = new Set(getNeighborCells(cat.position));
    if (!adjacentCells.has(mouse.position)) return;
    if (getCatRemainingCatch(state, catId) <= 0) return;

    set(
      produce<GameStore>((draft) => {
        const draftCat = draft.cats[catId];
        const draftMouse = draft.mice[mouseId];
        if (!draftMouse?.position) return;
        draftCat.catchSpent += 1;
        draftCat.attackCommitted = true;
        if (draftCat.shadowBonusActive) {
          draftCat.shadowBonusActive = false;
        }
        damageMouse(draftMouse, 1);
        if (draftMouse.hearts <= 0) {
          draft.cells[draftMouse.position].occupant = undefined;
          delete draft.mice[mouseId];
          healCat(draftCat, 1);
        } else {
          draftMouse.stunned = true;
          const retaliation = Math.max(draftMouse.attack - getCatEffectiveMeow(draft, catId), 0);
          if (retaliation > 0) {
            damageCat(draftCat, retaliation);
            handleCatDefeat(draft, catId);
          }
        }
        maybeFinalizeCatTurn(draft, catId);
        applyDeterrence(draft);
      })
    );
  },

  endCatPhase: () => {
    const state = get();
    if (state.phase !== 'cat' || state.status.state !== 'playing') return;
    const mouseFrames = buildMousePhaseFrames(state);
    const frames: StepPhase[] = mouseFrames.length > 0 ? ['resident-mice', 'incoming-wave'] : ['incoming-wave'];
    const [current, ...remaining] = frames;
    const currentFrames = current === 'resident-mice' ? mouseFrames : buildIncomingPhaseFrames(state);
    set(
      produce<GameStore>((draft) => {
        draft.phase = 'stepper';
        draft.stepper = {
          frames: currentFrames,
          index: 0,
          label: current === 'resident-mice' ? 'Resident Mouse Phase' : 'Incoming Wave Phase',
          currentPhase: current,
          remaining,
        };
      })
    );
  },

  advanceStepper: () => {
    const state = get();
    if (state.phase !== 'stepper' || !state.stepper) return;
    if (state.stepper.index >= state.stepper.frames.length) return;
    const frame = state.stepper.frames[state.stepper.index];
    const advanced = applyFrame(state, frame);
    set(advanced);
    const nextIndex = state.stepper.index + 1;
    if (!advanced.stepper || nextIndex >= state.stepper.frames.length) {
      set(transitionStepper(get()));
      return;
    }
    set(
      produce<GameStore>((draft) => {
        if (!draft.stepper) return;
        draft.stepper.index = nextIndex;
      })
    );
  },

  focusNextCat: () => {
    set(
      produce<GameStore>((draft) => {
        if (draft.phase !== 'cat') return;
        const placed = draft.catOrder.filter((id) => draft.cats[id].position);
        if (placed.length === 0) {
          draft.selectedCatId = undefined;
          return;
        }
        const currentIndex = draft.selectedCatId ? placed.indexOf(draft.selectedCatId) : -1;
        const nextIdx = (currentIndex + 1) % placed.length;
        draft.selectedCatId = placed[nextIdx];
      })
    );
  },
}));

function validateQueenMove(origin: CellId, destination: CellId, state: GameState): boolean {
  if (origin === destination) return false;
  const path = pathCellsBetween(origin, destination);
  const sameColumn = origin[0] === destination[0];
  const sameRow = origin[1] === destination[1];
  const diag = Math.abs(origin.charCodeAt(0) - destination.charCodeAt(0)) === Math.abs(Number(origin[1]) - Number(destination[1]));
  if (!sameColumn && !sameRow && !diag) {
    return false;
  }
  return path.every((cellId) => !state.cells[cellId].occupant);
}

function maybeFinalizeCatTurn(state: GameState, catId: CatId): void {
  const cat = state.cats[catId];
  if (!cat.position) return;
  const remainingCatch = getCatRemainingCatch(state, catId);
  if (cat.movesRemaining <= 0 && remainingCatch <= 0) {
    cat.turnEnded = true;
  }
}

function buildMousePhaseFrames(state: GameState): StepFrame[] {
  const frames: StepFrame[] = [];
  const occupancy = new Map<CellId, { type: 'cat' | 'mouse'; id: string }>();
  Object.values(state.cats).forEach((cat) => {
    if (cat.position && cat.hearts > 0) {
      occupancy.set(cat.position, { type: 'cat', id: cat.id });
    }
  });
  Object.values(state.mice).forEach((mouse) => {
    if (mouse.position) {
      occupancy.set(mouse.position, { type: 'mouse', id: mouse.id });
    }
  });

  const orderedMice = sortMiceForPhase(state);
  const plannedPositions = new Map<string, CellId | undefined>();
  orderedMice.forEach((mouse) => plannedPositions.set(mouse.id, mouse.position));

  for (const mouse of orderedMice) {
    if (!mouse.position || mouse.hearts <= 0 || mouse.stunned) continue;
    const plannedPosition = plannedPositions.get(mouse.id) ?? mouse.position;
    const movePlan = findMovePlan(state, mouse, plannedPosition, occupancy);
    const hasShadowMove = movePlan && isShadowBonus(movePlan.destination);
    const adjacentCats = getAdjacentCats(state, plannedPosition);
    if (!isShadowBonus(plannedPosition) && hasShadowMove) {
      frames.push({
        id: `${mouse.id}-move`,
        phase: 'mouse-move',
        description: `${mouse.id} moves to ${movePlan!.destination}`,
        payload: { mouseId: mouse.id, from: plannedPosition, to: movePlan!.destination },
      });
      occupancy.delete(plannedPosition);
      occupancy.set(movePlan!.destination, { type: 'mouse', id: mouse.id });
      plannedPositions.set(mouse.id, movePlan!.destination);
      continue;
    }
    if (adjacentCats.length > 0) {
      const targetId = pickMouseTarget(state, plannedPosition);
      if (targetId) {
        for (let i = 0; i < mouse.attack; i += 1) {
          frames.push({
            id: `${mouse.id}-attack-${i + 1}`,
            phase: 'mouse-attack',
            description: `${mouse.id} attacks ${targetId}`,
            payload: { mouseId: mouse.id, targetId },
          });
        }
      }
      continue;
    }
    if (movePlan) {
      frames.push({
        id: `${mouse.id}-move`,
        phase: 'mouse-move',
        description: `${mouse.id} moves to ${movePlan.destination}`,
        payload: { mouseId: mouse.id, from: plannedPosition, to: movePlan.destination },
      });
      occupancy.delete(plannedPosition);
      occupancy.set(movePlan.destination, { type: 'mouse', id: mouse.id });
      plannedPositions.set(mouse.id, movePlan.destination);
    }
  }

  const feedingMice = orderedMice
    .filter((mouse) => {
      const pos = plannedPositions.get(mouse.id);
      return pos && mouse.hearts > 0 && !mouse.stunned;
    })
    .map((mouse) => ({ id: mouse.id }));
  if (feedingMice.length > 0) {
    frames.push({
      id: 'mouse-feed',
      phase: 'mouse-feed',
      description: 'Resident mice feed',
      payload: { eaters: feedingMice.map((m) => m.id) },
    });
  }

  return frames;
}

function buildIncomingPhaseFrames(state: GameState): StepFrame[] {
  const frames: StepFrame[] = [];
  const snapshot = getDeterrenceSnapshot(state);
  frames.push({
    id: 'incoming-summary',
    phase: 'incoming-summary',
    description: `Meowge ${snapshot.meowge} · ${snapshot.deterred} flee`,
    payload: snapshot,
  });
  if (snapshot.deterred > 0) {
    frames.push({
      id: 'incoming-scare',
      phase: 'incoming-scare',
      description: `${snapshot.deterred} mice flee the queue`,
      payload: { amount: snapshot.deterred },
    });
  }
  const placements = planIncomingPlacements(state, snapshot.entering);
  placements.forEach((placement, index) => {
    frames.push({
      id: `incoming-place-${index}`,
      phase: 'incoming-place',
      description: `Mouse enters at ${placement.cellId}`,
      payload: placement,
    });
  });
  frames.push({
    id: 'incoming-finish',
    phase: 'incoming-finish',
    description: 'Incoming wave resolved',
    payload: snapshot,
  });
  return frames;
}

function applyFrame(state: GameStore, frame: StepFrame): GameStore {
  switch (frame.phase) {
    case 'mouse-move': {
      const { mouseId, from, to } = frame.payload as { mouseId: string; from: CellId; to: CellId };
      return produce(state, (draft) => {
        const mouse = draft.mice[mouseId];
        if (!mouse || mouse.hearts <= 0) return;
        if (mouse.position !== from) return;
        if (draft.cells[to].occupant) return;
        draft.cells[from].occupant = undefined;
        draft.cells[to].occupant = { type: 'mouse', id: mouseId };
        mouse.position = to;
      });
    }
    case 'mouse-attack': {
      const { mouseId, targetId } = frame.payload as { mouseId: string; targetId: CatId };
      return produce(state, (draft) => {
        const mouse = draft.mice[mouseId];
        const cat = draft.cats[targetId];
        if (!mouse?.position || !cat?.position) return;
        damageCat(cat, 1);
        if (cat.hearts <= 0) {
          draft.cells[cat.position].occupant = undefined;
          cat.position = undefined;
          handleCatDefeat(draft, targetId);
        }
      });
    }
    case 'mouse-feed': {
      const { eaters } = frame.payload as { eaters: string[] };
      return produce(state, (draft) => {
        eaters.forEach((mouseId) => {
          const mouse = draft.mice[mouseId];
          if (!mouse?.position || mouse.hearts <= 0 || mouse.stunned) return;
          draft.grainLoss += mouse.tier;
          if (draft.grainLoss >= MAX_GRAIN_LOSS && draft.status.state === 'playing') {
            draft.status = { state: 'lost', reason: 'Grain depleted' };
          }
          if (isShadowBonus(mouse.position)) {
            upgradeMouse(mouse);
            if (mouse.tier >= 7 && draft.status.state === 'playing') {
              draft.status = { state: 'lost', reason: 'Mouse evolved beyond control' };
            }
          }
        });
        applyDeterrence(draft);
      });
    }
    case 'incoming-summary':
      return state;
    case 'incoming-scare': {
      const { amount } = frame.payload as { amount: number };
      return produce(state, (draft) => {
        draft.incomingQueue.splice(0, amount);
        applyDeterrence(draft);
      });
    }
    case 'incoming-place': {
      const { cellId } = frame.payload as { cellId: CellId; gateId: CellId };
      return produce(state, (draft) => {
        if (!draft.cells[cellId] || draft.cells[cellId].occupant) return;
        const entering = draft.incomingQueue.shift();
        if (!entering) return;
        const newId = `mouse-${draft.nextMouseId++}`;
        draft.mice[newId] = {
          ...createMouse(newId, entering.tier, cellId),
        };
        draft.cells[cellId].occupant = { type: 'mouse', id: newId };
        applyDeterrence(draft);
      });
    }
    case 'incoming-finish': {
      return produce(state, (draft) => {
        draft.wave += 1;
        draft.turn += 1;
        if (draft.status.state === 'playing' && draft.incomingQueue.length === 0 && Object.keys(draft.mice).length === 0) {
          draft.status = { state: 'won', reason: 'All mice deterred' };
        }
        if (draft.status.state === 'playing') {
          while (draft.incomingQueue.length < MAX_WAVE_SIZE) {
            const queuedId = `queue-${Date.now()}-${draft.incomingQueue.length}`;
            draft.incomingQueue.push(createMouse(queuedId, 1));
          }
        }
        applyDeterrence(draft);
      });
    }
    default:
      return state;
  }
}

function transitionStepper(state: GameStore): GameStore {
  if (!state.stepper) return state;
  if (state.stepper.index < state.stepper.frames.length - 1) {
    return state;
  }
  if (state.stepper.remaining.length === 0) {
    return finalizeToCatPhase(state);
  }
  const [nextPhase, ...remaining] = state.stepper.remaining;
  const frames = nextPhase === 'resident-mice' ? buildMousePhaseFrames(state) : buildIncomingPhaseFrames(state);
  return produce(state, (draft) => {
    if (!draft.stepper) return;
    draft.stepper.frames = frames;
    draft.stepper.index = 0;
    draft.stepper.label = nextPhase === 'resident-mice' ? 'Resident Mouse Phase' : 'Incoming Wave Phase';
    draft.stepper.currentPhase = nextPhase;
    draft.stepper.remaining = remaining;
  });
}

function finalizeToCatPhase(state: GameStore): GameStore {
  return produce(state, (draft) => {
    draft.phase = 'cat';
    draft.stepper = undefined;
    Object.values(draft.mice).forEach((mouse) => resetMouseAfterTurn(mouse));
    if (draft.status.state === 'playing') {
      resetCatTurnState(draft);
      applyDeterrence(draft);
      draft.selectedCatId = draft.catOrder.find((id) => draft.cats[id].position);
    } else {
      draft.selectedCatId = undefined;
    }
  });
}

function handleCatDefeat(state: GameState, catId: CatId): void {
  const cat = state.cats[catId];
  if (cat && cat.hearts <= 0 && state.status.state === 'playing') {
    state.status = { state: 'lost', reason: 'Cat defeated' };
  }
}

function sortMiceForPhase(state: GameState): MouseState[] {
  return Object.values(state.mice)
    .filter((mouse) => mouse.position)
    .sort((a, b) => {
      const posA = a.position!;
      const posB = b.position!;
      const rowA = Number(posA[1]);
      const rowB = Number(posB[1]);
      if (rowA !== rowB) return rowB - rowA;
      return posA.localeCompare(posB);
    });
}

function findMovePlan(
  state: GameState,
  mouse: MouseState,
  origin: CellId,
  occupancy: Map<CellId, { type: 'cat' | 'mouse'; id: string }>
): { destination: CellId } | undefined {
  const maxSteps = mouse.attack;
  const visited = new Map<CellId, CellId | null>();
  const queue: { cell: CellId; steps: number }[] = [{ cell: origin, steps: 0 }];
  visited.set(origin, null);
  const candidates: { cell: CellId; steps: number }[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.steps >= maxSteps) continue;
    for (const neighbor of getOrthNeighbors(current.cell)) {
      if (visited.has(neighbor)) continue;
      if (occupancy.has(neighbor)) continue;
      visited.set(neighbor, current.cell);
      const steps = current.steps + 1;
      candidates.push({ cell: neighbor, steps });
      queue.push({ cell: neighbor, steps });
    }
  }

  if (candidates.length === 0) return undefined;
  const shadowCandidates = candidates.filter((candidate) => isShadowBonus(candidate.cell));
  const selectionPool = shadowCandidates.length > 0 ? shadowCandidates : candidates;
  selectionPool.sort((a, b) => {
    if (isShadowBonus(a.cell) && !isShadowBonus(b.cell)) return -1;
    if (!isShadowBonus(a.cell) && isShadowBonus(b.cell)) return 1;
    if (a.steps !== b.steps) return a.steps - b.steps;
    return distanceToPerimeter(a.cell) - distanceToPerimeter(b.cell);
  });
  return { destination: selectionPool[0].cell };
}

function getOrthNeighbors(cellId: CellId): CellId[] {
  const neighbors: CellId[] = [];
  const column = cellId[0] as (typeof columns)[number];
  const row = Number(cellId.slice(1));
  const colIndex = columns.indexOf(column);
  const deltas: [number, number][] = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];
  deltas.forEach(([dc, dr]) => {
    const targetColumn = columns[colIndex + dc];
    const targetRow = row + dr;
    if (!targetColumn) return;
    if (targetRow < rows[0] || targetRow > rows[rows.length - 1]) return;
    neighbors.push(`${targetColumn}${targetRow}` as CellId);
  });
  return neighbors;
}

function distanceToPerimeter(cellId: CellId): number {
  const row = Number(cellId.slice(1));
  const column = cellId[0] as (typeof columns)[number];
  const toRow = Math.min(Math.abs(row - rows[0]), Math.abs(row - rows[rows.length - 1]));
  const columnIndex = columns.indexOf(column);
  const toColumn = Math.min(columnIndex, columns.length - 1 - columnIndex);
  return toRow + toColumn;
}

function getAdjacentCats(state: GameState, cellId: CellId): CatId[] {
  const neighbors = new Set(getNeighborCells(cellId));
  return Object.entries(state.cats)
    .filter(([, cat]) => cat.position && neighbors.has(cat.position))
    .map(([id]) => id as CatId);
}

function pickMouseTarget(state: GameState, position: CellId): CatId | undefined {
  const neighbors = new Set(getNeighborCells(position));
  const candidates = Object.entries(state.cats)
    .filter(([, cat]) => cat.position && neighbors.has(cat.position!) && cat.hearts > 0)
    .map(([id, cat]) => ({ id: id as CatId, cat }));
  if (candidates.length === 0) return undefined;
  const guardian = candidates.find(({ id }) => id === 'guardian');
  if (guardian) return guardian.id;
  const frontCats = candidates
    .filter(({ cat }) => cat.position && (cat.position[1] === '5' || cat.position[1] === '4'))
    .sort((a, b) => a.cat.position!.localeCompare(b.cat.position!));
  if (frontCats.length > 0) return frontCats[0].id;
  return candidates.sort((a, b) => {
    if (a.cat.hearts !== b.cat.hearts) return a.cat.hearts - b.cat.hearts;
    return a.cat.position!.localeCompare(b.cat.position!);
  })[0].id;
}

function planIncomingPlacements(state: GameState, entering: number): Array<{ cellId: CellId; gateId: CellId }> {
  if (entering <= 0) return [];
  const placements: Array<{ cellId: CellId; gateId: CellId }> = [];
  const entries = getEntryCells().sort((a, b) => a.id.localeCompare(b.id));
  const occupancy = new Set(
    Object.values(state.cells)
      .filter((cell) => cell.occupant)
      .map((cell) => cell.id)
  );

  let remaining = entering;
  entries.forEach((entry) => {
    if (remaining <= 0) return;
    if (state.cells[entry.id].occupant?.type === 'cat') return;
    const path = [entry.id, ...getLineTowardShadow(entry.id)];
    for (const cellId of path) {
      if (remaining <= 0) break;
      if (occupancy.has(cellId)) continue;
      placements.push({ cellId, gateId: entry.id });
      occupancy.add(cellId);
      remaining -= 1;
    }
  });
  return placements;
}

function getLineTowardShadow(gateId: CellId): CellId[] {
  const line: CellId[] = [];
  const [column, rowStr] = [gateId[0], gateId[1]];
  const row = Number(rowStr);
  const targets = [
    `${columns[0]}${row}` as CellId,
    `${columns[columns.length - 1]}${row}` as CellId,
    `${column}1` as CellId,
  ];
  const preferred = targets.find((cell) => terrainForCell(cell) === 'shadow');
  if (!preferred) return line;
  const path = pathCellsBetween(gateId, preferred);
  path.push(preferred);
  return path;
}
