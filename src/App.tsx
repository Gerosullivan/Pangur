import React, { useState, useCallback, useEffect } from 'react';
import './App.css';
import { GameState, Position, Column, Row, Cat, calculateEffectiveMeow, calculateEffectiveCatch, getCatchBonus, getMeowMultiplier } from './types/game';
import { createInitialState, getCatById, isCellOccupied, getCatAtPosition, getMouseAtPosition } from './utils/gameState';
import { CatPiece } from './components/CatPiece';
import { MousePiece } from './components/MousePiece';
import {
  getValidMoves,
  getValidAttackTargets,
  attackMouse,
  moveCat,
  executeMousePhase,
  executeWavePhase,
} from './utils/gameLogic';

const COLUMNS: Column[] = ['A', 'B', 'C', 'D'];
const ROWS: Row[] = [4, 3, 2, 1]; // Top to bottom for rendering

function App() {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [draggedCatId, setDraggedCatId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<Position | null>(null);
  const [validMoves, setValidMoves] = useState<Position[]>([]);
  const [validTargets, setValidTargets] = useState<string[]>([]); // mouse IDs

  // Calculate total meow for deterrence
  const calculateTotalMeow = useCallback((state: GameState = gameState): number => {
    return state.cats.reduce((sum, cat) => {
      if (cat.position) {
        return sum + calculateEffectiveMeow(cat);
      }
      return sum;
    }, 0);
  }, [gameState]);

  const totalMeow = calculateTotalMeow();
  const scaredMice = Math.min(totalMeow, gameState.incomingQueue);
  const enteringMice = gameState.incomingQueue - scaredMice;

  // Drag handlers
  const handleDragStart = (catId: string) => (e: React.DragEvent) => {
    setDraggedCatId(catId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnd = () => {
    setDraggedCatId(null);
    setDragOverCell(null);
  };

  const handleDragOver = (pos: Position) => (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCell(pos);
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (pos: Position) => (e: React.DragEvent) => {
    e.preventDefault();

    if (!draggedCatId) return;

    // Check if cell is valid for placement
    if (isCellOccupied(gameState, pos)) {
      setDragOverCell(null);
      setDraggedCatId(null);
      return;
    }

    // Place cat
    setGameState(prev => {
      const cat = getCatById(prev, draggedCatId);
      if (!cat) return prev;

      const newCats = prev.cats.map(c =>
        c.id === draggedCatId ? { ...c, position: pos } : c
      );

      const placedCount = newCats.filter(c => c.position !== null).length;

      return {
        ...prev,
        cats: newCats,
        setupCatsPlaced: placedCount,
      };
    });

    setDragOverCell(null);
    setDraggedCatId(null);
  };

  const handleCatClick = (catId: string) => {
    if (gameState.phase === 'cat-phase') {
      const cat = getCatById(gameState, catId);
      if (!cat) return;

      setGameState(prev => ({
        ...prev,
        selectedCatId: catId,
        activeCatId: catId,
      }));

      // Update valid moves and targets
      const moves = getValidMoves(gameState, cat);
      const targets = getValidAttackTargets(gameState, cat);
      setValidMoves(moves);
      setValidTargets(targets.map(m => m.id));
    }
  };

  // Handle cell click for movement
  const handleCellClick = (pos: Position) => {
    if (gameState.phase !== 'cat-phase' || !gameState.activeCatId) return;

    const cat = getCatById(gameState, gameState.activeCatId);
    if (!cat) return;

    // Check if this is a valid move
    const isValid = validMoves.some(m => m.col === pos.col && m.row === pos.row);
    if (isValid) {
      const newState = moveCat(gameState, cat.id, pos);
      setGameState(newState);

      // Update valid moves and targets after movement
      const movedCat = getCatById(newState, cat.id);
      if (movedCat) {
        setValidMoves(getValidMoves(newState, movedCat));
        setValidTargets(getValidAttackTargets(newState, movedCat).map(m => m.id));
      }
    }
  };

  // Handle mouse click for attack
  const handleMouseClick = (mouseId: string) => {
    if (gameState.phase !== 'cat-phase' || !gameState.activeCatId) return;

    if (validTargets.includes(mouseId)) {
      const newState = attackMouse(gameState, gameState.activeCatId, mouseId);
      setGameState(newState);

      // Update valid targets after attack
      const cat = getCatById(newState, gameState.activeCatId);
      if (cat) {
        setValidTargets(getValidAttackTargets(newState, cat).map(m => m.id));
      }
    }
  };

  const handleConfirmFormation = () => {
    if (gameState.setupCatsPlaced === 3) {
      setGameState(prev => ({
        ...prev,
        phase: 'cat-phase',
      }));
    }
  };

  const handleEndTurn = () => {
    if (gameState.phase !== 'cat-phase') return;

    // Clear selection
    setValidMoves([]);
    setValidTargets([]);
    setGameState(prev => ({ ...prev, selectedCatId: null, activeCatId: null }));

    // Execute mouse phase
    setTimeout(() => {
      setGameState(prev => {
        let newState = executeMousePhase(prev);

        // If still in wave phase, execute it
        if (newState.phase === 'wave-phase') {
          setTimeout(() => {
            setGameState(prev2 => executeWavePhase(prev2));
          }, 1000);
        }

        return newState;
      });
    }, 500);
  };

  const handleRestartGame = () => {
    setGameState(createInitialState());
    setDraggedCatId(null);
    setDragOverCell(null);
    setValidMoves([]);
    setValidTargets([]);
  };

  // Get selected cat for side panel
  const selectedCat = gameState.selectedCatId ? getCatById(gameState, gameState.selectedCatId) : null;

  return (
    <div className="app">
      {/* Top Bar */}
      <div className="top-bar">
        <div className="title-block">
          <h1>Pangur</h1>
          <div className="wave-info">Wave {gameState.turn}</div>
        </div>
        <div className="grain-counter">
          <span>🌾</span>
          <span>Grain {gameState.grain}</span>
        </div>
      </div>

      {/* Incoming Mice Row */}
      <div className="incoming-mice-row">
        <div className="incoming-mice-container">
          {Array.from({ length: scaredMice }).map((_, i) => (
            <span key={`scared-${i}`} className="mouse-icon scared">😱</span>
          ))}
          {Array.from({ length: enteringMice }).map((_, i) => (
            <span key={`entering-${i}`} className="mouse-icon">🐭</span>
          ))}
        </div>
        {totalMeow > 0 && (
          <div className="deterrence-info">
            Deterring: {scaredMice} mice
          </div>
        )}
      </div>

      {/* Central Board Region */}
      <div className="board-region">
        {/* Board Grid */}
        <div className="board-container">
          {ROWS.map(row =>
            COLUMNS.map(col => {
              const pos: Position = { col, row };
              const cat = getCatAtPosition(gameState, pos);
              const mouse = getMouseAtPosition(gameState, pos);

              // Determine cell class
              const isShadow = (col === 'A' || col === 'D') && row === 1;
              const isGate = (col === 'B' || col === 'C') && row === 4;
              const isDragOver = dragOverCell?.col === col && dragOverCell?.row === row;
              const isValidDrop = !isCellOccupied(gameState, pos);
              const isValidMoveTarget = validMoves.some(m => m.col === col && m.row === row);
              const isValidAttackTarget = mouse && validTargets.includes(mouse.id);

              return (
                <div
                  key={`${col}${row}`}
                  className={`board-cell ${isShadow ? 'shadow-bonus' : ''} ${isGate ? 'open-gate' : ''} ${isDragOver && isValidDrop ? 'drag-over' : ''} ${isValidMoveTarget ? 'valid-drop' : ''}`}
                  onDragOver={handleDragOver(pos)}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop(pos)}
                  onClick={() => handleCellClick(pos)}
                  style={{
                    cursor: isValidMoveTarget ? 'pointer' : 'default',
                  }}
                >
                  {cat && (
                    <CatPiece
                      cat={cat}
                      isSelected={gameState.selectedCatId === cat.id}
                      onDragStart={handleDragStart(cat.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleCatClick(cat.id)}
                    />
                  )}
                  {mouse && (
                    <div
                      onClick={(e) => {
                        e.stopPropagation();
                        handleMouseClick(mouse.id);
                      }}
                      style={{
                        width: '100%',
                        height: '100%',
                        cursor: isValidAttackTarget ? 'crosshair' : 'default',
                        border: isValidAttackTarget ? '2px solid #D96D55' : 'none',
                        borderRadius: '4px',
                      }}
                    >
                      <MousePiece mouse={mouse} />
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Side Panel (when cat selected) */}
        {selectedCat && selectedCat.position && (
          <div className="side-panel">
            <div className="cat-portrait">
              <img
                src={
                  selectedCat.name.includes('Pangur') || selectedCat.name.includes('Cruibne')
                    ? '/assets/Cruibne.png'
                    : selectedCat.name.includes('Baircne')
                    ? '/assets/Baircne.png'
                    : '/assets/Breonne.png'
                }
                alt={selectedCat.name}
              />
              <div className="role-ribbon">{selectedCat.role}</div>
            </div>

            <div className="stats-row">
              <div className="stat-item">
                <div className="stat-label">Catch</div>
                <div className={`stat-value catch ${getCatchBonus(selectedCat.position) > 0 ? 'glow-red' : ''}`}>
                  {calculateEffectiveCatch(selectedCat) - selectedCat.spentCatch}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Meow</div>
                <div
                  className={`stat-value meow ${
                    getMeowMultiplier(selectedCat.position.row) === 2 ? 'glow-blue' :
                    getMeowMultiplier(selectedCat.position.row) === 0.5 ? 'halved' :
                    getMeowMultiplier(selectedCat.position.row) === 0 ? 'disabled' : ''
                  }`}
                >
                  {calculateEffectiveMeow(selectedCat)}
                </div>
              </div>
            </div>

            <div className="hearts-panel">
              {Array.from({ length: selectedCat.maxHearts }).map((_, i) => (
                <span key={i} className="heart-icon">
                  {i < selectedCat.hearts ? '❤️' : '🤍'}
                </span>
              ))}
            </div>

            <div className="status-badges">
              {selectedCat.hasMoved && <div className="badge moved">Moved</div>}
              {selectedCat.spentCatch >= calculateEffectiveCatch(selectedCat) && (
                <div className="badge no-catch">Catch 0</div>
              )}
            </div>

            <div className="stat-detail">
              Catch: {calculateEffectiveCatch(selectedCat)}
              ({selectedCat.baseCatch} base
              {getCatchBonus(selectedCat.position) > 0 && ` +${getCatchBonus(selectedCat.position)} shadow bonus`})
            </div>
            <div className="stat-detail">
              Meow: {calculateEffectiveMeow(selectedCat)}
              ({selectedCat.baseMeow} base × {getMeowMultiplier(selectedCat.position.row)})
            </div>
          </div>
        )}
      </div>

      {/* Action Area */}
      <div className="action-area">
        {gameState.phase === 'setup' && (
          <>
            <div className="cat-hand">
              {gameState.cats.filter(c => c.position === null).map(cat => (
                <CatPiece
                  key={cat.id}
                  cat={cat}
                  inHand
                  isDragging={draggedCatId === cat.id}
                  onDragStart={handleDragStart(cat.id)}
                  onDragEnd={handleDragEnd}
                />
              ))}
            </div>
            {gameState.setupCatsPlaced < 3 ? (
              <div className="setup-message">
                <span className="setup-arrow">←</span>
                Drag cats onto the board to start (avoid perimeter cells)
              </div>
            ) : (
              <button className="btn primary" onClick={handleConfirmFormation}>
                Confirm Formation
              </button>
            )}
          </>
        )}

        {gameState.phase === 'cat-phase' && (
          <div className="action-buttons">
            <button className="btn primary" onClick={handleEndTurn}>
              End Turn
            </button>
            <button className="btn secondary" onClick={handleRestartGame}>
              Restart Game
            </button>
          </div>
        )}
      </div>

      {/* Game Over Overlay */}
      {(gameState.phase === 'win' || gameState.phase === 'loss') && (
        <div className="game-over-overlay">
          <div className={`game-over-content ${gameState.phase}`}>
            <h2>{gameState.phase === 'win' ? 'Victory!' : 'Defeat'}</h2>
            <p>
              {gameState.phase === 'win'
                ? 'You have successfully defended the building!'
                : 'The mice have overrun the building.'}
            </p>
            <button className="btn primary" onClick={handleRestartGame}>
              Play Again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
