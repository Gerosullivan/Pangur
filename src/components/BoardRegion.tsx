import { useState } from 'react';
import { GameState, Position, Column, Row } from '../types';
import { getCatAtPosition, getMouseAtPosition, isShadowBonusCell, isOpenGateCell, getCurrentCatStats, parsePosition, isCellOccupied } from '../gameState';
import { getValidMoves, canAttackPosition, attackMouse, moveCat } from '../gameLogic';
import CatPiece from './CatPiece';
import MousePiece from './MousePiece';
import './BoardRegion.css';

interface BoardRegionProps {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

function BoardRegion({ gameState, setGameState }: BoardRegionProps) {
  const columns: Column[] = ['A', 'B', 'C', 'D'];
  const rows: Row[] = [4, 3, 2, 1]; // Top to bottom
  const [draggedCatId, setDraggedCatId] = useState<string | null>(null);
  const [dragOverCell, setDragOverCell] = useState<Position | null>(null);

  const selectedCat = gameState.cats.find(c => c.id === gameState.selectedCatId);

  const handleCellClick = (position: Position) => {
    if (gameState.phase === 'cat') {
      // Handle cat movement or attack
      if (selectedCat && selectedCat.position !== 'hand') {
        const targetMouse = getMouseAtPosition(gameState.mice, position);

        if (targetMouse) {
          // Attack the mouse
          if (canAttackPosition(selectedCat, position, gameState.mice)) {
            const newState = attackMouse(gameState, selectedCat.id, position);
            setGameState(newState);
          }
        } else {
          // Move the cat
          const validMoves = getValidMoves(selectedCat, gameState.cats, gameState.mice);
          if (validMoves.includes(position)) {
            const newState = moveCat(gameState, selectedCat.id, position);
            setGameState(newState);
          }
        }
      }
    }
  };

  const handleCatSelect = (catId: string) => {
    if (gameState.phase === 'cat' || gameState.phase === 'setup') {
      setGameState(prev => ({
        ...prev,
        selectedCatId: prev.selectedCatId === catId ? null : catId,
      }));
    }
  };

  // Drag handlers
  const handleDragStart = (catId: string) => {
    setDraggedCatId(catId);
  };

  const handleDragEnd = () => {
    setDraggedCatId(null);
    setDragOverCell(null);
  };

  const handleDragOver = (e: React.DragEvent, position: Position) => {
    e.preventDefault();
    setDragOverCell(position);
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDrop = (e: React.DragEvent, position: Position) => {
    e.preventDefault();

    if (!draggedCatId) return;

    // Check if cell is valid for placement
    const isOccupied = isCellOccupied(gameState.cats, gameState.mice, position);

    if (gameState.phase === 'setup') {
      // During setup, can only place on empty interior cells
      if (!isOccupied) {
        setGameState(prev => ({
          ...prev,
          cats: prev.cats.map(cat =>
            cat.id === draggedCatId ? { ...cat, position } : cat
          ),
        }));
      }
    }

    setDraggedCatId(null);
    setDragOverCell(null);
  };

  // Calculate valid moves and attack targets for selected cat
  const validMoves = selectedCat && gameState.phase === 'cat'
    ? getValidMoves(selectedCat, gameState.cats, gameState.mice)
    : [];
  const validAttacks = selectedCat && gameState.phase === 'cat'
    ? gameState.mice
        .filter(m => canAttackPosition(selectedCat, m.position, gameState.mice))
        .map(m => m.position)
    : [];

  return (
    <div className="board-region">
      <div className="board-container">
        <div className="board-grid">
          {rows.map(row =>
            columns.map(col => {
              const position: Position = `${col}${row}`;
              const cat = getCatAtPosition(gameState.cats, position);
              const mouse = getMouseAtPosition(gameState.mice, position);

              let cellClass = 'board-cell';
              if (isShadowBonusCell(position)) cellClass += ' shadow-bonus';
              if (isOpenGateCell(position)) cellClass += ' open-gate';
              if (dragOverCell === position) cellClass += ' drag-over';
              if (gameState.phase === 'setup' && !cat && !mouse) cellClass += ' valid-drop';
              if (validMoves.includes(position)) cellClass += ' valid-move';
              if (validAttacks.includes(position)) cellClass += ' valid-attack';

              return (
                <div
                  key={position}
                  className={cellClass}
                  onClick={() => handleCellClick(position)}
                  onDragOver={(e) => handleDragOver(e, position)}
                  onDragLeave={handleDragLeave}
                  onDrop={(e) => handleDrop(e, position)}
                  data-position={position}
                >
                  {cat && (
                    <CatPiece
                      cat={cat}
                      isSelected={cat.id === gameState.selectedCatId}
                      onClick={(e) => {
                        e?.stopPropagation();
                        handleCatSelect(cat.id);
                      }}
                      onDragStart={() => handleDragStart(cat.id)}
                      onDragEnd={handleDragEnd}
                    />
                  )}
                  {mouse && <MousePiece mouse={mouse} />}

                  {/* Position label for debugging */}
                  <div style={{
                    position: 'absolute',
                    top: 2,
                    left: 2,
                    fontSize: 10,
                    color: '#999',
                    pointerEvents: 'none',
                  }}>
                    {position}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Side panel shows when cat is selected */}
      {selectedCat && (
        <div className="side-panel">
          <div className="cat-portrait">
            🐱
            <div className="role-ribbon">{selectedCat.role}</div>
          </div>

          <h3>{selectedCat.name}</h3>

          <div className="stats-row">
            <span className="stat-catch">Catch: {getCurrentCatStats(selectedCat).catch}</span>
            <span className="stat-meow">Meow: {getCurrentCatStats(selectedCat).meow}</span>
          </div>

          <div className="hearts-panel">
            {Array.from({ length: selectedCat.hearts }).map((_, i) => (
              <span key={i}>❤️</span>
            ))}
            {Array.from({ length: 5 - selectedCat.hearts }).map((_, i) => (
              <span key={`empty-${i}`}>🤍</span>
            ))}
          </div>

          <div className="status-badges">
            {selectedCat.hasMoved && <div className="badge">Moved</div>}
            {selectedCat.spentCatch >= selectedCat.baseStats.catch && (
              <div className="badge">Catch 0</div>
            )}
          </div>

          {selectedCat.position !== 'hand' && (
            <div className="stat-detail">
              Attack: {getCurrentCatStats(selectedCat).catch}
              ({selectedCat.baseStats.catch} base
              {isShadowBonusCell(selectedCat.position as Position) && ' +1 shadow'}
              {selectedCat.spentCatch > 0 && ` -${selectedCat.spentCatch} spent`})
            </div>
          )}

          {selectedCat.position !== 'hand' && (
            <div className="stat-detail">
              Meow: {getCurrentCatStats(selectedCat).meow}
              ({selectedCat.baseStats.meow} base × {
                ['0', '0.5', '1', '2'][parsePosition(selectedCat.position as Position).row - 1]
              })
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default BoardRegion;
