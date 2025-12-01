import { useMemo } from 'react';
import { useGameStore } from '../state/gameStore';
import { catDefinitions, CAT_STARTING_HEARTS } from '../lib/cats';
import { isShadowBonus } from '../lib/board';
import { getCatEffectiveCatch, getCatEffectiveMeow, getCatRemainingCatch, isBondedStrikeActive } from '../lib/mechanics';

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
    const spentCatch = cats[selectedCatId].catchSpent;
    let positionLabel = 'Off board';
    if (cat.shadowBonusActive) {
      catchParts.push('+1 shadow (active)');
    } else if (cat.position && isShadowBonus(cat.position)) {
      catchParts.push(cat.shadowBonusPrimed ? '+1 shadow (primed)' : '(shadow bonus lost this turn)');
    }
    if (cat.position) {
      positionLabel = cat.position;
    }

    const bondedStrike = selectedCatId === 'baircne' && isBondedStrikeActive(context);
    if (bondedStrike) {
      catchParts.push('+1 Bonded Strike (near Pangur)');
    }
    if (spentCatch > 0) {
      catchParts.push(`-${spentCatch} spent`);
    }

    let catchBreakdown = catchParts.join(' ');

    const hearts = `${'❤️'.repeat(Math.max(cat.hearts, 0))}${'🤍'.repeat(
      Math.max(CAT_STARTING_HEARTS - Math.max(cat.hearts, 0), 0)
    )}`;

    return {
      definition,
      cat,
      effectiveCatch,
      effectiveMeow,
      catchBreakdown,
      positionLabel,
      remainingCatch,
      hearts,
      bondedStrike,
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
      <div className="side-panel-grid">
        <div className="side-panel-left">
          <img
            className="piece-portrait"
            src={detail.definition.portraitSrc}
            alt={`${detail.definition.name} portrait`}
          />
          <div className="piece-hearts" aria-label="Hearts">
            {detail.hearts}
          </div>
        </div>
        <div className="side-panel-right">
          <div>
            <strong>Catch:</strong> {detail.remainingCatch} ({detail.catchBreakdown})
          </div>
          <div>
            <strong>Meow:</strong> {detail.effectiveMeow}
          </div>
          <div>
            <strong>Moves Remaining:</strong> {detail.cat.movesRemaining}
          </div>
          <div>
            <strong>Position:</strong> {detail.positionLabel}
          </div>
          <div className="badge-row">
            {detail.cat.turnEnded && <span className="badge">Turn Locked</span>}
            {detail.definition.id === 'baircne' && detail.bondedStrike && <span className="badge secondary">Bonded Strike +1 Catch near Pangur</span>}
          </div>
        </div>
      </div>
    </aside>
  );
}
export default SidePanel;
