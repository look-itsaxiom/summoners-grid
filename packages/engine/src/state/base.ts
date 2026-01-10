/**
 * Base types used throughout the engine
 */

/** Branded type for entity IDs */
export type EntityId = string & { readonly __brand: 'EntityId' };

/** Branded type for unit IDs */
export type UnitId = string & { readonly __brand: 'UnitId' };

/** Branded type for card IDs */
export type CardId = string & { readonly __brand: 'CardId' };

/** Branded type for quest IDs */
export type QuestId = string & { readonly __brand: 'QuestId' };

/** Grid position on the 12x14 board */
export interface GridPosition {
  x: number; // 0-11
  y: number; // 0-13
}

/** Player index (0 or 1) */
export type PlayerIndex = 0 | 1;

/** Core stats for summons */
export interface Stats {
  STR: number; // Strength - physical attack damage
  END: number; // Endurance - HP calculation
  DEF: number; // Defense - physical damage reduction
  INT: number; // Intelligence - magical attack damage
  SPI: number; // Spirit - healing effectiveness
  MDF: number; // Magic Defense - magical damage reduction
  SPD: number; // Speed - movement calculation
  ACC: number; // Accuracy - hit chance bonus
  LCK: number; // Luck - critical hit chance
}

/** Growth rate symbols as defined in the GDD */
export type GrowthRateSymbol = '--' | '-' | '_' | '+' | '++' | '*';

/** Growth rates per stat */
export type GrowthRates = Record<keyof Stats, GrowthRateSymbol>;

/** Elemental attributes */
export type Attribute =
  | 'fire'
  | 'water'
  | 'earth'
  | 'wind'
  | 'light'
  | 'dark'
  | 'neutral';

/** Card rarity tiers */
export type Rarity = 'common' | 'uncommon' | 'rare' | 'legend' | 'myth';

/** Effect/card speed levels */
export type Speed = 'action' | 'reaction' | 'counter';

/** Card destination after resolution */
export type CardDestination = 'discard' | 'recharge' | 'removed';
