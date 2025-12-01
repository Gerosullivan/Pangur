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
  const scoreboard = useGameStore((state) => state.scoreboard);
  const clearScoreboard = useGameStore((state) => state.clearScoreboard);
  const settings = useGameStore((state) => state.settings);
  const updateSettings = useGameStore((state) => state.updateSettings);
  const tutorialStart = useTutorialStore((state) => state.start);
  const tutorialExit = useTutorialStore((state) => state.exit);
  const tutorialActive = useTutorialStore((state) => state.active);

  const phaseLabels: Record<Phase, string> = {
    setup: "Setup turn",
    cat: "Cat turn",
    stepper: "Mouse turn",
  };

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

  const handleCopyScores = async () => {
    if (!scoreboard.length) return;
    const text = scoreboard
      .map(
        (entry) =>
          `${new Date(entry.timestamp).toLocaleString()} · ${entry.modeId} · ${entry.result.toUpperCase()} · score ${
            entry.score ?? "-"
          } · finish wave ${entry.finishWave ?? entry.wave} · grain ${entry.grainLoss}${
            entry.grainSaved !== undefined ? ` (saved ${entry.grainSaved})` : ""
          } · cats lost ${entry.catsLost}${
            entry.catsFullHealth !== undefined ? ` (full health ${entry.catsFullHealth})` : ""
          }${entry.reason ? ` (${entry.reason})` : ""}`
      )
      .join("\n");
    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      console.warn("Copy failed", err);
    }
  };

  return (
    <div className={shellClass}>
      {!isStartScreen && (
        <>
          <div className="wave-badge">Wave {wave} - {phaseLabels[phase]}</div>
          <div className="grain-badge">Grain Loss {grainLoss} / 32</div>
          <div className="session-actions">
            <button
              type="button"
              className={`session-button ${tutorialActive ? 'button-disabled' : ''}`}
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
              <div className="settings-card">
                <h3>Settings</h3>
                <div className="settings-row">
                  <label className="settings-label">
                    <input
                      type="checkbox"
                      checked={settings.muted}
                      onChange={(event) =>
                        updateSettings({ muted: event.target.checked })
                      }
                    />
                    Mute Music
                  </label>
                  <label className="settings-label">
                    Music Volume
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.1}
                      value={settings.musicVolume}
                      onChange={(event) =>
                        updateSettings({
                          musicVolume: Number(event.target.value),
                        })
                      }
                    />
                  </label>
                </div>
              </div>
              <div className="scoreboard-card">
                <div className="scoreboard-header">
                  <h3>Scoreboard</h3>
                  <div className="scoreboard-actions">
                    <button
                      type="button"
                      className="button-quiet"
                      onClick={handleCopyScores}
                      disabled={scoreboard.length === 0}
                    >
                      Copy
                    </button>
                    <button
                      type="button"
                      className="button-quiet"
                      onClick={clearScoreboard}
                      disabled={scoreboard.length === 0}
                    >
                      Clear
                    </button>
                  </div>
                </div>
                {scoreboard.length === 0 ? (
                  <p className="scoreboard-empty">
                    Finish a game to see results here.
                  </p>
                ) : (
                  <ul className="scoreboard-list">
                    {scoreboard.map((entry) => (
                      <li
                        key={`${entry.timestamp}-${entry.modeId}-${entry.wave}-${entry.result}`}
                        className="scoreboard-row"
                      >
                    <div className="scoreboard-top">
                      <span
                        className={`score-pill ${
                          entry.result === "win" ? "win" : "loss"
                        }`}
                      >
                        {entry.result}
                      </span>
                      <span className="score-mode">{entry.modeId}</span>
                      <span className="score-score">
                        Score {entry.score !== undefined ? entry.score : "—"}
                      </span>
                      <span className="score-wave">
                        Finish Wave {entry.finishWave ?? entry.wave}
                      </span>
                    </div>
                    <div className="scoreboard-meta">
                      {entry.grainSaved !== undefined && (
                        <span>Grain saved {entry.grainSaved}</span>
                      )}
                      <span>Grain {entry.grainLoss}</span>
                      <span>Cats lost {entry.catsLost}</span>
                      {entry.catsFullHealth !== undefined && (
                        <span>Full health {entry.catsFullHealth}</span>
                      )}
                      {entry.reason && <span>{entry.reason}</span>}
                      <span>
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <>
              <div className="panel">
                <SidePanel />
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
