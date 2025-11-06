import type { MouseState } from '../types';

interface MousePieceProps {
  mouse: MouseState;
}

function MousePiece({ mouse }: MousePieceProps) {
  const heartIcon = mouse.hearts > 1 ? '❤️❤️' : mouse.hearts === 1 ? '❤️' : '';
  const attackIcon = `⚔️ ${mouse.attack}`;
  const className = ['piece', 'mouse', mouse.stunned ? 'stunned' : undefined].filter(Boolean).join(' ');

  return (
    <div className={className} aria-label={`Mouse ${mouse.grainFed ? '2/2' : '1/1'}`}>
      <div className="piece-hearts" aria-hidden>
        {heartIcon}
      </div>
      <div className="piece-portrait" aria-hidden>
        🐭
      </div>
      <div className="piece-stat-row" aria-hidden>
        <span>{attackIcon}</span>
        <span>{mouse.grainFed ? 'Fed' : 'Scout'}</span>
      </div>
    </div>
  );
}

export default MousePiece;
