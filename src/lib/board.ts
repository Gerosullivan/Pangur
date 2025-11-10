import boardLayout from '../data/boardLayout.json';
import type { CellId, CellState, Column, EntryDirection, Row } from '../types';

export const columns: Column[] = ['A', 'B', 'C', 'D'];
export const rows: Row[] = [1, 2, 3, 4];

interface EntryConfig {
  direction: EntryDirection;
  incomingMice: number;
}

interface LayoutCell {
  id: CellId;
  terrain: CellState['terrain'];
  entry?: EntryConfig;
}

interface LayoutFile {
  cells: LayoutCell[];
}

export interface EntryCellDefinition extends EntryConfig {
  id: CellId;
}

const layoutData = boardLayout as LayoutFile;
const layoutMap = new Map<CellId, LayoutCell>();
layoutData.cells.forEach((cell) => {
  layoutMap.set(cell.id as CellId, { ...cell, id: cell.id as CellId });
});

validateLayout(layoutMap);

export const gateCells: CellId[] = Array.from(layoutMap.values())
  .filter((cell) => cell.terrain === 'gate')
  .map((cell) => cell.id);

export const perimeterCells: CellId[] = columns.flatMap((column) =>
  rows
    .map((row) => `${column}${row}` as CellId)
    .filter((cellId) => isPerimeter(cellId))
);

const entryCellDefinitions: EntryCellDefinition[] = Array.from(layoutMap.values())
  .filter((cell): cell is LayoutCell & { entry: EntryConfig } => Boolean(cell.entry))
  .map((cell) => ({
    id: cell.id,
    direction: cell.entry!.direction,
    incomingMice: cell.entry!.incomingMice,
  }));

const entryDefinitionMap = new Map<CellId, EntryCellDefinition>(
  entryCellDefinitions.map((entry) => [entry.id, entry])
);

const gateRingCells = buildGateRingCells();
const nearestEntryLookup = buildNearestEntryLookup();

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
  return terrainForCell(id) === 'shadow';
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
  return layoutMap.get(id)?.terrain ?? 'interior';
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
  if (gateCells.length === 0) {
    return ring;
  }
  for (const column of columns) {
    for (const row of rows) {
      const id = cellId(column, row);
      if (isGate(id)) continue;
      const distances = gateCells.map((gate) => chebyshevDistance(id, gate));
      const minDistance = Math.min(...distances);
      if (!Number.isFinite(minDistance)) {
        continue;
      }
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

export function manhattanDistance(a: CellId, b: CellId): number {
  const aPos = parseCell(a);
  const bPos = parseCell(b);
  const colDiff = Math.abs(columns.indexOf(aPos.column) - columns.indexOf(bPos.column));
  const rowDiff = Math.abs(rows.indexOf(aPos.row) - rows.indexOf(bPos.row));
  return colDiff + rowDiff;
}

export function getEntryCells(): EntryCellDefinition[] {
  return entryCellDefinitions;
}

export function getEntryDefinition(cellId: CellId): EntryCellDefinition | undefined {
  return entryDefinitionMap.get(cellId);
}

export function isEntryCell(cellId: CellId): boolean {
  return entryDefinitionMap.has(cellId);
}

export function getNearestEntryCells(cellId: CellId): CellId[] {
  return nearestEntryLookup[cellId] ?? [];
}

function buildNearestEntryLookup(): Partial<Record<CellId, CellId[]>> {
  const lookup: Partial<Record<CellId, CellId[]>> = {};
  const entries = getEntryCells();
  if (entries.length === 0) {
    return lookup;
  }
  for (const column of columns) {
    for (const row of rows) {
      const id = cellId(column, row);
      const distances = entries.map((entry) => ({
        entryId: entry.id,
        distance: chebyshevDistance(id, entry.id),
      }));
      const minDistance = Math.min(...distances.map((item) => item.distance));
      lookup[id] = distances.filter((item) => item.distance === minDistance).map((item) => item.entryId);
    }
  }
  return lookup;
}

function validateLayout(map: Map<CellId, LayoutCell>): void {
  const expectedCells = columns.flatMap((column) => rows.map((row) => cellId(column, row)));
  expectedCells.forEach((id) => {
    if (!map.has(id)) {
      throw new Error(`Board layout missing cell ${id}`);
    }
  });
  const seen = new Set<CellId>();
  map.forEach((cell) => {
    if (seen.has(cell.id)) {
      throw new Error(`Board layout has duplicate cell ${cell.id}`);
    }
    seen.add(cell.id);
    if (cell.entry) {
      if (!isPerimeter(cell.id)) {
        throw new Error(`Entry cell ${cell.id} is not on the perimeter`);
      }
      const { direction } = cell.entry;
      const { column, row } = parseCell(cell.id);
      const matchesSide =
        (direction === 'north' && row === 4) ||
        (direction === 'south' && row === 1) ||
        (direction === 'west' && column === 'A') ||
        (direction === 'east' && column === 'D');
      if (!matchesSide) {
        throw new Error(`Entry cell ${cell.id} has mismatched direction ${direction}`);
      }
      if (cell.entry.incomingMice < 0) {
        throw new Error(`Entry cell ${cell.id} cannot have negative incoming mice`);
      }
    }
  });
}
