import { ActionCard, SummonCard, RoleCard, EquipmentCard } from './cards.js';
import { RoleFamily, Species, Speed, Attribute, EquipmentSlot } from './types.js';

// Equipment Cards
export const apprenticesWand = new EquipmentCard(
    '033',
    "Apprentice's Wand",
    EquipmentSlot.Weapon,
    30, // power
    2,  // range
    { int: 2, spi: 1 }
);

export const heirloomSword = new EquipmentCard(
    '034',
    'Heirloom Sword',
    EquipmentSlot.Weapon,
    40, // power (base 30 + 10 from Sharpened Blade in demo)
    1,  // range
    { str: 1, end: 1, def: 1, int: 1, spi: 1, mdf: 1, spd: 1, acc: 1 }
);

export const huntingBow = new EquipmentCard(
    '035',
    'Hunting Bow',
    EquipmentSlot.Weapon,
    30, // power
    3,  // range
    { acc: 2, spd: 1 }
);

// Role Cards
export const warrior = new RoleCard(
    '020',
    'Warrior',
    RoleFamily.Warrior,
    1,
    { str: 0.25, end: 0.25, def: 0, int: 0, spi: 0, mdf: 0, spd: 0, acc: 0, lck: 0 }
);

export const magician = new RoleCard(
    '021',
    'Magician',
    RoleFamily.Magician,
    1,
    { str: 0, end: 0, def: 0, int: 0.25, spi: 0.25, mdf: 0, spd: 0, acc: 0, lck: 0 }
);

export const scout = new RoleCard(
    '022',
    'Scout',
    RoleFamily.Scout,
    1,
    { str: 0, end: 0, def: 0, int: 0, spi: 0, mdf: 0, spd: 0.25, acc: 0.25, lck: 0 }
);

// Action Cards
export const blastBolt = new ActionCard(
    '001',
    'Blast Bolt',
    Attribute.Fire,
    'Common',
    'Deal fire damage to target opponent summon',
    Speed.Action,
    {
        description: 'Deal fire damage using INT vs MDF',
        execute: (game: any, caster: any, target: any) => {
            if (!caster || !target) return;
            
            // Hit calculation: 85% base + (ACC/10)
            const toHit = 85 + (caster.stats.acc / 10);
            const hitRoll = Math.random() * 100;
            
            if (hitRoll <= toHit) {
                // Crit check
                const critChance = Math.floor((caster.stats.lck * 0.3375) + 1.65);
                const critRoll = Math.random() * 100;
                const isCrit = critRoll <= critChance;
                
                // Damage: INT × (1 + 60/100) × (INT/target.MDF)
                let damage = caster.stats.int * 1.6 * (caster.stats.int / target.stats.mdf);
                if (isCrit) damage *= 1.5;
                
                const finalDamage = Math.floor(damage);
                target.takeDamage(finalDamage);
                
                game.addToLog(`Blast Bolt deals ${finalDamage} fire damage to ${target.getDisplayName()}${isCrit ? ' (Critical!)' : ''}`);
            } else {
                game.addToLog(`Blast Bolt misses ${target.getDisplayName()}`);
            }
        }
    },
    RoleFamily.Magician
);

export const healingHands = new ActionCard(
    '006',
    'Healing Hands',
    Attribute.Light,
    'Common',
    'Restore HP to target summon',
    Speed.Action,
    {
        description: 'Heal target using SPI-based formula',
        execute: (game: any, caster: any, target: any) => {
            if (!caster || !target) return;
            
            // Crit check for healing
            const critChance = Math.floor((caster.stats.lck * 0.3375) + 1.65);
            const critRoll = Math.random() * 100;
            const isCrit = critRoll <= critChance;
            
            // Heal: SPI × (1 + 40/100)
            let healAmount = caster.stats.spi * 1.4;
            if (isCrit) healAmount *= 1.5;
            
            const finalHeal = Math.floor(healAmount);
            target.heal(finalHeal);
            
            game.addToLog(`Healing Hands restores ${finalHeal} HP to ${target.getDisplayName()}${isCrit ? ' (Critical!)' : ''}`);
        }
    },
    RoleFamily.Magician
);

export const sharpenedBlade = new ActionCard(
    '005',
    'Sharpened Blade',
    Attribute.Neutral,
    'Common',
    'Grant +10 power bonus to target weapon',
    Speed.Action,
    {
        description: 'Enhance target weapon power',
        execute: (game: any, _caster: any, target: any) => {
            if (!target || !target.weapon) return;
            
            // This is simplified - in the real game, this would modify the weapon
            // For demo purposes, we'll just add a temporary attack bonus
            target.tempWeaponBonus = (target.tempWeaponBonus || 0) + 10;
            game.addToLog(`Sharpened Blade enhances ${target.getDisplayName()}'s weapon`);
        }
    },
    RoleFamily.Warrior
);

export const rush = new ActionCard(
    '009',
    'Rush',
    Attribute.Neutral,
    'Common',
    'Grant extra movement and attack to target',
    Speed.Action,
    {
        description: 'Double movement, enable extra attack',
        execute: (game: any, _caster: any, target: any) => {
            if (!target) return;
            
            // Reset movement for this turn
            target.movementUsed = 0;
            target.hasAttackedThisTurn = false;
            // In a full implementation, we'd track these temporary effects
            game.addToLog(`Rush energizes ${target.getDisplayName()}`);
        }
    },
    RoleFamily.Scout
);

// Create demo deck cards
export function createDemoSummons(): SummonCard[] {
    const gignenWarrior = new SummonCard(
        'demo-gignen-warrior',
        'Gignen Warrior',
        Species.Gignen,
        { str: 18, end: 13, def: 15, int: 15, spi: 13, mdf: 11, spd: 12, lck: 19, acc: 12 },
        { str: 1.33, end: 1, def: 1, int: 0.66, spi: 1, mdf: 0.66, spd: 0.5, lck: 2, acc: 0.66 },
        [heirloomSword]
    );

    const gignenMagician = new SummonCard(
        'demo-gignen-magician',
        'Gignen Magician',
        Species.Gignen,
        { str: 16, end: 13, def: 13, int: 16, spi: 15, mdf: 15, spd: 15, lck: 22, acc: 11 },
        { str: 1.33, end: 1, def: 0.5, int: 1.33, spi: 1.33, mdf: 1, spd: 1, lck: 2, acc: 0.5 },
        [apprenticesWand]
    );

    const gignenScout = new SummonCard(
        'demo-gignen-scout',
        'Gignen Scout',
        Species.Gignen,
        { str: 15, end: 17, def: 13, int: 15, spi: 16, mdf: 14, spd: 23, lck: 27, acc: 16 },
        { str: 1, end: 1.33, def: 1, int: 1, spi: 1, mdf: 1, spd: 1.33, lck: 2, acc: 1.33 },
        [huntingBow]
    );

    return [gignenWarrior, gignenMagician, gignenScout];
}

export function createDemoActionCards(): ActionCard[] {
    return [blastBolt, healingHands, sharpenedBlade, rush];
}

export function createDemoRoles(): RoleCard[] {
    return [warrior, magician, scout];
}