import React from 'react';
import { Mouse } from '../types/game';

interface MousePieceProps {
  mouse: Mouse;
}

export const MousePiece: React.FC<MousePieceProps> = ({ mouse }) => {
  // Get mouse image based on state
  const getMouseImage = () => {
    if (mouse.isStunned) return '/assets/mice/mouse_dizzy.png';
    if (mouse.isGrainFed) return '/assets/mice/mouse_grain_fed.png';
    return '/assets/mice/mouse_normal.png';
  };

  return (
    <div className="mouse-piece">
      {/* Hearts for 2/2 mice */}
      {mouse.isGrainFed && (
        <div className="piece-hearts">
          {Array.from({ length: mouse.health }).map((_, i) => (
            <span key={i} className="heart-icon">❤️</span>
          ))}
        </div>
      )}

      {/* Badge */}
      <div className="piece-badge">
        <img src={getMouseImage()} alt="mouse" />
      </div>

      {/* Attack for 2/2 mice */}
      {mouse.isGrainFed && (
        <div className="mouse-attack">{mouse.attack}</div>
      )}
    </div>
  );
};
