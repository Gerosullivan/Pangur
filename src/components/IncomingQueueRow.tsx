import { useMemo } from 'react';
import { useGameStore } from '../state/gameStore';

const MAX_WAVE_SIZE = 6;

function IncomingQueueRow() {
  const deterPreview = useGameStore((state) => state.deterPreview);

  const icons = useMemo(() => {
    const scared = Math.min(deterPreview.meowge, MAX_WAVE_SIZE);
    return Array.from({ length: MAX_WAVE_SIZE }, (_, index) => (index < scared ? '😱' : '🐭'));
  }, [deterPreview.meowge]);

  return (
    <div className="incoming-row">
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
