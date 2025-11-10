import { create } from 'zustand';
import { produce } from 'immer';
import type {
  CatId,
  CellId,
  GameState,
  MouseState,
  StepFrame,
  StepPhase,
  CatState,
  EntryDirection,
  EntryDeterrenceDetail,
  DeterrencePreview,
} from '../types';
import {
  createInitialGameState,
  applyDeterrence,
  getCatRemainingCatch,
  resetCatTurnState,
  healCat,
  damageCat,
  damageMouse,
  downgradeMouse,
  upgradeMouse,
  getDeterrenceSnapshot,
} from '../lib/mechanics';
import { getNeighborCells, pathCellsBetween, isPerimeter, isShadowBonus, getEntryCells } from '../lib/board';

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
  finishPangurSequenceEarly: () => void;
}

export type GameStore = GameState & GameActions;

export const useGameStore = create<GameStore>((set, get) => ({
  ...createInitialGameState(),

  resetGame: () => {
    set((state) => ({ ...state, ...createInitialGameState() }));
  },

  selectCat: (catId) => {
    set(
      produce<GameStore>((draft) => {
        if (catId && draft.phase !== 'cat' && draft.phase !== 'setup') {
          return;
        }
        draft.selectedCatId = catId;
      })
    );
  },

  placeCat: (catId, destination) => {
    const state = get();
    if (state.phase !== 'setup') return;
    const cell = state.cells[destination];
    if (!cell) return;
    const currentCatPosition = state.cats[catId].position;
    if (cell.occupant && !(cell.occupant.type === 'cat' && cell.occupant.id === catId)) return;
    if (currentCatPosition === destination) return;
    if (isPerimeter(destination)) {
      return; // perimeter occupied by mice during setup
    }

    set(
      produce<GameStore>((draft) => {
        const wasInHand = draft.handCats.includes(catId);
        if (wasInHand) {
          draft.handCats = draft.handCats.filter((id) => id !== catId);
        } else if (draft.cats[catId].position) {
          draft.cells[draft.cats[catId].position!].occupant = undefined;
        }
        draft.cats[catId].position = destination;
        draft.cells[destination].occupant = { type: 'cat', id: catId };
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
        draft.selectedCatId = draft.catOrder.find((id) => draft.cats[id].position);
        resetCatTurnState(draft);
        applyDeterrence(draft);
      })
    );
  },

  moveCat: (catId, destination) => {
    const state = get();
    if (state.phase !== 'cat') return;
    if (state.status.state !== 'playing') return;
    const cat = state.cats[catId];
    if (!cat.position) return;
    if (cat.turnEnded) return;
    const isPangur = catId === 'pangur';
    const canUseSpecialMove = isPangur && canPangurUseBonusMove(cat);
    if (cat.moveUsed && !canUseSpecialMove) return;
    const originCell = state.cells[cat.position];
    const destCell = state.cells[destination];
    if (!destCell || destCell.occupant) return;

    const validMove = isPangur
      ? validateQueenMove(cat.position, destination, state)
      : validateKingMove(cat.position, destination);
    if (!validMove) return;

    set(
      produce<GameStore>((draft) => {
        const usingBonusMove = cat.moveUsed && canUseSpecialMove;
        draft.cells[cat.position!].occupant = undefined;
        draft.cats[catId].position = destination;
        draft.cats[catId].moveUsed = true;
        draft.cells[destination].occupant = { type: 'cat', id: catId };
        if (draft.cats[catId].shadowBonusActive && !isShadowBonus(destination)) {
          draft.cats[catId].shadowBonusActive = false;
        }
        if (isPangur) {
          updatePangurAfterMove(draft.cats[catId], usingBonusMove);
        } else if (draft.cats[catId].attackCommitted) {
          draft.cats[catId].turnEnded = true;
        }
        applyDeterrence(draft);
      })
    );
  },

  attackMouse: (catId, mouseId) => {
    const state = get();
    if (state.phase !== 'cat') return;
    if (state.status.state !== 'playing') return;
    const cat = state.cats[catId];
    if (!cat.position) return;
    if (cat.turnEnded) return;
    const remainingCatch = getCatRemainingCatch(state, catId);
    if (remainingCatch <= 0) return;
    const mouse = state.mice[mouseId];
    if (!mouse || !mouse.position) return;
    const neighbors = getNeighborCells(cat.position);
    if (!neighbors.includes(mouse.position)) return;

    set(
      produce<GameStore>((draft) => {
        const draftCat = draft.cats[catId];
        draftCat.catchSpent += 1;
        draftCat.attackCommitted = true;
        if (catId === 'pangur') {
          updatePangurAfterAttack(draft, catId);
        }

        const draftMouse = draft.mice[mouseId];
        damageMouse(draftMouse, 1);
        if (draftMouse.hearts <= 0) {
          draft.cells[mouse.position!].occupant = undefined;
          delete draft.mice[mouseId];
          healCat(draftCat, 1);
        } else if (draftMouse.grainFed) {
          downgradeMouse(draftMouse);
        }

        applyDeterrence(draft);
      })
    );
  },

  endCatPhase: () => {
    const state = get();
    if (state.phase !== 'cat') return;
    if (state.status.state !== 'playing') return;
    const mouseFrames = buildMousePhaseFrames(state);
    const phases: StepPhase[] = [];
    if (mouseFrames.length > 0) {
      phases.push('resident-mice');
    }
    phases.push('incoming-wave');

    const [currentPhase, ...remaining] = phases;
    const frames = currentPhase === 'resident-mice' ? mouseFrames : buildIncomingPhaseFrames(state);
    const label = currentPhase === 'resident-mice' ? 'Resident Mouse Phase' : 'Incoming Wave Phase';

    set(
      produce<GameStore>((draft) => {
        draft.phase = 'stepper';
        draft.stepper = {
          frames,
          index: 0,
          label,
          currentPhase,
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

    const updatedState = applyFrame(state, frame);
    const nextIndex = state.stepper.index + 1;
    set(updatedState);
    if (nextIndex < state.stepper.frames.length) {
      set(
        produce<GameStore>((draft) => {
          if (!draft.stepper) return;
          draft.stepper.index = nextIndex;
        })
      );
      return;
    }

    const transitioned = transitionStepper(get());
    set(transitioned);
  },

  finishPangurSequenceEarly: () => {
    set(
      produce<GameStore>((draft) => {
        if (draft.phase !== 'cat') return;
        const pangur = draft.cats.pangur;
        if (!pangur.specialSequence) return;
        if (pangur.specialLeg === 'complete') return;
        pangur.specialLeg = 'complete';
        pangur.turnEnded = true;
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
        const nextId = placed[(currentIndex + 1) % placed.length];
        draft.selectedCatId = nextId;
      })
    );
  },
}));

function canPangurUseBonusMove(cat: CatState): boolean {
  if (cat.id !== 'pangur') return false;
  if (cat.specialSequence !== 'move-attack-move') return false;
  return cat.specialLeg === 'attack-after-move' || cat.specialLeg === 'second-move';
}

function updatePangurAfterMove(cat: CatState, usedBonusMove: boolean): void {
  if (cat.id !== 'pangur') return;
  if (!cat.specialSequence) {
    cat.specialSequence = 'move-attack-move';
    cat.specialLeg = 'attack-after-move';
    return;
  }
  if (cat.specialSequence === 'move-attack-move') {
    if (usedBonusMove) {
      cat.specialLeg = 'complete';
      cat.turnEnded = true;
    } else if (cat.specialLeg !== 'second-move') {
      cat.specialLeg = 'attack-after-move';
    }
    return;
  }
  if (cat.specialSequence === 'attack-move-attack' && cat.specialLeg === 'move-after-attack') {
    cat.specialLeg = 'final-attack';
  }
}

function updatePangurAfterAttack(state: GameState, catId: CatId): void {
  const cat = state.cats[catId];
  if (cat.id !== 'pangur') return;
  if (!cat.specialSequence) {
    cat.specialSequence = 'attack-move-attack';
    cat.specialLeg = 'move-after-attack';
    return;
  }
  if (cat.specialSequence === 'move-attack-move' && cat.specialLeg === 'attack-after-move') {
    cat.specialLeg = 'second-move';
    return;
  }
  if (cat.specialSequence === 'attack-move-attack' && cat.specialLeg === 'final-attack') {
    const remaining = getCatRemainingCatch(state, catId);
    if (remaining === 0) {
      cat.specialLeg = 'complete';
      cat.turnEnded = true;
    }
  }
}

function validateKingMove(origin: CellId, destination: CellId): boolean {
  const neighbors = getNeighborCells(origin);
  return neighbors.includes(destination);
}

function validateQueenMove(origin: CellId, destination: CellId, state: GameState): boolean {
  const cellsBetween = pathCellsBetween(origin, destination);
  if (cellsBetween.length === 0 && origin !== destination) {
    // For straight moves, pathCellsBetween returns [] when adjacent; check adjacency separately
    const sameColumn = origin[0] === destination[0];
    const sameRow = origin[1] === destination[1];
    const diag = Math.abs(origin.charCodeAt(0) - destination.charCodeAt(0)) === Math.abs(Number(origin[1]) - Number(destination[1]));
    if (!sameColumn && !sameRow && !diag) {
      return false;
    }
  }
  return cellsBetween.every((cellId) => !state.cells[cellId].occupant);
}

function buildMousePhaseFrames(state: GameState): StepFrame[] {
  const frames: StepFrame[] = [];
  const attackingMice = Object.values(state.mice)
    .filter((mouse) => mouse.position && !mouse.stunned)
    .sort((a, b) => a.id.localeCompare(b.id));
  for (const mouse of attackingMice) {
    const targetId = pickMouseTarget(state, mouse);
    if (!targetId) continue;
    for (let i = 0; i < mouse.attack; i++) {
      frames.push({
        id: `${mouse.id}-attack-${i + 1}`,
        phase: 'mouse-attack',
        description: `${mouse.id} attacks ${targetId}`,
        payload: { mouseId: mouse.id, targetId },
      });
    }
  }

  const eaters = Object.values(state.mice)
    .filter((mouse) => mouse.position && !mouse.stunned)
    .sort((a, b) => a.id.localeCompare(b.id));
  if (eaters.length > 0) {
    frames.push({
      id: 'eat-summary',
      phase: 'mouse-eat',
      description: 'Resident mice feed',
      payload: { eaters: eaters.map((m) => m.id) },
    });
  }

  return frames;
}

function buildIncomingPhaseFrames(state: GameState): StepFrame[] {
  const frames: StepFrame[] = [];
  const snapshot = getDeterrenceSnapshot(state);
  const { totalMeow } = snapshot;

  frames.push({
    id: 'incoming-summary',
    phase: 'incoming-summary',
    description: `Deterring ${snapshot.scared} mice (Meow ${totalMeow})`,
    payload: snapshot,
  });

  const orderedEntries = getOrderedEntryDetails(snapshot);
  orderedEntries.forEach((detail) => {
    for (let i = 0; i < detail.deterred; i++) {
      frames.push({
        id: `scare-${detail.cellId}-${i + 1}`,
        phase: 'incoming-scare',
        description: `Mouse flees ${detail.cellId} queue`,
        payload: { entryId: detail.cellId },
      });
    }
  });

  const totalEntering = snapshot.entering;
  const placements = computeIncomingPlacements(state, totalEntering);
  if (placements.length < totalEntering) {
    frames.push({
      id: 'incoming-overrun',
      phase: 'incoming-overrun',
      description: 'Building overwhelmed! Not enough space for incoming mice.',
      payload: { required: totalEntering, available: placements.length },
    });
    frames.push({
      id: 'incoming-finish',
      phase: 'incoming-finish',
      description: 'Incoming wave resolved',
    });
    return frames;
  }

  const placementSources = buildPlacementSources(orderedEntries);
  placements.forEach((cellId, idx) => {
    const entryId = placementSources[idx];
    frames.push({
      id: `place-${cellId}-${idx}`,
      phase: 'incoming-place',
      description: `Place mouse at ${cellId}`,
      payload: { cellId, entryId },
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

function computeIncomingPlacements(state: GameState, entering: number): CellId[] {
  if (entering <= 0) return [];
  const emptyCells = Object.values(state.cells)
    .filter((cell) => !cell.occupant)
    .map((cell) => cell.id)
    .sort((a, b) => {
      const aRow = Number(a[1]);
      const bRow = Number(b[1]);
      if (aRow !== bRow) return bRow - aRow; // row 4 first
      return a.localeCompare(b);
    });
  return emptyCells.slice(0, entering);
}

function getOrderedEntryDetails(snapshot: DeterrencePreview): EntryDeterrenceDetail[] {
  return Object.values(snapshot.perEntry).sort((a, b) => {
    const dirDiff = directionPriority(a.direction) - directionPriority(b.direction);
    if (dirDiff !== 0) return dirDiff;
    return a.cellId.localeCompare(b.cellId);
  });
}

function buildPlacementSources(details: EntryDeterrenceDetail[]): CellId[] {
  const sources: CellId[] = [];
  details.forEach((detail) => {
    for (let i = 0; i < detail.entering; i++) {
      sources.push(detail.cellId);
    }
  });
  return sources;
}

function directionPriority(direction: EntryDirection): number {
  const order: EntryDirection[] = ['north', 'east', 'south', 'west'];
  const index = order.indexOf(direction);
  return index === -1 ? order.length : index;
}

function findFirstQueueWithMice(queues: Partial<Record<CellId, MouseState[]>>): CellId | undefined {
  for (const [cellId, queue] of Object.entries(queues)) {
    if (queue && queue.length > 0) {
      return cellId as CellId;
    }
  }
  return undefined;
}

function getTotalIncomingQueued(queues: Partial<Record<CellId, MouseState[]>>): number {
  return Object.values(queues).reduce((sum, queue) => sum + (queue?.length ?? 0), 0);
}

function refillEntryQueues(state: GameState): void {
  const entries = getEntryCells();
  entries.forEach((entry) => {
    const queue = state.incomingQueues[entry.id] ?? (state.incomingQueues[entry.id] = []);
    while (queue.length < entry.incomingMice) {
      queue.push({
        id: `queue-next-${entry.id}-${Date.now()}-${queue.length}`,
        attack: 1,
        hearts: 1,
        grainFed: false,
        stunned: false,
      });
    }
  });
}

function recomputePreviewEntering(preview: DeterrencePreview): number {
  const entering = Object.values(preview.perEntry).reduce((sum, detail) => sum + detail.entering, 0);
  preview.entering = entering;
  return entering;
}

function pickMouseTarget(state: GameState, mouse: { position?: CellId }): CatId | undefined {
  if (!mouse.position) return undefined;
  const neighborCells = new Set(getNeighborCells(mouse.position));
  const inRange = Object.entries(state.cats)
    .filter(([, cat]) => cat.position && neighborCells.has(cat.position))
    .map(([id, cat]) => ({ id: id as CatId, cat }));
  if (inRange.length === 0) {
    return undefined;
  }

  // Priority 1: cat with base 1/3
  const guardian = inRange.find(({ id }) => id === 'guardian');
  if (guardian) return guardian.id;

  // Priority 2: any cat in row 4, left to right (A->D)
  const row4Cats = inRange
    .filter(({ cat }) => cat.position && cat.position[1] === '4')
    .sort((a, b) => a.cat.position!.localeCompare(b.cat.position!));
  if (row4Cats.length > 0) return row4Cats[0].id;

  // Priority 3: remaining cats by lowest hearts then left->right
  return inRange
    .sort((a, b) => {
      if (a.cat.hearts !== b.cat.hearts) return a.cat.hearts - b.cat.hearts;
      return a.cat.position!.localeCompare(b.cat.position!);
    })[0].id;
}

function applyFrame(state: GameStore, frame: StepFrame): GameStore {
  switch (frame.phase) {
    case 'mouse-attack': {
      const { mouseId, targetId } = frame.payload as { mouseId: string; targetId: CatId };
      return produce(state, (draft) => {
        const mouse = draft.mice[mouseId];
        const cat = draft.cats[targetId];
        if (!mouse || !cat || !cat.position) return;
        damageCat(cat, 1);
        if (cat.hearts <= 0) {
          if (cat.position) {
            draft.cells[cat.position].occupant = undefined;
          }
          cat.position = undefined;
          if (draft.selectedCatId === targetId) {
            draft.selectedCatId = draft.catOrder.find((id) => draft.cats[id].hearts > 0 && draft.cats[id].position);
          }
          const allDown = Object.values(draft.cats).every((candidate) => candidate.hearts <= 0);
          if (allDown) {
            draft.status = { state: 'lost', reason: 'All cats defeated' };
          }
        }
        applyDeterrence(draft);
      });
    }
    case 'mouse-eat': {
      const { eaters } = frame.payload as { eaters: string[] };
      return produce(state, (draft) => {
        const eatingMice = eaters.map((id) => draft.mice[id]).filter(Boolean) as MouseState[];
        for (const mouse of eatingMice) {
          if (!mouse.position) continue;
          const grainCost = mouse.grainFed ? 2 : 1;
          draft.grain = Math.max(draft.grain - grainCost, 0);
          if (!mouse.grainFed) {
            upgradeMouse(mouse);
          }
          mouse.stunned = false;
        }
        if (draft.grain <= 0) {
          draft.log.push('Loss: Grain depleted');
          draft.status = { state: 'lost', reason: 'Grain depleted' };
        }
        applyDeterrence(draft);
      });
    }
    case 'incoming-summary':
      return state;
    case 'incoming-scare': {
      const { entryId } = frame.payload as { entryId: CellId };
      return produce(state, (draft) => {
        const queue = draft.incomingQueues[entryId];
        if (queue?.length) {
          queue.shift();
        }
        if (draft.deterPreview.scared > 0) {
          draft.deterPreview.scared = Math.max(draft.deterPreview.scared - 1, 0);
        }
        const detail = draft.deterPreview.perEntry[entryId];
        if (detail) {
          if (detail.incoming > 0) detail.incoming -= 1;
          if (detail.deterred > 0) detail.deterred -= 1;
          detail.entering = Math.max(detail.incoming - detail.deterred, 0);
        }
        draft.deterPreview.entering = recomputePreviewEntering(draft.deterPreview);
      });
    }
    case 'incoming-overrun': {
      return produce(state, (draft) => {
        draft.log.push('Loss: Building overwhelmed by incoming mice.');
        draft.status = { state: 'lost', reason: 'Building overwhelmed' };
      });
    }
    case 'incoming-place': {
      const { cellId, entryId } = frame.payload as { cellId: CellId; entryId?: CellId };
      return produce(state, (draft) => {
        const sourceId = entryId ?? findFirstQueueWithMice(draft.incomingQueues);
        if (!sourceId) return;
        const queue = draft.incomingQueues[sourceId];
        if (!queue || queue.length === 0) return;
        const enteringMouse = queue.shift()!;
        const newId = `mouse-${draft.nextMouseId++}`;
        draft.mice[newId] = {
          id: newId,
          attack: enteringMouse.attack,
          hearts: enteringMouse.hearts,
          grainFed: enteringMouse.grainFed,
          stunned: false,
          position: cellId,
        };
        draft.cells[cellId].occupant = { type: 'mouse', id: newId };
        const detail = draft.deterPreview.perEntry[sourceId];
        if (detail) {
          if (detail.incoming > 0) detail.incoming -= 1;
          if (detail.entering > 0) detail.entering -= 1;
        }
        draft.deterPreview.entering = Math.max(draft.deterPreview.entering - 1, 0);
      });
    }
    case 'incoming-finish': {
      return produce(state, (draft) => {
        if (draft.status.state === 'playing' && Object.keys(draft.mice).length === 0 && getTotalIncomingQueued(draft.incomingQueues) === 0) {
          draft.status = { state: 'won', reason: 'All mice deterred' };
        }
        if (draft.status.state !== 'playing') {
          return;
        }
        refillEntryQueues(draft);
        draft.wave += 1;
        draft.turn += 1;
        applyDeterrence(draft);
      });
    }
    default:
      return state;
  }
}

function transitionStepper(state: GameStore): GameStore {
  if (!state.stepper) return state;
  if (state.stepper.remaining.length === 0) {
    return finalizeToCatPhase(state);
  }
  const [nextPhase, ...rest] = state.stepper.remaining;
  const frames = getPhaseFrames(state, nextPhase);
  const label = nextPhase === 'resident-mice' ? 'Resident Mouse Phase' : 'Incoming Wave Phase';
  return produce(state, (draft) => {
    if (!draft.stepper) return;
    draft.stepper.frames = frames;
    draft.stepper.index = 0;
    draft.stepper.label = label;
    draft.stepper.currentPhase = nextPhase;
    draft.stepper.remaining = rest;
  });
}

function getPhaseFrames(state: GameState, phase: StepPhase): StepFrame[] {
  if (phase === 'resident-mice') {
    return buildMousePhaseFrames(state);
  }
  return buildIncomingPhaseFrames(state);
}

function finalizeToCatPhase(state: GameStore): GameStore {
  return produce(state, (draft) => {
    draft.phase = 'cat';
    draft.stepper = undefined;
    Object.values(draft.mice).forEach((mouse) => {
      mouse.stunned = false;
    });
    if (draft.status.state === 'playing') {
      resetCatTurnState(draft);
      applyDeterrence(draft);
      const firstCat = draft.catOrder.find((id) => draft.cats[id].position);
      draft.selectedCatId = firstCat;
    } else {
      draft.selectedCatId = undefined;
    }
  });
}
