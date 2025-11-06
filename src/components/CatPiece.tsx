import { Cat } from '../types';
import { getCurrentCatStats } from '../gameState';
import './CatPiece.css';

interface CatPieceProps {
  cat: Cat;
  isDragging?: boolean;
  isSelected?: boolean;
  onClick?: (e?: React.MouseEvent) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}

function CatPiece({ cat, isDragging, isSelected, onClick, onDragStart, onDragEnd }: CatPieceProps) {
  const stats = getCurrentCatStats(cat);
  const availableCatch = stats.catch;

  return (
    <div
      className={`cat-piece ${isSelected ? 'selected' : ''} ${isDragging ? 'dragging' : ''}`}
      onClick={onClick}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      {/* Hearts */}
      <div className="hearts-display">
        {Array.from({ length: cat.hearts }).map((_, i) => (
          <span key={i}>❤️</span>
        ))}
        {Array.from({ length: 5 - cat.hearts }).map((_, i) => (
          <span key={`empty-${i}`}>🤍</span>
        ))}
      </div>

      {/* Cat badge */}
      <div className="cat-badge">
        🐱
      </div>

      {/* Stats bar */}
      <div className="stats-bar">
        <span className="stat-catch">⚔️ {availableCatch}</span>
        <span className="stat-meow">📢 {stats.meow}</span>
      </div>
    </div>
  );
}

export default CatPiece;
