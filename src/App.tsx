import { useMemo } from 'react';
import './App.css';
import { useGameStore } from './state/gameStore';
import TopBar from './components/TopBar';
import IncomingQueueRow from './components/IncomingQueueRow';
import Board from './components/Board';
import SidePanel from './components/SidePanel';
import ActionArea from './components/ActionArea';

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
      <IncomingQueueRow />
      <div className="board-region">
        <Board />
        <SidePanel />
      </div>
      <ActionArea />
    </div>
  );
}

export default App;
