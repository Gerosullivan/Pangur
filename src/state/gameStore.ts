import { create } from 'zustand';
import { produce } from 'immer';
import type {
  AppState,
  CatId,
  CellId,
  CatState,
  GameState,
  ModeId,
  ScoreEntry,
  Screen,
  SettingsState,
  StepFrame,
  StepPhase,
} from '../types';
import { getModeConfig } from '../data/modes';
import {
  applyDeterrence,
  createInitialGameState,
  createMouse,
  damageCat,
  damageMouse,
  getCatEffectiveCatch,
  getCatEffectiveMeow,
  getCatRemainingCatch,
  healCat,
  resetCatTurnState,
  resetMouseAfterTurn,
  upgradeMouse,
} from '../lib/mechanics';
import { getNeighborCells, isShadowBonus, pathCellsBetween } from '../lib/board';
import { maybeActivateShadowBonus, updateShadowBonusOnMove } from '../lib/shadowBonus';
import { buildMousePhaseFrames } from '../lib/mousePhase';
import { buildIncomingPhaseFrames, replenishIncomingQueue } from '../lib/incomingWave';
import { logEvent } from '../lib/logger';
import { computeScore } from '../lib/scoring';
import { useTutorialStore } from './tutorialStore';

const SCOREBOARD_STORAGE_KEY = 'pangur-scoreboard';
const SETTINGS_STORAGE_KEY = 'pangur-settings';
const DEFAULT_SETTINGS: SettingsState = { muted: false, musicVolume: 0.5 };
const DEFAULT_MODE: ModeId = 'tutorial';

interface GameActions {
  resetGame: () => void;
  startMode: (modeId: ModeId) => void;
  setScreen: (screen: Screen) => void;
  updateSettings: (settings: Partial<SettingsState>) => void;
  clearScoreboard: () => void;
  selectCat: (catId?: CatId) => void;
  placeCat: (catId: CatId, destination: CellId) => void;
  confirmFormation: () => void;
  moveCat: (catId: CatId, destination: CellId) => void;
  attackMouse: (catId: CatId, mouseId: string) => void;
  endCatPhase: () => void;
  advanceStepper: () => void;
  focusNextCat: () => void;
}

export type GameStore = AppState & GameActions;

function loadScoreboard(): ScoreEntry[] {
  if (typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SCOREBOARD_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as ScoreEntry[]) : [];
  } catch (err) {
    console.warn('Failed to load scoreboard', err);
    return [];
  }
}

function persistScoreboard(entries: ScoreEntry[]): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(SCOREBOARD_STORAGE_KEY, JSON.stringify(entries));
  } catch (err) {
    console.warn('Failed to persist scoreboard', err);
  }
}

function loadSettings(): SettingsState {
  if (typeof localStorage === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_STORAGE_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...(JSON.parse(raw) as SettingsState) } : DEFAULT_SETTINGS;
  } catch (err) {
    console.warn('Failed to load settings', err);
    return DEFAULT_SETTINGS;
  }
}

function persistSettings(settings: SettingsState): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Failed to persist settings', err);
  }
}

function createRunState(modeId: ModeId, openingOverlay = false): GameState {
  const mode = getModeConfig(modeId);
  return createInitialGameState(mode.initialMice, { openingOverlay, modeId });
}

const initialRunState = createRunState(DEFAULT_MODE, false);
const initialScoreboard = loadScoreboard();
const initialSettings = loadSettings();

export const useGameStore = create<GameStore>((set, get) => ({
  ...initialRunState,
  screen: 'start',
  scoreboard: initialScoreboard,
  settings: initialSettings,

  resetGame: () => {
    set((state) => ({
      ...state,
      ...createRunState(state.modeId, false),
      outcomeRecorded: false,
    }));
  },

  startMode: (modeId) => {
    set((state) => ({
      ...state,
      ...createRunState(modeId, false),
      modeId,
      screen: 'game',
      outcomeRecorded: false,
    }));
  },

  setScreen: (screen) => {
    set((state) => ({ ...state, screen }));
  },

  updateSettings: (partial) => {
    set((state) => {
      const settings = { ...state.settings, ...partial };
      persistSettings(settings);
      return { ...state, settings };
    });
  },

  clearScoreboard: () => {
    persistScoreboard([]);
    set((state) => ({ ...state, scoreboard: [] }));
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
    if (!cell) return;
    const currentPos = state.cats[catId].position;
    const tutorial = useTutorialStore.getState();
    if (!tutorial.canPerformAction({ action: 'cat-place', actorId: catId, from: currentPos, to: destination })) return;

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
        draft.showOpeningOverlay = false;
        draft.selectedCatId = catId;
        applyDeterrence(draft);
        logEvent(draft, {
          action: 'cat-place',
          actorType: 'cat',
          actorId: catId,
          from: currentPos,
          to: destination,
          payload: { phase: 'setup' },
        });
      })
    );
  },

  confirmFormation: () => {
    const state = get();
    if (state.phase !== 'setup') return;
    if (state.handCats.length > 0) return;
    const tutorial = useTutorialStore.getState();
    if (!tutorial.canPerformAction({ action: 'confirm-formation' })) return;
    set(
      produce<GameStore>((draft) => {
        draft.phase = 'cat';
        resetCatTurnState(draft);
        draft.selectedCatId = draft.catOrder.find((id) => draft.cats[id].position);
        applyDeterrence(draft);
        logEvent(draft, {
          action: 'confirm-formation',
          actorType: 'system',
          payload: { catPositions: Object.fromEntries(Object.entries(draft.cats).map(([id, cat]) => [id, cat.position])) },
        });
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
    const tutorial = useTutorialStore.getState();
    if (!tutorial.canPerformAction({ action: 'cat-move', actorId: catId, from: cat.position, to: destination })) return;

    set(
      produce<GameStore>((draft) => {
        const movingCat = draft.cats[catId];
        const origin = movingCat.position!;
        draft.cells[movingCat.position!].occupant = undefined;
        movingCat.position = destination;
        movingCat.movesRemaining = Math.max(0, movingCat.movesRemaining - 1);
        updateShadowBonusOnMove(movingCat, isShadowBonus(destination));
        draft.cells[destination].occupant = { type: 'cat', id: catId };
        maybeFinalizeCatTurn(draft, catId);
        applyDeterrence(draft);
        checkInteriorFloodLoss(draft);
        logEvent(draft, {
          action: 'cat-move',
          actorType: 'cat',
          actorId: catId,
          from: origin,
          to: destination,
        });
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
    const origin = cat.position;
    const targetCell = mouse.position;
    const adjacentCells = new Set(getNeighborCells(cat.position));
    if (!adjacentCells.has(mouse.position)) return;
    if (getCatRemainingCatch(state, catId) <= 0) return;
    const tutorial = useTutorialStore.getState();
    if (!tutorial.canPerformAction({ action: 'cat-attack', actorId: catId, targetId: mouseId, from: cat.position, to: targetCell })) return;

    set(
      produce<GameStore>((draft) => {
        const draftCat = draft.cats[catId];
        const draftMouse = draft.mice[mouseId];
        if (!draftMouse?.position) return;
        maybeActivateShadowBonus(draftCat);
        draftCat.catchSpent += 1;
        draftCat.attackCommitted = true;
        damageMouse(draftMouse, 1);
        const remainingHearts = draftMouse.hearts;
        if (draftMouse.hearts <= 0) {
        draft.cells[draftMouse.position].occupant = undefined;
        delete draft.mice[mouseId];
        healCat(draftCat, 1);
      } else {
        const wasStunned = draftMouse.stunned;
        draftMouse.stunned = true;
        if (!wasStunned) {
          const retaliation = Math.max(draftMouse.attack - getCatEffectiveMeow(draft, catId), 0);
          if (retaliation > 0) {
            damageCat(draftCat, retaliation);
            handleCatDefeat(draft, catId);
          }
        }
      }
      maybeFinalizeCatTurn(draft, catId);
      applyDeterrence(draft);
      checkInteriorFloodLoss(draft);
      logEvent(draft, {
        action: 'cat-attack',
        actorType: 'cat',
        actorId: catId,
        from: origin,
        targetId: mouseId,
        to: targetCell,
        payload: {
          damage: 1,
          mouseRemainingHearts: remainingHearts,
          mouseDefeated: remainingHearts <= 0,
        },
      });
    })
  );
},

  endCatPhase: () => {
    const state = get();
    if (state.phase !== 'cat' || state.status.state !== 'playing') return;
    const tutorial = useTutorialStore.getState();
    if (!tutorial.canPerformAction({ action: 'end-cat-phase' })) return;
    const mouseFrames = buildMousePhaseFrames(state);
    const frames: StepPhase[] = mouseFrames.length > 0 ? ['resident-mice', 'incoming-wave'] : ['incoming-wave'];
    const [current, ...remaining] = frames;
    const currentFrames = current === 'resident-mice' ? mouseFrames : buildIncomingPhaseFrames(state);
    set(
      produce<GameStore>((draft) => {
        // Force all cats to end their turn, even if they have remaining actions.
        Object.values(draft.cats).forEach((cat) => {
          cat.turnEnded = true;
          cat.movesRemaining = 0;
          cat.catchSpent = getCatEffectiveCatch(draft, cat.id);
        });
        draft.phase = 'stepper';
        draft.stepper = {
          frames: currentFrames,
          index: 0,
          label: current === 'resident-mice' ? 'Resident Mouse Phase' : 'Incoming Wave Phase',
          currentPhase: current,
          remaining,
        };
        logEvent(draft, {
          action: 'end-cat-phase',
          actorType: 'system',
          payload: { frames: currentFrames.length, nextPhase: current },
        });
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

function applyFrame(state: GameStore, frame: StepFrame): GameStore {
  switch (frame.phase) {
    case 'mouse-move': {
      const { mouseId, from, to } = frame.payload;
      return produce(state, (draft) => {
        const mouse = draft.mice[mouseId];
        if (!mouse || mouse.hearts <= 0) return;
        if (mouse.position !== from) return;
        if (draft.cells[to].occupant) return;
        draft.cells[from].occupant = undefined;
        draft.cells[to].occupant = { type: 'mouse', id: mouseId };
        mouse.position = to;
        checkInteriorFloodLoss(draft);
        logEvent(draft, {
          action: 'mouse-move',
          actorType: 'mouse',
          actorId: mouseId,
          from,
          to,
          phase: frame.phase,
        });
      });
    }
    case 'mouse-attack': {
      const { mouseId, targetId } = frame.payload;
      return produce(state, (draft) => {
        const mouse = draft.mice[mouseId];
        const cat = draft.cats[targetId];
        if (!mouse?.position || !cat?.position) return;
        const targetPos = cat.position;
        cat.wokenByAttack = true;
        damageCat(cat, 1);
        if (cat.hearts <= 0) {
          draft.cells[cat.position].occupant = undefined;
          cat.position = undefined;
          handleCatDefeat(draft, targetId);
        }
        checkInteriorFloodLoss(draft);
        logEvent(draft, {
          action: 'mouse-attack',
          actorType: 'mouse',
          actorId: mouseId,
          to: targetPos,
          targetId,
          payload: { damage: 1, catHearts: cat.hearts },
          phase: frame.phase,
        });
      });
    }
    case 'mouse-feed': {
      const { eaters } = frame.payload;
      return produce(state, (draft) => {
        eaters.forEach((mouseId) => {
          const mouse = draft.mice[mouseId];
          if (!mouse?.position || mouse.hearts <= 0 || mouse.stunned) return;
          draft.grainLoss += mouse.tier;
          if (isShadowBonus(mouse.position)) {
            upgradeMouse(mouse);
          }
        });
        applyDeterrence(draft);
        checkInteriorFloodLoss(draft);
        logEvent(draft, {
          action: 'mouse-feed',
          actorType: 'mouse',
          payload: {
            eaters,
            grainLoss: draft.grainLoss,
            upgraded: eaters
              .map((id) => draft.mice[id])
              .filter((m) => m && m.hearts > 0)
              .map((m) => ({ id: m!.id, tier: m!.tier })),
          },
          phase: frame.phase,
        });
      });
    }
    case 'incoming-summary':
      return produce(state, (draft) => {
        logEvent(draft, {
          action: 'incoming-summary',
          actorType: 'system',
          payload: frame.payload,
          phase: frame.phase,
        });
      });
    case 'incoming-scare': {
      const { amount } = frame.payload;
      return produce(state, (draft) => {
        draft.incomingQueue.splice(0, amount);
        // Remove deterred mice from the queue; remaining ones are about to enter so clear deter preview.
        draft.deterPreview = { meowge: 0, deterred: 0, entering: draft.incomingQueue.length };
        logEvent(draft, {
          action: 'incoming-scare',
          actorType: 'system',
          payload: { amount, queueAfter: draft.incomingQueue.length },
          phase: frame.phase,
        });
      });
    }
    case 'incoming-place': {
      const { cellId } = frame.payload;
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
        checkInteriorFloodLoss(draft);
        logEvent(draft, {
          action: 'incoming-place',
          actorType: 'mouse',
          actorId: newId,
          to: cellId,
          payload: { tier: entering.tier },
          phase: frame.phase,
        });
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
          draft.incomingQueue = replenishIncomingQueue(draft.incomingQueue);
        }
        applyDeterrence(draft);
        checkInteriorFloodLoss(draft);
        logEvent(draft, {
          action: 'incoming-finish',
          actorType: 'system',
          payload: { wave: draft.wave, turn: draft.turn },
          phase: frame.phase,
        });
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

function checkInteriorFloodLoss(state: GameState): void {
  if (state.status.state !== 'playing') return;
  const interiorCells = Object.values(state.cells).filter((cell) => cell.terrain === 'interior');
  if (interiorCells.length === 0) return;
  const allMice = interiorCells.every((cell) => cell.occupant?.type === 'mouse');
  if (allMice) {
    state.status = { state: 'lost', reason: 'Interior overrun' };
  }
}

useGameStore.subscribe((state, prev) => {
  if (!prev) return;
  if (prev.status.state === 'playing' && state.status.state !== 'playing' && !state.outcomeRecorded) {
    const catsLost = Object.values(state.cats).filter((cat) => cat.hearts <= 0).length;
    const scoring = state.status.state === 'won' ? computeScore(state) : undefined;
    const entry: ScoreEntry = {
      modeId: state.modeId,
      result: state.status.state === 'won' ? 'win' : 'loss',
      score: scoring?.score,
      finishWave: scoring?.finishWave,
      grainSaved: scoring?.grainSaved,
      grainLoss: state.grainLoss,
      wave: state.wave,
      catsLost,
      catsFullHealth: scoring?.catsFullHealth,
      reason: state.status.reason,
      timestamp: Date.now(),
    };
    const nextScoreboard = [entry, ...state.scoreboard].slice(0, 10);
    persistScoreboard(nextScoreboard);
    useGameStore.setState({ scoreboard: nextScoreboard, outcomeRecorded: true });
  }
});
