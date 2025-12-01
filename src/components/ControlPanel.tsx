import { useMemo, type DragEvent } from "react";
import { useGameStore } from "../state/gameStore";
import { catDefinitions } from "../lib/cats";
import { computeScoreBreakdown } from "../lib/scoring";
import CatPiece from "./CatPiece";
import type { CatId } from "../types";

function ControlPanel() {
  const phase = useGameStore((state) => state.phase);
  const handCats = useGameStore((state) => state.handCats);
  const cats = useGameStore((state) => state.cats);
  const stepper = useGameStore((state) => state.stepper);
  const selectedCatId = useGameStore((state) => state.selectedCatId);
  const status = useGameStore((state) => state.status);
  const modeId = useGameStore((state) => state.modeId);
  const wave = useGameStore((state) => state.wave);
  const grainLoss = useGameStore((state) => state.grainLoss);

  const progressLabel = useMemo(() => {
    if (!stepper) return "";
    const current = Math.min(stepper.index + 1, stepper.frames.length);
    return `${current}/${stepper.frames.length}`;
  }, [stepper]);
  const currentDescription = stepper?.frames[stepper.index]?.description ?? "";

  const handleDragStart = (event: DragEvent<HTMLDivElement>, catId: CatId) => {
    // Transfer the cat ID for drop handling
    event.dataTransfer.setData("text/plain", catId);
    event.dataTransfer.effectAllowed = "move";

    // The browser will automatically use the dragged element as the drag preview
    // which includes the full piece (border, stats, hearts, and images)
  };

  const scoreSummary = useMemo(() => {
    if (status.state !== "won") return undefined;
    return computeScoreBreakdown({
      status,
      modeId,
      wave,
      grainLoss,
      cats,
    });
  }, [status, modeId, wave, grainLoss, cats]);

  return (
    <div className="control-panel">
      {/* Instruction line - show during setup */}
      {phase === "setup" && (
        <div className="panel-instruction">Drag cats onto free cells.</div>
      )}

      {/* Cat staging area - show during setup */}
      {phase === "setup" && (
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
      <div className="panel-info">
        {/* Stepper phase info */}
        {phase === "stepper" && stepper && (
          <>
            <span className="stepper-label">
              {stepper.label} · {progressLabel}
            </span>
            <span className="deterrence-info">{currentDescription}</span>
          </>
        )}

        {/* Game over message */}
        {status.state !== "playing" && phase !== "setup" && (
          <div
            className={`deterrence-info ${
              status.state === "won"
                ? "result-banner win"
                : "result-banner loss"
            }`}
          >
            {status.state === "won" ? "Victory achieved!" : "Game over."}{" "}
            {status.reason ?? ""}
          </div>
        )}

        {status.state === "won" && scoreSummary && (
          <div className="score-summary">
            <div className="score-total">Score {scoreSummary.score}</div>
            <div className="score-breakdown">
              <span>
                Finish wave {scoreSummary.finishWave} (+{scoreSummary.waveScore})
              </span>
              <span>
                Grain saved {scoreSummary.grainSaved} (+{scoreSummary.grainBonus})
              </span>
              <span>
                Full-health cats {scoreSummary.catsFullHealth} (+{scoreSummary.fullHealthBonus})
              </span>
            </div>
          </div>
        )}

        {/* Active cat info */}
        {phase === "cat" && status.state === "playing" && selectedCatId && (
          <div className="deterrence-info">
            Active: {catDefinitions[selectedCatId].name}
          </div>
        )}
      </div>
    </div>
  );
}

export default ControlPanel;
