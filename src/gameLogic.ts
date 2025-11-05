import { Position, Column, Row, Cat, Mouse, GameState, CellModifiers } from './types';

// Helper: Convert column letter to index
export function colToIndex(col: Column): number {
  return col.charCodeAt(0) - 'A'.charCodeAt(0);
}

// Helper: Convert index to column letter
export function indexToCol(index: number): Column {
  return String.fromCharCode('A'.charCodeAt(0) + index) as Column;
}

// Helper: Check if positions are equal
export function positionsEqual(a: Position | null, b: Position | null): boolean {
  if (!a || !b) return false;
  return a.col === b.col && a.row === b.row;
}

// Get cell modifiers based on position
export function getCellModifiers(pos: Position): CellModifiers {
  const isEdge = pos.row === 1 || pos.row === 4 || pos.col === 'A' || pos.col === 'D';
  const isShadowBonus = (pos.row === 1 && (pos.col === 'A' || pos.col === 'D'));
  const isOpenGate = pos.row === 4 && (pos.col === 'B' || pos.col === 'C');

  let meowMultiplier = 1;
  if (pos.row === 4) meowMultiplier = 2;
  else if (pos.row === 3) meowMultiplier = 1;
  else if (pos.row === 2) meowMultiplier = 0.5;
  else if (pos.row === 1) meowMultiplier = 0;

  return {
    isShadowBonus: isShadowBonus && !isOpenGate,
    isOpenGate,
    meowMultiplier,
  };
}

// Calculate effective catch for a cat at a position
export function getEffectiveCatch(cat: Cat, pos: Position | null): number {
  if (!pos) return cat.baseCatch;
  const mods = getCellModifiers(pos);
  return cat.baseCatch + (mods.isShadowBonus ? 1 : 0);
}

// Calculate effective meow for a cat at a position
export function getEffectiveMeow(cat: Cat, pos: Position | null): number {
  if (!pos) return 0;
  const mods = getCellModifiers(pos);
  return Math.floor(cat.baseMeow * mods.meowMultiplier);
}

// Calculate total deterrence (sum of all cats' effective meow)
export function calculateDeterrence(cats: Cat[]): number {
  return cats.reduce((sum, cat) => {
    if (!cat.position) return sum;
    return sum + getEffectiveMeow(cat, cat.position);
  }, 0);
}

// Check if a position is on the board
export function isValidPosition(pos: Position): boolean {
  const cols: Column[] = ['A', 'B', 'C', 'D'];
  const rows: Row[] = [1, 2, 3, 4];
  return cols.includes(pos.col) && rows.includes(pos.row);
}

// Check if a cell is occupied
export function isCellOccupied(pos: Position, cats: Cat[], mice: Mouse[]): boolean {
  return (
    cats.some(cat => cat.position && positionsEqual(cat.position, pos)) ||
    mice.some(mouse => positionsEqual(mouse.position, pos))
  );
}

// Get adjacent positions (including diagonals)
export function getAdjacentPositions(pos: Position): Position[] {
  const colIdx = colToIndex(pos.col);
  const adjacent: Position[] = [];
  const cols: Column[] = ['A', 'B', 'C', 'D'];

  for (let dCol = -1; dCol <= 1; dCol++) {
    for (let dRow = -1; dRow <= 1; dRow++) {
      if (dCol === 0 && dRow === 0) continue;

      const newColIdx = colIdx + dCol;
      const newRow = (pos.row + dRow) as Row;

      if (newColIdx >= 0 && newColIdx < 4 && newRow >= 1 && newRow <= 4) {
        adjacent.push({ col: cols[newColIdx], row: newRow });
      }
    }
  }

  return adjacent;
}

// Get valid moves for a cat (king moves 1 square, queen moves any distance)
export function getValidMoves(cat: Cat, cats: Cat[], mice: Mouse[]): Position[] {
  if (!cat.position || cat.hasMoved) return [];

  const validMoves: Position[] = [];
  const isPangur = cat.name === 'Pangur' || cat.baseCatch === 3;

  if (isPangur) {
    // Queen movement: any number of cells in a straight line until blocked
    const directions = [
      { dCol: 0, dRow: 1 }, { dCol: 0, dRow: -1 },
      { dCol: 1, dRow: 0 }, { dCol: -1, dRow: 0 },
      { dCol: 1, dRow: 1 }, { dCol: 1, dRow: -1 },
      { dCol: -1, dRow: 1 }, { dCol: -1, dRow: -1 },
    ];

    const colIdx = colToIndex(cat.position.col);

    for (const dir of directions) {
      let steps = 1;
      while (true) {
        const newColIdx = colIdx + dir.dCol * steps;
        const newRow = (cat.position.row + dir.dRow * steps) as Row;

        if (newColIdx < 0 || newColIdx >= 4 || newRow < 1 || newRow > 4) break;

        const newPos: Position = { col: indexToCol(newColIdx), row: newRow };

        if (isCellOccupied(newPos, cats, mice)) break;

        validMoves.push(newPos);
        steps++;
      }
    }
  } else {
    // King movement: one cell in any direction
    const adjacent = getAdjacentPositions(cat.position);
    for (const pos of adjacent) {
      if (!isCellOccupied(pos, cats, mice)) {
        validMoves.push(pos);
      }
    }
  }

  return validMoves;
}

// Get valid attack targets for a cat
export function getValidAttackTargets(cat: Cat, mice: Mouse[]): Mouse[] {
  if (!cat.position) return [];

  const adjacent = getAdjacentPositions(cat.position);
  return mice.filter(mouse =>
    adjacent.some(pos => positionsEqual(pos, mouse.position))
  );
}

// Initialize starting mice (perimeter cells)
export function createStartingMice(): Mouse[] {
  const mice: Mouse[] = [];
  let id = 0;

  const cols: Column[] = ['A', 'B', 'C', 'D'];
  const rows: Row[] = [1, 2, 3, 4];

  for (const col of cols) {
    for (const row of rows) {
      const isPerimeter = row === 1 || row === 4 || col === 'A' || col === 'D';
      if (isPerimeter) {
        mice.push({
          id: `mouse-${id++}`,
          position: { col, row },
          attack: 1,
          hearts: 1,
          hasEaten: false,
          isStunned: false,
        });
      }
    }
  }

  return mice;
}

// Initialize the three starting cats
export function createStartingCats(): Cat[] {
  return [
    {
      id: 'cat-guardian',
      name: 'Guardian',
      role: 'Guardian',
      baseCatch: 1,
      baseMeow: 3,
      hearts: 5,
      maxHearts: 5,
      position: null,
      spentCatch: 0,
      hasMoved: false,
      isActive: false,
    },
    {
      id: 'cat-pangur',
      name: 'Pangur',
      role: 'Hunter',
      baseCatch: 3,
      baseMeow: 1,
      hearts: 5,
      maxHearts: 5,
      position: null,
      spentCatch: 0,
      hasMoved: false,
      isActive: false,
    },
    {
      id: 'cat-balanced',
      name: 'Scout',
      role: 'Scout',
      baseCatch: 2,
      baseMeow: 2,
      hearts: 5,
      maxHearts: 5,
      position: null,
      spentCatch: 0,
      hasMoved: false,
      isActive: false,
    },
  ];
}

// Create initial game state
export function createInitialGameState(): GameState {
  return {
    phase: 'setup',
    turn: 1,
    grain: 16,
    cats: createStartingCats(),
    residentMice: createStartingMice(),
    incomingQueue: 12,
    selectedCatId: null,
    gameResult: null,
    setupCatsPlaced: 0,
  };
}

// Check win condition
export function checkWinCondition(state: GameState): boolean {
  return state.residentMice.length === 0 && state.incomingQueue === 0;
}

// Check loss conditions
export function checkLossCondition(state: GameState): 'grain' | 'cats' | 'overwhelmed' | null {
  if (state.grain <= 0) return 'grain';
  if (state.cats.every(cat => cat.hearts <= 0)) return 'cats';

  // Check if board is completely filled
  const occupiedCells = new Set<string>();
  state.cats.forEach(cat => {
    if (cat.position) {
      occupiedCells.add(`${cat.position.col}${cat.position.row}`);
    }
  });
  state.residentMice.forEach(mouse => {
    occupiedCells.add(`${mouse.position.col}${mouse.position.row}`);
  });

  if (occupiedCells.size >= 16 && state.residentMice.length > 0) {
    return 'overwhelmed';
  }

  return null;
}
