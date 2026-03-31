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
        <button className="start-btn" onClick={() => window.location.reload()}>
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
      </div>
      <div className="phase-buttons">
        {phase === 'draw' && (
          <button className="phase-btn draw-btn" onClick={executeDrawPhase}>
            Draw Phase
          </button>
        )}
        {phase === 'level' && (
          <button className="phase-btn level-btn" onClick={executeLevelPhase}>
            Level Phase
          </button>
        )}
        {phase === 'action' && (
          <button className="phase-btn end-btn" onClick={endActionPhase}>
            End Turn
          </button>
        )}
      </div>
      <div className="phase-hint">
        {phase === 'draw' && 'Click to draw a card'}
        {phase === 'level' && 'Click to level up your summons'}
        {phase === 'action' && 'Play cards, move summons, or attack. Click End Turn when done.'}
        {phase === 'end' && 'Ending turn...'}
      </div>
    </div>
  );
}
