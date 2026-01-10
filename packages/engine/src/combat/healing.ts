/**
 * Healing Calculation Module
 *
 * Implements healing formula from the GDD:
 * HealAmount = SPI × (1 + BasePower/100) × CritMultiplier
 *
 * Healing can critically heal for increased effectiveness.
 */

import type { Stats } from '../state/base';
import { CRIT_MULTIPLIER } from '../stats/derived';

/**
 * Input for healing calculation.
 */
export interface HealInput {
  /** Healer's calculated stats */
  healerStats: Stats;
  /** Base power of the heal ability/spell */
  basePower: number;
  /** Is this a critical heal? */
  isCritical: boolean;
}

/**
 * Result of healing calculation.
 */
export interface HealResult {
  /** Raw healing before critical */
  rawHealing: number;
  /** Final healing amount */
  finalHealing: number;
  /** Was this a critical heal? */
  isCritical: boolean;
}

/**
 * Calculate healing amount.
 * Formula: SPI × (1 + BasePower/100) × CritMultiplier
 */
export function calculateHealing(
  spi: number,
  basePower: number,
  isCritical: boolean
): number {
  const baseHealing = spi * (1 + basePower / 100);
  const critMultiplier = isCritical ? CRIT_MULTIPLIER : 1;

  return Math.floor(baseHealing * critMultiplier);
}

/**
 * Calculate healing based on input parameters.
 * This is the main entry point for healing calculations.
 */
export function calculateHeal(input: HealInput): HealResult {
  const { healerStats, basePower, isCritical } = input;

  const rawHealing = calculateHealing(healerStats.SPI, basePower, false);
  const finalHealing = calculateHealing(healerStats.SPI, basePower, isCritical);

  return {
    rawHealing,
    finalHealing,
    isCritical,
  };
}

/**
 * Apply healing to a target's HP.
 * Returns the new HP value (capped at maxHp).
 */
export function applyHealing(
  currentHp: number,
  maxHp: number,
  healAmount: number
): number {
  return Math.min(maxHp, currentHp + healAmount);
}

/**
 * Calculate effective healing (accounting for overheal).
 * Returns the actual HP restored.
 */
export function calculateEffectiveHealing(
  currentHp: number,
  maxHp: number,
  healAmount: number
): number {
  const newHp = applyHealing(currentHp, maxHp, healAmount);
  return newHp - currentHp;
}

/**
 * Check if target needs healing.
 */
export function needsHealing(currentHp: number, maxHp: number): boolean {
  return currentHp < maxHp;
}

/**
 * Calculate missing HP.
 */
export function getMissingHp(currentHp: number, maxHp: number): number {
  return Math.max(0, maxHp - currentHp);
}

/**
 * Calculate HP percentage.
 */
export function getHpPercentage(currentHp: number, maxHp: number): number {
  if (maxHp <= 0) return 0;
  return (currentHp / maxHp) * 100;
}
