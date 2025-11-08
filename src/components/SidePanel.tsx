import { useMemo } from 'react';
import { useGameStore } from '../state/gameStore';
import { catDefinitions, CAT_STARTING_HEARTS } from '../lib/cats';
import { isShadowBonus, parseCell } from '../lib/board';
const laneLabels: Record<number, string> = {
  4: 'Meow x2 (Entrance)',
  3: 'Meow x1',
  2: 'Meow x0.5 (rounded down)',
  1: 'No Meow (Back wall)',
};

function SidePanel() {
  const selectedCatId = useGameStore((state) => state.selectedCatId);
  const cats = useGameStore((state) => state.cats);

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
        {selectedCatId === 'pangur' && detail.cat.specialSequence && (
          <span className="badge" title={detail.cat.specialSequence === 'move-attack-move' ? 'Move-Attack-Move sequence' : 'Attack-Move-Attack sequence'}>
            {detail.cat.specialSequence === 'move-attack-move' ? 'MAM' : 'AMA'}
          </span>
        )}
      </div>
      {selectedCatId === 'pangur' && detail.cat.specialSequence && (
        <div className="sequence-status">
          <strong>Pangur Sequence:</strong>{' '}
          {detail.cat.specialSequence === 'move-attack-move' && (
            <>
              {detail.cat.sequenceMoveCount === 0 && 'Ready to move (1st)'}
              {detail.cat.sequenceMoveCount === 1 && !detail.cat.sequenceAttackStarted && 'Moved (1st) - Attack next'}
              {detail.cat.sequenceMoveCount === 1 && detail.cat.sequenceAttackStarted && `Attacked - Can move again (${detail.remainingCatch} catch left)`}
              {detail.cat.sequenceMoveCount === 2 && 'Completed'}
            </>
          )}
          {detail.cat.specialSequence === 'attack-move-attack' && (
            <>
              {detail.cat.sequenceMoveCount === 0 && detail.cat.sequenceAttackStarted && `Attacked - Can move (${detail.remainingCatch} catch left)`}
              {detail.cat.sequenceMoveCount === 1 && `Moved - Can attack (${detail.remainingCatch} catch left)`}
            </>
          )}
        </div>
      )}
    </aside>
  );
}

export default SidePanel;
