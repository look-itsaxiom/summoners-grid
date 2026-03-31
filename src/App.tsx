import { useState, useEffect } from 'react';
import { GameBoard } from './components/GameBoard';
import { GameInfo } from './components/GameInfo';
import { HandDisplay } from './components/HandDisplay';
import { PhaseControls } from './components/PhaseControls';
import { CombatOverlay } from './components/CombatOverlay';
import { AdvanceDeck } from './components/AdvanceDeck';
import { MainMenu } from './components/MainMenu';
import { GameOver } from './components/GameOver';
import { useGameStore } from './store/gameStore';
import { createPlayerADeck, createPlayerBDeck } from './data/cards';
import { executeAITurn } from './engine/ai';
import './App.css';

type Screen = 'menu' | 'game';

function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [pendingAdvance, setPendingAdvance] = useState<number | null>(null);

  const { initializeGame, decideTurnOrder, activePlayer, gameOver, phase, playAdvanceCard } = useGameStore();

  const handleStartGame = () => {
    const playerADeck = createPlayerADeck();
    const playerBDeck = createPlayerBDeck();
    initializeGame(playerADeck, playerBDeck);
    decideTurnOrder('playerA');
    setScreen('game');
    setSelectedCardIndex(null);
    setSelectedUnitId(null);
    setPendingAdvance(null);
  };

  const handleMainMenu = () => {
    setScreen('menu');
  };

  useEffect(() => {
    if (activePlayer === 'playerB' && phase === 'draw' && screen === 'game' && !gameOver) {
      const timer = setTimeout(() => {
        executeAITurn(useGameStore.getState());
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [activePlayer, phase, screen, gameOver]);

  if (screen === 'menu') {
    return <MainMenu onStartGame={handleStartGame} />;
  }

  return (
    <div className="app">
      <CombatOverlay />
      {gameOver && (
        <GameOver onNewGame={handleStartGame} onMainMenu={handleMainMenu} />
      )}
      <div className="game-layout">
        <div className="board-column">
          <PhaseControls onStartGame={handleStartGame} gameStarted={true} />
          <GameBoard
            selectedCardIndex={selectedCardIndex}
            selectedUnitId={selectedUnitId}
            pendingAdvance={pendingAdvance}
            onSelectUnit={(id) => {
              if (pendingAdvance !== null && id) {
                playAdvanceCard(pendingAdvance, id);
                setPendingAdvance(null);
                return;
              }
              setSelectedUnitId(id);
              if (id) setSelectedCardIndex(null);
            }}
            onClearCard={() => setSelectedCardIndex(null)}
          />
          <HandDisplay
            selectedCardIndex={selectedCardIndex}
            onSelectCard={(index) => {
              setSelectedCardIndex(index);
              if (index !== null) {
                setSelectedUnitId(null);
                setPendingAdvance(null);
              }
            }}
          />
          <AdvanceDeck
            onSelectAdvanceTarget={(advIdx) => {
              if (pendingAdvance === advIdx) {
                setPendingAdvance(null);
              } else {
                setPendingAdvance(advIdx);
                setSelectedCardIndex(null);
                setSelectedUnitId(null);
              }
            }}
            pendingAdvance={pendingAdvance}
          />
        </div>
        <GameInfo />
      </div>
    </div>
  );
}

export default App;
