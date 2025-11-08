import { useState } from 'react';
import { GameState } from './types';
import { createInitialGameState, calculateTotalMeow } from './gameState';
import TopBar from './components/TopBar';
import IncomingMiceRow from './components/IncomingMiceRow';
import BoardRegion from './components/BoardRegion';
import ActionArea from './components/ActionArea';
import GameOverScreen from './components/GameOverScreen';
import './App.css';

function App() {
  const [gameState, setGameState] = useState<GameState>(createInitialGameState());

  // Calculate total meow for deterrence preview
  const totalMeow = calculateTotalMeow(gameState.cats);

  const handleRestart = () => {
    setGameState(createInitialGameState());
  };

  return (
    <div className="app-container">
      <TopBar grain={gameState.grain} wave={gameState.wave} />
      <IncomingMiceRow
        queueCount={gameState.incomingQueue}
        totalMeow={totalMeow}
      />
      <BoardRegion
        gameState={gameState}
        setGameState={setGameState}
      />
      <ActionArea
        gameState={gameState}
        setGameState={setGameState}
      />

      {gameState.gameOver && (
        <GameOverScreen
          victory={gameState.victory}
          wave={gameState.wave}
          onRestart={handleRestart}
        />
      )}
    </div>
  );
}

export default App;
