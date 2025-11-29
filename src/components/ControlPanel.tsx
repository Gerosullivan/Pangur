import { useMemo, type DragEvent } from 'react';
import { useGameStore } from '../state/gameStore';
import { catDefinitions } from '../lib/cats';
import { getCatRemainingCatch } from '../lib/mechanics';
import CatPiece from './CatPiece';
import type { CatId } from '../types';

function ControlPanel() {
  const phase = useGameStore((state) => state.phase);
  const handCats = useGameStore((state) => state.handCats);
  const cats = useGameStore((state) => state.cats);
  const confirmFormation = useGameStore((state) => state.confirmFormation);
  const endCatPhase = useGameStore((state) => state.endCatPhase);
  const advanceStepper = useGameStore((state) => state.advanceStepper);
  const log = useGameStore((state) => state.log);
  const stepper = useGameStore((state) => state.stepper);
  const selectedCatId = useGameStore((state) => state.selectedCatId);
  const status = useGameStore((state) => state.status);
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

  const handleExportLog = () => {
    if (!log || log.length === 0) return;
    const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'pangur-log.json';
    link.click();
    URL.revokeObjectURL(url);
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
        <div className="panel-info">
          {/* Stepper phase info */}
          {phase === 'stepper' && stepper && (
            <>
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

          {/* Active cat info */}
          {phase === 'cat' && status.state === 'playing' && selectedCatId && (
            <div className="deterrence-info">Active: {catDefinitions[selectedCatId].name}</div>
          )}
        </div>

        <div className="panel-buttons">
          {/* Utility: Export log */}
          <button
            type="button"
            className={`button-secondary ${log.length === 0 ? 'button-disabled' : ''}`}
            onClick={handleExportLog}
            disabled={log.length === 0}
          >
            Export Log
          </button>

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

          {/* Stepper phase: Next button */}
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

          {/* Cat phase (normal play): End Turn button */}
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
    </div>
  );
}

export default ControlPanel;
