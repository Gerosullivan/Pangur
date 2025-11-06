import { useMemo } from 'react';
import { useGameStore } from '../state/gameStore';

function IncomingQueueRow() {
  const incomingQueue = useGameStore((state) => state.incomingQueue);
  const deterPreview = useGameStore((state) => state.deterPreview);

  const icons = useMemo(() => {
    const scared = Array.from({ length: deterPreview.scared }, (_, index) => (
      <span key={`scared-${index}`} className="queue-piece scared" role="img" aria-hidden>
        😱
      </span>
    ));
    const remaining = Math.max(incomingQueue.length - deterPreview.scared, 0);
    const entering = Array.from({ length: remaining }, (_, index) => (
      <span key={`incoming-${index}`} className="queue-piece" role="img" aria-hidden>
        🐭
      </span>
    ));
    return [...scared, ...entering];
  }, [incomingQueue.length, deterPreview.scared]);

  return (
    <div className="incoming-row">
      <div className="queue-row" aria-label="Incoming mice queue">
        {icons.length > 0 ? icons : <span className="deterrence-info">No mice queued</span>}
      </div>
      <div className="deterrence-info">Deterring: {deterPreview.scared} · Entering: {deterPreview.entering}</div>
    </div>
  );
}

export default IncomingQueueRow;
