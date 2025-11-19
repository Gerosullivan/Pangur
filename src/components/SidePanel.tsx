import { useMemo } from 'react';
import { useGameStore } from '../state/gameStore';
import { catDefinitions, CAT_STARTING_HEARTS } from '../lib/cats';
import { isShadowBonus } from '../lib/board';
import { getCatEffectiveCatch, getCatEffectiveMeow, getCatRemainingCatch, isBaircneShielded } from '../lib/mechanics';

function SidePanel() {
  const selectedCatId = useGameStore((state) => state.selectedCatId);
  const cats = useGameStore((state) => state.cats);
  const cells = useGameStore((state) => state.cells);

  const detail = useMemo(() => {
    if (!selectedCatId) return undefined;
    const cat = cats[selectedCatId];
    if (!cat) return undefined;
    const definition = catDefinitions[selectedCatId];
    const context = { cats, cells };
    const effectiveCatch = getCatEffectiveCatch(context, selectedCatId);
    const effectiveMeow = getCatEffectiveMeow(context, selectedCatId);
    const remainingCatch = getCatRemainingCatch(context, selectedCatId);
    const catchParts = [`${definition.baseCatch} base`];
    const meowParts = [`${definition.baseMeow} base`];
    let positionLabel = 'Off board';
    if (cat.position) {
      positionLabel = cat.position;
      if (isShadowBonus(cat.position)) {
        if (cat.shadowBonusActive) {
          catchParts.push('+1 shadow');
        } else {
          catchParts.push('(shadow bonus lost this turn)');
        }
      }
    }

    const pangurShield = selectedCatId === 'baircne' && isBaircneShielded(context);
    if (pangurShield) {
      catchParts.push('+1 Pangur shield');
    }

    let catchBreakdown = catchParts.join(' ');
    let meowBreakdown = meowParts.join(' ');

    const hearts = `${'❤️'.repeat(Math.max(cat.hearts, 0))}${'🤍'.repeat(
      Math.max(CAT_STARTING_HEARTS - Math.max(cat.hearts, 0), 0)
    )}`;

    return {
      definition,
      cat,
      effectiveCatch,
      effectiveMeow,
      catchBreakdown,
      meowBreakdown,
      positionLabel,
      remainingCatch,
      hearts,
      pangurShield,
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
        <strong>Position:</strong> {detail.positionLabel}
      </div>
      <div className="badge-row">
        {detail.cat.movesRemaining === 0 && <span className="badge secondary">Moves spent</span>}
        {detail.cat.turnEnded && <span className="badge">Turn Locked</span>}
        {detail.remainingCatch === 0 && <span className="badge">Catch 0</span>}
        {detail.definition.id === 'baircne' && detail.pangurShield && <span className="badge secondary">Pangur’s Shield +1 Catch</span>}
      </div>
    </aside>
  );
}
export default SidePanel;
