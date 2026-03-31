import type { SpeciesId, Rarity, GrowthRateType } from '../../types';

/**
 * Ordered arrays for DNA index mapping.
 * The order MUST NOT change — it's part of the DNA schema.
 */

export const SPECIES_ORDER: SpeciesId[] = [
  'gignen', 'fae', 'stoneheart', 'wilderling', 'angar', 'demar', 'creptilis',
];

export const RARITY_ORDER: Rarity[] = [
  'common', 'uncommon', 'rare', 'legend', 'myth',
];

export const GROWTH_RATE_ORDER: GrowthRateType[] = [
  'minimal', 'steady', 'normal', 'gradual', 'accelerated', 'exceptional',
];

/**
 * Growth rate weights per rarity for seeded generation.
 * Same values as cardGenerator.ts but in ordered array form for PRNG.
 */
export const GROWTH_WEIGHTS_BY_RARITY: Record<Rarity, number[]> = {
  common:   [10, 20, 40, 20, 8, 2],
  uncommon: [5, 15, 35, 25, 15, 5],
  rare:     [2, 10, 28, 30, 20, 10],
  legend:   [0, 5, 20, 30, 28, 17],
  myth:     [0, 0, 10, 25, 35, 30],
};

export const DNA_VERSION = 0x01;
