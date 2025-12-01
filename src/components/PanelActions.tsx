import { useGameStore } from '../state/gameStore';
import { getCatRemainingCatch } from '../lib/mechanics';

function PanelActions() {
  const phase = useGameStore((state) => state.phase);
  const status = useGameStore((state) => state.status);
  const handCats = useGameStore((state) => state.handCats);
  const confirmFormation = useGameStore((state) => state.confirmFormation);
  const stepper = useGameStore((state) => state.stepper);
  const advanceStepper = useGameStore((state) => state.advanceStepper);
  const endCatPhase = useGameStore((state) => state.endCatPhase);
  const allCatsLocked = useGameStore((state) => {
    if (state.phase !== 'cat' || state.status.state !== 'playing') return false;
    const activeCats = state.catOrder.filter((id) => state.cats[id].position);
    if (activeCats.length === 0) return false;
    return activeCats.every((id) => {
      const cat = state.cats[id];
      const remainingCatch = getCatRemainingCatch(state, id);
      return cat.turnEnded || (cat.movesRemaining <= 0 && remainingCatch <= 0);
    });
  });

  return (
    <div className="panel-actions">
      <div className={`panel-buttons single ${phase === 'stepper' ? 'stepper-right' : ''}`}>
        {phase === 'setup' && (
          <button
            type="button"
            className={`button-primary ${handCats.length > 0 ? 'button-disabled' : ''}`}
            onClick={confirmFormation}
            disabled={handCats.length > 0}
          >
            Confirm Formation
          </button>
        )}

        {phase === 'stepper' && stepper && (
          <button
            type="button"
            className={`button-primary ${stepper.index >= stepper.frames.length ? 'button-disabled' : ''}`}
            onClick={advanceStepper}
            disabled={stepper.index >= stepper.frames.length}
          >
            Next
          </button>
        )}

        {phase === 'cat' && status.state === 'playing' && (
          <button
            type="button"
            className={`button-primary ${allCatsLocked ? 'button-flash' : ''}`}
            onClick={endCatPhase}
          >
            End Turn
          </button>
        )}
      </div>
    </div>
  );
}

export default PanelActions;
