import { useState, useEffect } from 'react';
import { GameBoard } from './components/GameBoard';
import { GameInfo } from './components/GameInfo';
import { HandDisplay } from './components/HandDisplay';
import { PhaseControls } from './components/PhaseControls';
import { CombatOverlay } from './components/CombatOverlay';
import { AdvanceDeck } from './components/AdvanceDeck';
import { MainMenu } from './components/MainMenu';
import { GameOver } from './components/GameOver';
import { PackOpening } from './components/PackOpening';
import { useGameStore } from './store/gameStore';
import { createPlayerADeck, createPlayerBDeck, createRandomDeck } from './data/cards';
import { saveGame, loadGame, deleteSave } from './engine/saveLoad';
import { executeAITurn } from './engine/ai';
import { DeckPreview } from './components/DeckPreview';
import { CoinFlip } from './components/CoinFlip';
import { EffectStack } from './components/EffectStack';
import { CardInspector } from './components/CardInspector';
import { DNAViewer } from './components/DNAViewer';
import { TurnBanner } from './components/TurnBanner';
import { FloatingNumbers } from './components/FloatingNumbers';
import { DevProgress } from './components/DevProgress';
import type { SummonCard, Card } from './types';
import './App.css';

type Screen = 'menu' | 'game' | 'packs' | 'deck-preview' | 'coin-flip';

function App() {
  const [screen, setScreen] = useState<Screen>('menu');
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [selectedUnitId, setSelectedUnitId] = useState<string | null>(null);
  const [pendingAdvance, setPendingAdvance] = useState<number | null>(null);
  const [collection, setCollection] = useState<SummonCard[]>([]);
  const [inspectedCard, setInspectedCard] = useState<Card | null>(null);
  const [spectatorMode, setSpectatorMode] = useState(false);
  const [gameSpeed, setGameSpeed] = useState(500); // ms delay between AI turns

  const { initializeGame, decideTurnOrder, activePlayer, gameOver, phase, turnNumber, playAdvanceCard } = useGameStore();

  const handleStartGame = (goFirst: boolean = true) => {
    const playerADeck = createPlayerADeck();
    const playerBDeck = createPlayerBDeck();
    initializeGame(playerADeck, playerBDeck);
    decideTurnOrder(goFirst ? 'playerA' : 'playerB');
    setScreen('game');
    setSpectatorMode(false);
    setSelectedCardIndex(null);
    setSelectedUnitId(null);
    setPendingAdvance(null);
  };

  const handleRandomGame = () => {
    const playerADeck = createRandomDeck();
    const playerBDeck = createRandomDeck();
    initializeGame(playerADeck, playerBDeck);
    decideTurnOrder(Math.random() < 0.5 ? 'playerA' : 'playerB');
    setScreen('game');
    setSpectatorMode(false);
    setSelectedCardIndex(null);
    setSelectedUnitId(null);
    setPendingAdvance(null);
  };

  const handleSpectatorGame = () => {
    const deckA = createRandomDeck();
    const deckB = createRandomDeck();
    initializeGame(deckA, deckB);
    decideTurnOrder('playerA');
    setScreen('game');
    setSpectatorMode(true);
    setSelectedCardIndex(null);
    setSelectedUnitId(null);
    setPendingAdvance(null);
  };

  const handleMainMenu = () => {
    setScreen('menu');
  };

  const handleContinueGame = () => {
    if (loadGame()) {
      setScreen('game');
      setSpectatorMode(false);
    }
  };

  // Auto-save when turns change
  useEffect(() => {
    if (screen === 'game' && !gameOver && !spectatorMode) {
      saveGame();
    }
    if (gameOver) {
      deleteSave();
    }
  }, [turnNumber, screen, gameOver, spectatorMode]);

  useEffect(() => {
    if (screen !== 'game' || gameOver) return;

    // AI plays for Player B always, and Player A in spectator mode
    const isAITurn = activePlayer === 'playerB' || spectatorMode;
    if (isAITurn && phase === 'draw') {
      const delay = spectatorMode ? gameSpeed : 800;
      const timer = setTimeout(() => {
        executeAITurn(useGameStore.getState());
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [activePlayer, phase, screen, gameOver, spectatorMode]);

  // Keyboard shortcuts
  useEffect(() => {
    if (screen !== 'game' || gameOver || activePlayer !== 'playerA') return;

    const handler = (e: KeyboardEvent) => {
      const { phase: currentPhase, endActionPhase, players } = useGameStore.getState();
      const hand = players.playerA.hand;

      // E = End Turn
      if (e.key === 'e' || e.key === 'E') {
        if (currentPhase === 'action') endActionPhase();
      }
      // Escape = deselect
      if (e.key === 'Escape') {
        setSelectedCardIndex(null);
        setSelectedUnitId(null);
        setPendingAdvance(null);
      }
      // 1-9 = select card from hand
      const num = parseInt(e.key);
      if (num >= 1 && num <= 9 && num <= hand.length && currentPhase === 'action') {
        setSelectedCardIndex(num - 1);
        setSelectedUnitId(null);
        setPendingAdvance(null);
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [screen, gameOver, activePlayer]);

  // DevProgress overlay — visible on all screens
  const devProgressOverlay = <DevProgress />;

  if (screen === 'menu') {
    return (
      <>
        <MainMenu
          onStartGame={() => setScreen('deck-preview')}
          onStartRandomGame={handleRandomGame}
          onSpectatorGame={handleSpectatorGame}
          onContinueGame={handleContinueGame}
          onOpenPacks={() => setScreen('packs')}
          collectionCount={collection.length}
        />
        {devProgressOverlay}
      </>
    );
  }

  if (screen === 'deck-preview') {
    const playerADeck = createPlayerADeck();
    return (
      <DeckPreview
        summons={playerADeck.summonSlots}
        mainDeck={playerADeck.mainDeck}
        onConfirm={() => setScreen('coin-flip')}
        onBack={() => setScreen('menu')}
      />
    );
  }

  if (screen === 'coin-flip') {
    return (
      <CoinFlip onChoose={(goFirst) => handleStartGame(goFirst)} />
    );
  }

  if (screen === 'packs') {
    return (
      <PackOpening
        onAddToCollection={(cards) => setCollection(prev => [...prev, ...cards])}
        onClose={() => setScreen('menu')}
      />
    );
  }

  return (
    <div className="app">
      <CombatOverlay />
      <EffectStack />
      <TurnBanner />
      <FloatingNumbers />
      {inspectedCard && (
        inspectedCard.cardType === 'summon' && 'dna' in inspectedCard && (inspectedCard as import('./types').SummonCard).dna
          ? <DNAViewer card={inspectedCard as import('./types').SummonCard} onClose={() => setInspectedCard(null)} />
          : <CardInspector card={inspectedCard} onClose={() => setInspectedCard(null)} />
      )}
      {gameOver && (
        <GameOver onNewGame={handleStartGame} onMainMenu={handleMainMenu} />
      )}
      <div className="game-layout">
        <div className="board-column">
          <PhaseControls onStartGame={handleStartGame} gameStarted={true} />
          {spectatorMode && !gameOver && (
            <div className="speed-control">
              <span className="speed-label">Speed:</span>
              <input
                type="range"
                min={100}
                max={1500}
                step={100}
                value={1600 - gameSpeed}
                onChange={(e) => setGameSpeed(1600 - parseInt(e.target.value))}
                className="speed-slider"
              />
              <span className="speed-value">{gameSpeed}ms</span>
            </div>
          )}
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
            onInspectCard={(card) => setInspectedCard(card)}
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
      {devProgressOverlay}
    </div>
  );
}

export default App;
