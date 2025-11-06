import { Mouse } from '../types';
import './MousePiece.css';

interface MousePieceProps {
  mouse: Mouse;
}

function MousePiece({ mouse }: MousePieceProps) {
  return (
    <div className={`mouse-piece ${mouse.isGrainFed ? 'grain-fed' : ''}`}>
      {/* Hearts for grain-fed mice */}
      {mouse.isGrainFed && (
        <div className="mouse-hearts">
          {Array.from({ length: mouse.health }).map((_, i) => (
            <span key={i}>❤️</span>
          ))}
        </div>
      )}

      {/* Mouse badge */}
      <div className="mouse-badge">
        🐭
      </div>

      {/* Attack for grain-fed mice */}
      {mouse.isGrainFed && (
        <div className="mouse-attack">
          ⚔️ {mouse.attack}
        </div>
      )}
    </div>
  );
}

export default MousePiece;
