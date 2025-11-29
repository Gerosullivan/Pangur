import { useEffect, useMemo } from 'react';
import { useGameStore } from '../state/gameStore';
import { useTutorialStore } from '../state/tutorialStore';

function TutorialPanel() {
  const log = useGameStore((state) => state.log);
  const {
    active,
    index,
    steps,
    locked,
    start,
    next,
    prev,
    exit,
    syncWithLog,
  } = useTutorialStore();

  const step = useMemo(() => steps[index], [steps, index]);

  useEffect(() => {
    syncWithLog(log);
  }, [log, syncWithLog]);

  if (!active) {
    const handleStart = () => {
      start();
      syncWithLog(log);
    };

    return (
      <div className="tutorial-panel tutorial-panel-inactive">
        <div className="tutorial-header">
          <div>
            <div className="tutorial-title">Tutorial</div>
            <div className="tutorial-subtitle">Step-by-step guide to Pangur</div>
          </div>
          <button type="button" className="button-secondary" onClick={handleStart}>
            Start Tutorial
          </button>
        </div>
      </div>
    );
  }

  const atStart = index === 0;
  const atEnd = index >= steps.length - 1;
  const showNext = step?.showNext !== false;

  return (
    <div className="tutorial-panel">
      <div className="tutorial-header">
        <div>
          <div className="tutorial-title">{step?.title ?? 'Tutorial'}</div>
          <div className="tutorial-subtitle">
            Step {index + 1} / {steps.length}
          </div>
        </div>
        <button type="button" className="button-quiet" onClick={exit}>
          Exit
        </button>
      </div>

      <div className="tutorial-body">
        <p className="tutorial-text">{step?.text}</p>
        {step?.instruction && <p className="tutorial-instruction">{step.instruction}</p>}
      </div>

      <div className="tutorial-footer">
        <button type="button" className="button-secondary" onClick={prev} disabled={atStart}>
          Back
        </button>
        {showNext ? (
          <button type="button" className="button-primary" onClick={next} disabled={locked || atEnd}>
            Next
          </button>
        ) : (
          <span className="tutorial-note">Follow the in-game prompt to advance.</span>
        )}
      </div>
    </div>
  );
}

export default TutorialPanel;
