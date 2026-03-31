import {
  type BaseStats,
  type GrowthRateType,
  type RoleId,
  type SummonCard,
  type SummonUnit,
  GROWTH_RATE_VALUES,
  STAT_KEYS,
  CRIT_MULTIPLIER,
} from '../types';
import { getRoleDefinition } from '../data/roles';

/**
 * Calculate the stat gain from growth rate at a given level.
 * Growth rates define per-level gains:
 *   minimal:     +1 every 2 levels (0.5/level)
 *   steady:      +2 every 3 levels (0.67/level)
 *   normal:      +1 every level (1.0/level)
 *   gradual:     +1/level + 1 every 3 levels (1.33/level)
 *   accelerated: +1/level + 1 every 2 levels (1.5/level)
 *   exceptional: +2 every level (2.0/level)
 */
export function calculateGrowthGain(
  growthType: GrowthRateType,
  level: number,
  startLevel: number = 1
): number {
  const rate = GROWTH_RATE_VALUES[growthType];
  return Math.floor(level * rate) - Math.floor(startLevel * rate);
}

/**
 * Calculate the final stat for a summon at a given level.
 * Formula: (BaseStat + Floor(Level * GrowthRate)) * RoleModifier + EquipmentBonus
 */
export function calculateFinalStat(
  baseStat: number,
  growthType: GrowthRateType,
  level: number,
  roleModifier: number = 1,
  equipmentBonus: number = 0
): number {
  const growthGain = Math.floor(level * GROWTH_RATE_VALUES[growthType]);
  return Math.floor((baseStat + growthGain) * roleModifier) + equipmentBonus;
}

/**
 * Calculate all stats for a summon unit.
 */
export function calculateAllStats(
  card: SummonCard,
  level: number,
  roleId: RoleId
): BaseStats {
  const role = getRoleDefinition(roleId);
  const stats: Partial<BaseStats> = {};

  for (const key of STAT_KEYS) {
    const baseStat = card.baseStats[key];
    const growthType = card.growthRates[key];
    const roleModifier = role.statModifiers[key] ?? 1;

    // Equipment bonuses
    let equipBonus = 0;
    const equipment = card.equipment;
    if (equipment.weapon?.statBonuses[key]) equipBonus += equipment.weapon.statBonuses[key];
    if (equipment.offhand?.statBonuses[key]) equipBonus += equipment.offhand.statBonuses[key];
    if (equipment.armor?.statBonuses[key]) equipBonus += equipment.armor.statBonuses[key];
    if (equipment.accessory?.statBonuses[key]) equipBonus += equipment.accessory.statBonuses[key];

    stats[key] = calculateFinalStat(baseStat, growthType, level, roleModifier, equipBonus);
  }

  return stats as BaseStats;
}

/**
 * Calculate max HP from END stat.
 * Formula: 50 + Floor(END^1.5)
 */
export function calculateMaxHP(endStat: number): number {
  return 50 + Math.floor(Math.pow(endStat, 1.5));
}

/**
 * Calculate movement speed from SPD stat.
 * Formula: 2 + Floor((SPD - 10) / 5)
 */
export function calculateMovementSpeed(spdStat: number): number {
  return 2 + Math.floor((spdStat - 10) / 5);
}

/**
 * Calculate basic attack to-hit percentage.
 * Formula: BaseAccuracy + (ACC / 10)
 */
export function calculateToHit(baseAccuracy: number, accStat: number): number {
  return baseAccuracy + accStat / 10;
}

/**
 * Calculate critical hit chance percentage.
 * Formula: Floor((LCK * 0.3375) + 1.65)
 */
export function calculateCritChance(lckStat: number): number {
  return Math.floor(lckStat * 0.3375 + 1.65);
}

/**
 * Calculate physical melee damage.
 * Formula: STR * (1 + WeaponPower/100) * (STR/TargetDEF) * CritMult
 */
export function calculatePhysicalMeleeDamage(
  str: number,
  weaponPower: number,
  targetDef: number,
  isCrit: boolean = false
): number {
  const critMult = isCrit ? CRIT_MULTIPLIER : 1;
  return Math.floor(str * (1 + weaponPower / 100) * (str / targetDef) * critMult);
}

/**
 * Calculate physical bow/ranged damage.
 * Formula: ((STR+ACC)/2) * (1 + WeaponPower/100) * (STR/TargetDEF) * CritMult
 */
export function calculatePhysicalRangedDamage(
  str: number,
  acc: number,
  weaponPower: number,
  targetDef: number,
  isCrit: boolean = false
): number {
  const critMult = isCrit ? CRIT_MULTIPLIER : 1;
  return Math.floor(((str + acc) / 2) * (1 + weaponPower / 100) * (str / targetDef) * critMult);
}

/**
 * Calculate magical damage.
 * Formula: INT * (1 + BasePower/100) * (INT/TargetMDF) * CritMult
 */
export function calculateMagicalDamage(
  int: number,
  basePower: number,
  targetMdf: number,
  isCrit: boolean = false
): number {
  const critMult = isCrit ? CRIT_MULTIPLIER : 1;
  return Math.floor(int * (1 + basePower / 100) * (int / targetMdf) * critMult);
}

/**
 * Calculate healing amount.
 * Formula: SPI * (1 + BasePower/100) * CritMult
 */
export function calculateHealing(
  spi: number,
  basePower: number,
  isCrit: boolean = false
): number {
  const critMult = isCrit ? CRIT_MULTIPLIER : 1;
  return Math.floor(spi * (1 + basePower / 100) * critMult);
}

/**
 * Perform a hit check roll.
 * Returns true if the attack hits.
 */
export function rollHit(toHitPercent: number, roll?: number): { hit: boolean; roll: number } {
  const r = roll ?? Math.floor(Math.random() * 100) + 1;
  return { hit: r <= toHitPercent, roll: r };
}

/**
 * Perform a crit check roll.
 * Returns true if the attack crits.
 */
export function rollCrit(critChancePercent: number, roll?: number): { crit: boolean; roll: number } {
  const r = roll ?? Math.floor(Math.random() * 100) + 1;
  return { crit: r <= critChancePercent, roll: r };
}

/**
 * Apply level up to a summon unit.
 * HP Damage Retention: damage taken stays the same, not HP percentage.
 */
export function applyLevelUp(unit: SummonUnit, levelsGained: number = 1): SummonUnit {
  const newLevel = Math.min(unit.level + levelsGained, 20);
  if (newLevel === unit.level) return unit;

  const damageTaken = unit.maxHP - unit.currentHP;
  const newStats = calculateAllStats(unit.card, newLevel, unit.currentRole);
  const newMaxHP = calculateMaxHP(newStats.END);
  const newMovement = calculateMovementSpeed(newStats.SPD);

  return {
    ...unit,
    level: newLevel,
    calculatedStats: newStats,
    maxHP: newMaxHP,
    currentHP: newMaxHP - damageTaken,
    movementRemaining: newMovement,
  };
}

/**
 * Create a summon unit from a summon card (enters at level 5).
 */
export function createSummonUnit(
  card: SummonCard,
  owner: 'playerA' | 'playerB',
  position: { x: number; y: number },
  roleId: RoleId
): SummonUnit {
  const level = 5;
  const stats = calculateAllStats(card, level, roleId);
  const maxHP = calculateMaxHP(stats.END);
  const movement = calculateMovementSpeed(stats.SPD);

  return {
    instanceId: `${card.id}-${Date.now()}`,
    card,
    owner,
    position,
    level,
    currentHP: maxHP,
    maxHP,
    currentRole: roleId,
    calculatedStats: stats,
    movementRemaining: movement,
    hasAttacked: false,
    statusEffects: [],
    completedQuests: [],
    isNamedSummon: false,
  };
}
