import { useEffect, useMemo, useState } from 'react';
import mouseDead from '../../assets/mice/mouse_dead.png';
import mouseDizzy from '../../assets/mice/mouse_dizzy.png';
import mouseGrainFed from '../../assets/mice/mouse_grain_fed.png';
import mouseNormal from '../../assets/mice/mouse_normal.png';
import mouseScared from '../../assets/mice/mouse_scared.png';
import type { MouseState } from '../types';

interface MousePieceProps {
  mouse: MouseState;
  highlighted?: boolean;
  scared?: boolean;
}

function MousePiece({ mouse, highlighted, scared }: MousePieceProps) {
  const showStats = mouse.maxHearts > 1 || mouse.attack > 1;

  const preferredSrc = useMemo(() => {
    if (scared) return mouseScared;
    if (mouse.stunned) return mouseDizzy;
    if (mouse.attack > 1) return mouseGrainFed;
    return mouseNormal;
  }, [mouse.attack, mouse.stunned, scared]);

  const [imageSrc, setImageSrc] = useState(preferredSrc);
  useEffect(() => {
    // Update src when mouse state changes (e.g., becomes stunned or grain-fed).
    setImageSrc(preferredSrc);
  }, [preferredSrc]);

  const className = ['piece', 'mouse', mouse.stunned ? 'stunned' : undefined, highlighted ? 'highlighted' : undefined]
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={className}
      aria-label={`Mouse ${mouse.attack}/${mouse.maxHearts}`}
      data-mouse-id={mouse.id}
      data-mouse-tier={mouse.tier}
    >
      {showStats && (
        <div className="piece-hearts" aria-hidden>
          {Array.from({ length: mouse.maxHearts }).map((_, idx) => (
            <span key={idx}>{idx < mouse.hearts ? '❤️' : '🩶'}</span>
          ))}
        </div>
      )}
      <div className="piece-badge mouse" aria-hidden>
        <img
          src={imageSrc}
          alt="mouse"
          width="61"
          height="61"
          loading="eager"
          onError={() => {
            // Fallback to base sprite if a variant ever fails to load (Safari quirks).
            setImageSrc(mouseNormal);
          }}
        />
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
