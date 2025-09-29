import { Stats, GrowthRates, RoleCard, SummonUnit, EquipmentCard } from './interfaces';

/**
 * Calculates a single stat based on level, growth rate, and base value.
 * FinalStat = (BaseStat + Floor(Level × GrowthRate)) × RoleModifier + EquipmentBonus + OtherBonuses
 */
export function calculateFinalStat(
    baseStat: number,
    growthRate: number,
    level: number,
    roleModifier: number = 0,
    equipmentBonus: number = 0,
    otherBonuses: number = 0
): number {
    const fromLevel = Math.floor((level - 1) * growthRate);
    const withRole = Math.floor((baseStat + fromLevel) * (1 + roleModifier));
    return withRole + equipmentBonus + otherBonuses;
}

/**
 * Calculates all final stats for a summon unit.
 */
export function calculateAllFinalStats(
    baseStats: Stats,
    growthRates: GrowthRates,
    level: number,
    role: RoleCard,
    equipment: SummonUnit['equipment']
): Stats {
    const finalStats: Stats = { ...baseStats };
    for (const stat in finalStats) {
        const key = stat as keyof Stats;
        const roleMod = role.statModifiers[key] || 0;

        // Note: Equipment bonuses are not fully implemented in the card data yet.
        // This is a placeholder for where that logic would go.
        const equipBonus = 0;

        finalStats[key] = calculateFinalStat(
            baseStats[key],
            growthRates[key],
            level,
            roleMod,
            equipBonus
        );
    }
    return finalStats;
}


// =================================================================================================
// DERIVED PROPERTIES
// =================================================================================================

/**
 * Max HP: 50 + Floor(END^1.5)
 */
export function calculateMaxHp(finalEnd: number): number {
    return 50 + Math.floor(Math.pow(finalEnd, 1.5));
}

/**
 * Movement Speed: 2 + Floor((SPD - 10) / 5)
 */
export function calculateMovementSpeed(finalSpd: number): number {
    return 2 + Math.floor((finalSpd - 10) / 5);
}

/**
 * Critical Hit Chance: Floor((LCK × 0.3375) + 1.65)
 */
export function calculateCritChance(finalLck: number): number {
    const chance = Math.floor((finalLck * 0.3375) + 1.65);
    return Math.max(0, chance); // Chance can't be negative
}


// =================================================================================================
// COMBAT FORMULAS
// =================================================================================================

/**
 * To-Hit Chance: Base Accuracy + (Attacker ACC / 10)
 */
export function calculateHitChance(baseAccuracy: number, attackerAcc: number): number {
    return baseAccuracy + (attackerAcc / 10);
}

/**
 * Physical Damage (Melee): STR × (1 + WeaponPower/100) × (STR/TargetDEF) × CritMultiplier
 */
export function calculatePhysicalDamage(
    attackerStr: number,
    targetDef: number,
    weaponPower: number,
    critMultiplier: number = 1
): number {
    if (targetDef <= 0) targetDef = 1; // Avoid division by zero
    const damage = attackerStr * (1 + weaponPower / 100) * (attackerStr / targetDef) * critMultiplier;
    return Math.floor(damage);
}

/**
 * Physical Damage (Bow): ((STR + ACC)/2) × (1 + WeaponPower/100) × (STR/TargetDEF) × CritMultiplier
 */
export function calculateBowDamage(
    attackerStr: number,
    attackerAcc: number,
    targetDef: number,
    weaponPower: number,
    critMultiplier: number = 1
): number {
    if (targetDef <= 0) targetDef = 1;
    const effectiveStr = (attackerStr + attackerAcc) / 2;
    const damage = effectiveStr * (1 + weaponPower / 100) * (attackerStr / targetDef) * critMultiplier;
    return Math.floor(damage);
}

/**
 * Magical Damage: INT × (1 + BasePower/100) × (INT/TargetMDF) × CritMultiplier
 */
export function calculateMagicalDamage(
    attackerInt: number,
    targetMdf: number,
    spellPower: number,
    critMultiplier: number = 1
): number {
    if (targetMdf <= 0) targetMdf = 1;
    const damage = attackerInt * (1 + spellPower / 100) * (attackerInt / targetMdf) * critMultiplier;
    return Math.floor(damage);
}

/**
 * Healing: SPI × (1 + BasePower/100) × CritMultiplier
 */
export function calculateHealing(
    casterSpi: number,
    healPower: number,
    critMultiplier: number = 1
): number {
    const healing = casterSpi * (1 + healPower / 100) * critMultiplier;
    return Math.floor(healing);
}