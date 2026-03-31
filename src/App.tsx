import { useState } from 'react';
import { GameBoard } from './components/GameBoard';
import { GameInfo } from './components/GameInfo';
import { HandDisplay } from './components/HandDisplay';
import { PhaseControls } from './components/PhaseControls';
import { useGameStore } from './store/gameStore';
import { createPlayerADeck, createPlayerBDeck } from './data/cards';
import './App.css';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);

  const { initializeGame, decideTurnOrder } = useGameStore();

  const handleStartGame = () => {
    const playerADeck = createPlayerADeck();
    const playerBDeck = createPlayerBDeck();
    initializeGame(playerADeck, playerBDeck);
    decideTurnOrder('playerA'); // Player A goes first (as in Play Example)
    setGameStarted(true);
  };

  return (
    <div className="app">
      <div className="game-layout">
        <div className="board-column">
          <PhaseControls onStartGame={handleStartGame} gameStarted={gameStarted} />
          <GameBoard
            selectedCardIndex={selectedCardIndex}
            selectedUnitId={selectedUnitId}
            onSelectUnit={(id) => {
              setSelectedUnitId(id);
              if (id) setSelectedCardIndex(null);
            }}
            onClearCard={() => setSelectedCardIndex(null)}
          />
          <HandDisplay
            selectedCardIndex={selectedCardIndex}
            onSelectCard={(index) => {
              setSelectedCardIndex(index);
              if (index !== null) setSelectedUnitId(null);
            }}
          />
        </div>
        <GameInfo />
      </div>
    </div>
  );
}

export default App;
