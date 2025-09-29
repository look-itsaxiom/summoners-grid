import {
    Card,
    CardType,
    Attribute,
    RoleCard,
    RoleFamily,
    EquipmentCard,
    EquipmentSlot,
    ActionCard,
    ActionSpeed,
    BuildingCard,
    QuestCard,
    AdvanceCard,
    CounterCard,
    NamedSummonCard,
    UniqueCard,
    GameState,
    Effect,
    SummonUnit,
} from '../interfaces';
import * as Formulas from '../formulas';
import { generateUUID as uuidv4 } from '../utils';

// =================================================================================================
// HELPER FUNCTIONS
// =================================================================================================

const findUnit = (gs: GameState, unitId: string): SummonUnit | undefined => {
    for (const player of Object.values(gs.players)) {
        const unit = player.summons.find(u => u.id === unitId);
        if (unit) return unit;
    }
    return undefined;
};


// =================================================================================================
// ROLE CARDS (Unchanged)
// =================================================================================================
export const warrior: RoleCard = { id: 'ROLE-001', name: 'Warrior', type: CardType.Role, rarity: 'Common', attribute: Attribute.Neutral, description: 'Foundation warrior role', tier: 1, family: RoleFamily.Warrior, statModifiers: { str: 0.25, end: 0.25 }};
export const magician: RoleCard = { id: 'ROLE-002', name: 'Magician', type: CardType.Role, rarity: 'Common', attribute: Attribute.Neutral, description: 'Foundation magician role', tier: 1, family: RoleFamily.Magician, statModifiers: { int: 0.25, spi: 0.25 }};
export const scout: RoleCard = { id: 'ROLE-003', name: 'Scout', type: CardType.Role, rarity: 'Common', attribute: Attribute.Neutral, description: 'Foundation scout role', tier: 1, family: RoleFamily.Scout, statModifiers: { spd: 0.25, acc: 0.25 }};
export const berserker: RoleCard = { id: 'ROLE-004', name: 'Berserker', type: CardType.Role, rarity: 'Uncommon', attribute: Attribute.Neutral, description: 'Aggressive warrior', tier: 2, family: RoleFamily.Warrior, statModifiers: { str: 0.5, spd: 0.1, def: -0.1 }, advancementFrom: ['Warrior']};
export const warlock: RoleCard = { id: 'ROLE-005', name: 'Warlock', type: CardType.Role, rarity: 'Rare', attribute: Attribute.Dark, description: 'Master of forbidden magic', tier: 3, family: RoleFamily.Magician, statModifiers: { int: 0.6, spi: 0.3, lck: 0.2, mdf: -0.2, def: -0.15 }, advancementFrom: ['Dark Mage']};
export const rogue: RoleCard = { id: 'ROLE-006', name: 'Rogue', type: CardType.Role, rarity: 'Uncommon', attribute: Attribute.Neutral, description: 'Stealthy scout', tier: 2, family: RoleFamily.Scout, statModifiers: { spd: 0.4, acc: 0.25, lck: 0.2 }, advancementFrom: ['Scout']};


// =================================================================================================
// EQUIPMENT CARDS (Unchanged)
// =================================================================================================
export const heirloomSword: EquipmentCard = { id: 'EQUIP-001', name: 'Heirloom Sword', type: CardType.Equipment, rarity: 'Common', attribute: Attribute.Neutral, description: 'A well-crafted sword.', slot: EquipmentSlot.Weapon, power: 30, range: 1, damageStat: 'str', statBonuses: {}};
export const apprenticesWand: EquipmentCard = { id: 'EQUIP-002', name: 'Apprentice\'s Wand', type: CardType.Equipment, rarity: 'Common', attribute: Attribute.Neutral, description: 'A simple wand.', slot: EquipmentSlot.Weapon, power: 30, range: 4, damageStat: 'int', statBonuses: {}};
export const huntingBow: EquipmentCard = { id: 'EQUIP-003', name: 'Hunting Bow', type: CardType.Equipment, rarity: 'Common', attribute: Attribute.Neutral, description: 'A sturdy bow.', slot: EquipmentSlot.Weapon, power: 30, range: 6, damageStat: 'hybrid', statBonuses: {}};


// =================================================================================================
// ACTION CARDS (Implemented)
// =================================================================================================

export const sharpenedBlade: ActionCard = {
    id: 'ACTION-001',
    name: 'Sharpened Blade',
    type: CardType.Action,
    rarity: 'Common',
    attribute: Attribute.Neutral,
    description: 'Target Weapon equipped to a Warrior based Summon gains +10 Base Power.',
    speed: ActionSpeed.Action,
    canPlay: (gs, pid) => gs.players[pid].summons.some(s => s.role.family === RoleFamily.Warrior),
    getEffects: (gs, pid, context: { targetUnitId: string }) => [{
        id: uuidv4(),
        sourceCardId: 'ACTION-001',
        speed: ActionSpeed.Action,
        description: `Increase ${context.targetUnitId}'s weapon power by 10.`,
        resolve: (currentGs) => {
            const unit = findUnit(currentGs, context.targetUnitId);
            if (unit && unit.equipment.weapon) {
                unit.equipment.weapon.power = (unit.equipment.weapon.power || 0) + 10;
                currentGs.gameLog.push(`${unit.id}'s weapon power increased to ${unit.equipment.weapon.power}.`);
            }
            return currentGs;
        }
    }],
};

export const blastBolt: ActionCard = {
    id: 'ACTION-004',
    name: 'Blast Bolt',
    type: CardType.Action,
    rarity: 'Common',
    attribute: Attribute.Fire,
    description: 'Deal fire damage to a target summon.',
    speed: ActionSpeed.Action,
    canPlay: (gs, pid) => gs.players[pid].summons.some(s => s.role.family === RoleFamily.Magician),
    getEffects: (gs, pid, context: { casterUnitId: string, targetUnitId: string }) => [{
        id: uuidv4(),
        sourceCardId: 'ACTION-004',
        speed: ActionSpeed.Action,
        description: `Deal fire damage from ${context.casterUnitId} to ${context.targetUnitId}.`,
        resolve: (currentGs) => {
            const caster = findUnit(currentGs, context.casterUnitId);
            const target = findUnit(currentGs, context.targetUnitId);
            if (!caster || !target) return currentGs;

            // Hit check
            const hitChance = Formulas.calculateHitChance(85, caster.calculatedStats.acc);
            if (currentGs.rng() * 100 > hitChance) {
                currentGs.gameLog.push(`Blast Bolt misses!`);
                return currentGs;
            }

            // Crit check
            const critChance = Formulas.calculateCritChance(caster.calculatedStats.lck);
            const isCrit = currentGs.rng() * 100 <= critChance;
            const critMultiplier = isCrit ? 1.5 : 1;

            // Damage calc
            const damage = Formulas.calculateMagicalDamage(
                caster.calculatedStats.int,
                target.calculatedStats.mdf,
                60, // Base power from play example
                critMultiplier
            );

            target.damageTaken += damage;
            currentGs.gameLog.push(`Blast Bolt hits ${target.id} for ${damage} damage! ${isCrit ? '(Critical!)' : ''}`);
            return currentGs;
        }
    }],
};

// Other cards still placeholders for brevity
export const healingHands: ActionCard = { id: 'ACTION-002', name: 'Healing Hands', type: CardType.Action, rarity: 'Common', attribute: Attribute.Light, description: 'Heal a target summon.', speed: ActionSpeed.Action, canPlay: () => false, getEffects: () => [] };
export const rush: ActionCard = { id: 'ACTION-003', name: 'Rush', type: CardType.Action, rarity: 'Common', attribute: Attribute.Neutral, description: 'Doubles a target\'s movement.', speed: ActionSpeed.Action, canPlay: () => false, getEffects: () => [] };
export const drainTouch: ActionCard = { id: 'ACTION-005', name: 'Drain Touch', type: CardType.Action, rarity: 'Uncommon', attribute: Attribute.Dark, description: 'Deal dark damage and heal.', speed: ActionSpeed.Action, canPlay: () => false, getEffects: () => [] };
export const tempestSlash: ActionCard = { id: 'ACTION-006', name: 'Tempest Slash', type: CardType.Action, rarity: 'Uncommon', attribute: Attribute.Wind, description: 'Adds movement and bonus damage.', speed: ActionSpeed.Action, canPlay: () => false, getEffects: () => [] };
export const ensnare: ActionCard = { id: 'ACTION-007', name: 'Ensnare', type: CardType.Action, rarity: 'Uncommon', attribute: Attribute.Nature, description: 'Immobilize a target.', speed: ActionSpeed.Action, canPlay: () => false, getEffects: () => [] };
export const dualShot: ActionCard = { id: 'ACTION-008', name: 'Dual Shot', type: CardType.Action, rarity: 'Uncommon', attribute: Attribute.Neutral, description: 'Allows two basic attacks.', speed: ActionSpeed.Action, canPlay: () => false, getEffects: () => [] };
export const lifeAlchemy: ActionCard = { id: 'ACTION-009', name: 'Life Alchemy', type: CardType.Action, rarity: 'Rare', attribute: Attribute.Light, description: 'Sacrifice to heal.', speed: ActionSpeed.Action, canPlay: () => false, getEffects: () => [] };


// =================================================================================================
// BUILDING & QUEST CARDS (Unchanged)
// =================================================================================================
export const gignenCountry: BuildingCard = { id: 'BUILDING-001', name: 'Gignen Country', type: CardType.Building, rarity: 'Uncommon', attribute: Attribute.Neutral, description: 'Enhances Gignen.', dimensions: { width: 3, height: 2 }};
export const darkAltar: BuildingCard = { id: 'BUILDING-002', name: 'Dark Altar', type: CardType.Building, rarity: 'Rare', attribute: Attribute.Dark, description: 'Sacrificial structure.', dimensions: { width: 2, height: 2 }};
export const nearwoodForestExpedition: QuestCard = { id: 'QUEST-001', name: 'Nearwood Forest Expedition', type: CardType.Quest, rarity: 'Common', attribute: Attribute.Earth, description: 'Gain 2 levels.'};


// =================================================================================================
// COUNTER CARDS (Unchanged)
// =================================================================================================
export const dramaticReturn: CounterCard = { id: 'COUNTER-001', name: 'Dramatic Return!', type: CardType.Counter, rarity: 'Legendary', attribute: Attribute.Light, description: 'Return a defeated summon.', speed: ActionSpeed.Counter};
export const graverobbing: CounterCard = { id: 'COUNTER-002', name: 'Graverobbing', type: CardType.Counter, rarity: 'Uncommon', attribute: Attribute.Dark, description: 'Nullify VP gain.', speed: ActionSpeed.Counter};


// =================================================================================================
// ADVANCE & UNIQUE CARDS (Unchanged)
// =================================================================================================
export const advanceToBerserker: AdvanceCard = { id: 'ADVANCE-001', name: 'Berserker Rage', type: CardType.Advance, rarity: 'Uncommon', attribute: Attribute.Neutral, description: 'Advance to Berserker.', targetRole: 'Warrior', newRole: berserker, levelRequirement: 10};
export const advanceToWarlock: AdvanceCard = { id: 'ADVANCE-002', name: 'Shadow Pact', type: CardType.Advance, rarity: 'Rare', attribute: Attribute.Dark, description: 'Advance to Warlock.', targetRole: 'Magician', newRole: warlock, levelRequirement: 20};
export const alrechtBarkstep: NamedSummonCard = { id: 'NAMED-001', name: 'Alrecht Barkstep, Scoutmaster', type: CardType.NamedSummon, rarity: 'Legendary', attribute: Attribute.Neutral, description: 'Transforms a scout.', replaces: 'Gignen Scout', newRole: rogue};
export const followMe: UniqueCard = { id: 'UNIQUE-001', name: 'Follow Me!', type: CardType.Unique, rarity: 'Special', attribute: Attribute.Neutral, description: 'Move a target summon.'};


// =================================================================================================
// DATABASE
// =================================================================================================
export const cardList: Card[] = [
    warrior, magician, scout, berserker, warlock, rogue,
    heirloomSword, apprenticesWand, huntingBow,
    sharpenedBlade, healingHands, rush, blastBolt, drainTouch, tempestSlash, ensnare, dualShot, lifeAlchemy,
    gignenCountry, darkAltar,
    nearwoodForestExpedition,
    dramaticReturn, graverobbing,
    advanceToBerserker, advanceToWarlock,
    alrechtBarkstep,
    followMe,
];

export const cardDb = new Map<string, Card>(cardList.map(c => [c.id, c]));