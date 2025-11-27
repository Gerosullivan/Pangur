import { useMemo } from 'react';
import { useGameStore } from '../state/gameStore';
import { catDefinitions } from '../lib/cats';

function ActionArea() {
  const phase = useGameStore((state) => state.phase);
  const handCats = useGameStore((state) => state.handCats);
  const confirmFormation = useGameStore((state) => state.confirmFormation);
  const endCatPhase = useGameStore((state) => state.endCatPhase);
  const advanceStepper = useGameStore((state) => state.advanceStepper);
  const stepper = useGameStore((state) => state.stepper);
  const resetGame = useGameStore((state) => state.resetGame);
  const focusNextCat = useGameStore((state) => state.focusNextCat);
  const selectedCatId = useGameStore((state) => state.selectedCatId);
  const status = useGameStore((state) => state.status);
  const cats = useGameStore((state) => state.cats);

  const progressLabel = useMemo(() => {
    if (!stepper) return '';
    const current = Math.min(stepper.index + 1, stepper.frames.length);
    return `${current}/${stepper.frames.length}`;
  }, [stepper]);
  const currentDescription = stepper?.frames[stepper.index]?.description ?? '';

  if (phase === 'setup') {
    return (
      <div className="action-area">
        <div className="setup-hint">← Drag cats onto interior cells to plan your opening (rearrange freely until confirmed)</div>
        <button
          type="button"
          className={`button-primary ${handCats.length > 0 ? 'button-disabled' : ''}`}
          onClick={confirmFormation}
          disabled={handCats.length > 0}
        >
          Confirm Formation
        </button>
      </div>
    );
  }

  if (phase === 'stepper' && stepper) {
    return (
      <div className="action-area">
        <div className="stepper-rail">
          <button
            type="button"
            className="button-secondary button-disabled"
            disabled
          >
            Previous
          </button>
          <button
            type="button"
            className={`button-primary ${stepper.index >= stepper.frames.length ? 'button-disabled' : ''}`}
            onClick={advanceStepper}
            disabled={stepper.index >= stepper.frames.length}
          >
            Next
          </button>
          <span className="stepper-label">
            {stepper.label} · {progressLabel}
          </span>
          <span className="deterrence-info">{currentDescription}</span>
        </div>
        {status.state !== 'playing' && (
          <div className="deterrence-info">
            {status.state === 'won' ? 'Victory achieved!' : 'Defeat.'} {status.reason ?? ''}
          </div>
        )}
        <button type="button" className="button-secondary" onClick={resetGame}>
          Restart Game
        </button>
      </div>
    );
  }

  if (status.state !== 'playing') {
    return (
      <div className="action-area">
        <div className="deterrence-info">
          {status.state === 'won' ? 'Victory achieved!' : 'Defeat.'} {status.reason ?? ''}
        </div>
        <button type="button" className="button-primary" onClick={resetGame}>
          Restart Game
        </button>
      </div>
    );
  }

  return (
    <div className="action-area">
      <div className="action-controls">
        <button type="button" className="button-primary" onClick={endCatPhase}>
          End Turn
        </button>
        <button type="button" className="button-secondary" onClick={focusNextCat}>
          Focus Next Cat
        </button>
        <button type="button" className="button-secondary" onClick={resetGame}>
          Restart Game
        </button>
      </div>
      <div className="action-messages">
        {selectedCatId && <div className="deterrence-info">Active: {catDefinitions[selectedCatId].name}</div>}
      </div>
    </div>
  );
}

export default ActionArea;
