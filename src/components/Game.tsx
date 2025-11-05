import React, { useState } from 'react';
import { GameState, Position, Cat } from '../types';
import { TopBar } from './TopBar';
import { Board } from './Board';
import { CatPiece } from './CatPiece';
import {
  createInitialGameState,
  getValidMoves,
  getValidAttackTargets,
} from '../gameLogic';
import {
  placeCat,
  selectCat,
  moveCat,
  attackMouse,
  passTurnToMice,
  executeMousePhase,
  executeIncomingWave,
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

  const validAttackTargets = selectedCat
    ? getValidAttackTargets(selectedCat, gameState.residentMice)
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
        newState = executeIncomingWave(newState);
        setGameState(newState);
      }, 1000);
    }, 1000);
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
          {Array.from({ length: Math.min(gameState.incomingQueue, 12) }).map((_, i) => (
            <span key={i} className="queue-mouse">🐭</span>
          ))}
        </div>
      </div>

      {selectedCat && gameState.phase === 'cat' && (
        <div className="cat-info-panel">
          <h3>{selectedCat.name}</h3>
          <div className="info-role">{selectedCat.role}</div>
          <div className="info-stats">
            <div>Catch: {selectedCat.baseCatch - selectedCat.spentCatch} / {selectedCat.baseCatch}</div>
            <div>Meow: {selectedCat.baseMeow}</div>
            <div>Hearts: {selectedCat.hearts} / {selectedCat.maxHearts}</div>
          </div>
          {selectedCat.hasMoved && <div className="info-badge">Moved</div>}
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
