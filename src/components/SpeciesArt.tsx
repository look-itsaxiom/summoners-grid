import type { SpeciesId } from '../types';

// CSS-generated abstract art patterns for each species
const SPECIES_GRADIENTS: Record<SpeciesId, string> = {
  gignen: 'linear-gradient(135deg, #2a3a4a 0%, #3a4a3a 50%, #4a3a2a 100%)',
  fae: 'linear-gradient(135deg, #2a1a4a 0%, #4a2a6a 50%, #2a4a6a 100%)',
  stoneheart: 'linear-gradient(135deg, #3a2a1a 0%, #5a4a3a 50%, #3a3a2a 100%)',
  wilderling: 'linear-gradient(135deg, #1a3a1a 0%, #2a4a1a 50%, #3a5a2a 100%)',
  angar: 'linear-gradient(135deg, #3a3a1a 0%, #5a5a2a 50%, #4a4a3a 100%)',
  demar: 'linear-gradient(135deg, #3a1a1a 0%, #5a2a1a 50%, #4a1a2a 100%)',
  creptilis: 'linear-gradient(135deg, #1a1a2a 0%, #2a2a4a 50%, #1a2a3a 100%)',
};

const SPECIES_SYMBOLS: Record<SpeciesId, string> = {
  gignen: '◆',
  fae: '✦',
  stoneheart: '▣',
  wilderling: '❖',
  angar: '☆',
  demar: '⬡',
  creptilis: '◈',
};

const SPECIES_ACCENT: Record<SpeciesId, string> = {
  gignen: '#6a8a6a',
  fae: '#8a6aaa',
  stoneheart: '#aa8a6a',
  wilderling: '#6aaa6a',
  angar: '#aaaa6a',
  demar: '#aa6a4a',
  creptilis: '#6a8aaa',
};

interface SpeciesArtProps {
  species: SpeciesId;
  size?: 'small' | 'medium' | 'large';
}

export function SpeciesArt({ species, size = 'medium' }: SpeciesArtProps) {
  const sizeMap = { small: 24, medium: 40, large: 60 };
  const px = sizeMap[size];

  return (
    <div
      className="species-art"
      style={{
        width: px,
        height: px,
        background: SPECIES_GRADIENTS[species],
        borderRadius: size === 'small' ? 4 : 6,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: px * 0.5,
        color: SPECIES_ACCENT[species],
        border: `1px solid ${SPECIES_ACCENT[species]}40`,
        flexShrink: 0,
      }}
    >
      {SPECIES_SYMBOLS[species]}
    </div>
  );
}

export { SPECIES_GRADIENTS, SPECIES_SYMBOLS, SPECIES_ACCENT };
