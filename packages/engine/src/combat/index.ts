/**
 * Combat System Module
 *
 * Exports damage, healing, and combat resolution functions.
 */

// Damage calculations
// Note: applyDamage is not re-exported - use stats/unit.applyDamage for SummonUnit operations
export {
  type DamageType,
  type DamageInput,
  type DamageResult,
  calculatePhysicalMeleeDamage,
  calculatePhysicalBowDamage,
  calculateMagicalDamage,
  calculateDamage,
  isDefeated,
  ELEMENTAL_ADVANTAGE,
  ELEMENTAL_RESISTANCE,
  ELEMENTAL_ADVANTAGE_MULTIPLIER,
  ELEMENTAL_RESISTANCE_MULTIPLIER,
  getElementalMultiplier,
  applyElementalModifier,
} from './damage';

// Healing calculations
// Note: applyHealing is not re-exported - use stats/unit.applyHealing for SummonUnit operations
export {
  type HealInput,
  type HealResult,
  calculateHealing,
  calculateHeal,
  calculateEffectiveHealing,
  needsHealing,
  getMissingHp,
  getHpPercentage,
} from './healing';

// Combat resolution
export {
  type HitCheckResult,
  type CritCheckResult,
  type AttackResult,
  type AttackInput,
  type HealResolutionResult,
  type HealInput as HealResolutionInput,
  performHitCheck,
  performCritCheck,
  calculateVpForDefeat,
  resolveAttack,
  resolveHeal,
  isInRange,
  getUnitsInRange,
  getEnemiesInRange,
  getAlliesInRange,
} from './resolution';
