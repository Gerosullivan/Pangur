import type { DragEvent } from 'react';
import { useGameStore } from '../state/gameStore';
import { catDefinitions } from '../lib/cats';
import CatPiece from './CatPiece';
import type { CatId } from '../types';

function CatStagingArea() {
  const phase = useGameStore((state) => state.phase);
  const handCats = useGameStore((state) => state.handCats);
  const cats = useGameStore((state) => state.cats);

  // Only render during setup phase
  if (phase !== 'setup') {
    return null;
  }

  const handleDragStart = (event: DragEvent<HTMLDivElement>, catId: CatId) => {
    // Transfer the cat ID for drop handling
    event.dataTransfer.setData('text/plain', catId);
    event.dataTransfer.effectAllowed = 'move';

    // The browser will automatically use the dragged element as the drag preview
    // which includes the full piece (border, stats, hearts, and images)
  };

  return (
    <div className="cat-staging">
      {handCats.map((catId) => {
        const definition = catDefinitions[catId];
        const cat = cats[catId];
        return (
          <div key={catId} className="cat-staging-piece">
            <CatPiece
              cat={cat}
              catId={catId}
              effectiveCatch={definition.baseCatch}
              effectiveMeow={definition.baseMeow}
              remainingCatch={definition.baseCatch}
              isSelected={false}
              cellRef={`staging-${catId}`}
              inHand
              draggable
              onDragStart={(event) => handleDragStart(event, catId)}
            />
          </div>
        );
      })}
    </div>
  );
}

export default CatStagingArea;
