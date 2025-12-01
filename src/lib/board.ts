import baseBoardLayout from '../data/boardLayout.json';
import type { BoardLayoutConfig, CellId, CellState, Column, Row } from '../types';

export const columns: Column[] = ['A', 'B', 'C', 'D', 'E'];
export const rows: Row[] = [1, 2, 3, 4, 5];

type LayoutCell = BoardLayoutConfig['cells'][number];

export interface EntryCellDefinition {
  id: CellId;
}

let layoutMap = buildLayoutMap(baseBoardLayout as BoardLayoutConfig);

export let gateCells: CellId[] = getGateCells(layoutMap);

export const perimeterCells: CellId[] = columns.flatMap((column) =>
  rows
    .map((row) => `${column}${row}` as CellId)
    .filter((cellId) => isPerimeter(cellId))
);

let entryCellDefinitions: EntryCellDefinition[] = gateCells.map((id) => ({ id }));

let entryDefinitionMap = new Map<CellId, EntryCellDefinition>(
  entryCellDefinitions.map((entry) => [entry.id, entry])
);

export function setBoardLayout(layout: BoardLayoutConfig): void {
  layoutMap = buildLayoutMap(layout);
  gateCells = getGateCells(layoutMap);
  entryCellDefinitions = gateCells.map((id) => ({ id }));
  entryDefinitionMap = new Map(entryCellDefinitions.map((entry) => [entry.id, entry]));
}

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
  return row === 1 || row === 5 || column === 'A' || column === 'E';
}

export function isShadowBonus(id: CellId): boolean {
  return terrainForCell(id) === 'shadow';
}

export function isGate(id: CellId): boolean {
  return gateCells.includes(id);
}

export type MeowZone = 'gate' | 'silent';

export function getMeowZone(id: CellId): MeowZone {
  return isGate(id) ? 'gate' : 'silent';
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

export function getOrthNeighbors(cellId: CellId): CellId[] {
  const neighbors: CellId[] = [];
  const column = cellId[0] as (typeof columns)[number];
  const row = Number(cellId.slice(1));
  const colIndex = columns.indexOf(column);
  const deltas: [number, number][] = [
    [0, 1],
    [0, -1],
    [1, 0],
    [-1, 0],
  ];
  deltas.forEach(([dc, dr]) => {
    const targetColumn = columns[colIndex + dc];
    const targetRow = row + dr;
    if (!targetColumn) return;
    if (targetRow < rows[0] || targetRow > rows[rows.length - 1]) return;
    neighbors.push(`${targetColumn}${targetRow}` as CellId);
  });
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

export function manhattanDistance(a: CellId, b: CellId): number {
  const aPos = parseCell(a);
  const bPos = parseCell(b);
  const colDiff = Math.abs(columns.indexOf(aPos.column) - columns.indexOf(bPos.column));
  const rowDiff = Math.abs(rows.indexOf(aPos.row) - rows.indexOf(bPos.row));
  return colDiff + rowDiff;
}

export function distanceToPerimeter(cellId: CellId): number {
  const row = Number(cellId.slice(1));
  const column = cellId[0] as (typeof columns)[number];
  const toRow = Math.min(Math.abs(row - rows[0]), Math.abs(row - rows[rows.length - 1]));
  const columnIndex = columns.indexOf(column);
  const toColumn = Math.min(columnIndex, columns.length - 1 - columnIndex);
  return toRow + toColumn;
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

export function getWaveSize(defaultSize = 6): number {
  return defaultSize;
}

function buildLayoutMap(layout: BoardLayoutConfig): Map<CellId, LayoutCell> {
  const map = new Map<CellId, LayoutCell>();
  layout.cells.forEach((cell) => {
    map.set(cell.id as CellId, { ...cell, id: cell.id as CellId });
  });
  validateLayout(map);
  return map;
}

function getGateCells(map: Map<CellId, LayoutCell>): CellId[] {
  return Array.from(map.values())
    .filter((cell) => cell.terrain === 'gate')
    .map((cell) => cell.id);
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
    if (cell.terrain === 'gate' && !isPerimeter(cell.id)) {
      throw new Error(`Gate cell ${cell.id} must sit on the perimeter`);
    }
  });
}
