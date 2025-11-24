import { useMemo } from 'react';
import { useGameStore } from '../state/gameStore';

interface IncomingQueueRowProps {
  variant?: 'default' | 'overlay';
}

function IncomingQueueRow({ variant = 'default' }: IncomingQueueRowProps) {
  const deterPreview = useGameStore((state) => state.deterPreview);
  const incomingQueue = useGameStore((state) => state.incomingQueue);
  const queueSize = incomingQueue.length;

  const icons = useMemo(() => {
    const scared = Math.min(deterPreview.meowge, queueSize);
    return Array.from({ length: queueSize }, (_, index) => (index < scared ? '😱' : '🐭'));
  }, [deterPreview.meowge, queueSize]);

  return (
    <div className={`incoming-row ${variant === 'overlay' ? 'overlay' : ''}`}>
      <div className="incoming-summary">
        <span className="next-wave-label">Next Wave</span>
        <div className="incoming-icons" aria-label="Next wave mice">
          {icons.map((icon, idx) => (
            <span key={idx}>{icon}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default IncomingQueueRow;
