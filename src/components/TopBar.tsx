import { useGameStore } from '../state/gameStore';
import type { Phase } from '../types';

const MAX_GRAIN_LOSS = 32;

interface TopBarProps {
  grainLoss: number;
  wave: number;
  phase: Phase;
}

const phaseLabels: Record<Phase, string> = {
  setup: 'Setup Phase',
  cat: 'Cat Phase',
  stepper: 'Resolving Phases',
};

function TopBar({ grainLoss, wave, phase }: TopBarProps) {
  const resetGame = useGameStore((state) => state.resetGame);

  return (
    <header className="top-bar">
      <div className="top-bar-title">Pangur — Wave {wave}</div>
      <div className="top-bar-metric" aria-label="Current phase">
        <span>⚙️</span>
        <span>{phaseLabels[phase]}</span>
      </div>
      <div className="top-bar-metric" aria-label="Grain remaining">
        <span>🌾</span>
        <span>Grain Loss {grainLoss} / {MAX_GRAIN_LOSS}</span>
      </div>
      <button type="button" className="top-bar-restart" onClick={resetGame}>
        Restart Game
      </button>
    </header>
  );
}

export default TopBar;
