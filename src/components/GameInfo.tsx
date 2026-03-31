import { useGameStore } from '../store/gameStore';
import './GameInfo.css';

export function GameInfo() {
  const { turnNumber, phase, activePlayer, players, gameOver, winner, log } = useGameStore();

  return (
    <div className="game-info">
      <div className="info-header">
        <h2>Summoner's Grid</h2>
        {gameOver ? (
          <div className="winner-banner">{winner} wins!</div>
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
        <div className="player-panel playerA">
          <h3>Player A</h3>
          <div className="vp">VP: {players.playerA.victoryPoints} / 3</div>
          <div className="deck-info">
            <span>Hand: {players.playerA.hand.length}</span>
            <span>Deck: {players.playerA.mainDeck.length}</span>
            <span>Discard: {players.playerA.discardPile.length}</span>
            <span>Recharge: {players.playerA.rechargePile.length}</span>
          </div>
        </div>

        <div className="player-panel playerB">
          <h3>Player B</h3>
          <div className="vp">VP: {players.playerB.victoryPoints} / 3</div>
          <div className="deck-info">
            <span>Hand: {players.playerB.hand.length}</span>
            <span>Deck: {players.playerB.mainDeck.length}</span>
            <span>Discard: {players.playerB.discardPile.length}</span>
            <span>Recharge: {players.playerB.rechargePile.length}</span>
          </div>
        </div>
      </div>

      <div className="game-log">
        <h3>Game Log</h3>
        <div className="log-entries">
          {log
            .slice(-20)
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
