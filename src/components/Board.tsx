import { useMemo, useState, type DragEvent } from 'react';
import { useGameStore } from '../state/gameStore';
import CatPiece from './CatPiece';
import MousePiece from './MousePiece';
import { columns, rows, parseCell, isShadowBonus, getNeighborCells, isPerimeter, isGate } from '../lib/board';
import { getCatEffectiveCatch, getCatEffectiveMeow, getCatRemainingCatch } from '../lib/mechanics';
import { useTutorialStore } from '../state/tutorialStore';
import type { CatId, CellId, CellState } from '../types';

type TerrainTooltip = {
  title: string;
  cats: string;
  mice: string;
};

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
  const status = useGameStore((state) => state.status);

  const catStats = useMemo(() => {
    const context = { cats, cells };
    const result = new Map<CatId, { effectiveCatch: number; effectiveMeow: number; remainingCatch: number }>();
    (Object.keys(cats) as CatId[]).forEach((id) => {
      const effectiveCatch = getCatEffectiveCatch(context, id);
      const effectiveMeow = getCatEffectiveMeow(context, id);
      const remainingCatch = getCatRemainingCatch(context, id);
      result.set(id, { effectiveCatch, effectiveMeow, remainingCatch });
    });
    return result;
  }, [cats, cells]);

  const validMoves = useMemo(() => {
    if (phase !== 'cat' || !selectedCatId) return new Set<CellId>();
    const cat = cats[selectedCatId];
    if (!cat.position || cat.turnEnded || cat.movesRemaining <= 0) return new Set<CellId>();
    return getQueenMoves(cat.position, cells);
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

  const tutorialLocked = useTutorialStore(
    (state) => state.active && Boolean(state.steps[state.index]?.lockBoard)
  );

  const [hoveredCatCell, setHoveredCatCell] = useState<CellId | null>(null);

  const handleCellClick = (cell: CellState) => {
    const occupant = cell.occupant;
    if (occupant?.type === 'cat') {
      selectCat(occupant.id);
      return;
    }
    if (phase === 'setup' && selectedCatId) {
      if (!occupant) {
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

  const getMovableCells = (catId: CatId): Set<CellId> => {
    const cat = cats[catId];
    if (!cat || !cat.position || cat.turnEnded || cat.movesRemaining <= 0) return new Set<CellId>();
    return getQueenMoves(cat.position, cells);
  };

  const canDropCat = (cell: CellState, draggedCatId?: string | CatId) => {
    if (cell.occupant) return false;
    if (phase === 'setup') {
      return true;
    }
    if (phase === 'cat' && status.state === 'playing' && draggedCatId) {
      const movableCells = getMovableCells(draggedCatId as CatId);
      return movableCells.has(cell.id);
    }
    return false;
  };

  const handleDragStart = (event: DragEvent<HTMLDivElement>, catId: CatId) => {
    event.dataTransfer.setData('text/plain', catId);
    event.dataTransfer.effectAllowed = 'move';
    selectCat(catId);
  };

  const handleDragOver = (event: DragEvent<HTMLDivElement>, cell: CellState) => {
    const draggedCatId = (event.dataTransfer.getData('text/plain') as CatId) || undefined;
    const draggedOrSelectedId = draggedCatId || selectedCatId;
    if (!canDropCat(cell, draggedOrSelectedId)) return;
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, cell: CellState) => {
    const draggedCatId = event.dataTransfer.getData('text/plain') as CatId;
    if (!canDropCat(cell, draggedCatId)) return;
    event.preventDefault();
    if (phase === 'setup') {
      placeCat(draggedCatId, cell.id);
    } else if (phase === 'cat') {
      moveCat(draggedCatId, cell.id);
      selectCat(draggedCatId);
    }
    event.dataTransfer.clearData();
  };

  const boardCells = rows
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
        const tooltip = getTerrainTooltip(cell.terrain);
        const isTopRow = row === rows[rows.length - 1];
        const catHovering = hoveredCatCell === id;
        const cellClasses = [
          'board-cell',
          cell.terrain,
          isSelected ? 'selected' : undefined,
          isValidMove ? 'valid-move' : undefined,
          isValidAttack ? 'valid-attack' : undefined,
          isTopRow ? 'tooltip-below' : undefined,
          catHovering ? 'cat-hover' : undefined,
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
            <div className="cell-overlay" />
            <div className="cell-content">
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
                  gateGlow={isGate(id)}
                  draggable={phase === 'setup' || (phase === 'cat' && status.state === 'playing' && !cats[occupant.id].turnEnded && cats[occupant.id].movesRemaining > 0)}
                  onDragStart={(event) => handleDragStart(event, occupant.id)}
                  onDragEnd={() => setHoveredCatCell(null)}
                  onMouseEnter={() => setHoveredCatCell(id)}
                  onMouseLeave={() => setHoveredCatCell(null)}
                />
              )}
              {occupant?.type === 'mouse' && mice[occupant.id] && (
                <MousePiece
                  mouse={mice[occupant.id]}
                  highlighted={attackHighlight?.mouseCell === id && attackHighlight.mouseId === occupant.id}
                />
              )}
              {!occupant && <span className="cell-id-debug">{id}</span>}
            </div>
            <div className="cell-tooltip" aria-hidden="true">
              <div className="cell-tooltip-title">{tooltip.title}</div>
              <div className="cell-tooltip-row">
                <span className="cell-tooltip-label">Cats</span>
                <span className="cell-tooltip-text">{tooltip.cats}</span>
              </div>
              <div className="cell-tooltip-row">
                <span className="cell-tooltip-label">Mice</span>
                <span className="cell-tooltip-text">{tooltip.mice}</span>
              </div>
            </div>
          </div>
        );
      })
    );

  return (
    <div
      className="board-wrapper"
      style={tutorialLocked ? { pointerEvents: 'none' } : undefined}
    >
      <div className="board-grid game-board">{boardCells}</div>
    </div>
  );
}

function getTerrainTooltip(terrain: CellState['terrain']): TerrainTooltip {
  if (terrain === 'shadow') {
    return {
      title: 'Shadow',
      cats: 'Start an attack here for +1 Shadow Strike catch; meow stays muted.',
      mice: 'Eating grain on shadow upgrades them +1/+1 and they prioritize moving onto these tiles.',
    };
  }
  if (terrain === 'gate') {
    return {
      title: 'Gate',
      cats: 'Standing here activates their full meow to scare the incoming wave.',
      mice: 'Incoming mice enter through gates; no shadow boost while they stand here.',
    };
  }
  return {
    title: 'Interior',
    cats: 'No special bonuses; catch and meow stay at their base values.',
    mice: 'No upgrade from feeding and no special movement bias here.',
  };
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

export default Board;
