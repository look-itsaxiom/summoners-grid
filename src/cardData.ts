import { Card, CardType, Attribute, Species, Role, SummonCard, GrowthRate } from './types';

// Sample cards based on Alpha Cards documentation
export const SAMPLE_CARDS: Card[] = [
  // Summon cards for Player A (Gignen focus)
  {
    id: 'SUMMON_001',
    name: 'Gignen Warrior',
    type: CardType.SUMMON,
    species: Species.GIGNEN,
    role: Role.WARRIOR,
    level: 12,
    attribute: Attribute.FIRE,
    baseStats: {
      STR: 10, END: 10, DEF: 9, INT: 8, SPI: 8, MDF: 8, SPD: 9, ACC: 9, LCK: 9
    },
    growthRates: {
      STR: GrowthRate.FAST, END: GrowthRate.NORMAL, DEF: GrowthRate.NORMAL,
      INT: GrowthRate.SLOW, SPI: GrowthRate.SLOW, MDF: GrowthRate.SLOW,
      SPD: GrowthRate.NORMAL, ACC: GrowthRate.NORMAL, LCK: GrowthRate.NORMAL
    },
    equippedWeapon: 'Heirloom Sword'
  } as SummonCard,
  {
    id: 'SUMMON_002',
    name: 'Gignen Magician',
    type: CardType.SUMMON,
    species: Species.GIGNEN,
    role: Role.MAGICIAN,
    level: 10,
    attribute: Attribute.LIGHT,
    baseStats: {
      STR: 8, END: 8, DEF: 8, INT: 10, SPI: 10, MDF: 9, SPD: 9, ACC: 9, LCK: 9
    },
    growthRates: {
      STR: GrowthRate.SLOW, END: GrowthRate.SLOW, DEF: GrowthRate.SLOW,
      INT: GrowthRate.FAST, SPI: GrowthRate.FAST, MDF: GrowthRate.NORMAL,
      SPD: GrowthRate.NORMAL, ACC: GrowthRate.NORMAL, LCK: GrowthRate.NORMAL
    },
    equippedWeapon: "Apprentice's Wand"
  } as SummonCard,
  {
    id: 'SUMMON_003',
    name: 'Gignen Scout',
    type: CardType.SUMMON,
    species: Species.GIGNEN,
    role: Role.SCOUT,
    level: 10,
    attribute: Attribute.WIND,
    baseStats: {
      STR: 9, END: 8, DEF: 8, INT: 8, SPI: 8, MDF: 8, SPD: 10, ACC: 10, LCK: 9
    },
    growthRates: {
      STR: GrowthRate.NORMAL, END: GrowthRate.SLOW, DEF: GrowthRate.SLOW,
      INT: GrowthRate.SLOW, SPI: GrowthRate.SLOW, MDF: GrowthRate.SLOW,
      SPD: GrowthRate.FAST, ACC: GrowthRate.FAST, LCK: GrowthRate.NORMAL
    },
    equippedWeapon: 'Hunting Bow'
  } as SummonCard,
  
  // Summon cards for Player B (Mixed species)
  {
    id: 'SUMMON_004',
    name: 'Stoneheart Warrior',
    type: CardType.SUMMON,
    species: Species.STONEHEART,
    role: Role.WARRIOR,
    level: 12,
    attribute: Attribute.EARTH,
    baseStats: {
      STR: 10, END: 14, DEF: 12, INT: 8, SPI: 8, MDF: 8, SPD: 8, ACC: 9, LCK: 9
    },
    growthRates: {
      STR: GrowthRate.FAST, END: GrowthRate.FAST, DEF: GrowthRate.FAST,
      INT: GrowthRate.SLOW, SPI: GrowthRate.SLOW, MDF: GrowthRate.SLOW,
      SPD: GrowthRate.SLOW, ACC: GrowthRate.NORMAL, LCK: GrowthRate.NORMAL
    },
    equippedWeapon: 'Heirloom Sword'
  } as SummonCard,
  {
    id: 'SUMMON_005',
    name: 'Fae Magician',
    type: CardType.SUMMON,
    species: Species.FAE,
    role: Role.MAGICIAN,
    level: 8,
    attribute: Attribute.LIGHT,
    baseStats: {
      STR: 8, END: 8, DEF: 8, INT: 14, SPI: 12, MDF: 10, SPD: 9, ACC: 9, LCK: 10
    },
    growthRates: {
      STR: GrowthRate.SLOW, END: GrowthRate.SLOW, DEF: GrowthRate.SLOW,
      INT: GrowthRate.FAST, SPI: GrowthRate.FAST, MDF: GrowthRate.NORMAL,
      SPD: GrowthRate.NORMAL, ACC: GrowthRate.NORMAL, LCK: GrowthRate.NORMAL
    },
    equippedWeapon: "Apprentice's Wand"
  } as SummonCard,
  {
    id: 'SUMMON_006',
    name: 'Wilderling Scout',
    type: CardType.SUMMON,
    species: Species.WILDERLING,
    role: Role.SCOUT,
    level: 15,
    attribute: Attribute.WIND,
    baseStats: {
      STR: 14, END: 9, DEF: 8, INT: 8, SPI: 8, MDF: 8, SPD: 14, ACC: 10, LCK: 9
    },
    growthRates: {
      STR: GrowthRate.FAST, END: GrowthRate.NORMAL, DEF: GrowthRate.SLOW,
      INT: GrowthRate.SLOW, SPI: GrowthRate.SLOW, MDF: GrowthRate.SLOW,
      SPD: GrowthRate.FAST, ACC: GrowthRate.NORMAL, LCK: GrowthRate.NORMAL
    },
    equippedWeapon: 'Hunting Bow'
  } as SummonCard,

  // Action cards
  {
    id: 'ACTION_001',
    name: 'Healing Hands',
    type: CardType.ACTION,
    attribute: Attribute.LIGHT,
    rarity: 'Common',
    description: 'Heal target summon for caster.SPI × 1.2'
  },
  {
    id: 'ACTION_002',
    name: 'Sharpened Blade',
    type: CardType.ACTION,
    attribute: Attribute.NEUTRAL,
    rarity: 'Common',
    description: 'Target summon gains +5 STR until end of turn'
  },
  {
    id: 'ACTION_003',
    name: 'Rush',
    type: CardType.ACTION,
    attribute: Attribute.WIND,
    rarity: 'Common',
    description: 'Target summon gains +2 movement until end of turn'
  },
];

export function getSummonCards(): SummonCard[] {
  return SAMPLE_CARDS.filter(card => card.type === CardType.SUMMON) as SummonCard[];
}

export function getPlayerADeck(): Card[] {
  return [
    SAMPLE_CARDS[0], // Gignen Warrior
    SAMPLE_CARDS[1], // Gignen Magician
    SAMPLE_CARDS[2], // Gignen Scout
  ];
}

export function getPlayerBDeck(): Card[] {
  return [
    SAMPLE_CARDS[3], // Stoneheart Warrior
    SAMPLE_CARDS[4], // Fae Magician
    SAMPLE_CARDS[5], // Wilderling Scout
  ];
}
