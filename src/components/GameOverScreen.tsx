import './GameOverScreen.css';

interface GameOverScreenProps {
  victory: boolean;
  wave: number;
  onRestart: () => void;
}

function GameOverScreen({ victory, wave, onRestart }: GameOverScreenProps) {
  return (
    <div className="game-over-overlay">
      <div className="game-over-modal">
        <h1 className={victory ? 'victory' : 'defeat'}>
          {victory ? '🎉 Victory!' : '💀 Game Over'}
        </h1>

        <div className="game-over-stats">
          {victory ? (
            <p>You successfully defended the grain store!</p>
          ) : (
            <p>The mice have overwhelmed your defenses.</p>
          )}
          <p className="wave-count">Waves Survived: {wave}</p>
        </div>

        <button className="btn btn-primary" onClick={onRestart}>
          Play Again
        </button>
      </div>
    </div>
  );
}

export default GameOverScreen;
