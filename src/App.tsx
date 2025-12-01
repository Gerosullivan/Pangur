import { useMemo } from "react";
import "./App.css";
import { useGameStore } from "./state/gameStore";
import { useTutorialStore } from "./state/tutorialStore";
import Board from "./components/Board";
import IncomingLane from "./components/IncomingLane";
import SidePanel from "./components/SidePanel";
import ControlPanel from "./components/ControlPanel";
import TutorialHighlights from "./components/TutorialHighlights";
import PanelActions from "./components/PanelActions";
import TutorialPanel from "./components/TutorialPanel";
import AudioControls from "./components/AudioControls";
import coverStart from "../assets/cover_start_screen.jpeg";
import type { Phase } from "./types";

function App() {
  const screen = useGameStore((state) => state.screen);
  const phase = useGameStore((state) => state.phase);
  const grainLoss = useGameStore((state) => state.grainLoss);
  const wave = useGameStore((state) => state.wave);
  const resetGame = useGameStore((state) => state.resetGame);
  const startMode = useGameStore((state) => state.startMode);
  const setScreen = useGameStore((state) => state.setScreen);
  const modeId = useGameStore((state) => state.modeId);
  const scoreboard = useGameStore((state) => state.scoreboard);
  const settings = useGameStore((state) => state.settings);
  const updateSettings = useGameStore((state) => state.updateSettings);
  const tutorialStart = useTutorialStore((state) => state.start);
  const tutorialExit = useTutorialStore((state) => state.exit);
  const tutorialActive = useTutorialStore((state) => state.active);
  const status = useGameStore((state) => state.status);

  const phaseLabels: Record<Phase, string> = {
    setup: "Setup turn",
    cat: "Cat turn",
    stepper: "Mouse turn",
  };

  const bestEntry = useMemo(() => {
    const entries = scoreboard.filter((entry) => entry.modeId === modeId);
    if (!entries.length) return undefined;
    return entries.reduce((best, entry) => {
      const bestScore = best.score ?? 0;
      const entryScore = entry.score ?? 0;
      if (entryScore !== bestScore)
        return entryScore > bestScore ? entry : best;
      const bestWave = best.finishWave ?? best.wave ?? 0;
      const entryWave = entry.finishWave ?? entry.wave ?? 0;
      if (entryWave !== bestWave) return entryWave > bestWave ? entry : best;
      return entry.grainLoss < best.grainLoss ? entry : best;
    }, entries[0]);
  }, [modeId, scoreboard]);

  const bestWave = bestEntry ? bestEntry.finishWave ?? bestEntry.wave ?? "—" : "—";
  const bestGrainLoss = bestEntry ? bestEntry.grainLoss : "—";
  const bestScore = bestEntry ? bestEntry.score ?? "—" : "—";
  const bestTooltip = bestEntry
    ? `Best score for this mode\nScore: ${bestScore}\nWave: ${bestWave}\nGrain Loss: ${bestGrainLoss}`
    : "No runs recorded for this mode yet.";

  const shellClass = useMemo(
    () => `app-shell phase-${phase} screen-${screen}`,
    [phase, screen]
  );
  const isStartScreen = screen === "start";

  const handleStartTutorialMode = () => {
    tutorialExit(); // reset tutorial store
    startMode("tutorial");
    tutorialStart();
  };

  const handleStartEasyMode = () => {
    tutorialExit();
    startMode("easy");
  };

  const handleStartHardMode = () => {
    tutorialExit();
    startMode("hard");
  };

  return (
    <div className={shellClass}>
      <AudioControls />
      {!isStartScreen && (
        <>
          <div className="wave-badge">
            Wave {wave} - {phaseLabels[phase]}
          </div>
          <div className="grain-badge">Grain Loss {grainLoss} / 32</div>
          <div className="best-badge" title={bestTooltip}>
            🏅:{bestScore}  🌊:{bestWave} 🌾:{bestGrainLoss}
          </div>
          <div className="session-actions">
            <button
              type="button"
              className={`session-button ${
                tutorialActive ? "button-disabled" : ""
              }`}
              onClick={() => {
                if (tutorialActive) return;
                resetGame();
              }}
              disabled={tutorialActive}
            >
              Restart
            </button>
            <button
              type="button"
              className="session-button quit"
              onClick={() => {
                if (tutorialActive) {
                  tutorialExit();
                }
                setScreen("start");
              }}
            >
              Quit
            </button>
          </div>
          {tutorialActive && (
            <button
              type="button"
              className="session-button exit"
              onClick={() => {
                tutorialExit();
                setScreen("start");
              }}
            >
              Exit Tutorial
            </button>
          )}
          <TutorialHighlights />
        </>
      )}
      <div className="play-area">
        <div className="play-column">
          {isStartScreen ? (
            <>
              <div className="board-backdrop" aria-hidden />
              <div className="start-cover" aria-hidden>
                <img src={coverStart} alt="Pangur Bán cover" />
              </div>
            </>
          ) : (
            <>
              <IncomingLane />
              <div className="board-backdrop" aria-hidden />
              <Board />
            </>
          )}
        </div>
        {tutorialActive && !isStartScreen && (
          <div className="tutorial-float">
            <TutorialPanel />
          </div>
        )}
        <div className="right-column">
          {isStartScreen ? (
            <div className="start-panel-stack">
              <div className="start-header">
                <p>Choose a mode to begin.</p>
              </div>
              <div className="start-actions">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={handleStartTutorialMode}
                >
                  Start Tutorial
                </button>
                <button
                  type="button"
                  className="button-primary"
                  onClick={handleStartHardMode}
                >
                  Start Game (Hard)
                </button>
                <button
                  type="button"
                  className="button-primary"
                  onClick={handleStartEasyMode}
                >
                  Start Game (Easy)
                </button>
              </div>
            </div>
          ) : (
            <>
              <div className="panel">
                {status.state === "playing" && <SidePanel />}
                <ControlPanel />
              </div>
              <PanelActions />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
