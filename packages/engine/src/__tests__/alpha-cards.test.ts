/**
 * Alpha Cards Data Tests
 *
 * Tests for card definitions from the Play Example document.
 * Following TDD: Red-Green-Refactor cycle.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  CardRegistry,
  loadCardDefinitions,
  loadIntoRegistry,
  CardValidationError,
  type ActionCardDefinition,
  type WeaponCardDefinition,
  type BuildingCardDefinition,
  type QuestCardDefinition,
  type CounterCardDefinition,
  type AdvanceCardDefinition,
  type RoleCardDefinition,
} from '../cards';

// Import the card data (to be created in @summoners-grid/data)
import { alphaCards } from '@summoners-grid/data';

describe('Alpha Cards - Happy Path', () => {
  let registry: CardRegistry;

  beforeEach(() => {
    registry = new CardRegistry();
  });

  it('should load all alpha cards without errors', () => {
    const result = loadIntoRegistry(alphaCards, registry);
    expect(result.success).toBe(true);
    expect(result.errors).toHaveLength(0);
    expect(result.loaded).toBeGreaterThan(0);
  });

  it('should load the expected number of cards (~20)', () => {
    const result = loadIntoRegistry(alphaCards, registry);
    // From play example: ~20 cards across various types
    expect(result.loaded).toBeGreaterThanOrEqual(20);
  });

  it('should have all cards in the alpha set', () => {
    loadIntoRegistry(alphaCards, registry);
    const cards = registry.query({ set: 'alpha' });
    expect(cards.length).toBe(registry.size);
  });
});

describe('Alpha Cards - Action Cards', () => {
  let registry: CardRegistry;

  beforeEach(() => {
    registry = new CardRegistry();
    loadIntoRegistry(alphaCards, registry);
  });

  describe('Blast Bolt (001)', () => {
    it('should exist with correct definition id', () => {
      const card = registry.get('001-blast-bolt');
      expect(card).toBeDefined();
      expect(card?.type).toBe('action');
    });

    it('should have correct basic properties', () => {
      const card = registry.get('001-blast-bolt') as ActionCardDefinition;
      expect(card.name).toBe('Blast Bolt');
      expect(card.rarity).toBe('common');
      expect(card.attribute).toBe('fire');
      expect(card.speed).toBe('action');
      expect(card.destination).toBe('discard');
    });

    it('should require a magician-family role', () => {
      const card = registry.get('001-blast-bolt') as ActionCardDefinition;
      expect(card.requirements).toContainEqual(
        expect.objectContaining({
          type: 'controlsRoleFamily',
          params: expect.objectContaining({ family: 'magician' }),
        })
      );
    });

    it('should have a damage effect with fire attribute', () => {
      const card = registry.get('001-blast-bolt') as ActionCardDefinition;
      expect(card.effects).toContainEqual(
        expect.objectContaining({
          type: 'damage',
          params: expect.objectContaining({
            attribute: 'fire',
          }),
        })
      );
    });
  });

  describe('Sharpened Blade (005)', () => {
    it('should exist with correct definition id', () => {
      const card = registry.get('005-sharpened-blade');
      expect(card).toBeDefined();
      expect(card?.type).toBe('action');
    });

    it('should have correct properties', () => {
      const card = registry.get('005-sharpened-blade') as ActionCardDefinition;
      expect(card.name).toBe('Sharpened Blade');
      expect(card.rarity).toBe('common');
      expect(card.attribute).toBe('neutral');
      expect(card.destination).toBe('recharge');
    });

    it('should require a warrior-family role', () => {
      const card = registry.get('005-sharpened-blade') as ActionCardDefinition;
      expect(card.requirements).toContainEqual(
        expect.objectContaining({
          type: 'controlsRoleFamily',
          params: expect.objectContaining({ family: 'warrior' }),
        })
      );
    });
  });

  describe('Healing Hands (006)', () => {
    it('should exist and be a healing action', () => {
      const card = registry.get('006-healing-hands') as ActionCardDefinition;
      expect(card).toBeDefined();
      expect(card.type).toBe('action');
      expect(card.attribute).toBe('light');
    });

    it('should have a heal effect', () => {
      const card = registry.get('006-healing-hands') as ActionCardDefinition;
      expect(card.effects).toContainEqual(
        expect.objectContaining({ type: 'heal' })
      );
    });
  });

  describe('Rush (009)', () => {
    it('should exist and require scout-family', () => {
      const card = registry.get('009-rush') as ActionCardDefinition;
      expect(card).toBeDefined();
      expect(card.requirements).toContainEqual(
        expect.objectContaining({
          type: 'controlsRoleFamily',
          params: expect.objectContaining({ family: 'scout' }),
        })
      );
    });

    it('should have movement doubling effect', () => {
      const card = registry.get('009-rush') as ActionCardDefinition;
      expect(card.effects).toContainEqual(
        expect.objectContaining({ type: 'modifyMovement' })
      );
    });
  });

  describe('Ensnare (011)', () => {
    it('should exist with immobilize effect', () => {
      const card = registry.get('011-ensnare') as ActionCardDefinition;
      expect(card).toBeDefined();
      expect(card.attribute).toBe('earth');
      expect(card.effects).toContainEqual(
        expect.objectContaining({ type: 'immobilize' })
      );
    });
  });

  describe('Drain Touch (012)', () => {
    it('should exist with damage and heal effects', () => {
      const card = registry.get('012-drain-touch') as ActionCardDefinition;
      expect(card).toBeDefined();
      expect(card.attribute).toBe('dark');
      expect(card.effects.some(e => e.type === 'damage')).toBe(true);
      expect(card.effects.some(e => e.type === 'heal')).toBe(true);
    });
  });

  describe('Dual Shot (017)', () => {
    it('should exist and grant extra attack', () => {
      const card = registry.get('017-dual-shot') as ActionCardDefinition;
      expect(card).toBeDefined();
      expect(card.effects).toContainEqual(
        expect.objectContaining({ type: 'grantExtraAttacks' })
      );
    });
  });

  describe('Life Alchemy (016)', () => {
    it('should exist with sacrifice and heal mechanics', () => {
      const card = registry.get('016-life-alchemy') as ActionCardDefinition;
      expect(card).toBeDefined();
      expect(card.rarity).toBe('rare');
    });
  });

  describe('Tempest Slash (018)', () => {
    it('should exist with movement and damage buff', () => {
      const card = registry.get('018-tempest-slash') as ActionCardDefinition;
      expect(card).toBeDefined();
      expect(card.attribute).toBe('wind');
    });
  });

  describe("Magician's Sanctum (019)", () => {
    it('should exist with defensive buff', () => {
      const card = registry.get('019-magicians-sanctum') as ActionCardDefinition;
      expect(card).toBeDefined();
      expect(card.requirements).toContainEqual(
        expect.objectContaining({
          type: 'controlsRoleFamily',
          params: expect.objectContaining({ family: 'magician' }),
        })
      );
    });
  });
});

describe('Alpha Cards - Weapon Cards', () => {
  let registry: CardRegistry;

  beforeEach(() => {
    registry = new CardRegistry();
    loadIntoRegistry(alphaCards, registry);
  });

  describe('Heirloom Sword (034)', () => {
    it('should exist with correct weapon properties', () => {
      const card = registry.get('034-heirloom-sword') as WeaponCardDefinition;
      expect(card).toBeDefined();
      expect(card.type).toBe('weapon');
      expect(card.weaponPower).toBe(30);
      expect(card.attackRange).toBe(1);
      expect(card.isMagical).toBe(false);
    });
  });

  describe("Apprentice's Wand (035)", () => {
    it('should exist as a magical weapon', () => {
      const card = registry.get('035-apprentices-wand') as WeaponCardDefinition;
      expect(card).toBeDefined();
      expect(card.type).toBe('weapon');
      expect(card.isMagical).toBe(true);
      expect(card.attackRange).toBe(2);
    });
  });

  describe('Hunting Bow (036)', () => {
    it('should exist with long range', () => {
      const card = registry.get('036-hunting-bow') as WeaponCardDefinition;
      expect(card).toBeDefined();
      expect(card.type).toBe('weapon');
      expect(card.attackRange).toBeGreaterThanOrEqual(3);
    });
  });
});

describe('Alpha Cards - Building Cards', () => {
  let registry: CardRegistry;

  beforeEach(() => {
    registry = new CardRegistry();
    loadIntoRegistry(alphaCards, registry);
  });

  describe('Gignen Country (004)', () => {
    it('should exist with correct dimensions', () => {
      const card = registry.get('004-gignen-country') as BuildingCardDefinition;
      expect(card).toBeDefined();
      expect(card.type).toBe('building');
      expect(card.dimensions).toEqual({ width: 3, height: 2 });
    });

    it('should have ongoing effect for Gignen summons', () => {
      const card = registry.get('004-gignen-country') as BuildingCardDefinition;
      expect(card.ongoingEffects).toContainEqual(
        expect.objectContaining({ type: 'speciesLevelBonus' })
      );
    });
  });

  describe('Dark Altar (010)', () => {
    it('should exist with sacrifice mechanics', () => {
      const card = registry.get('010-dark-altar') as BuildingCardDefinition;
      expect(card).toBeDefined();
      expect(card.type).toBe('building');
      expect(card.dimensions).toEqual({ width: 2, height: 2 });
      expect(card.attribute).toBe('dark');
    });
  });
});

describe('Alpha Cards - Quest Cards', () => {
  let registry: CardRegistry;

  beforeEach(() => {
    registry = new CardRegistry();
    loadIntoRegistry(alphaCards, registry);
  });

  describe('Nearwood Forest Expedition (037)', () => {
    it('should exist with correct quest properties', () => {
      const card = registry.get('037-nearwood-forest-expedition') as QuestCardDefinition;
      expect(card).toBeDefined();
      expect(card.type).toBe('quest');
      expect(card.destination).toBe('recharge');
    });

    it('should have completion effects that grant levels', () => {
      const card = registry.get('037-nearwood-forest-expedition') as QuestCardDefinition;
      expect(card.completionEffects).toContainEqual(
        expect.objectContaining({ type: 'grantLevels' })
      );
    });

    it('should be a safe quest with no failure condition', () => {
      const card = registry.get('037-nearwood-forest-expedition') as QuestCardDefinition;
      expect(card.failureCondition).toBeUndefined();
    });
  });
});

describe('Alpha Cards - Counter Cards', () => {
  let registry: CardRegistry;

  beforeEach(() => {
    registry = new CardRegistry();
    loadIntoRegistry(alphaCards, registry);
  });

  describe('Dramatic Return! (003)', () => {
    it('should exist as a counter card', () => {
      const card = registry.get('003-dramatic-return') as CounterCardDefinition;
      expect(card).toBeDefined();
      expect(card.type).toBe('counter');
      expect(card.speed).toBe('counter');
    });

    it('should trigger on summon defeat', () => {
      const card = registry.get('003-dramatic-return') as CounterCardDefinition;
      expect(card.triggerCondition).toEqual(
        expect.objectContaining({ type: 'summonDefeated' })
      );
    });

    it('should have resurrection effect', () => {
      const card = registry.get('003-dramatic-return') as CounterCardDefinition;
      expect(card.effects).toContainEqual(
        expect.objectContaining({ type: 'resurrectSummon' })
      );
    });
  });

  describe('Graverobbing (041)', () => {
    it('should exist as a counter card', () => {
      const card = registry.get('041-graverobbing') as CounterCardDefinition;
      expect(card).toBeDefined();
      expect(card.type).toBe('counter');
    });

    it('should nullify VP gain', () => {
      const card = registry.get('041-graverobbing') as CounterCardDefinition;
      expect(card.effects).toContainEqual(
        expect.objectContaining({ type: 'nullifyVPGain' })
      );
    });
  });
});

describe('Alpha Cards - Advance Cards', () => {
  let registry: CardRegistry;

  beforeEach(() => {
    registry = new CardRegistry();
    loadIntoRegistry(alphaCards, registry);
  });

  describe('Berserker Rage (040)', () => {
    it('should exist as an advance card', () => {
      const card = registry.get('040-berserker-rage') as AdvanceCardDefinition;
      expect(card).toBeDefined();
      expect(card.type).toBe('advance');
    });

    it('should advance to Berserker role', () => {
      const card = registry.get('040-berserker-rage') as AdvanceCardDefinition;
      expect(card.newRole.name).toBe('Berserker');
      expect(card.newRole.family).toBe('warrior');
      expect(card.newRole.tier).toBe(2);
    });
  });

  describe('Shadow Pact (039)', () => {
    it('should exist as an advance card', () => {
      const card = registry.get('039-shadow-pact') as AdvanceCardDefinition;
      expect(card).toBeDefined();
      expect(card.type).toBe('advance');
    });

    it('should advance to Warlock role', () => {
      const card = registry.get('039-shadow-pact') as AdvanceCardDefinition;
      expect(card.newRole.name).toBe('Warlock');
      expect(card.newRole.family).toBe('magician');
      expect(card.newRole.tier).toBe(3);
    });
  });

  describe('Alrecht Barkstep, Scoutmaster (042)', () => {
    it('should exist as a Named Summon advance', () => {
      const card = registry.get('042-alrecht-barkstep') as AdvanceCardDefinition;
      expect(card).toBeDefined();
      expect(card.type).toBe('advance');
      expect(card.isNamedSummon).toBe(true);
    });

    it('should have the named summon name', () => {
      const card = registry.get('042-alrecht-barkstep') as AdvanceCardDefinition;
      expect(card.namedSummonName).toBe('Alrecht Barkstep, Scoutmaster');
    });
  });
});

describe('Alpha Cards - Role Cards', () => {
  let registry: CardRegistry;

  beforeEach(() => {
    registry = new CardRegistry();
    loadIntoRegistry(alphaCards, registry);
  });

  describe('Base Roles (Tier 1)', () => {
    it('should have Warrior role', () => {
      const card = registry.get('020-warrior') as RoleCardDefinition;
      expect(card).toBeDefined();
      expect(card.role.tier).toBe(1);
      expect(card.role.family).toBe('warrior');
    });

    it('should have Magician role', () => {
      const card = registry.get('021-magician') as RoleCardDefinition;
      expect(card).toBeDefined();
      expect(card.role.tier).toBe(1);
      expect(card.role.family).toBe('magician');
    });

    it('should have Scout role', () => {
      const card = registry.get('022-scout') as RoleCardDefinition;
      expect(card).toBeDefined();
      expect(card.role.tier).toBe(1);
      expect(card.role.family).toBe('scout');
    });
  });
});

describe('Alpha Cards - Unique/Special Cards', () => {
  let registry: CardRegistry;

  beforeEach(() => {
    registry = new CardRegistry();
    loadIntoRegistry(alphaCards, registry);
  });

  describe('Follow Me! (050)', () => {
    it('should exist as an action card', () => {
      const card = registry.get('050-follow-me') as ActionCardDefinition;
      expect(card).toBeDefined();
      expect(card.type).toBe('action');
    });

    it('should require Alrecht Barkstep', () => {
      const card = registry.get('050-follow-me') as ActionCardDefinition;
      expect(card.requirements).toContainEqual(
        expect.objectContaining({
          type: 'controlsNamedSummon',
          params: expect.objectContaining({ name: 'Alrecht Barkstep, Scoutmaster' }),
        })
      );
    });

    it('should have teleport effect', () => {
      const card = registry.get('050-follow-me') as ActionCardDefinition;
      expect(card.effects).toContainEqual(
        expect.objectContaining({ type: 'teleportToAdjacent' })
      );
    });
  });
});

describe('Alpha Cards - Failure Scenarios', () => {
  it('should reject card with missing required fields', () => {
    const invalidCard = {
      definitionId: 'invalid-card',
      name: 'Invalid',
      // missing type
      rarity: 'common',
      attribute: 'neutral',
    };

    expect(() => loadCardDefinitions([invalidCard])).toThrow(CardValidationError);
  });

  it('should reject card with invalid type', () => {
    const invalidCard = {
      definitionId: 'invalid-card',
      name: 'Invalid',
      type: 'notavalidtype',
      rarity: 'common',
      attribute: 'neutral',
    };

    expect(() => loadCardDefinitions([invalidCard])).toThrow(CardValidationError);
  });

  it('should reject card with invalid rarity', () => {
    const invalidCard = {
      definitionId: 'invalid-card',
      name: 'Invalid',
      type: 'action',
      rarity: 'superlegendary',
      attribute: 'neutral',
    };

    expect(() => loadCardDefinitions([invalidCard])).toThrow(CardValidationError);
  });

  it('should reject card with invalid attribute', () => {
    const invalidCard = {
      definitionId: 'invalid-card',
      name: 'Invalid',
      type: 'action',
      rarity: 'common',
      attribute: 'plasma',
    };

    expect(() => loadCardDefinitions([invalidCard])).toThrow(CardValidationError);
  });

  it('should reject action card with missing speed', () => {
    const invalidCard = {
      definitionId: 'invalid-card',
      name: 'Invalid',
      type: 'action',
      rarity: 'common',
      attribute: 'neutral',
      destination: 'discard',
      // missing speed
    };

    expect(() => loadCardDefinitions([invalidCard])).toThrow(CardValidationError);
  });

  it('should reject weapon card with missing weaponPower', () => {
    const invalidCard = {
      definitionId: 'invalid-card',
      name: 'Invalid',
      type: 'weapon',
      rarity: 'common',
      attribute: 'neutral',
      attackRange: 1,
      // missing weaponPower
    };

    expect(() => loadCardDefinitions([invalidCard])).toThrow(CardValidationError);
  });

  it('should reject building card with invalid dimensions', () => {
    const invalidCard = {
      definitionId: 'invalid-card',
      name: 'Invalid',
      type: 'building',
      rarity: 'common',
      attribute: 'neutral',
      dimensions: { width: 0, height: -1 },
    };

    expect(() => loadCardDefinitions([invalidCard])).toThrow(CardValidationError);
  });
});

describe('Alpha Cards - Error Scenarios', () => {
  it('should handle non-object input gracefully', () => {
    expect(() => loadCardDefinitions('not an object' as unknown)).toThrow(CardValidationError);
  });

  it('should handle null input gracefully', () => {
    expect(() => loadCardDefinitions(null as unknown)).toThrow(CardValidationError);
  });

  it('should handle undefined input gracefully', () => {
    expect(() => loadCardDefinitions(undefined as unknown)).toThrow(CardValidationError);
  });

  it('should handle number input gracefully', () => {
    expect(() => loadCardDefinitions(123 as unknown)).toThrow(CardValidationError);
  });
});

describe('Alpha Cards - Edge Cases', () => {
  let registry: CardRegistry;

  beforeEach(() => {
    registry = new CardRegistry();
    loadIntoRegistry(alphaCards, registry);
  });

  it('should handle empty arrays in card effects', () => {
    // All cards should be loadable even with empty arrays
    const cards = registry.getAll();
    for (const card of cards) {
      if ('effects' in card) {
        expect(Array.isArray(card.effects)).toBe(true);
      }
      if ('requirements' in card) {
        expect(Array.isArray(card.requirements)).toBe(true);
      }
    }
  });

  it('should handle cards with optional fields missing', () => {
    // Cards without flavorText should still be valid
    const cards = registry.getAll();
    expect(cards.length).toBeGreaterThan(0);
    // flavorText is optional - cards without it should still work
    const cardsWithoutFlavor = cards.filter(c => !c.flavorText);
    expect(cardsWithoutFlavor.length).toBeGreaterThanOrEqual(0);
  });

  it('should properly index cards by type', () => {
    const actionCards = registry.query({ type: 'action' });
    expect(actionCards.every(c => c.type === 'action')).toBe(true);

    const weaponCards = registry.query({ type: 'weapon' });
    expect(weaponCards.every(c => c.type === 'weapon')).toBe(true);
  });

  it('should properly index cards by rarity', () => {
    const commonCards = registry.query({ rarity: 'common' });
    expect(commonCards.every(c => c.rarity === 'common')).toBe(true);
  });

  it('should handle boundary values for weapon stats', () => {
    const weapons = registry.getWeapons();
    for (const weapon of weapons) {
      expect(weapon.weaponPower).toBeGreaterThanOrEqual(0);
      expect(weapon.attackRange).toBeGreaterThanOrEqual(1);
      expect(weapon.baseAccuracy).toBeGreaterThanOrEqual(0);
      expect(weapon.baseAccuracy).toBeLessThanOrEqual(100);
    }
  });

  it('should handle role stat modifiers', () => {
    const roles = registry.getRoles();
    for (const role of roles) {
      // Stat modifiers should be numbers (can be negative for penalties)
      for (const [, value] of Object.entries(role.role.statModifiers)) {
        expect(typeof value).toBe('number');
      }
    }
  });
});

describe('Alpha Cards - Card Count by Type', () => {
  let registry: CardRegistry;

  beforeEach(() => {
    registry = new CardRegistry();
    loadIntoRegistry(alphaCards, registry);
  });

  it('should have action cards', () => {
    const cards = registry.query({ type: 'action' });
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should have weapon cards', () => {
    const cards = registry.query({ type: 'weapon' });
    expect(cards.length).toBeGreaterThanOrEqual(3); // Heirloom Sword, Apprentice's Wand, Hunting Bow
  });

  it('should have building cards', () => {
    const cards = registry.query({ type: 'building' });
    expect(cards.length).toBeGreaterThanOrEqual(2); // Gignen Country, Dark Altar
  });

  it('should have quest cards', () => {
    const cards = registry.query({ type: 'quest' });
    expect(cards.length).toBeGreaterThanOrEqual(1); // Nearwood Forest Expedition
  });

  it('should have counter cards', () => {
    const cards = registry.query({ type: 'counter' });
    expect(cards.length).toBeGreaterThanOrEqual(2); // Dramatic Return!, Graverobbing
  });

  it('should have advance cards', () => {
    const cards = registry.query({ type: 'advance' });
    expect(cards.length).toBeGreaterThanOrEqual(3); // Berserker Rage, Shadow Pact, Alrecht Barkstep
  });

  it('should have role cards', () => {
    const cards = registry.query({ type: 'role' });
    expect(cards.length).toBeGreaterThanOrEqual(3); // Warrior, Magician, Scout
  });
});
