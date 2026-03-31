import { useGameStore } from '../store/gameStore';
import './GameOver.css';

interface GameOverProps {
  onNewGame: () => void;
  onMainMenu: () => void;
}

export function GameOver({ onNewGame, onMainMenu }: GameOverProps) {
  const { winner, players, turnNumber, log } = useGameStore();

  if (!winner) return null;

  const winnerLabel = winner === 'playerA' ? 'Player A' : 'Player B';
  const isPlayerWin = winner === 'playerA';

  const playerAVP = players.playerA.victoryPoints;
  const playerBVP = players.playerB.victoryPoints;

  // Count defeats from log
  const defeats = log.filter(e => e.message.includes('defeated')).length;

  return (
    <div className="game-over-overlay">
      <div className="game-over-panel">
        <div className={`result-banner ${isPlayerWin ? 'victory' : 'defeat'}`}>
          {isPlayerWin ? 'VICTORY' : 'DEFEAT'}
        </div>

        <h2 className="winner-name">{winnerLabel} Wins!</h2>

        <div className="match-stats">
          <div className="stat-row">
            <span className="stat-label">Turns Played</span>
            <span className="stat-value">{turnNumber}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Player A VP</span>
            <span className="stat-value">{playerAVP}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Player B VP</span>
            <span className="stat-value">{playerBVP}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Summons Defeated</span>
            <span className="stat-value">{defeats}</span>
          </div>
        </div>

        <div className="game-over-actions">
          <button className="action-btn primary" onClick={onNewGame}>
            Play Again
          </button>
          <button className="action-btn secondary" onClick={onMainMenu}>
            Main Menu
          </button>
        </div>
      </div>
    </div>
  );
}
