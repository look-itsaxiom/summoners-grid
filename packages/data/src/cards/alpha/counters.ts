/**
 * Alpha Set - Counter Cards
 *
 * Counter cards from the Play Example document.
 * Card definitions follow the schema defined in @summoners-grid/engine.
 */

export const counterCards = [
  // 003 - Dramatic Return!
  {
    definitionId: '003-dramatic-return',
    name: 'Dramatic Return!',
    type: 'counter',
    rarity: 'legend',
    attribute: 'light',
    set: 'alpha',
    cardNumber: 3,
    speed: 'counter',
    destination: 'discard',
    triggerCondition: {
      type: 'summonDefeated',
      params: {
        controller: 'owner',
      },
    },
    requirements: [],
    effects: [
      {
        type: 'resurrectSummon',
        params: {
          target: 'defeatedSummon',
          hpPercent: 10,
          positionSelection: {
            id: 'returnPosition',
            type: 'position',
            filter: 'unoccupied && inOwnerTerritory',
          },
          preserveLevel: true,
          preserveRole: true,
          preserveEquipment: true,
          clearOngoingEffects: true,
          noSummonDraws: true,
        },
      },
    ],
    flavorText: 'When a summon you control is defeated, return it to your territory with 10% HP. Does not trigger Summon Draws.',
  },

  // 041 - Graverobbing
  {
    definitionId: '041-graverobbing',
    name: 'Graverobbing',
    type: 'counter',
    rarity: 'uncommon',
    attribute: 'dark',
    set: 'alpha',
    cardNumber: 41,
    speed: 'counter',
    destination: 'discard',
    triggerCondition: {
      type: 'vpGained',
      params: {
        source: 'opponent',
        trigger: 'summonDefeated',
      },
    },
    requirements: [
      {
        type: 'discardCard',
        params: {
          count: 1,
          source: 'hand',
        },
      },
    ],
    effects: [
      {
        type: 'nullifyVPGain',
        params: {
          scope: 'triggeringEvent',
        },
      },
    ],
    flavorText: 'When opponent would gain VP from defeating your summon, discard a card to nullify the VP gain.',
  },
];
