/**
 * Alpha Set - Action Cards
 *
 * Action cards from the Play Example document.
 * Card definitions follow the schema defined in @summoners-grid/engine.
 */

export const actionCards = [
  // 001 - Blast Bolt
  {
    definitionId: '001-blast-bolt',
    name: 'Blast Bolt',
    type: 'action',
    rarity: 'common',
    attribute: 'fire',
    set: 'alpha',
    cardNumber: 1,
    speed: 'action',
    destination: 'discard',
    requirements: [
      {
        type: 'controlsRoleFamily',
        params: { family: 'magician' },
      },
    ],
    selectionPrompts: [
      {
        id: 'caster',
        type: 'unit',
        filter: 'controlled && roleFamily == "magician"',
      },
      {
        id: 'target',
        type: 'unit',
        filter: 'enemy',
      },
    ],
    effects: [
      {
        type: 'damage',
        params: {
          attribute: 'fire',
          formula: 'caster.INT * (1 + 60/100) * (caster.INT / target.MDF)',
          basePower: 60,
          baseAccuracy: 85,
          canCrit: true,
          critMultiplier: 1.5,
        },
      },
    ],
    flavorText: 'A basic magical attack spell accessible to all magician-family roles.',
  },

  // 005 - Sharpened Blade
  {
    definitionId: '005-sharpened-blade',
    name: 'Sharpened Blade',
    type: 'action',
    rarity: 'common',
    attribute: 'neutral',
    set: 'alpha',
    cardNumber: 5,
    speed: 'action',
    destination: 'recharge',
    requirements: [
      {
        type: 'controlsRoleFamily',
        params: { family: 'warrior' },
      },
    ],
    selectionPrompts: [
      {
        id: 'target',
        type: 'unit',
        filter: 'controlled && roleFamily == "warrior" && hasWeapon',
      },
    ],
    effects: [
      {
        type: 'modifyWeaponPower',
        params: {
          bonus: 10,
          duration: 'permanent',
        },
      },
    ],
    flavorText: 'Target Weapon equipped to a Warrior based Summon gains +10 Base Power.',
  },

  // 006 - Healing Hands
  {
    definitionId: '006-healing-hands',
    name: 'Healing Hands',
    type: 'action',
    rarity: 'common',
    attribute: 'light',
    set: 'alpha',
    cardNumber: 6,
    speed: 'action',
    destination: 'discard',
    requirements: [
      {
        type: 'controlsRoleFamily',
        params: { family: 'magician' },
      },
    ],
    selectionPrompts: [
      {
        id: 'caster',
        type: 'unit',
        filter: 'controlled && roleFamily == "magician"',
      },
      {
        id: 'target',
        type: 'unit',
        filter: 'any',
      },
    ],
    effects: [
      {
        type: 'heal',
        params: {
          attribute: 'light',
          formula: 'caster.SPI * (1 + 40/100)',
          basePower: 40,
          canCrit: true,
          critMultiplier: 1.5,
        },
      },
    ],
    flavorText: 'Basic healing spell that can target allies or enemies.',
  },

  // 009 - Rush
  {
    definitionId: '009-rush',
    name: 'Rush',
    type: 'action',
    rarity: 'common',
    attribute: 'neutral',
    set: 'alpha',
    cardNumber: 9,
    speed: 'action',
    destination: 'recharge',
    requirements: [
      {
        type: 'controlsRoleFamily',
        params: { family: 'scout' },
      },
    ],
    selectionPrompts: [
      {
        id: 'target',
        type: 'unit',
        filter: 'controlled',
      },
    ],
    effects: [
      {
        type: 'modifyMovement',
        params: {
          multiplier: 2,
          duration: 'endOfTurn',
        },
      },
      {
        type: 'modifyStat',
        params: {
          stat: 'DEF',
          multiplier: 0.5,
          duration: 'endOfOpponentNextTurn',
        },
      },
    ],
    flavorText: 'Doubles movement speed until end of turn, but halves DEF until end of opponent\'s next turn.',
  },

  // 011 - Ensnare
  {
    definitionId: '011-ensnare',
    name: 'Ensnare',
    type: 'action',
    rarity: 'uncommon',
    attribute: 'earth',
    set: 'alpha',
    cardNumber: 11,
    speed: 'action',
    destination: 'discard',
    requirements: [
      {
        type: 'controlsRoleFamily',
        params: { family: 'scout' },
      },
    ],
    selectionPrompts: [
      {
        id: 'caster',
        type: 'unit',
        filter: 'controlled && roleFamily == "scout"',
      },
      {
        id: 'target',
        type: 'unit',
        filter: 'any',
      },
    ],
    effects: [
      {
        type: 'damage',
        params: {
          attribute: 'earth',
          formula: 'caster.STR * (1 + 25/100) * (caster.STR / target.DEF)',
          basePower: 25,
          baseAccuracy: 75,
          canCrit: true,
          critMultiplier: 1.5,
        },
      },
      {
        type: 'immobilize',
        params: {
          saveChance: 30,
          duration: 'endOfTargetNextTurn',
        },
      },
    ],
    flavorText: 'Crowd control effect that damages and may immobilize enemies.',
  },

  // 012 - Drain Touch
  {
    definitionId: '012-drain-touch',
    name: 'Drain Touch',
    type: 'action',
    rarity: 'uncommon',
    attribute: 'dark',
    set: 'alpha',
    cardNumber: 12,
    speed: 'action',
    destination: 'discard',
    requirements: [
      {
        type: 'controlsRoleFamily',
        params: { family: 'magician' },
      },
    ],
    selectionPrompts: [
      {
        id: 'caster',
        type: 'unit',
        filter: 'controlled && roleFamily == "magician"',
      },
      {
        id: 'target',
        type: 'unit',
        filter: 'enemy',
      },
    ],
    effects: [
      {
        type: 'damage',
        params: {
          attribute: 'dark',
          formula: 'caster.INT * (1 + 30/100) * (caster.INT / target.MDF)',
          basePower: 30,
          baseAccuracy: 90,
          canCrit: true,
          critMultiplier: 1.5,
        },
      },
      {
        type: 'heal',
        params: {
          target: 'caster',
          formula: 'damageDealt * 0.5',
          healFromDamage: true,
          healRatio: 0.5,
        },
      },
    ],
    flavorText: 'Life-steal spell that damages enemies while healing caster.',
  },

  // 016 - Life Alchemy
  {
    definitionId: '016-life-alchemy',
    name: 'Life Alchemy',
    type: 'action',
    rarity: 'rare',
    attribute: 'light',
    set: 'alpha',
    cardNumber: 16,
    speed: 'action',
    destination: 'discard',
    requirements: [
      {
        type: 'controlsRoleFamily',
        params: { family: 'magician' },
      },
    ],
    selectionPrompts: [
      {
        id: 'caster',
        type: 'unit',
        filter: 'controlled && roleFamily == "magician"',
      },
      {
        id: 'sacrificeTarget',
        type: 'unit',
        filter: 'controlled',
      },
      {
        id: 'healTarget',
        type: 'unit',
        filter: 'controlled',
      },
    ],
    effects: [
      {
        type: 'damage',
        params: {
          target: 'sacrificeTarget',
          formula: 'target.maxHP * 0.25',
          percentOfMaxHP: 25,
          bypassDefense: true,
        },
      },
      {
        type: 'heal',
        params: {
          target: 'healTarget',
          formula: 'sacrificeTarget.maxHP * 0.25',
          fixedAmount: 'sacrificeTarget.maxHP * 0.25',
        },
      },
    ],
    flavorText: 'Deals 25% of target\'s max HP as damage, then heals another target for the same amount.',
  },

  // 017 - Dual Shot
  {
    definitionId: '017-dual-shot',
    name: 'Dual Shot',
    type: 'action',
    rarity: 'uncommon',
    attribute: 'neutral',
    set: 'alpha',
    cardNumber: 17,
    speed: 'action',
    destination: 'recharge',
    requirements: [
      {
        type: 'controlsRoleFamily',
        params: { family: 'scout' },
      },
      {
        type: 'hasWeaponType',
        params: { weaponType: 'bow' },
      },
    ],
    selectionPrompts: [
      {
        id: 'target',
        type: 'unit',
        filter: 'controlled && roleFamily == "scout" && hasWeapon',
      },
    ],
    effects: [
      {
        type: 'grantExtraAttacks',
        params: {
          count: 2,
          duration: 'endOfTurn',
          replacesNormal: true,
        },
      },
    ],
    flavorText: 'Target Scout can make two basic attacks this turn.',
  },

  // 018 - Tempest Slash
  {
    definitionId: '018-tempest-slash',
    name: 'Tempest Slash',
    type: 'action',
    rarity: 'uncommon',
    attribute: 'wind',
    set: 'alpha',
    cardNumber: 18,
    speed: 'action',
    destination: 'discard',
    requirements: [
      {
        type: 'controlsRoleFamily',
        params: { family: 'warrior' },
      },
    ],
    selectionPrompts: [
      {
        id: 'target',
        type: 'unit',
        filter: 'controlled && roleFamily == "warrior"',
      },
    ],
    effects: [
      {
        type: 'modifyMovement',
        params: {
          bonus: 1,
          duration: 'endOfTurn',
        },
      },
      {
        type: 'addAttackBonus',
        params: {
          formula: 'caster.STR * (1 + 30/100) * (caster.STR / target.DEF)',
          basePower: 30,
          attribute: 'wind',
          duration: 'nextAttack',
          scalesWithCrit: true,
        },
      },
    ],
    flavorText: 'Adds +1 movement and bonus wind damage to next basic attack.',
  },

  // 019 - Magician's Sanctum
  {
    definitionId: '019-magicians-sanctum',
    name: "Magician's Sanctum",
    type: 'action',
    rarity: 'uncommon',
    attribute: 'neutral',
    set: 'alpha',
    cardNumber: 19,
    speed: 'action',
    destination: 'recharge',
    requirements: [
      {
        type: 'controlsRoleFamily',
        params: { family: 'magician' },
      },
    ],
    selectionPrompts: [
      {
        id: 'target',
        type: 'unit',
        filter: 'controlled && roleFamily == "magician"',
      },
    ],
    effects: [
      {
        type: 'defensiveBonus',
        params: {
          formula: 'DEF + (MDF / 2) or MDF + (DEF / 2)',
          duration: 'endOfOpponentNextTurn',
          endsOnMovement: true,
        },
      },
    ],
    flavorText: 'Magician adds half of DEF to MDF or half of MDF to DEF when calculating damage. Ends if the Magician moves.',
  },
];
