import { useMemo } from 'react';
import './App.css';
import { useGameStore } from './state/gameStore';
import TopBar from './components/TopBar';
import Board from './components/Board';
import IncomingLane from './components/IncomingLane';
import SidePanel from './components/SidePanel';
import ActionArea from './components/ActionArea';
import CatStagingArea from './components/CatStagingArea';

function App() {
  const phase = useGameStore((state) => state.phase);
  const grainLoss = useGameStore((state) => state.grainLoss);
  const wave = useGameStore((state) => state.wave);
  const deterPreview = useGameStore((state) => state.deterPreview);
  const status = useGameStore((state) => state.status);

  const shellClass = useMemo(() => `app-shell phase-${phase}`, [phase]);

  return (
    <div className={shellClass}>
      <TopBar grainLoss={grainLoss} wave={wave} deterPreview={deterPreview} phase={phase} status={status} />
      <div className="play-area">
        <div className="play-column">
          <IncomingLane />
          <Board />
          <CatStagingArea />
          <ActionArea />
        </div>
        <SidePanel />
      </div>
    </div>
  );
}

export default App;
