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
    guardMessage,
    start,
    next,
    close,
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
  const total = steps.length;
  const progress = Math.min(1, total > 0 ? (index + 1) / total : 0);

  return (
    <div className="tutorial-panel">
      <div className="tutorial-header">
        <div className="tutorial-title-row">
          <div className="tutorial-title">{step?.title ?? 'Tutorial'}</div>
        </div>
      </div>

      <div className="tutorial-body with-action">
        <div className="tutorial-copy">
          <p className="tutorial-text">{step?.text}</p>
          {step?.instruction && <p className="tutorial-instruction">{step.instruction}</p>}
          {guardMessage && guardMessage !== step?.instruction && (
            <p className="tutorial-note">{guardMessage}</p>
          )}
        </div>
        {showNext && (
          <div className="tutorial-footer next-only">
            <button type="button" className="button-primary" onClick={next} disabled={locked || atEnd}>
              Next
            </button>
          </div>
        )}
        {!showNext && atEnd && (
          <div className="tutorial-footer next-only">
            <button
              type="button"
              className="button-primary"
              onClick={close}
            >
              Close
            </button>
          </div>
        )}
      </div>
      <div className="tutorial-progress">
        <div className="tutorial-progress-fill" style={{ width: `${progress * 100}%` }} />
      </div>
    </div>
  );
}

export default TutorialPanel;
