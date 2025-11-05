// MousePosition component - Shows a single mouse position slot
import './MousePosition.css';
import { getMouseSprite } from '../utils/mouseSprite.js';

function MousePosition({ position, mouse, visualClass, emojiOverride, defenseIndicator }) {
  const hasMouse = !!mouse;
  const spriteUrl = getMouseSprite(mouse, emojiOverride);

  const isGrainFed = mouse?.isGrainFed ?? false;
  const showCatch = isGrainFed && mouse.status === 'alive';
  const showHealth = isGrainFed && mouse.status === 'alive';

  // Render hearts for health display (grain-fed mice only)
  const renderHearts = () => {
    if (!showHealth) return null;

    const filled = Math.round(mouse.health ?? 0);
    const empty = Math.max(0, (mouse.maxHealth ?? 0) - filled);
    const hearts = [];

    for (let i = 0; i < filled; i += 1) {
      hearts.push(<span key={`filled-${i}`}>❤️</span>);
    }

    for (let i = 0; i < empty; i += 1) {
      hearts.push(<span key={`empty-${i}`}>🤍</span>);
    }

    return <>{hearts}</>;
  };

  return (
    <div
      className={`mouse-position-box ${hasMouse ? 'occupied' : 'empty'} ${visualClass || ''}`}
      data-mouse-position={position}
      style={hasMouse ? {
        backgroundImage: `url(${spriteUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      } : {}}
    >
      {hasMouse && (
        <div className="mouse-container">
          <div
            className="mouse-icon-large"
            data-mouse-id={mouse.id}
            data-attack-id={position}
            style={{ position: 'relative' }}
          >
            {/* Defense prediction indicator for incoming mice */}
            {defenseIndicator && (
              <div
                style={{
                  position: 'absolute',
                  top: '-25px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  fontSize: '20px',
                  lineHeight: '1',
                  zIndex: 10
                }}
              >
                {defenseIndicator}
              </div>
            )}

            {/* Catch stat overlay for grain-fed mice */}
            {showCatch && (
              <div className="stat-icon-overlay stat-icon-catch">
                <img src="/claw.png" alt="Catch" className="stat-icon" />
                <span className="stat-value">{mouse.catch}</span>
              </div>
            )}
          </div>

          {/* Health hearts for grain-fed mice */}
          {showHealth && (
            <div className="mouse-health">
              {renderHearts()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MousePosition;
