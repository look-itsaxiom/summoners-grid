/**
 * Growth rate types as defined in GDD.md
 */
export enum GrowthRate {
  Minimal = 0.5,      // +1 every 2 levels
  Steady = 0.67,      // +2 every 3 levels
  Normal = 1.0,       // +1 every level
  Gradual = 1.33,     // +1 per level + 1 every 3 levels
  Accelerated = 1.5,  // +1 per level + 1 every 2 levels
  Exceptional = 2.0   // +2 every level
}

/**
 * Growth rate symbols for visual representation on cards
 */
export const GrowthRateSymbol = {
  [GrowthRate.Minimal]: '--',
  [GrowthRate.Steady]: '-',
  [GrowthRate.Normal]: '_',
  [GrowthRate.Gradual]: '+',
  [GrowthRate.Accelerated]: '++',
  [GrowthRate.Exceptional]: '*'
};

/**
 * Core stats as defined in GDD.md
 */
export interface BaseStats {
  STR: number;  // Strength: Physical attack damage
  END: number;  // Endurance: Health point calculation base
  DEF: number;  // Defense: Physical damage reduction
  INT: number;  // Intelligence: Magical attack damage
  SPI: number;  // Spirit: Healing effectiveness
  MDF: number;  // Magic Defense: Magical damage reduction
  SPD: number;  // Speed: Movement speed calculation
  ACC: number;  // Accuracy: Hit chance bonus
  LCK: number;  // Luck: Critical hit chance and random effects
}

/**
 * Growth rates for each stat
 */
export interface StatGrowthRates {
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

/**
 * Calculated/derived stats
 */
export interface CalculatedStats extends BaseStats {
  maxHP: number;      // 50 + Floor(END^1.5)
  currentHP: number;  // Tracks damage taken
  movement: number;   // 2 + Floor((SPD - 10) / 5)
  basicToHit: number; // 90 + (ACC / 10)
  critChance: number; // Floor((LCK × 0.3375) + 1.65)
}

/**
 * Complete summon data including stats
 */
export interface SummonData {
  baseStats: BaseStats;
  growthRates: StatGrowthRates;
}
