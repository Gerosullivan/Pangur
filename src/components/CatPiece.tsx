import type { DragEvent, KeyboardEvent } from 'react';
import type { CatId, CatState } from '../types';
import { catDefinitions, CAT_STARTING_HEARTS } from '../lib/cats';
import { isShadowBonus, parseCell } from '../lib/board';

interface CatPieceProps {
  cat: CatState;
  catId: CatId;
  effectiveCatch: number;
  effectiveMeow: number;
  remainingCatch: number;
  isSelected: boolean;
  onSelect?: (catId: CatId) => void;
  cellRef?: string;
  highlighted?: boolean;
  inHand?: boolean;
  draggable?: boolean;
  onDragStart?: (event: DragEvent<HTMLDivElement>) => void;
  onDragEnd?: (event: DragEvent<HTMLDivElement>) => void;
}

function CatPiece({
  cat,
  catId,
  effectiveCatch,
  effectiveMeow,
  remainingCatch,
  isSelected,
  onSelect,
  cellRef,
  highlighted,
  inHand,
  draggable,
  onDragStart,
  onDragEnd,
}: CatPieceProps) {
  const definition = catDefinitions[catId];
  const currentHearts = Math.max(cat.hearts, 0);
  const emptyHearts = Math.max(CAT_STARTING_HEARTS - currentHearts, 0);
  const catchBonus = cat.position && cat.shadowBonusActive && isShadowBonus(cat.position) ? 1 : 0;
  const positionRow = cat.position ? parseCell(cat.position).row : undefined;

  const meowClass =
    positionRow === 4 ? 'glow-blue' :
    positionRow === 2 ? 'halved' :
    positionRow === 1 ? 'disabled' :
    '';

  const hearts = (
    <div className="piece-hearts" aria-hidden>
      {Array.from({ length: CAT_STARTING_HEARTS }).map((_, idx) => (
        <span key={idx}>{idx < currentHearts ? '❤️' : '🤍'}</span>
      ))}
    </div>
  );

  const handleClick = () => {
    onSelect?.(catId);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onSelect?.(catId);
    }
  };

  const getPortrait = () => {
    switch (catId) {
      case 'pangur':
        return '/assets/Cruibne.png';
      case 'baircne':
        return '/assets/Baircne.png';
      case 'guardian':
        return '/assets/Breonne.png';
      default:
        return '/assets/Cruibne.png';
    }
  };

  const className = [
    'piece',
    'cat',
    inHand ? 'in-hand' : undefined,
    isSelected ? 'selected-piece' : undefined,
    highlighted ? 'highlighted' : undefined,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={className}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      role="button"
      tabIndex={0}
      data-cell={cellRef}
      aria-pressed={isSelected}
      aria-label={`${definition.name}${cellRef ? ` at ${cellRef}` : ''}`}
      draggable={draggable}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {hearts}
      <div className="piece-badge" aria-hidden>
        <img src={getPortrait()} alt={definition.name} />
      </div>
      <div className="piece-stats">
        <span className={`piece-catch ${catchBonus > 0 ? 'glow-red' : ''}`}>
          {remainingCatch}
        </span>
        <span className={`piece-meow ${meowClass}`}>{effectiveMeow}</span>
      </div>
    </div>
  );
}

export default CatPiece;
