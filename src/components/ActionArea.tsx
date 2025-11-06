import { GameState } from '../types';
import CatPiece from './CatPiece';

interface ActionAreaProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

function ActionArea({ gameState, setGameState }: ActionAreaProps) {
  const catsInHand = gameState.cats.filter(cat => cat.position === 'hand');
  const allCatsPlaced = catsInHand.length === 0;

  const handleConfirmFormation = () => {
    setGameState(prev => ({
      ...prev,
      phase: 'cat',
    }));
  };

  const handleEndTurn = () => {
    // Reset cat states
    const updatedCats = gameState.cats.map(cat => ({
      ...cat,
      spentCatch: 0,
      hasMoved: false,
      hasAttacked: false,
    }));

    // Generate phase frames for resident mouse phase
    const frames = generateResidentMouseFrames(gameState);

    setGameState(prev => ({
      ...prev,
      cats: updatedCats,
      phase: 'resident-mouse',
      subPhase: 'attack',
      phaseFrames: frames,
      currentFrameIndex: 0,
      selectedCatId: null,
    }));
  };

  const handleNextFrame = () => {
    if (gameState.currentFrameIndex < gameState.phaseFrames.length - 1) {
      const nextIndex = gameState.currentFrameIndex + 1;
      const frame = gameState.phaseFrames[nextIndex];

      // Apply frame effects
      applyFrameEffects(frame, setGameState);

      setGameState(prev => ({
        ...prev,
        currentFrameIndex: nextIndex,
      }));
    } else {
      // Move to next phase
      advancePhase(gameState, setGameState);
    }
  };

  // Setup phase
  if (gameState.phase === 'setup') {
    return (
      <div className="action-area">
        <div className="cat-hand">
          {catsInHand.map(cat => (
            <div key={cat.id} className="cat-piece-hand">
              <CatPiece cat={cat} />
            </div>
          ))}
        </div>

        {catsInHand.length > 0 && (
          <div className="setup-message">
            Drag cats onto the board to start (avoid perimeter cells)
          </div>
        )}

        {allCatsPlaced && (
          <button className="btn btn-primary" onClick={handleConfirmFormation}>
            Confirm Formation
          </button>
        )}
      </div>
    );
  }

  // Cat phase
  if (gameState.phase === 'cat') {
    return (
      <div className="action-area">
        <div className="action-buttons">
          <button className="btn btn-primary" onClick={handleEndTurn}>
            End Turn
          </button>
          <button className="btn btn-secondary">
            Restart Game
          </button>
        </div>
      </div>
    );
  }

  // Phase stepper (for resident-mouse and incoming-wave phases)
  if (gameState.phase === 'resident-mouse' || gameState.phase === 'incoming-wave') {
    const currentFrame = gameState.phaseFrames[gameState.currentFrameIndex];
    const isLastFrame = gameState.currentFrameIndex >= gameState.phaseFrames.length - 1;

    return (
      <div className="action-area">
        <div className="phase-stepper">
          <div className="frame-label">
            {currentFrame?.description || 'Processing...'}
          </div>
          <div className="stepper-controls">
            <button className="btn btn-secondary" disabled>
              Previous
            </button>
            <button
              className="btn btn-primary"
              onClick={handleNextFrame}
            >
              {isLastFrame ? 'Continue' : 'Next'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Helper: Generate frames for resident mouse phase
function generateResidentMouseFrames(gameState: GameState) {
  const frames = [];

  // Attack sub-phase frames
  const activeMice = gameState.mice.filter(m => !m.isStunned);
  for (const mouse of activeMice) {
    for (let i = 0; i < mouse.attack; i++) {
      frames.push({
        type: 'mouse-attack',
        description: `Mouse at ${mouse.position} attacks (${i + 1}/${mouse.attack})`,
        data: { mouseId: mouse.id, attackIndex: i },
      });
    }
  }

  // Eat sub-phase frames
  frames.push({
    type: 'eat-start',
    description: 'Mice prepare to eat grain',
    data: {},
  });

  for (const mouse of activeMice) {
    frames.push({
      type: 'mouse-eat',
      description: `Mouse at ${mouse.position} eats grain`,
      data: { mouseId: mouse.id },
    });
  }

  return frames;
}

// Helper: Apply frame effects to game state
function applyFrameEffects(frame: any, setGameState: React.Dispatch<React.SetStateAction<GameState>>) {
  if (frame.type === 'mouse-attack') {
    // Attack logic will be implemented
    console.log('Mouse attack:', frame.data);
  } else if (frame.type === 'mouse-eat') {
    // Eat logic
    setGameState(prev => {
      const mouse = prev.mice.find(m => m.id === frame.data.mouseId);
      if (!mouse) return prev;

      const grainCost = mouse.isGrainFed ? 2 : 1;
      const updatedMice = prev.mice.map(m => {
        if (m.id === frame.data.mouseId && !m.isGrainFed) {
          return {
            ...m,
            isGrainFed: true,
            attack: 2,
            health: 2,
          };
        }
        return m;
      });

      return {
        ...prev,
        grain: prev.grain - grainCost,
        mice: updatedMice,
      };
    });
  }
}

// Helper: Advance to next phase
function advancePhase(gameState: GameState, setGameState: React.Dispatch<React.SetStateAction<GameState>>) {
  if (gameState.phase === 'resident-mouse') {
    // Move to incoming wave phase
    const frames = generateIncomingWaveFrames(gameState);
    setGameState(prev => ({
      ...prev,
      phase: 'incoming-wave',
      subPhase: 'deter',
      phaseFrames: frames,
      currentFrameIndex: 0,
    }));
  } else if (gameState.phase === 'incoming-wave') {
    // Move back to cat phase
    setGameState(prev => ({
      ...prev,
      phase: 'cat',
      subPhase: null,
      phaseFrames: [],
      currentFrameIndex: 0,
      wave: prev.wave + 1,
    }));
  }
}

// Helper: Generate frames for incoming wave phase
function generateIncomingWaveFrames(gameState: GameState) {
  // Simplified for now
  return [
    {
      type: 'deter-calculate',
      description: 'Calculating deterrence...',
      data: {},
    },
    {
      type: 'wave-complete',
      description: 'Wave phase complete',
      data: {},
    },
  ];
}

export default ActionArea;
