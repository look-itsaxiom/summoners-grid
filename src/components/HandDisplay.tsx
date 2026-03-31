import type { Card } from '../types';
import { useGameStore } from '../store/gameStore';
import './HandDisplay.css';

interface HandDisplayProps {
  selectedCardIndex: number | null;
  onSelectCard: (index: number | null) => void;
}

function getCardTypeColor(cardType: string): string {
  switch (cardType) {
    case 'summon': return '#4af';
    case 'action': return '#fa4';
    case 'building': return '#4f4';
    case 'quest': return '#ff4';
    case 'counter': return '#f4f';
    case 'reaction': return '#f84';
    case 'advance': return '#8af';
    default: return '#aaa';
  }
}

function CardInHand({
  card,
  isSelected,
  onClick,
}: {
  card: Card;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const borderColor = getCardTypeColor(card.cardType);

  return (
    <div
      className={`hand-card ${isSelected ? 'selected' : ''}`}
      style={{ borderColor }}
      onClick={onClick}
    >
      <div className="card-type-badge" style={{ background: borderColor }}>
        {card.cardType.toUpperCase()}
      </div>
      <div className="card-name">{card.name}</div>
      <div className="card-element">{card.element}</div>
      <div className="card-description">{card.description}</div>
      {card.cardType === 'summon' && (
        <div className="card-stats-preview">
          {'baseStats' in card && (
            <span className="stat-line">
              STR:{card.baseStats.STR} END:{card.baseStats.END} SPD:{card.baseStats.SPD}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export function HandDisplay({ selectedCardIndex, onSelectCard }: HandDisplayProps) {
  const { activePlayer, players, phase } = useGameStore();
  const hand = players[activePlayer].hand;

  if (phase !== 'action') {
    return (
      <div className="hand-display">
        <div className="hand-label">
          {activePlayer === 'playerA' ? 'Player A' : 'Player B'}'s Hand ({hand.length} cards)
        </div>
        <div className="hand-hint">Waiting for Action Phase...</div>
      </div>
    );
  }

  return (
    <div className="hand-display">
      <div className="hand-label">
        {activePlayer === 'playerA' ? 'Player A' : 'Player B'}'s Hand ({hand.length} cards)
        {selectedCardIndex !== null && <span className="selected-hint"> — Click board to place</span>}
      </div>
      <div className="hand-cards">
        {hand.map((card, i) => (
          <CardInHand
            key={`${card.id}-${i}`}
            card={card}
            index={i}
            isSelected={selectedCardIndex === i}
            onClick={() => onSelectCard(selectedCardIndex === i ? null : i)}
          />
        ))}
        {hand.length === 0 && <div className="hand-empty">No cards in hand</div>}
      </div>
    </div>
  );
}
