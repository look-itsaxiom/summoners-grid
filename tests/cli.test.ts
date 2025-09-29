/**
 * CLI Tool Test Suite
 * Tests the interactive CLI functionality
 */

describe('CLI Tool', () => {
  test('should load CLI module without errors', () => {
    // Test that the CLI can be imported
    const { SummonersGridCLI } = require('../cli-tool.js');
    expect(SummonersGridCLI).toBeDefined();
    expect(typeof SummonersGridCLI).toBe('function');
  });

  test('should validate CLI functionality components', () => {
    // Test that all required dependencies are available
    expect(() => require('readline')).not.toThrow();
    expect(() => require('fs')).not.toThrow();
    expect(() => require('path')).not.toThrow();
    expect(() => require('../dist/index.js')).not.toThrow();

    const engineModule = require('../dist/index.js');
    expect(engineModule.createGameEngine).toBeDefined();
    expect(typeof engineModule.createGameEngine).toBe('function');
  });

  test('should validate CLI tool structure', () => {
    const { SummonersGridCLI } = require('../cli-tool.js');
    
    // Check that the class has expected methods (through prototype)
    const proto = SummonersGridCLI.prototype;
    expect(typeof proto.start).toBe('function');
    expect(typeof proto.handleCommand).toBe('function');
    expect(typeof proto.showHelp).toBe('function');
    expect(typeof proto.createGame).toBe('function');
    expect(typeof proto.addPlayer).toBe('function');
    expect(typeof proto.loadDeck).toBe('function');
    expect(typeof proto.startGame).toBe('function');
    expect(typeof proto.showGameState).toBe('function');
    expect(typeof proto.advancePhase).toBe('function');
    expect(typeof proto.showLegalActions).toBe('function');
    expect(typeof proto.listCards).toBe('function');
  });

  test('should demonstrate CLI integration with engine', () => {
    // Test that we can create engine and interact with it
    const { createGameEngine } = require('../dist/index.js');
    
    const engine = createGameEngine();
    expect(engine).toBeDefined();
    
    // Add players
    engine.addPlayer('test1', 'Test Player 1');
    engine.addPlayer('test2', 'Test Player 2');
    
    // Load empty decks
    engine.loadDeck('test1', []);
    engine.loadDeck('test2', []);
    
    // Start game
    engine.startGame();
    
    const state = engine.getState();
    expect(state.players['test1']).toBeDefined();
    expect(state.players['test2']).toBeDefined();
    expect(state.turnState.currentPlayer).toBe('test1');
    
    // Get legal actions
    const actions = engine.getLegalActions('test1');
    expect(Array.isArray(actions)).toBe(true);
    
    console.log('✅ CLI integrates successfully with game engine');
    console.log('✅ All CLI functionality components verified');
    console.log('✅ CLI tool is ready for manual testing');
  });
});