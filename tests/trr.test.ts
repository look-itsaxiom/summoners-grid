/**
 * Test TRR (Trigger → Response → Resolution) system
 */

import { EventBus } from '../src/engine/EventBus';
import { GameStateManager } from '../src/engine/GameState';
import { TRRManager } from '../src/engine/TRR';
import { createDefaultEffectRegistry } from '../src/engine/EffectRegistry';
import { SpeedLevel, Phase } from '../src/types/base';
import { EventType } from '../src/types/action';
import { EffectStackEntry } from '../src/types/game';

describe('TRR System', () => {
  let eventBus: EventBus;
  let gameState: GameStateManager;
  let trrManager: TRRManager;

  beforeEach(() => {
    eventBus = new EventBus();
    gameState = new GameStateManager();
    const effectRegistry = createDefaultEffectRegistry();
    trrManager = new TRRManager(gameState, eventBus, effectRegistry);
  });

  test('should handle effect stack LIFO resolution', () => {
    // Create test effects
    const effect1: EffectStackEntry = {
      id: 'effect1',
      ownerId: 'player1',
      sourceCardId: 'card1',
      effectId: 'test_effect',
      speed: SpeedLevel.Action,
      parameters: {},
      targets: [],
      timestamp: 1
    };

    const effect2: EffectStackEntry = {
      id: 'effect2', 
      ownerId: 'player2',
      sourceCardId: 'card2',
      effectId: 'test_effect',
      speed: SpeedLevel.Reaction,
      parameters: {},
      targets: [],
      timestamp: 2
    };

    // Add effects to stack
    let updatedState = gameState.addToEffectStack(effect1);
    updatedState = updatedState.addToEffectStack(effect2);
    
    const stack = updatedState.getState().effectStack;
    expect(stack).toHaveLength(2);
    expect(stack[1]).toEqual(effect2); // Latest effect on top
    expect(stack[0]).toEqual(effect1); // Earlier effect on bottom
  });

  test('should enforce speed lock rules', () => {
    // Test Counter blocks lower speeds
    const counterEffect: EffectStackEntry = {
      id: 'counter1',
      ownerId: 'player1',
      sourceCardId: 'card1', 
      effectId: 'test_counter',
      speed: SpeedLevel.Counter,
      parameters: {},
      targets: [],
      timestamp: 1
    };
    
    const actionEffect: EffectStackEntry = {
      id: 'action1',
      ownerId: 'player2',
      sourceCardId: 'card2',
      effectId: 'test_action', 
      speed: SpeedLevel.Action,
      parameters: {},
      targets: [],
      timestamp: 2
    };

    // Should be able to add counter to empty stack
    let updatedState = gameState.addToEffectStack(counterEffect);
    expect(updatedState.getState().effectStack).toHaveLength(1);

    // Create new TRR manager with updated state
    const updatedTRR = new TRRManager(updatedState, eventBus, createDefaultEffectRegistry());

    // Should not be able to add action when counter is on stack
    expect(() => {
      updatedTRR.addEffectToStack(actionEffect);
    }).toThrow();
  });

  test('should emit proper events during TRR processing', () => {
    const events: any[] = [];
    
    eventBus.subscribe(EventType.EffectActivated, (event) => {
      events.push(event);
    });

    const testEffect: EffectStackEntry = {
      id: 'test1',
      ownerId: 'player1', 
      sourceCardId: 'card1',
      effectId: 'deal_damage',
      speed: SpeedLevel.Action,
      parameters: { damage: 10 },
      targets: ['target1'],
      timestamp: Date.now()
    };

    trrManager.addEffectToStack(testEffect);
    
    expect(events).toHaveLength(1);
    expect(events[0].type).toBe(EventType.EffectActivated);
    expect(events[0].data.effectId).toBe('deal_damage');
  });

  test('should handle priority windows correctly', () => {
    // Add two players
    gameState = gameState.addPlayer('player1', 'Alice');
    gameState = gameState.addPlayer('player2', 'Bob');
    
    // Set turn state
    gameState = gameState.updateTurnState({
      currentPlayer: 'player1',
      phase: Phase.Action,
      turnNumber: 1,
      phaseStep: 0
    });

    const testEffect: EffectStackEntry = {
      id: 'test_priority',
      ownerId: 'player1',
      sourceCardId: 'card1',
      effectId: 'test_effect',
      speed: SpeedLevel.Action,
      parameters: {},
      targets: [],
      timestamp: Date.now()
    };

    gameState = gameState.addToEffectStack(testEffect);
    
    // Process TRR pipeline
    const updatedState = trrManager.processTRRPipeline();
    
    // Should handle the processing without errors
    expect(updatedState).toBeDefined();
  });
});