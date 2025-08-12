import { CardType, Speed, Attribute, RoleFamily, EquipmentSlot, Species } from './types.js';

export interface CardEffect {
    description: string;
    execute: (game: any, caster?: any, target?: any) => void;
}

export abstract class Card {
    public readonly id: string;
    public readonly name: string;
    public readonly type: CardType;
    public readonly attribute: Attribute;
    public readonly rarity: string;
    public readonly description: string;

    constructor(
        id: string,
        name: string,
        type: CardType,
        attribute: Attribute,
        rarity: string,
        description: string
    ) {
        this.id = id;
        this.name = name;
        this.type = type;
        this.attribute = attribute;
        this.rarity = rarity;
        this.description = description;
    }

    abstract canPlay(game: any, player: any): boolean;
    abstract getValidTargets(game: any, player: any): any[];
    abstract play(game: any, player: any, targets?: any[]): void;
}

export class ActionCard extends Card {
    public readonly speed: Speed;
    public readonly requiredRoleFamily: RoleFamily | undefined;
    public readonly effect: CardEffect;

    constructor(
        id: string,
        name: string,
        attribute: Attribute,
        rarity: string,
        description: string,
        speed: Speed,
        effect: CardEffect,
        requiredRoleFamily: RoleFamily | undefined = undefined
    ) {
        super(id, name, CardType.Action, attribute, rarity, description);
        this.speed = speed;
        this.requiredRoleFamily = requiredRoleFamily;
        this.effect = effect;
    }

    canPlay(_game: any, player: any): boolean {
        if (this.requiredRoleFamily) {
            const hasRequiredRole = player.summonUnits.some((unit: any) => 
                unit.roleFamily === this.requiredRoleFamily
            );
            if (!hasRequiredRole) return false;
        }
        return true;
    }

    getValidTargets(game: any, _player: any): any[] {
        // For now, return all summons as potential targets
        return [...game.playerA.summonUnits, ...game.playerB.summonUnits];
    }

    play(game: any, player: any, targets?: any[]): void {
        this.effect.execute(game, player.summonUnits[0], targets?.[0]);
        game.addToLog(`${player.name} played ${this.name}`);
    }
}

export class SummonCard extends Card {
    public readonly species: Species;
    public readonly baseStats: any;
    public readonly growthRates: any;
    public readonly equipment: EquipmentCard[];

    constructor(
        id: string,
        name: string,
        species: Species,
        baseStats: any,
        growthRates: any,
        equipment: EquipmentCard[]
    ) {
        super(id, name, CardType.Summon, Attribute.Neutral, 'Common', `${species} summon`);
        this.species = species;
        this.baseStats = baseStats;
        this.growthRates = growthRates;
        this.equipment = equipment;
    }

    canPlay(_game: any, player: any): boolean {
        // Can only play one summon per turn
        return !player.hasPlayedSummonThisTurn && player.summonUnits.length < 3;
    }

    getValidTargets(game: any, player: any): any[] {
        // Return valid board positions in player's territory
        const validPositions = [];
        const startRow = player.type === 'A' ? 0 : 9;
        const endRow = player.type === 'A' ? 2 : 11;
        
        for (let y = startRow; y <= endRow; y++) {
            for (let x = 0; x < 14; x++) {
                if (!game.board.getUnitAt(x, y)) {
                    validPositions.push({ x, y });
                }
            }
        }
        return validPositions;
    }

    play(game: any, player: any, targets?: any[]): void {
        if (targets && targets[0]) {
            const position = targets[0];
            const summonUnit = game.createSummonUnit(this, player, position);
            player.addSummonUnit(summonUnit);
            player.hasPlayedSummonThisTurn = true;
            
            // Draw 3 cards for summon
            for (let i = 0; i < 3; i++) {
                player.drawCard();
            }
            
            game.addToLog(`${player.name} summoned ${this.name} at (${position.x}, ${position.y})`);
        }
    }
}

export class RoleCard extends Card {
    public readonly roleFamily: RoleFamily;
    public readonly tier: number;
    public readonly statModifiers: any;

    constructor(
        id: string,
        name: string,
        roleFamily: RoleFamily,
        tier: number,
        statModifiers: any
    ) {
        super(id, name, CardType.Role, Attribute.Neutral, 'Common', `${roleFamily} role`);
        this.roleFamily = roleFamily;
        this.tier = tier;
        this.statModifiers = statModifiers;
    }

    canPlay(): boolean {
        return false; // Roles are assigned during deck construction
    }

    getValidTargets(): any[] {
        return [];
    }

    play(): void {
        // Roles don't get played directly
    }
}

export class EquipmentCard extends Card {
    public readonly slot: EquipmentSlot;
    public readonly power: number;
    public readonly range: number;
    public readonly statBonuses: any;

    constructor(
        id: string,
        name: string,
        slot: EquipmentSlot,
        power: number,
        range: number,
        statBonuses: any
    ) {
        super(id, name, CardType.Equipment, Attribute.Neutral, 'Common', `${slot} equipment`);
        this.slot = slot;
        this.power = power;
        this.range = range;
        this.statBonuses = statBonuses;
    }

    canPlay(): boolean {
        return false; // Equipment is assigned during deck construction
    }

    getValidTargets(): any[] {
        return [];
    }

    play(): void {
        // Equipment doesn't get played directly
    }
}