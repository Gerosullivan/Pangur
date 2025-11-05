import React, { useState } from 'react';
import { GameState, Position, Cat, Mouse, Column, Row } from '../types';
import { TopBar } from './TopBar';
import { Board } from './Board';
import { CatPiece } from './CatPiece';
import {
  createInitialGameState,
  getValidMoves,
  getValidAttackTargets,
  getEffectiveCatch,
  getEffectiveMeow,
  getCellModifiers,
  calculateDeterrence,
  isCellOccupied,
} from '../gameLogic';
import {
  placeCat,
  selectCat,
  moveCat,
  attackMouse,
  passTurnToMice,
  executeMousePhase,
  executeIncomingWave,
  finalizeIncomingWave,
} from '../gameActions';
import './Game.css';

export const Game: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());
  const [draggingCatId, setDraggingCatId] = useState<string | null>(null);

  const selectedCat = gameState.selectedCatId
    ? gameState.cats.find(c => c.id === gameState.selectedCatId)
    : null;

  const validMoves = selectedCat
    ? getValidMoves(selectedCat, gameState.cats, gameState.residentMice)
    : [];

  // Only show attack targets if cat has available catch points
  const validAttackTargets = selectedCat && selectedCat.position
    ? (() => {
        const effectiveCatch = getEffectiveCatch(selectedCat, selectedCat.position);
        const availableCatch = effectiveCatch - selectedCat.spentCatch;
        return availableCatch > 0 ? getValidAttackTargets(selectedCat, gameState.residentMice) : [];
      })()
    : [];

  const handleCatClick = (catId: string) => {
    if (gameState.phase === 'cat') {
      setGameState(selectCat(gameState, catId));
    }
  };

  const handleMouseClick = (mouseId: string) => {
    if (gameState.phase === 'cat' && selectedCat) {
      const newState = attackMouse(gameState, selectedCat.id, mouseId);
      setGameState(newState);
    }
  };

  const handleCellDrop = (position: Position) => {
    if (!draggingCatId) return;

    if (gameState.phase === 'setup') {
      const newState = placeCat(gameState, draggingCatId, position);
      setGameState(newState);
    } else if (gameState.phase === 'cat') {
      const newState = moveCat(gameState, draggingCatId, position);
      setGameState(newState);
    }

    setDraggingCatId(null);
  };

  const handleDragStart = (catId: string) => {
    setDraggingCatId(catId);
  };

  const handleDragEnd = () => {
    setDraggingCatId(null);
  };

  const handlePassTurn = async () => {
    if (gameState.phase !== 'cat') return;

    // Start mouse phase
    let newState = passTurnToMice(gameState);
    setGameState(newState);

    // Execute mouse phase after a short delay
    setTimeout(() => {
      newState = executeMousePhase(newState);
      setGameState(newState);

      // Execute incoming wave phase after another delay
      setTimeout(() => {
        animateIncomingWave(newState);
      }, 1000);
    }, 1000);
  };

  const animateIncomingWave = (state: GameState) => {
    if (state.phase !== 'incoming') return;

    // Calculate deterrence and which mice are entering
    const deterrence = calculateDeterrence(state.cats);
    const scared = Math.min(deterrence, state.incomingQueue);
    const entering = state.incomingQueue - scared;

    // First, update to show deterred mice are gone (wait a moment to show the scared mice)
    setTimeout(() => {
      // Start placing mice one at a time
      placeMiceSequentially(state, entering, 0);
    }, 500);
  };

  const placeMiceSequentially = (state: GameState, totalEntering: number, currentIndex: number) => {
    if (currentIndex >= totalEntering) {
      // All mice placed, finalize the wave without placing mice again
      const newState = finalizeIncomingWave(state);
      setGameState(newState);
      return;
    }

    // Place one mouse
    const newMice = [...state.residentMice];
    const rows = [4, 3, 2, 1] as const;
    const cols = ['A', 'B', 'C', 'D'] as const;

    let placed = false;
    for (const row of rows) {
      if (placed) break;
      for (const col of cols) {
        if (placed) break;

        const pos = { col, row };
        if (!isCellOccupied(pos, state.cats, newMice)) {
          newMice.push({
            id: `mouse-t${state.turn}-${currentIndex}`,
            position: pos,
            attack: 1,
            hearts: 1,
            hasEaten: false,
            isStunned: false,
          });
          placed = true;
        }
      }
    }

    if (!placed) {
      // No space - game over
      setGameState({
        ...state,
        phase: 'gameOver',
        gameResult: 'loss',
      });
      return;
    }

    // Update state with new mouse
    setGameState({
      ...state,
      residentMice: newMice,
    });

    // Place next mouse after delay
    setTimeout(() => {
      placeMiceSequentially(
        { ...state, residentMice: newMice },
        totalEntering,
        currentIndex + 1
      );
    }, 200);
  };

  const catsInHand = gameState.cats.filter(cat => cat.position === null);
  const catsOnBoard = gameState.cats.filter(cat => cat.position !== null);

  return (
    <div className="game">
      <TopBar
        turn={gameState.turn}
        grain={gameState.grain}
        onPassTurn={handlePassTurn}
        canPassTurn={gameState.phase === 'cat'}
      />

      {gameState.phase === 'setup' && catsInHand.length > 0 && (
        <div className="setup-message">
          Drag cats onto the board to start (avoid perimeter cells)
        </div>
      )}

      <Board
        cats={catsOnBoard}
        mice={gameState.residentMice}
        validMoves={validMoves}
        validAttacks={validAttackTargets}
        selectedCatId={gameState.selectedCatId}
        onCellDrop={handleCellDrop}
        onCatClick={handleCatClick}
        onMouseClick={handleMouseClick}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      />

      {gameState.phase === 'setup' && catsInHand.length > 0 && (
        <div className="cat-hand">
          {catsInHand.map(cat => (
            <CatPiece
              key={cat.id}
              cat={cat}
              isInHand
              onDragStart={() => handleDragStart(cat.id)}
              onDragEnd={handleDragEnd}
            />
          ))}
        </div>
      )}

      <div className="incoming-queue">
        <div className="queue-label">Incoming: {gameState.incomingQueue} mice</div>
        <div className="queue-mice">
          {(() => {
            // Calculate deterrence during cat phase and incoming phase
            const deterrence = (gameState.phase === 'cat' || gameState.phase === 'incoming')
              ? calculateDeterrence(gameState.cats)
              : 0;
            const scared = Math.min(deterrence, gameState.incomingQueue);
            const entering = gameState.incomingQueue - scared;

            // During incoming phase, only show entering mice (scared ones are gone)
            if (gameState.phase === 'incoming') {
              return (
                <>
                  {Array.from({ length: entering }).map((_, i) => (
                    <span key={`entering-${i}`} className="queue-mouse">🐭</span>
                  ))}
                </>
              );
            }

            // During cat phase, show both scared and entering
            return (
              <>
                {Array.from({ length: scared }).map((_, i) => (
                  <span key={`scared-${i}`} className="queue-mouse scared">😱</span>
                ))}
                {Array.from({ length: entering }).map((_, i) => (
                  <span key={`entering-${i}`} className="queue-mouse">🐭</span>
                ))}
              </>
            );
          })()}
        </div>
        {gameState.phase === 'cat' && (
          <div className="deterrence-info">
            Deterring: {calculateDeterrence(gameState.cats)} mice
          </div>
        )}
      </div>

      {selectedCat && gameState.phase === 'cat' && (
        <div className="cat-info-panel">
          <h3>{selectedCat.name}</h3>
          <div className="info-role">{selectedCat.role}</div>
          <div className="info-stats">
            {selectedCat.position ? (() => {
              const effectiveCatch = getEffectiveCatch(selectedCat, selectedCat.position);
              const effectiveMeow = getEffectiveMeow(selectedCat, selectedCat.position);
              const availableCatch = effectiveCatch - selectedCat.spentCatch;
              const mods = getCellModifiers(selectedCat.position);
              const catchBonus = mods.isShadowBonus ? 1 : 0;
              const meowMult = mods.meowMultiplier;

              return (
                <>
                  <div>
                    <strong>Catch:</strong> {availableCatch} / {effectiveCatch}
                    {catchBonus > 0 && <span style={{color: '#D97014'}}> ({selectedCat.baseCatch} base +{catchBonus} shadow)</span>}
                  </div>
                  <div>
                    <strong>Meow:</strong> {effectiveMeow}
                    {meowMult !== 1 && <span style={{color: '#0396A6'}}> ({selectedCat.baseMeow} base ×{meowMult})</span>}
                  </div>
                  <div><strong>Hearts:</strong> {selectedCat.hearts} / {selectedCat.maxHearts}</div>
                </>
              );
            })() : (
              <>
                <div><strong>Catch:</strong> {selectedCat.baseCatch}</div>
                <div><strong>Meow:</strong> {selectedCat.baseMeow}</div>
                <div><strong>Hearts:</strong> {selectedCat.hearts} / {selectedCat.maxHearts}</div>
              </>
            )}
          </div>
          <div>
            {selectedCat.hasMoved && <div className="info-badge">Moved</div>}
            {selectedCat.position && getEffectiveCatch(selectedCat, selectedCat.position) - selectedCat.spentCatch === 0 && (
              <div className="info-badge" style={{marginLeft: '8px'}}>Attacked</div>
            )}
          </div>
        </div>
      )}

      {gameState.gameResult && (
        <div className="game-over-overlay">
          <div className="game-over-message">
            <h1>{gameState.gameResult === 'win' ? 'Victory!' : 'Defeat'}</h1>
            <p>
              {gameState.gameResult === 'win'
                ? 'All mice have been eliminated!'
                : 'The mice have overrun the building.'}
            </p>
            <button onClick={() => setGameState(createInitialGameState())}>
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
