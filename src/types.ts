// Core types and enums for Summoner's Grid

export enum PlayerType {
    PlayerA = 'A',
    PlayerB = 'B'
}

export enum TurnPhase {
    Draw = 'Draw',
    Level = 'Level', 
    Action = 'Action',
    End = 'End'
}

export enum CardType {
    Summon = 'Summon',
    Action = 'Action',
    Building = 'Building',
    Quest = 'Quest',
    Counter = 'Counter',
    Reaction = 'Reaction',
    Equipment = 'Equipment',
    Role = 'Role',
    Advance = 'Advance'
}

export enum Speed {
    Counter = 'Counter',
    Reaction = 'Reaction', 
    Action = 'Action'
}

export enum RoleFamily {
    Warrior = 'Warrior',
    Magician = 'Magician',
    Scout = 'Scout'
}

export enum Species {
    Gignen = 'Gignen',
    Fae = 'Fae',
    Stoneheart = 'Stoneheart',
    Wilderling = 'Wilderling',
    Angar = 'Angar',
    Demar = 'Demar',
    Creptilis = 'Creptilis'
}

export enum Attribute {
    Fire = 'Fire',
    Water = 'Water',
    Earth = 'Earth',
    Wind = 'Wind',
    Light = 'Light',
    Dark = 'Dark',
    Nature = 'Nature',
    Neutral = 'Neutral'
}

export enum EquipmentSlot {
    Weapon = 'Weapon',
    Offhand = 'Offhand',
    Armor = 'Armor',
    Accessory = 'Accessory'
}

export interface Position {
    x: number;
    y: number;
}

export interface Stats {
    str: number;     // Strength
    end: number;     // Endurance
    def: number;     // Defense
    int: number;     // Intelligence
    spi: number;     // Spirit
    mdf: number;     // Magic Defense
    spd: number;     // Speed
    acc: number;     // Accuracy
    lck: number;     // Luck
}

export interface GrowthRates {
    str: number;
    end: number;
    def: number;
    int: number;
    spi: number;
    mdf: number;
    spd: number;
    acc: number;
    lck: number;
}

export interface DamageResult {
    damage: number;
    isCritical: boolean;
    damageType: Attribute;
}

export interface CombatResult {
    hit: boolean;
    damage?: DamageResult;
    effects?: string[];
}