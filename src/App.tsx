import { useEffect, useMemo } from "react";
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
import { getMedalEmoji, getModeTargets } from "./lib/scoring";
import StartLoreScroll from "./components/StartLoreScroll";
import coverStart from "../assets/cover_start_screen.jpeg";
import mouseNormal from "../assets/mice/mouse_normal.png";
import mouseGrainFed from "../assets/mice/mouse_grain_fed.png";
import mouseScared from "../assets/mice/mouse_scared.png";
import mouseDizzy from "../assets/mice/mouse_dizzy.png";
import mouseDead from "../assets/mice/mouse_dead.png";
import pangurPortrait from "../assets/cat_detail/Pangur_detail.png";
import breoinnePortrait from "../assets/cat_detail/Breonne_detail.png";
import baircnePortrait from "../assets/cat_detail/Baircne_detail.png";
import type { ModeId, Phase, ScoreEntry } from "./types";

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

  useEffect(() => {
    // Preload key sprites to avoid Safari hiccups.
    [
      mouseNormal,
      mouseGrainFed,
      mouseScared,
      mouseDizzy,
      mouseDead,
      pangurPortrait,
      breoinnePortrait,
      baircnePortrait,
    ].forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, []);

  const phaseLabels: Record<Phase, string> = {
    setup: "Setup turn",
    cat: "Cat turn",
    stepper: "Mouse turn",
  };

  const pickBestEntry = (entries: ScoreEntry[]): ScoreEntry | undefined => {
    if (!entries.length) return undefined;
    return entries.reduce((best, entry) => {
      const bestScore = best.score ?? 0;
      const entryScore = entry.score ?? 0;
      if (entryScore !== bestScore) return entryScore > bestScore ? entry : best;
      const bestWave = best.finishWave ?? best.wave ?? 0;
      const entryWave = entry.finishWave ?? entry.wave ?? 0;
      if (entryWave !== bestWave) return entryWave > bestWave ? entry : best;
      return entry.grainLoss < best.grainLoss ? entry : best;
    }, entries[0]);
  };

  const bestEntry = useMemo(() => {
    const entries = scoreboard.filter((entry) => entry.modeId === modeId);
    return pickBestEntry(entries);
  }, [modeId, scoreboard]);

  const bestMedalsByMode = useMemo(() => {
    const result: Partial<Record<ModeId, '🥇' | '🥈' | '🥉'>> = {};
    const entriesByMode = new Map<ModeId, ScoreEntry[]>();
    scoreboard.forEach((entry) => {
      entriesByMode.set(entry.modeId, [...(entriesByMode.get(entry.modeId) ?? []), entry]);
    });
    (['tutorial', 'easy', 'hard', 'classic', 'monastery'] as ModeId[]).forEach((id) => {
      const best = pickBestEntry(entriesByMode.get(id) ?? []);
      if (best) {
        result[id] = getMedalEmoji({
          modeId: best.modeId,
          result: best.result,
          grainLoss: best.grainLoss,
          finishWave: best.finishWave,
          wave: best.wave,
        });
      }
    });
    return result;
  }, [scoreboard]);

  const bestWave = bestEntry ? bestEntry.finishWave ?? bestEntry.wave ?? "—" : "—";
  const bestGrainLoss = bestEntry ? bestEntry.grainLoss : "—";
  const bestScore = bestEntry ? bestEntry.score ?? "—" : "—";
  const bestMedal = bestEntry
    ? getMedalEmoji({
        modeId: bestEntry.modeId,
        result: bestEntry.result,
        grainLoss: bestEntry.grainLoss,
        finishWave: bestEntry.finishWave,
        wave: bestEntry.wave,
      })
    : "—";
  const bestTooltip = bestEntry
    ? `Best score for this mode\nScore: ${bestScore}\nWave: ${bestWave}\nGrain Loss: ${bestGrainLoss}`
    : "No runs recorded for this mode yet.";

  const modeTargets = getModeTargets(modeId);
  const grainTarget = modeTargets.grain;
  const waveTarget = modeTargets.wave;

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

  const handleStartMonasteryMode = () => {
    tutorialExit();
    startMode("monastery");
  };

  return (
    <div className={shellClass}>
      <AudioControls />
      {!isStartScreen && (
        <>
          <div className="wave-badge">
            Wave {wave}/{waveTarget} - {phaseLabels[phase]}
          </div>
          <div className="grain-badge">Grain Loss {grainLoss} / {grainTarget}</div>
          {bestEntry && (
            <div className="best-badge" title={bestTooltip}>
              {bestMedal} {bestScore}  🌊:{bestWave} 🌾:{bestGrainLoss}
            </div>
          )}
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
          <TutorialHighlights />
        </>
      )}
      <div className="play-area">
        <div className="play-column">
          {isStartScreen ? (
            <>
              <div className="board-backdrop" aria-hidden />
              <div className="start-cover">
                <img src={coverStart} alt="Pangur Bán cover" />
                <StartLoreScroll />
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
                <p>Choose a mode or board to begin.</p>
              </div>
              <div className="start-actions">
                <button
                  type="button"
                  className="button-secondary"
                  onClick={handleStartTutorialMode}
                >
                  {bestMedalsByMode.tutorial && (
                    <span className="start-medal">{bestMedalsByMode.tutorial}</span>
                  )}
                  Start Tutorial
                </button>
                <button
                  type="button"
                  className="button-primary"
                  onClick={handleStartEasyMode}
                >
                  {bestMedalsByMode.easy && (
                    <span className="start-medal">{bestMedalsByMode.easy}</span>
                  )}
                  Play Barn (easy)
                </button>
                <button
                  type="button"
                  className="button-primary"
                  onClick={handleStartMonasteryMode}
                >
                  {bestMedalsByMode.monastery && (
                    <span className="start-medal">{bestMedalsByMode.monastery}</span>
                  )}
                  Play Monastery (medium)
                </button>
                <button
                  type="button"
                  className="button-primary"
                  onClick={handleStartHardMode}
                >
                  {bestMedalsByMode.hard && (
                    <span className="start-medal">{bestMedalsByMode.hard}</span>
                  )}
                  Play Barn (hard)
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
