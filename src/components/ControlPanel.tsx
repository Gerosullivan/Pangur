import { useMemo, type DragEvent } from 'react';
import { useGameStore } from '../state/gameStore';
import { catDefinitions } from '../lib/cats';
import CatPiece from './CatPiece';
import type { CatId } from '../types';

function ControlPanel() {
  const phase = useGameStore((state) => state.phase);
  const handCats = useGameStore((state) => state.handCats);
  const cats = useGameStore((state) => state.cats);
  const confirmFormation = useGameStore((state) => state.confirmFormation);
  const endCatPhase = useGameStore((state) => state.endCatPhase);
  const advanceStepper = useGameStore((state) => state.advanceStepper);
  const stepper = useGameStore((state) => state.stepper);
  const selectedCatId = useGameStore((state) => state.selectedCatId);
  const status = useGameStore((state) => state.status);

  const progressLabel = useMemo(() => {
    if (!stepper) return '';
    const current = Math.min(stepper.index + 1, stepper.frames.length);
    return `${current}/${stepper.frames.length}`;
  }, [stepper]);
  const currentDescription = stepper?.frames[stepper.index]?.description ?? '';

  const handleDragStart = (event: DragEvent<HTMLDivElement>, catId: CatId) => {
    // Transfer the cat ID for drop handling
    event.dataTransfer.setData('text/plain', catId);
    event.dataTransfer.effectAllowed = 'move';

    // The browser will automatically use the dragged element as the drag preview
    // which includes the full piece (border, stats, hearts, and images)
  };

  return (
    <div className="control-panel">
      {/* Instruction line - show during setup */}
      {phase === 'setup' && (
        <div className="panel-instruction">
          Drag cats onto interior cells.
        </div>
      )}

      {/* Cat staging area - show during setup */}
      {phase === 'setup' && (
        <div className="panel-staging">
          {handCats.map((catId) => {
            const definition = catDefinitions[catId];
            const cat = cats[catId];
            return (
              <div key={catId} className="cat-staging-piece">
                <CatPiece
                  cat={cat}
                  catId={catId}
                  effectiveCatch={definition.baseCatch}
                  effectiveMeow={definition.baseMeow}
                  remainingCatch={definition.baseCatch}
                  isSelected={false}
                  cellRef={`staging-${catId}`}
                  inHand
                  draggable
                  onDragStart={(event) => handleDragStart(event, catId)}
                />
              </div>
            );
          })}
        </div>
      )}

      {/* Action/info sub-area - always visible */}
      <div className="panel-actions">
        {/* Setup phase: Confirm Formation button */}
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

        {/* Stepper phase: Next button, stepper label, description */}
        {phase === 'stepper' && stepper && (
          <>
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
          </>
        )}

        {/* Game over message */}
        {status.state !== 'playing' && phase !== 'setup' && (
          <div className="deterrence-info">
            {status.state === 'won' ? 'Victory achieved!' : 'Defeat.'} {status.reason ?? ''}
          </div>
        )}

        {/* Cat phase (normal play): End Turn button and active cat info */}
        {phase === 'cat' && status.state === 'playing' && (
          <>
            <button type="button" className="button-primary" onClick={endCatPhase}>
              End Turn
            </button>
            {selectedCatId && (
              <div className="deterrence-info">Active: {catDefinitions[selectedCatId].name}</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

export default ControlPanel;
