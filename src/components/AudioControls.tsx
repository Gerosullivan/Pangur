import { useState } from "react";
import { useMusicPlayer } from "../hooks/useMusicPlayer";

function AudioControls() {
  const {
    autoplayBlocked,
    currentTrack,
    isMuted,
    isPlaying,
    setVolume,
    skipTrack,
    toggleMute,
    togglePlay,
    totalTracks,
    trackIndex,
    volume,
    flashPlayHint,
  } = useMusicPlayer();
  const [showVolume, setShowVolume] = useState(false);

  const tooltip = `${currentTrack.label} — Track ${trackIndex + 1} / ${totalTracks}`;

  return (
    <aside
      className="audio-controls"
      aria-label="Music controls"
      title={tooltip}
    >
      <div className="audio-buttons">
        <button
          type="button"
          className={`audio-button ${flashPlayHint ? "flash-hint" : ""}`}
          onClick={togglePlay}
          aria-label={isPlaying ? "Pause track" : "Play track"}
        >
          {isPlaying ? "⏸️" : "▶️"}
        </button>
        <button
          type="button"
          className="audio-button"
          onClick={skipTrack}
          aria-label="Skip to next track"
        >
          ⏭️
        </button>
        <button
          type="button"
          className="audio-button"
          onClick={toggleMute}
          aria-label={isMuted ? "Unmute music" : "Mute music"}
        >
          {isMuted ? "🔇" : "🔊"}
        </button>
        <button
          type="button"
          className={`audio-button ${showVolume ? "active" : ""}`}
          onClick={() => setShowVolume((open) => !open)}
          aria-label="Adjust volume"
          aria-pressed={showVolume}
        >
          🎚️
        </button>
      </div>
      {showVolume && (
        <div className="audio-volume">
          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={volume}
            onChange={(event) => setVolume(Number(event.target.value))}
            aria-label="Music volume"
            className="audio-volume-slider"
          />
          <div className="audio-volume-readout">{Math.round(volume * 100)}%</div>
        </div>
      )}
    </aside>
  );
}

export default AudioControls;
