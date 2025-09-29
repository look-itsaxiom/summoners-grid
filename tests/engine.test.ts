/**
 * Basic integration test for the game engine
 * Tests core functionality and TRR system
 */

import { createGameEngine } from '../src/index';
import { Phase, CardType, Attribute, SpeedLevel } from '../src/types/base';
import { Card } from '../src/types/card';

describe('Game Engine Integration', () => {
  let engine: ReturnType<typeof createGameEngine>;
  
  beforeEach(() => {
    engine = createGameEngine();
  });

  test('should create a new game engine', () => {
    expect(engine).toBeDefined();
    expect(engine.getState).toBeDefined();
    expect(engine.addPlayer).toBeDefined();
    expect(engine.startGame).toBeDefined();
  });

  test('should add players to the game', () => {
    engine.addPlayer('player1', 'Alice');
    engine.addPlayer('player2', 'Bob');
    
    const state = engine.getState();
    expect(Object.keys(state.players)).toHaveLength(2);
    expect(state.players['player1'].name).toBe('Alice');
    expect(state.players['player2'].name).toBe('Bob');
  });

  test('should start a game with proper turn structure', () => {
    engine.addPlayer('player1', 'Alice');
    engine.addPlayer('player2', 'Bob');
    engine.startGame();
    
    const state = engine.getState();
    expect(state.turnState.currentPlayer).toBe('player1');
    expect(state.turnState.phase).toBe(Phase.Draw);
    expect(state.turnState.turnNumber).toBe(1);
    expect(state.players['player1'].priority).toBe(true);
  });

  test('should serialize and deserialize state', () => {
    engine.addPlayer('player1', 'Alice');
    engine.addPlayer('player2', 'Bob');
    
    const serialized = engine.serialize();
    expect(serialized).toBeDefined();
    expect(typeof serialized).toBe('string');
    
    // Should be valid JSON
    const parsed = JSON.parse(serialized);
    expect(parsed.players).toBeDefined();
    expect(Object.keys(parsed.players)).toHaveLength(2);
  });

  test('should advance phases correctly', () => {
    engine.addPlayer('player1', 'Alice');
    engine.addPlayer('player2', 'Bob'); 
    engine.startGame();
    
    // Initial: Draw phase
    expect(engine.getState().turnState.phase).toBe(Phase.Draw);
    
    engine.advancePhase();
    expect(engine.getState().turnState.phase).toBe(Phase.Level);
    
    engine.advancePhase();
    expect(engine.getState().turnState.phase).toBe(Phase.Action);
    
    engine.advancePhase();
    expect(engine.getState().turnState.phase).toBe(Phase.End);
    
    engine.advancePhase();
    // Should be next player's draw phase
    expect(engine.getState().turnState.phase).toBe(Phase.Draw);
    expect(engine.getState().turnState.currentPlayer).toBe('player2');
  });

  test('should handle events correctly', () => {
    const events: any[] = [];
    const unsubscribe = engine.subscribe('gameStarted', (event: any) => {
      events.push(event);
    });
    
    engine.addPlayer('player1', 'Alice');
    engine.addPlayer('player2', 'Bob');
    engine.startGame();
    
    expect(events.length).toBeGreaterThan(0);
    unsubscribe();
  });

  test('should load deck for players', () => {
    const testCard: Card = {
      id: 'test-card-1',
      name: 'Test Card',
      type: CardType.Action,
      attribute: Attribute.Neutral,
      speed: SpeedLevel.Action,
      rarity: 'common',
      cost: { type: 'none' },
      text: 'Test card description',
      effects: [],
      targetType: 'none'
    } as Card;
    
    engine.addPlayer('player1', 'Alice');
    engine.loadDeck('player1', [testCard]);
    
    const state = engine.getState();
    expect(state.players['player1'].zones.mainDeck).toHaveLength(1);
    expect(state.players['player1'].zones.mainDeck[0].name).toBe('Test Card');
  });

  test('should get legal actions for players', () => {
    engine.addPlayer('player1', 'Alice');
    engine.addPlayer('player2', 'Bob');
    engine.startGame();
    
    const actions = engine.getLegalActions('player1');
    expect(actions).toBeDefined();
    expect(Array.isArray(actions)).toBe(true);
    
    // Should always have pass priority action
    const passAction = actions.find(a => a.type === 'passPriority');
    expect(passAction).toBeDefined();
  });
});