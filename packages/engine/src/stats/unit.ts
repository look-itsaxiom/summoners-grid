/**
 * Unit stat management
 *
 * Functions for recalculating and updating SummonUnit stats.
 */

import type { Stats } from '../state/base';
import type { SummonUnit } from '../state/units';
import { calculateFinalStats, type StatCalculationInput } from './calculate';
import { calculateMaxHp } from './derived';

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
 */
export function levelUpUnit(unit: SummonUnit, levelsGained: number = 1): SummonUnit {
  const newLevel = unit.level + levelsGained;
  const oldMaxHp = unit.maxHp;

  // Create unit at new level
  const leveledUnit: SummonUnit = {
    ...unit,
    level: newLevel,
  };

  // Recalculate stats at new level
  const { calculatedStats, maxHp: newMaxHp } = recalculateUnitStats(leveledUnit);

  // Apply HP damage retention rule
  const hpIncrease = newMaxHp - oldMaxHp;
  const newCurrentHp = unit.currentHp + hpIncrease;

  return {
    ...leveledUnit,
    calculatedStats,
    maxHp: newMaxHp,
    currentHp: newCurrentHp,
  };
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
  const oldMaxHp = unit.maxHp;
  const hpPercentage = unit.currentHp / oldMaxHp;

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
    currentHp: Math.max(1, newCurrentHp), // Ensure at least 1 HP
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
  const oldMaxHp = unit.maxHp;
  const hpPercentage = unit.currentHp / oldMaxHp;

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
    currentHp: Math.max(1, newCurrentHp),
  };
}

/**
 * Apply damage to a unit.
 * Returns null if the unit is defeated (HP <= 0).
 */
export function applyDamage(
  unit: SummonUnit,
  damage: number
): SummonUnit | null {
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
 */
export function applyHealing(unit: SummonUnit, healing: number): SummonUnit {
  const newHp = Math.min(unit.currentHp + healing, unit.maxHp);

  return {
    ...unit,
    currentHp: newHp,
  };
}
