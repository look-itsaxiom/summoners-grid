/**
 * Combat Resolution System
 *
 * Ties together hit checks, critical hits, damage calculations,
 * and applies them to resolve attacks and abilities.
 */

import type { Stats, Attribute, EntityId } from '../state/base';
import type { SummonUnit } from '../state/units';
import {
  calculateBasicAttackToHit,
  calculateAbilityToHit,
  calculateCritChance,
  rollHit,
  rollCrit,
} from '../stats/derived';
import {
  calculateDamage,
  applyDamage,
  isDefeated,
  applyElementalModifier,
  type DamageType,
  type DamageResult,
} from './damage';
import {
  calculateHeal,
  applyHealing,
  calculateEffectiveHealing,
  type HealResult,
} from './healing';

/**
 * Result of a combat hit check.
 */
export interface HitCheckResult {
  /** Did the attack hit? */
  hit: boolean;
  /** The to-hit chance that was rolled against */
  toHitChance: number;
  /** The roll value (0-100) */
  roll: number;
}

/**
 * Result of a critical check.
 */
export interface CritCheckResult {
  /** Was it a critical hit? */
  critical: boolean;
  /** The crit chance that was rolled against */
  critChance: number;
  /** The roll value (0-100) */
  roll: number;
}

/**
 * Full result of an attack resolution.
 */
export interface AttackResult {
  /** Attacker's entity ID */
  attackerId: EntityId;
  /** Target's entity ID */
  targetId: EntityId;
  /** Hit check result */
  hitCheck: HitCheckResult;
  /** Crit check result (only if hit) */
  critCheck: CritCheckResult | null;
  /** Damage result (only if hit) */
  damageResult: DamageResult | null;
  /** Final damage after elemental modifiers */
  finalDamage: number;
  /** Target's new HP after damage */
  targetNewHp: number;
  /** Was the target defeated? */
  targetDefeated: boolean;
  /** VP awarded for defeat (0 if not defeated) */
  vpAwarded: number;
}

/**
 * Input for resolving an attack.
 */
export interface AttackInput {
  /** Attacker unit */
  attacker: SummonUnit;
  /** Target unit */
  target: SummonUnit;
  /** Type of damage */
  damageType: DamageType;
  /** Weapon/ability power */
  power: number;
  /** Elemental attribute of the attack */
  attribute: Attribute;
  /** Custom accuracy (for abilities), undefined uses basic attack */
  abilityAccuracy?: number;
  /** Random number generator (returns 0-100), defaults to Math.random */
  rng?: () => number;
}

/**
 * Full result of a heal resolution.
 */
export interface HealResolutionResult {
  /** Healer's entity ID */
  healerId: EntityId;
  /** Target's entity ID */
  targetId: EntityId;
  /** Crit check result */
  critCheck: CritCheckResult;
  /** Heal calculation result */
  healResult: HealResult;
  /** Effective healing (accounting for overheal) */
  effectiveHealing: number;
  /** Target's new HP after healing */
  targetNewHp: number;
}

/**
 * Input for resolving a heal.
 */
export interface HealInput {
  /** Healer unit */
  healer: SummonUnit;
  /** Target unit */
  target: SummonUnit;
  /** Base power of the heal */
  basePower: number;
  /** Random number generator (returns 0-100), defaults to Math.random */
  rng?: () => number;
}

/**
 * Default RNG that returns 0-100.
 */
function defaultRng(): number {
  return Math.random() * 100;
}

/**
 * Perform a hit check for an attack.
 */
export function performHitCheck(
  attackerStats: Stats,
  abilityAccuracy: number | undefined,
  rng: () => number = defaultRng
): HitCheckResult {
  const toHitChance =
    abilityAccuracy !== undefined
      ? calculateAbilityToHit(abilityAccuracy, attackerStats.ACC)
      : calculateBasicAttackToHit(attackerStats.ACC);

  const roll = rng();
  const hit = rollHit(roll, toHitChance);

  return { hit, toHitChance, roll };
}

/**
 * Perform a critical hit check.
 */
export function performCritCheck(
  attackerStats: Stats,
  rng: () => number = defaultRng
): CritCheckResult {
  const critChance = calculateCritChance(attackerStats.LCK);
  const roll = rng();
  const critical = rollCrit(roll, critChance);

  return { critical, critChance, roll };
}

/**
 * Calculate VP awarded for defeating a unit.
 * Tier 1 = 1 VP, Tier 2+ = 2 VP
 */
export function calculateVpForDefeat(unit: SummonUnit): number {
  return unit.role.tier >= 2 ? 2 : 1;
}

/**
 * Resolve a full attack from one unit to another.
 *
 * This handles:
 * 1. Hit check
 * 2. Critical hit check (if hit)
 * 3. Damage calculation (if hit)
 * 4. Elemental modifier application
 * 5. Damage application to target
 * 6. Defeat check and VP calculation
 *
 * @returns Full attack result with all intermediate values
 */
export function resolveAttack(input: AttackInput): AttackResult {
  const { attacker, target, damageType, power, attribute, abilityAccuracy, rng = defaultRng } = input;

  // Step 1: Hit check
  const hitCheck = performHitCheck(attacker.calculatedStats, abilityAccuracy, rng);

  // If miss, return early with miss result
  if (!hitCheck.hit) {
    return {
      attackerId: attacker.entityId,
      targetId: target.entityId,
      hitCheck,
      critCheck: null,
      damageResult: null,
      finalDamage: 0,
      targetNewHp: target.currentHp,
      targetDefeated: false,
      vpAwarded: 0,
    };
  }

  // Step 2: Critical check
  const critCheck = performCritCheck(attacker.calculatedStats, rng);

  // Step 3: Calculate damage
  const damageResult = calculateDamage({
    attackerStats: attacker.calculatedStats,
    targetStats: target.calculatedStats,
    power,
    damageType,
    isCritical: critCheck.critical,
    attribute,
  });

  // Step 4: Apply elemental modifier
  const elementalDamage = applyElementalModifier(
    damageResult.finalDamage,
    attribute,
    target.summon.attribute
  );

  // Step 5: Apply damage to target
  const targetNewHp = applyDamage(target.currentHp, elementalDamage);

  // Step 6: Check defeat
  const targetDefeated = isDefeated(targetNewHp);
  const vpAwarded = targetDefeated ? calculateVpForDefeat(target) : 0;

  return {
    attackerId: attacker.entityId,
    targetId: target.entityId,
    hitCheck,
    critCheck,
    damageResult,
    finalDamage: elementalDamage,
    targetNewHp,
    targetDefeated,
    vpAwarded,
  };
}

/**
 * Resolve a heal from one unit to another.
 *
 * This handles:
 * 1. Critical heal check
 * 2. Heal calculation
 * 3. Heal application (capped at max HP)
 * 4. Effective healing calculation
 *
 * @returns Full heal result with all intermediate values
 */
export function resolveHeal(input: HealInput): HealResolutionResult {
  const { healer, target, basePower, rng = defaultRng } = input;

  // Step 1: Critical heal check
  const critCheck = performCritCheck(healer.calculatedStats, rng);

  // Step 2: Calculate healing
  const healResult = calculateHeal({
    healerStats: healer.calculatedStats,
    basePower,
    isCritical: critCheck.critical,
  });

  // Step 3: Apply healing
  const targetNewHp = applyHealing(target.currentHp, target.maxHp, healResult.finalHealing);

  // Step 4: Calculate effective healing
  const effectiveHealing = calculateEffectiveHealing(
    target.currentHp,
    target.maxHp,
    healResult.finalHealing
  );

  return {
    healerId: healer.entityId,
    targetId: target.entityId,
    critCheck,
    healResult,
    effectiveHealing,
    targetNewHp,
  };
}

/**
 * Check if a target is in range for an attack.
 */
export function isInRange(
  attackerPos: { x: number; y: number },
  targetPos: { x: number; y: number },
  range: number
): boolean {
  const distance =
    Math.abs(targetPos.x - attackerPos.x) + Math.abs(targetPos.y - attackerPos.y);
  return distance <= range;
}

/**
 * Get all units in range from a position.
 */
export function getUnitsInRange(
  position: { x: number; y: number },
  units: Map<string, SummonUnit>,
  range: number,
  excludeId?: EntityId
): SummonUnit[] {
  const result: SummonUnit[] = [];

  for (const unit of units.values()) {
    if (excludeId && unit.entityId === excludeId) continue;
    if (isInRange(position, unit.position, range)) {
      result.push(unit);
    }
  }

  return result;
}

/**
 * Get enemy units in range.
 */
export function getEnemiesInRange(
  attacker: SummonUnit,
  units: Map<string, SummonUnit>,
  range: number
): SummonUnit[] {
  return getUnitsInRange(attacker.position, units, range, attacker.entityId).filter(
    unit => unit.owner !== attacker.owner
  );
}

/**
 * Get allied units in range (excluding self).
 */
export function getAlliesInRange(
  healer: SummonUnit,
  units: Map<string, SummonUnit>,
  range: number
): SummonUnit[] {
  return getUnitsInRange(healer.position, units, range, healer.entityId).filter(
    unit => unit.owner === healer.owner
  );
}
