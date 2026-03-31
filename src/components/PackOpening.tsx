import { useState } from 'react';
import type { SummonCard } from '../types';
import { generatePack, RARITY_COLORS } from '../engine/cardGenerator';
import { GROWTH_RATE_SYMBOLS } from '../types';
import './PackOpening.css';

interface PackOpeningProps {
  onAddToCollection: (cards: SummonCard[]) => void;
  onClose: () => void;
}

export function PackOpening({ onAddToCollection, onClose }: PackOpeningProps) {
  const [pack, setPack] = useState<SummonCard[] | null>(null);
  const [revealed, setRevealed] = useState<Set<number>>(new Set());

  const openPack = () => {
    setPack(generatePack(5));
    setRevealed(new Set());
  };

  const revealCard = (index: number) => {
    setRevealed(prev => new Set([...prev, index]));
  };

  const revealAll = () => {
    if (pack) {
      setRevealed(new Set(pack.map((_, i) => i)));
    }
  };

  const collectAll = () => {
    if (pack) {
      onAddToCollection(pack);
      setPack(null);
      setRevealed(new Set());
    }
  };

  return (
    <div className="pack-opening">
      <div className="pack-header">
        <h2>Card Pack</h2>
        <button className="pack-close" onClick={onClose}>Back</button>
      </div>

      {!pack && (
        <div className="pack-unopened">
          <div className="pack-visual">
            <div className="pack-glow" />
            <div className="pack-icon">?</div>
          </div>
          <button className="open-pack-btn" onClick={openPack}>
            Open Pack (5 Cards)
          </button>
        </div>
      )}

      {pack && (
        <div className="pack-results">
          <div className="pack-cards">
            {pack.map((card, i) => (
              <div
                key={card.id}
                className={`pack-card ${revealed.has(i) ? 'revealed' : 'face-down'}`}
                onClick={() => revealCard(i)}
                style={{ '--rarity-color': RARITY_COLORS[card.rarity] } as React.CSSProperties}
              >
                {revealed.has(i) ? (
                  <div className="pack-card-content">
                    <div className="rarity-badge" style={{ color: RARITY_COLORS[card.rarity] }}>
                      {card.rarity.toUpperCase()}
                    </div>
                    <div className="card-species">{card.species}</div>
                    <div className="card-gen-name">{card.name}</div>
                    <div className="card-stat-grid">
                      <span>STR:{card.baseStats.STR}{GROWTH_RATE_SYMBOLS[card.growthRates.STR]}</span>
                      <span>END:{card.baseStats.END}{GROWTH_RATE_SYMBOLS[card.growthRates.END]}</span>
                      <span>DEF:{card.baseStats.DEF}{GROWTH_RATE_SYMBOLS[card.growthRates.DEF]}</span>
                      <span>INT:{card.baseStats.INT}{GROWTH_RATE_SYMBOLS[card.growthRates.INT]}</span>
                      <span>SPI:{card.baseStats.SPI}{GROWTH_RATE_SYMBOLS[card.growthRates.SPI]}</span>
                      <span>MDF:{card.baseStats.MDF}{GROWTH_RATE_SYMBOLS[card.growthRates.MDF]}</span>
                      <span>SPD:{card.baseStats.SPD}{GROWTH_RATE_SYMBOLS[card.growthRates.SPD]}</span>
                      <span>ACC:{card.baseStats.ACC}{GROWTH_RATE_SYMBOLS[card.growthRates.ACC]}</span>
                      <span>LCK:{card.baseStats.LCK}{GROWTH_RATE_SYMBOLS[card.growthRates.LCK]}</span>
                    </div>
                    <div className="card-weapon">{card.equipment.weapon?.name ?? 'No weapon'}</div>
                  </div>
                ) : (
                  <div className="face-down-content">
                    <span className="question-mark">?</span>
                    <span className="click-hint">Click to reveal</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="pack-actions">
            {revealed.size < pack.length && (
              <button className="reveal-all-btn" onClick={revealAll}>Reveal All</button>
            )}
            {revealed.size === pack.length && (
              <button className="collect-btn" onClick={collectAll}>Collect All</button>
            )}
            <button className="open-another-btn" onClick={openPack}>Open Another</button>
          </div>
        </div>
      )}
    </div>
  );
}
