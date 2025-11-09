import { useMemo, type DragEvent } from 'react';
import { useGameStore } from '../state/gameStore';
import CatPiece from './CatPiece';
import MousePiece from './MousePiece';
import { catDefinitions } from '../lib/cats';
import { columns, rows, parseCell, isShadowBonus, getNeighborCells, isPerimeter } from '../lib/board';
import type { CatId, CatState, CellId, CellState } from '../types';

function Board() {
  const cells = useGameStore((state) => state.cells);
  const cats = useGameStore((state) => state.cats);
  const mice = useGameStore((state) => state.mice);
  const phase = useGameStore((state) => state.phase);
  const selectedCatId = useGameStore((state) => state.selectedCatId);
  const selectCat = useGameStore((state) => state.selectCat);
  const placeCat = useGameStore((state) => state.placeCat);
  const moveCat = useGameStore((state) => state.moveCat);
  const attackMouse = useGameStore((state) => state.attackMouse);
  const stepper = useGameStore((state) => state.stepper);

  const catStats = useMemo(() => {
    const result = new Map<CatId, { effectiveCatch: number; effectiveMeow: number; remainingCatch: number }>();
    (Object.keys(cats) as CatId[]).forEach((id) => {
      const cat = cats[id];
      const definition = catDefinitions[id];
      let effectiveCatch = definition.baseCatch;
      let effectiveMeow = 0;
      if (cat.position) {
        if (isShadowBonus(cat.position)) {
          effectiveCatch += 1;
        }
        const row = parseCell(cat.position).row;
        if (row === 4) effectiveMeow = definition.baseMeow * 2;
        else if (row === 3) effectiveMeow = definition.baseMeow;
        else if (row === 2) effectiveMeow = Math.floor(definition.baseMeow * 0.5);
        else effectiveMeow = 0;
      }
      const remainingCatch = Math.max(effectiveCatch - cat.catchSpent, 0);
      result.set(id, { effectiveCatch, effectiveMeow, remainingCatch });
    });
    return result;
  }, [cats]);

  const validMoves = useMemo(() => {
    if (phase !== 'cat' || !selectedCatId) return new Set<CellId>();
    const cat = cats[selectedCatId];
    if (!cat.position || cat.turnEnded) return new Set<CellId>();
    const secondMoveWindow = selectedCatId === 'pangur' && canPangurTakeSecondMove(cat);
    if (cat.moveUsed && !secondMoveWindow) return new Set<CellId>();
    if (selectedCatId === 'pangur') {
      return getQueenMoves(cat.position, cells);
    }
    return getKingMoves(cat.position, cells);
  }, [phase, selectedCatId, cats, cells]);

  const attackTargets = useMemo(() => {
    if (phase !== 'cat' || !selectedCatId) return new Set<CellId>();
    const cat = cats[selectedCatId];
    if (!cat.position || cat.turnEnded) return new Set<CellId>();
    const stats = catStats.get(selectedCatId);
    if (!stats || stats.remainingCatch <= 0) return new Set<CellId>();
    const neighborIds = getNeighborCells(cat.position);
    return new Set<CellId>(
      neighborIds.filter((cellId) => {
        const occupant = cells[cellId]?.occupant;
        return occupant?.type === 'mouse' && mice[occupant.id];
      })
    );
  }, [phase, selectedCatId, cats, cells, catStats, mice]);

  const attackHighlight = useMemo(() => {
    if (phase !== 'stepper' || !stepper) return null;
    if (stepper.index >= stepper.frames.length) return null;
    const frame = stepper.frames[stepper.index];
    if (!frame || frame.phase !== 'mouse-attack') {
      return null;
    }
    const { mouseId, targetId } = frame.payload as { mouseId: string; targetId: CatId };
    return {
      mouseId,
      mouseCell: mice[mouseId]?.position,
      catId: targetId,
      catCell: cats[targetId]?.position,
    };
  }, [phase, stepper, mice, cats]);

  const handleCellClick = (cell: CellState) => {
    const occupant = cell.occupant;
    if (occupant?.type === 'cat') {
      selectCat(occupant.id);
      return;
    }
    if (phase === 'setup' && selectedCatId) {
      if (!occupant && !isPerimeter(cell.id)) {
        placeCat(selectedCatId, cell.id);
      }
      return;
    }

    if (phase === 'cat' && selectedCatId) {
      if (!cats[selectedCatId].position || cats[selectedCatId].turnEnded) return;
      if (!occupant && validMoves.has(cell.id)) {
        moveCat(selectedCatId, cell.id);
        return;
      }
      if (occupant?.type === 'mouse' && attackTargets.has(cell.id) && mice[occupant.id]) {
        attackMouse(selectedCatId, occupant.id);
      }
    }
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>, cell: CellState) => {
    if (phase !== 'setup') return;
    if (cell.occupant) return;
    event.preventDefault();
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, cell: CellState) => {
    if (phase !== 'setup') return;
    event.preventDefault();
    const transferred = event.dataTransfer.getData('text/plain') as CatId;
    if (!transferred) return;
    if (cell.occupant) return;
    placeCat(transferred, cell.id);
    event.dataTransfer.clearData();
  };

  return (
    <div className="game-board">
      {rows
        .slice()
        .reverse()
        .map((row) =>
          columns.map((column) => {
            const id = `${column}${row}` as CellId;
            const cell = cells[id];
            const occupant = cell?.occupant;
            const isSelected = occupant?.type === 'cat' && occupant.id === selectedCatId;
            const isValidMove = !occupant && validMoves.has(id);
            const isValidAttack = occupant?.type === 'mouse' && attackTargets.has(id);
            const cellClasses = [
              'board-cell',
              cell.terrain,
              isSelected ? 'selected' : undefined,
              isValidMove ? 'valid-move' : undefined,
              isValidAttack ? 'valid-attack' : undefined,
            ]
              .filter(Boolean)
              .join(' ');

            return (
              <div
                key={id}
                className={cellClasses}
                onClick={() => handleCellClick(cell)}
                onDragOver={(event) => handleDragOver(event, cell)}
                onDrop={(event) => handleDrop(event, cell)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    handleCellClick(cell);
                  }
                }}
                aria-label={`Cell ${id}`}
              >
                {occupant?.type === 'cat' && cats[occupant.id] && (
                  <CatPiece
                    cat={cats[occupant.id]}
                    catId={occupant.id}
                    effectiveCatch={catStats.get(occupant.id)?.effectiveCatch ?? 0}
                    effectiveMeow={catStats.get(occupant.id)?.effectiveMeow ?? 0}
                    remainingCatch={catStats.get(occupant.id)?.remainingCatch ?? 0}
                    isSelected={isSelected}
                    onSelect={selectCat}
                    cellRef={id}
                    highlighted={attackHighlight?.catCell === id && attackHighlight.catId === occupant.id}
                  />
                )}
                {occupant?.type === 'mouse' && mice[occupant.id] && (
                  <MousePiece
                    mouse={mice[occupant.id]}
                    highlighted={attackHighlight?.mouseCell === id && attackHighlight.mouseId === occupant.id}
                  />
                )}
                {!occupant && <span style={{ position: 'absolute', bottom: 6, right: 8, fontSize: '0.65rem', opacity: 0.4 }}>{id}</span>}
              </div>
            );
          })
        )}
    </div>
  );
}

function canPangurTakeSecondMove(cat?: CatState): boolean {
  if (!cat) return false;
  if (cat.id !== 'pangur') return false;
  if (cat.turnEnded) return false;
  if (cat.specialSequence !== 'move-attack-move') return false;
  return cat.specialLeg === 'attack-after-move' || cat.specialLeg === 'second-move';
}

function getQueenMoves(origin: CellId, cells: Record<CellId, CellState>): Set<CellId> {
  const { column, row } = parseCell(origin);
  const originColumnIndex = columns.indexOf(column);
  const originRowIndex = rows.indexOf(row);
  const deltas = [
    [-1, -1],
    [-1, 0],
    [-1, 1],
    [0, -1],
    [0, 1],
    [1, -1],
    [1, 0],
    [1, 1],
  ];
  const moves = new Set<CellId>();
  deltas.forEach(([dc, dr]) => {
    let step = 1;
    while (true) {
      const nextColumn = columns[originColumnIndex + dc * step];
      const nextRow = rows[originRowIndex + dr * step];
      if (!nextColumn || !nextRow) break;
      const id = `${nextColumn}${nextRow}` as CellId;
      if (cells[id].occupant) break;
      moves.add(id);
      step += 1;
    }
  });
  return moves;
}

function getKingMoves(origin: CellId, cells: Record<CellId, CellState>): Set<CellId> {
  const neighbors = getNeighborCells(origin);
  const moves = neighbors.filter((cellId) => !cells[cellId]?.occupant);
  return new Set<CellId>(moves);
}

export default Board;
