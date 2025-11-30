import { useMemo } from 'react';
import './App.css';
import { useGameStore } from './state/gameStore';
import Board from './components/Board';
import IncomingLane from './components/IncomingLane';
import SidePanel from './components/SidePanel';
import ControlPanel from './components/ControlPanel';
import TutorialPanel from './components/TutorialPanel';
import TutorialHighlights from './components/TutorialHighlights';
import type { Phase } from './types';

function App() {
  const phase = useGameStore((state) => state.phase);
  const grainLoss = useGameStore((state) => state.grainLoss);
  const wave = useGameStore((state) => state.wave);
  const resetGame = useGameStore((state) => state.resetGame);
  const showOpeningOverlay = useGameStore((state) => state.showOpeningOverlay);
  const startHardGame = useGameStore((state) => state.startHardGame);

  const phaseLabels: Record<Phase, string> = {
    setup: 'Setup Phase',
    cat: 'Cat Phase',
    stepper: 'Resolving Phases',
  };
  const isOpeningScreen = phase === 'setup' && showOpeningOverlay;
  const shellClass = useMemo(
    () => `app-shell phase-${phase}${isOpeningScreen ? ' opening' : ''}`,
    [phase, isOpeningScreen]
  );

  return (
    <div className={shellClass}>
      <div className="wave-badge">Wave {wave}</div>
      <div className="grain-badge">Grain Loss {grainLoss} / 32</div>
      <div className="phase-badge">{phaseLabels[phase]}</div>
      <button type="button" className="restart-floating" onClick={resetGame}>Restart</button>
      <TutorialHighlights />
      <div className="play-area">
        <div className="play-column">
          <IncomingLane />
          <div className="board-backdrop" aria-hidden />
          {isOpeningScreen && <div className="hero-overlay" aria-hidden />}
          <Board />
        </div>
        <div className="right-column">
          {isOpeningScreen ? (
            <>
              <TutorialPanel />
              <div className="start-panel">
                <h3>Start Game</h3>
                <p>Jump into the hard perimeter defense layout.</p>
                <button type="button" className="button-primary" onClick={startHardGame}>
                  Start (Hard)
                </button>
              </div>
            </>
          ) : (
            <>
              <SidePanel />
              <TutorialPanel />
              <ControlPanel />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
