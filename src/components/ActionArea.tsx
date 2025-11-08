import { GameState } from '../types';
import { executeMouseAttack, executeMouseEat } from '../gameLogic';
import { calculateTotalMeow, createInitialGameState } from '../gameState';
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

  const handleDragStart = (e: React.DragEvent, catId: string) => {
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('catId', catId);
  };

  const handleRestart = () => {
    setGameState(createInitialGameState());
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
              <CatPiece
                cat={cat}
                onDragStart={(e) => handleDragStart(e, cat.id)}
              />
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
          <button className="btn btn-secondary" onClick={handleRestart}>
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
    setGameState(prev => executeMouseAttack(prev, frame.data.mouseId));
  } else if (frame.type === 'mouse-eat') {
    setGameState(prev => executeMouseEat(prev, frame.data.mouseId));
  } else if (frame.type === 'mouse-place') {
    // Place a mouse on the board
    setGameState(prev => {
      const newMice = [...prev.mice, {
        id: frame.data.mouseId,
        position: frame.data.position,
        attack: 1,
        health: 1,
        isStunned: false,
        isGrainFed: false,
      }];
      return {
        ...prev,
        mice: newMice,
        incomingQueue: prev.incomingQueue - 1,
      };
    });
  } else if (frame.type === 'mouse-deter') {
    // Remove a deterred mouse from queue
    setGameState(prev => ({
      ...prev,
      incomingQueue: prev.incomingQueue - 1,
    }));
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
    setGameState(prev => {
      // Check win condition: no mice on board and queue empty
      if (prev.mice.length === 0 && prev.incomingQueue === 0) {
        return {
          ...prev,
          gameOver: true,
          victory: true,
        };
      }

      // Reset cat turn flags and refill queue
      return {
        ...prev,
        phase: 'cat',
        subPhase: null,
        phaseFrames: [],
        currentFrameIndex: 0,
        wave: prev.wave + 1,
        incomingQueue: 12,
        cats: prev.cats.map(c => ({
          ...c,
          spentCatch: 0,
          hasMoved: false,
          hasAttacked: false,
        })),
        mice: prev.mice.map(m => ({
          ...m,
          isStunned: false, // Reset stun at start of new turn
        })),
      };
    });
  }
}

// Helper: Generate frames for incoming wave phase
function generateIncomingWaveFrames(gameState: GameState) {
  const frames = [];
  const totalMeow = calculateTotalMeow(gameState.cats);
  const deterredCount = Math.min(totalMeow, gameState.incomingQueue);
  const enteringCount = gameState.incomingQueue - deterredCount;

  // Deterrence frames
  frames.push({
    type: 'deter-calculate',
    description: `Total meow: ${totalMeow} - Deterring ${deterredCount} mice`,
    data: { totalMeow, deterredCount },
  });

  // Remove deterred mice from queue
  for (let i = 0; i < deterredCount; i++) {
    frames.push({
      type: 'mouse-deter',
      description: `Mouse ${i + 1} flees in fear!`,
      data: {},
    });
  }

  // Place entering mice
  if (enteringCount > 0) {
    const positions = getAllEmptyPositions(gameState);
    const topDownLeftRight = positions.sort((a, b) => {
      const rowA = parseInt(a[1]);
      const rowB = parseInt(b[1]);
      if (rowB !== rowA) return rowB - rowA; // Higher row first (4 -> 1)
      return a[0].localeCompare(b[0]); // Left to right
    });

    for (let i = 0; i < Math.min(enteringCount, topDownLeftRight.length); i++) {
      const position = topDownLeftRight[i];
      frames.push({
        type: 'mouse-place',
        description: `Mouse enters at ${position}`,
        data: {
          mouseId: `mouse-wave-${gameState.wave}-${i}`,
          position,
        },
      });
    }

    // Check for overwhelm
    if (enteringCount > topDownLeftRight.length) {
      frames.push({
        type: 'game-over',
        description: 'Board overwhelmed! Game Over.',
        data: { reason: 'overwhelmed' },
      });
    }
  }

  // Refill queue for next wave
  frames.push({
    type: 'wave-complete',
    description: 'Wave complete - Queue refilled to 12',
    data: {},
  });

  return frames;
}

// Helper: Get all empty positions on the board
function getAllEmptyPositions(gameState: GameState) {
  const allPositions = [];
  const cols = ['A', 'B', 'C', 'D'];
  for (let row = 1; row <= 4; row++) {
    for (const col of cols) {
      const pos = `${col}${row}` as any;
      const hasCat = gameState.cats.some(c => c.position === pos);
      const hasMouse = gameState.mice.some(m => m.position === pos);
      if (!hasCat && !hasMouse) {
        allPositions.push(pos);
      }
    }
  }
  return allPositions;
}

export default ActionArea;
