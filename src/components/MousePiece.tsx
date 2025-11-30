import type { MouseState } from '../types';

interface MousePieceProps {
  mouse: MouseState;
  highlighted?: boolean;
  scared?: boolean;
}

function MousePiece({ mouse, highlighted, scared }: MousePieceProps) {
  const showStats = mouse.maxHearts > 1 || mouse.attack > 1;

  const imageSrc = (() => {
    if (scared) return './mice/mouse_scared.png';
    if (mouse.stunned) return './mice/mouse_dizzy.png';
    if (mouse.attack > 1) return './mice/mouse_grain_fed.png';
    return './mice/mouse_normal.png';
  })();

  const className = ['piece', 'mouse', mouse.stunned ? 'stunned' : undefined, highlighted ? 'highlighted' : undefined]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={className} aria-label={`Mouse ${mouse.attack}/${mouse.maxHearts}`}>
      {showStats && (
        <div className="piece-hearts" aria-hidden>
          {Array.from({ length: mouse.maxHearts }).map((_, idx) => (
            <span key={idx}>{idx < mouse.hearts ? '❤️' : '🩶'}</span>
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
