import { useGameStore } from '../state/gameStore';
import { getWaveSize } from '../lib/board';
import MousePiece from './MousePiece';

function IncomingLane() {
  const incomingQueue = useGameStore((state) => state.incomingQueue);
  const deterPreview = useGameStore((state) => state.deterPreview);
  const phase = useGameStore((state) => state.phase);
  const stepper = useGameStore((state) => state.stepper);

  const isIncomingSummaryFrame =
    phase === 'stepper' &&
    stepper?.currentPhase === 'incoming-wave' &&
    stepper.frames[stepper.index]?.phase === 'incoming-summary';

  // Use the summary frame payload when available so deterred count stays accurate during that step.
  const summaryDeterred =
    isIncomingSummaryFrame && stepper?.frames[stepper.index]?.phase === 'incoming-summary'
      ? (stepper.frames[stepper.index].payload as { deterred: number }).deterred
      : undefined;

  const slots = Array.from({ length: getWaveSize() }, (_, idx) => {
    const mouse = incomingQueue[idx];
    // Show deterred styling only in preview (cat phase) and the incoming summary frame.
    const shouldShowDeterred =
      phase !== 'stepper' || isIncomingSummaryFrame;
    const deterredCount = summaryDeterred ?? deterPreview.deterred;
    const isDeterred = shouldShowDeterred && idx < deterredCount;
    return { mouse, isDeterred };
  });

  const title =
    'Next Wave: six slots preview incoming mice. Cats on entrances add meow; deterred mice (😱) leave before placement, remaining (🐭) try to enter.';

  return (
    <div className="incoming-lane">
      <div className="incoming-slot-grid" aria-label="Incoming mice slots" title={title}>
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
