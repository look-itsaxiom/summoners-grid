import { describe, it, expect } from 'vitest';
import {
  ACTION_CARDS,
  BUILDING_CARDS,
  QUEST_CARDS,
  COUNTER_CARDS,
  ADVANCE_CARDS,
} from '../data/cards';

/**
 * Verifies that every card mentioned in the Summoner's Grid Play Example
 * document exists in cards.ts with the correct properties.
 */

describe('Play Example Card Verification', () => {
  // ─── Action Cards ──────────────────────────────────────────────────────────

  describe('Sharpened Blade', () => {
    const card = ACTION_CARDS.sharpened_blade;

    it('exists', () => {
      expect(card).toBeDefined();
    });

    it('has correct identity', () => {
      expect(card.id).toBe('sharpened_blade');
      expect(card.name).toBe('Sharpened Blade');
      expect(card.cardType).toBe('action');
    });

    it('targets ally summon', () => {
      expect(card.targetType).toBe('ally_summon');
    });

    it('requires a Warrior summon in play', () => {
      expect(card.requirements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'role', roleFamily: 'warrior' }),
        ]),
      );
    });

    it('has a buff effect for +10 weapon base power', () => {
      expect(card.effects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'buff' }),
        ]),
      );
    });

    it('goes to recharge pile after use', () => {
      expect(card.pileDestination).toBe('recharge');
    });
  });

  describe('Healing Hands', () => {
    const card = ACTION_CARDS.healing_hands;

    it('exists', () => {
      expect(card).toBeDefined();
    });

    it('has correct identity', () => {
      expect(card.id).toBe('healing_hands');
      expect(card.name).toBe('Healing Hands');
      expect(card.cardType).toBe('action');
    });

    it('requires a Magician summon in play', () => {
      expect(card.requirements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'role', roleFamily: 'magician' }),
        ]),
      );
    });

    it('has a heal effect with basePower 40 that can crit', () => {
      expect(card.effects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'heal',
            basePower: 40,
            canCrit: true,
          }),
        ]),
      );
    });

    it('targets ally summon', () => {
      expect(card.targetType).toBe('ally_summon');
    });

    it('goes to discard pile after use', () => {
      expect(card.pileDestination).toBe('discard');
    });
  });

  describe('Rush', () => {
    const card = ACTION_CARDS.rush;

    it('exists', () => {
      expect(card).toBeDefined();
    });

    it('has correct identity', () => {
      expect(card.id).toBe('rush');
      expect(card.name).toBe('Rush');
      expect(card.cardType).toBe('action');
    });

    it('has a buff effect (double movement)', () => {
      expect(card.effects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'buff', duration: 'end_of_turn' }),
        ]),
      );
    });

    it('has a debuff effect (halve DEF)', () => {
      expect(card.effects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'debuff',
            duration: 'end_of_next_turn',
            statModifiers: expect.objectContaining({ DEF: -0.5 }),
          }),
        ]),
      );
    });

    it('targets ally summon', () => {
      expect(card.targetType).toBe('ally_summon');
    });

    it('goes to recharge pile after use', () => {
      expect(card.pileDestination).toBe('recharge');
    });
  });

  describe('Blast Bolt', () => {
    const card = ACTION_CARDS.blast_bolt;

    it('exists', () => {
      expect(card).toBeDefined();
    });

    it('has correct identity', () => {
      expect(card.id).toBe('blast_bolt');
      expect(card.name).toBe('Blast Bolt');
      expect(card.cardType).toBe('action');
    });

    it('requires a Magician summon in play', () => {
      expect(card.requirements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'role', roleFamily: 'magician' }),
        ]),
      );
    });

    it('deals magical fire damage with basePower 60', () => {
      expect(card.effects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'damage',
            basePower: 60,
            damageType: 'magical',
            element: 'fire',
            canCrit: true,
          }),
        ]),
      );
    });

    it('targets enemy summon', () => {
      expect(card.targetType).toBe('enemy_summon');
    });

    it('goes to discard pile after use', () => {
      expect(card.pileDestination).toBe('discard');
    });
  });

  describe('Tempest Slash', () => {
    const card = ACTION_CARDS.tempest_slash;

    it('exists', () => {
      expect(card).toBeDefined();
    });

    it('has correct identity', () => {
      expect(card.id).toBe('tempest_slash');
      expect(card.name).toBe('Tempest Slash');
      expect(card.cardType).toBe('action');
    });

    it('has a buff effect for +1 movement', () => {
      expect(card.effects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'buff', duration: 'end_of_turn' }),
        ]),
      );
    });

    it('has additional wind damage effect with basePower 30', () => {
      expect(card.effects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'damage',
            basePower: 30,
            element: 'wind',
            canCrit: true,
            duration: 'end_of_turn',
          }),
        ]),
      );
    });

    it('targets ally summon', () => {
      expect(card.targetType).toBe('ally_summon');
    });

    it('goes to discard pile after use', () => {
      expect(card.pileDestination).toBe('discard');
    });
  });

  describe('Drain Touch', () => {
    const card = ACTION_CARDS.drain_touch;

    it('exists', () => {
      expect(card).toBeDefined();
    });

    it('has correct identity', () => {
      expect(card.id).toBe('drain_touch');
      expect(card.name).toBe('Drain Touch');
      expect(card.cardType).toBe('action');
    });

    it('requires a Magician summon in play', () => {
      expect(card.requirements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'role', roleFamily: 'magician' }),
        ]),
      );
    });

    it('deals magical dark damage with basePower 30 and lifesteal', () => {
      expect(card.effects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'damage',
            basePower: 30,
            damageType: 'magical',
            element: 'dark',
            canCrit: true,
          }),
        ]),
      );
      // Verify lifesteal is mentioned in description
      expect(card.description).toMatch(/50%/);
    });

    it('targets enemy summon', () => {
      expect(card.targetType).toBe('enemy_summon');
    });

    it('goes to discard pile after use', () => {
      expect(card.pileDestination).toBe('discard');
    });
  });

  describe('Ensnare', () => {
    const card = ACTION_CARDS.ensnare;

    it('exists', () => {
      expect(card).toBeDefined();
    });

    it('has correct identity', () => {
      expect(card.id).toBe('ensnare');
      expect(card.name).toBe('Ensnare');
      expect(card.cardType).toBe('action');
    });

    it('requires a Scout summon in play', () => {
      expect(card.requirements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'role', roleFamily: 'scout' }),
        ]),
      );
    });

    it('has a damage effect', () => {
      expect(card.effects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'damage',
            basePower: 25,
            canCrit: true,
          }),
        ]),
      );
    });

    it('has a status effect for immobilize', () => {
      expect(card.effects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'status',
            duration: 'end_of_next_turn',
          }),
        ]),
      );
    });

    it('targets enemy summon', () => {
      expect(card.targetType).toBe('enemy_summon');
    });

    it('goes to discard pile after use', () => {
      expect(card.pileDestination).toBe('discard');
    });
  });

  describe('Dual Shot', () => {
    const card = ACTION_CARDS.dual_shot;

    it('exists', () => {
      expect(card).toBeDefined();
    });

    it('has correct identity', () => {
      expect(card.id).toBe('dual_shot');
      expect(card.name).toBe('Dual Shot');
      expect(card.cardType).toBe('action');
    });

    it('has a buff effect granting additional basic attack', () => {
      expect(card.effects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'buff',
            duration: 'end_of_turn',
          }),
        ]),
      );
    });

    it('targets ally summon', () => {
      expect(card.targetType).toBe('ally_summon');
    });

    it('goes to recharge pile after use', () => {
      expect(card.pileDestination).toBe('recharge');
    });
  });

  describe('Life Alchemy', () => {
    const card = ACTION_CARDS.life_alchemy;

    it('exists', () => {
      expect(card).toBeDefined();
    });

    it('has correct identity', () => {
      expect(card.id).toBe('life_alchemy');
      expect(card.name).toBe('Life Alchemy');
      expect(card.cardType).toBe('action');
    });

    it('requires a Magician summon in play', () => {
      expect(card.requirements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'role', roleFamily: 'magician' }),
        ]),
      );
    });

    it('has a special effect for 25% HP transfer', () => {
      expect(card.effects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'special',
            duration: 'instant',
          }),
        ]),
      );
      expect(card.description).toMatch(/25%/);
    });

    it('targets ally summon', () => {
      expect(card.targetType).toBe('ally_summon');
    });

    it('goes to discard pile after use', () => {
      expect(card.pileDestination).toBe('discard');
    });
  });

  // ─── Building Cards ────────────────────────────────────────────────────────

  describe('Gignen Country', () => {
    const card = BUILDING_CARDS.gignen_country;

    it('exists', () => {
      expect(card).toBeDefined();
    });

    it('has correct identity', () => {
      expect(card.id).toBe('gignen_country');
      expect(card.name).toBe('Gignen Country');
      expect(card.cardType).toBe('building');
    });

    it('has dimensions 3x2 (matching the 6 spaces from the Play Example)', () => {
      expect(card.dimensions).toEqual({ width: 3, height: 2 });
    });

    it('has a buff effect for double level-ups for Gignen summons', () => {
      expect(card.effects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'buff',
            duration: 'permanent',
          }),
        ]),
      );
    });

    it('is not a trap', () => {
      expect(card.isTrap).toBe(false);
    });
  });

  describe('Dark Altar', () => {
    const card = BUILDING_CARDS.dark_altar;

    it('exists', () => {
      expect(card).toBeDefined();
    });

    it('has correct identity', () => {
      expect(card.id).toBe('dark_altar');
      expect(card.name).toBe('Dark Altar');
      expect(card.cardType).toBe('building');
    });

    it('has dimensions 2x2 (matching the 4 spaces from the Play Example)', () => {
      expect(card.dimensions).toEqual({ width: 2, height: 2 });
    });

    it('has a special effect that self-destructs at end of turn', () => {
      expect(card.effects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'special',
            duration: 'end_of_turn',
          }),
        ]),
      );
    });

    it('is not a trap', () => {
      expect(card.isTrap).toBe(false);
    });
  });

  // ─── Quest Cards ───────────────────────────────────────────────────────────

  describe('Nearwood Forest Expedition', () => {
    const card = QUEST_CARDS.nearwood_forest_expedition;

    it('exists', () => {
      expect(card).toBeDefined();
    });

    it('has correct identity', () => {
      expect(card.id).toBe('nearwood_forest_expedition');
      expect(card.name).toBe('Nearwood Forest Expedition');
      expect(card.cardType).toBe('quest');
    });

    it('has an objective about controlling a Warrior, Scout, or Magician under level 10', () => {
      expect(card.objective).toMatch(/Warrior|Scout|Magician/);
      expect(card.objective).toMatch(/under 10|level.*10/i);
    });

    it('has reward effects that grant 2 levels', () => {
      expect(card.rewardEffects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'buff' }),
        ]),
      );
      // Description should mention 2 levels
      expect(card.rewardEffects[0].description).toMatch(/2 levels/);
    });

    it('goes to recharge pile after use', () => {
      expect(card.pileDestination).toBe('recharge');
    });
  });

  // ─── Counter Cards ─────────────────────────────────────────────────────────

  describe('Dramatic Return!', () => {
    const card = COUNTER_CARDS.dramatic_return;

    it('exists', () => {
      expect(card).toBeDefined();
    });

    it('has correct identity', () => {
      expect(card.id).toBe('dramatic_return');
      expect(card.name).toBe('Dramatic Return!');
      expect(card.cardType).toBe('counter');
    });

    it('triggers when a summon is defeated', () => {
      expect(card.triggerCondition).toBe('summon_defeated');
    });

    it('has a special effect to revive at 10% HP', () => {
      expect(card.effects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'special',
            duration: 'instant',
          }),
        ]),
      );
      expect(card.description).toMatch(/10%/);
    });

    it('goes to discard pile after use', () => {
      expect(card.pileDestination).toBe('discard');
    });
  });

  describe('Graverobbing', () => {
    const card = COUNTER_CARDS.graverobbing;

    it('exists', () => {
      expect(card).toBeDefined();
    });

    it('has correct identity', () => {
      expect(card.id).toBe('graverobbing');
      expect(card.name).toBe('Graverobbing');
      expect(card.cardType).toBe('counter');
    });

    it('triggers when a victory point is gained', () => {
      expect(card.triggerCondition).toBe('victory_point_gained');
    });

    it('has a special effect to nullify VP gain', () => {
      expect(card.effects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'special',
            duration: 'instant',
          }),
        ]),
      );
      expect(card.description).toMatch(/[Nn]ullif/);
    });

    it('goes to discard pile after use', () => {
      expect(card.pileDestination).toBe('discard');
    });
  });

  // ─── Advance Cards ─────────────────────────────────────────────────────────

  describe('Berserker Rage', () => {
    const card = ADVANCE_CARDS.berserker_rage;

    it('exists', () => {
      expect(card).toBeDefined();
    });

    it('has correct identity', () => {
      expect(card.id).toBe('berserker_rage');
      expect(card.name).toBe('Berserker Rage');
      expect(card.cardType).toBe('advance');
    });

    it('is a role_change advance type', () => {
      expect(card.advanceType).toBe('role_change');
    });

    it('targets the berserker role', () => {
      expect(card.targetRole).toBe('berserker');
    });

    it('requires a Warrior at level 10+', () => {
      expect(card.requirements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'role', roleId: 'warrior' }),
          expect.objectContaining({ type: 'level', minLevel: 10 }),
        ]),
      );
    });
  });

  describe('Shadow Pact', () => {
    const card = ADVANCE_CARDS.shadow_pact;

    it('exists', () => {
      expect(card).toBeDefined();
    });

    it('has correct identity', () => {
      expect(card.id).toBe('shadow_pact');
      expect(card.name).toBe('Shadow Pact');
      expect(card.cardType).toBe('advance');
    });

    it('is a role_change advance type', () => {
      expect(card.advanceType).toBe('role_change');
    });

    it('targets the warlock role', () => {
      expect(card.targetRole).toBe('warlock');
    });

    it('requires a Magician', () => {
      expect(card.requirements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'role', roleId: 'magician' }),
        ]),
      );
    });
  });

  describe('Alrecht Barkstep, Scoutmaster', () => {
    const card = ADVANCE_CARDS.alrecht_barkstep;

    it('exists', () => {
      expect(card).toBeDefined();
    });

    it('has correct identity', () => {
      expect(card.id).toBe('alrecht_barkstep');
      expect(card.name).toBe('Alrecht Barkstep, Scoutmaster');
      expect(card.cardType).toBe('advance');
    });

    it('is a named_summon advance type', () => {
      expect(card.advanceType).toBe('named_summon');
    });

    it('targets the rogue role', () => {
      expect(card.targetRole).toBe('rogue');
    });

    it('requires a Scout-based summon at level 10+', () => {
      expect(card.requirements).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ type: 'role', roleFamily: 'scout' }),
          expect.objectContaining({ type: 'level', minLevel: 10 }),
        ]),
      );
    });

    it('has the named summon name', () => {
      expect(card.namedSummonName).toBe('Alrecht Barkstep, Scoutmaster');
    });

    it('provides the unique action card "Follow Me!"', () => {
      expect(card.uniqueActionCards).toBeDefined();
      expect(card.uniqueActionCards).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            id: 'follow_me',
            name: 'Follow Me!',
            cardType: 'action',
            targetType: 'ally_summon',
          }),
        ]),
      );
    });

    it('"Follow Me!" has a movement effect to teleport ally to caster side', () => {
      const followMe = card.uniqueActionCards?.find(c => c.id === 'follow_me');
      expect(followMe).toBeDefined();
      expect(followMe!.effects).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            type: 'movement',
            duration: 'instant',
          }),
        ]),
      );
    });
  });

  // ─── Cross-cutting: all Play Example cards accounted for ───────────────────

  describe('All Play Example cards exist in their respective collections', () => {
    const expectedActionCards = [
      'sharpened_blade',
      'healing_hands',
      'rush',
      'blast_bolt',
      'tempest_slash',
      'drain_touch',
      'ensnare',
      'dual_shot',
      'life_alchemy',
    ];

    const expectedBuildingCards = ['gignen_country', 'dark_altar'];
    const expectedQuestCards = ['nearwood_forest_expedition'];
    const expectedCounterCards = ['dramatic_return', 'graverobbing'];
    const expectedAdvanceCards = ['berserker_rage', 'shadow_pact', 'alrecht_barkstep'];

    for (const id of expectedActionCards) {
      it(`ACTION_CARDS contains "${id}"`, () => {
        expect(ACTION_CARDS[id]).toBeDefined();
        expect(ACTION_CARDS[id].cardType).toBe('action');
      });
    }

    for (const id of expectedBuildingCards) {
      it(`BUILDING_CARDS contains "${id}"`, () => {
        expect(BUILDING_CARDS[id]).toBeDefined();
        expect(BUILDING_CARDS[id].cardType).toBe('building');
      });
    }

    for (const id of expectedQuestCards) {
      it(`QUEST_CARDS contains "${id}"`, () => {
        expect(QUEST_CARDS[id]).toBeDefined();
        expect(QUEST_CARDS[id].cardType).toBe('quest');
      });
    }

    for (const id of expectedCounterCards) {
      it(`COUNTER_CARDS contains "${id}"`, () => {
        expect(COUNTER_CARDS[id]).toBeDefined();
        expect(COUNTER_CARDS[id].cardType).toBe('counter');
      });
    }

    for (const id of expectedAdvanceCards) {
      it(`ADVANCE_CARDS contains "${id}"`, () => {
        expect(ADVANCE_CARDS[id]).toBeDefined();
        expect(ADVANCE_CARDS[id].cardType).toBe('advance');
      });
    }
  });
});
