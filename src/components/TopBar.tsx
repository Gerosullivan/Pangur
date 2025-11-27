import { useGameStore } from '../state/gameStore';
import type { Phase, GameStatus, DeterrencePreview } from '../types';

const MAX_GRAIN_LOSS = 32;

interface TopBarProps {
  grainLoss: number;
  wave: number;
  deterPreview: DeterrencePreview;
  phase: Phase;
  status: GameStatus;
}

const phaseLabels: Record<Phase, string> = {
  setup: 'Setup Phase',
  cat: 'Cat Phase',
  stepper: 'Resolving Phases',
};

function TopBar({ grainLoss, wave, deterPreview, phase, status }: TopBarProps) {
  const resetGame = useGameStore((state) => state.resetGame);
  const statusLabel =
    status.state === 'playing'
      ? 'In Progress'
      : status.state === 'won'
      ? `Victory — ${status.reason ?? ''}`.trim()
      : `Defeat — ${status.reason ?? ''}`.trim();

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
      <div className="top-bar-metric" aria-label="Deterrence preview">
        <span>😼</span>
        <span>
          Meowge {deterPreview.meowge} · Deterred {deterPreview.deterred} · Entering {deterPreview.entering}
        </span>
      </div>
      <div className="top-bar-metric" aria-label="Game status">
        <span>{status.state === 'won' ? '🏆' : status.state === 'lost' ? '☠️' : '🎲'}</span>
        <span>{statusLabel}</span>
      </div>
      <button type="button" className="top-bar-restart" onClick={resetGame}>
        Restart Game
      </button>
    </header>
  );
}

export default TopBar;
