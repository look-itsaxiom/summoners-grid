/**
 * Alpha Set - Advance Cards
 *
 * Advance cards from the Play Example document.
 * Card definitions follow the schema defined in @summoners-grid/engine.
 */

export const advanceCards = [
  // 040 - Berserker Rage (Warrior -> Berserker)
  {
    definitionId: '040-berserker-rage',
    name: 'Berserker Rage',
    type: 'advance',
    rarity: 'uncommon',
    attribute: 'neutral',
    set: 'alpha',
    cardNumber: 40,
    isNamedSummon: false,
    requirements: [
      {
        type: 'controlsRole',
        params: { roleName: 'Warrior' },
      },
      {
        type: 'summonLevel',
        params: { minLevel: 10 },
      },
    ],
    newRole: {
      name: 'Berserker',
      family: 'warrior',
      tier: 2,
      statModifiers: {
        STR: 0.50,   // +50% STR
        SPD: 0.10,   // +10% SPD
        DEF: -0.10,  // -10% DEF
        END: 0.10,   // +10% END
      },
      passiveEffects: [],
      abilities: [],
    },
    effects: [
      {
        type: 'changeRole',
        params: {
          newRole: 'Berserker',
        },
      },
    ],
    flavorText: 'Advance a Warrior to Berserker. Aggressive warrior sacrificing defense for overwhelming offense.',
  },

  // 039 - Shadow Pact (Dark Mage -> Warlock)
  {
    definitionId: '039-shadow-pact',
    name: 'Shadow Pact',
    type: 'advance',
    rarity: 'rare',
    attribute: 'dark',
    set: 'alpha',
    cardNumber: 39,
    isNamedSummon: false,
    requirements: [
      {
        type: 'controlsRole',
        params: { roleName: 'Dark Mage' },
      },
      {
        type: 'summonLevel',
        params: { minLevel: 15 },
      },
    ],
    newRole: {
      name: 'Warlock',
      family: 'magician',
      tier: 3,
      statModifiers: {
        INT: 0.60,   // +60% INT
        SPI: 0.30,   // +30% SPI
        LCK: 0.20,   // +20% LCK
        MDF: -0.20,  // -20% MDF
        DEF: -0.15,  // -15% DEF
      },
      passiveEffects: [
        {
          type: 'generateCard',
          params: {
            cardId: '132-nightmare-pain',
            trigger: 'onDrawPhase',
            toHand: true,
          },
        },
      ],
      abilities: [],
    },
    effects: [
      {
        type: 'changeRole',
        params: {
          newRole: 'Warlock',
        },
      },
    ],
    flavorText: 'Advance a Dark Mage to Warlock. Master of forbidden magic with immense power at great personal cost.',
  },

  // 042 - Alrecht Barkstep, Scoutmaster (Named Summon)
  {
    definitionId: '042-alrecht-barkstep',
    name: 'Alrecht Barkstep, Scoutmaster',
    type: 'advance',
    rarity: 'legend',
    attribute: 'neutral',
    set: 'alpha',
    cardNumber: 42,
    isNamedSummon: true,
    namedSummonName: 'Alrecht Barkstep, Scoutmaster',
    requirements: [
      {
        type: 'controlsRole',
        params: { roleName: 'Scout' },
      },
      {
        type: 'speciesCheck',
        params: { species: 'gignen' },
      },
      {
        type: 'summonLevel',
        params: { minLevel: 10 },
      },
    ],
    newRole: {
      name: 'Rogue',
      family: 'scout',
      tier: 2,
      statModifiers: {
        STR: 0.20,   // Named summon bonus
        END: -0.05,  // Slight penalty
        DEF: -0.10,  // Glass cannon
        INT: -0.35,  // Very low
        SPI: -0.35,  // Very low
        MDF: -0.05,  // Slight penalty
        SPD: 0.35,   // High speed
        LCK: 0.20,   // Good luck
        ACC: 0.70,   // Very high accuracy
      },
      passiveEffects: [
        {
          type: 'generateCard',
          params: {
            cardId: '050-follow-me',
            trigger: 'onEnterPlay',
            toHand: true,
          },
        },
        {
          type: 'generateCard',
          params: {
            cardId: '050-follow-me',
            trigger: 'onDrawPhase',
            toHand: true,
          },
        },
      ],
      abilities: [],
    },
    effects: [
      {
        type: 'namedSummonTransform',
        params: {
          newName: 'Alrecht Barkstep, Scoutmaster',
          inheritPosition: true,
          inheritEquipment: true,
          noSummonDraws: true,
        },
      },
    ],
    flavorText: 'Transform a Gignen Scout into the legendary Alrecht Barkstep, Scoutmaster.',
  },
];
