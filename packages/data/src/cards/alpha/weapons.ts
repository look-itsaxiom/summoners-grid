/**
 * Alpha Set - Weapon Cards
 *
 * Weapon cards from the Play Example document.
 * Card definitions follow the schema defined in @summoners-grid/engine.
 */

export const weaponCards = [
  // 034 - Heirloom Sword
  {
    definitionId: '034-heirloom-sword',
    name: 'Heirloom Sword',
    type: 'weapon',
    rarity: 'common',
    attribute: 'neutral',
    set: 'alpha',
    cardNumber: 34,
    slot: 'weapon',
    requirements: [],
    statBonuses: {
      STR: 1,
      END: 1,
      DEF: 1,
      INT: 1,
      SPI: 1,
      MDF: 1,
      SPD: 1,
      ACC: 1,
      LCK: 1,
    },
    effects: [],
    weaponPower: 30,
    attackRange: 1,
    isMagical: false,
    baseAccuracy: 90,
    flavorText: 'Balanced weapon providing modest improvements across all attributes.',
  },

  // 035 - Apprentice's Wand
  {
    definitionId: '035-apprentices-wand',
    name: "Apprentice's Wand",
    type: 'weapon',
    rarity: 'common',
    attribute: 'neutral',
    set: 'alpha',
    cardNumber: 35,
    slot: 'weapon',
    requirements: [],
    statBonuses: {
      INT: 2,
      SPI: 1,
    },
    effects: [],
    weaponPower: 30,
    attackRange: 2,
    isMagical: true,
    baseAccuracy: 90,
    flavorText: 'Basic magical implement for beginning spellcasters.',
  },

  // 036 - Hunting Bow
  {
    definitionId: '036-hunting-bow',
    name: 'Hunting Bow',
    type: 'weapon',
    rarity: 'common',
    attribute: 'neutral',
    set: 'alpha',
    cardNumber: 36,
    slot: 'weapon',
    requirements: [],
    statBonuses: {
      ACC: 2,
      SPD: 1,
    },
    effects: [
      {
        type: 'weaponDamageFormula',
        params: {
          formula: '((STR + ACC) / 2) * (1 + weaponPower/100) * (STR / target.DEF)',
          note: 'Hybrid physical/accuracy damage calculation',
        },
      },
    ],
    weaponPower: 30,
    attackRange: 5,
    isMagical: false,
    baseAccuracy: 90,
    flavorText: 'Ranged weapon favoring accuracy and speed over raw power.',
  },
];
