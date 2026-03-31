import type { Card, SummonCard, ActionCard } from '../types';
import { GROWTH_RATE_SYMBOLS } from '../types';
import { useGameStore } from '../store/gameStore';
import { SpeciesArt } from './SpeciesArt';
import { RARITY_COLORS } from '../engine/cardGenerator';
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

function getTargetHint(card: Card): string {
  if (card.cardType === 'summon') return 'Click territory to place';
  if (card.cardType === 'building') return 'Click board to place';
  if (card.cardType === 'action') {
    const ac = card as ActionCard;
    if (ac.targetType === 'enemy_summon') return 'Click enemy summon';
    if (ac.targetType === 'ally_summon' || ac.targetType === 'self_summon') return 'Click ally summon';
    return 'Click target';
  }
  if (card.cardType === 'quest') return 'Click ally summon';
  return 'Click to play';
}

function CardInHand({
  card,
  index,
  isSelected,
  onClick,
}: {
  card: Card;
  index: number;
  isSelected: boolean;
  onClick: () => void;
}) {
  const borderColor = getCardTypeColor(card.cardType);
  const isSummon = card.cardType === 'summon';
  const summon = isSummon ? card as SummonCard : null;

  return (
    <div
      className={`hand-card ${isSelected ? 'selected' : ''}`}
      style={{ borderColor }}
      onClick={onClick}
    >
      <div className="card-header-row">
        <div className="card-type-badge" style={{ background: borderColor }}>
          {card.cardType.toUpperCase()}
        </div>
        <span className="card-key-hint">{index + 1}</span>
        {summon && (
          <span className="card-rarity" style={{ color: RARITY_COLORS[summon.rarity] }}>
            {summon.rarity.charAt(0).toUpperCase()}
          </span>
        )}
      </div>

      {summon && (
        <div className="card-art-row">
          <SpeciesArt species={summon.species} size="small" />
          <div className="card-name-col">
            <div className="card-name">{card.name}</div>
            <div className="card-species-label">{summon.species}</div>
          </div>
        </div>
      )}
      {!summon && <div className="card-name">{card.name}</div>}

      <div className="card-element">{card.element}</div>
      <div className="card-description">{card.description}</div>

      {summon && (
        <div className="card-stats-preview">
          <div className="stat-grid-mini">
            <span>S:{summon.baseStats.STR}<sub>{GROWTH_RATE_SYMBOLS[summon.growthRates.STR]}</sub></span>
            <span>E:{summon.baseStats.END}<sub>{GROWTH_RATE_SYMBOLS[summon.growthRates.END]}</sub></span>
            <span>D:{summon.baseStats.DEF}<sub>{GROWTH_RATE_SYMBOLS[summon.growthRates.DEF]}</sub></span>
          </div>
        </div>
      )}

      {isSelected && (
        <div className="card-target-hint">{getTargetHint(card)}</div>
      )}
    </div>
  );
}

export function HandDisplay({ selectedCardIndex, onSelectCard }: HandDisplayProps) {
  const { activePlayer, players, phase, setFaceDown } = useGameStore();
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
        {selectedCardIndex !== null && (
          <span className="selected-hint"> — {getTargetHint(hand[selectedCardIndex])}</span>
        )}
        {selectedCardIndex !== null && (hand[selectedCardIndex]?.cardType === 'counter' || hand[selectedCardIndex]?.cardType === 'reaction') && (
          <button
            className="set-face-down-btn"
            onClick={() => { setFaceDown(selectedCardIndex); onSelectCard(null); }}
          >
            Set Face-Down
          </button>
        )}
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
