/**
 * Alpha Set - Quest Cards
 *
 * Quest cards from the Play Example document.
 * Card definitions follow the schema defined in @summoners-grid/engine.
 */

export const questCards = [
  // 037 - Nearwood Forest Expedition
  {
    definitionId: '037-nearwood-forest-expedition',
    name: 'Nearwood Forest Expedition',
    type: 'quest',
    rarity: 'common',
    attribute: 'earth',
    set: 'alpha',
    cardNumber: 37,
    destination: 'recharge',
    requirements: [],
    completionCondition: {
      type: 'controlsQualifyingSummon',
      params: {
        filter: 'controlled && (roleFamily == "warrior" || roleFamily == "scout" || roleFamily == "magician") && level < 10',
      },
    },
    // No failure condition - this is a safe quest
    activationControl: 'owner',
    vpReward: 0,
    completionEffects: [
      {
        type: 'grantLevels',
        params: {
          levels: 2,
          targetSelection: {
            id: 'questTarget',
            type: 'unit',
            filter: 'controlled && (roleFamily == "warrior" || roleFamily == "scout" || roleFamily == "magician") && level < 10',
          },
        },
      },
    ],
    ongoingEffects: [],
    flavorText: 'Control a Warrior, Scout, or Magician summon under level 10. Reward: Target qualifying summon gains 2 levels.',
  },
];
