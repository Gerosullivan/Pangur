import React from 'react';
import { Position } from '../types';
import { getCellModifiers } from '../gameLogic';
import './Cell.css';

interface CellProps {
  position: Position;
  isValidMove?: boolean;
  isValidAttack?: boolean;
  isDragOver?: boolean;
  onDrop?: (position: Position) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  children?: React.ReactNode;
}

export const Cell: React.FC<CellProps> = ({
  position,
  isValidMove,
  isValidAttack,
  isDragOver,
  onDrop,
  onDragOver,
  onDragLeave,
  children,
}) => {
  const mods = getCellModifiers(position);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (onDrop) {
      onDrop(position);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (onDragOver) {
      onDragOver(e);
    }
  };

  let cellClass = 'cell';
  if (mods.isShadowBonus) cellClass += ' shadow-bonus';
  else if (mods.isOpenGate) cellClass += ' open-gate';
  if (isValidMove) cellClass += ' valid-move';
  if (isValidAttack) cellClass += ' valid-attack';
  if (isDragOver) cellClass += ' drag-over';

  return (
    <div
      className={cellClass}
      onDrop={handleDrop}
      onDragOver={handleDragOver}
      onDragLeave={onDragLeave}
    >
      <div className="cell-label">{position.col}{position.row}</div>
      {children}
    </div>
  );
};
