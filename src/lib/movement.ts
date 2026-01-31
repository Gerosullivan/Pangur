import { columns, rows, parseCell, pathCellsBetween } from './board';
import type { CellId, CellState, GameState } from '../types';

/**
 * Get all valid queen-style moves from origin cell.
 * Queen moves: horizontal, vertical, or diagonal in straight lines until blocked.
 */
export function getQueenMoves(origin: CellId, cells: Record<CellId, CellState>): Set<CellId> {
  const { column, row } = parseCell(origin);
  const originColumnIndex = columns.indexOf(column);
  const originRowIndex = rows.indexOf(row);
  const deltas = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];
  const moves = new Set<CellId>();
  deltas.forEach(([dc, dr]) => {
    let step = 1;
    while (true) {
      const nextColumn = columns[originColumnIndex + dc * step];
      const nextRow = rows[originRowIndex + dr * step];
      if (!nextColumn || !nextRow) break;
      const id = `${nextColumn}${nextRow}` as CellId;
      if (cells[id].occupant) break;
      moves.add(id);
      step += 1;
    }
  });
  return moves;
}

/**
 * Validate a queen-style move from origin to destination.
 * Returns true if move is valid (straight line, path unblocked).
 */
export function isValidQueenMove(origin: CellId, destination: CellId, state: GameState): boolean {
  if (origin === destination) return false;
  const sameColumn = origin[0] === destination[0];
  const sameRow = origin[1] === destination[1];
  const diag =
    Math.abs(origin.charCodeAt(0) - destination.charCodeAt(0)) ===
    Math.abs(Number(origin[1]) - Number(destination[1]));
  if (!sameColumn && !sameRow && !diag) {
    return false;
  }
  const path = pathCellsBetween(origin, destination);
  return path.every((cellId) => !state.cells[cellId].occupant);
}
