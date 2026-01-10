/**
 * Unit stat management
 *
 * Functions for recalculating and updating SummonUnit stats.
 */

import type { Stats } from '../state/base';
import type { SummonUnit } from '../state/units';
import { calculateFinalStats, type StatCalculationInput } from './calculate';
import { calculateMaxHp } from './derived';
import { MAX_LEVEL } from './growth-rates';

/**
 * Recalculate all stats for a unit.
 * Returns the new calculatedStats and maxHp values.
 *
 * Note: This does NOT modify currentHp. The caller should handle
 * HP changes based on the game rules (e.g., damage retention on level up).
 */
export function recalculateUnitStats(unit: SummonUnit): {
  calculatedStats: Stats;
  maxHp: number;
} {
  const input: StatCalculationInput = {
    baseStats: unit.summon.baseStats,
    growthRates: unit.summon.growthRates,
    level: unit.level,
    role: unit.role,
    equipment: unit.equipment,
    // TODO: Add status effect bonuses when implemented
  };

  const calculatedStats = calculateFinalStats(input);
  const maxHp = calculateMaxHp(calculatedStats.END);

  return { calculatedStats, maxHp };
}

/**
 * Create a new unit with recalculated stats.
 * This is an immutable update - returns a new unit object.
 */
export function updateUnitStats(unit: SummonUnit): SummonUnit {
  const { calculatedStats, maxHp } = recalculateUnitStats(unit);

  return {
    ...unit,
    calculatedStats,
    maxHp,
  };
}

/**
 * Level up a unit and recalculate stats.
 *
 * HP Damage Retention rule from GDD:
 * When max HP increases, current damage taken remains the same.
 * This means currentHp increases by the same amount as maxHp.
 *
 * @throws Error if levelsGained would exceed MAX_LEVEL
 */
export function levelUpUnit(unit: SummonUnit, levelsGained: number = 1): SummonUnit {
  if (levelsGained < 0) {
    throw new Error('levelsGained must be non-negative');
  }

  const newLevel = unit.level + levelsGained;

  if (newLevel > MAX_LEVEL) {
    throw new Error(`Cannot exceed MAX_LEVEL (${MAX_LEVEL}). Current: ${unit.level}, Attempted gain: ${levelsGained}`);
  }

  const oldMaxHp = unit.maxHp;

  // Create unit at new level
  const leveledUnit: SummonUnit = {
    ...unit,
    level: newLevel,
  };

  // Recalculate stats at new level
  const { calculatedStats, maxHp: newMaxHp } = recalculateUnitStats(leveledUnit);

  // Apply HP damage retention rule
  // When maxHp increases, currentHp increases by the same amount
  // When maxHp decreases (rare), clamp to valid range
  const hpIncrease = newMaxHp - oldMaxHp;
  const newCurrentHp = Math.max(1, Math.min(unit.currentHp + hpIncrease, newMaxHp));

  return {
    ...leveledUnit,
    calculatedStats,
    maxHp: newMaxHp,
    currentHp: newCurrentHp,
  };
}

/**
 * Calculate HP percentage safely, handling edge case of zero maxHp.
 */
function safeHpPercentage(currentHp: number, maxHp: number): number {
  if (maxHp <= 0) {
    return 1; // Default to 100% if maxHp is invalid
  }
  return currentHp / maxHp;
}

/**
 * Update unit when role changes (advancement).
 * Recalculates all stats with the new role.
 *
 * Note: HP is maintained proportionally during role changes.
 */
export function changeUnitRole(
  unit: SummonUnit,
  newRole: typeof unit.role
): SummonUnit {
  const hpPercentage = safeHpPercentage(unit.currentHp, unit.maxHp);

  const updatedUnit: SummonUnit = {
    ...unit,
    role: newRole,
  };

  const { calculatedStats, maxHp: newMaxHp } = recalculateUnitStats(updatedUnit);
  const newCurrentHp = Math.floor(hpPercentage * newMaxHp);

  return {
    ...updatedUnit,
    calculatedStats,
    maxHp: newMaxHp,
    currentHp: Math.max(1, Math.min(newCurrentHp, newMaxHp)),
  };
}

/**
 * Update unit when equipment changes.
 * Recalculates all stats with the new equipment.
 *
 * Note: HP is maintained proportionally during equipment changes.
 */
export function changeUnitEquipment(
  unit: SummonUnit,
  newEquipment: typeof unit.equipment
): SummonUnit {
  const hpPercentage = safeHpPercentage(unit.currentHp, unit.maxHp);

  const updatedUnit: SummonUnit = {
    ...unit,
    equipment: newEquipment,
  };

  const { calculatedStats, maxHp: newMaxHp } = recalculateUnitStats(updatedUnit);
  const newCurrentHp = Math.floor(hpPercentage * newMaxHp);

  return {
    ...updatedUnit,
    calculatedStats,
    maxHp: newMaxHp,
    currentHp: Math.max(1, Math.min(newCurrentHp, newMaxHp)),
  };
}

/**
 * Apply damage to a unit.
 * Returns null if the unit is defeated (HP <= 0).
 *
 * @throws Error if damage is negative
 */
export function applyDamage(
  unit: SummonUnit,
  damage: number
): SummonUnit | null {
  if (damage < 0) {
    throw new Error('Damage must be non-negative. Use applyHealing for healing.');
  }

  const newHp = unit.currentHp - damage;

  if (newHp <= 0) {
    return null; // Unit is defeated
  }

  return {
    ...unit,
    currentHp: newHp,
  };
}

/**
 * Apply healing to a unit.
 * Healing cannot exceed maxHp.
 *
 * @throws Error if healing is negative
 */
export function applyHealing(unit: SummonUnit, healing: number): SummonUnit {
  if (healing < 0) {
    throw new Error('Healing must be non-negative. Use applyDamage for damage.');
  }

  const newHp = Math.min(unit.currentHp + healing, unit.maxHp);

  return {
    ...unit,
    currentHp: newHp,
  };
}
