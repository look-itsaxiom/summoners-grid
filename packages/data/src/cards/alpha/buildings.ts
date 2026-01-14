/**
 * Alpha Set - Building Cards
 *
 * Building cards from the Play Example document.
 * Card definitions follow the schema defined in @summoners-grid/engine.
 */

export const buildingCards = [
  // 004 - Gignen Country
  {
    definitionId: '004-gignen-country',
    name: 'Gignen Country',
    type: 'building',
    rarity: 'uncommon',
    attribute: 'neutral',
    set: 'alpha',
    cardNumber: 4,
    destination: 'discard',
    dimensions: { width: 3, height: 2 },
    requirements: [],
    ongoingEffects: [
      {
        type: 'speciesLevelBonus',
        params: {
          species: 'gignen',
          trigger: 'onLevelUp',
          bonusLevels: 1,
          condition: 'occupyingBuilding',
        },
      },
    ],
    destroyEffects: [],
    isTrap: false,
    flavorText: 'While occupying, all Gignen based Summons you control receive an additional level whenever they level up.',
  },

  // 010 - Dark Altar
  {
    definitionId: '010-dark-altar',
    name: 'Dark Altar',
    type: 'building',
    rarity: 'rare',
    attribute: 'dark',
    set: 'alpha',
    cardNumber: 10,
    destination: 'discard',
    dimensions: { width: 2, height: 2 },
    requirements: [],
    ongoingEffects: [
      {
        type: 'delayedDestruction',
        params: {
          delay: 'endOfNextTurn',
          destroyOccupants: true,
        },
      },
    ],
    destroyEffects: [
      {
        type: 'sacrificeReward',
        params: {
          condition: 'summonDestroyed',
          targetSelection: {
            type: 'unit',
            filter: 'controlled && roleFamily == "magician"',
          },
          effects: [
            {
              type: 'setLevel',
              params: { level: 20 },
            },
            {
              type: 'allowImmediateAdvance',
              params: {},
            },
          ],
        },
      },
    ],
    isTrap: false,
    flavorText: 'At end of your next turn, this building and any summons occupying its spaces are destroyed. If a summon was destroyed, target magician becomes level 20 and can immediately advance.',
  },
];
