import type { Phase, GameState, GameStatus } from '../types';

interface TopBarProps {
  grain: number;
  wave: number;
  deterPreview: GameState['deterPreview'];
  phase: Phase;
  status: GameStatus;
}

const phaseLabels: Record<Phase, string> = {
  setup: 'Setup Phase',
  cat: 'Cat Phase',
  stepper: 'Resolving Phases',
};

function TopBar({ grain, wave, deterPreview, phase, status }: TopBarProps) {
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
        <span>Grain {grain}</span>
      </div>
      <div className="top-bar-metric" aria-label="Deterrence preview">
        <span>😼</span>
        <span>
          Meow {deterPreview.totalMeow} → Scaring {deterPreview.scared} / Incoming {deterPreview.entering}
        </span>
      </div>
      <div className="top-bar-metric" aria-label="Game status">
        <span>{status.state === 'won' ? '🏆' : status.state === 'lost' ? '☠️' : '🎲'}</span>
        <span>{statusLabel}</span>
      </div>
    </header>
  );
}

export default TopBar;
