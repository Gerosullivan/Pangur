import type { CatId, CatState, CellId } from '../types';
import { catDefinitions, CAT_STARTING_HEARTS } from '../lib/cats';

interface CatPieceProps {
  cat: CatState;
  catId: CatId;
  effectiveCatch: number;
  effectiveMeow: number;
  remainingCatch: number;
  isSelected: boolean;
  onSelect?: (catId: CatId) => void;
  cellId: CellId;
  highlighted?: boolean;
}

const catchColor = '#d96d55';
const meowColor = '#0396a6';

function CatPiece({
  cat,
  catId,
  effectiveCatch,
  effectiveMeow,
  remainingCatch,
  isSelected,
  onSelect,
  cellId,
  highlighted,
}: CatPieceProps) {
  const definition = catDefinitions[catId];
  const currentHearts = Math.max(cat.hearts, 0);
  const emptyHearts = Math.max(CAT_STARTING_HEARTS - currentHearts, 0);
  const hearts = `${'❤️'.repeat(currentHearts)}${'🤍'.repeat(emptyHearts)}`;
  const handleClick = () => {
    onSelect?.(catId);
  };

  const className = ['piece', 'cat', isSelected ? 'selected-piece' : undefined, highlighted ? 'highlighted' : undefined]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      data-cell={cellId}
      aria-pressed={isSelected}
      aria-label={`${definition.name} at ${cellId}`}
    >
      <div className="piece-hearts" aria-hidden>
        {hearts}
      </div>
      <div className="piece-portrait" aria-hidden>
        {definition.portrait}
      </div>
      <div className="piece-stat-row">
        <span style={{ color: catchColor }}>Catch {remainingCatch}/{effectiveCatch}</span>
        <span style={{ color: meowColor }}>Meow {effectiveMeow}</span>
      </div>
    </button>
  );
}

export default CatPiece;
