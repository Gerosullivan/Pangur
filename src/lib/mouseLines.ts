import { getOrthNeighbors } from './board';
import type { CellId, OccupantRef } from '../types';

// Flood-fills from a gate through connected mice/empty cells to find valid placement spots.
export function collectMouseLineCandidates(
  board: Map<CellId, OccupantRef | undefined>,
  gateId: CellId,
  occupancy: Set<CellId>,
  virtualMice: Set<CellId>
): Array<{ cell: CellId; depth: number }> {
  const gateOccupant = board.get(gateId);
  if (gateOccupant?.type === 'cat') {
    return [];
  }
  if (!gateOccupant) {
    return occupancy.has(gateId) ? [] : [{ cell: gateId, depth: 0 }];
  }

  const visited = new Set<CellId>();
  const queue: Array<{ cell: CellId; depth: number }> = [{ cell: gateId, depth: 0 }];
  const candidates: Array<{ cell: CellId; depth: number }> = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (visited.has(current.cell)) continue;
    visited.add(current.cell);
    const occupant = board.get(current.cell);
    const treatedAsMouse = occupant?.type === 'mouse' || virtualMice.has(current.cell);
    if (!treatedAsMouse) continue;

    getOrthNeighbors(current.cell).forEach((neighbor) => {
      if (visited.has(neighbor)) return;
      const neighborOcc = board.get(neighbor);
      if (neighborOcc?.type === 'cat') return;
      if (!neighborOcc && !occupancy.has(neighbor)) {
        candidates.push({ cell: neighbor, depth: current.depth + 1 });
      } else if (neighborOcc?.type === 'mouse' || virtualMice.has(neighbor)) {
        queue.push({ cell: neighbor, depth: current.depth + 1 });
      }
    });
  }

  return candidates;
}
