/**
 * DNA → NFT Metadata converter.
 * Produces Immutable-compatible ERC-721 metadata from a DNA string.
 */

import type { StatKey } from '../../types';
import { STAT_KEYS, GROWTH_RATE_SYMBOLS, GROWTH_RATE_VALUES } from '../../types';
import { reconstructCardFromDNA } from './index';

export interface NFTAttribute {
  trait_type: string;
  value: string | number;
  display_type?: 'number';
}

export interface NFTMetadata {
  name: string;
  description: string;
  image: string;
  animation_url: string;
  external_url: string;
  attributes: NFTAttribute[];
}

const GROWTH_DISPLAY: Record<string, string> = {
  minimal: 'Minimal (--)',
  steady: 'Steady (-)',
  normal: 'Normal (_)',
  gradual: 'Gradual (+)',
  accelerated: 'Accelerated (++)',
  exceptional: 'Exceptional (*)',
};

/**
 * Convert a DNA string into Immutable-compatible NFT metadata.
 */
export function dnaToNFTMetadata(
  dna: string,
  tokenId?: string,
  imageUrl?: string,
  spriteUrl?: string,
  baseExternalUrl: string = 'https://summonersgrid.com/card'
): NFTMetadata {
  const card = reconstructCardFromDNA(dna);

  // Stat total
  const statTotal = STAT_KEYS.reduce((sum, key) => sum + card.baseStats[key], 0);

  // Growth score (weighted: exceptional=6, accelerated=5, etc.)
  const growthScoreMap: Record<string, number> = {
    minimal: 1, steady: 2, normal: 3, gradual: 4, accelerated: 5, exceptional: 6,
  };
  const growthScore = STAT_KEYS.reduce(
    (sum, key) => sum + (growthScoreMap[card.growthRates[key]] ?? 3), 0
  );

  // Find highest stat for description
  let highestStat: StatKey = 'STR';
  let highestVal = 0;
  for (const key of STAT_KEYS) {
    if (card.baseStats[key] > highestVal) {
      highestVal = card.baseStats[key];
      highestStat = key;
    }
  }

  // Find best growth rate for description
  let bestGrowth = '';
  let bestGrowthVal = 0;
  for (const key of STAT_KEYS) {
    const val = GROWTH_RATE_VALUES[card.growthRates[key]];
    if (val > bestGrowthVal) {
      bestGrowthVal = val;
      bestGrowth = `${key} ${GROWTH_RATE_SYMBOLS[card.growthRates[key]]}`;
    }
  }

  const description = `A ${card.rarity} ${card.species} summon. ${highestStat}-focused with ${bestGrowth} growth.`;

  const attributes: NFTAttribute[] = [
    { trait_type: 'DNA', value: dna },
    { trait_type: 'Species', value: card.species.charAt(0).toUpperCase() + card.species.slice(1) },
    { trait_type: 'Rarity', value: card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1) },
  ];

  // Individual stats
  for (const key of STAT_KEYS) {
    attributes.push({ trait_type: key, value: card.baseStats[key], display_type: 'number' });
  }

  // Growth rates
  for (const key of STAT_KEYS) {
    attributes.push({ trait_type: `${key} Growth`, value: GROWTH_DISPLAY[card.growthRates[key]] ?? card.growthRates[key] });
  }

  // Equipment
  attributes.push({ trait_type: 'Weapon', value: card.equipment.weapon?.name ?? 'None' });
  attributes.push({ trait_type: 'Armor', value: card.equipment.armor?.name ?? 'None' });
  attributes.push({ trait_type: 'Accessory', value: card.equipment.accessory?.name ?? 'None' });

  // Computed scores
  attributes.push({ trait_type: 'Stat Total', value: statTotal, display_type: 'number' });
  attributes.push({ trait_type: 'Growth Score', value: growthScore, display_type: 'number' });

  return {
    name: card.name,
    description,
    image: imageUrl ?? '',
    animation_url: spriteUrl ?? '',
    external_url: tokenId ? `${baseExternalUrl}/${tokenId}` : '',
    attributes,
  };
}
