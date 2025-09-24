import { SummonInstance } from "..";
import { cardData } from "./data/card-data";
import { SummonCard } from "./schemas/Card";
import { GROWTH_RATE_VALUES, Stat } from "./types";

// --- STAT AND PROPERTY CALCULATION ---

export function recalculateSummonStats(summon: SummonInstance) {
    const baseCard = cardData[summon.cardId] as any;
    if (!baseCard) return;

    const baseStats = baseCard.baseStats;
    const growthRates = baseCard.growthRates;
    const level = summon.level;

    // TODO: Add role and equipment modifiers
    const roleModifier = { STR: 1, END: 1, DEF: 1, INT: 1, SPI: 1, MDF: 1, SPD: 1, ACC: 1, LCK: 1 };
    const equipmentBonus = { STR: 0, END: 0, DEF: 0, INT: 0, SPI: 0, MDF: 0, SPD: 0, ACC: 0, LCK: 0 };

    // Final Stat Calculation
    for (const statKey in Stat) {
        const stat = statKey as keyof typeof Stat;
        const growthRateValue = GROWTH_RATE_VALUES[growthRates[stat]];
        const finalStat = (baseStats[stat] + Math.floor((level - 1) * growthRateValue)) * roleModifier[stat] + equipmentBonus[stat];
        summon.calculatedStats[stat] = finalStat;
    }

    // Derived Properties Calculation
    const stats = summon.calculatedStats;
    summon.calculatedProperties.maxHP = 50 + Math.floor(Math.pow(stats.END, 1.5));
    summon.calculatedProperties.movement = 2 + Math.floor((stats.SPD - 10) / 5);
    summon.calculatedProperties.toHit = 90 + (stats.ACC / 10);
    summon.calculatedProperties.critChance = Math.floor((stats.LCK * 0.3375) + 1.65);
}


// --- COMBAT CALCULATION ---

interface CombatAbility {
    basePower?: number;
    baseAccuracy?: number;
    damageFormula: 'physical' | 'magical' | 'bow';
}

interface CombatResult {
    hits: boolean;
    isCritical: boolean;
    damage: number;
}

export function calculateCombat(
    attacker: SummonInstance,
    defender: SummonInstance,
    ability: CombatAbility
): CombatResult {
    const result: CombatResult = { hits: false, isCritical: false, damage: 0 };
    const attackerStats = attacker.calculatedStats;
    const defenderStats = defender.calculatedStats;

    // 1. Hit Calculation
    const hitChance = (ability.baseAccuracy || 90) + (attackerStats.ACC / 10);
    const hitRoll = Math.random() * 100;
    if (hitRoll > hitChance) {
        return result; // Attack misses
    }
    result.hits = true;

    // 2. Critical Check
    const critChance = attacker.calculatedProperties.critChance;
    const critRoll = Math.random() * 100;
    if (critRoll <= critChance) {
        result.isCritical = true;
    }
    const critMultiplier = result.isCritical ? 1.5 : 1;

    // 3. Damage Calculation
    let damage = 0;
    const power = ability.basePower || 0; // Use 0 if no base power (e.g. basic attack)

    switch (ability.damageFormula) {
        case 'physical':
            damage = attackerStats.STR * (1 + power / 100) * (attackerStats.STR / defenderStats.DEF);
            break;
        case 'magical':
            damage = attackerStats.INT * (1 + power / 100) * (attackerStats.INT / defenderStats.MDF);
            break;
        case 'bow':
            // This requires weapon data which is not on the summon instance.
            // For now, we'll use a simplified version.
            const weaponPower = 30; // Placeholder for Hunting Bow
            damage = ((attackerStats.STR + attackerStats.ACC) / 2) * (1 + weaponPower / 100) * (attackerStats.STR / defenderStats.DEF);
            break;
    }

    result.damage = Math.floor(damage * critMultiplier);
    return result;
}