import React from 'react';
import { Cat, Position } from '../types';
import { getEffectiveCatch, getEffectiveMeow, getCellModifiers } from '../gameLogic';
import './CatPiece.css';

interface CatPieceProps {
  cat: Cat;
  isSelected?: boolean;
  isDragging?: boolean;
  isInHand?: boolean;
  previewPosition?: Position | null;
  onClick?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragEnd?: (e: React.DragEvent) => void;
}

export const CatPiece: React.FC<CatPieceProps> = ({
  cat,
  isSelected,
  isDragging,
  isInHand,
  previewPosition,
  onClick,
  onDragStart,
  onDragEnd,
}) => {
  const position = previewPosition || cat.position;
  const effectiveCatch = position ? getEffectiveCatch(cat, position) : cat.baseCatch;
  const effectiveMeow = position ? getEffectiveMeow(cat, position) : 0;
  const availableCatch = effectiveCatch - cat.spentCatch;

  const mods = position ? getCellModifiers(position) : null;
  const hasCatchBonus = mods?.isShadowBonus;
  const meowMultiplier = mods?.meowMultiplier || 0;

  const hearts = [];
  for (let i = 0; i < cat.maxHearts; i++) {
    if (i < cat.hearts) {
      hearts.push('❤️');
    } else {
      hearts.push('🤍');
    }
  }

  return (
    <div
      className={`cat-piece ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isInHand ? 'in-hand' : ''}`}
      onClick={onClick}
      draggable={!isInHand || cat.position === null}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <div className="cat-hearts">{hearts.join(' ')}</div>
      <div className={`cat-badge ${isSelected ? 'selected-badge' : ''}`}>
        <div className="cat-art">{cat.name[0]}</div>
      </div>
      <div className="cat-stats">
        <div className={`cat-catch ${hasCatchBonus ? 'bonus' : ''}`}>
          {availableCatch}
        </div>
        <div className={`cat-meow ${meowMultiplier === 2 ? 'multiplied' : ''} ${meowMultiplier === 0.5 ? 'halved' : ''} ${meowMultiplier === 0 ? 'zero' : ''}`}>
          {effectiveMeow}
        </div>
      </div>
      {cat.hasMoved && <div className="cat-badge-moved">Moved</div>}
      {availableCatch === 0 && <div className="cat-badge-no-catch">Catch 0</div>}
    </div>
  );
};
