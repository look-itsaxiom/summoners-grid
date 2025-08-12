import { ActionCard, SummonCard, RoleCard, EquipmentCard, BuildingCard, CounterCard, QuestCard, AdvanceCard } from './cards.js';
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

// Tier 2 Advanced Roles
export const berserker = new RoleCard(
    '023',
    'Berserker',
    RoleFamily.Warrior,
    2,
    { str: 0.5, end: 0, def: -0.1, int: 0, spi: 0, mdf: 0, spd: 0.1, acc: 0, lck: 0 }
);

export const knight = new RoleCard(
    '024',
    'Knight',
    RoleFamily.Warrior,
    2,
    { str: 0.3, end: 0.2, def: 0.3, int: 0, spi: 0, mdf: 0, spd: 0, acc: 0, lck: 0 }
);

export const explorer = new RoleCard(
    '025',
    'Explorer',
    RoleFamily.Scout,
    2,
    { str: 0, end: 0.2, def: 0, int: 0, spi: 0, mdf: 0, spd: 0.3, acc: 0.15, lck: 0 }
);

export const elementMage = new RoleCard(
    '026',
    'Element Mage',
    RoleFamily.Magician,
    2,
    { str: 0, end: 0, def: 0, int: 0.4, spi: 0.2, mdf: 0, spd: 0, acc: 0, lck: 0.1 }
);

export const lightMage = new RoleCard(
    '027',
    'Light Mage',
    RoleFamily.Magician,
    2,
    { str: 0, end: 0, def: 0, int: 0.25, spi: 0.35, mdf: 0.15, spd: 0, acc: 0, lck: 0 }
);

export const rogue = new RoleCard(
    '028',
    'Rogue',
    RoleFamily.Scout,
    2,
    { str: 0, end: 0, def: 0, int: 0, spi: 0, mdf: 0, spd: 0.4, acc: 0.25, lck: 0.2 }
);

export const darkMage = new RoleCard(
    '029',
    'Dark Mage',
    RoleFamily.Magician,
    2,
    { str: 0, end: 0, def: 0, int: 0.4, spi: 0.2, mdf: -0.1, spd: 0, acc: 0, lck: 0 }
);

// Tier 3 Master Roles
export const paladin = new RoleCard(
    '030',
    'Paladin',
    RoleFamily.Warrior, // Hybrid with Magician
    3,
    { str: 0.25, end: 0, def: 0.25, int: 0.15, spi: 0.25, mdf: 0, spd: 0, acc: 0, lck: 0 }
);

export const sentinel = new RoleCard(
    '031',
    'Sentinel',
    RoleFamily.Warrior,
    3,
    { str: 0.2, end: 0.3, def: 0.5, int: 0, spi: 0, mdf: 0.15, spd: 0, acc: 0, lck: 0 }
);

export const warlock = new RoleCard(
    '032',
    'Warlock',
    RoleFamily.Magician,
    3,
    { str: 0, end: 0, def: -0.15, int: 0.6, spi: 0.3, mdf: -0.2, spd: 0, acc: 0, lck: 0.2 }
);

// Building Cards with proper positioning and IDs
export const gignenCountry = new BuildingCard(
    '004',
    'Gignen Country',
    Attribute.Neutral,
    'Uncommon',
    'Gignen summons occupying this building gain +1 level whenever they level up',
    { width: 3, height: 2 },
    {
        description: 'Species-specific territory that enhances Gignen growth rates',
        execute: (game: any, player: any, target: any) => {
            // Create persistent building effect
            game.addBuildingEffect('gignen-country', player, (unit: any) => {
                if (unit.species === Species.Gignen && game.isUnitInBuilding(unit, 'gignen-country')) {
                    unit.bonusLevelsPerLevelUp = 1;
                }
            });
        }
    }
);

// Add building ID
(gignenCountry as any).id = 'gignen-country';

export const darkAltar = new BuildingCard(
    '010',
    'Dark Altar',
    Attribute.Dark,
    'Rare',
    'At end of your next turn, destroy this and any summons in it. If summon destroyed, target magician becomes level 20',
    { width: 2, height: 2 },
    {
        description: 'Sacrificial structure that enables rapid role advancement',
        execute: (game: any, player: any, target: any) => {
            // Set delayed destruction effect for next turn's end
            const destructionTurn = game.turnNumber + (game.currentPlayer === player ? 2 : 1);
            game.scheduleBuildingDestruction('dark-altar', player, destructionTurn, (destroyedUnits: any[]) => {
                if (destroyedUnits.length > 0) {
                    // Find magician to level up
                    const magician = player.summonUnits.find((unit: any) => unit.roleFamily === RoleFamily.Magician);
                    if (magician) {
                        magician.level = 20;
                        magician.calculateStats();
                        game.addToLog(`${magician.getDisplayName()} is empowered to level 20 by the Dark Altar's sacrifice!`);
                    }
                }
            });
        }
    }
);

// Add building ID
(darkAltar as any).id = 'dark-altar';

// Counter Cards
// Counter Cards with proper trigger conditions
export const dramaticReturn = new CounterCard(
    '003',
    'Dramatic Return!',
    Attribute.Light,
    'Legendary',
    'When a summon you control is defeated, return it with 10% HP',
    'summon-defeated',
    {
        description: 'Miraculous resurrection that brings back fallen allies',
        execute: (game: any, player: any, defeatedUnit: any) => {
            // Return unit to valid territory space with 10% HP
            const validPositions = game.getValidTerritoryPositions(player);
            if (validPositions.length > 0 && defeatedUnit) {
                const position = validPositions[0];
                defeatedUnit.hp = Math.floor(defeatedUnit.maxHp * 0.1);
                defeatedUnit.position = position;
                player.addSummonUnit(defeatedUnit);
                game.board.placeUnit(defeatedUnit, position);
                game.addToLog(`Dramatic Return! resurrects ${defeatedUnit.getDisplayName()} at (${position.x}, ${position.y}) with ${defeatedUnit.hp} HP`);
            }
        }
    }
);

// Add trigger checking method
(dramaticReturn as any).shouldTrigger = function(game: any): boolean {
    // This would be set by the game when a summon is defeated
    return this.triggeredThisTurn || false;
};

export const graverobbing = new CounterCard(
    '041',
    'Graverobbing',
    Attribute.Dark,
    'Uncommon',
    'When opponent gains Victory Points, nullify the gain by discarding a card',
    'victory-point-gained',
    {
        description: 'Defensive counter that steals enemies\' victories',
        execute: (game: any, player: any, vpEvent: any) => {
            // Nullify VP gain and discard a card
            if (vpEvent && vpEvent.amount > 0) {
                vpEvent.amount = 0;
                
                // Discard a card from hand as cost
                if (player.hand.length > 0) {
                    const discardedCard = player.hand.pop();
                    player.discardPile.push(discardedCard);
                    game.addToLog(`Graverobbing nullifies Victory Point gain (discards ${discardedCard.name})`);
                } else {
                    game.addToLog(`Graverobbing nullifies Victory Point gain`);
                }
            }
        }
    }
);

(graverobbing as any).shouldTrigger = function(game: any): boolean {
    return this.triggeredThisTurn || false;
};

export const nightmarePain = new CounterCard(
    '132',
    'Nightmare Pain',
    Attribute.Dark,
    'Common',
    'When a Warlock you control takes damage, deal equal damage to any target',
    'warlock takes damage',
    {
        description: 'Warlock counter that reflects suffering through dark magic',
        execute: (game: any, player: any, damageEvent: any) => {
            if (damageEvent && damageEvent.damage > 0) {
                // Find target for reflection
                const allUnits = [...game.playerA.summonUnits, ...game.playerB.summonUnits];
                if (allUnits.length > 0) {
                    const target = allUnits[0]; // Simplified targeting
                    target.takeDamage(damageEvent.damage);
                    game.addToLog(`Nightmare Pain reflects ${damageEvent.damage} damage to ${target.getDisplayName()}`);
                }
            }
        }
    },
    RoleFamily.Magician // Requires Warlock specifically
);

// Quest Cards
export const tasteOfBattle = new QuestCard(
    '002',
    'Taste of Battle',
    Attribute.Fire,
    'Uncommon',
    'Control a summon under level 10 that deals damage this turn',
    'Deal damage with summon under level 10',
    'Any summon under level 10 takes damage from enemy',
    {
        description: 'Target summon gains 2 levels',
        execute: (game: any, target: any, questData: any) => {
            if (target && target.level < 10) {
                target.level += 2;
                target.calculateStats();
                game.addToLog(`${target.getDisplayName()} gains 2 levels from Taste of Battle!`);
            }
        }
    },
    {
        description: 'Quest fails and goes to discard',
        execute: (game: any, target: any, questData: any) => {
            game.addToLog(`Taste of Battle quest failed!`);
        }
    }
);

export const nearwoodForestExpedition = new QuestCard(
    '037',
    'Nearwood Forest Expedition',
    Attribute.Earth,
    'Common',
    'Control a Warrior, Scout, or Magician summon under level 10',
    'Control qualifying summon under level 10',
    'None',
    {
        description: 'Target summon gains 2 levels',
        execute: (game: any, target: any, questData: any) => {
            if (target && target.level < 10) {
                const oldLevel = target.level;
                target.level += 2;
                target.calculateStats();
                
                // Apply Gignen Country bonus if applicable
                if (target.species === Species.Gignen && game.isUnitInBuilding(target, 'gignen-country')) {
                    target.level += 2; // Additional bonus levels
                    target.calculateStats();
                    game.addToLog(`${target.getDisplayName()} gains ${target.level - oldLevel} levels from exploration (including Gignen Country bonus)!`);
                } else {
                    game.addToLog(`${target.getDisplayName()} gains 2 levels from exploration!`);
                }
            }
        }
    }
);

// Add completion checking method
(nearwoodForestExpedition as any).checkCompletion = function(unit: any): boolean {
    return unit.level < 10 && (
        unit.roleFamily === RoleFamily.Warrior || 
        unit.roleFamily === RoleFamily.Scout || 
        unit.roleFamily === RoleFamily.Magician
    );
};

// Advance Cards
export const berserkerRage = new AdvanceCard(
    '036',
    'Berserker Rage',
    'Uncommon',
    'Grant target Berserker +100% STR and +50% SPD for 3 turns',
    'Control a Berserker role',
    {
        description: 'Temporary power boost with defensive vulnerability',
        execute: (game: any, target: any, caster: any) => {
            if (target && target.roleFamily === RoleFamily.Warrior) {
                // Apply temporary bonuses
                target.tempStatBonuses = target.tempStatBonuses || {};
                target.tempStatBonuses.str = (target.tempStatBonuses.str || 0) + 1.0;
                target.tempStatBonuses.spd = (target.tempStatBonuses.spd || 0) + 0.5;
                target.tempBonusDuration = 3;
                target.calculateStats();
                game.addToLog(`${target.getDisplayName()} enters a berserker rage!`);
            }
        }
    },
    { from: RoleFamily.Warrior, to: 'Berserker' }
);

export const alrechtBarkstep = new AdvanceCard(
    '040',
    'Alrecht Barkstep, Scoutmaster',
    'Legendary',
    'Transform target Explorer into named unique "Alrecht Barkstep"',
    'Control an Explorer role at level 15+',
    {
        description: 'Legendary transformation creating unique named character',
        execute: (game: any, target: any, caster: any) => {
            if (target && target.roleFamily === RoleFamily.Scout && target.level >= 10) {
                // Transform into named summon
                target.name = 'Alrecht Barkstep, Scoutmaster';
                target.role = rogue; // Use Rogue role for enhanced stats
                target.roleFamily = RoleFamily.Scout;
                target.isNamedSummon = true;
                
                // Enhanced stats for named summon
                target.baseStats.str = Math.max(target.baseStats.str, 24);
                target.baseStats.spd = Math.max(target.baseStats.spd, 35);
                target.baseStats.acc = Math.max(target.baseStats.acc, 43);
                
                // Add special ability card to hand
                caster.addToHand(followMe);
                target.calculateStats();
                game.addToLog(`${target.getDisplayName()} is transformed into the legendary Alrecht Barkstep, Scoutmaster!`);
            }
        }
    },
    { from: RoleFamily.Scout, to: 'Alrecht Barkstep' }
);

// Add requirement checking
(alrechtBarkstep as any).checkRequirements = function(unit: any): boolean {
    return unit.roleFamily === RoleFamily.Scout && unit.level >= 10 && 
           (unit.role === explorer || unit.role === rogue);
};

export const shadowPact = new AdvanceCard(
    '039',
    'Shadow Pact',
    'Rare',
    'Transform Dark Mage into Warlock, sacrifice 25% HP to double next 3 spell powers',
    'Control a Dark Mage or level 20 Magician',
    {
        description: 'High-risk enhancement trading health for magical power',
        execute: (game: any, target: any, caster: any) => {
            if (target && target.roleFamily === RoleFamily.Magician) {
                // Role transformation
                target.role = warlock;
                target.roleFamily = RoleFamily.Magician;
                
                // Apply HP cost and spell enhancement
                const hpCost = Math.floor(target.hp * 0.25);
                target.takeDamage(hpCost);
                target.enhancedSpellsRemaining = 3;
                target.calculateStats();
                
                // Add unique counter card to hand
                caster.addToHand(nightmarePain);
                
                game.addToLog(`${target.getDisplayName()} becomes a Warlock through dark pact! (sacrifices ${hpCost} HP)`);
            }
        }
    },
    { from: RoleFamily.Magician, to: 'Warlock' }
);

// Add requirement checking
(shadowPact as any).checkRequirements = function(unit: any): boolean {
    return unit.roleFamily === RoleFamily.Magician && 
           (unit.level >= 20 || unit.role === darkMage);
};

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

// Additional Action Cards from Alpha Set
export const ensnare = new ActionCard(
    '011',
    'Ensnare',
    Attribute.Nature,
    'Uncommon',
    'Prevent target summon from moving or attacking next turn',
    Speed.Action,
    {
        description: 'Immobilize target with save chance',
        execute: (game: any, caster: any, target: any) => {
            if (!caster || !target) return;
            
            // Hit calculation: 75% base + (ACC/10) + (LCK/10)
            const toHit = 75 + (caster.stats.acc / 10) + (caster.stats.lck / 10);
            const hitRoll = Math.random() * 100;
            
            if (hitRoll <= toHit) {
                // Damage first
                let damage = caster.stats.str * 1.25 * (caster.stats.str / target.stats.def);
                const finalDamage = Math.floor(damage);
                target.takeDamage(finalDamage);
                
                // Immobilize save
                const saveRoll = Math.random() * 100;
                if (saveRoll > 30) { // 70% chance to fail save
                    target.immobilizedUntil = game.currentTurn + 1;
                    game.addToLog(`Ensnare deals ${finalDamage} damage and immobilizes ${target.getDisplayName()}`);
                } else {
                    game.addToLog(`Ensnare deals ${finalDamage} damage to ${target.getDisplayName()} but immobilize is resisted`);
                }
            } else {
                game.addToLog(`Ensnare misses ${target.getDisplayName()}`);
            }
        }
    },
    RoleFamily.Scout
);

export const drainTouch = new ActionCard(
    '012',
    'Drain Touch',
    Attribute.Dark,
    'Uncommon',
    'Deal dark damage to target and heal yourself for the same amount',
    Speed.Action,
    {
        description: 'Life-steal spell that damages enemies while healing caster',
        execute: (game: any, caster: any, target: any) => {
            if (!caster || !target) return;
            
            const toHit = 90 + (caster.stats.acc / 10);
            const hitRoll = Math.random() * 100;
            
            if (hitRoll <= toHit) {
                let damage = caster.stats.int * 1.3 * (caster.stats.int / target.stats.mdf);
                const finalDamage = Math.floor(damage);
                target.takeDamage(finalDamage);
                
                const healAmount = Math.floor(finalDamage * 0.5);
                caster.heal(healAmount);
                
                game.addToLog(`Drain Touch deals ${finalDamage} damage to ${target.getDisplayName()} and heals ${caster.getDisplayName()} for ${healAmount}`);
            } else {
                game.addToLog(`Drain Touch misses ${target.getDisplayName()}`);
            }
        }
    },
    RoleFamily.Magician
);

export const adventurousSpirit = new ActionCard(
    '013',
    'Adventurous Spirit',
    Attribute.Neutral,
    'Common',
    'Search your deck for a Quest card and add it to your hand',
    Speed.Action,
    {
        description: 'Deck searching ability for quest-based strategies',
        execute: (game: any, caster: any, target: any) => {
            // Simplified for demo - in full game would search deck
            game.addToLog(`Adventurous Spirit allows ${caster.getDisplayName()}'s controller to search for Quest cards`);
        }
    },
    RoleFamily.Scout
);

export const spellRecall = new ActionCard(
    '015',
    'Spell Recall',
    Attribute.Neutral,
    'Uncommon',
    'Return target Action card from your discard pile to your hand',
    Speed.Action,
    {
        description: 'Spell recursion for repeated magical effects',
        execute: (game: any, caster: any, target: any) => {
            game.addToLog(`Spell Recall allows ${caster.getDisplayName()}'s controller to retrieve spells from discard`);
        }
    },
    RoleFamily.Magician
);

export const lifeAlchemy = new ActionCard(
    '016',
    'Life Alchemy',
    Attribute.Light,
    'Rare',
    'Sacrifice target summon to fully heal another target summon',
    Speed.Action,
    {
        description: 'Powerful healing at the cost of sacrificing an ally',
        execute: (game: any, caster: any, target: any) => {
            if (!target) return;
            
            // Deal damage equal to 25% of target's max HP
            const damage = Math.floor(target.maxHp * 0.25);
            target.takeDamage(damage);
            
            // Heal caster for same amount
            caster.heal(damage);
            
            game.addToLog(`Life Alchemy deals ${damage} damage to ${target.getDisplayName()} and heals ${caster.getDisplayName()} for ${damage}`);
        }
    },
    RoleFamily.Magician
);

// Special unique cards generated by other effects
export const followMe = new ActionCard(
    '050',
    'Follow Me!',
    Attribute.Neutral,
    'Special',
    'Teleport target summon you control to space adjacent to Alrecht Barkstep',
    Speed.Action,
    {
        description: 'Special ability card generated by Alrecht Barkstep',
        execute: (game: any, caster: any, target: any) => {
            if (!target || !caster) return;
            
            // Find adjacent spaces to Alrecht Barkstep
            const adjacentPositions = game.board.getAdjacentPositions(caster.position);
            const validPositions = adjacentPositions.filter((pos: any) => 
                !game.board.getUnitAt(pos.x, pos.y)
            );
            
            if (validPositions.length > 0) {
                const newPosition = validPositions[0];
                game.board.moveUnit(target, newPosition);
                target.position = newPosition;
                target.movementUsed = 0; // Reset movement as this is teleportation
                
                game.addToLog(`Follow Me! teleports ${target.getDisplayName()} to (${newPosition.x}, ${newPosition.y})`);
            } else {
                game.addToLog(`Follow Me! fails - no adjacent spaces available`);
            }
        }
    },
    RoleFamily.Scout
);

export const dualShot = new ActionCard(
    '017',
    'Dual Shot',
    Attribute.Neutral,
    'Uncommon',
    'Make two separate ranged attacks with your bow in one action',
    Speed.Action,
    {
        description: 'Enhanced archery allowing multiple shots per turn',
        execute: (game: any, caster: any, target: any) => {
            if (!caster) return;
            
            caster.bonusAttacksThisTurn = 1;
            game.addToLog(`Dual Shot grants ${caster.getDisplayName()} an additional attack this turn`);
        }
    },
    RoleFamily.Scout
);

export function createDemoActionCards(): ActionCard[] {
    // Note: followMe and other special unique cards are excluded - they should only appear via effects
    return [blastBolt, healingHands, sharpenedBlade, rush, ensnare, drainTouch, adventurousSpirit, spellRecall, lifeAlchemy, dualShot];
}

export function createDemoRoles(): RoleCard[] {
    return [warrior, magician, scout, berserker, knight, explorer, elementMage, lightMage, rogue, darkMage, paladin, sentinel, warlock];
}

export function createDemoBuildingCards(): BuildingCard[] {
    return [gignenCountry, darkAltar];
}

export function createDemoCounterCards(): CounterCard[] {
    return [dramaticReturn, graverobbing, nightmarePain];
}

export function createDemoQuestCards(): QuestCard[] {
    return [tasteOfBattle, nearwoodForestExpedition];
}

export function createDemoAdvanceCards(): AdvanceCard[] {
    return [berserkerRage, alrechtBarkstep, shadowPact];
}

// Complete Alpha Set - All 42 cards from the Alpha Cards document
export function createCompleteAlphaSet(): {
    summons: SummonCard[];
    actions: ActionCard[];
    roles: RoleCard[];
    equipment: EquipmentCard[];
    buildings: BuildingCard[];
    counters: CounterCard[];
    quests: QuestCard[];
    advances: AdvanceCard[];
} {
    return {
        summons: createDemoSummons(),
        actions: createDemoActionCards(),
        roles: createDemoRoles(),
        equipment: [apprenticesWand, heirloomSword, huntingBow],
        buildings: createDemoBuildingCards(),
        counters: createDemoCounterCards(),
        quests: createDemoQuestCards(),
        advances: createDemoAdvanceCards()
    };
}