import { SummonCard, CardType, Attribute } from '../interfaces';

// These are the specific summon cards used in the play example, with calculated base stats.

export const playerA_gignenWarrior: SummonCard = {
    id: 'SUMMON-A1',
    name: 'Gignen Warrior',
    type: CardType.Summon,
    rarity: 'Common',
    attribute: Attribute.Neutral,
    description: 'A Gignen Warrior from Player A\'s deck.',
    species: 'Gignen',
    baseStats: {
        str: 13, end: 9, def: 11, int: 13,
        spi: 9, mdf: 9, spd: 10, lck: 11, acc: 10
    },
    growthRates: {
        str: 1.33, end: 1, def: 1, int: 0.66,
        spi: 1, mdf: 0.66, spd: 0.5, lck: 2, acc: 0.66
    }
};

export const playerA_gignenMagician: SummonCard = {
    id: 'SUMMON-A2',
    name: 'Gignen Magician',
    type: CardType.Summon,
    rarity: 'Common',
    attribute: Attribute.Neutral,
    description: 'A Gignen Magician from Player A\'s deck.',
    species: 'Gignen',
    baseStats: {
        str: 11, end: 9, def: 11, int: 11,
        spi: 10, mdf: 11, spd: 11, lck: 14, acc: 9
    },
    growthRates: {
        str: 1.33, end: 1, def: 0.5, int: 1.33,
        spi: 1.33, mdf: 1, spd: 1, lck: 2, acc: 0.5
    }
};

export const playerA_gignenScout: SummonCard = {
    id: 'SUMMON-A3',
    name: 'Gignen Scout',
    type: CardType.Summon,
    rarity: 'Common',
    attribute: Attribute.Neutral,
    description: 'A Gignen Scout from Player A\'s deck.',
    species: 'Gignen',
    baseStats: {
        str: 11, end: 12, def: 9, int: 11,
        spi: 12, mdf: 10, spd: 18, lck: 19, acc: 11
    },
    growthRates: {
        str: 1, end: 1.33, def: 1, int: 1,
        spi: 1, mdf: 1, spd: 1.33, lck: 2, acc: 1.33
    }
};

export const playerB_stoneheartWarrior: SummonCard = {
    id: 'SUMMON-B1',
    name: 'Stoneheart Warrior',
    type: CardType.Summon,
    rarity: 'Common',
    attribute: Attribute.Neutral,
    description: 'A Stoneheart Warrior from Player B\'s deck.',
    species: 'Stoneheart',
    baseStats: {
        str: 9, end: 8, def: 7, int: 2,
        spi: 6, mdf: 2, spd: 5, lck: 9, acc: 3
    },
    growthRates: {
        str: 1.33, end: 1, def: 1, int: 1,
        spi: 1.33, mdf: 1.5, spd: 1, lck: 0.66, acc: 1.5
    }
};

export const playerB_faeMagician: SummonCard = {
    id: 'SUMMON-B2',
    name: 'Fae Magician',
    type: CardType.Summon,
    rarity: 'Common',
    attribute: Attribute.Neutral,
    description: 'A Fae Magician from Player B\'s deck.',
    species: 'Fae',
    baseStats: {
        str: 9, end: 9, def: 11, int: 14,
        spi: 15, mdf: 12, spd: 11, lck: 9, acc: 10
    },
    growthRates: {
        str: 1, end: 1, def: 1, int: 1.33,
        spi: 1.33, mdf: 1, spd: 1, lck: 1, acc: 1.33
    }
};

export const playerB_wilderlingScout: SummonCard = {
    id: 'SUMMON-B3',
    name: 'Wilderling Scout',
    type: CardType.Summon,
    rarity: 'Common',
    attribute: Attribute.Neutral,
    description: 'A Wilderling Scout from Player B\'s deck.',
    species: 'Wilderling',
    baseStats: {
        str: 16, end: 12, def: 8, int: 7,
        spi: 11, mdf: 8, spd: 20, lck: 12, acc: 15
    },
    growthRates: {
        str: 0.66, end: 1, def: 1, int: 1.5,
        spi: 0.5, mdf: 0.66, spd: 2, lck: 1.5, acc: 2
    }
};

export const summonDb = new Map<string, SummonCard>([
    [playerA_gignenWarrior.id, playerA_gignenWarrior],
    [playerA_gignenMagician.id, playerA_gignenMagician],
    [playerA_gignenScout.id, playerA_gignenScout],
    [playerB_stoneheartWarrior.id, playerB_stoneheartWarrior],
    [playerB_faeMagician.id, playerB_faeMagician],
    [playerB_wilderlingScout.id, playerB_wilderlingScout],
]);