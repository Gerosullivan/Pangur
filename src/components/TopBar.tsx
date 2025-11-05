import React from 'react';
import './TopBar.css';

interface TopBarProps {
  turn: number;
  grain: number;
  onPassTurn: () => void;
  canPassTurn: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({ turn, grain, onPassTurn, canPassTurn }) => {
  return (
    <div className="top-bar">
      <div className="top-bar-left">
        <h1 className="title">Pangur</h1>
        <span className="wave-counter">Wave {turn}</span>
      </div>
      <div className="grain-counter">
        <span className="grain-icon">🌾</span>
        <span className="grain-value">Grain {grain}</span>
      </div>
      <button
        className="pass-turn-button"
        onClick={onPassTurn}
        disabled={!canPassTurn}
      >
        Pass Turn to Mice
      </button>
    </div>
  );
};
