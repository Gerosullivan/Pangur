import { GameState, Cat, Mouse, Position } from './types';
import {
  positionsEqual,
  isCellOccupied,
  getEffectiveCatch,
  calculateDeterrence,
  checkWinCondition,
  checkLossCondition,
  getAdjacentPositions,
  colToIndex,
  indexToCol,
} from './gameLogic';

// Place a cat on the board during setup phase
export function placeCat(state: GameState, catId: string, position: Position): GameState {
  if (state.phase !== 'setup') return state;

  // Check if position is occupied or is a perimeter cell
  const isPerimeter = position.row === 1 || position.row === 4 || position.col === 'A' || position.col === 'D';
  const occupied = isCellOccupied(position, state.cats, state.residentMice);

  if (occupied || isPerimeter) return state;

  const newCats = state.cats.map(cat =>
    cat.id === catId ? { ...cat, position } : cat
  );

  const catsPlaced = newCats.filter(cat => cat.position !== null).length;
  const allPlaced = catsPlaced === 3;

  return {
    ...state,
    cats: newCats,
    setupCatsPlaced: catsPlaced,
    phase: allPlaced ? 'cat' : 'setup',
  };
}

// Select a cat to make it active
export function selectCat(state: GameState, catId: string | null): GameState {
  if (state.phase !== 'cat') return state;

  const newCats = state.cats.map(cat => ({
    ...cat,
    isActive: cat.id === catId,
  }));

  return {
    ...state,
    cats: newCats,
    selectedCatId: catId,
  };
}

// Move a cat to a new position
export function moveCat(state: GameState, catId: string, newPosition: Position): GameState {
  if (state.phase !== 'cat') return state;

  const cat = state.cats.find(c => c.id === catId);
  if (!cat || cat.hasMoved || !cat.position) return state;

  // Check if move is valid (not occupied)
  if (isCellOccupied(newPosition, state.cats, state.residentMice)) return state;

  const newCats = state.cats.map(c =>
    c.id === catId ? { ...c, position: newPosition, hasMoved: true } : c
  );

  return {
    ...state,
    cats: newCats,
  };
}

// Cat attacks a mouse
export function attackMouse(state: GameState, catId: string, mouseId: string): GameState {
  if (state.phase !== 'cat') return state;

  const cat = state.cats.find(c => c.id === catId);
  const mouse = state.residentMice.find(m => m.id === mouseId);

  if (!cat || !mouse || !cat.position) return state;

  const effectiveCatch = getEffectiveCatch(cat, cat.position);
  const availableCatch = effectiveCatch - cat.spentCatch;

  if (availableCatch <= 0) return state;

  // Check if mouse is adjacent
  const adjacent = getAdjacentPositions(cat.position);
  if (!adjacent.some(pos => positionsEqual(pos, mouse.position))) return state;

  // Deal 1 damage
  const newMouseHearts = mouse.hearts - 1;
  let newCats = [...state.cats];
  let newMice = [...state.residentMice];

  if (newMouseHearts <= 0) {
    // Mouse dies - remove it and heal cat
    newMice = newMice.filter(m => m.id !== mouseId);
    newCats = newCats.map(c =>
      c.id === catId
        ? { ...c, spentCatch: c.spentCatch + 1, hearts: Math.min(c.hearts + 1, c.maxHearts) }
        : c
    );
  } else {
    // Mouse survives
    if (mouse.hearts === 2 && mouse.attack === 2) {
      // 2/2 mouse hit - downgrade to 1/1 and stun
      newMice = newMice.map(m =>
        m.id === mouseId
          ? { ...m, hearts: 1, attack: 1, isStunned: true }
          : m
      );
    } else {
      // Regular damage
      newMice = newMice.map(m =>
        m.id === mouseId ? { ...m, hearts: newMouseHearts } : m
      );
    }

    newCats = newCats.map(c =>
      c.id === catId ? { ...c, spentCatch: c.spentCatch + 1 } : c
    );
  }

  return {
    ...state,
    cats: newCats,
    residentMice: newMice,
  };
}

// End cat phase and start mouse phase
export function passTurnToMice(state: GameState): GameState {
  if (state.phase !== 'cat') return state;

  return {
    ...state,
    phase: 'mouse',
  };
}

// Execute mouse phase (attacks then eating)
export function executeMousePhase(state: GameState): GameState {
  if (state.phase !== 'mouse') return state;

  let newState = { ...state };

  // Attack sub-phase
  newState = executeMouseAttacks(newState);

  // Check if all cats defeated
  const lossCondition = checkLossCondition(newState);
  if (lossCondition === 'cats') {
    return {
      ...newState,
      phase: 'gameOver',
      gameResult: 'loss',
    };
  }

  // Eat sub-phase
  newState = executeMouseEating(newState);

  // Check if grain depleted
  if (newState.grain <= 0) {
    return {
      ...newState,
      phase: 'gameOver',
      gameResult: 'loss',
    };
  }

  // Move to incoming wave phase
  return {
    ...newState,
    phase: 'incoming',
  };
}

// Mouse attack logic
function executeMouseAttacks(state: GameState): GameState {
  let newCats = [...state.cats];
  const activeMice = state.residentMice.filter(m => !m.isStunned);

  for (const mouse of activeMice) {
    for (let i = 0; i < mouse.attack; i++) {
      const target = selectMouseTarget(newCats);
      if (target) {
        newCats = newCats.map(cat =>
          cat.id === target.id
            ? { ...cat, hearts: cat.hearts - 1 }
            : cat
        );
      }
    }
  }

  // Remove defeated cats
  newCats = newCats.filter(cat => cat.hearts > 0);

  return {
    ...state,
    cats: newCats,
  };
}

// Select mouse attack target based on priority
function selectMouseTarget(cats: Cat[]): Cat | null {
  const aliveCats = cats.filter(cat => cat.hearts > 0 && cat.position);

  if (aliveCats.length === 0) return null;

  // Priority 1: 1/3 cat (Guardian)
  const guardian = aliveCats.find(cat => cat.baseCatch === 1 && cat.baseMeow === 3);
  if (guardian) return guardian;

  // Priority 2: Cats in row 4
  const row4Cats = aliveCats.filter(cat => cat.position?.row === 4);
  if (row4Cats.length > 0) {
    row4Cats.sort((a, b) => {
      const colA = colToIndex(a.position!.col);
      const colB = colToIndex(b.position!.col);
      return colA - colB;
    });
    return row4Cats[0];
  }

  // Priority 3: Lowest hearts, then leftmost
  aliveCats.sort((a, b) => {
    if (a.hearts !== b.hearts) return a.hearts - b.hearts;
    const colA = colToIndex(a.position!.col);
    const colB = colToIndex(b.position!.col);
    return colA - colB;
  });

  return aliveCats[0];
}

// Mouse eating logic
function executeMouseEating(state: GameState): GameState {
  let newGrain = state.grain;
  let newMice = state.residentMice.filter(m => !m.isStunned).map(mouse => {
    if (mouse.hearts === 1 && mouse.attack === 1) {
      // 1/1 mouse eats 1 grain and becomes 2/2
      newGrain -= 1;
      return { ...mouse, hearts: 2, attack: 2, hasEaten: true };
    } else if (mouse.hearts === 2 && mouse.attack === 2) {
      // 2/2 mouse eats 2 grain
      newGrain -= 2;
      return { ...mouse, hasEaten: true };
    }
    return mouse;
  });

  // Add back stunned mice
  newMice = [
    ...newMice,
    ...state.residentMice.filter(m => m.isStunned),
  ];

  return {
    ...state,
    grain: Math.max(0, newGrain),
    residentMice: newMice,
  };
}

// Execute incoming wave phase
export function executeIncomingWave(state: GameState): GameState {
  if (state.phase !== 'incoming') return state;

  // Calculate deterrence
  const deterrence = calculateDeterrence(state.cats);
  const scared = Math.min(deterrence, state.incomingQueue);
  const entering = state.incomingQueue - scared;

  // Place entering mice on the board
  const newMice = [...state.residentMice];
  let placed = 0;

  // Fill from top to bottom, left to right
  const rows = [4, 3, 2, 1] as const;
  const cols = ['A', 'B', 'C', 'D'] as const;

  for (const row of rows) {
    if (placed >= entering) break;
    for (const col of cols) {
      if (placed >= entering) break;

      const pos = { col, row };
      if (!isCellOccupied(pos, state.cats, newMice)) {
        newMice.push({
          id: `mouse-t${state.turn}-${placed}`,
          position: pos,
          attack: 1,
          hearts: 1,
          hasEaten: false,
          isStunned: false,
        });
        placed++;
      }
    }
  }

  // Check if mice couldn't be placed (board overwhelmed)
  if (placed < entering) {
    // Not all mice could be placed - game over
    return {
      ...state,
      phase: 'gameOver',
      gameResult: 'loss',
    };
  }

  // Reset cats for next turn
  const newCats = state.cats.map(cat => ({
    ...cat,
    spentCatch: 0,
    hasMoved: false,
    isActive: false,
  }));

  // Reset mice stun flags
  const resetMice = newMice.map(mouse => ({
    ...mouse,
    isStunned: false,
    hasEaten: false,
  }));

  const newState: GameState = {
    ...state,
    cats: newCats,
    residentMice: resetMice,
    incomingQueue: 12, // Refill queue
    turn: state.turn + 1,
    phase: 'cat',
    selectedCatId: null,
  };

  // Check win condition
  if (checkWinCondition(newState)) {
    return {
      ...newState,
      phase: 'gameOver',
      gameResult: 'win',
    };
  }

  // Check other loss conditions (grain/cats defeated)
  const lossCondition = checkLossCondition(newState);
  if (lossCondition === 'grain' || lossCondition === 'cats') {
    return {
      ...newState,
      phase: 'gameOver',
      gameResult: 'loss',
    };
  }

  return newState;
}
