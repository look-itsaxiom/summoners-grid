/**
 * Derived stat calculations
 *
 * These are stats computed from core stats using formulas from the GDD.
 */

import type { Stats } from '../state/base';

/**
 * Calculate maximum HP from END stat.
 * Formula: 50 + Floor(END^1.5)
 */
export function calculateMaxHp(endurance: number): number {
  return 50 + Math.floor(Math.pow(endurance, 1.5));
}

/**
 * Calculate movement speed from SPD stat.
 * Formula: 2 + Floor((SPD - 10) / 5)
 *
 * Minimum movement speed is 1 (even with very low SPD).
 */
export function calculateMovementSpeed(speed: number): number {
  const calculated = 2 + Math.floor((speed - 10) / 5);
  return Math.max(1, calculated);
}

/**
 * Calculate basic attack to-hit percentage from ACC stat.
 * Formula: 90 + (ACC / 10)
 *
 * Returns a percentage (e.g., 95 means 95% chance to hit).
 * Capped at 100%.
 */
export function calculateBasicAttackToHit(accuracy: number): number {
  const calculated = 90 + accuracy / 10;
  return Math.min(100, calculated);
}

/**
 * Calculate ability to-hit percentage from base accuracy and ACC stat.
 * Formula: AbilityAccuracy + (ACC / 10)
 *
 * Returns a percentage. Capped at 100%.
 */
export function calculateAbilityToHit(
  abilityAccuracy: number,
  accuracy: number
): number {
  const calculated = abilityAccuracy + accuracy / 10;
  return Math.min(100, calculated);
}

/**
 * Calculate critical hit chance from LCK stat.
 * Formula: Floor((LCK × 0.3375) + 1.65)
 *
 * Returns a percentage (e.g., 5 means 5% crit chance).
 */
export function calculateCritChance(luck: number): number {
  return Math.floor(luck * 0.3375 + 1.65);
}

/** Critical hit damage multiplier */
export const CRIT_MULTIPLIER = 1.5;

/**
 * All derived stats for a unit.
 */
export interface DerivedStats {
  maxHp: number;
  movementSpeed: number;
  basicAttackToHit: number;
  critChance: number;
}

/**
 * Calculate all derived stats from core stats.
 */
export function calculateDerivedStats(stats: Stats): DerivedStats {
  return {
    maxHp: calculateMaxHp(stats.END),
    movementSpeed: calculateMovementSpeed(stats.SPD),
    basicAttackToHit: calculateBasicAttackToHit(stats.ACC),
    critChance: calculateCritChance(stats.LCK),
  };
}

/**
 * Check if a roll (0-100) results in a hit.
 */
export function rollHit(roll: number, toHitChance: number): boolean {
  return roll <= toHitChance;
}

/**
 * Check if a roll (0-100) results in a critical hit.
 */
export function rollCrit(roll: number, critChance: number): boolean {
  return roll <= critChance;
}
