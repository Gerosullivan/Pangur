import { GameState, Cat, Mouse, Position, Column, Row } from './types';
import { parsePosition, getCatAtPosition, getMouseAtPosition, isCellOccupied } from './gameState';

// Helper to get adjacent positions (including diagonals)
export function getAdjacentPositions(position: Position): Position[] {
  const { col, row } = parsePosition(position);
  const colIndex = ['A', 'B', 'C', 'D'].indexOf(col);
  const adjacent: Position[] = [];

  for (let dc = -1; dc <= 1; dc++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (dc === 0 && dr === 0) continue;

      const newCol = ['A', 'B', 'C', 'D'][colIndex + dc];
      const newRow = row + dr;

      if (newCol && newRow >= 1 && newRow <= 4) {
        adjacent.push(`${newCol}${newRow}` as Position);
      }
    }
  }

  return adjacent;
}

// Check if cat can attack a position (must be adjacent and have a mouse)
export function canAttackPosition(cat: Cat, target: Position, mice: Mouse[]): boolean {
  if (cat.position === 'hand') return false;

  const adjacentPositions = getAdjacentPositions(cat.position as Position);
  const isAdjacent = adjacentPositions.includes(target);
  const hasMouse = getMouseAtPosition(mice, target) !== undefined;

  return isAdjacent && hasMouse;
}

// Get valid queen moves for Pangur (straight lines until blocked)
export function getQueenMoves(position: Position, cats: Cat[], mice: Mouse[]): Position[] {
  const { col, row } = parsePosition(position);
  const colIndex = ['A', 'B', 'C', 'D'].indexOf(col);
  const validMoves: Position[] = [];

  // 8 directions: N, NE, E, SE, S, SW, W, NW
  const directions = [
    [0, 1], [1, 1], [1, 0], [1, -1],
    [0, -1], [-1, -1], [-1, 0], [-1, 1]
  ];

  for (const [dc, dr] of directions) {
    let distance = 1;
    while (true) {
      const newCol = ['A', 'B', 'C', 'D'][colIndex + dc * distance];
      const newRow = row + dr * distance;

      if (!newCol || newRow < 1 || newRow > 4) break;

      const newPos = `${newCol}${newRow}` as Position;

      // Stop if blocked by any piece
      if (isCellOccupied(cats, mice, newPos)) break;

      validMoves.push(newPos);
      distance++;
    }
  }

  return validMoves;
}

// Get valid king moves (one cell in any direction)
export function getKingMoves(position: Position, cats: Cat[], mice: Mouse[]): Position[] {
  const adjacentPositions = getAdjacentPositions(position);
  return adjacentPositions.filter(pos => !isCellOccupied(cats, mice, pos));
}

// Get valid moves for a cat based on its role
export function getValidMoves(cat: Cat, cats: Cat[], mice: Mouse[]): Position[] {
  if (cat.position === 'hand') return [];
  if (cat.hasMoved) return [];

  // Pangur (3/1) moves like a queen
  if (cat.baseStats.catch === 3 && cat.baseStats.meow === 1) {
    return getQueenMoves(cat.position as Position, cats, mice);
  }

  // Other cats move like a king
  return getKingMoves(cat.position as Position, cats, mice);
}

// Attack a mouse
export function attackMouse(
  gameState: GameState,
  catId: string,
  mousePosition: Position
): GameState {
  const cat = gameState.cats.find(c => c.id === catId);
  const mouse = getMouseAtPosition(gameState.mice, mousePosition);

  if (!cat || !mouse) return gameState;
  if (cat.spentCatch >= cat.baseStats.catch) return gameState;
  if (!canAttackPosition(cat, mousePosition, gameState.mice)) return gameState;

  // Deal 1 damage
  const newHealth = mouse.health - 1;
  let updatedMice = [...gameState.mice];
  let updatedCats = [...gameState.cats];

  if (newHealth <= 0) {
    // Mouse dies
    updatedMice = updatedMice.filter(m => m.id !== mouse.id);

    // Cat heals +1 heart (max 5)
    updatedCats = updatedCats.map(c =>
      c.id === catId ? { ...c, hearts: Math.min(5, c.hearts + 1), spentCatch: c.spentCatch + 1, hasAttacked: true } : c
    );
  } else {
    // Mouse survives
    updatedMice = updatedMice.map(m => {
      if (m.id === mouse.id) {
        // If grain-fed, downgrade to 1/1 and stun
        if (m.isGrainFed) {
          return {
            ...m,
            health: 1,
            attack: 1,
            isGrainFed: false,
            isStunned: true,
          };
        } else {
          return { ...m, health: newHealth };
        }
      }
      return m;
    });

    updatedCats = updatedCats.map(c =>
      c.id === catId ? { ...c, spentCatch: c.spentCatch + 1, hasAttacked: true } : c
    );
  }

  return {
    ...gameState,
    cats: updatedCats,
    mice: updatedMice,
  };
}

// Move a cat
export function moveCat(
  gameState: GameState,
  catId: string,
  targetPosition: Position
): GameState {
  const cat = gameState.cats.find(c => c.id === catId);
  if (!cat) return gameState;

  const validMoves = getValidMoves(cat, gameState.cats, gameState.mice);
  if (!validMoves.includes(targetPosition)) return gameState;

  // Check ordering rules
  if (cat.hasAttacked && cat.hasMoved) return gameState;

  const updatedCats = gameState.cats.map(c =>
    c.id === catId ? { ...c, position: targetPosition, hasMoved: true } : c
  );

  return {
    ...gameState,
    cats: updatedCats,
  };
}

// Get mouse attack target based on priority rules
export function getMouseAttackTarget(mice: Mouse[], cats: Cat[]): Cat | null {
  const aliveCats = cats.filter(c => c.position !== 'hand' && c.hearts > 0);
  if (aliveCats.length === 0) return null;

  // Priority 1: Cat with base stat 1/3 (Guardian)
  const guardian = aliveCats.find(c => c.baseStats.catch === 1 && c.baseStats.meow === 3);
  if (guardian) return guardian;

  // Priority 2: Cats in row 4
  const catsInRow4 = aliveCats.filter(c => {
    if (c.position === 'hand') return false;
    const { row } = parsePosition(c.position as Position);
    return row === 4;
  });

  if (catsInRow4.length > 0) {
    // Sort by column (left to right)
    catsInRow4.sort((a, b) => {
      const colA = (a.position as string)[0];
      const colB = (b.position as string)[0];
      return colA.localeCompare(colB);
    });
    return catsInRow4[0];
  }

  // Priority 3: Lowest hearts, then left to right
  aliveCats.sort((a, b) => {
    if (a.hearts !== b.hearts) return a.hearts - b.hearts;
    const colA = (a.position as string)[0];
    const colB = (b.position as string)[0];
    return colA.localeCompare(colB);
  });

  return aliveCats[0];
}

// Execute mouse attack
export function executeMouseAttack(gameState: GameState, mouseId: string): GameState {
  const mouse = gameState.mice.find(m => m.id === mouseId);
  if (!mouse || mouse.isStunned) return gameState;

  const target = getMouseAttackTarget(gameState.mice, gameState.cats);
  if (!target) return gameState;

  // Deal 1 damage
  const updatedCats = gameState.cats.map(c => {
    if (c.id === target.id) {
      const newHearts = c.hearts - 1;
      if (newHearts <= 0) {
        // Cat dies - remove from board
        return { ...c, hearts: 0, position: 'hand' as const };
      }
      return { ...c, hearts: newHearts };
    }
    return c;
  });

  // Check for loss condition
  const aliveCats = updatedCats.filter(c => c.hearts > 0);
  if (aliveCats.length === 0) {
    return {
      ...gameState,
      cats: updatedCats,
      gameOver: true,
      victory: false,
    };
  }

  return {
    ...gameState,
    cats: updatedCats,
  };
}

// Execute mouse eating
export function executeMouseEat(gameState: GameState, mouseId: string): GameState {
  const mouse = gameState.mice.find(m => m.id === mouseId);
  if (!mouse || mouse.isStunned) return gameState;

  const grainCost = mouse.isGrainFed ? 2 : 1;
  const newGrain = gameState.grain - grainCost;

  const updatedMice = gameState.mice.map(m => {
    if (m.id === mouseId && !m.isGrainFed) {
      return {
        ...m,
        isGrainFed: true,
        attack: 2,
        health: 2,
      };
    }
    return m;
  });

  // Check for loss condition
  if (newGrain <= 0) {
    return {
      ...gameState,
      grain: 0,
      mice: updatedMice,
      gameOver: true,
      victory: false,
    };
  }

  return {
    ...gameState,
    grain: newGrain,
    mice: updatedMice,
  };
}
