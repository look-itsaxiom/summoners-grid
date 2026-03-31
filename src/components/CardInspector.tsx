import type { Card, SummonCard, ActionCard } from '../types';
import { GROWTH_RATE_SYMBOLS } from '../types';
import { SpeciesArt } from './SpeciesArt';
import { RARITY_COLORS } from '../engine/cardGenerator';
import { ELEMENT_COLORS } from '../engine/elements';
import './CardInspector.css';

interface CardInspectorProps {
  card: Card;
  onClose: () => void;
}

function getCardTypeColor(type: string): string {
  switch (type) {
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

export function CardInspector({ card, onClose }: CardInspectorProps) {
  const isSummon = card.cardType === 'summon';
  const summon = isSummon ? (card as SummonCard) : null;
  const isAction = card.cardType === 'action';
  const action = isAction ? (card as ActionCard) : null;

  return (
    <div className="inspector-overlay" onClick={onClose}>
      <div className="inspector-card" onClick={e => e.stopPropagation()}>
        <button className="inspector-close" onClick={onClose}>X</button>

        <div className="inspector-header">
          <span className="inspector-type" style={{ background: getCardTypeColor(card.cardType) }}>
            {card.cardType.toUpperCase()}
          </span>
          <span className="inspector-element" style={{ color: ELEMENT_COLORS[card.element] }}>
            {card.element}
          </span>
        </div>

        {summon && <SpeciesArt species={summon.species} size="large" />}

        <h3 className="inspector-name">{card.name}</h3>
        <p className="inspector-desc">{card.description}</p>

        {summon && (
          <>
            <div className="inspector-rarity" style={{ color: RARITY_COLORS[summon.rarity] }}>
              {summon.rarity.toUpperCase()} — {summon.species}
            </div>
            <div className="inspector-stats-grid">
              {(['STR', 'END', 'DEF', 'INT', 'SPI', 'MDF', 'SPD', 'ACC', 'LCK'] as const).map(stat => (
                <div key={stat} className="inspector-stat">
                  <span className="stat-label">{stat}</span>
                  <span className="stat-value">{summon.baseStats[stat]}</span>
                  <span className="stat-growth">{GROWTH_RATE_SYMBOLS[summon.growthRates[stat]]}</span>
                </div>
              ))}
            </div>
            <div className="inspector-equip">
              <div>Weapon: {summon.equipment.weapon?.name ?? 'None'}</div>
              <div>Armor: {summon.equipment.armor?.name ?? 'None'}</div>
              <div>Accessory: {summon.equipment.accessory?.name ?? 'None'}</div>
            </div>
          </>
        )}

        {action && (
          <div className="inspector-effects">
            <div className="inspector-speed">Speed: {action.speed}</div>
            <div className="inspector-target">Target: {action.targetType.replace(/_/g, ' ')}</div>
            {action.effects.map(e => (
              <div key={e.id} className="inspector-effect">
                {e.description}
                {e.basePower && <span className="effect-power"> (Power: {e.basePower})</span>}
              </div>
            ))}
          </div>
        )}

        {card.requirements.length > 0 && (
          <div className="inspector-reqs">
            <strong>Requirements:</strong>
            {card.requirements.map((r, i) => (
              <div key={i} className="req-item">{r.description}</div>
            ))}
          </div>
        )}

        <div className="inspector-pile">
          Goes to: {card.pileDestination === 'discard' ? 'Discard' : card.pileDestination === 'recharge' ? 'Recharge' : 'Removed'}
        </div>
      </div>
    </div>
  );
}
