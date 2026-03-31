import { useState } from 'react';
import { HowToPlay } from './HowToPlay';
import { getStats } from '../engine/matchHistory';
import './MainMenu.css';

interface MainMenuProps {
  onStartGame: () => void;
  onStartRandomGame?: () => void;
  onSpectatorGame?: () => void;
  onOpenPacks?: () => void;
  collectionCount?: number;
}

export function MainMenu({ onStartGame, onStartRandomGame, onSpectatorGame, onOpenPacks, collectionCount = 0 }: MainMenuProps) {
  const [showHowTo, setShowHowTo] = useState(false);
  const stats = getStats();

  return (
    <div className="main-menu">
      <div className="menu-backdrop" />
      <div className="menu-content">
        <div className="game-title">
          <h1>Summoner's Grid</h1>
          <p className="subtitle">Tactical Grid-Based RPG Card Game</p>
        </div>

        <div className="menu-info">
          <div className="info-block">
            <h3>3v3 Tactical Combat</h3>
            <p>Field 3 summons on a 12x14 grid battlefield</p>
          </div>
          <div className="info-block">
            <h3>Deep Strategy</h3>
            <p>Role advancement, equipment, and stack-based effects</p>
          </div>
          <div className="info-block">
            <h3>First to 3 VP</h3>
            <p>Defeat summons and control territory to win</p>
          </div>
        </div>

        <div className="menu-buttons">
          <button className="play-button" onClick={onStartGame}>
            Play vs AI
          </button>
          {onStartRandomGame && (
            <button className="random-btn" onClick={onStartRandomGame}>
              Random Deck Game
            </button>
          )}
          {onSpectatorGame && (
            <button className="spectator-btn" onClick={onSpectatorGame}>
              Watch AI vs AI
            </button>
          )}
          {onOpenPacks && (
            <button className="packs-button" onClick={onOpenPacks}>
              Open Packs {collectionCount > 0 && `(${collectionCount} collected)`}
            </button>
          )}
          <button className="how-to-button" onClick={() => setShowHowTo(true)}>
            How to Play
          </button>
        </div>

        {stats.totalGames > 0 && (
          <div className="stats-bar">
            <span>{stats.totalGames} games</span>
            <span className="stat-win">{stats.wins}W</span>
            <span className="stat-loss">{stats.losses}L</span>
            <span>WR: {stats.winRate}</span>
            <span>Avg: {stats.avgTurns} turns</span>
          </div>
        )}

        <div className="settings-row">
          <label className="setting-toggle">
            <input
              type="checkbox"
              onChange={(e) => {
                document.body.classList.toggle('colorblind-mode', e.target.checked);
              }}
            />
            <span>Color Blind Mode</span>
          </label>
        </div>

        <div className="version-info">
          Alpha Build — Summoner's Grid
        </div>
      </div>

      {showHowTo && <HowToPlay onClose={() => setShowHowTo(false)} />}
    </div>
  );
}
