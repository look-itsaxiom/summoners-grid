// Core game types based on Summoner's Grid GDD

export enum CardType {
  SUMMON = 'SUMMON',
  ACTION = 'ACTION',
  ROLE = 'ROLE',
  BUILDING = 'BUILDING',
  WEAPON = 'WEAPON',
  ADVANCE = 'ADVANCE',
  COUNTER = 'COUNTER',
  QUEST = 'QUEST',
  UNIQUE = 'UNIQUE'
}

export enum Attribute {
  FIRE = 'FIRE',
  WATER = 'WATER',
  EARTH = 'EARTH',
  WIND = 'WIND',
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  NEUTRAL = 'NEUTRAL'
}

export enum Species {
  GIGNEN = 'GIGNEN',
  FAE = 'FAE',
  STONEHEART = 'STONEHEART',
  WILDERLING = 'WILDERLING',
  ANGAR = 'ANGAR'
}

export enum Role {
  WARRIOR = 'WARRIOR',
  MAGICIAN = 'MAGICIAN',
  SCOUT = 'SCOUT',
  KNIGHT = 'KNIGHT',
  BERSERKER = 'BERSERKER',
  PALADIN = 'PALADIN',
  LIGHT_MAGE = 'LIGHT_MAGE',
  DARK_MAGE = 'DARK_MAGE',
  WARLOCK = 'WARLOCK',
  RANGER = 'RANGER',
  ASSASSIN = 'ASSASSIN',
  SCOUTMASTER = 'SCOUTMASTER'
}

export enum Zone {
  MAIN_DECK = 'MAIN_DECK',
  HAND = 'HAND',
  IN_PLAY = 'IN_PLAY',
  BATTLEFIELD = 'BATTLEFIELD',
  DISCARD_PILE = 'DISCARD_PILE',
  RECHARGE_PILE = 'RECHARGE_PILE',
  ADVANCE_DECK = 'ADVANCE_DECK',
  REMOVED = 'REMOVED'
}

export enum TurnPhase {
  DRAW = 'DRAW',
  LEVEL = 'LEVEL',
  ACTION = 'ACTION',
  END = 'END'
}

export enum GrowthRate {
  SLOW = 'SLOW',
  NORMAL = 'NORMAL',
  FAST = 'FAST'
}

export interface Stats {
  STR: number;  // Strength
  END: number;  // Endurance
  DEF: number;  // Defense
  INT: number;  // Intelligence
  SPI: number;  // Spirit
  MDF: number;  // Magic Defense
  SPD: number;  // Speed
  ACC: number;  // Accuracy
  LCK: number;  // Luck
}

export interface GrowthRates {
  STR: GrowthRate;
  END: GrowthRate;
  DEF: GrowthRate;
  INT: GrowthRate;
  SPI: GrowthRate;
  MDF: GrowthRate;
  SPD: GrowthRate;
  ACC: GrowthRate;
  LCK: GrowthRate;
}

export interface Card {
  id: string;
  name: string;
  type: CardType;
  attribute: Attribute;
  rarity?: string;
  description?: string;
}

export interface SummonCard extends Card {
  type: CardType.SUMMON;
  species: Species;
  role: Role;
  level: number;
  baseStats: Stats;
  growthRates: GrowthRates;
  equippedWeapon?: string;
}

export interface ActionCard extends Card {
  type: CardType.ACTION;
  speed: 'ACTION' | 'REACTION' | 'COUNTER';
  effect: string;
}

export interface Position {
  x: number;
  y: number;
}

export interface SummonUnit {
  card: SummonCard;
  position: Position;
  currentHP: number;
  maxHP: number;
  movement: number;
  owner: 'PLAYER_A' | 'PLAYER_B';
  calculatedStats: Stats;
}

export interface GameState {
  currentTurn: 'PLAYER_A' | 'PLAYER_B';
  turnNumber: number;
  phase: TurnPhase;
  playerA: PlayerState;
  playerB: PlayerState;
  board: (SummonUnit | null)[][];
}

export interface PlayerState {
  victoryPoints: number;
  mainDeck: Card[];
  hand: Card[];
  discardPile: Card[];
  rechargePile: Card[];
  advanceDeck: Card[];
  summons: SummonUnit[];
  hasPlayedSummonThisTurn: boolean;
}
