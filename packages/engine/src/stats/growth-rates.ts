/**
 * Growth rate utilities
 *
 * Growth rates determine how stats increase per level.
 * Each symbol corresponds to a specific rate per level.
 */

import type { GrowthRateSymbol } from '../state/base';

/**
 * Growth rate values per level for each symbol.
 * From GDD:
 * - Minimal (--): 0.5 per level
 * - Steady (-): 0.67 per level
 * - Normal (_): 1.0 per level
 * - Gradual (+): 1.33 per level
 * - Accelerated (++): 1.5 per level
 * - Exceptional (*): 2.0 per level
 */
export const GROWTH_RATE_VALUES: Record<GrowthRateSymbol, number> = {
  '--': 0.5,
  '-': 0.67,
  '_': 1.0,
  '+': 1.33,
  '++': 1.5,
  '*': 2.0,
};

/**
 * Get the numeric growth rate for a symbol.
 */
export function getGrowthRate(symbol: GrowthRateSymbol): number {
  return GROWTH_RATE_VALUES[symbol];
}

/**
 * Calculate stat gain from growth rate at a given level.
 * Formula: Floor(Level × GrowthRate)
 *
 * Note: This is the TOTAL gain from level 1, not per-level gain.
 * At level 1, gain is 0 (base stats only).
 * At level 5 (starting level), gain = Floor(5 × rate).
 */
export function calculateGrowthGain(
  level: number,
  growthRate: GrowthRateSymbol
): number {
  const rate = getGrowthRate(growthRate);
  return Math.floor(level * rate);
}

/**
 * Calculate stat gain between two levels.
 * Useful for level-up calculations.
 */
export function calculateLevelUpGain(
  fromLevel: number,
  toLevel: number,
  growthRate: GrowthRateSymbol
): number {
  return calculateGrowthGain(toLevel, growthRate) - calculateGrowthGain(fromLevel, growthRate);
}

/** Starting level for summons */
export const STARTING_LEVEL = 5;

/** Maximum level for summons */
export const MAX_LEVEL = 20;
