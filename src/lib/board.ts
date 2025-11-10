import type { CellId, CellState, Column, Row } from '../types';

export const columns: Column[] = ['A', 'B', 'C', 'D'];
export const rows: Row[] = [1, 2, 3, 4];
export const gateCells: CellId[] = ['B4', 'C4'];

export const perimeterCells: CellId[] = columns.flatMap((column) =>
  rows
    .map((row) => `${column}${row}` as CellId)
    .filter((cellId) => isPerimeter(cellId))
);

const gateRingCells = buildGateRingCells();

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

export function isShadowBonus(id: CellId): boolean {
  const { column, row } = parseCell(id);
  return row === 1 || column === 'A' || column === 'D';
}

export function isGate(id: CellId): boolean {
  return gateCells.includes(id);
}

export type MeowZone = 'gate' | 'gateRing' | 'silent';

export function getMeowZone(id: CellId): MeowZone {
  if (isGate(id)) return 'gate';
  if (gateRingCells.has(id)) return 'gateRing';
  return 'silent';
}

export function terrainForCell(id: CellId): CellState['terrain'] {
  if (isShadowBonus(id)) return 'shadow';
  if (isGate(id)) return 'gate';
  return 'interior';
}

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

function buildGateRingCells(): Set<CellId> {
  const ring = new Set<CellId>();
  for (const column of columns) {
    for (const row of rows) {
      const id = cellId(column, row);
      if (isGate(id)) continue;
      const minDistance = Math.min(...gateCells.map((gate) => chebyshevDistance(id, gate)));
      if (minDistance === 1) {
        ring.add(id);
      }
    }
  }
  return ring;
}

function chebyshevDistance(a: CellId, b: CellId): number {
  const aPos = parseCell(a);
  const bPos = parseCell(b);
  const colDiff = Math.abs(columns.indexOf(aPos.column) - columns.indexOf(bPos.column));
  const rowDiff = Math.abs(rows.indexOf(aPos.row) - rows.indexOf(bPos.row));
  return Math.max(colDiff, rowDiff);
}
