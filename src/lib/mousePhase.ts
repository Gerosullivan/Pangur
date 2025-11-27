import { getNeighborCells, getOrthNeighbors, isShadowBonus, distanceToPerimeter } from './board';
import { getCatEffectiveMeow } from './mechanics';
import type { CatId, CellId, GameState, MouseState, StepFrame } from '../types';

// Builds the ordered mouse frames for the stepper: move toward shadow if possible, otherwise attack or advance.
export function buildMousePhaseFrames(state: GameState): StepFrame[] {
  const frames: StepFrame[] = [];
  const occupancy = new Map<CellId, { type: 'cat' | 'mouse'; id: string }>();
  Object.values(state.cats).forEach((cat) => {
    if (cat.position && cat.hearts > 0) {
      occupancy.set(cat.position, { type: 'cat', id: cat.id });
    }
  });
  Object.values(state.mice).forEach((mouse) => {
    if (mouse.position) {
      occupancy.set(mouse.position, { type: 'mouse', id: mouse.id });
    }
  });

  const orderedMice = sortMiceForPhase(state);
  const plannedPositions = new Map<string, CellId | undefined>();
  orderedMice.forEach((mouse) => plannedPositions.set(mouse.id, mouse.position));

  for (const mouse of orderedMice) {
    if (!mouse.position || mouse.hearts <= 0 || mouse.stunned) continue;
    const plannedPosition = plannedPositions.get(mouse.id) ?? mouse.position;
    const movePlan = findMovePlan(state, mouse, plannedPosition, occupancy);
    const hasShadowMove = movePlan && isShadowBonus(movePlan.destination);
    const adjacentCats = getAdjacentCats(state, plannedPosition);
    if (!isShadowBonus(plannedPosition) && hasShadowMove) {
      frames.push({
        id: `${mouse.id}-move`,
        phase: 'mouse-move',
        description: `${mouse.id} moves to ${movePlan!.destination}`,
        payload: { mouseId: mouse.id, from: plannedPosition, to: movePlan!.destination },
      });
      occupancy.delete(plannedPosition);
      occupancy.set(movePlan!.destination, { type: 'mouse', id: mouse.id });
      plannedPositions.set(mouse.id, movePlan!.destination);
      continue;
    }
    if (adjacentCats.length > 0) {
      const targetId = pickMouseTarget(state, plannedPosition);
      if (targetId) {
        const effectiveMeow = getCatEffectiveMeow(state, targetId);
        const totalHits = Math.max(mouse.attack - effectiveMeow, 0);
        for (let i = 0; i < totalHits; i += 1) {
          frames.push({
            id: `${mouse.id}-attack-${i + 1}`,
            phase: 'mouse-attack',
            description: `${mouse.id} attacks ${targetId}`,
            payload: { mouseId: mouse.id, targetId },
          });
        }
      }
      continue;
    }
    if (movePlan) {
      frames.push({
        id: `${mouse.id}-move`,
        phase: 'mouse-move',
        description: `${mouse.id} moves to ${movePlan.destination}`,
        payload: { mouseId: mouse.id, from: plannedPosition, to: movePlan.destination },
      });
      occupancy.delete(plannedPosition);
      occupancy.set(movePlan.destination, { type: 'mouse', id: mouse.id });
      plannedPositions.set(mouse.id, movePlan.destination);
    }
  }

  const feedingMice = orderedMice
    .filter((mouse) => {
      const pos = plannedPositions.get(mouse.id);
      return pos && mouse.hearts > 0 && !mouse.stunned;
    })
    .map((mouse) => ({ id: mouse.id }));
  if (feedingMice.length > 0) {
    frames.push({
      id: 'mouse-feed',
      phase: 'mouse-feed',
      description: 'Resident mice feed',
      payload: { eaters: feedingMice.map((m) => m.id) },
    });
  }

  return frames;
}

export function findMovePlan(
  state: GameState,
  mouse: MouseState,
  origin: CellId,
  occupancy: Map<CellId, { type: 'cat' | 'mouse'; id: string }>
): { destination: CellId } | undefined {
  const maxSteps = mouse.attack;
  const visited = new Map<CellId, CellId | null>();
  const queue: { cell: CellId; steps: number }[] = [{ cell: origin, steps: 0 }];
  visited.set(origin, null);
  const candidates: { cell: CellId; steps: number }[] = [];

  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current.steps >= maxSteps) continue;
    for (const neighbor of getOrthNeighbors(current.cell)) {
      if (visited.has(neighbor)) continue;
      if (occupancy.has(neighbor)) continue;
      visited.set(neighbor, current.cell);
      const steps = current.steps + 1;
      candidates.push({ cell: neighbor, steps });
      queue.push({ cell: neighbor, steps });
    }
  }

  if (candidates.length === 0) return undefined;
  const shadowCandidates = candidates.filter((candidate) => isShadowBonus(candidate.cell));
  const selectionPool = shadowCandidates.length > 0 ? shadowCandidates : candidates;
  selectionPool.sort((a, b) => {
    if (isShadowBonus(a.cell) && !isShadowBonus(b.cell)) return -1;
    if (!isShadowBonus(a.cell) && isShadowBonus(b.cell)) return 1;
    if (a.steps !== b.steps) return a.steps - b.steps;
    return distanceToPerimeter(a.cell) - distanceToPerimeter(b.cell);
  });
  return { destination: selectionPool[0].cell };
}

function sortMiceForPhase(state: GameState): MouseState[] {
  return Object.values(state.mice)
    .filter((mouse) => mouse.position)
    .sort((a, b) => {
      const posA = a.position!;
      const posB = b.position!;
      const rowA = Number(posA[1]);
      const rowB = Number(posB[1]);
      if (rowA !== rowB) return rowB - rowA;
      return posA.localeCompare(posB);
    });
}

function getAdjacentCats(state: GameState, cellId: CellId): CatId[] {
  const neighbors = new Set(getNeighborCells(cellId));
  return Object.entries(state.cats)
    .filter(([, cat]) => cat.position && neighbors.has(cat.position) && cat.hearts > 0)
    .map(([id]) => id as CatId);
}

function pickMouseTarget(state: GameState, position: CellId): CatId | undefined {
  const neighbors = new Set(getNeighborCells(position));
  const candidates = Object.entries(state.cats)
    .filter(([, cat]) => cat.position && neighbors.has(cat.position!) && cat.hearts > 0)
    .map(([id, cat]) => ({ id: id as CatId, cat }));
  if (candidates.length === 0) return undefined;
  const guardian = candidates.find(({ id }) => id === 'guardian');
  if (guardian) return guardian.id;
  const frontCats = candidates
    .filter(({ cat }) => cat.position && (cat.position[1] === '5' || cat.position[1] === '4'))
    .sort((a, b) => a.cat.position!.localeCompare(b.cat.position!));
  if (frontCats.length > 0) return frontCats[0].id;
  return candidates.sort((a, b) => {
    if (a.cat.hearts !== b.cat.hearts) return a.cat.hearts - b.cat.hearts;
    return a.cat.position!.localeCompare(b.cat.position!);
  })[0].id;
}
