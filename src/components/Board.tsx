import React from 'react';
import { Position, Column, Row, Cat, Mouse } from '../types';
import { Cell } from './Cell';
import { CatPiece } from './CatPiece';
import { MousePiece } from './MousePiece';
import { positionsEqual } from '../gameLogic';
import './Board.css';

interface BoardProps {
  cats: Cat[];
  mice: Mouse[];
  validMoves: Position[];
  validAttacks: Mouse[];
  selectedCatId: string | null;
  onCellDrop: (position: Position) => void;
  onCatClick: (catId: string) => void;
  onMouseClick: (mouseId: string) => void;
  onDragStart: (catId: string) => void;
  onDragEnd: () => void;
}

export const Board: React.FC<BoardProps> = ({
  cats,
  mice,
  validMoves,
  validAttacks,
  selectedCatId,
  onCellDrop,
  onCatClick,
  onMouseClick,
  onDragStart,
  onDragEnd,
}) => {
  const [dragOverCell, setDragOverCell] = React.useState<Position | null>(null);

  const rows: Row[] = [4, 3, 2, 1];
  const cols: Column[] = ['A', 'B', 'C', 'D'];

  const getCatAtPosition = (pos: Position) => {
    return cats.find(cat => cat.position && positionsEqual(cat.position, pos));
  };

  const getMouseAtPosition = (pos: Position) => {
    return mice.find(mouse => positionsEqual(mouse.position, pos));
  };

  const isValidMove = (pos: Position) => {
    return validMoves.some(move => positionsEqual(move, pos));
  };

  const isValidAttack = (pos: Position) => {
    const mouse = getMouseAtPosition(pos);
    return mouse ? validAttacks.some(m => m.id === mouse.id) : false;
  };

  const handleDragOver = (pos: Position) => {
    setDragOverCell(pos);
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  return (
    <div className="board">
      {rows.map(row => (
        <div key={row} className="board-row">
          {cols.map(col => {
            const pos: Position = { col, row };
            const cat = getCatAtPosition(pos);
            const mouse = getMouseAtPosition(pos);
            const isDragOver = dragOverCell && positionsEqual(dragOverCell, pos);

            return (
              <Cell
                key={`${col}${row}`}
                position={pos}
                isValidMove={isValidMove(pos)}
                isValidAttack={isValidAttack(pos)}
                isDragOver={!!isDragOver}
                onDrop={onCellDrop}
                onDragOver={() => handleDragOver(pos)}
                onDragLeave={handleDragLeave}
              >
                {cat && (
                  <CatPiece
                    cat={cat}
                    isSelected={cat.id === selectedCatId}
                    onClick={() => onCatClick(cat.id)}
                    onDragStart={() => onDragStart(cat.id)}
                    onDragEnd={onDragEnd}
                  />
                )}
                {mouse && (
                  <MousePiece
                    mouse={mouse}
                    isTargetable={validAttacks.some(m => m.id === mouse.id)}
                    onClick={() => onMouseClick(mouse.id)}
                  />
                )}
              </Cell>
            );
          })}
        </div>
      ))}
    </div>
  );
};
