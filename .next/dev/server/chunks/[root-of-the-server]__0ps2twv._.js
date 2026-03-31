module.exports = [
"[externals]/next/dist/compiled/next-server/app-route-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-route-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-route-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/@opentelemetry/api [external] (next/dist/compiled/@opentelemetry/api, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/@opentelemetry/api", () => require("next/dist/compiled/@opentelemetry/api"));

module.exports = mod;
}),
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () => require("next/dist/server/app-render/work-unit-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () => require("next/dist/server/app-render/work-async-storage.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/shared/lib/no-fallback-error.external.js [external] (next/dist/shared/lib/no-fallback-error.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/shared/lib/no-fallback-error.external.js", () => require("next/dist/shared/lib/no-fallback-error.external.js"));

module.exports = mod;
}),
"[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)", ((__turbopack_context__, module, exports) => {

const mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () => require("next/dist/server/app-render/after-task-async-storage.external.js"));

module.exports = mod;
}),
"[project]/src/types/index.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

// ─── Core Stats ───────────────────────────────────────────────────────────────
__turbopack_context__.s([
    "BOARD_HEIGHT",
    ()=>BOARD_HEIGHT,
    "BOARD_WIDTH",
    ()=>BOARD_WIDTH,
    "CRIT_MULTIPLIER",
    ()=>CRIT_MULTIPLIER,
    "ELEMENT_ADVANTAGES",
    ()=>ELEMENT_ADVANTAGES,
    "GROWTH_RATE_SYMBOLS",
    ()=>GROWTH_RATE_SYMBOLS,
    "GROWTH_RATE_VALUES",
    ()=>GROWTH_RATE_VALUES,
    "HAND_LIMIT",
    ()=>HAND_LIMIT,
    "STAT_KEYS",
    ()=>STAT_KEYS,
    "SUMMON_DRAW_COUNT",
    ()=>SUMMON_DRAW_COUNT,
    "SUMMON_MAX_LEVEL",
    ()=>SUMMON_MAX_LEVEL,
    "SUMMON_START_LEVEL",
    ()=>SUMMON_START_LEVEL,
    "TERRITORY_DEPTH",
    ()=>TERRITORY_DEPTH,
    "VP_TO_WIN",
    ()=>VP_TO_WIN
]);
const STAT_KEYS = [
    'STR',
    'END',
    'DEF',
    'INT',
    'SPI',
    'MDF',
    'SPD',
    'ACC',
    'LCK'
];
const GROWTH_RATE_VALUES = {
    minimal: 0.5,
    steady: 0.67,
    normal: 1.0,
    gradual: 1.33,
    accelerated: 1.5,
    exceptional: 2.0
};
const GROWTH_RATE_SYMBOLS = {
    minimal: '--',
    steady: '-',
    normal: '_',
    gradual: '+',
    accelerated: '++',
    exceptional: '*'
};
const ELEMENT_ADVANTAGES = {
    fire: 'wind',
    wind: 'earth',
    earth: 'water',
    water: 'fire',
    light: 'dark',
    dark: 'light',
    neutral: null
};
const BOARD_WIDTH = 12;
const BOARD_HEIGHT = 14;
const TERRITORY_DEPTH = 3;
const SUMMON_START_LEVEL = 5;
const SUMMON_MAX_LEVEL = 20;
const HAND_LIMIT = 6;
const SUMMON_DRAW_COUNT = 3;
const VP_TO_WIN = 3;
const CRIT_MULTIPLIER = 1.5;
}),
"[project]/src/engine/dna/prng.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Mulberry32 — deterministic 32-bit PRNG.
 * Given the same seed, always produces the same sequence.
 * Used for DNA-based card reconstruction.
 */ __turbopack_context__.s([
    "mulberry32",
    ()=>mulberry32,
    "seededInt",
    ()=>seededInt,
    "seededWeightedChoice",
    ()=>seededWeightedChoice
]);
function mulberry32(seed) {
    let state = seed | 0;
    return ()=>{
        state = state + 0x6d2b79f5 | 0;
        let t = Math.imul(state ^ state >>> 15, 1 | state);
        t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}
function seededInt(rng, min, max) {
    return min + Math.floor(rng() * (max - min + 1));
}
function seededWeightedChoice(rng, weights) {
    const entries = Object.entries(weights);
    const total = entries.reduce((sum, [, w])=>sum + w, 0);
    let roll = rng() * total;
    for (const [key, weight] of entries){
        roll -= weight;
        if (roll <= 0) return key;
    }
    return entries[entries.length - 1][0];
}
}),
"[project]/src/engine/dna/constants.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DNA_VERSION",
    ()=>DNA_VERSION,
    "GROWTH_RATE_ORDER",
    ()=>GROWTH_RATE_ORDER,
    "GROWTH_WEIGHTS_BY_RARITY",
    ()=>GROWTH_WEIGHTS_BY_RARITY,
    "RARITY_ORDER",
    ()=>RARITY_ORDER,
    "SPECIES_ORDER",
    ()=>SPECIES_ORDER
]);
const SPECIES_ORDER = [
    'gignen',
    'fae',
    'stoneheart',
    'wilderling',
    'angar',
    'demar',
    'creptilis'
];
const RARITY_ORDER = [
    'common',
    'uncommon',
    'rare',
    'legend',
    'myth'
];
const GROWTH_RATE_ORDER = [
    'minimal',
    'steady',
    'normal',
    'gradual',
    'accelerated',
    'exceptional'
];
const GROWTH_WEIGHTS_BY_RARITY = {
    common: [
        10,
        20,
        40,
        20,
        8,
        2
    ],
    uncommon: [
        5,
        15,
        35,
        25,
        15,
        5
    ],
    rare: [
        2,
        10,
        28,
        30,
        20,
        10
    ],
    legend: [
        0,
        5,
        20,
        30,
        28,
        17
    ],
    myth: [
        0,
        0,
        10,
        25,
        35,
        30
    ]
};
const DNA_VERSION = 0x01;
}),
"[project]/src/data/species.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SPECIES",
    ()=>SPECIES,
    "getSpeciesTemplate",
    ()=>getSpeciesTemplate
]);
const SPECIES = {
    gignen: {
        id: 'gignen',
        name: 'Gignen',
        description: 'Versatile and adaptive generalists suited to any role.',
        statRanges: {
            STR: [
                8,
                12
            ],
            END: [
                8,
                12
            ],
            DEF: [
                8,
                12
            ],
            INT: [
                8,
                12
            ],
            SPI: [
                8,
                12
            ],
            MDF: [
                8,
                12
            ],
            SPD: [
                8,
                12
            ],
            ACC: [
                8,
                12
            ],
            LCK: [
                8,
                12
            ]
        }
    },
    fae: {
        id: 'fae',
        name: 'Fae',
        description: 'Graceful and intelligent, well-rounded for magical positions.',
        statRanges: {
            STR: [
                6,
                12
            ],
            END: [
                6,
                12
            ],
            DEF: [
                6,
                14
            ],
            INT: [
                10,
                16
            ],
            SPI: [
                10,
                14
            ],
            MDF: [
                8,
                14
            ],
            SPD: [
                8,
                14
            ],
            ACC: [
                8,
                14
            ],
            LCK: [
                6,
                12
            ]
        }
    },
    stoneheart: {
        id: 'stoneheart',
        name: 'Stoneheart',
        description: 'Stalwart and industrious craftsfolk and warriors.',
        statRanges: {
            STR: [
                8,
                14
            ],
            END: [
                10,
                16
            ],
            DEF: [
                10,
                14
            ],
            INT: [
                4,
                10
            ],
            SPI: [
                6,
                12
            ],
            MDF: [
                6,
                12
            ],
            SPD: [
                4,
                10
            ],
            ACC: [
                6,
                12
            ],
            LCK: [
                6,
                10
            ]
        }
    },
    wilderling: {
        id: 'wilderling',
        name: 'Wilderling',
        description: 'Agile and primal with keen senses and physical prowess.',
        statRanges: {
            STR: [
                10,
                16
            ],
            END: [
                8,
                14
            ],
            DEF: [
                6,
                12
            ],
            INT: [
                4,
                10
            ],
            SPI: [
                4,
                10
            ],
            MDF: [
                4,
                10
            ],
            SPD: [
                10,
                16
            ],
            ACC: [
                8,
                14
            ],
            LCK: [
                8,
                14
            ]
        }
    },
    angar: {
        id: 'angar',
        name: 'Angar',
        description: 'Celestial and wise, known for strategic prowess and light magic mastery.',
        statRanges: {
            STR: [
                8,
                16
            ],
            END: [
                6,
                12
            ],
            DEF: [
                6,
                12
            ],
            INT: [
                8,
                14
            ],
            SPI: [
                8,
                14
            ],
            MDF: [
                8,
                14
            ],
            SPD: [
                6,
                12
            ],
            ACC: [
                10,
                16
            ],
            LCK: [
                6,
                12
            ]
        }
    },
    demar: {
        id: 'demar',
        name: 'Demar',
        description: 'Inventive and clever devils excelling in crafting and magical support.',
        statRanges: {
            STR: [
                4,
                10
            ],
            END: [
                6,
                12
            ],
            DEF: [
                6,
                10
            ],
            INT: [
                12,
                16
            ],
            SPI: [
                8,
                14
            ],
            MDF: [
                10,
                16
            ],
            SPD: [
                6,
                12
            ],
            ACC: [
                6,
                12
            ],
            LCK: [
                8,
                14
            ]
        }
    },
    creptilis: {
        id: 'creptilis',
        name: 'Creptilis',
        description: 'Calculated and resilient, balancing endurance and defense with sharp battle focus.',
        statRanges: {
            STR: [
                6,
                12
            ],
            END: [
                8,
                14
            ],
            DEF: [
                8,
                14
            ],
            INT: [
                6,
                12
            ],
            SPI: [
                8,
                16
            ],
            MDF: [
                8,
                14
            ],
            SPD: [
                6,
                12
            ],
            ACC: [
                6,
                12
            ],
            LCK: [
                6,
                12
            ]
        }
    }
};
function getSpeciesTemplate(speciesId) {
    return SPECIES[speciesId];
}
}),
"[project]/src/data/cards.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ACCESSORY_CARDS",
    ()=>ACCESSORY_CARDS,
    "ACTION_CARDS",
    ()=>ACTION_CARDS,
    "ADVANCE_CARDS",
    ()=>ADVANCE_CARDS,
    "ARMOR_CARDS",
    ()=>ARMOR_CARDS,
    "BUILDING_CARDS",
    ()=>BUILDING_CARDS,
    "COUNTER_CARDS",
    ()=>COUNTER_CARDS,
    "QUEST_CARDS",
    ()=>QUEST_CARDS,
    "REACTION_CARDS",
    ()=>REACTION_CARDS,
    "SUMMON_CARDS",
    ()=>SUMMON_CARDS,
    "WEAPONS",
    ()=>WEAPONS,
    "createPlayerADeck",
    ()=>createPlayerADeck,
    "createPlayerBDeck",
    ()=>createPlayerBDeck,
    "createRandomDeck",
    ()=>createRandomDeck,
    "createRandomDeckDNA",
    ()=>createRandomDeckDNA
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/engine/dna/index.ts [app-route] (ecmascript) <locals>");
;
const WEAPONS = {
    heirloom_sword: {
        id: 'heirloom_sword',
        name: 'Heirloom Sword',
        slot: 'weapon',
        basePower: 30,
        damageType: 'physical_melee',
        element: 'neutral',
        range: 1,
        baseAccuracy: 90,
        statBonuses: {}
    },
    apprentices_wand: {
        id: 'apprentices_wand',
        name: "Apprentice's Wand",
        slot: 'weapon',
        basePower: 30,
        damageType: 'magical',
        element: 'neutral',
        range: 3,
        baseAccuracy: 90,
        statBonuses: {}
    },
    hunting_bow: {
        id: 'hunting_bow',
        name: 'Hunting Bow',
        slot: 'weapon',
        basePower: 30,
        damageType: 'physical_ranged',
        element: 'neutral',
        range: 5,
        baseAccuracy: 90,
        statBonuses: {}
    },
    // ─── Advanced Weapons ──────────────────────
    flame_blade: {
        id: 'flame_blade',
        name: 'Flame Blade',
        slot: 'weapon',
        basePower: 45,
        damageType: 'physical_melee',
        element: 'fire',
        range: 1,
        baseAccuracy: 85,
        statBonuses: {
            STR: 3
        }
    },
    frost_staff: {
        id: 'frost_staff',
        name: 'Frost Staff',
        slot: 'weapon',
        basePower: 50,
        damageType: 'magical',
        element: 'water',
        range: 3,
        baseAccuracy: 85,
        statBonuses: {
            INT: 3
        }
    },
    gale_bow: {
        id: 'gale_bow',
        name: 'Gale Bow',
        slot: 'weapon',
        basePower: 40,
        damageType: 'physical_ranged',
        element: 'wind',
        range: 6,
        baseAccuracy: 92,
        statBonuses: {
            ACC: 3
        }
    }
};
const ARMOR_CARDS = {
    leather_armor: {
        id: 'leather_armor',
        name: 'Leather Armor',
        slot: 'armor',
        statBonuses: {
            DEF: 3,
            SPD: -1
        },
        effects: []
    },
    iron_plate: {
        id: 'iron_plate',
        name: 'Iron Plate',
        slot: 'armor',
        statBonuses: {
            DEF: 6,
            MDF: 2,
            SPD: -3
        },
        effects: []
    },
    mage_robe: {
        id: 'mage_robe',
        name: 'Mage Robe',
        slot: 'armor',
        statBonuses: {
            MDF: 5,
            INT: 2
        },
        effects: []
    },
    scout_cloak: {
        id: 'scout_cloak',
        name: 'Scout Cloak',
        slot: 'armor',
        statBonuses: {
            SPD: 3,
            ACC: 2
        },
        effects: []
    }
};
const ACCESSORY_CARDS = {
    lucky_charm: {
        id: 'lucky_charm',
        name: 'Lucky Charm',
        slot: 'accessory',
        statBonuses: {
            LCK: 5
        },
        effects: []
    },
    warriors_ring: {
        id: 'warriors_ring',
        name: "Warrior's Ring",
        slot: 'accessory',
        statBonuses: {
            STR: 3,
            END: 2
        },
        effects: []
    },
    sages_pendant: {
        id: 'sages_pendant',
        name: "Sage's Pendant",
        slot: 'accessory',
        statBonuses: {
            INT: 3,
            SPI: 2
        },
        effects: []
    },
    swift_boots: {
        id: 'swift_boots',
        name: 'Swift Boots',
        slot: 'accessory',
        statBonuses: {
            SPD: 4,
            ACC: 1
        },
        effects: []
    }
};
const SUMMON_CARDS = {
    // Player A's summons
    gignen_warrior_a: {
        id: 'gignen_warrior_a',
        name: 'Gignen Warrior',
        cardType: 'summon',
        species: 'gignen',
        rarity: 'common',
        element: 'neutral',
        description: 'A versatile Gignen trained in the ways of the warrior.',
        requirements: [],
        pileDestination: 'removed',
        baseStats: {
            STR: 10,
            END: 8,
            DEF: 10,
            INT: 10,
            SPI: 8,
            MDF: 6,
            SPD: 7,
            ACC: 7,
            LCK: 10
        },
        growthRates: {
            STR: 'gradual',
            END: 'normal',
            DEF: 'normal',
            INT: 'steady',
            SPI: 'normal',
            MDF: 'steady',
            SPD: 'minimal',
            ACC: 'steady',
            LCK: 'exceptional'
        },
        equipment: {
            weapon: {
                ...WEAPONS.heirloom_sword,
                id: '034-heirloom_sword-Alpha'
            },
            offhand: null,
            armor: {
                ...ARMOR_CARDS.leather_armor,
                id: 'armor-warrior-a'
            },
            accessory: {
                ...ACCESSORY_CARDS.warriors_ring,
                id: 'acc-warrior-a'
            }
        },
        digitalSignature: 'sig-gignen-warrior-a'
    },
    gignen_scout_a: {
        id: 'gignen_scout_a',
        name: 'Gignen Scout',
        cardType: 'summon',
        species: 'gignen',
        rarity: 'common',
        element: 'neutral',
        description: 'A keen-eyed Gignen with natural aptitude for scouting.',
        requirements: [],
        pileDestination: 'removed',
        baseStats: {
            STR: 8,
            END: 10,
            DEF: 8,
            INT: 8,
            SPI: 9,
            MDF: 9,
            SPD: 12,
            ACC: 9,
            LCK: 12
        },
        growthRates: {
            STR: 'normal',
            END: 'gradual',
            DEF: 'normal',
            INT: 'normal',
            SPI: 'normal',
            MDF: 'normal',
            SPD: 'gradual',
            ACC: 'gradual',
            LCK: 'exceptional'
        },
        equipment: {
            weapon: {
                ...WEAPONS.hunting_bow,
                id: '037-hunting_bow-Alpha'
            },
            offhand: null,
            armor: {
                ...ARMOR_CARDS.scout_cloak,
                id: 'armor-scout-a'
            },
            accessory: {
                ...ACCESSORY_CARDS.swift_boots,
                id: 'acc-scout-a'
            }
        },
        digitalSignature: 'sig-gignen-scout-a'
    },
    gignen_magician_a: {
        id: 'gignen_magician_a',
        name: 'Gignen Magician',
        cardType: 'summon',
        species: 'gignen',
        rarity: 'common',
        element: 'neutral',
        description: 'A Gignen who has unlocked the secrets of magic.',
        requirements: [],
        pileDestination: 'removed',
        baseStats: {
            STR: 9,
            END: 8,
            DEF: 9,
            INT: 9,
            SPI: 8,
            MDF: 10,
            SPD: 10,
            ACC: 6,
            LCK: 12
        },
        growthRates: {
            STR: 'gradual',
            END: 'normal',
            DEF: 'minimal',
            INT: 'gradual',
            SPI: 'gradual',
            MDF: 'normal',
            SPD: 'normal',
            ACC: 'minimal',
            LCK: 'exceptional'
        },
        equipment: {
            weapon: {
                ...WEAPONS.apprentices_wand,
                id: '036-apprentices_wand-Alpha'
            },
            offhand: null,
            armor: {
                ...ARMOR_CARDS.mage_robe,
                id: 'armor-magician-a'
            },
            accessory: {
                ...ACCESSORY_CARDS.sages_pendant,
                id: 'acc-magician-a'
            }
        },
        digitalSignature: 'sig-gignen-magician-a'
    },
    // Player B's summons
    fae_magician_b: {
        id: 'fae_magician_b',
        name: 'Fae Magician',
        cardType: 'summon',
        species: 'fae',
        rarity: 'common',
        element: 'neutral',
        description: 'A graceful Fae with deep magical talent.',
        requirements: [],
        pileDestination: 'removed',
        baseStats: {
            STR: 8,
            END: 8,
            DEF: 10,
            INT: 12,
            SPI: 13,
            MDF: 11,
            SPD: 10,
            ACC: 7,
            LCK: 8
        },
        growthRates: {
            STR: 'normal',
            END: 'normal',
            DEF: 'normal',
            INT: 'gradual',
            SPI: 'gradual',
            MDF: 'normal',
            SPD: 'normal',
            ACC: 'gradual',
            LCK: 'normal'
        },
        equipment: {
            weapon: {
                ...WEAPONS.apprentices_wand,
                id: '035-apprentices_wand-Alpha'
            },
            offhand: null,
            armor: {
                ...ARMOR_CARDS.mage_robe,
                id: 'armor-magician-b'
            },
            accessory: {
                ...ACCESSORY_CARDS.lucky_charm,
                id: 'acc-magician-b'
            }
        },
        digitalSignature: 'sig-fae-magician-b'
    },
    stoneheart_warrior_b: {
        id: 'stoneheart_warrior_b',
        name: 'Stoneheart Warrior',
        cardType: 'summon',
        species: 'stoneheart',
        rarity: 'common',
        element: 'neutral',
        description: 'A stalwart Stoneheart built for battle.',
        requirements: [],
        pileDestination: 'removed',
        baseStats: {
            STR: 9,
            END: 7,
            DEF: 6,
            INT: 1,
            SPI: 6,
            MDF: 3,
            SPD: 4,
            ACC: 4,
            LCK: 6
        },
        growthRates: {
            STR: 'gradual',
            END: 'normal',
            DEF: 'normal',
            INT: 'normal',
            SPI: 'gradual',
            MDF: 'accelerated',
            SPD: 'normal',
            ACC: 'accelerated',
            LCK: 'steady'
        },
        equipment: {
            weapon: {
                ...WEAPONS.heirloom_sword,
                id: '038-heirloom_sword-Alpha'
            },
            offhand: null,
            armor: {
                ...ARMOR_CARDS.iron_plate,
                id: 'armor-warrior-b'
            },
            accessory: {
                ...ACCESSORY_CARDS.warriors_ring,
                id: 'acc-warrior-b'
            }
        },
        digitalSignature: 'sig-stoneheart-warrior-b'
    },
    wilderling_scout_b: {
        id: 'wilderling_scout_b',
        name: 'Wilderling Scout',
        cardType: 'summon',
        species: 'wilderling',
        rarity: 'common',
        element: 'neutral',
        description: 'A primal Wilderling with unmatched speed.',
        requirements: [],
        pileDestination: 'removed',
        baseStats: {
            STR: 12,
            END: 9,
            DEF: 7,
            INT: 6,
            SPI: 8,
            MDF: 5,
            SPD: 16,
            ACC: 13,
            LCK: 9
        },
        growthRates: {
            STR: 'steady',
            END: 'normal',
            DEF: 'normal',
            INT: 'accelerated',
            SPI: 'minimal',
            MDF: 'steady',
            SPD: 'exceptional',
            ACC: 'exceptional',
            LCK: 'accelerated'
        },
        equipment: {
            weapon: {
                ...WEAPONS.hunting_bow,
                id: '036-hunting_bow-Alpha'
            },
            offhand: null,
            armor: {
                ...ARMOR_CARDS.scout_cloak,
                id: 'armor-scout-b'
            },
            accessory: {
                ...ACCESSORY_CARDS.swift_boots,
                id: 'acc-scout-b'
            }
        },
        digitalSignature: 'sig-wilderling-scout-b'
    }
};
const ACTION_CARDS = {
    sharpened_blade: {
        id: 'sharpened_blade',
        name: 'Sharpened Blade',
        cardType: 'action',
        speed: 'action',
        element: 'neutral',
        description: 'Target Weapon equipped to a Warrior based Summon gains +10 Base Power.',
        requirements: [
            {
                type: 'role',
                roleFamily: 'warrior',
                description: 'Requires a Warrior summon in play'
            }
        ],
        pileDestination: 'recharge',
        effects: [
            {
                id: 'sharpened_blade_buff',
                type: 'buff',
                description: '+10 Base Power to target weapon',
                duration: 'permanent'
            }
        ],
        targetType: 'ally_summon'
    },
    healing_hands: {
        id: 'healing_hands',
        name: 'Healing Hands',
        cardType: 'action',
        speed: 'action',
        element: 'light',
        description: 'Heal target summon. Requires a Magician summon as caster.',
        requirements: [
            {
                type: 'role',
                roleFamily: 'magician',
                description: 'Requires a Magician summon in play'
            }
        ],
        pileDestination: 'discard',
        effects: [
            {
                id: 'healing_hands_heal',
                type: 'heal',
                description: 'Heal based on caster SPI',
                basePower: 40,
                canCrit: true,
                duration: 'instant'
            }
        ],
        targetType: 'ally_summon'
    },
    rush: {
        id: 'rush',
        name: 'Rush',
        cardType: 'action',
        speed: 'action',
        element: 'wind',
        description: 'Double target movement speed this turn, halve DEF until end of opponent next turn.',
        requirements: [],
        pileDestination: 'recharge',
        effects: [
            {
                id: 'rush_speed',
                type: 'buff',
                description: 'Double movement speed',
                duration: 'end_of_turn'
            },
            {
                id: 'rush_def_debuff',
                type: 'debuff',
                description: 'Halve DEF',
                duration: 'end_of_next_turn',
                statModifiers: {
                    DEF: -0.5
                }
            }
        ],
        targetType: 'ally_summon'
    },
    blast_bolt: {
        id: 'blast_bolt',
        name: 'Blast Bolt',
        cardType: 'action',
        speed: 'action',
        element: 'fire',
        description: 'Deal magical fire damage to target enemy summon.',
        requirements: [
            {
                type: 'role',
                roleFamily: 'magician',
                description: 'Requires a Magician summon in play'
            }
        ],
        pileDestination: 'discard',
        effects: [
            {
                id: 'blast_bolt_damage',
                type: 'damage',
                description: 'Magical fire damage',
                basePower: 60,
                damageType: 'magical',
                element: 'fire',
                canCrit: true,
                duration: 'instant'
            }
        ],
        targetType: 'enemy_summon'
    },
    tempest_slash: {
        id: 'tempest_slash',
        name: 'Tempest Slash',
        cardType: 'action',
        speed: 'action',
        element: 'wind',
        description: '+1 movement, next basic attack deals additional physical wind damage.',
        requirements: [],
        pileDestination: 'discard',
        effects: [
            {
                id: 'tempest_speed',
                type: 'buff',
                description: '+1 movement',
                duration: 'end_of_turn'
            },
            {
                id: 'tempest_damage',
                type: 'damage',
                description: 'Additional physical wind damage on next attack',
                basePower: 30,
                damageType: 'physical_melee',
                element: 'wind',
                canCrit: true,
                duration: 'end_of_turn'
            }
        ],
        targetType: 'ally_summon'
    },
    ensnare: {
        id: 'ensnare',
        name: 'Ensnare',
        cardType: 'action',
        speed: 'action',
        element: 'earth',
        description: 'Deal damage and potentially immobilize target. Requires Scout.',
        requirements: [
            {
                type: 'role',
                roleFamily: 'scout',
                description: 'Requires a Scout summon in play'
            }
        ],
        pileDestination: 'discard',
        effects: [
            {
                id: 'ensnare_damage',
                type: 'damage',
                description: 'Physical earth damage',
                basePower: 25,
                damageType: 'physical_melee',
                element: 'earth',
                canCrit: true,
                duration: 'instant'
            },
            {
                id: 'ensnare_immobilize',
                type: 'status',
                description: 'Immobilize (30% save chance)',
                duration: 'end_of_next_turn'
            }
        ],
        targetType: 'enemy_summon'
    },
    drain_touch: {
        id: 'drain_touch',
        name: 'Drain Touch',
        cardType: 'action',
        speed: 'action',
        element: 'dark',
        description: 'Deal magical damage and heal caster for 50% of damage dealt.',
        requirements: [
            {
                type: 'role',
                roleFamily: 'magician',
                description: 'Requires a Magician summon in play'
            }
        ],
        pileDestination: 'discard',
        effects: [
            {
                id: 'drain_touch_damage',
                type: 'damage',
                description: 'Magical dark damage + 50% lifesteal',
                basePower: 30,
                damageType: 'magical',
                element: 'dark',
                canCrit: true,
                duration: 'instant'
            }
        ],
        targetType: 'enemy_summon'
    },
    dual_shot: {
        id: 'dual_shot',
        name: 'Dual Shot',
        cardType: 'action',
        speed: 'action',
        element: 'neutral',
        description: 'Target summon can make two basic attacks this turn.',
        requirements: [],
        pileDestination: 'recharge',
        effects: [
            {
                id: 'dual_shot_extra',
                type: 'buff',
                description: 'Grants additional basic attack',
                duration: 'end_of_turn'
            }
        ],
        targetType: 'ally_summon'
    },
    life_alchemy: {
        id: 'life_alchemy',
        name: 'Life Alchemy',
        cardType: 'action',
        speed: 'action',
        element: 'dark',
        description: 'Deal 25% of target ally max HP as damage, heal caster for same amount.',
        requirements: [
            {
                type: 'role',
                roleFamily: 'magician',
                description: 'Requires a Magician summon in play'
            }
        ],
        pileDestination: 'discard',
        effects: [
            {
                id: 'life_alchemy_transfer',
                type: 'special',
                description: '25% max HP transfer',
                duration: 'instant'
            }
        ],
        targetType: 'ally_summon'
    },
    spell_recall: {
        id: 'spell_recall',
        name: 'Spell Recall',
        cardType: 'action',
        speed: 'action',
        element: 'neutral',
        description: 'Return a card from your discard pile to your hand.',
        requirements: [],
        pileDestination: 'discard',
        effects: [
            {
                id: 'spell_recall_effect',
                type: 'special',
                description: 'Retrieve card from discard',
                duration: 'instant'
            }
        ],
        targetType: 'self_summon'
    },
    adventurous_spirit: {
        id: 'adventurous_spirit',
        name: 'Adventurous Spirit',
        cardType: 'action',
        speed: 'action',
        element: 'wind',
        description: 'Target summon gains +2 movement speed this turn.',
        requirements: [],
        pileDestination: 'recharge',
        effects: [
            {
                id: 'adventurous_speed',
                type: 'buff',
                description: '+2 movement speed',
                duration: 'end_of_turn'
            }
        ],
        targetType: 'ally_summon'
    },
    magicians_sanctum: {
        id: 'magicians_sanctum',
        name: "Magician's Sanctum",
        cardType: 'action',
        speed: 'action',
        element: 'light',
        description: 'Add half DEF to MDF or half MDF to DEF when calculating damage. Ends if summon moves.',
        requirements: [
            {
                type: 'role',
                roleFamily: 'magician',
                description: 'Requires a Magician summon'
            }
        ],
        pileDestination: 'discard',
        effects: [
            {
                id: 'sanctum_defense',
                type: 'buff',
                description: 'Defensive stat mixing',
                duration: 'end_of_next_turn'
            }
        ],
        targetType: 'ally_summon'
    },
    obliterate: {
        id: 'obliterate',
        name: 'Obliterate',
        cardType: 'action',
        speed: 'action',
        element: 'dark',
        description: 'Deal massive magical dark damage to target enemy summon.',
        requirements: [
            {
                type: 'role',
                roleFamily: 'magician',
                description: 'Requires a Magician summon'
            }
        ],
        pileDestination: 'discard',
        effects: [
            {
                id: 'obliterate_damage',
                type: 'damage',
                description: 'Massive magical dark damage',
                basePower: 100,
                damageType: 'magical',
                element: 'dark',
                canCrit: true,
                duration: 'instant'
            }
        ],
        targetType: 'enemy_summon'
    },
    stonewardens_command: {
        id: 'stonewardens_command',
        name: "Stonewarden's Command",
        cardType: 'action',
        speed: 'action',
        element: 'earth',
        description: 'All allied Stoneheart summons gain +3 DEF until end of turn.',
        requirements: [],
        pileDestination: 'recharge',
        effects: [
            {
                id: 'stonewarden_buff',
                type: 'buff',
                description: '+3 DEF to Stoneheart allies',
                duration: 'end_of_turn',
                statModifiers: {
                    DEF: 3
                }
            }
        ],
        targetType: 'ally_summon'
    },
    // ─── New Cards ────────────────────────────────────────────────────────────
    fireball: {
        id: 'fireball',
        name: 'Fireball',
        cardType: 'action',
        speed: 'action',
        element: 'fire',
        description: 'Deal heavy magical fire damage to target enemy summon.',
        requirements: [
            {
                type: 'role',
                roleFamily: 'magician',
                description: 'Requires a Magician summon'
            }
        ],
        pileDestination: 'discard',
        effects: [
            {
                id: 'fireball_damage',
                type: 'damage',
                description: 'Heavy magical fire damage',
                basePower: 80,
                damageType: 'magical',
                element: 'fire',
                canCrit: true,
                duration: 'instant'
            }
        ],
        targetType: 'enemy_summon'
    },
    shield_bash: {
        id: 'shield_bash',
        name: 'Shield Bash',
        cardType: 'action',
        speed: 'action',
        element: 'earth',
        description: 'Deal physical damage and reduce target DEF by 3 until end of turn.',
        requirements: [
            {
                type: 'role',
                roleFamily: 'warrior',
                description: 'Requires a Warrior summon'
            }
        ],
        pileDestination: 'recharge',
        effects: [
            {
                id: 'shield_bash_damage',
                type: 'damage',
                description: 'Physical earth damage',
                basePower: 20,
                damageType: 'physical_melee',
                element: 'earth',
                canCrit: true,
                duration: 'instant'
            },
            {
                id: 'shield_bash_debuff',
                type: 'debuff',
                description: '-3 DEF until end of turn',
                duration: 'end_of_turn',
                statModifiers: {
                    DEF: -3
                }
            }
        ],
        targetType: 'enemy_summon'
    },
    quick_strike: {
        id: 'quick_strike',
        name: 'Quick Strike',
        cardType: 'action',
        speed: 'action',
        element: 'wind',
        description: 'Deal physical damage based on attacker SPD.',
        requirements: [
            {
                type: 'role',
                roleFamily: 'scout',
                description: 'Requires a Scout summon'
            }
        ],
        pileDestination: 'recharge',
        effects: [
            {
                id: 'quick_strike_damage',
                type: 'damage',
                description: 'Physical wind damage (SPD-based)',
                basePower: 40,
                damageType: 'physical_melee',
                element: 'wind',
                canCrit: true,
                duration: 'instant'
            }
        ],
        targetType: 'enemy_summon'
    },
    mend_wounds: {
        id: 'mend_wounds',
        name: 'Mend Wounds',
        cardType: 'action',
        speed: 'action',
        element: 'light',
        description: 'Heal target ally summon. Any role can use.',
        requirements: [],
        pileDestination: 'recharge',
        effects: [
            {
                id: 'mend_heal',
                type: 'heal',
                description: 'Moderate healing',
                basePower: 30,
                canCrit: true,
                duration: 'instant'
            }
        ],
        targetType: 'ally_summon'
    },
    battle_cry: {
        id: 'battle_cry',
        name: 'Battle Cry',
        cardType: 'action',
        speed: 'action',
        element: 'neutral',
        description: 'Target ally gains +5 STR and +5 DEF until end of turn.',
        requirements: [
            {
                type: 'role',
                roleFamily: 'warrior',
                description: 'Requires a Warrior summon'
            }
        ],
        pileDestination: 'recharge',
        effects: [
            {
                id: 'battle_cry_buff',
                type: 'buff',
                description: '+5 STR, +5 DEF until end of turn',
                duration: 'end_of_turn',
                statModifiers: {
                    STR: 5,
                    DEF: 5
                }
            }
        ],
        targetType: 'ally_summon'
    },
    shadow_step: {
        id: 'shadow_step',
        name: 'Shadow Step',
        cardType: 'action',
        speed: 'action',
        element: 'dark',
        description: 'Target Scout gains +4 movement this turn.',
        requirements: [
            {
                type: 'role',
                roleFamily: 'scout',
                description: 'Requires a Scout summon'
            }
        ],
        pileDestination: 'recharge',
        effects: [
            {
                id: 'shadow_step_buff',
                type: 'buff',
                description: '+4 movement this turn',
                duration: 'end_of_turn'
            }
        ],
        targetType: 'ally_summon'
    },
    // ─── More Action Cards ──────────────────
    power_surge: {
        id: 'power_surge',
        name: 'Power Surge',
        cardType: 'action',
        speed: 'action',
        element: 'fire',
        description: 'Deal damage equal to 2x target ally STR to target enemy. Costs 20% of ally HP.',
        requirements: [],
        pileDestination: 'discard',
        effects: [
            {
                id: 'power_surge_damage',
                type: 'damage',
                description: 'Heavy STR-based damage at HP cost',
                basePower: 70,
                damageType: 'physical_melee',
                element: 'fire',
                canCrit: true,
                duration: 'instant'
            }
        ],
        targetType: 'enemy_summon'
    },
    second_wind: {
        id: 'second_wind',
        name: 'Second Wind',
        cardType: 'action',
        speed: 'action',
        element: 'wind',
        description: 'Restore target ally to 50% HP. Can only target summons below 50% HP.',
        requirements: [],
        pileDestination: 'discard',
        effects: [
            {
                id: 'second_wind_heal',
                type: 'heal',
                description: 'Restore to 50% HP',
                basePower: 80,
                canCrit: false,
                duration: 'instant'
            }
        ],
        targetType: 'ally_summon'
    },
    ice_lance: {
        id: 'ice_lance',
        name: 'Ice Lance',
        cardType: 'action',
        speed: 'action',
        element: 'water',
        description: 'Deal magical water damage. Higher damage against fire-element targets.',
        requirements: [
            {
                type: 'role',
                roleFamily: 'magician',
                description: 'Requires a Magician summon'
            }
        ],
        pileDestination: 'discard',
        effects: [
            {
                id: 'ice_lance_damage',
                type: 'damage',
                description: 'Magical water damage',
                basePower: 55,
                damageType: 'magical',
                element: 'water',
                canCrit: true,
                duration: 'instant'
            }
        ],
        targetType: 'enemy_summon'
    },
    earth_wall: {
        id: 'earth_wall',
        name: 'Earth Wall',
        cardType: 'action',
        speed: 'action',
        element: 'earth',
        description: 'Target ally gains +8 DEF and +4 MDF until end of opponent next turn.',
        requirements: [],
        pileDestination: 'recharge',
        effects: [
            {
                id: 'earth_wall_buff',
                type: 'buff',
                description: '+8 DEF, +4 MDF defensive wall',
                duration: 'end_of_next_turn',
                statModifiers: {
                    DEF: 8,
                    MDF: 4
                }
            }
        ],
        targetType: 'ally_summon'
    },
    precision_shot: {
        id: 'precision_shot',
        name: 'Precision Shot',
        cardType: 'action',
        speed: 'action',
        element: 'neutral',
        description: 'Deal ranged damage with +20% accuracy bonus. Requires Scout.',
        requirements: [
            {
                type: 'role',
                roleFamily: 'scout',
                description: 'Requires a Scout summon'
            }
        ],
        pileDestination: 'recharge',
        effects: [
            {
                id: 'precision_damage',
                type: 'damage',
                description: 'Precise ranged damage',
                basePower: 45,
                damageType: 'physical_ranged',
                element: 'neutral',
                canCrit: true,
                duration: 'instant'
            }
        ],
        targetType: 'enemy_summon'
    },
    rally_cry: {
        id: 'rally_cry',
        name: 'Rally Cry',
        cardType: 'action',
        speed: 'action',
        element: 'light',
        description: 'All your summons gain +2 STR and +2 movement this turn.',
        requirements: [],
        pileDestination: 'recharge',
        effects: [
            {
                id: 'rally_buff',
                type: 'buff',
                description: '+2 STR, +2 movement to all allies',
                duration: 'end_of_turn',
                statModifiers: {
                    STR: 2
                }
            }
        ],
        targetType: 'ally_summon'
    },
    dark_bargain: {
        id: 'dark_bargain',
        name: 'Dark Bargain',
        cardType: 'action',
        speed: 'action',
        element: 'dark',
        description: 'Draw 3 cards. Lose 15% of target ally summon max HP.',
        requirements: [],
        pileDestination: 'discard',
        effects: [
            {
                id: 'bargain_draw',
                type: 'special',
                description: 'Draw 3 cards at HP cost',
                duration: 'instant'
            }
        ],
        targetType: 'ally_summon'
    },
    thunder_clap: {
        id: 'thunder_clap',
        name: 'Thunder Clap',
        cardType: 'action',
        speed: 'action',
        element: 'wind',
        description: 'Deal moderate wind damage. Always hits (cannot miss).',
        requirements: [
            {
                type: 'role',
                roleFamily: 'warrior',
                description: 'Requires a Warrior summon'
            }
        ],
        pileDestination: 'discard',
        effects: [
            {
                id: 'thunder_damage',
                type: 'damage',
                description: 'Guaranteed-hit wind damage',
                basePower: 35,
                damageType: 'physical_melee',
                element: 'wind',
                canCrit: true,
                duration: 'instant'
            }
        ],
        targetType: 'enemy_summon'
    },
    mind_spike: {
        id: 'mind_spike',
        name: 'Mind Spike',
        cardType: 'action',
        speed: 'action',
        element: 'dark',
        description: 'Deal magical dark damage based on target MDF (lower MDF = more damage).',
        requirements: [
            {
                type: 'role',
                roleFamily: 'magician',
                description: 'Requires a Magician summon'
            }
        ],
        pileDestination: 'discard',
        effects: [
            {
                id: 'mind_spike_damage',
                type: 'damage',
                description: 'Magical dark damage',
                basePower: 65,
                damageType: 'magical',
                element: 'dark',
                canCrit: true,
                duration: 'instant'
            }
        ],
        targetType: 'enemy_summon'
    },
    vital_strike: {
        id: 'vital_strike',
        name: 'Vital Strike',
        cardType: 'action',
        speed: 'action',
        element: 'neutral',
        description: 'Deal physical damage with bonus crit chance. Requires Scout.',
        requirements: [
            {
                type: 'role',
                roleFamily: 'scout',
                description: 'Requires a Scout summon'
            }
        ],
        pileDestination: 'recharge',
        effects: [
            {
                id: 'vital_damage',
                type: 'damage',
                description: 'Physical damage with high crit chance',
                basePower: 50,
                damageType: 'physical_melee',
                element: 'neutral',
                canCrit: true,
                duration: 'instant'
            }
        ],
        targetType: 'enemy_summon'
    }
};
const BUILDING_CARDS = {
    gignen_country: {
        id: 'gignen_country',
        name: 'Gignen Country',
        cardType: 'building',
        element: 'neutral',
        description: 'While occupying, all Gignen summons you control receive an additional level whenever they level up.',
        requirements: [],
        pileDestination: 'discard',
        dimensions: {
            width: 3,
            height: 2
        },
        effects: [
            {
                id: 'gignen_country_level',
                type: 'buff',
                description: 'Gignen summons gain double level-ups',
                duration: 'permanent'
            }
        ],
        isTrap: false
    },
    dark_altar: {
        id: 'dark_altar',
        name: 'Dark Altar',
        cardType: 'building',
        element: 'dark',
        description: 'Destroyed at end of turn, destroying all units on its spaces. If a summon is destroyed, target summon levels to 20.',
        requirements: [],
        pileDestination: 'discard',
        dimensions: {
            width: 2,
            height: 2
        },
        effects: [
            {
                id: 'dark_altar_destruction',
                type: 'special',
                description: 'Self-destructs at end of turn, destroying occupying units',
                duration: 'end_of_turn'
            }
        ],
        isTrap: false
    },
    training_grounds: {
        id: 'training_grounds',
        name: 'Training Grounds',
        cardType: 'building',
        element: 'neutral',
        description: 'Summons occupying this building gain +3 STR and +3 DEF while on it.',
        requirements: [],
        pileDestination: 'discard',
        dimensions: {
            width: 2,
            height: 2
        },
        effects: [
            {
                id: 'training_buff',
                type: 'buff',
                description: '+3 STR, +3 DEF while occupying',
                duration: 'permanent',
                statModifiers: {
                    STR: 3,
                    DEF: 3
                }
            }
        ],
        isTrap: false
    },
    healing_spring: {
        id: 'healing_spring',
        name: 'Healing Spring',
        cardType: 'building',
        element: 'water',
        description: 'Summons occupying this building heal 10 HP at the start of each turn.',
        requirements: [],
        pileDestination: 'discard',
        dimensions: {
            width: 2,
            height: 1
        },
        effects: [
            {
                id: 'spring_heal',
                type: 'heal',
                description: 'Heal 10 HP per turn while occupying',
                basePower: 10,
                duration: 'permanent'
            }
        ],
        isTrap: false
    },
    spike_trap: {
        id: 'spike_trap',
        name: 'Spike Trap',
        cardType: 'building',
        element: 'earth',
        description: 'Played face-down. When an opponent summon moves onto this space, deal 30 damage.',
        requirements: [],
        pileDestination: 'discard',
        dimensions: {
            width: 1,
            height: 1
        },
        effects: [
            {
                id: 'spike_damage',
                type: 'damage',
                description: 'Deal 30 damage when triggered',
                basePower: 30,
                duration: 'instant'
            }
        ],
        isTrap: true
    }
};
const QUEST_CARDS = {
    nearwood_forest_expedition: {
        id: 'nearwood_forest_expedition',
        name: 'Nearwood Forest Expedition',
        cardType: 'quest',
        element: 'neutral',
        description: 'Control a Warrior, Scout, or Magician summon under level 10. Reward: Target gains 2 levels.',
        requirements: [],
        pileDestination: 'recharge',
        objective: 'Control target Warrior, Scout, or Magician based Summon whose current level is under 10.',
        rewardEffects: [
            {
                id: 'nearwood_reward',
                type: 'buff',
                description: 'Target Summon gains 2 levels',
                duration: 'instant'
            }
        ],
        vpReward: 0,
        activatedBy: 'owner'
    },
    trial_of_strength: {
        id: 'trial_of_strength',
        name: 'Trial of Strength',
        cardType: 'quest',
        element: 'fire',
        description: 'Control a Warrior summon level 8+. Reward: 1 VP and +3 STR permanently.',
        requirements: [
            {
                type: 'role',
                roleFamily: 'warrior',
                description: 'Requires a Warrior summon'
            }
        ],
        pileDestination: 'discard',
        objective: 'Control a Warrior-family summon at level 8 or higher.',
        rewardEffects: [
            {
                id: 'trial_strength_reward',
                type: 'buff',
                description: '+3 STR permanently',
                duration: 'permanent',
                statModifiers: {
                    STR: 3
                }
            }
        ],
        vpReward: 1,
        activatedBy: 'owner'
    },
    arcane_research: {
        id: 'arcane_research',
        name: 'Arcane Research',
        cardType: 'quest',
        element: 'light',
        description: 'Control a Magician summon. Reward: Draw 2 cards.',
        requirements: [
            {
                type: 'role',
                roleFamily: 'magician',
                description: 'Requires a Magician summon'
            }
        ],
        pileDestination: 'recharge',
        objective: 'Control a Magician-family summon.',
        rewardEffects: [
            {
                id: 'arcane_research_reward',
                type: 'special',
                description: 'Draw 2 cards',
                duration: 'instant'
            }
        ],
        vpReward: 0,
        activatedBy: 'owner'
    },
    scouting_mission: {
        id: 'scouting_mission',
        name: 'Scouting Mission',
        cardType: 'quest',
        element: 'wind',
        description: 'Control a Scout summon level 7+. Reward: Target gains +5 SPD and +5 ACC permanently.',
        requirements: [
            {
                type: 'role',
                roleFamily: 'scout',
                description: 'Requires a Scout summon'
            }
        ],
        pileDestination: 'discard',
        objective: 'Control a Scout-family summon at level 7 or higher.',
        rewardEffects: [
            {
                id: 'scouting_reward',
                type: 'buff',
                description: '+5 SPD, +5 ACC permanently',
                duration: 'permanent',
                statModifiers: {
                    SPD: 5,
                    ACC: 5
                }
            }
        ],
        vpReward: 0,
        activatedBy: 'owner'
    },
    arena_champion: {
        id: 'arena_champion',
        name: 'Arena Champion',
        cardType: 'quest',
        element: 'fire',
        description: 'Control a summon at level 12+. Reward: 1 VP and +5 STR permanently.',
        requirements: [],
        pileDestination: 'discard',
        objective: 'Control a summon at level 12 or higher.',
        rewardEffects: [
            {
                id: 'arena_reward',
                type: 'buff',
                description: '+5 STR permanently',
                duration: 'permanent',
                statModifiers: {
                    STR: 5
                }
            }
        ],
        vpReward: 1,
        activatedBy: 'owner'
    },
    territorial_claim: {
        id: 'territorial_claim',
        name: 'Territorial Claim',
        cardType: 'quest',
        element: 'earth',
        description: 'Have 3 summons on the board. Reward: 1 VP.',
        requirements: [],
        pileDestination: 'discard',
        objective: 'Control 3 summons simultaneously.',
        rewardEffects: [],
        vpReward: 1,
        activatedBy: 'owner'
    }
};
const COUNTER_CARDS = {
    dramatic_return: {
        id: 'dramatic_return',
        name: 'Dramatic Return!',
        cardType: 'counter',
        element: 'light',
        description: 'When a summon is defeated, return it to its owner territory with 10% HP.',
        requirements: [],
        pileDestination: 'discard',
        triggerCondition: 'summon_defeated',
        effects: [
            {
                id: 'dramatic_return_revive',
                type: 'special',
                description: 'Return defeated summon with 10% HP',
                duration: 'instant'
            }
        ]
    },
    graverobbing: {
        id: 'graverobbing',
        name: 'Graverobbing',
        cardType: 'counter',
        element: 'dark',
        description: 'Nullify Victory Point gain from defeating a summon. Discard a card to pay cost.',
        requirements: [],
        pileDestination: 'discard',
        triggerCondition: 'victory_point_gained',
        effects: [
            {
                id: 'graverobbing_nullify',
                type: 'special',
                description: 'Nullify VP gain',
                duration: 'instant'
            }
        ]
    },
    iron_will: {
        id: 'iron_will',
        name: 'Iron Will',
        cardType: 'counter',
        element: 'earth',
        description: 'When your summon would be defeated, it survives with 1 HP instead.',
        requirements: [],
        pileDestination: 'discard',
        triggerCondition: 'summon_defeated',
        effects: [
            {
                id: 'iron_will_survive',
                type: 'special',
                description: 'Survive defeat with 1 HP',
                duration: 'instant'
            }
        ]
    },
    mirror_shield: {
        id: 'mirror_shield',
        name: 'Mirror Shield',
        cardType: 'counter',
        element: 'light',
        description: 'When your summon is targeted by a spell, reflect 50% of the damage back.',
        requirements: [],
        pileDestination: 'discard',
        triggerCondition: 'summon_defeated',
        effects: [
            {
                id: 'mirror_reflect',
                type: 'damage',
                description: 'Reflect 50% spell damage',
                duration: 'instant'
            }
        ]
    }
};
const REACTION_CARDS = {
    quick_dodge: {
        id: 'quick_dodge',
        name: 'Quick Dodge',
        cardType: 'reaction',
        element: 'wind',
        description: 'Reduce incoming attack damage by 50%. Can be played from hand.',
        requirements: [],
        pileDestination: 'recharge',
        effects: [
            {
                id: 'dodge_reduce',
                type: 'buff',
                description: 'Reduce incoming damage by 50%',
                duration: 'instant'
            }
        ]
    },
    arcane_barrier: {
        id: 'arcane_barrier',
        name: 'Arcane Barrier',
        cardType: 'reaction',
        element: 'light',
        description: 'Absorb up to 30 magical damage this turn.',
        requirements: [
            {
                type: 'role',
                roleFamily: 'magician',
                description: 'Requires a Magician summon'
            }
        ],
        pileDestination: 'recharge',
        effects: [
            {
                id: 'barrier_absorb',
                type: 'buff',
                description: 'Absorb 30 magical damage',
                duration: 'end_of_turn'
            }
        ]
    },
    vengeance_strike: {
        id: 'vengeance_strike',
        name: 'Vengeance Strike',
        cardType: 'reaction',
        element: 'fire',
        description: 'When your summon takes damage, deal 20 fire damage back to the attacker.',
        requirements: [],
        pileDestination: 'recharge',
        effects: [
            {
                id: 'vengeance_damage',
                type: 'damage',
                description: '20 fire damage to attacker',
                basePower: 20,
                damageType: 'magical',
                element: 'fire',
                duration: 'instant'
            }
        ]
    }
};
const ADVANCE_CARDS = {
    berserker_rage: {
        id: 'berserker_rage',
        name: 'Berserker Rage',
        cardType: 'advance',
        advanceType: 'role_change',
        element: 'neutral',
        description: 'Advance a Warrior (level 10+) to Berserker.',
        requirements: [
            {
                type: 'role',
                roleId: 'warrior',
                description: 'Target must be a Warrior'
            },
            {
                type: 'level',
                minLevel: 10,
                description: 'Target must be level 10+'
            }
        ],
        pileDestination: 'discard',
        targetRole: 'berserker'
    },
    shadow_pact: {
        id: 'shadow_pact',
        name: 'Shadow Pact',
        cardType: 'advance',
        advanceType: 'role_change',
        element: 'dark',
        description: 'Advance a Magician to Warlock.',
        requirements: [
            {
                type: 'role',
                roleId: 'magician',
                description: 'Target must be a Magician'
            }
        ],
        pileDestination: 'discard',
        targetRole: 'warlock'
    },
    alrecht_barkstep: {
        id: 'alrecht_barkstep',
        name: 'Alrecht Barkstep, Scoutmaster',
        cardType: 'advance',
        advanceType: 'named_summon',
        element: 'neutral',
        description: 'Transform a level 10+ Scout into Alrecht Barkstep, Scoutmaster. Gains unique action "Follow Me!"',
        requirements: [
            {
                type: 'role',
                roleFamily: 'scout',
                description: 'Target must be Scout-based'
            },
            {
                type: 'level',
                minLevel: 10,
                description: 'Target must be level 10+'
            }
        ],
        pileDestination: 'discard',
        targetRole: 'rogue',
        namedSummonName: 'Alrecht Barkstep, Scoutmaster',
        namedSummonStatOverrides: {},
        namedSummonGrowthOverrides: {
            STR: 'gradual',
            END: 'normal',
            DEF: 'steady',
            INT: 'minimal',
            SPI: 'minimal',
            MDF: 'steady',
            SPD: 'accelerated',
            ACC: 'exceptional',
            LCK: 'accelerated'
        },
        uniqueActionCards: [
            {
                id: 'follow_me',
                name: 'Follow Me!',
                cardType: 'action',
                speed: 'action',
                element: 'neutral',
                description: 'Move target ally summon to a space adjacent to the caster, ignoring immobilize.',
                requirements: [],
                pileDestination: 'recharge',
                effects: [
                    {
                        id: 'follow_me_move',
                        type: 'movement',
                        description: 'Teleport target adjacent to caster',
                        duration: 'instant'
                    }
                ],
                targetType: 'ally_summon'
            }
        ]
    },
    // ─── Tier 2 Advance Cards ──────────────
    knights_oath: {
        id: 'knights_oath',
        name: "Knight's Oath",
        cardType: 'advance',
        advanceType: 'role_change',
        element: 'neutral',
        description: 'Advance a Warrior (level 7+) to Knight. High DEF and END.',
        requirements: [
            {
                type: 'role',
                roleId: 'warrior',
                description: 'Target must be a Warrior'
            },
            {
                type: 'level',
                minLevel: 7,
                description: 'Target must be level 7+'
            }
        ],
        pileDestination: 'discard',
        targetRole: 'knight'
    },
    rogues_shadow: {
        id: 'rogues_shadow',
        name: "Rogue's Shadow",
        cardType: 'advance',
        advanceType: 'role_change',
        element: 'dark',
        description: 'Advance a Scout (level 7+) to Rogue. High SPD and LCK.',
        requirements: [
            {
                type: 'role',
                roleId: 'scout',
                description: 'Target must be a Scout'
            },
            {
                type: 'level',
                minLevel: 7,
                description: 'Target must be level 7+'
            }
        ],
        pileDestination: 'discard',
        targetRole: 'rogue'
    },
    elemental_focus: {
        id: 'elemental_focus',
        name: 'Elemental Focus',
        cardType: 'advance',
        advanceType: 'role_change',
        element: 'fire',
        description: 'Advance a Magician (level 7+) to Elemental Mage. High INT.',
        requirements: [
            {
                type: 'role',
                roleId: 'magician',
                description: 'Target must be a Magician'
            },
            {
                type: 'level',
                minLevel: 7,
                description: 'Target must be level 7+'
            }
        ],
        pileDestination: 'discard',
        targetRole: 'elemental_mage'
    },
    assassins_creed: {
        id: 'assassins_creed',
        name: "Assassin's Creed",
        cardType: 'advance',
        advanceType: 'role_change',
        element: 'dark',
        description: 'Advance a Rogue (level 12+) to Assassin. Tier 3 — devastating crits.',
        requirements: [
            {
                type: 'role',
                roleId: 'rogue',
                description: 'Target must be a Rogue'
            },
            {
                type: 'level',
                minLevel: 12,
                description: 'Target must be level 12+'
            }
        ],
        pileDestination: 'discard',
        targetRole: 'assassin'
    },
    explorers_path: {
        id: 'explorers_path',
        name: "Explorer's Path",
        cardType: 'advance',
        advanceType: 'role_change',
        element: 'wind',
        description: 'Advance a Scout (level 7+) to Explorer. Balanced SPD and END.',
        requirements: [
            {
                type: 'role',
                roleId: 'scout',
                description: 'Target must be a Scout'
            },
            {
                type: 'level',
                minLevel: 7,
                description: 'Target must be level 7+'
            }
        ],
        pileDestination: 'discard',
        targetRole: 'explorer'
    },
    red_mage_oath: {
        id: 'red_mage_oath',
        name: 'Red Mage Oath',
        cardType: 'advance',
        advanceType: 'role_change',
        element: 'fire',
        description: 'Advance a Magician (level 7+) to Red Mage. Balanced INT and STR.',
        requirements: [
            {
                type: 'role',
                roleId: 'magician',
                description: 'Target must be a Magician'
            },
            {
                type: 'level',
                minLevel: 7,
                description: 'Target must be level 7+'
            }
        ],
        pileDestination: 'discard',
        targetRole: 'red_mage'
    },
    light_mage_prayer: {
        id: 'light_mage_prayer',
        name: 'Light Mage Prayer',
        cardType: 'advance',
        advanceType: 'role_change',
        element: 'light',
        description: 'Advance a Magician (level 7+) to Light Mage. High SPI and healing.',
        requirements: [
            {
                type: 'role',
                roleId: 'magician',
                description: 'Target must be a Magician'
            },
            {
                type: 'level',
                minLevel: 7,
                description: 'Target must be level 7+'
            }
        ],
        pileDestination: 'discard',
        targetRole: 'light_mage'
    },
    dark_mage_pact: {
        id: 'dark_mage_pact',
        name: 'Dark Mage Pact',
        cardType: 'advance',
        advanceType: 'role_change',
        element: 'dark',
        description: 'Advance a Magician (level 7+) to Dark Mage. High INT and LCK.',
        requirements: [
            {
                type: 'role',
                roleId: 'magician',
                description: 'Target must be a Magician'
            },
            {
                type: 'level',
                minLevel: 7,
                description: 'Target must be level 7+'
            }
        ],
        pileDestination: 'discard',
        targetRole: 'dark_mage'
    },
    berserker_fury: {
        id: 'berserker_fury',
        name: 'Berserker Fury',
        cardType: 'advance',
        advanceType: 'role_change',
        element: 'fire',
        description: 'Advance a Warrior (level 10+) to Berserker. Massive STR, reduced DEF.',
        requirements: [
            {
                type: 'role',
                roleId: 'warrior',
                description: 'Target must be a Warrior'
            },
            {
                type: 'level',
                minLevel: 10,
                description: 'Target must be level 10+'
            }
        ],
        pileDestination: 'discard',
        targetRole: 'berserker'
    },
    lumina_starweaver: {
        id: 'lumina_starweaver',
        name: 'Lumina Starweaver, Archmagus',
        cardType: 'advance',
        advanceType: 'named_summon',
        element: 'light',
        description: 'Transform a level 12+ Elemental Mage into Lumina Starweaver. Gains "Starfall" unique action.',
        requirements: [
            {
                type: 'role',
                roleId: 'elemental_mage',
                description: 'Target must be Elemental Mage'
            },
            {
                type: 'level',
                minLevel: 12,
                description: 'Target must be level 12+'
            }
        ],
        pileDestination: 'discard',
        targetRole: 'sorcerer',
        namedSummonName: 'Lumina Starweaver, Archmagus',
        namedSummonGrowthOverrides: {
            STR: 'minimal',
            END: 'normal',
            DEF: 'steady',
            INT: 'exceptional',
            SPI: 'accelerated',
            MDF: 'gradual',
            SPD: 'normal',
            ACC: 'gradual',
            LCK: 'gradual'
        },
        uniqueActionCards: [
            {
                id: 'starfall',
                name: 'Starfall',
                cardType: 'action',
                speed: 'action',
                element: 'light',
                description: 'Deal massive magical light damage. Heals caster for 25% of damage dealt.',
                requirements: [],
                pileDestination: 'recharge',
                effects: [
                    {
                        id: 'starfall_damage',
                        type: 'damage',
                        description: 'Massive magical light damage + lifesteal',
                        basePower: 90,
                        damageType: 'magical',
                        element: 'light',
                        canCrit: true,
                        duration: 'instant'
                    }
                ],
                targetType: 'enemy_summon'
            }
        ]
    },
    ironhide_sentinel: {
        id: 'ironhide_sentinel',
        name: 'Ironhide, the Unbreakable',
        cardType: 'advance',
        advanceType: 'named_summon',
        element: 'earth',
        description: 'Transform a level 12+ Knight into Ironhide. Gains "Fortress Stance" unique action.',
        requirements: [
            {
                type: 'role',
                roleId: 'knight',
                description: 'Target must be Knight'
            },
            {
                type: 'level',
                minLevel: 12,
                description: 'Target must be level 12+'
            }
        ],
        pileDestination: 'discard',
        targetRole: 'sentinel',
        namedSummonName: 'Ironhide, the Unbreakable',
        namedSummonGrowthOverrides: {
            STR: 'gradual',
            END: 'exceptional',
            DEF: 'exceptional',
            INT: 'minimal',
            SPI: 'steady',
            MDF: 'gradual',
            SPD: 'minimal',
            ACC: 'normal',
            LCK: 'normal'
        },
        uniqueActionCards: [
            {
                id: 'fortress_stance',
                name: 'Fortress Stance',
                cardType: 'action',
                speed: 'action',
                element: 'earth',
                description: 'Double DEF and MDF until end of opponent next turn. Cannot move.',
                requirements: [],
                pileDestination: 'recharge',
                effects: [
                    {
                        id: 'fortress_buff',
                        type: 'buff',
                        description: '2x DEF and MDF, immobilized',
                        duration: 'end_of_next_turn'
                    }
                ],
                targetType: 'ally_summon'
            }
        ]
    }
};
function createPlayerADeck() {
    const mainDeck = [
        ACTION_CARDS.sharpened_blade,
        ACTION_CARDS.healing_hands,
        ACTION_CARDS.rush,
        ACTION_CARDS.rush,
        ACTION_CARDS.tempest_slash,
        ACTION_CARDS.adventurous_spirit,
        ACTION_CARDS.battle_cry,
        ACTION_CARDS.mend_wounds,
        ACTION_CARDS.shield_bash,
        ACTION_CARDS.second_wind,
        ACTION_CARDS.earth_wall,
        ACTION_CARDS.rally_cry,
        BUILDING_CARDS.gignen_country,
        BUILDING_CARDS.healing_spring,
        QUEST_CARDS.nearwood_forest_expedition,
        QUEST_CARDS.nearwood_forest_expedition,
        QUEST_CARDS.trial_of_strength,
        COUNTER_CARDS.iron_will,
        COUNTER_CARDS.dramatic_return,
        REACTION_CARDS.quick_dodge
    ];
    return {
        summonSlots: [
            {
                summon: SUMMON_CARDS.gignen_warrior_a,
                roleId: 'warrior'
            },
            {
                summon: SUMMON_CARDS.gignen_scout_a,
                roleId: 'scout'
            },
            {
                summon: SUMMON_CARDS.gignen_magician_a,
                roleId: 'magician'
            }
        ],
        mainDeck,
        advanceDeck: [
            ADVANCE_CARDS.berserker_rage,
            ADVANCE_CARDS.knights_oath,
            ADVANCE_CARDS.alrecht_barkstep,
            ADVANCE_CARDS.ironhide_sentinel,
            ADVANCE_CARDS.explorers_path,
            ADVANCE_CARDS.light_mage_prayer
        ]
    };
}
function createPlayerBDeck() {
    const mainDeck = [
        ACTION_CARDS.blast_bolt,
        ACTION_CARDS.blast_bolt,
        ACTION_CARDS.fireball,
        ACTION_CARDS.drain_touch,
        ACTION_CARDS.ensnare,
        ACTION_CARDS.dual_shot,
        ACTION_CARDS.life_alchemy,
        ACTION_CARDS.quick_strike,
        ACTION_CARDS.shadow_step,
        ACTION_CARDS.magicians_sanctum,
        ACTION_CARDS.obliterate,
        ACTION_CARDS.stonewardens_command,
        ACTION_CARDS.power_surge,
        ACTION_CARDS.ice_lance,
        ACTION_CARDS.precision_shot,
        ACTION_CARDS.dark_bargain,
        BUILDING_CARDS.dark_altar,
        BUILDING_CARDS.training_grounds,
        QUEST_CARDS.arcane_research,
        QUEST_CARDS.scouting_mission,
        COUNTER_CARDS.dramatic_return,
        COUNTER_CARDS.graverobbing,
        COUNTER_CARDS.mirror_shield,
        REACTION_CARDS.arcane_barrier,
        REACTION_CARDS.vengeance_strike
    ];
    return {
        summonSlots: [
            {
                summon: SUMMON_CARDS.fae_magician_b,
                roleId: 'magician'
            },
            {
                summon: SUMMON_CARDS.stoneheart_warrior_b,
                roleId: 'warrior'
            },
            {
                summon: SUMMON_CARDS.wilderling_scout_b,
                roleId: 'scout'
            }
        ],
        mainDeck,
        advanceDeck: [
            ADVANCE_CARDS.shadow_pact,
            ADVANCE_CARDS.rogues_shadow,
            ADVANCE_CARDS.elemental_focus,
            ADVANCE_CARDS.assassins_creed,
            ADVANCE_CARDS.lumina_starweaver,
            ADVANCE_CARDS.red_mage_oath,
            ADVANCE_CARDS.dark_mage_pact,
            ADVANCE_CARDS.berserker_fury
        ]
    };
}
const ROLE_FOR_SPECIES = {
    gignen: 'warrior',
    fae: 'magician',
    stoneheart: 'warrior',
    wilderling: 'scout',
    angar: 'magician',
    demar: 'magician',
    creptilis: 'scout'
};
function createRandomDeckDNA() {
    // DNA-based generation — deterministic, blockchain-ready
    const summon1 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["reconstructCardFromDNA"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["generateDNA"])(undefined, 'uncommon'));
    const summon2 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["reconstructCardFromDNA"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["generateDNA"])(undefined, 'uncommon'));
    const summon3 = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["reconstructCardFromDNA"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["generateDNA"])(undefined, 'rare'));
    const summonSlots = [
        summon1,
        summon2,
        summon3
    ].map((s)=>({
            summon: s,
            roleId: ROLE_FOR_SPECIES[s.species] ?? 'warrior'
        }));
    const allActions = Object.values(ACTION_CARDS);
    const allQuests = Object.values(QUEST_CARDS);
    const allBuildings = Object.values(BUILDING_CARDS);
    const allCounters = Object.values(COUNTER_CARDS);
    const shuffled = [
        ...allActions
    ].sort(()=>Math.random() - 0.5);
    const mainDeck = [
        ...shuffled.slice(0, 10),
        ...Object.values(allQuests).slice(0, 2),
        allBuildings[Math.floor(Math.random() * allBuildings.length)],
        allCounters[Math.floor(Math.random() * allCounters.length)]
    ];
    const advanceDeck = Object.values(ADVANCE_CARDS).filter(()=>Math.random() < 0.5).slice(0, 4);
    return {
        summonSlots,
        mainDeck,
        advanceDeck
    };
}
const createRandomDeck = createRandomDeckDNA;
}),
"[project]/src/engine/dna/index.ts [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

/**
 * Card DNA System — deterministic card identity.
 *
 * DNA is a 32-character hex string that encodes every random decision
 * made during card generation. Given the same DNA, reconstructCardFromDNA()
 * always produces the exact same SummonCard.
 */ __turbopack_context__.s([
    "generateDNA",
    ()=>generateDNA,
    "parseDNA",
    ()=>parseDNA,
    "reconstructCardFromDNA",
    ()=>reconstructCardFromDNA,
    "validateDNA",
    ()=>validateDNA
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/index.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$prng$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/engine/dna/prng.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$constants$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/engine/dna/constants.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$species$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/data/species.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$cards$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/data/cards.ts [app-route] (ecmascript)");
;
;
;
;
;
function parseDNA(dna) {
    if (dna.length !== 32) throw new Error(`Invalid DNA length: ${dna.length}, expected 32`);
    if (!/^[0-9a-f]+$/i.test(dna)) throw new Error('Invalid DNA: not hex');
    const hex = dna.toLowerCase();
    const version = parseInt(hex.slice(0, 2), 16);
    const speciesIndex = parseInt(hex.slice(2, 4), 16);
    const rarityAndReserved = parseInt(hex.slice(4, 7), 16);
    const rarityIndex = rarityAndReserved >> 8 & 0xf;
    const nameSeed = parseInt(hex.slice(7, 10), 16);
    const growthSeed = parseInt(hex.slice(10, 15), 16);
    const statSeedA = parseInt(hex.slice(15, 18), 16);
    const statSeedB = parseInt(hex.slice(18, 21), 16);
    const statSeedC = parseInt(hex.slice(21, 24), 16);
    const equipmentSeed = parseInt(hex.slice(24, 27), 16);
    const flairSeed = parseInt(hex.slice(27, 30), 16);
    const checksum = parseInt(hex.slice(30, 32), 16);
    return {
        version,
        speciesIndex,
        rarityIndex,
        nameSeed,
        growthSeed,
        statSeedA,
        statSeedB,
        statSeedC,
        equipmentSeed,
        flairSeed,
        checksum
    };
}
function generateDNA(species, rarity, randomFn = Math.random) {
    const speciesIdx = species ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$constants$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SPECIES_ORDER"].indexOf(species) : Math.floor(randomFn() * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$constants$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SPECIES_ORDER"].length);
    const rarityIdx = rarity ? __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$constants$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["RARITY_ORDER"].indexOf(rarity) : Math.floor(randomFn() * __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$constants$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["RARITY_ORDER"].length);
    const nameSeed = Math.floor(randomFn() * 0xfff);
    const growthSeed = Math.floor(randomFn() * 0xfffff);
    const statSeedA = Math.floor(randomFn() * 0xfff);
    const statSeedB = Math.floor(randomFn() * 0xfff);
    const statSeedC = Math.floor(randomFn() * 0xfff);
    const equipmentSeed = Math.floor(randomFn() * 0xfff);
    const flairSeed = Math.floor(randomFn() * 0xfff);
    // Build hex without checksum
    const version = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$constants$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DNA_VERSION"].toString(16).padStart(2, '0');
    const specHex = speciesIdx.toString(16).padStart(2, '0');
    const rarityAndReserved = (rarityIdx << 8 | 0).toString(16).padStart(3, '0');
    const nameHex = nameSeed.toString(16).padStart(3, '0');
    const growthHex = growthSeed.toString(16).padStart(5, '0');
    const statAHex = statSeedA.toString(16).padStart(3, '0');
    const statBHex = statSeedB.toString(16).padStart(3, '0');
    const statCHex = statSeedC.toString(16).padStart(3, '0');
    const equipHex = equipmentSeed.toString(16).padStart(3, '0');
    const flairHex = flairSeed.toString(16).padStart(3, '0');
    const body = `${version}${specHex}${rarityAndReserved}${nameHex}${growthHex}${statAHex}${statBHex}${statCHex}${equipHex}${flairHex}`;
    // Checksum: XOR of all bytes
    let xor = 0;
    for(let i = 0; i < body.length; i += 2){
        xor ^= parseInt(body.slice(i, i + 2), 16);
    }
    const checksumHex = (xor & 0xff).toString(16).padStart(2, '0');
    return body + checksumHex;
}
function validateDNA(dna) {
    try {
        if (dna.length !== 32) return false;
        if (!/^[0-9a-f]+$/i.test(dna)) return false;
        const hex = dna.toLowerCase();
        const body = hex.slice(0, 30);
        const storedChecksum = parseInt(hex.slice(30, 32), 16);
        let xor = 0;
        for(let i = 0; i < body.length; i += 2){
            xor ^= parseInt(body.slice(i, i + 2), 16);
        }
        if ((xor & 0xff) !== storedChecksum) return false;
        const parsed = parseDNA(dna);
        if (parsed.version !== __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$constants$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DNA_VERSION"]) return false;
        if (parsed.speciesIndex >= __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$constants$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SPECIES_ORDER"].length) return false;
        if (parsed.rarityIndex >= __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$constants$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["RARITY_ORDER"].length) return false;
        return true;
    } catch  {
        return false;
    }
}
// ─── Name Generation ──────────────────────────────────────────────────────────
const PREFIXES = {
    gignen: [
        'Ael',
        'Brin',
        'Cal',
        'Dorn',
        'Fen',
        'Gael',
        'Harn',
        'Kel',
        'Lor',
        'Myr'
    ],
    fae: [
        'Auri',
        'Bel',
        'Cel',
        'Dew',
        'Elan',
        'Fey',
        'Gil',
        'Haze',
        'Iris',
        'Lum'
    ],
    stoneheart: [
        'Bor',
        'Crag',
        'Dur',
        'Flint',
        'Grit',
        'Hew',
        'Iron',
        'Krag',
        'Mor',
        'Rok'
    ],
    wilderling: [
        'Ash',
        'Briar',
        'Claw',
        'Dusk',
        'Fang',
        'Growl',
        'Hunt',
        'Ivy',
        'Kite',
        'Leaf'
    ],
    angar: [
        'Aur',
        'Bright',
        'Cel',
        'Dawn',
        'Ether',
        'Flux',
        'Glow',
        'Halo',
        'Lux',
        'Nova'
    ],
    demar: [
        'Blaze',
        'Char',
        'Ember',
        'Flick',
        'Hex',
        'Jinx',
        'Knack',
        'Nix',
        'Quirk',
        'Spark'
    ],
    creptilis: [
        'Bane',
        'Coil',
        'Dread',
        'Edge',
        'Fume',
        'Gloom',
        'Husk',
        'Lurk',
        'Murk',
        'Shade'
    ]
};
const SUFFIXES = [
    'wind',
    'stone',
    'blade',
    'heart',
    'thorn',
    'spark',
    'shade',
    'crest',
    'fang',
    'vale'
];
function reconstructCardFromDNA(dna) {
    if (!validateDNA(dna)) throw new Error(`Invalid DNA: ${dna}`);
    const parsed = parseDNA(dna);
    const species = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$constants$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SPECIES_ORDER"][parsed.speciesIndex];
    const rarity = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$constants$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["RARITY_ORDER"][parsed.rarityIndex];
    const template = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$species$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SPECIES"][species];
    // Name
    const nameRng = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$prng$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["mulberry32"])(parsed.nameSeed);
    const prefix = PREFIXES[species][(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$prng$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["seededInt"])(nameRng, 0, PREFIXES[species].length - 1)];
    const suffix = SUFFIXES[(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$prng$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["seededInt"])(nameRng, 0, SUFFIXES.length - 1)];
    const name = `${prefix}${suffix}`;
    // Growth rates
    const growthRng = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$prng$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["mulberry32"])(parsed.growthSeed);
    const growthRates = {};
    for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["STAT_KEYS"]){
        const weights = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$constants$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GROWTH_WEIGHTS_BY_RARITY"][rarity];
        const weightRecord = {};
        __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$constants$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GROWTH_RATE_ORDER"].forEach((g, i)=>{
            weightRecord[g] = weights[i];
        });
        growthRates[key] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$prng$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["seededWeightedChoice"])(growthRng, weightRecord);
    }
    // Base stats
    const statRngA = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$prng$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["mulberry32"])(parsed.statSeedA);
    const statRngB = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$prng$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["mulberry32"])(parsed.statSeedB);
    const statRngC = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$prng$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["mulberry32"])(parsed.statSeedC);
    const floorBonus = [
        0,
        1,
        2,
        3,
        4
    ][parsed.rarityIndex] ?? 0;
    const statGroups = [
        {
            keys: [
                'STR',
                'END',
                'DEF'
            ],
            rng: statRngA
        },
        {
            keys: [
                'INT',
                'SPI',
                'MDF'
            ],
            rng: statRngB
        },
        {
            keys: [
                'SPD',
                'ACC',
                'LCK'
            ],
            rng: statRngC
        }
    ];
    const baseStats = {};
    for (const group of statGroups){
        for (const key of group.keys){
            const [min, max] = template.statRanges[key];
            const adjustedMin = Math.min(min + floorBonus, max);
            baseStats[key] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$prng$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["seededInt"])(group.rng, adjustedMin, max);
        }
    }
    // Equipment
    const equipRng = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$prng$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["mulberry32"])(parsed.equipmentSeed);
    const allWeapons = Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$cards$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["WEAPONS"]);
    const allArmor = Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$cards$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ARMOR_CARDS"]);
    const allAccessories = Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$data$2f$cards$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ACCESSORY_CARDS"]);
    // Weapon by species archetype
    let weaponPool = allWeapons;
    if ([
        'fae',
        'demar',
        'angar'
    ].includes(species)) {
        weaponPool = allWeapons.filter((w)=>w.damageType === 'magical');
    } else if ([
        'wilderling',
        'creptilis'
    ].includes(species)) {
        weaponPool = allWeapons.filter((w)=>w.damageType === 'physical_ranged');
    } else {
        weaponPool = allWeapons.filter((w)=>w.damageType === 'physical_melee');
    }
    if (weaponPool.length === 0) weaponPool = allWeapons;
    const weapon = {
        ...weaponPool[(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$prng$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["seededInt"])(equipRng, 0, weaponPool.length - 1)],
        id: `dna-wpn-${dna.slice(0, 8)}`
    };
    const armor = {
        ...allArmor[(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$prng$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["seededInt"])(equipRng, 0, allArmor.length - 1)],
        id: `dna-arm-${dna.slice(0, 8)}`
    };
    const accessory = {
        ...allAccessories[(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$prng$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["seededInt"])(equipRng, 0, allAccessories.length - 1)],
        id: `dna-acc-${dna.slice(0, 8)}`
    };
    return {
        id: `dna-${dna}`,
        name,
        cardType: 'summon',
        species,
        rarity,
        element: 'neutral',
        description: template.description,
        requirements: [],
        pileDestination: 'removed',
        baseStats: baseStats,
        growthRates: growthRates,
        equipment: {
            weapon,
            offhand: null,
            armor,
            accessory
        },
        digitalSignature: `sig-${dna}`,
        dna
    };
}
;
;
}),
"[project]/src/engine/dna/metadata.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * DNA → NFT Metadata converter.
 * Produces Immutable-compatible ERC-721 metadata from a DNA string.
 */ __turbopack_context__.s([
    "dnaToNFTMetadata",
    ()=>dnaToNFTMetadata
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/index.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/engine/dna/index.ts [app-route] (ecmascript) <locals>");
;
;
const GROWTH_DISPLAY = {
    minimal: 'Minimal (--)',
    steady: 'Steady (-)',
    normal: 'Normal (_)',
    gradual: 'Gradual (+)',
    accelerated: 'Accelerated (++)',
    exceptional: 'Exceptional (*)'
};
function dnaToNFTMetadata(dna, tokenId, imageUrl, spriteUrl, baseExternalUrl = 'https://summonersgrid.com/card') {
    const card = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["reconstructCardFromDNA"])(dna);
    // Stat total
    const statTotal = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["STAT_KEYS"].reduce((sum, key)=>sum + card.baseStats[key], 0);
    // Growth score (weighted: exceptional=6, accelerated=5, etc.)
    const growthScoreMap = {
        minimal: 1,
        steady: 2,
        normal: 3,
        gradual: 4,
        accelerated: 5,
        exceptional: 6
    };
    const growthScore = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["STAT_KEYS"].reduce((sum, key)=>sum + (growthScoreMap[card.growthRates[key]] ?? 3), 0);
    // Find highest stat for description
    let highestStat = 'STR';
    let highestVal = 0;
    for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["STAT_KEYS"]){
        if (card.baseStats[key] > highestVal) {
            highestVal = card.baseStats[key];
            highestStat = key;
        }
    }
    // Find best growth rate for description
    let bestGrowth = '';
    let bestGrowthVal = 0;
    for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["STAT_KEYS"]){
        const val = __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GROWTH_RATE_VALUES"][card.growthRates[key]];
        if (val > bestGrowthVal) {
            bestGrowthVal = val;
            bestGrowth = `${key} ${__TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GROWTH_RATE_SYMBOLS"][card.growthRates[key]]}`;
        }
    }
    const description = `A ${card.rarity} ${card.species} summon. ${highestStat}-focused with ${bestGrowth} growth.`;
    const attributes = [
        {
            trait_type: 'DNA',
            value: dna
        },
        {
            trait_type: 'Species',
            value: card.species.charAt(0).toUpperCase() + card.species.slice(1)
        },
        {
            trait_type: 'Rarity',
            value: card.rarity.charAt(0).toUpperCase() + card.rarity.slice(1)
        }
    ];
    // Individual stats
    for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["STAT_KEYS"]){
        attributes.push({
            trait_type: key,
            value: card.baseStats[key],
            display_type: 'number'
        });
    }
    // Growth rates
    for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["STAT_KEYS"]){
        attributes.push({
            trait_type: `${key} Growth`,
            value: GROWTH_DISPLAY[card.growthRates[key]] ?? card.growthRates[key]
        });
    }
    // Equipment
    attributes.push({
        trait_type: 'Weapon',
        value: card.equipment.weapon?.name ?? 'None'
    });
    attributes.push({
        trait_type: 'Armor',
        value: card.equipment.armor?.name ?? 'None'
    });
    attributes.push({
        trait_type: 'Accessory',
        value: card.equipment.accessory?.name ?? 'None'
    });
    // Computed scores
    attributes.push({
        trait_type: 'Stat Total',
        value: statTotal,
        display_type: 'number'
    });
    attributes.push({
        trait_type: 'Growth Score',
        value: growthScore,
        display_type: 'number'
    });
    return {
        name: card.name,
        description,
        image: imageUrl ?? '',
        animation_url: spriteUrl ?? '',
        external_url: tokenId ? `${baseExternalUrl}/${tokenId}` : '',
        attributes
    };
}
}),
"[project]/src/engine/dna/promptBuilder.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * DNA → AI Art Prompt builder.
 * Derives visual description from card DNA for ComfyUI/Stable Diffusion.
 */ __turbopack_context__.s([
    "dnaToArtPrompt",
    ()=>dnaToArtPrompt,
    "dnaToSpritePrompt",
    ()=>dnaToSpritePrompt
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/types/index.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/engine/dna/index.ts [app-route] (ecmascript) <locals>");
;
;
// Constants used internally for index-based lookups
const SPECIES_VISUAL = {
    gignen: 'human-like adventurer, versatile build, neutral expression',
    fae: 'ethereal elf with pointed ears, graceful features, luminous skin',
    stoneheart: 'stout dwarf, broad shoulders, stone-like skin texture, craftsman build',
    wilderling: 'bestial humanoid, fur-covered, primal features, keen eyes',
    angar: 'celestial being, radiant features, wings of light, wise expression',
    demar: 'devilish figure, horns, clever expression, arcane markings',
    creptilis: 'reptilian humanoid, scales, calculating eyes, armored tail'
};
const RARITY_AURA = {
    common: 'no special aura, plain background',
    uncommon: 'faint green shimmer around the figure',
    rare: 'blue magical aura, glowing edges',
    legend: 'golden radiant aura, ornate frame elements',
    myth: 'prismatic rainbow aura, divine light, cosmic energy swirling'
};
const STAT_ARCHETYPE = {
    STR: 'muscular build, powerful stance, imposing physique',
    END: 'scarred and weathered, thick-skinned, enduring posture',
    DEF: 'heavily armored, shield-bearing, defensive stance',
    INT: 'scholarly appearance, glowing runes, mystical implements',
    SPI: 'serene expression, holy symbols, gentle radiance',
    MDF: 'warded appearance, protective glyphs, barrier shimmer',
    SPD: 'lean and agile, wind-swept, dynamic pose',
    ACC: 'sharp-eyed, precise stance, focused expression',
    LCK: 'charmed appearance, four-leaf motifs, dice accessories'
};
const FLAIR_BACKGROUNDS = [
    'ancient forest clearing',
    'crumbling ruins at dusk',
    'battlefield aftermath',
    'mountain peak at dawn',
    'underground cavern with crystals',
    'stormy coastal cliff',
    'moonlit graveyard',
    'sun-drenched meadow',
    'volcanic forge',
    'floating island in clouds',
    'frozen tundra',
    'enchanted library'
];
const FLAIR_POSES = [
    'battle-ready stance',
    'meditative pose',
    'commanding gesture',
    'sneaking forward',
    'leaping into action',
    'standing victorious',
    'casting a spell',
    'drawing a weapon',
    'defensive crouch',
    'looking into the distance',
    'emerging from shadows',
    'rallying allies'
];
function dnaToArtPrompt(dna) {
    const card = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["reconstructCardFromDNA"])(dna);
    const parsed = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["parseDNA"])(dna);
    const species = card.species;
    const rarity = card.rarity;
    // Find highest stat for archetype
    let highestStat = 'STR';
    let highestValue = 0;
    for (const key of __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$types$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["STAT_KEYS"]){
        if (card.baseStats[key] > highestValue) {
            highestValue = card.baseStats[key];
            highestStat = key;
        }
    }
    // Equipment descriptions
    const weaponDesc = card.equipment.weapon?.name ?? 'bare hands';
    const armorDesc = card.equipment.armor?.name ?? 'simple clothing';
    const accessoryDesc = card.equipment.accessory?.name ?? 'no accessories';
    // Flair from visual seed
    const flairBg = FLAIR_BACKGROUNDS[parsed.flairSeed % FLAIR_BACKGROUNDS.length];
    const flairPose = FLAIR_POSES[Math.floor(parsed.flairSeed / FLAIR_BACKGROUNDS.length) % FLAIR_POSES.length];
    const parts = [
        'Fantasy TCG card art, portrait composition',
        SPECIES_VISUAL[species],
        RARITY_AURA[rarity],
        STAT_ARCHETYPE[highestStat],
        `wearing ${armorDesc}`,
        `wielding ${weaponDesc}`,
        `${accessoryDesc} visible`,
        flairPose,
        `background: ${flairBg}`,
        'detailed illustration, game card style, dark fantasy theme'
    ];
    return parts.join(', ');
}
function dnaToSpritePrompt(dna) {
    const card = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["reconstructCardFromDNA"])(dna);
    return [
        'Pixel art game sprite, 64x64',
        `${card.species} ${card.rarity}`,
        SPECIES_VISUAL[card.species].split(',')[0],
        `holding ${card.equipment.weapon?.name ?? 'nothing'}`,
        'chibi proportions, transparent background'
    ].join(', ');
}
}),
"[project]/app/api/cards/[dna]/route.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "GET",
    ()=>GET
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/server.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/src/engine/dna/index.ts [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$metadata$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/engine/dna/metadata.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$promptBuilder$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/src/engine/dna/promptBuilder.ts [app-route] (ecmascript)");
;
;
;
;
async function GET(_request, { params }) {
    const { dna } = await params;
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["validateDNA"])(dna)) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Invalid DNA string'
        }, {
            status: 400
        });
    }
    try {
        const card = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["reconstructCardFromDNA"])(dna);
        const metadata = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$metadata$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["dnaToNFTMetadata"])(dna);
        const artPrompt = (0, __TURBOPACK__imported__module__$5b$project$5d2f$src$2f$engine$2f$dna$2f$promptBuilder$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["dnaToArtPrompt"])(dna);
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            dna,
            card: {
                name: card.name,
                species: card.species,
                rarity: card.rarity,
                baseStats: card.baseStats,
                growthRates: card.growthRates,
                equipment: {
                    weapon: card.equipment.weapon?.name ?? null,
                    armor: card.equipment.armor?.name ?? null,
                    accessory: card.equipment.accessory?.name ?? null
                }
            },
            metadata,
            artPrompt
        });
    } catch  {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$server$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NextResponse"].json({
            error: 'Failed to reconstruct card from DNA'
        }, {
            status: 500
        });
    }
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0ps2twv._.js.map