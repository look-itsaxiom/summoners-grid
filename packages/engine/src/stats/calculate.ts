/**
 * Stat calculation system
 *
 * Implements the full stat calculation pipeline from the GDD:
 * FinalStat = (BaseStat + Floor(Level × GrowthRate)) × RoleModifier + EquipmentBonus + OtherBonuses
 */

import type { GrowthRates, GrowthRateSymbol, Stats } from '../state/base';
import type { EquipmentCard, RoleDefinition } from '../state/cards';
import type { EquipmentLoadout } from '../state/units';
import { calculateGrowthGain } from './growth-rates';

/** All stat keys for iteration */
export const STAT_KEYS: (keyof Stats)[] = [
  'STR', 'END', 'DEF', 'INT', 'SPI', 'MDF', 'SPD', 'ACC', 'LCK'
];

/**
 * Create a Stats object with all zeros.
 */
export function createEmptyStats(): Stats {
  return {
    STR: 0,
    END: 0,
    DEF: 0,
    INT: 0,
    SPI: 0,
    MDF: 0,
    SPD: 0,
    ACC: 0,
    LCK: 0,
  };
}

/**
 * Calculate base stats at a given level (before role/equipment modifiers).
 * Formula: BaseStat + Floor(Level × GrowthRate)
 */
export function calculateBaseStatsAtLevel(
  baseStats: Stats,
  growthRates: GrowthRates,
  level: number
): Stats {
  const result = createEmptyStats();

  for (const key of STAT_KEYS) {
    const base = baseStats[key];
    const growth = calculateGrowthGain(level, growthRates[key]);
    result[key] = base + growth;
  }

  return result;
}

/**
 * Apply role stat modifiers (multiplicative).
 * Role modifiers are applied after base + growth calculation.
 */
export function applyRoleModifiers(
  stats: Stats,
  role: RoleDefinition
): Stats {
  const result = { ...stats };

  for (const key of STAT_KEYS) {
    const modifier = role.statModifiers[key];
    if (modifier !== undefined) {
      result[key] = Math.floor(result[key] * modifier);
    }
  }

  return result;
}

/**
 * Calculate total equipment bonuses from a loadout.
 */
export function calculateEquipmentBonuses(equipment: EquipmentLoadout): Partial<Stats> {
  const bonuses: Partial<Stats> = {};

  const items: (EquipmentCard | null)[] = [
    equipment.weapon,
    equipment.offhand,
    equipment.armor,
    equipment.accessory,
  ];

  for (const item of items) {
    if (item && item.statBonuses) {
      for (const key of STAT_KEYS) {
        const bonus = item.statBonuses[key];
        if (bonus !== undefined) {
          bonuses[key] = (bonuses[key] ?? 0) + bonus;
        }
      }
    }
  }

  return bonuses;
}

/**
 * Apply additive bonuses to stats.
 */
export function applyBonuses(
  stats: Stats,
  bonuses: Partial<Stats>
): Stats {
  const result = { ...stats };

  for (const key of STAT_KEYS) {
    const bonus = bonuses[key];
    if (bonus !== undefined) {
      result[key] += bonus;
    }
  }

  return result;
}

/**
 * Input for full stat calculation.
 */
export interface StatCalculationInput {
  baseStats: Stats;
  growthRates: GrowthRates;
  level: number;
  role: RoleDefinition;
  equipment: EquipmentLoadout;
  otherBonuses?: Partial<Stats>;
}

/**
 * Calculate final stats using the full pipeline.
 *
 * Formula from GDD:
 * FinalStat = (BaseStat + Floor(Level × GrowthRate)) × RoleModifier + EquipmentBonus + OtherBonuses
 */
export function calculateFinalStats(input: StatCalculationInput): Stats {
  // Step 1: Base stats + growth
  const baseWithGrowth = calculateBaseStatsAtLevel(
    input.baseStats,
    input.growthRates,
    input.level
  );

  // Step 2: Apply role modifiers (multiplicative)
  const withRoleModifiers = applyRoleModifiers(baseWithGrowth, input.role);

  // Step 3: Add equipment bonuses
  const equipmentBonuses = calculateEquipmentBonuses(input.equipment);
  const withEquipment = applyBonuses(withRoleModifiers, equipmentBonuses);

  // Step 4: Add other bonuses (status effects, auras, etc.)
  if (input.otherBonuses) {
    return applyBonuses(withEquipment, input.otherBonuses);
  }

  return withEquipment;
}

/**
 * Get a single stat value after all calculations.
 */
export function getCalculatedStat(
  input: StatCalculationInput,
  stat: keyof Stats
): number {
  return calculateFinalStats(input)[stat];
}
