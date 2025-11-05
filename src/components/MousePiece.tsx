import React from 'react';
import { Mouse } from '../types';
import './MousePiece.css';

interface MousePieceProps {
  mouse: Mouse;
  isTargetable?: boolean;
  onClick?: () => void;
}

export const MousePiece: React.FC<MousePieceProps> = ({ mouse, isTargetable, onClick }) => {
  const is2_2 = mouse.hearts === 2 && mouse.attack === 2;

  return (
    <div
      className={`mouse-piece ${isTargetable ? 'targetable' : ''} ${mouse.isStunned ? 'stunned' : ''}`}
      onClick={onClick}
    >
      {is2_2 && (
        <>
          <div className="mouse-hearts">❤️ ❤️</div>
        </>
      )}
      <div className="mouse-badge">
        <div className="mouse-art">🐭</div>
      </div>
      {is2_2 && (
        <div className="mouse-attack">{mouse.attack}</div>
      )}
    </div>
  );
};
