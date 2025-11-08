import type { CellId, CellState } from '../types';

/**
 * Board Layout Configuration
 *
 * This file defines the terrain modifiers for each cell on the 4x4 board.
 * Terrain types:
 * - 'shadow': Grants +1 catch bonus (perimeter cells: row 1 + columns A/D)
 * - 'gate': Open entrance cells (B4, C4) - no bonuses
 * - 'interior': Standard cells with no modifiers
 *
 * To modify the board layout, edit the cellTerrain map below.
 */

export type TerrainType = CellState['terrain'];

/**
 * Default terrain configuration for the 4x4 board.
 * Defines all 16 cells (A1-D4) with their terrain types.
 */
export const cellTerrain: Record<CellId, TerrainType> = {
  // Row 4 (entrance row)
  A4: 'shadow',   // Column A shadow bonus
  B4: 'gate',     // Open gate entrance
  C4: 'gate',     // Open gate entrance
  D4: 'shadow',   // Column D shadow bonus

  // Row 3
  A3: 'shadow',   // Column A shadow bonus
  B3: 'interior', // Standard interior
  C3: 'interior', // Standard interior
  D3: 'shadow',   // Column D shadow bonus

  // Row 2
  A2: 'shadow',   // Column A shadow bonus
  B2: 'interior', // Standard interior
  C2: 'interior', // Standard interior
  D2: 'shadow',   // Column D shadow bonus

  // Row 1 (back wall - all shadow)
  A1: 'shadow',   // Row 1 + column A shadow
  B1: 'shadow',   // Row 1 shadow bonus
  C1: 'shadow',   // Row 1 shadow bonus
  D1: 'shadow',   // Row 1 + column D shadow
};

/**
 * Validates that the board layout defines exactly 16 cells (A1-D4).
 * Throws an error if any cells are missing or if invalid cells are present.
 */
export function validateBoardLayout(): void {
  const columns = ['A', 'B', 'C', 'D'];
  const rows = [1, 2, 3, 4];
  const expectedCells: CellId[] = [];

  for (const col of columns) {
    for (const row of rows) {
      expectedCells.push(`${col}${row}` as CellId);
    }
  }

  const definedCells = Object.keys(cellTerrain) as CellId[];
  const missingCells = expectedCells.filter((cell) => !definedCells.includes(cell));
  const extraCells = definedCells.filter((cell) => !expectedCells.includes(cell));

  if (missingCells.length > 0) {
    throw new Error(
      `Board layout validation failed: Missing cells: ${missingCells.join(', ')}`
    );
  }

  if (extraCells.length > 0) {
    throw new Error(
      `Board layout validation failed: Unexpected cells: ${extraCells.join(', ')}`
    );
  }

  if (definedCells.length !== 16) {
    throw new Error(
      `Board layout validation failed: Expected 16 cells, found ${definedCells.length}`
    );
  }
}

// Run validation on module load to catch errors early
validateBoardLayout();

/**
 * Cached terrain lookup for performance.
 * Returns the terrain type for a given cell ID.
 */
export function getTerrainForCell(cellId: CellId): TerrainType {
  return cellTerrain[cellId];
}

/**
 * Returns true if the cell grants a shadow bonus (+1 catch).
 */
export function hasShadowBonus(cellId: CellId): boolean {
  return cellTerrain[cellId] === 'shadow';
}

/**
 * Returns true if the cell is an open gate (entrance).
 */
export function isGateCell(cellId: CellId): boolean {
  return cellTerrain[cellId] === 'gate';
}
