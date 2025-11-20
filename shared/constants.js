// Game constants based on GDD

const BOARD_WIDTH = 12;
const BOARD_HEIGHT = 14;

const STARTING_LEVEL = 5;
const MAX_LEVEL = 20;
const MAX_HAND_SIZE = 6;

const VICTORY_POINTS_TO_WIN = 3;

// Victory Point values
const VP_TIER1_DEFEAT = 1;
const VP_TIER2_DEFEAT = 2;
const VP_TERRITORY_ATTACK = 1;

// Phases
const PHASES = {
  DRAW: 'draw',
  LEVEL: 'level',
  ACTION: 'action',
  END: 'end'
};

// Card Types
const CARD_TYPES = {
  SUMMON: 'summon',
  ACTION: 'action',
  ROLE: 'role',
  EQUIPMENT: 'equipment',
  BUILDING: 'building',
  QUEST: 'quest',
  COUNTER: 'counter',
  REACTION: 'reaction',
  ADVANCE: 'advance'
};

// Equipment Slots
const EQUIPMENT_SLOTS = {
  WEAPON: 'weapon',
  OFFHAND: 'offhand',
  ARMOR: 'armor',
  ACCESSORY: 'accessory'
};

// Speed Levels
const SPEEDS = {
  COUNTER: 3,
  REACTION: 2,
  ACTION: 1
};

// Attributes
const ATTRIBUTES = {
  FIRE: 'fire',
  WATER: 'water',
  EARTH: 'earth',
  WIND: 'wind',
  LIGHT: 'light',
  DARK: 'dark',
  NEUTRAL: 'neutral'
};

// Role Families
const ROLE_FAMILIES = {
  WARRIOR: 'warrior',
  MAGICIAN: 'magician',
  SCOUT: 'scout'
};

// Growth Rate Types
const GROWTH_RATES = {
  MINIMAL: 0.5,
  STEADY: 0.67,
  NORMAL: 1.0,
  GRADUAL: 1.33,
  ACCELERATED: 1.5,
  EXCEPTIONAL: 2.0
};

// Stats
const STATS = {
  STR: 'str',
  END: 'end',
  DEF: 'def',
  INT: 'int',
  SPI: 'spi',
  MDF: 'mdf',
  SPD: 'spd',
  ACC: 'acc',
  LCK: 'lck'
};

// Species
const SPECIES = {
  GIGNEN: 'gignen',
  FAE: 'fae',
  STONEHEART: 'stoneheart',
  WILDERLING: 'wilderling',
  ANGAR: 'angar',
  DEMAR: 'demar',
  CREPTILIS: 'creptilis'
};

module.exports = {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  STARTING_LEVEL,
  MAX_LEVEL,
  MAX_HAND_SIZE,
  VICTORY_POINTS_TO_WIN,
  VP_TIER1_DEFEAT,
  VP_TIER2_DEFEAT,
  VP_TERRITORY_ATTACK,
  PHASES,
  CARD_TYPES,
  EQUIPMENT_SLOTS,
  SPEEDS,
  ATTRIBUTES,
  ROLE_FAMILIES,
  GROWTH_RATES,
  STATS,
  SPECIES
};
