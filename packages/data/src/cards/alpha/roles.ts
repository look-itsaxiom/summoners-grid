/**
 * Alpha Set - Role Cards
 *
 * Base role cards (Tier 1) from the Play Example document.
 * Card definitions follow the schema defined in @summoners-grid/engine.
 */

export const roleCards = [
  // 020 - Warrior (Tier 1)
  {
    definitionId: '020-warrior',
    name: 'Warrior',
    type: 'role',
    rarity: 'common',
    attribute: 'neutral',
    set: 'alpha',
    cardNumber: 20,
    role: {
      name: 'Warrior',
      family: 'warrior',
      tier: 1,
      statModifiers: {
        STR: 0.25,   // +25% STR
        END: 0.25,   // +25% END
      },
      passiveEffects: [],
      abilities: [],
    },
    advancesTo: ['Berserker', 'Knight'],
    flavorText: 'Foundation warrior role focused on physical combat and durability.',
  },

  // 021 - Magician (Tier 1)
  {
    definitionId: '021-magician',
    name: 'Magician',
    type: 'role',
    rarity: 'common',
    attribute: 'neutral',
    set: 'alpha',
    cardNumber: 21,
    role: {
      name: 'Magician',
      family: 'magician',
      tier: 1,
      statModifiers: {
        INT: 0.25,   // +25% INT
        SPI: 0.25,   // +25% SPI
      },
      passiveEffects: [],
      abilities: [],
    },
    advancesTo: ['Element Mage', 'Light Mage', 'Dark Mage'],
    flavorText: 'Foundation magical role with access to elemental and divine magic.',
  },

  // 022 - Scout (Tier 1)
  {
    definitionId: '022-scout',
    name: 'Scout',
    type: 'role',
    rarity: 'common',
    attribute: 'neutral',
    set: 'alpha',
    cardNumber: 22,
    role: {
      name: 'Scout',
      family: 'scout',
      tier: 1,
      statModifiers: {
        SPD: 0.25,   // +25% SPD
        ACC: 0.25,   // +25% ACC
      },
      passiveEffects: [],
      abilities: [],
    },
    advancesTo: ['Rogue', 'Explorer'],
    flavorText: 'Foundation agility role focused on speed and precision.',
  },
];
