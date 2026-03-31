/**
 * Card DNA System — deterministic card identity.
 *
 * DNA is a 32-character hex string that encodes every random decision
 * made during card generation. Given the same DNA, reconstructCardFromDNA()
 * always produces the exact same SummonCard.
 */

import type {
  SummonCard,
  BaseStats,
  GrowthRates,
  GrowthRateType,
  SpeciesId,
  Rarity,
  StatKey,
} from '../../types';
import { STAT_KEYS } from '../../types';
import { mulberry32, seededInt, seededWeightedChoice } from './prng';
import {
  SPECIES_ORDER,
  RARITY_ORDER,
  GROWTH_RATE_ORDER,
  GROWTH_WEIGHTS_BY_RARITY,
  DNA_VERSION,
} from './constants';
import { SPECIES } from '../../data/species';
import { WEAPONS, ARMOR_CARDS, ACCESSORY_CARDS } from '../../data/cards';

// ─── DNA Parsing ──────────────────────────────────────────────────────────────

export interface ParsedDNA {
  version: number;
  speciesIndex: number;
  rarityIndex: number;
  nameSeed: number;
  growthSeed: number;
  statSeedA: number;
  statSeedB: number;
  statSeedC: number;
  equipmentSeed: number;
  flairSeed: number;
  checksum: number;
}

export function parseDNA(dna: string): ParsedDNA {
  if (dna.length !== 32) throw new Error(`Invalid DNA length: ${dna.length}, expected 32`);
  if (!/^[0-9a-f]+$/i.test(dna)) throw new Error('Invalid DNA: not hex');

  const hex = dna.toLowerCase();

  const version = parseInt(hex.slice(0, 2), 16);
  const speciesIndex = parseInt(hex.slice(2, 4), 16);
  const rarityAndReserved = parseInt(hex.slice(4, 7), 16);
  const rarityIndex = (rarityAndReserved >> 8) & 0xf;
  const nameSeed = parseInt(hex.slice(7, 10), 16);
  const growthSeed = parseInt(hex.slice(10, 15), 16);
  const statSeedA = parseInt(hex.slice(15, 18), 16);
  const statSeedB = parseInt(hex.slice(18, 21), 16);
  const statSeedC = parseInt(hex.slice(21, 24), 16);
  const equipmentSeed = parseInt(hex.slice(24, 27), 16);
  const flairSeed = parseInt(hex.slice(27, 30), 16);
  const checksum = parseInt(hex.slice(30, 32), 16);

  return {
    version,
    speciesIndex,
    rarityIndex,
    nameSeed,
    growthSeed,
    statSeedA,
    statSeedB,
    statSeedC,
    equipmentSeed,
    flairSeed,
    checksum,
  };
}

// ─── DNA Generation ───────────────────────────────────────────────────────────

/**
 * Generate a random DNA string.
 * In production, this runs SERVER-SIDE with crypto.getRandomValues().
 * For offline/testing, Math.random() is acceptable.
 */
export function generateDNA(
  species?: SpeciesId,
  rarity?: Rarity,
  randomFn: () => number = Math.random
): string {
  const speciesIdx = species
    ? SPECIES_ORDER.indexOf(species)
    : Math.floor(randomFn() * SPECIES_ORDER.length);
  const rarityIdx = rarity
    ? RARITY_ORDER.indexOf(rarity)
    : Math.floor(randomFn() * RARITY_ORDER.length);

  const nameSeed = Math.floor(randomFn() * 0xfff);
  const growthSeed = Math.floor(randomFn() * 0xfffff);
  const statSeedA = Math.floor(randomFn() * 0xfff);
  const statSeedB = Math.floor(randomFn() * 0xfff);
  const statSeedC = Math.floor(randomFn() * 0xfff);
  const equipmentSeed = Math.floor(randomFn() * 0xfff);
  const flairSeed = Math.floor(randomFn() * 0xfff);

  // Build hex without checksum
  const version = DNA_VERSION.toString(16).padStart(2, '0');
  const specHex = speciesIdx.toString(16).padStart(2, '0');
  const rarityAndReserved = ((rarityIdx << 8) | 0).toString(16).padStart(3, '0');
  const nameHex = nameSeed.toString(16).padStart(3, '0');
  const growthHex = growthSeed.toString(16).padStart(5, '0');
  const statAHex = statSeedA.toString(16).padStart(3, '0');
  const statBHex = statSeedB.toString(16).padStart(3, '0');
  const statCHex = statSeedC.toString(16).padStart(3, '0');
  const equipHex = equipmentSeed.toString(16).padStart(3, '0');
  const flairHex = flairSeed.toString(16).padStart(3, '0');

  const body = `${version}${specHex}${rarityAndReserved}${nameHex}${growthHex}${statAHex}${statBHex}${statCHex}${equipHex}${flairHex}`;

  // Checksum: XOR of all bytes
  let xor = 0;
  for (let i = 0; i < body.length; i += 2) {
    xor ^= parseInt(body.slice(i, i + 2), 16);
  }
  const checksumHex = (xor & 0xff).toString(16).padStart(2, '0');

  return body + checksumHex;
}

// ─── DNA Validation ───────────────────────────────────────────────────────────

export function validateDNA(dna: string): boolean {
  try {
    if (dna.length !== 32) return false;
    if (!/^[0-9a-f]+$/i.test(dna)) return false;

    const hex = dna.toLowerCase();
    const body = hex.slice(0, 30);
    const storedChecksum = parseInt(hex.slice(30, 32), 16);

    let xor = 0;
    for (let i = 0; i < body.length; i += 2) {
      xor ^= parseInt(body.slice(i, i + 2), 16);
    }

    if ((xor & 0xff) !== storedChecksum) return false;

    const parsed = parseDNA(dna);
    if (parsed.version !== DNA_VERSION) return false;
    if (parsed.speciesIndex >= SPECIES_ORDER.length) return false;
    if (parsed.rarityIndex >= RARITY_ORDER.length) return false;

    return true;
  } catch {
    return false;
  }
}

// ─── Name Generation ──────────────────────────────────────────────────────────

const PREFIXES: Record<SpeciesId, string[]> = {
  gignen: ['Ael', 'Brin', 'Cal', 'Dorn', 'Fen', 'Gael', 'Harn', 'Kel', 'Lor', 'Myr'],
  fae: ['Auri', 'Bel', 'Cel', 'Dew', 'Elan', 'Fey', 'Gil', 'Haze', 'Iris', 'Lum'],
  stoneheart: ['Bor', 'Crag', 'Dur', 'Flint', 'Grit', 'Hew', 'Iron', 'Krag', 'Mor', 'Rok'],
  wilderling: ['Ash', 'Briar', 'Claw', 'Dusk', 'Fang', 'Growl', 'Hunt', 'Ivy', 'Kite', 'Leaf'],
  angar: ['Aur', 'Bright', 'Cel', 'Dawn', 'Ether', 'Flux', 'Glow', 'Halo', 'Lux', 'Nova'],
  demar: ['Blaze', 'Char', 'Ember', 'Flick', 'Hex', 'Jinx', 'Knack', 'Nix', 'Quirk', 'Spark'],
  creptilis: ['Bane', 'Coil', 'Dread', 'Edge', 'Fume', 'Gloom', 'Husk', 'Lurk', 'Murk', 'Shade'],
};

const SUFFIXES = ['wind', 'stone', 'blade', 'heart', 'thorn', 'spark', 'shade', 'crest', 'fang', 'vale'];

// ─── Card Reconstruction ──────────────────────────────────────────────────────

/**
 * Reconstruct a complete SummonCard from a DNA string.
 * This is the core function — deterministic and side-effect free.
 * Same DNA always produces the same card.
 */
export function reconstructCardFromDNA(dna: string): SummonCard {
  if (!validateDNA(dna)) throw new Error(`Invalid DNA: ${dna}`);

  const parsed = parseDNA(dna);
  const species = SPECIES_ORDER[parsed.speciesIndex];
  const rarity = RARITY_ORDER[parsed.rarityIndex];
  const template = SPECIES[species];

  // Name
  const nameRng = mulberry32(parsed.nameSeed);
  const prefix = PREFIXES[species][seededInt(nameRng, 0, PREFIXES[species].length - 1)];
  const suffix = SUFFIXES[seededInt(nameRng, 0, SUFFIXES.length - 1)];
  const name = `${prefix}${suffix}`;

  // Growth rates
  const growthRng = mulberry32(parsed.growthSeed);
  const growthRates: Partial<GrowthRates> = {};
  for (const key of STAT_KEYS) {
    const weights = GROWTH_WEIGHTS_BY_RARITY[rarity];
    const weightRecord: Record<string, number> = {};
    GROWTH_RATE_ORDER.forEach((g, i) => { weightRecord[g] = weights[i]; });
    growthRates[key] = seededWeightedChoice(growthRng, weightRecord as Record<GrowthRateType, number>);
  }

  // Base stats
  const statRngA = mulberry32(parsed.statSeedA);
  const statRngB = mulberry32(parsed.statSeedB);
  const statRngC = mulberry32(parsed.statSeedC);
  const floorBonus = [0, 1, 2, 3, 4][parsed.rarityIndex] ?? 0;

  const statGroups: Array<{ keys: StatKey[]; rng: () => number }> = [
    { keys: ['STR', 'END', 'DEF'], rng: statRngA },
    { keys: ['INT', 'SPI', 'MDF'], rng: statRngB },
    { keys: ['SPD', 'ACC', 'LCK'], rng: statRngC },
  ];

  const baseStats: Partial<BaseStats> = {};
  for (const group of statGroups) {
    for (const key of group.keys) {
      const [min, max] = template.statRanges[key];
      const adjustedMin = Math.min(min + floorBonus, max);
      baseStats[key] = seededInt(group.rng, adjustedMin, max);
    }
  }

  // Equipment
  const equipRng = mulberry32(parsed.equipmentSeed);
  const allWeapons = Object.values(WEAPONS);
  const allArmor = Object.values(ARMOR_CARDS);
  const allAccessories = Object.values(ACCESSORY_CARDS);

  // Weapon by species archetype
  let weaponPool = allWeapons;
  if (['fae', 'demar', 'angar'].includes(species)) {
    weaponPool = allWeapons.filter(w => w.damageType === 'magical');
  } else if (['wilderling', 'creptilis'].includes(species)) {
    weaponPool = allWeapons.filter(w => w.damageType === 'physical_ranged');
  } else {
    weaponPool = allWeapons.filter(w => w.damageType === 'physical_melee');
  }
  if (weaponPool.length === 0) weaponPool = allWeapons;

  const weapon = { ...weaponPool[seededInt(equipRng, 0, weaponPool.length - 1)], id: `dna-wpn-${dna.slice(0, 8)}` };
  const armor = { ...allArmor[seededInt(equipRng, 0, allArmor.length - 1)], id: `dna-arm-${dna.slice(0, 8)}` };
  const accessory = { ...allAccessories[seededInt(equipRng, 0, allAccessories.length - 1)], id: `dna-acc-${dna.slice(0, 8)}` };

  return {
    id: `dna-${dna}`,
    name,
    cardType: 'summon',
    species,
    rarity,
    element: 'neutral',
    description: template.description,
    requirements: [],
    pileDestination: 'removed',
    baseStats: baseStats as BaseStats,
    growthRates: growthRates as GrowthRates,
    equipment: {
      weapon,
      offhand: null,
      armor,
      accessory,
    },
    digitalSignature: `sig-${dna}`,
    dna,
  };
}

// Re-export
export { mulberry32, seededInt, seededWeightedChoice } from './prng';
export { SPECIES_ORDER, RARITY_ORDER, GROWTH_RATE_ORDER, DNA_VERSION } from './constants';
