import { GameState, Cat, Mouse, Position, Column, Row, INITIAL_CATS, isPerimeterCell } from '../types/game';

// Create initial game state
export function createInitialState(): GameState {
  // Create three cats in hand (not placed)
  const cats: Cat[] = INITIAL_CATS.map((catData, index) => ({
    ...catData,
    id: `cat-${index}`,
    position: null,
    spentCatch: 0,
    hasMoved: false,
    hasAttacked: false,
  }));

  // Create perimeter mice (12 total: all edge cells)
  const mice: Mouse[] = [];
  const columns: Column[] = ['A', 'B', 'C', 'D'];
  const rows: Row[] = [1, 2, 3, 4];

  let mouseId = 0;
  for (const col of columns) {
    for (const row of rows) {
      const pos: Position = { col, row };
      if (isPerimeterCell(pos)) {
        mice.push({
          id: `mouse-${mouseId++}`,
          position: pos,
          attack: 1,
          health: 1,
          isStunned: false,
          isGrainFed: false,
        });
      }
    }
  }

  return {
    phase: 'setup',
    turn: 1,
    cats,
    mice,
    incomingQueue: 12, // 12 mice waiting outside
    grain: 16,
    selectedCatId: null,
    activeCatId: null,
    setupCatsPlaced: 0,
  };
}

// Helper to get cat by ID
export function getCatById(state: GameState, id: string): Cat | undefined {
  return state.cats.find(c => c.id === id);
}

// Helper to get mouse at position
export function getMouseAtPosition(state: GameState, pos: Position): Mouse | undefined {
  return state.mice.find(m =>
    m.position.col === pos.col && m.position.row === pos.row
  );
}

// Helper to get cat at position
export function getCatAtPosition(state: GameState, pos: Position): Cat | undefined {
  return state.cats.find(c =>
    c.position && c.position.col === pos.col && c.position.row === pos.row
  );
}

// Helper to check if cell is occupied
export function isCellOccupied(state: GameState, pos: Position): boolean {
  return !!getMouseAtPosition(state, pos) || !!getCatAtPosition(state, pos);
}

// Helper to get adjacent positions (8 directions)
export function getAdjacentPositions(pos: Position): Position[] {
  const columns: Column[] = ['A', 'B', 'C', 'D'];
  const colIndex = columns.indexOf(pos.col);
  const adjacent: Position[] = [];

  for (let dc = -1; dc <= 1; dc++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (dc === 0 && dr === 0) continue; // Skip center

      const newCol = columns[colIndex + dc];
      const newRow = (pos.row + dr) as Row;

      if (newCol && newRow >= 1 && newRow <= 4) {
        adjacent.push({ col: newCol, row: newRow });
      }
    }
  }

  return adjacent;
}
