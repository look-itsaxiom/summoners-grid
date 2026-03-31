import { useState } from 'react';
import type { SummonCard } from '../types';
import { GROWTH_RATE_SYMBOLS, STAT_KEYS } from '../types';
import { validateDNA } from '../engine/dna';
import { dnaToArtPrompt } from '../engine/dna/promptBuilder';
import { dnaToNFTMetadata } from '../engine/dna/metadata';
import { SpeciesArt } from './SpeciesArt';
import { RARITY_COLORS } from '../engine/cardGenerator';
import './DNAViewer.css';

interface DNAViewerProps {
  card: SummonCard;
  onClose: () => void;
}

export function DNAViewer({ card, onClose }: DNAViewerProps) {
  const [tab, setTab] = useState<'card' | 'dna' | 'metadata' | 'prompt'>('card');

  const hasDNA = card.dna && validateDNA(card.dna);
  const metadata = hasDNA ? dnaToNFTMetadata(card.dna!) : null;
  const artPrompt = hasDNA ? dnaToArtPrompt(card.dna!) : null;

  return (
    <div className="dna-viewer-overlay" onClick={onClose}>
      <div className="dna-viewer" onClick={e => e.stopPropagation()}>
        <button className="dv-close" onClick={onClose}>X</button>

        <div className="dv-header">
          <SpeciesArt species={card.species} size="medium" />
          <div>
            <h3 className="dv-name">{card.name}</h3>
            <div className="dv-subtitle">
              <span style={{ color: RARITY_COLORS[card.rarity] }}>{card.rarity}</span>
              {' '}{card.species}
            </div>
          </div>
        </div>

        <div className="dv-tabs">
          <button className={tab === 'card' ? 'active' : ''} onClick={() => setTab('card')}>Card</button>
          {hasDNA && <button className={tab === 'dna' ? 'active' : ''} onClick={() => setTab('dna')}>DNA</button>}
          {hasDNA && <button className={tab === 'metadata' ? 'active' : ''} onClick={() => setTab('metadata')}>NFT</button>}
          {hasDNA && <button className={tab === 'prompt' ? 'active' : ''} onClick={() => setTab('prompt')}>Art</button>}
        </div>

        {tab === 'card' && (
          <div className="dv-content">
            <div className="dv-stats">
              {STAT_KEYS.map(key => (
                <div key={key} className="dv-stat">
                  <span className="dv-stat-label">{key}</span>
                  <span className="dv-stat-value">{card.baseStats[key]}</span>
                  <span className="dv-stat-growth">{GROWTH_RATE_SYMBOLS[card.growthRates[key]]}</span>
                </div>
              ))}
            </div>
            <div className="dv-equip">
              <div>Weapon: {card.equipment.weapon?.name ?? 'None'}</div>
              <div>Armor: {card.equipment.armor?.name ?? 'None'}</div>
              <div>Accessory: {card.equipment.accessory?.name ?? 'None'}</div>
            </div>
          </div>
        )}

        {tab === 'dna' && hasDNA && (
          <div className="dv-content">
            <div className="dv-dna-display">
              <div className="dv-dna-label">Card DNA</div>
              <code className="dv-dna-code">{card.dna}</code>
              <button
                className="dv-copy"
                onClick={() => navigator.clipboard?.writeText(card.dna!)}
              >
                Copy
              </button>
            </div>
            <div className="dv-dna-info">
              This 32-character hex string is the card's unique identity.
              It deterministically encodes species, rarity, all stats,
              growth rates, equipment, and visual traits. The same DNA
              always produces the exact same card.
            </div>
          </div>
        )}

        {tab === 'metadata' && metadata && (
          <div className="dv-content">
            <div className="dv-dna-label">NFT Metadata (ERC-721)</div>
            <pre className="dv-json">{JSON.stringify(metadata, null, 2)}</pre>
          </div>
        )}

        {tab === 'prompt' && artPrompt && (
          <div className="dv-content">
            <div className="dv-dna-label">AI Art Prompt</div>
            <div className="dv-prompt">{artPrompt}</div>
            <div className="dv-dna-info">
              This prompt is derived from the card's DNA and would be
              sent to ComfyUI / Stable Diffusion to generate unique art.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
