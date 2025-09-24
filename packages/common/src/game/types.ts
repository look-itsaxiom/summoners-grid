export enum CardType {
  SUMMON = 'Summon',
  ACTION = 'Action',
  BUILDING = 'Building',
  QUEST = 'Quest',
  COUNTER = 'Counter',
  REACTION = 'Reaction',
  ROLE = 'Role',
  EQUIPMENT = 'Equipment',
  ADVANCE = 'Advance',
  UNIQUE = 'Unique',
}

export enum RoleFamily {
  WARRIOR = 'Warrior',
  MAGICIAN = 'Magician',
  SCOUT = 'Scout',
}

export enum Attribute {
  NEUTRAL = 'Neutral',
  FIRE = 'Fire',
  WATER = 'Water',
  EARTH = 'Earth',
  WIND = 'Wind',
  LIGHT = 'Light',
  DARK = 'Dark',
  NATURE = 'Nature',
}

export enum Stat {
  STR = 'STR', // Strength
  END = 'END', // Endurance
  DEF = 'DEF', // Defense
  INT = 'INT', // Intelligence
  SPI = 'SPI', // Spirit
  MDF = 'MDF', // Magic Defense
  SPD = 'SPD', // Speed
  ACC = 'ACC', // Accuracy
  LCK = 'LCK', // Luck
}

export enum GrowthRate {
  MINIMAL = 'Minimal', // 0.5
  STEADY = 'Steady', // 0.67
  NORMAL = 'Normal', // 1.0
  GRADUAL = 'Gradual', // 1.33
  ACCELERATED = 'Accelerated', // 1.5
  EXCEPTIONAL = 'Exceptional', // 2.0
}

export const GROWTH_RATE_VALUES: { [key in GrowthRate]: number } = {
  [GrowthRate.MINIMAL]: 0.5,
  [GrowthRate.STEADY]: 2 / 3,
  [GrowthRate.NORMAL]: 1.0,
  [GrowthRate.GRADUAL]: 4 / 3,
  [GrowthRate.ACCELERATED]: 1.5,
  [GrowthRate.EXCEPTIONAL]: 2.0,
};

export enum GamePhase {
  DRAW = 'Draw',
  LEVEL = 'Level',
  ACTION = 'Action',
  END = 'End',
}

export enum Zone {
  HAND = 'Hand',
  MAIN_DECK = 'MainDeck',
  ADVANCE_DECK = 'AdvanceDeck',
  DISCARD_PILE = 'DiscardPile',
  RECHARGE_PILE = 'RechargePile',
  REMOVED_FROM_PLAY = 'RemovedFromPlay',
  IN_PLAY = 'InPlay',
  GAME_BOARD = 'GameBoard',
}

export enum ActionSpeed {
  COUNTER = 'Counter',
  REACTION = 'Reaction',
  ACTION = 'Action',
}

export type PlayerID = 'A' | 'B';
