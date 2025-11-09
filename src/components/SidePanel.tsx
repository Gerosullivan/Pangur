import { useMemo } from 'react';
import { useGameStore } from '../state/gameStore';
import { catDefinitions, CAT_STARTING_HEARTS } from '../lib/cats';
import { isShadowBonus, parseCell } from '../lib/board';
import type { CatState } from '../types';
const laneLabels: Record<number, string> = {
  4: 'Meow x2 (Entrance)',
  3: 'Meow x1',
  2: 'Meow x0.5 (rounded down)',
  1: 'No Meow (Back wall)',
};

function SidePanel() {
  const selectedCatId = useGameStore((state) => state.selectedCatId);
  const cats = useGameStore((state) => state.cats);
  const finishPangurSequenceEarly = useGameStore((state) => state.finishPangurSequenceEarly);

  const detail = useMemo(() => {
    if (!selectedCatId) return undefined;
    const cat = cats[selectedCatId];
    if (!cat) return undefined;
    const definition = catDefinitions[selectedCatId];
    let effectiveCatch = definition.baseCatch;
    let catchBreakdown = `${definition.baseCatch} base`;
    let effectiveMeow = 0;
    let meowBreakdown = `${definition.baseMeow} base`;
    let positionLabel = 'Off board';
    let lane = '—';

    if (cat.position) {
      const { row } = parseCell(cat.position);
      positionLabel = cat.position;
      switch (row) {
        case 4:
          effectiveMeow = definition.baseMeow * 2;
          meowBreakdown = `${definition.baseMeow} base ×2 lane`;
          break;
        case 3:
          effectiveMeow = definition.baseMeow;
          meowBreakdown = `${definition.baseMeow} base`;
          break;
        case 2:
          effectiveMeow = Math.floor(definition.baseMeow * 0.5);
          meowBreakdown = `${definition.baseMeow} base ×0.5 lane`;
          break;
        default:
          effectiveMeow = 0;
          meowBreakdown = `Lane suppresses meow`;
          break;
      }
      lane = laneLabels[row];
      if (isShadowBonus(cat.position)) {
        effectiveCatch += 1;
        catchBreakdown = `${definition.baseCatch} base +1 shadow`;
      }
    }

    const remainingCatch = Math.max(effectiveCatch - cat.catchSpent, 0);
    const hearts = `${'❤️'.repeat(Math.max(cat.hearts, 0))}${'🤍'.repeat(
      Math.max(CAT_STARTING_HEARTS - Math.max(cat.hearts, 0), 0)
    )}`;

    const sequenceInfo = selectedCatId === 'pangur' ? getPangurSequenceInfo(cat) : undefined;

    return {
      definition,
      cat,
      effectiveCatch,
      effectiveMeow,
      catchBreakdown,
      meowBreakdown,
      positionLabel,
      lane,
      remainingCatch,
      hearts,
      sequenceInfo,
    };
  }, [selectedCatId, cats]);

  if (!detail) {
    return (
      <aside className="side-panel">
        <h2>Select a cat</h2>
        <p className="setup-hint">Tap a cat on the board to inspect their stats and turn status.</p>
      </aside>
    );
  }

  return (
    <aside className="side-panel">
      <h2>{detail.definition.name}</h2>
      <span className="role">{detail.definition.role}</span>
      <div className="piece-portrait" aria-hidden>
        {detail.definition.portrait}
      </div>
      <div className="piece-hearts" aria-label="Hearts">
        {detail.hearts}
      </div>
      <div>
        <strong>Catch:</strong> {detail.effectiveCatch} ({detail.catchBreakdown})
      </div>
      <div>
        <strong>Meow:</strong> {detail.effectiveMeow} ({detail.meowBreakdown})
      </div>
      <div>
        <strong>Remaining Catch:</strong> {detail.remainingCatch}
      </div>
      <div>
        <strong>Position:</strong> {detail.positionLabel} — {detail.lane}
      </div>
      <div className="badge-row">
        {detail.cat.moveUsed && <span className="badge secondary">Moved</span>}
        {detail.cat.turnEnded && <span className="badge">Turn Locked</span>}
        {detail.remainingCatch === 0 && <span className="badge">Catch 0</span>}
      </div>
      {detail.sequenceInfo && (
        <div className="pangur-sequence">
          <div className="pangur-sequence-header">
            <span className="badge secondary">{detail.sequenceInfo.badge}</span>
            <span>{detail.sequenceInfo.helper}</span>
          </div>
          <button type="button" className="button-quiet" onClick={finishPangurSequenceEarly}>
            Finish Pangur Sequence
          </button>
        </div>
      )}
    </aside>
  );
}

export default SidePanel;

function getPangurSequenceInfo(cat: CatState): { badge: string; helper: string } | undefined {
  if (cat.id !== 'pangur') return undefined;
  if (!cat.specialSequence) return undefined;
  if (cat.specialLeg === 'idle' || cat.specialLeg === 'complete') return undefined;
  const badge = cat.specialSequence === 'move-attack-move' ? 'MAM' : 'AMA';
  let helper = '';
  switch (cat.specialLeg) {
    case 'attack-after-move':
      helper = 'Attack from this cell, then take Pangur’s final move.';
      break;
    case 'second-move':
      helper = 'Final move unlocked. Relocate once more or finish early.';
      break;
    case 'move-after-attack':
      helper = 'You can relocate once before spending the remaining catch.';
      break;
    case 'final-attack':
      helper = 'Finish attacking from the new cell or end the sequence early.';
      break;
    default:
      helper = '';
  }
  return { badge, helper };
}
