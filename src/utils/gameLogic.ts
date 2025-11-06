import {
  GameState,
  Cat,
  Mouse,
  Position,
  Column,
  Row,
  calculateEffectiveCatch,
  calculateEffectiveMeow,
} from '../types/game';
import { getCatAtPosition, getMouseAtPosition, getAdjacentPositions } from './gameState';

const COLUMNS: Column[] = ['A', 'B', 'C', 'D'];

// Movement validation
export function isValidMove(state: GameState, cat: Cat, targetPos: Position): boolean {
  if (!cat.position) return false;
  if (cat.hasMoved) return false;

  // Can't move after attacking (unless no attacks were made)
  if (cat.hasAttacked) return false;

  // Check if destination is occupied
  if (getCatAtPosition(state, targetPos) || getMouseAtPosition(state, targetPos)) {
    return false;
  }

  const isPangur = cat.name.includes('Pangur') || cat.name.includes('Cruibne');

  if (isPangur) {
    // Queen movement: any number of cells in a straight line
    return isQueenMove(state, cat.position, targetPos);
  } else {
    // King movement: one cell in any direction
    return isKingMove(cat.position, targetPos);
  }
}

function isKingMove(from: Position, to: Position): boolean {
  const colDiff = Math.abs(COLUMNS.indexOf(from.col) - COLUMNS.indexOf(to.col));
  const rowDiff = Math.abs(from.row - to.row);
  return colDiff <= 1 && rowDiff <= 1 && (colDiff !== 0 || rowDiff !== 0);
}

function isQueenMove(state: GameState, from: Position, to: Position): boolean {
  const fromColIndex = COLUMNS.indexOf(from.col);
  const toColIndex = COLUMNS.indexOf(to.col);
  const colDiff = toColIndex - fromColIndex;
  const rowDiff = to.row - from.row;

  // Must move in a straight line (horizontal, vertical, or diagonal)
  if (colDiff !== 0 && rowDiff !== 0 && Math.abs(colDiff) !== Math.abs(rowDiff)) {
    return false;
  }

  // Check path is clear (no pieces in between)
  const steps = Math.max(Math.abs(colDiff), Math.abs(rowDiff));
  const colStep = colDiff === 0 ? 0 : colDiff / Math.abs(colDiff);
  const rowStep = rowDiff === 0 ? 0 : rowDiff / Math.abs(rowDiff);

  for (let i = 1; i < steps; i++) {
    const checkCol = COLUMNS[fromColIndex + i * colStep];
    const checkRow = (from.row + i * rowStep) as Row;
    const checkPos: Position = { col: checkCol, row: checkRow };

    if (getCatAtPosition(state, checkPos) || getMouseAtPosition(state, checkPos)) {
      return false;
    }
  }

  return true;
}

// Get valid move positions for a cat
export function getValidMoves(state: GameState, cat: Cat): Position[] {
  if (!cat.position || cat.hasMoved || cat.hasAttacked) return [];

  const validMoves: Position[] = [];
  const isPangur = cat.name.includes('Pangur') || cat.name.includes('Cruibne');

  if (isPangur) {
    // Queen moves: check all directions
    const directions = [
      { dc: 0, dr: 1 },  // up
      { dc: 0, dr: -1 }, // down
      { dc: 1, dr: 0 },  // right
      { dc: -1, dr: 0 }, // left
      { dc: 1, dr: 1 },  // up-right
      { dc: 1, dr: -1 }, // down-right
      { dc: -1, dr: 1 }, // up-left
      { dc: -1, dr: -1 }, // down-left
    ];

    const fromColIndex = COLUMNS.indexOf(cat.position.col);

    for (const { dc, dr } of directions) {
      let step = 1;
      while (true) {
        const newColIndex = fromColIndex + step * dc;
        const newRow = cat.position.row + step * dr;

        if (newColIndex < 0 || newColIndex >= 4 || newRow < 1 || newRow > 4) break;

        const newPos: Position = { col: COLUMNS[newColIndex], row: newRow as Row };

        if (getCatAtPosition(state, newPos) || getMouseAtPosition(state, newPos)) {
          break; // Blocked
        }

        validMoves.push(newPos);
        step++;
      }
    }
  } else {
    // King moves: one cell in any direction
    const adjacent = getAdjacentPositions(cat.position);
    for (const pos of adjacent) {
      if (!getCatAtPosition(state, pos) && !getMouseAtPosition(state, pos)) {
        validMoves.push(pos);
      }
    }
  }

  return validMoves;
}

// Attack validation
export function getValidAttackTargets(state: GameState, cat: Cat): Mouse[] {
  if (!cat.position) return [];

  const availableCatch = calculateEffectiveCatch(cat) - cat.spentCatch;
  if (availableCatch <= 0) return [];

  const adjacent = getAdjacentPositions(cat.position);
  const targets: Mouse[] = [];

  for (const pos of adjacent) {
    const mouse = getMouseAtPosition(state, pos);
    if (mouse) {
      targets.push(mouse);
    }
  }

  return targets;
}

// Execute cat attack
export function attackMouse(state: GameState, catId: string, mouseId: string): GameState {
  const cat = state.cats.find(c => c.id === catId);
  const mouse = state.mice.find(m => m.id === mouseId);

  if (!cat || !mouse) return state;

  const availableCatch = calculateEffectiveCatch(cat) - cat.spentCatch;
  if (availableCatch <= 0) return state;

  // Check if mouse is adjacent
  const targets = getValidAttackTargets(state, cat);
  if (!targets.find(m => m.id === mouseId)) return state;

  let newCats = [...state.cats];
  let newMice = [...state.mice];

  // Deal 1 damage
  const updatedMouse = { ...mouse };
  updatedMouse.health -= 1;

  // Check if mouse died
  if (updatedMouse.health <= 0) {
    // Remove mouse
    newMice = newMice.filter(m => m.id !== mouseId);

    // Heal cat +1 heart (max 5)
    newCats = newCats.map(c => {
      if (c.id === catId) {
        return { ...c, hearts: Math.min(c.hearts + 1, c.maxHearts), spentCatch: c.spentCatch + 1, hasAttacked: true };
      }
      return c;
    });
  } else {
    // Mouse survived
    // If it was 2/2 (grain fed), downgrade to 1/1 and stun
    if (updatedMouse.isGrainFed) {
      updatedMouse.isGrainFed = false;
      updatedMouse.attack = 1;
      updatedMouse.health = 1;
      updatedMouse.isStunned = true;
    }

    newMice = newMice.map(m => (m.id === mouseId ? updatedMouse : m));

    // Update cat
    newCats = newCats.map(c => {
      if (c.id === catId) {
        return { ...c, spentCatch: c.spentCatch + 1, hasAttacked: true };
      }
      return c;
    });
  }

  return {
    ...state,
    cats: newCats,
    mice: newMice,
  };
}

// Execute cat movement
export function moveCat(state: GameState, catId: string, targetPos: Position): GameState {
  const cat = state.cats.find(c => c.id === catId);
  if (!cat) return state;

  if (!isValidMove(state, cat, targetPos)) return state;

  const newCats = state.cats.map(c => {
    if (c.id === catId) {
      return { ...c, position: targetPos, hasMoved: true };
    }
    return c;
  });

  return {
    ...state,
    cats: newCats,
  };
}

// Mouse phase logic
export function executeMousePhase(state: GameState): GameState {
  let newState = { ...state };

  // Attack sub-phase
  newState = executeMiceAttacks(newState);

  // Eat sub-phase
  newState = executeMiceEating(newState);

  // Check loss conditions
  if (newState.grain <= 0) {
    return { ...newState, phase: 'loss' };
  }

  if (newState.cats.length === 0) {
    return { ...newState, phase: 'loss' };
  }

  return { ...newState, phase: 'wave-phase' };
}

function executeMiceAttacks(state: GameState): GameState {
  let newState = { ...state };

  // Process each mouse (skip stunned)
  for (const mouse of state.mice) {
    if (mouse.isStunned) continue;

    let remainingAttack = mouse.attack;

    while (remainingAttack > 0) {
      const target = findMouseAttackTarget(newState);
      if (!target) break;

      // Deal 1 damage
      const newCats = newState.cats.map(c => {
        if (c.id === target.id) {
          const newHearts = c.hearts - 1;
          if (newHearts <= 0) {
            // Cat dies
            return null;
          }
          return { ...c, hearts: newHearts };
        }
        return c;
      }).filter(c => c !== null) as Cat[];

      newState = { ...newState, cats: newCats };
      remainingAttack--;
    }
  }

  return newState;
}

function findMouseAttackTarget(state: GameState): Cat | null {
  if (state.cats.length === 0) return null;

  // Priority 1: Cat with base stat 1/3 (Breoinne/Guardian)
  const guardian = state.cats.find(c => c.baseCatch === 1 && c.baseMeow === 3);
  if (guardian) return guardian;

  // Priority 2: Any cat in row 4
  const row4Cats = state.cats
    .filter(c => c.position?.row === 4)
    .sort((a, b) => {
      if (!a.position || !b.position) return 0;
      return COLUMNS.indexOf(a.position.col) - COLUMNS.indexOf(b.position.col);
    });
  if (row4Cats.length > 0) return row4Cats[0];

  // Priority 3: Lowest hearts, then leftmost
  const sorted = [...state.cats].sort((a, b) => {
    if (a.hearts !== b.hearts) return a.hearts - b.hearts;
    if (!a.position || !b.position) return 0;
    return COLUMNS.indexOf(a.position.col) - COLUMNS.indexOf(b.position.col);
  });

  return sorted[0] || null;
}

function executeMiceEating(state: GameState): GameState {
  let newGrain = state.grain;
  const newMice = state.mice.map(mouse => {
    if (mouse.isStunned) return mouse;

    if (!mouse.isGrainFed) {
      // 1/1 mouse eats 1 grain, becomes 2/2
      newGrain -= 1;
      return { ...mouse, isGrainFed: true, attack: 2, health: 2 };
    } else {
      // 2/2 mouse eats 2 grain, stays 2/2
      newGrain -= 2;
      return mouse;
    }
  });

  return {
    ...state,
    mice: newMice,
    grain: newGrain,
  };
}

// Wave phase logic
export function executeWavePhase(state: GameState): GameState {
  // Calculate deterrence
  const totalMeow = state.cats.reduce((sum, cat) => sum + calculateEffectiveMeow(cat), 0);
  const scaredCount = Math.min(totalMeow, state.incomingQueue);
  const enteringCount = state.incomingQueue - scaredCount;

  // Place entering mice
  let newMice = [...state.mice];
  let placedCount = 0;

  const rows: Row[] = [4, 3, 2, 1];
  const cols: Column[] = ['A', 'B', 'C', 'D'];

  outerLoop: for (const row of rows) {
    for (const col of cols) {
      if (placedCount >= enteringCount) break outerLoop;

      const pos: Position = { col, row };
      const occupied = getCatAtPosition(state, pos) || getMouseAtPosition({ ...state, mice: newMice }, pos);

      if (!occupied) {
        newMice.push({
          id: `mouse-${Date.now()}-${placedCount}`,
          position: pos,
          attack: 1,
          health: 1,
          isStunned: false,
          isGrainFed: false,
        });
        placedCount++;
      }
    }
  }

  // Check if all mice were placed
  if (placedCount < enteringCount) {
    // Board overwhelmed
    return { ...state, phase: 'loss' };
  }

  // Reset cat actions and unstun mice
  const newCats = state.cats.map(c => ({
    ...c,
    spentCatch: 0,
    hasMoved: false,
    hasAttacked: false,
  }));

  const unstunnedMice = newMice.map(m => ({
    ...m,
    isStunned: false,
  }));

  // Check win condition
  if (unstunnedMice.length === 0 && enteringCount === 0) {
    return { ...state, phase: 'win' };
  }

  // Refill queue
  return {
    ...state,
    cats: newCats,
    mice: unstunnedMice,
    incomingQueue: 12,
    turn: state.turn + 1,
    phase: 'cat-phase',
  };
}
