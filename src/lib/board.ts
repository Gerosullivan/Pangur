import type { CellId, CellState, Column, Row } from '../types';
import {
  getTerrainForCell,
  hasShadowBonus,
  isGateCell,
} from '../data/boardLayout';

export const columns: Column[] = ['A', 'B', 'C', 'D'];
export const rows: Row[] = [1, 2, 3, 4];

export const perimeterCells: CellId[] = columns.flatMap((column) =>
  rows
    .map((row) => `${column}${row}` as CellId)
    .filter((cellId) => isPerimeter(cellId))
);

export function cellId(column: Column, row: Row): CellId {
  return `${column}${row}` as CellId;
}

export function parseCell(id: CellId): { column: Column; row: Row } {
  const column = id[0] as Column;
  const row = Number(id[1]) as Row;
  return { column, row };
}

export function isPerimeter(id: CellId): boolean {
  const { column, row } = parseCell(id);
  return row === 1 || row === 4 || column === 'A' || column === 'D';
}

// Re-export terrain functions from boardLayout for backward compatibility
export const isShadowBonus = hasShadowBonus;
export const isGate = isGateCell;
export const terrainForCell = getTerrainForCell;

export function buildInitialCells(): Record<CellId, CellState> {
  const result: Record<CellId, CellState> = {} as Record<CellId, CellState>;
  for (const column of columns) {
    for (const row of rows) {
      const id = cellId(column, row);
      result[id] = {
        id,
        terrain: terrainForCell(id),
      };
    }
  }
  return result;
}

export function getNeighborCells(origin: CellId): CellId[] {
  const { column, row } = parseCell(origin);
  const colIndex = columns.indexOf(column);
  const rowIndex = rows.indexOf(row);
  const neighbors: CellId[] = [];
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const newRow = rows[rowIndex + dr];
      const newColumn = columns[colIndex + dc];
      if (!newRow || !newColumn) continue;
      neighbors.push(cellId(newColumn, newRow));
    }
  }
  return neighbors;
}

export function pathCellsBetween(origin: CellId, target: CellId): CellId[] {
  const { column: originColumn, row: originRow } = parseCell(origin);
  const { column: targetColumn, row: targetRow } = parseCell(target);
  const colDiff = columns.indexOf(targetColumn) - columns.indexOf(originColumn);
  const rowDiff = rows.indexOf(targetRow) - rows.indexOf(originRow);

  const stepColumn = Math.sign(colDiff);
  const stepRow = Math.sign(rowDiff);

  if (
    !(stepColumn === 0 || stepRow === 0 || Math.abs(stepColumn) === Math.abs(stepRow)) &&
    stepColumn !== 0 &&
    stepRow !== 0
  ) {
    return [];
  }

  const absCol = Math.abs(colDiff);
  const absRow = Math.abs(rowDiff);
  if (stepColumn !== 0 && stepRow !== 0 && absCol !== absRow) {
    return [];
  }

  const steps = Math.max(absCol, absRow);
  const cells: CellId[] = [];
  for (let i = 1; i < steps; i++) {
    const nextColumn = columns[columns.indexOf(originColumn) + stepColumn * i];
    const nextRow = rows[rows.indexOf(originRow) + stepRow * i];
    if (!nextColumn || !nextRow) break;
    cells.push(cellId(nextColumn, nextRow));
  }
  return cells;
}
