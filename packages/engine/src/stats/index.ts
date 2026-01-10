/**
 * Stats module - stat calculation system
 */

// Growth rates
export {
  calculateGrowthGain,
  calculateLevelUpGain,
  getGrowthRate,
  GROWTH_RATE_VALUES,
  MAX_LEVEL,
  STARTING_LEVEL,
} from './growth-rates';

// Stat calculation
export {
  applyBonuses,
  applyRoleModifiers,
  calculateBaseStatsAtLevel,
  calculateEquipmentBonuses,
  calculateFinalStats,
  createEmptyStats,
  getCalculatedStat,
  STAT_KEYS,
  type StatCalculationInput,
} from './calculate';

// Derived stats
export {
  calculateAbilityToHit,
  calculateBasicAttackToHit,
  calculateCritChance,
  calculateDerivedStats,
  calculateMaxHp,
  calculateMovementSpeed,
  CRIT_MULTIPLIER,
  rollCrit,
  rollHit,
  type DerivedStats,
} from './derived';

// Unit stat management
export {
  applyDamage,
  applyHealing,
  changeUnitEquipment,
  changeUnitRole,
  levelUpUnit,
  recalculateUnitStats,
  updateUnitStats,
} from './unit';
