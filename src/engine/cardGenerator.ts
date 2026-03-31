import type {
  SummonCard,
  BaseStats,
  GrowthRates,
  GrowthRateType,
  Rarity,
  SpeciesId,
  WeaponCard,
} from '../types';
import { STAT_KEYS } from '../types';
import { SPECIES } from '../data/species';
import { WEAPONS, ARMOR_CARDS, ACCESSORY_CARDS } from '../data/cards';

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

function generateName(species: SpeciesId): string {
  const prefix = PREFIXES[species][Math.floor(Math.random() * PREFIXES[species].length)];
  const suffix = SUFFIXES[Math.floor(Math.random() * SUFFIXES.length)];
  return `${prefix}${suffix}`;
}

// ─── Rarity System ────────────────────────────────────────────────────────────

// Higher rarity = higher stat floor, not ceiling
const RARITY_STAT_FLOOR_BONUS: Record<Rarity, number> = {
  common: 0,
  uncommon: 1,
  rare: 2,
  legend: 3,
  myth: 4,
};

// Growth rate distribution weights per rarity (higher rarity = better distribution)
const GROWTH_RATE_WEIGHTS: Record<Rarity, Record<GrowthRateType, number>> = {
  common: {
    minimal: 10, steady: 20, normal: 40, gradual: 20, accelerated: 8, exceptional: 2,
  },
  uncommon: {
    minimal: 5, steady: 15, normal: 35, gradual: 25, accelerated: 15, exceptional: 5,
  },
  rare: {
    minimal: 2, steady: 10, normal: 28, gradual: 30, accelerated: 20, exceptional: 10,
  },
  legend: {
    minimal: 0, steady: 5, normal: 20, gradual: 30, accelerated: 28, exceptional: 17,
  },
  myth: {
    minimal: 0, steady: 0, normal: 10, gradual: 25, accelerated: 35, exceptional: 30,
  },
};

function rollGrowthRate(rarity: Rarity): GrowthRateType {
  const weights = GROWTH_RATE_WEIGHTS[rarity];
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;

  for (const [type, weight] of Object.entries(weights)) {
    roll -= weight;
    if (roll <= 0) return type as GrowthRateType;
  }

  return 'normal';
}

// ─── Pack Opening ─────────────────────────────────────────────────────────────

const SPECIES_IDS: SpeciesId[] = ['gignen', 'fae', 'stoneheart', 'wilderling', 'angar', 'demar', 'creptilis'];

// Species appearance weights per rarity slot
const SPECIES_RARITY_WEIGHTS: Record<Rarity, Record<SpeciesId, number>> = {
  common: { gignen: 30, fae: 20, stoneheart: 20, wilderling: 15, angar: 5, demar: 5, creptilis: 5 },
  uncommon: { gignen: 20, fae: 20, stoneheart: 15, wilderling: 15, angar: 10, demar: 10, creptilis: 10 },
  rare: { gignen: 15, fae: 15, stoneheart: 15, wilderling: 15, angar: 15, demar: 12, creptilis: 13 },
  legend: { gignen: 10, fae: 12, stoneheart: 12, wilderling: 14, angar: 16, demar: 18, creptilis: 18 },
  myth: { gignen: 8, fae: 10, stoneheart: 10, wilderling: 12, angar: 18, demar: 20, creptilis: 22 },
};

function rollSpecies(rarity: Rarity): SpeciesId {
  const weights = SPECIES_RARITY_WEIGHTS[rarity];
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  let roll = Math.random() * totalWeight;

  for (const species of SPECIES_IDS) {
    roll -= weights[species];
    if (roll <= 0) return species;
  }

  return 'gignen';
}

function rollRarity(slotIndex: number, packSize: number = 7): Rarity {
  // Last slot guaranteed rare+, second-to-last guaranteed uncommon+
  if (slotIndex === packSize - 1) {
    // Guaranteed rare slot
    const roll = Math.random() * 100;
    if (roll < 70) return 'rare';
    if (roll < 92) return 'legend';
    return 'myth';
  }
  if (slotIndex === packSize - 2) {
    // Guaranteed uncommon slot
    const roll = Math.random() * 100;
    if (roll < 60) return 'uncommon';
    if (roll < 85) return 'rare';
    if (roll < 97) return 'legend';
    return 'myth';
  }
  // Normal slot
  const roll = Math.random() * 100;
  if (roll < 75) return 'common';
  if (roll < 90) return 'uncommon';
  if (roll < 97) return 'rare';
  if (roll < 99.5) return 'legend';
  return 'myth';
}

// ─── Summon Generation ────────────────────────────────────────────────────────

let generationCounter = 0;

function generateBaseStats(species: SpeciesId, rarity: Rarity): BaseStats {
  const template = SPECIES[species];
  const floorBonus = RARITY_STAT_FLOOR_BONUS[rarity];
  const stats: Partial<BaseStats> = {};

  for (const key of STAT_KEYS) {
    const [min, max] = template.statRanges[key];
    const adjustedMin = Math.min(min + floorBonus, max);
    stats[key] = adjustedMin + Math.floor(Math.random() * (max - adjustedMin + 1));
  }

  return stats as BaseStats;
}

function generateGrowthRates(rarity: Rarity): GrowthRates {
  const rates: Partial<GrowthRates> = {};
  for (const key of STAT_KEYS) {
    rates[key] = rollGrowthRate(rarity);
  }
  return rates as GrowthRates;
}

function getDefaultWeapon(species: SpeciesId): WeaponCard {
  const allWeapons = Object.values(WEAPONS);
  switch (species) {
    case 'fae':
    case 'demar':
    case 'angar': {
      const magicWeapons = allWeapons.filter(w => w.damageType === 'magical');
      return { ...magicWeapons[Math.floor(Math.random() * magicWeapons.length)], id: `wpn-${++generationCounter}` };
    }
    case 'wilderling':
    case 'creptilis': {
      const rangedWeapons = allWeapons.filter(w => w.damageType === 'physical_ranged');
      return { ...rangedWeapons[Math.floor(Math.random() * rangedWeapons.length)], id: `wpn-${++generationCounter}` };
    }
    default: {
      const meleeWeapons = allWeapons.filter(w => w.damageType === 'physical_melee');
      return { ...meleeWeapons[Math.floor(Math.random() * meleeWeapons.length)], id: `wpn-${++generationCounter}` };
    }
  }
}

function getRandomArmor() {
  const armors = Object.values(ARMOR_CARDS);
  const armor = armors[Math.floor(Math.random() * armors.length)];
  return { ...armor, id: `armor-${++generationCounter}` };
}

function getRandomAccessory() {
  const accessories = Object.values(ACCESSORY_CARDS);
  const acc = accessories[Math.floor(Math.random() * accessories.length)];
  return { ...acc, id: `acc-${++generationCounter}` };
}

export function generateSummonCard(rarity?: Rarity, species?: SpeciesId): SummonCard {
  const cardRarity = rarity ?? rollRarity(0);
  const cardSpecies = species ?? rollSpecies(cardRarity);
  const baseStats = generateBaseStats(cardSpecies, cardRarity);
  const growthRates = generateGrowthRates(cardRarity);
  const name = generateName(cardSpecies);
  const id = `gen-${cardSpecies}-${++generationCounter}-${Date.now()}`;
  const template = SPECIES[cardSpecies];

  return {
    id,
    name,
    cardType: 'summon',
    species: cardSpecies,
    rarity: cardRarity,
    element: 'neutral',
    description: template.description,
    requirements: [],
    pileDestination: 'removed',
    baseStats,
    growthRates,
    equipment: {
      weapon: getDefaultWeapon(cardSpecies),
      offhand: null,
      armor: getRandomArmor(),
      accessory: getRandomAccessory(),
    },
    digitalSignature: `sig-${id}`,
  };
}

export function generatePack(packSize: number = 7): SummonCard[] {
  const cards: SummonCard[] = [];
  for (let i = 0; i < packSize; i++) {
    const rarity = rollRarity(i, packSize);
    cards.push(generateSummonCard(rarity));
  }
  return cards;
}

// ─── Rarity Colors ────────────────────────────────────────────────────────────

export const RARITY_COLORS: Record<Rarity, string> = {
  common: '#aaa',
  uncommon: '#4a4',
  rare: '#44f',
  legend: '#fa0',
  myth: '#f4f',
};
