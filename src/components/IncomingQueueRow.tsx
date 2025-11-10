import { useMemo } from 'react';
import { useGameStore } from '../state/gameStore';
import type { EntryDirection } from '../types';

function IncomingQueueRow() {
  const incomingQueues = useGameStore((state) => state.incomingQueues);
  const deterPreview = useGameStore((state) => state.deterPreview);

  const totalQueued = useMemo(
    () => Object.values(incomingQueues).reduce((sum, queue) => sum + queue.length, 0),
    [incomingQueues]
  );

  const entryChips = useMemo(() => {
    const entries = Object.values(deterPreview.perEntry);
    if (entries.length === 0) return [];
    return entries
      .sort((a, b) => {
        const dirDiff = directionPriority(a.direction) - directionPriority(b.direction);
        if (dirDiff !== 0) return dirDiff;
        return a.cellId.localeCompare(b.cellId);
      })
      .map((detail) => {
        const queued = incomingQueues[detail.cellId]?.length ?? detail.incoming;
        return (
          <div key={detail.cellId} className="entry-chip">
            <span className="chip-cell">{detail.cellId.toUpperCase()}</span>
            <span className="chip-count">
              {queued} 🐭 · Meow {detail.meow}
            </span>
          </div>
        );
      });
  }, [incomingQueues, deterPreview.perEntry]);

  return (
    <div className="incoming-row">
      <div className="incoming-summary">
        <span>Total queued: {totalQueued}</span>
        <span>Deterring: {deterPreview.scared} · Entering: {deterPreview.entering}</span>
      </div>
      <div className="entry-chip-row">
        {entryChips.length > 0 ? entryChips : <span className="deterrence-info">No entry points configured.</span>}
      </div>
    </div>
  );
}

function directionPriority(direction: EntryDirection): number {
  const order: EntryDirection[] = ['north', 'east', 'south', 'west'];
  const index = order.indexOf(direction);
  return index === -1 ? order.length : index;
}

export default IncomingQueueRow;
