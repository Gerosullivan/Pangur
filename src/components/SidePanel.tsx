import { useMemo } from 'react';
import { useGameStore } from '../state/gameStore';
import { catDefinitions, CAT_STARTING_HEARTS } from '../lib/cats';
import { isShadowBonus, parseCell } from '../lib/board';
import { getBaircneAuraSummary, getCatEffectiveCatch, getCatEffectiveMeow, getCatRemainingCatch } from '../lib/mechanics';
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
  const cells = useGameStore((state) => state.cells);
  const finishPangurSequenceEarly = useGameStore((state) => state.finishPangurSequenceEarly);

  const detail = useMemo(() => {
    if (!selectedCatId) return undefined;
    const cat = cats[selectedCatId];
    if (!cat) return undefined;
    const definition = catDefinitions[selectedCatId];
    const context = { cats, cells };
    const effectiveCatch = getCatEffectiveCatch(context, selectedCatId);
    const effectiveMeow = getCatEffectiveMeow(context, selectedCatId);
    const remainingCatch = getCatRemainingCatch(context, selectedCatId);
    const aura = selectedCatId === 'baircne' ? getBaircneAuraSummary(context) : undefined;
    const catchParts = [`${definition.baseCatch} base`];
    const meowParts = [`${definition.baseMeow} base`];
    let positionLabel = 'Off board';
    let lane = '—';
    let laneModifier = '';

    if (cat.position) {
      const { row } = parseCell(cat.position);
      positionLabel = cat.position;
      lane = laneLabels[row];
      switch (row) {
        case 4:
          laneModifier = '×2 lane';
          break;
        case 3:
          break;
        case 2:
          laneModifier = '×0.5 lane';
          break;
        default:
          laneModifier = 'Lane suppresses meow';
          break;
      }
      if (isShadowBonus(cat.position)) {
        if (cat.shadowBonusActive) {
          catchParts.push('+1 shadow');
        } else {
          catchParts.push('(shadow bonus lost this turn)');
        }
      }
    } else {
      laneModifier = 'Off board';
    }

    if (aura?.catchBonus) {
      const sourceName = aura.catchSource ? catDefinitions[aura.catchSource].name : 'Aura';
      catchParts.push(`+${aura.catchBonus} aura (${sourceName})`);
    }
    if (aura?.meowBonus) {
      const sourceName = aura.meowSource ? catDefinitions[aura.meowSource].name : 'Aura';
      meowParts.push(`+${aura.meowBonus} aura (${sourceName})`);
    }

    let catchBreakdown = catchParts.join(' ');
    let meowBreakdown = '';
    if (laneModifier === 'Off board') {
      meowBreakdown = laneModifier;
    } else if (laneModifier === 'Lane suppresses meow') {
      meowBreakdown = laneModifier;
    } else {
      const parts = [...meowParts];
      if (laneModifier) {
        parts.push(laneModifier);
      }
      meowBreakdown = parts.join(' ');
    }

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
      aura,
    };
  }, [selectedCatId, cats, cells]);

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
        {detail.definition.id === 'baircne' && detail.aura?.catchBonus === 1 && <span className="badge secondary">Aura +1 Catch</span>}
        {detail.definition.id === 'baircne' && detail.aura?.meowBonus === 1 && <span className="badge secondary">Aura +1 Meow</span>}
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
