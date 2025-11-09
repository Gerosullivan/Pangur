import type { MouseState } from '../types';

interface MousePieceProps {
  mouse: MouseState;
  highlighted?: boolean;
}

function MousePiece({ mouse, highlighted }: MousePieceProps) {
  const showStats = mouse.hearts > 1 || mouse.attack > 1;

  const imageSrc = (() => {
    if (mouse.stunned) return '/assets/mice/mouse_dizzy.png';
    if (mouse.grainFed) return '/assets/mice/mouse_grain_fed.png';
    return '/assets/mice/mouse_normal.png';
  })();

  const className = ['piece', 'mouse', mouse.stunned ? 'stunned' : undefined, highlighted ? 'highlighted' : undefined]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className} aria-label={`Mouse ${mouse.grainFed ? '2/2' : '1/1'}`}>
      {showStats && (
        <div className="piece-hearts" aria-hidden>
          {Array.from({ length: mouse.hearts }).map((_, idx) => (
            <span key={idx}>❤️</span>
          ))}
        </div>
      )}
      <div className="piece-badge mouse" aria-hidden>
        <img src={imageSrc} alt="mouse" />
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
