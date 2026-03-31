import { useGameStore } from '../store/gameStore';
import './AdvanceDeck.css';

interface AdvanceDeckProps {
  onSelectAdvanceTarget: (advanceIndex: number) => void;
  pendingAdvance: number | null;
}

export function AdvanceDeck({ onSelectAdvanceTarget, pendingAdvance }: AdvanceDeckProps) {
  const { activePlayer, players, phase, getPlayableAdvanceCards } = useGameStore();
  const advanceDeck = players[activePlayer].advanceDeck;

  if (phase !== 'action' || advanceDeck.length === 0) return null;

  const playable = getPlayableAdvanceCards();

  return (
    <div className="advance-deck">
      <div className="advance-label">
        Advance Deck ({advanceDeck.length})
        {playable.length > 0 && (
          <span className="advance-available"> — {playable.length} playable!</span>
        )}
      </div>
      <div className="advance-cards">
        {advanceDeck.map((card, i) => {
          const isPlayable = playable.some(p => p.index === i);
          const isSelected = pendingAdvance === i;
          return (
            <div
              key={`${card.id}-${i}`}
              className={`advance-card ${isPlayable ? 'playable' : 'locked'} ${isSelected ? 'selected' : ''}`}
              onClick={() => isPlayable ? onSelectAdvanceTarget(i) : undefined}
            >
              <div className="advance-type">{card.advanceType === 'role_change' ? 'ROLE' : 'NAMED'}</div>
              <div className="advance-name">{card.name}</div>
              <div className="advance-desc">{card.description}</div>
              {!isPlayable && (
                <div className="advance-reqs">
                  {card.requirements.map((r, j) => (
                    <span key={j} className="req-text">{r.description}</span>
                  ))}
                </div>
              )}
              {isPlayable && <div className="advance-ready">READY — Click to play</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
