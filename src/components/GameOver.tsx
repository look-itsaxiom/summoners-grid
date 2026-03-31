import { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { SFX } from '../engine/sound';
import { saveMatchResult } from '../engine/matchHistory';
import './GameOver.css';

interface GameOverProps {
  onNewGame: () => void;
  onMainMenu: () => void;
}

export function GameOver({ onNewGame, onMainMenu }: GameOverProps) {
  const { winner, players, turnNumber, log, board } = useGameStore();

  const savedRef = useRef(false);

  useEffect(() => {
    if (winner === 'playerA') SFX.victory();
    else if (winner === 'playerB') SFX.gameDefeat();

    // Save match result once
    if (winner && !savedRef.current) {
      savedRef.current = true;
      saveMatchResult({
        winner,
        playerAVP: players.playerA.victoryPoints,
        playerBVP: players.playerB.victoryPoints,
        turns: turnNumber,
        defeats: log.filter(e => e.message.includes('defeated')).length,
      });
    }
  }, [winner]);

  if (!winner) return null;

  const winnerLabel = winner === 'playerA' ? 'Player A' : 'Player B';
  const isPlayerWin = winner === 'playerA';

  const playerAVP = players.playerA.victoryPoints;
  const playerBVP = players.playerB.victoryPoints;

  // Count stats from log
  const defeats = log.filter(e => e.message.includes('defeated')).length;
  const cardsPlayed = log.filter(e => e.message.startsWith('Played ')).length;
  const attacks = log.filter(e => e.message.includes('attacks')).length;
  const crits = log.filter(e => e.message.includes('CRITICAL')).length;
  const survivingSummons = board.summons.length;

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
          <div className="stat-row highlight">
            <span className="stat-label">Player A VP</span>
            <span className="stat-value vp-gold">{playerAVP}</span>
          </div>
          <div className="stat-row highlight">
            <span className="stat-label">Player B VP</span>
            <span className="stat-value vp-gold">{playerBVP}</span>
          </div>
          <div className="stat-divider" />
          <div className="stat-row">
            <span className="stat-label">Summons Defeated</span>
            <span className="stat-value">{defeats}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Cards Played</span>
            <span className="stat-value">{cardsPlayed}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Attacks Made</span>
            <span className="stat-value">{attacks}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Critical Hits</span>
            <span className="stat-value">{crits}</span>
          </div>
          <div className="stat-row">
            <span className="stat-label">Surviving Summons</span>
            <span className="stat-value">{survivingSummons}</span>
          </div>
        </div>

        <div className="key-moments">
          <div className="moments-label">Key Moments</div>
          {log
            .filter(e =>
              e.message.includes('defeated') ||
              e.message.includes('VP') ||
              e.message.includes('advances to') ||
              e.message.includes('transforms into') ||
              e.message.includes('Territory control') ||
              e.message.includes('activates face-down')
            )
            .slice(-5)
            .map((e, i) => (
              <div key={i} className="moment-entry">{e.message}</div>
            ))
          }
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
