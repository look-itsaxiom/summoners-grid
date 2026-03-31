import { useGameStore } from '../store/gameStore';
import { Minimap } from './Minimap';
import './GameInfo.css';

export function GameInfo() {
  const { turnNumber, phase, activePlayer, players, gameOver, winner, log, board } = useGameStore();

  const playerASummons = board.summons.filter(s => s.owner === 'playerA');
  const playerBSummons = board.summons.filter(s => s.owner === 'playerB');

  return (
    <div className="game-info">
      <div className="info-header">
        <h2>Summoner's Grid</h2>
        {gameOver ? (
          <div className="winner-banner">{winner === 'playerA' ? 'Player A' : 'Player B'} wins!</div>
        ) : (
          <div className="turn-info">
            <span className="turn-number">Turn {turnNumber}</span>
            <span className={`active-player player-${activePlayer}`}>
              {activePlayer === 'playerA' ? 'Player A' : 'Player B'}
            </span>
            <span className="phase-badge">{phase.toUpperCase()}</span>
          </div>
        )}
      </div>

      <div className="player-panels">
        <div className={`player-panel playerA ${activePlayer === 'playerA' ? 'active-turn' : ''}`}>
          <h3>Player A {activePlayer === 'playerA' && !gameOver ? '(You)' : '(AI)'}</h3>
          <div className="vp">VP: {players.playerA.victoryPoints} / 3</div>
          <div className="vp-bar">
            <div className="vp-fill" style={{ width: `${(players.playerA.victoryPoints / 3) * 100}%` }} />
          </div>
          <div className="summon-count">Summons: {playerASummons.length}/3</div>
          <div className="deck-info">
            <span>Hand: {players.playerA.hand.length}</span>
            <span>Deck: {players.playerA.mainDeck.length}</span>
            <span>Advance: {players.playerA.advanceDeck.length}</span>
            {players.playerA.faceDownCards.length > 0 && (
              <span className="face-down-count">Set: {players.playerA.faceDownCards.length}</span>
            )}
          </div>
        </div>

        <div className={`player-panel playerB ${activePlayer === 'playerB' ? 'active-turn' : ''}`}>
          <h3>Player B (AI)</h3>
          <div className="vp">VP: {players.playerB.victoryPoints} / 3</div>
          <div className="vp-bar">
            <div className="vp-fill" style={{ width: `${(players.playerB.victoryPoints / 3) * 100}%` }} />
          </div>
          <div className="summon-count">Summons: {playerBSummons.length}/3</div>
          <div className="deck-info">
            <span>Hand: {players.playerB.hand.length}</span>
            <span>Deck: {players.playerB.mainDeck.length}</span>
            <span>Advance: {players.playerB.advanceDeck.length}</span>
            {players.playerB.faceDownCards.length > 0 && (
              <span className="face-down-count">Set: {players.playerB.faceDownCards.length}</span>
            )}
          </div>
        </div>
      </div>

      <Minimap />

      {log.length > 0 && (() => {
        const damages = log
          .map(e => e.message.match(/Deals (\d+) damage/))
          .filter(Boolean)
          .map(m => parseInt(m![1]));
        const totalDmg = damages.reduce((s, d) => s + d, 0);
        const maxHit = damages.length > 0 ? Math.max(...damages) : 0;
        return (
          <div className="live-stats">
            <span>Total dmg: {totalDmg}</span>
            <span>Max hit: {maxHit}</span>
            <span>Crits: {log.filter(e => e.message.includes('CRITICAL')).length}</span>
          </div>
        );
      })()}

      <div className="game-log">
        <h3>Game Log</h3>
        <div className="log-entries">
          {log
            .slice(-30)
            .reverse()
            .map((entry, i) => (
              <div key={i} className={`log-entry player-${entry.player}`}>
                <span className="log-turn">T{entry.turn}</span>
                <span className="log-message">{entry.message}</span>
              </div>
            ))}
        </div>
      </div>
    </div>
  );
}
