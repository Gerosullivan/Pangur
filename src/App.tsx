import { useMemo } from 'react';
import './App.css';
import { useGameStore } from './state/gameStore';
import TopBar from './components/TopBar';
import Board from './components/Board';
import IncomingLane from './components/IncomingLane';
import SidePanel from './components/SidePanel';
import ControlPanel from './components/ControlPanel';
import TutorialPanel from './components/TutorialPanel';
import TutorialHighlights from './components/TutorialHighlights';

function App() {
  const phase = useGameStore((state) => state.phase);
  const grainLoss = useGameStore((state) => state.grainLoss);
  const wave = useGameStore((state) => state.wave);

  const shellClass = useMemo(() => `app-shell phase-${phase}`, [phase]);

  return (
    <div className={shellClass}>
      <TopBar grainLoss={grainLoss} wave={wave} phase={phase} />
      <TutorialHighlights />
      <div className="play-area">
        <div className="play-column">
          <IncomingLane />
          <Board />
        </div>
        <div className="right-column">
          <SidePanel />
          <TutorialPanel />
          <ControlPanel />
        </div>
      </div>
    </div>
  );
}

export default App;
