import type { SummonCard, Card } from '../types';
import { GROWTH_RATE_SYMBOLS } from '../types';
import { SpeciesArt } from './SpeciesArt';
import { RARITY_COLORS } from '../engine/cardGenerator';
import './DeckPreview.css';

interface DeckPreviewProps {
  summons: Array<{ summon: SummonCard; roleId: string }>;
  mainDeck: Card[];
  onConfirm: () => void;
  onBack: () => void;
}

function getCardTypeColor(type: string): string {
  switch (type) {
    case 'action': return '#fa4';
    case 'building': return '#4f4';
    case 'quest': return '#ff4';
    case 'counter': return '#f4f';
    case 'reaction': return '#f84';
    default: return '#aaa';
  }
}

export function DeckPreview({ summons, mainDeck, onConfirm, onBack }: DeckPreviewProps) {
  return (
    <div className="deck-preview">
      <div className="dp-header">
        <button className="dp-back" onClick={onBack}>Back</button>
        <h2>Your Deck</h2>
        <button className="dp-confirm" onClick={onConfirm}>Start Battle!</button>
      </div>

      <div className="dp-section">
        <h3>Summon Slots (3)</h3>
        <div className="dp-summons">
          {summons.map(({ summon, roleId }) => (
            <div key={summon.id} className="dp-summon-card">
              <SpeciesArt species={summon.species} size="medium" />
              <div className="dp-summon-info">
                <div className="dp-summon-name">{summon.name}</div>
                <div className="dp-summon-role">
                  <span className="dp-species">{summon.species}</span>
                  <span className="dp-role">{roleId}</span>
                  <span className="dp-rarity" style={{ color: RARITY_COLORS[summon.rarity] }}>
                    {summon.rarity}
                  </span>
                </div>
                <div className="dp-stat-row">
                  {(['STR', 'END', 'DEF', 'INT', 'SPI', 'MDF', 'SPD', 'ACC', 'LCK'] as const).map(stat => (
                    <span key={stat} className="dp-stat">
                      {stat.charAt(0)}:{summon.baseStats[stat]}
                      <sub>{GROWTH_RATE_SYMBOLS[summon.growthRates[stat]]}</sub>
                    </span>
                  ))}
                </div>
                <div className="dp-weapon">
                  {summon.equipment.weapon?.name ?? 'No weapon'}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="dp-section">
        <h3>Main Deck ({mainDeck.length} cards)</h3>
        <div className="dp-deck-list">
          {mainDeck.map((card, i) => (
            <div key={`${card.id}-${i}`} className="dp-deck-card">
              <span
                className="dp-card-type"
                style={{ background: getCardTypeColor(card.cardType) }}
              >
                {card.cardType.charAt(0).toUpperCase()}
              </span>
              <span className="dp-card-name">{card.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
