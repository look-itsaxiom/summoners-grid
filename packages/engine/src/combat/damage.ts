/**
 * Damage Calculation Module
 *
 * Implements damage formulas from the GDD:
 * - Physical (Melee): STR × (1 + WeaponPower/100) × (STR/TargetDEF) × CritMultiplier
 * - Physical (Bow): ((STR + ACC)/2) × (1 + WeaponPower/100) × (STR/TargetDEF) × CritMultiplier
 * - Magical: INT × (1 + BasePower/100) × (INT/TargetMDF) × CritMultiplier
 */

import type { Stats, Attribute } from '../state/base';
import { CRIT_MULTIPLIER } from '../stats/derived';

/**
 * Type of damage being dealt.
 */
export type DamageType = 'physical_melee' | 'physical_bow' | 'magical';

/**
 * Input for damage calculation.
 */
export interface DamageInput {
  /** Attacker's calculated stats */
  attackerStats: Stats;
  /** Target's calculated stats */
  targetStats: Stats;
  /** Weapon/spell power (percentage bonus) */
  power: number;
  /** Type of damage */
  damageType: DamageType;
  /** Is this a critical hit? */
  isCritical: boolean;
  /** Elemental attribute of the damage */
  attribute?: Attribute;
}

/**
 * Result of damage calculation.
 */
export interface DamageResult {
  /** Raw damage before any modifiers */
  rawDamage: number;
  /** Final damage after all calculations */
  finalDamage: number;
  /** Was this a critical hit? */
  isCritical: boolean;
  /** Damage type */
  damageType: DamageType;
  /** Elemental attribute */
  attribute: Attribute;
}

/**
 * Calculate physical melee damage.
 * Formula: STR × (1 + WeaponPower/100) × (STR/TargetDEF) × CritMultiplier
 */
export function calculatePhysicalMeleeDamage(
  str: number,
  weaponPower: number,
  targetDef: number,
  isCritical: boolean
): number {
  // Prevent division by zero
  const effectiveDef = Math.max(1, targetDef);

  const baseDamage = str * (1 + weaponPower / 100);
  const defenseRatio = str / effectiveDef;
  const damage = baseDamage * defenseRatio;

  const critMultiplier = isCritical ? CRIT_MULTIPLIER : 1;

  return Math.floor(damage * critMultiplier);
}

/**
 * Calculate physical bow damage.
 * Formula: ((STR + ACC)/2) × (1 + WeaponPower/100) × (STR/TargetDEF) × CritMultiplier
 *
 * Note: Bow damage uses average of STR and ACC for base, but still uses STR/DEF ratio.
 */
export function calculatePhysicalBowDamage(
  str: number,
  acc: number,
  weaponPower: number,
  targetDef: number,
  isCritical: boolean
): number {
  // Prevent division by zero
  const effectiveDef = Math.max(1, targetDef);

  const baseStatAvg = (str + acc) / 2;
  const baseDamage = baseStatAvg * (1 + weaponPower / 100);
  const defenseRatio = str / effectiveDef;
  const damage = baseDamage * defenseRatio;

  const critMultiplier = isCritical ? CRIT_MULTIPLIER : 1;

  return Math.floor(damage * critMultiplier);
}

/**
 * Calculate magical damage.
 * Formula: INT × (1 + BasePower/100) × (INT/TargetMDF) × CritMultiplier
 */
export function calculateMagicalDamage(
  int: number,
  basePower: number,
  targetMdf: number,
  isCritical: boolean
): number {
  // Prevent division by zero
  const effectiveMdf = Math.max(1, targetMdf);

  const baseDamage = int * (1 + basePower / 100);
  const defenseRatio = int / effectiveMdf;
  const damage = baseDamage * defenseRatio;

  const critMultiplier = isCritical ? CRIT_MULTIPLIER : 1;

  return Math.floor(damage * critMultiplier);
}

/**
 * Calculate damage based on input parameters.
 * This is the main entry point for damage calculations.
 */
export function calculateDamage(input: DamageInput): DamageResult {
  const { attackerStats, targetStats, power, damageType, isCritical, attribute } = input;

  let finalDamage: number;
  let rawDamage: number;

  switch (damageType) {
    case 'physical_melee':
      rawDamage = calculatePhysicalMeleeDamage(
        attackerStats.STR,
        power,
        targetStats.DEF,
        false
      );
      finalDamage = calculatePhysicalMeleeDamage(
        attackerStats.STR,
        power,
        targetStats.DEF,
        isCritical
      );
      break;

    case 'physical_bow':
      rawDamage = calculatePhysicalBowDamage(
        attackerStats.STR,
        attackerStats.ACC,
        power,
        targetStats.DEF,
        false
      );
      finalDamage = calculatePhysicalBowDamage(
        attackerStats.STR,
        attackerStats.ACC,
        power,
        targetStats.DEF,
        isCritical
      );
      break;

    case 'magical':
      rawDamage = calculateMagicalDamage(
        attackerStats.INT,
        power,
        targetStats.MDF,
        false
      );
      finalDamage = calculateMagicalDamage(
        attackerStats.INT,
        power,
        targetStats.MDF,
        isCritical
      );
      break;

    default:
      rawDamage = 0;
      finalDamage = 0;
  }

  return {
    rawDamage,
    finalDamage,
    isCritical,
    damageType,
    attribute: attribute ?? 'neutral',
  };
}

/**
 * Apply damage to a target's HP.
 * Returns the new HP value (minimum 0).
 */
export function applyDamage(currentHp: number, damage: number): number {
  return Math.max(0, currentHp - damage);
}

/**
 * Check if a unit is defeated (HP <= 0).
 */
export function isDefeated(currentHp: number): boolean {
  return currentHp <= 0;
}

/**
 * Elemental advantage multipliers.
 * Fire > Wind > Earth > Water > Fire
 * Light <> Dark (mutual advantage)
 */
export const ELEMENTAL_ADVANTAGE: Record<Attribute, Attribute[]> = {
  fire: ['wind'],
  wind: ['earth'],
  earth: ['water'],
  water: ['fire'],
  light: ['dark'],
  dark: ['light'],
  neutral: [],
};

export const ELEMENTAL_RESISTANCE: Record<Attribute, Attribute[]> = {
  fire: ['water'],
  wind: ['fire'],
  earth: ['wind'],
  water: ['earth'],
  light: ['light'],  // Light attacking Light is resisted
  dark: ['dark'],    // Dark attacking Dark is resisted
  neutral: [],
};

/** Damage multiplier for elemental advantage */
export const ELEMENTAL_ADVANTAGE_MULTIPLIER = 1.25;

/** Damage multiplier for elemental resistance */
export const ELEMENTAL_RESISTANCE_MULTIPLIER = 0.75;

/**
 * Get elemental damage multiplier.
 */
export function getElementalMultiplier(
  attackAttribute: Attribute,
  targetAttribute: Attribute
): number {
  if (ELEMENTAL_ADVANTAGE[attackAttribute]?.includes(targetAttribute)) {
    return ELEMENTAL_ADVANTAGE_MULTIPLIER;
  }
  if (ELEMENTAL_RESISTANCE[attackAttribute]?.includes(targetAttribute)) {
    return ELEMENTAL_RESISTANCE_MULTIPLIER;
  }
  return 1.0;
}

/**
 * Apply elemental modifier to damage.
 */
export function applyElementalModifier(
  damage: number,
  attackAttribute: Attribute,
  targetAttribute: Attribute
): number {
  const multiplier = getElementalMultiplier(attackAttribute, targetAttribute);
  return Math.floor(damage * multiplier);
}
