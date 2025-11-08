import type { MouseState } from '../types';

interface MousePieceProps {
  mouse: MouseState;
  highlighted?: boolean;
}

function MousePiece({ mouse, highlighted }: MousePieceProps) {
  const showStats = mouse.hearts > 1 || mouse.attack > 1;
  const heartIcon = mouse.hearts > 1 ? '❤️'.repeat(mouse.hearts) : '';
  const className = ['piece', 'mouse', mouse.stunned ? 'stunned' : undefined, highlighted ? 'highlighted' : undefined]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className} aria-label={`Mouse ${mouse.grainFed ? '2/2' : '1/1'}`}>
      {showStats && (
        <div className="piece-hearts" aria-hidden>
          {heartIcon}
        </div>
      )}
      <div className="piece-portrait" aria-hidden>
        🐭
      </div>
      {showStats && (
        <div className="piece-stat-row" aria-hidden>
          <span className="mouse-attack">{mouse.attack}</span>
        </div>
      )}
    </div>
  );
}

export default MousePiece;
