import type { DragEvent, KeyboardEvent } from 'react';
import type { CatId, CatState } from '../types';
import { catDefinitions, CAT_STARTING_HEARTS } from '../lib/cats';
import { isShadowBonus } from '../lib/board';

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
  gateGlow?: boolean;
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
  gateGlow,
}: CatPieceProps) {
  const definition = catDefinitions[catId];
  const currentHearts = Math.max(cat.hearts, 0);
  const emptyHearts = Math.max(CAT_STARTING_HEARTS - currentHearts, 0);
  const catchBonus =
    cat.shadowBonusActive || (cat.position && cat.shadowBonusPrimed && isShadowBonus(cat.position)) ? 1 : 0;

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
    const asleep = !cat.wokenByAttack && (cat.turnEnded || (cat.movesRemaining <= 0 && remainingCatch <= 0));
    if (asleep) {
      switch (catId) {
        case 'pangur':
          return '/assets/cat_asleep/Pangur_asleep.png';
        case 'baircne':
          return '/assets/cat_asleep/Baircne_asleep.png';
        case 'guardian':
          return '/assets/cat_asleep/Breonne_asleep.png';
        default:
          return '/assets/cat_asleep/Pangur_asleep.png';
      }
    }
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
        <span className={`piece-meow ${gateGlow ? 'glow-blue' : ''}`.trim()}>{definition.baseMeow}</span>
      </div>
    </div>
  );
}

export default CatPiece;
