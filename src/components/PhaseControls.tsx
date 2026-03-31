import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import './PhaseControls.css';

interface PhaseControlsProps {
  onStartGame: () => void;
  gameStarted: boolean;
}

export function PhaseControls({ onStartGame, gameStarted }: PhaseControlsProps) {
  const {
    phase,
    activePlayer,
    turnNumber,
    gameOver,
    winner,
    executeDrawPhase,
    executeLevelPhase,
    endActionPhase,
  } = useGameStore();

  // Auto-advance draw and level phases for human player (they have no choices)
  useEffect(() => {
    if (!gameStarted || gameOver || activePlayer !== 'playerA') return;

    if (phase === 'draw') {
      const timer = setTimeout(executeDrawPhase, 400);
      return () => clearTimeout(timer);
    }
    if (phase === 'level') {
      const timer = setTimeout(executeLevelPhase, 400);
      return () => clearTimeout(timer);
    }
  }, [phase, activePlayer, gameStarted, gameOver, executeDrawPhase, executeLevelPhase]);

  if (!gameStarted) {
    return (
      <div className="phase-controls">
        <button className="start-btn" onClick={onStartGame}>
          Start Game
        </button>
      </div>
    );
  }

  if (gameOver) {
    return (
      <div className="phase-controls">
        <div className="game-over-msg">
          {winner === 'playerA' ? 'Player A' : 'Player B'} Wins!
        </div>
        <button className="start-btn" onClick={onStartGame}>
          New Game
        </button>
      </div>
    );
  }

  const playerLabel = activePlayer === 'playerA' ? 'Player A' : 'Player B';

  return (
    <div className="phase-controls">
      <div className="phase-status">
        <span className="turn-label">Turn {turnNumber}</span>
        <span className={`player-label player-${activePlayer}`}>{playerLabel}</span>
        <span className="phase-indicator">
          {phase === 'draw' && 'Drawing...'}
          {phase === 'level' && 'Leveling...'}
          {phase === 'action' && 'ACTION PHASE'}
        </span>
      </div>
      <div className="phase-buttons">
        {phase === 'action' && (
          <button className="phase-btn end-btn" onClick={endActionPhase}>
            End Turn
          </button>
        )}
      </div>
      {phase === 'action' && (
        <div className="phase-hint">
          Play cards, move, attack — then End Turn
          <span className="keyboard-hint"> | Keys: [1-9] select card, [E] end turn, [Esc] deselect</span>
        </div>
      )}
    </div>
  );
}
