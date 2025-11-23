import { getDeterrenceSnapshot, createMouse } from './mechanics';
import { collectMouseLineCandidates } from './mouseLines';
import { getEntryCells, isShadowBonus, getWaveSize } from './board';
import type { CellId, GameState, OccupantRef, StepFrame } from '../types';

// Plans incoming wave frames (summary, scare, placements, finish) to keep the stepper focused.
export function buildIncomingPhaseFrames(state: GameState): StepFrame[] {
  const frames: StepFrame[] = [];
  const snapshot = getDeterrenceSnapshot(state);
  frames.push({
    id: 'incoming-summary',
    phase: 'incoming-summary',
    description: `Meowge ${snapshot.meowge} · ${snapshot.deterred} flee`,
    payload: snapshot,
  });
  if (snapshot.deterred > 0) {
    frames.push({
      id: 'incoming-scare',
      phase: 'incoming-scare',
      description: `${snapshot.deterred} mice flee the queue`,
      payload: { amount: snapshot.deterred },
    });
  }
  const placements = planIncomingPlacements(state, snapshot.entering);
  placements.forEach((placement, index) => {
    frames.push({
      id: `incoming-place-${index}`,
      phase: 'incoming-place',
      description: `Mouse enters at ${placement.cellId}`,
      payload: placement,
    });
  });
  frames.push({
    id: 'incoming-finish',
    phase: 'incoming-finish',
    description: 'Incoming wave resolved',
    payload: snapshot,
  });
  return frames;
}

export function planIncomingPlacements(state: GameState, entering: number): Array<{ cellId: CellId; gateId: CellId }> {
  if (entering <= 0) return [];
  const placements: Array<{ cellId: CellId; gateId: CellId }> = [];
  const entries = getEntryCells().sort((a, b) => a.id.localeCompare(b.id));
  const occupancy = new Set(
    Object.values(state.cells)
      .filter((cell) => cell.occupant)
      .map((cell) => cell.id)
  );
  const virtualBoard = new Map<CellId, OccupantRef | undefined>();
  (Object.keys(state.cells) as CellId[]).forEach((cellId) => {
    virtualBoard.set(cellId, state.cells[cellId].occupant);
  });

  let remaining = entering;
  const waveSize = getWaveSize();
  remaining = Math.min(remaining, waveSize);
  entries.forEach((entry) => {
    if (remaining <= 0) return;
    if (virtualBoard.get(entry.id)?.type === 'cat') return;
    const virtualMice = new Set<CellId>(
      Array.from(virtualBoard.entries())
        .filter(([, occ]) => occ?.type === 'mouse')
        .map(([cellId]) => cellId)
    );
    while (remaining > 0) {
      const candidates = collectMouseLineCandidates(virtualBoard, entry.id, occupancy, virtualMice);
      if (candidates.length === 0) break;
      candidates.sort((a, b) => {
        const aShadow = isShadowBonus(a.cell);
        const bShadow = isShadowBonus(b.cell);
        if (aShadow !== bShadow) return aShadow ? -1 : 1;
        if (a.depth !== b.depth) return a.depth - b.depth;
        return a.cell.localeCompare(b.cell);
      });
      const candidate = candidates.shift();
      if (!candidate) break;
      placements.push({ cellId: candidate.cell, gateId: entry.id });
      occupancy.add(candidate.cell);
      virtualMice.add(candidate.cell);
      virtualBoard.set(candidate.cell, { type: 'mouse', id: `virtual-${candidate.cell}` });
      remaining -= 1;
    }
  });
  return placements;
}

export function replenishIncomingQueue(queue: GameState['incomingQueue']): GameState['incomingQueue'] {
  const waveSize = getWaveSize();
  const copy = [...queue];
  while (copy.length < waveSize) {
    const queuedId = `queue-${Date.now()}-${copy.length}`;
    copy.push(createMouse(queuedId, 1));
  }
  return copy;
}
