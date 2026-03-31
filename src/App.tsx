import { useState, useEffect } from 'react';
import { GameBoard } from './components/GameBoard';
import { GameInfo } from './components/GameInfo';
import { HandDisplay } from './components/HandDisplay';
import { PhaseControls } from './components/PhaseControls';
import { CombatOverlay } from './components/CombatOverlay';
import { AdvanceDeck } from './components/AdvanceDeck';
import { useGameStore } from './store/gameStore';
import { createPlayerADeck, createPlayerBDeck } from './data/cards';
import { executeAITurn } from './engine/ai';
import './App.css';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [pendingAdvance, setPendingAdvance] = useState<number | null>(null);

  const { initializeGame, decideTurnOrder, activePlayer, gameOver, phase, playAdvanceCard, getPlayableAdvanceCards } = useGameStore();

  const handleStartGame = () => {
    const playerADeck = createPlayerADeck();
    const playerBDeck = createPlayerBDeck();
    initializeGame(playerADeck, playerBDeck);
    decideTurnOrder('playerA');
    setGameStarted(true);
  };

  useEffect(() => {
    if (activePlayer === 'playerB' && phase === 'draw' && gameStarted && !gameOver) {
      const timer = setTimeout(() => {
        executeAITurn(useGameStore.getState());
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [activePlayer, phase, gameStarted, gameOver]);

  // Handle advance card targeting — when pendingAdvance is set and user clicks a unit
  const handleAdvanceTarget = (advanceIndex: number) => {
    if (pendingAdvance === advanceIndex) {
      setPendingAdvance(null); // Deselect
    } else {
      setPendingAdvance(advanceIndex);
      setSelectedCardIndex(null);
      setSelectedUnitId(null);
    }
  };

  return (
    <div className="app">
      <CombatOverlay />
      <div className="game-layout">
        <div className="board-column">
          <PhaseControls onStartGame={handleStartGame} gameStarted={gameStarted} />
          <GameBoard
            selectedCardIndex={selectedCardIndex}
            selectedUnitId={selectedUnitId}
            pendingAdvance={pendingAdvance}
            onSelectUnit={(id) => {
              // If pending advance, play it on this unit
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
            onSelectAdvanceTarget={handleAdvanceTarget}
            pendingAdvance={pendingAdvance}
          />
        </div>
        <GameInfo />
      </div>
    </div>
  );
}

export default App;
