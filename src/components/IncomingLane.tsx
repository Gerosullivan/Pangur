import { useGameStore } from '../state/gameStore';
import MousePiece from './MousePiece';

function IncomingLane() {
  const incomingQueue = useGameStore((state) => state.incomingQueue);
  const deterPreview = useGameStore((state) => state.deterPreview);
  const phase = useGameStore((state) => state.phase);
  const stepper = useGameStore((state) => state.stepper);

  const isResolvingIncomingWave =
    phase === 'stepper' && stepper?.currentPhase === 'incoming-wave';

  const slots = Array.from({ length: 6 }, (_, idx) => {
    const mouse = incomingQueue[idx];
    // During incoming resolution, remaining mice should appear normal.
    const isDeterred = isResolvingIncomingWave ? false : idx < deterPreview.deterred;
    return { mouse, isDeterred };
  });

  return (
    <div className="incoming-lane">
      <div className="incoming-slot-grid" aria-label="Incoming mice slots">
        {slots.map((slot, idx) => (
          <div key={idx} className="incoming-slot" aria-label={`Incoming slot ${idx + 1}`}>
            {slot.mouse && (
              <div className={`incoming-mouse-piece ${slot.isDeterred ? 'deterred' : ''}`}>
                <MousePiece mouse={slot.mouse} scared={slot.isDeterred} />
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default IncomingLane;
