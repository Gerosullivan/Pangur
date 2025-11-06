import React from 'react';
import { Cat, calculateEffectiveCatch, calculateEffectiveMeow, getCatchBonus, getMeowMultiplier } from '../types/game';

interface CatPieceProps {
  cat: Cat;
  inHand?: boolean;
  isSelected?: boolean;
  isDragging?: boolean;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
  onClick?: () => void;
}

export const CatPiece: React.FC<CatPieceProps> = ({
  cat,
  inHand = false,
  isSelected = false,
  isDragging = false,
  onDragStart,
  onDragEnd,
  onClick,
}) => {
  const effectiveCatch = calculateEffectiveCatch(cat);
  const effectiveMeow = calculateEffectiveMeow(cat);
  const availableCatch = effectiveCatch - cat.spentCatch;

  // Determine stat styling
  const catchBonus = cat.position ? getCatchBonus(cat.position) : 0;
  const meowMultiplier = cat.position ? getMeowMultiplier(cat.position.row) : 1;

  const catchClass = catchBonus > 0 ? 'glow-red' : '';
  const meowClass =
    meowMultiplier === 2 ? 'glow-blue' :
    meowMultiplier === 0.5 ? 'halved' :
    meowMultiplier === 0 ? 'disabled' : '';

  // Get cat image
  const getCatImage = () => {
    if (cat.name.includes('Pangur') || cat.name.includes('Cruibne')) return '/assets/Cruibne.png';
    if (cat.name.includes('Baircne')) return '/assets/Baircne.png';
    if (cat.name.includes('Breoinne')) return '/assets/Breonne.png';
    return '/assets/Cruibne.png';
  };

  return (
    <div
      className={`piece ${inHand ? 'in-hand' : ''} ${isDragging ? 'dragging' : ''} ${isSelected ? 'selected' : ''}`}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onClick={onClick}
      style={{
        border: isSelected ? '3px solid #0396A6' : undefined,
        cursor: 'grab',
      }}
    >
      {/* Hearts */}
      <div className="piece-hearts">
        {Array.from({ length: cat.maxHearts }).map((_, i) => (
          <span key={i} className="heart-icon">
            {i < cat.hearts ? '❤️' : '🤍'}
          </span>
        ))}
      </div>

      {/* Badge with cat image */}
      <div className="piece-badge">
        <img src={getCatImage()} alt={cat.name} />
      </div>

      {/* Stats */}
      <div className="piece-stats">
        <span className={`piece-catch ${catchClass}`}>
          {availableCatch}
        </span>
        <span className={`piece-meow ${meowClass}`}>
          {effectiveMeow}
        </span>
      </div>
    </div>
  );
};
