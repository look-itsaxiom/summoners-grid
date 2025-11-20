// Card data for Alpha set based on documentation

const { CARD_TYPES, EQUIPMENT_SLOTS, ATTRIBUTES, SPEEDS, ROLE_FAMILIES } = require('./constants');

// Role Cards
const ROLES = {
  warrior: {
    id: 'warrior',
    name: 'Warrior',
    type: CARD_TYPES.ROLE,
    tier: 1,
    family: ROLE_FAMILIES.WARRIOR,
    statModifiers: { str: 1.25, end: 1.25 },
    rarity: 'common'
  },
  magician: {
    id: 'magician',
    name: 'Magician',
    type: CARD_TYPES.ROLE,
    tier: 1,
    family: ROLE_FAMILIES.MAGICIAN,
    statModifiers: { int: 1.25, spi: 1.25 },
    rarity: 'common'
  },
  scout: {
    id: 'scout',
    name: 'Scout',
    type: CARD_TYPES.ROLE,
    tier: 1,
    family: ROLE_FAMILIES.SCOUT,
    statModifiers: { spd: 1.25, acc: 1.25 },
    rarity: 'common'
  },
  berserker: {
    id: 'berserker',
    name: 'Berserker',
    type: CARD_TYPES.ROLE,
    tier: 2,
    family: ROLE_FAMILIES.WARRIOR,
    statModifiers: { str: 1.5, spd: 1.1, def: 0.9 },
    rarity: 'uncommon'
  },
  knight: {
    id: 'knight',
    name: 'Knight',
    type: CARD_TYPES.ROLE,
    tier: 2,
    family: ROLE_FAMILIES.WARRIOR,
    statModifiers: { str: 1.3, def: 1.3, end: 1.2 },
    rarity: 'uncommon'
  },
  rogue: {
    id: 'rogue',
    name: 'Rogue',
    type: CARD_TYPES.ROLE,
    tier: 2,
    family: ROLE_FAMILIES.SCOUT,
    statModifiers: { spd: 1.4, acc: 1.25, lck: 1.2 },
    rarity: 'uncommon'
  },
  elementMage: {
    id: 'elementMage',
    name: 'Element Mage',
    type: CARD_TYPES.ROLE,
    tier: 2,
    family: ROLE_FAMILIES.MAGICIAN,
    statModifiers: { int: 1.4, spi: 1.2, lck: 1.1 },
    rarity: 'uncommon'
  },
  lightMage: {
    id: 'lightMage',
    name: 'Light Mage',
    type: CARD_TYPES.ROLE,
    tier: 2,
    family: ROLE_FAMILIES.MAGICIAN,
    statModifiers: { spi: 1.35, int: 1.25, mdf: 1.15 },
    rarity: 'uncommon'
  },
  darkMage: {
    id: 'darkMage',
    name: 'Dark Mage',
    type: CARD_TYPES.ROLE,
    tier: 2,
    family: ROLE_FAMILIES.MAGICIAN,
    statModifiers: { int: 1.4, spi: 1.2, mdf: 0.9 },
    rarity: 'uncommon'
  }
};

// Weapon Cards
const WEAPONS = {
  apprenticesWand: {
    id: 'apprenticesWand',
    name: "Apprentice's Wand",
    type: CARD_TYPES.EQUIPMENT,
    slot: EQUIPMENT_SLOTS.WEAPON,
    power: 15,
    range: 2,
    damageStat: 'int',
    statBonuses: { int: 2, spi: 1 },
    attribute: ATTRIBUTES.NEUTRAL,
    rarity: 'common'
  },
  heirloomSword: {
    id: 'heirloomSword',
    name: 'Heirloom Sword',
    type: CARD_TYPES.EQUIPMENT,
    slot: EQUIPMENT_SLOTS.WEAPON,
    power: 30,
    range: 1,
    damageStat: 'str',
    statBonuses: { str: 1, end: 1, def: 1, int: 1, spi: 1, mdf: 1, spd: 1, acc: 1, lck: 0.01 },
    attribute: ATTRIBUTES.NEUTRAL,
    rarity: 'common'
  },
  huntingBow: {
    id: 'huntingBow',
    name: 'Hunting Bow',
    type: CARD_TYPES.EQUIPMENT,
    slot: EQUIPMENT_SLOTS.WEAPON,
    power: 25,
    range: 3,
    damageStat: 'hybrid', // (STR + ACC) / 2
    statBonuses: { acc: 2, spd: 1 },
    attribute: ATTRIBUTES.NEUTRAL,
    rarity: 'common'
  }
};

// Action Cards
const ACTIONS = {
  blastBolt: {
    id: 'blastBolt',
    name: 'Blast Bolt',
    type: CARD_TYPES.ACTION,
    speed: SPEEDS.ACTION,
    attribute: ATTRIBUTES.FIRE,
    rarity: 'common',
    requirements: { family: ROLE_FAMILIES.MAGICIAN },
    basePower: 60,
    baseAccuracy: 85,
    canCrit: true
  },
  sharpenedBlade: {
    id: 'sharpenedBlade',
    name: 'Sharpened Blade',
    type: CARD_TYPES.ACTION,
    speed: SPEEDS.ACTION,
    attribute: ATTRIBUTES.NEUTRAL,
    rarity: 'common',
    requirements: { family: ROLE_FAMILIES.WARRIOR },
    effect: 'weaponPowerBonus',
    powerBonus: 10
  },
  healingHands: {
    id: 'healingHands',
    name: 'Healing Hands',
    type: CARD_TYPES.ACTION,
    speed: SPEEDS.ACTION,
    attribute: ATTRIBUTES.LIGHT,
    rarity: 'common',
    requirements: { family: ROLE_FAMILIES.MAGICIAN },
    basePower: 40,
    canCrit: true,
    effect: 'heal'
  },
  rush: {
    id: 'rush',
    name: 'Rush',
    type: CARD_TYPES.ACTION,
    speed: SPEEDS.ACTION,
    attribute: ATTRIBUTES.NEUTRAL,
    rarity: 'common',
    requirements: { family: ROLE_FAMILIES.SCOUT },
    effect: 'extraMovementAndAttack'
  },
  ensnare: {
    id: 'ensnare',
    name: 'Ensnare',
    type: CARD_TYPES.ACTION,
    speed: SPEEDS.ACTION,
    attribute: ATTRIBUTES.EARTH,
    rarity: 'uncommon',
    requirements: { family: ROLE_FAMILIES.SCOUT },
    basePower: 25,
    baseAccuracy: 75,
    effect: 'immobilize',
    saveChance: 30
  }
};

module.exports = {
  ROLES,
  WEAPONS,
  ACTIONS
};
