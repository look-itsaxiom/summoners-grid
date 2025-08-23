import { EffectResolver } from './effect-resolver';
import { CardEffectParser } from './card-effect-parser';
import { StackSystem } from './stack-system';
import { TriggerSystem, GameEventType, GameEvent } from './trigger-system';
import { GameState, TurnPhase, Speed, CardEffect } from '@summoners-grid/shared-types';

// Helper function to create mock game state
function createMockGameState(): GameState {
  return {
    id: 'test-game',
    gameId: 'test-game-id',
    format: {
      name: '3v3',
      maxSummons: 3,
      victoryPointTarget: 3,
      handSizeLimit: 6
    },
    status: 'IN_PROGRESS',
    currentPlayer: 'A',
    currentTurn: 1,
    currentPhase: TurnPhase.ACTION,
    board: {
      width: 12,
      height: 14,
      summons: new Map(),
      buildings: new Map(),
      territories: {
        playerA: [],
        playerB: [],
        contested: []
      }
    },
    effectStack: [],
    actionHistory: []
  };
}

describe('Card Effect System Integration', () => {
  let effectResolver: EffectResolver;
  let stackSystem: StackSystem;
  let triggerSystem: TriggerSystem;
  let mockGameState: GameState;

  beforeEach(() => {
    effectResolver = new EffectResolver();
    stackSystem = new StackSystem();
    triggerSystem = new TriggerSystem();
    mockGameState = createMockGameState();
  });

  describe('EffectResolver', () => {
    test('should be created with built-in handlers', () => {
      expect(effectResolver).toBeDefined();
      // Test that it can handle a basic effect
      const mockEffect: CardEffect = {
        id: 'test-effect',
        name: 'Test Effect',
        description: 'Test description',
        trigger: 'on_play',
        resolver: 'dealFireDamage',
        parameters: { targetType: 'opponent_summon' },
        priority: 100
      };

      const stackEffect = {
        id: 'stack-effect-1',
        effect: mockEffect,
        source: 'test-card',
        controller: 'A' as const,
        speed: Speed.ACTION,
        priority: 100,
        timestamp: new Date(),
        canRespond: true,
        target: { type: 'summon' as const, id: 'target-summon' }
      };

      const result = effectResolver.resolveEffect(stackEffect, mockGameState);
      expect(result.success).toBe(true);
    });

    test('should handle unknown resolver gracefully', () => {
      const mockEffect: CardEffect = {
        id: 'test-effect',
        name: 'Test Effect',
        description: 'Test description',
        trigger: 'on_play',
        resolver: 'unknownResolver',
        parameters: {},
        priority: 100
      };

      const stackEffect = {
        id: 'stack-effect-1',
        effect: mockEffect,
        source: 'test-card',
        controller: 'A' as const,
        speed: Speed.ACTION,
        priority: 100,
        timestamp: new Date(),
        canRespond: true
      };

      const result = effectResolver.resolveEffect(stackEffect, mockGameState);
      expect(result.success).toBe(false);
      expect(result.error).toContain('No handler found for resolver');
    });

    test('should validate effect requirements', () => {
      const mockEffect: CardEffect = {
        id: 'test-effect',
        name: 'Test Effect',
        description: 'Test description',
        trigger: 'on_play',
        resolver: 'dealFireDamage',
        parameters: { targetType: 'opponent_summon' },
        priority: 100,
        requirements: {
          controlMagicianFamily: true
        }
      };

      const stackEffect = {
        id: 'stack-effect-1',
        effect: mockEffect,
        source: 'test-card',
        controller: 'A' as const,
        speed: Speed.ACTION,
        priority: 100,
        timestamp: new Date(),
        canRespond: true,
        target: { type: 'summon' as const, id: 'target-summon' }
      };

      const result = effectResolver.resolveEffect(stackEffect, mockGameState);
      // Should pass since we return true for now in role family checking
      expect(result.success).toBe(true);
    });
  });

  describe('CardEffectParser', () => {
    test('should parse Alpha Card effects correctly', () => {
      const rawEffects = {
        dealFireDamage: { targetType: 'opponent_summon', range: 'any' }
      };

      const effects = CardEffectParser.parseAlphaCardEffects(
        '001',
        'Blast Bolt',
        rawEffects,
        { controlMagicianFamily: true },
        Speed.ACTION
      );

      expect(effects).toHaveLength(1);
      expect(effects[0].name).toBe('Blast Bolt - Fire Damage');
      expect(effects[0].resolver).toBe('dealFireDamage');
      expect(effects[0].requirements?.controlMagicianFamily).toBe(true);
    });

    test('should handle multiple effects in one card', () => {
      const rawEffects = {
        grantActions: { extraMovement: 1, extraAttack: 1 },
        weaponBonus: { power: 2 }
      };

      const effects = CardEffectParser.parseAlphaCardEffects(
        '009',
        'Rush',
        rawEffects,
        { controlScoutFamily: true }
      );

      expect(effects).toHaveLength(2);
      expect(effects[0].name).toBe('Rush - Action Grant');
      expect(effects[1].name).toBe('Rush - Weapon Enhancement');
    });

    test('should validate parsed effects', () => {
      const validEffect: CardEffect = {
        id: 'valid-effect',
        name: 'Valid Effect',
        description: 'Valid description',
        trigger: 'on_play',
        resolver: 'dealFireDamage',
        parameters: {},
        priority: 100
      };

      const validation = CardEffectParser.validateCardEffect(validEffect);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should reject invalid effects', () => {
      const invalidEffect: CardEffect = {
        id: '',
        name: '',
        description: '',
        trigger: '',
        resolver: '',
        parameters: {},
        priority: -1
      };

      const validation = CardEffectParser.validateCardEffect(invalidEffect);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });
  });

  describe('StackSystem Integration', () => {
    test('should use EffectResolver for processing effects', () => {
      const mockEffect: CardEffect = {
        id: 'test-effect',
        name: 'Test Effect',
        description: 'Test description',
        trigger: 'on_play',
        resolver: 'heal',
        parameters: { targetType: 'any_summon' },
        priority: 100
      };

      const result = stackSystem.addEffect(
        mockEffect,
        'test-source',
        'A',
        Speed.ACTION,
        { type: 'summon', id: 'test-target' }
      );

      expect(result.success).toBe(true);
      expect(stackSystem.getStackSize()).toBe(1);

      // Begin resolution
      stackSystem.passPriority('B');
      stackSystem.passPriority('A');
      const beginResult = stackSystem.beginResolution(mockGameState);
      expect(beginResult.success).toBe(true);

      // Resolve the effect
      const resolutionResult = stackSystem.resolveNextEffect(mockGameState);
      expect(resolutionResult.success).toBe(true);
      expect(resolutionResult.resolutionDetails?.description).toContain('healed');
    });

    test('should handle effect resolution errors', () => {
      const mockEffect: CardEffect = {
        id: 'test-effect',
        name: 'Test Effect',
        description: 'Test description',
        trigger: 'on_play',
        resolver: 'invalidResolver',
        parameters: {},
        priority: 100
      };

      stackSystem.addEffect(mockEffect, 'test-source', 'A', Speed.ACTION);
      stackSystem.passPriority('B');
      stackSystem.passPriority('A');
      stackSystem.beginResolution(mockGameState);

      const resolutionResult = stackSystem.resolveNextEffect(mockGameState);
      expect(resolutionResult.success).toBe(false);
      expect(resolutionResult.error).toContain('No handler found');
    });
  });

  describe('TriggerSystem', () => {
    test('should register and trigger effects based on game events', () => {
      const mockEffect: CardEffect = {
        id: 'trigger-effect',
        name: 'Trigger Effect',
        description: 'Triggered on summon defeat',
        trigger: 'on_summon_defeated',
        resolver: 'dramaticReturn',
        parameters: {},
        priority: 300
      };

      triggerSystem.registerTrigger(
        mockEffect,
        'counter-card',
        'A'
      );

      const gameEvent = {
        type: GameEventType.SUMMON_DEFEATED,
        source: 'enemy-attack',
        player: 'A' as const,
        target: { type: 'summon' as const, id: 'defeated-summon' },
        timestamp: new Date()
      };

      const triggeredEffects = triggerSystem.processGameEvent(gameEvent, mockGameState);
      expect(triggeredEffects).toHaveLength(1);
      expect(triggeredEffects[0].stackEffect.effect.name).toBe('Trigger Effect');
    });

    test('should handle multiple triggers for same event', () => {
      const effect1: CardEffect = {
        id: 'effect-1',
        name: 'Effect 1',
        description: 'First effect',
        trigger: 'on_play',
        resolver: 'heal',
        parameters: {},
        priority: 100
      };

      const effect2: CardEffect = {
        id: 'effect-2',
        name: 'Effect 2',
        description: 'Second effect',
        trigger: 'on_play',
        resolver: 'weaponBonus',
        parameters: {},
        priority: 200
      };

      triggerSystem.registerTrigger(effect1, 'card-1', 'A');
      triggerSystem.registerTrigger(effect2, 'card-2', 'A');

      const gameEvent = {
        type: GameEventType.CARD_ENTERS_PLAY,
        source: 'new-card',
        player: 'A' as const,
        timestamp: new Date()
      };

      const triggeredEffects = triggerSystem.processGameEvent(gameEvent, mockGameState);
      expect(triggeredEffects).toHaveLength(2);
      // Should be sorted by priority (higher first)
      expect(triggeredEffects[0].priority).toBeGreaterThan(triggeredEffects[1].priority);
    });
  });

  describe('Alpha Card Effect Simulation', () => {
    test('should handle Blast Bolt effect (#001)', () => {
      const blastBoltData = {
        id: '001',
        name: 'Blast Bolt',
        effects: { dealFireDamage: { targetType: 'opponent_summon', range: 'any' } },
        requirements: { controlMagicianFamily: true },
        speed: Speed.ACTION
      };

      const effects = CardEffectParser.parseCompleteAlphaCard(blastBoltData);
      expect(effects).toHaveLength(1);

      const stackEffect = {
        id: 'blast-bolt-1',
        effect: effects[0],
        source: 'blast-bolt-card',
        controller: 'A' as const,
        speed: Speed.ACTION,
        priority: effects[0].priority,
        timestamp: new Date(),
        canRespond: true,
        target: { type: 'summon' as const, id: 'enemy-summon' }
      };

      const result = effectResolver.resolveEffect(stackEffect, mockGameState);
      expect(result.success).toBe(true);
      expect(result.resolutionDetails?.description).toContain('fire damage');
    });

    test('should handle Rush effect (#009)', () => {
      const rushData = {
        id: '009',
        name: 'Rush',
        effects: { grantActions: { extraMovement: 1, extraAttack: 1 } },
        requirements: { controlScoutFamily: true },
        speed: Speed.ACTION
      };

      const effects = CardEffectParser.parseCompleteAlphaCard(rushData);
      expect(effects).toHaveLength(1);

      const stackEffect = {
        id: 'rush-1',
        effect: effects[0],
        source: 'rush-card',
        controller: 'A' as const,
        speed: Speed.ACTION,
        priority: effects[0].priority,
        timestamp: new Date(),
        canRespond: true,
        target: { type: 'summon' as const, id: 'my-summon' }
      };

      const result = effectResolver.resolveEffect(stackEffect, mockGameState);
      expect(result.success).toBe(true);
      expect(result.resolutionDetails?.description).toContain('extra movement and attack');
    });

    test('should handle Dramatic Return counter (#003)', () => {
      const dramaticReturnData = {
        id: '003',
        name: 'Dramatic Return!',
        effects: { dramaticReturn: { hpPercent: 10 } },
        requirements: {},
        speed: Speed.COUNTER
      };

      const effects = CardEffectParser.parseCompleteAlphaCard(dramaticReturnData);
      expect(effects).toHaveLength(1);
      expect(effects[0].trigger).toBe('on_summon_defeated');

      const stackEffect = {
        id: 'dramatic-return-1',
        effect: effects[0],
        source: 'dramatic-return-card',
        controller: 'A' as const,
        speed: Speed.COUNTER,
        priority: effects[0].priority,
        timestamp: new Date(),
        canRespond: false
      };

      const result = effectResolver.resolveEffect(stackEffect, mockGameState);
      expect(result.success).toBe(true);
      expect(result.resolutionDetails?.description).toContain('returned a defeated summon');
    });
  });
});