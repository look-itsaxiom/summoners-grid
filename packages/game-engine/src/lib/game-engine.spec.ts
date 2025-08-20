import { 
  GameEngine, 
  GameEngineConfig, 
  GameEventType, 
  ActionResult 
} from './game-engine';
import { 
  GameState, 
  TurnPhase, 
  Player, 
  GameAction 
} from '@summoners-grid/shared-types';

describe('GameEngine', () => {
  let gameEngine: GameEngine;
  let mockPlayerA: Player;
  let mockPlayerB: Player;

  beforeEach(() => {
    gameEngine = new GameEngine({ debugMode: true });
    
    // Create mock players with minimal required properties
    mockPlayerA = createMockPlayer('player-a', 'PlayerA');
    mockPlayerB = createMockPlayer('player-b', 'PlayerB');
  });

  describe('Basic functionality', () => {
    it('should work', () => {
      expect(gameEngine).toBeDefined();
    });

    it('should initialize with default config', () => {
      const engine = new GameEngine();
      expect(engine).toBeDefined();
      expect(engine.getGameState()).toBeNull();
    });

    it('should accept custom config', () => {
      const config: GameEngineConfig = {
        debugMode: true,
        randomSeed: 'test-seed',
        format: {
          name: '3v3',
          maxSummons: 3,
          victoryPointTarget: 3,
          handSizeLimit: 6,
        },
      };
      const engine = new GameEngine(config);
      expect(engine).toBeDefined();
    });
  });

  describe('Game initialization', () => {
    it('should initialize a new game with correct initial state', () => {
      const gameId = 'test-game-123';
      const gameState = gameEngine.initializeGame(gameId, mockPlayerA, mockPlayerB);

      // Verify basic game state
      expect(gameState).toBeDefined();
      expect(gameState.gameId).toBe(gameId);
      expect(gameState.status).toBe('IN_PROGRESS');
      expect(gameState.currentPlayer).toBe('A');
      expect(gameState.currentTurn).toBe(1);
      expect(gameState.currentPhase).toBe(TurnPhase.DRAW);
      expect(gameState.playerA).toEqual(mockPlayerA);
      expect(gameState.playerB).toEqual(mockPlayerB);

      // Verify board initialization
      expect(gameState.board).toBeDefined();
      expect(gameState.board.width).toBe(12);
      expect(gameState.board.height).toBe(14);
      expect(gameState.board.summons).toBeInstanceOf(Map);
      expect(gameState.board.buildings).toBeInstanceOf(Map);

      // Verify territories
      expect(gameState.board.territories.playerA).toHaveLength(36); // 3 rows × 12 columns
      expect(gameState.board.territories.playerB).toHaveLength(36);
      expect(gameState.board.territories.contested).toHaveLength(96); // 8 rows × 12 columns

      // Verify other initial state
      expect(gameState.effectStack).toEqual([]);
      expect(gameState.actionHistory).toEqual([]);
      expect(gameState.startTime).toBeInstanceOf(Date);
    });

    it('should store and return the same game state', () => {
      const gameId = 'test-game-456';
      const initialState = gameEngine.initializeGame(gameId, mockPlayerA, mockPlayerB);
      const retrievedState = gameEngine.getGameState();

      expect(retrievedState).toEqual(initialState);
    });
  });

  describe('Phase management', () => {
    beforeEach(() => {
      gameEngine.initializeGame('test-game', mockPlayerA, mockPlayerB);
    });

    it('should advance through turn phases correctly', () => {
      let gameState = gameEngine.getGameState()!;
      expect(gameState.currentPhase).toBe(TurnPhase.DRAW);

      // Advance DRAW -> LEVEL
      let result = gameEngine.advancePhase();
      expect(result.success).toBe(true);
      gameState = gameEngine.getGameState()!;
      expect(gameState.currentPhase).toBe(TurnPhase.LEVEL);

      // Advance LEVEL -> ACTION
      result = gameEngine.advancePhase();
      expect(result.success).toBe(true);
      gameState = gameEngine.getGameState()!;
      expect(gameState.currentPhase).toBe(TurnPhase.ACTION);

      // Advance ACTION -> END
      result = gameEngine.advancePhase();
      expect(result.success).toBe(true);
      gameState = gameEngine.getGameState()!;
      expect(gameState.currentPhase).toBe(TurnPhase.END);
    });

    it('should advance to next turn after END phase', () => {
      let gameState = gameEngine.getGameState()!;
      expect(gameState.currentPlayer).toBe('A');
      expect(gameState.currentTurn).toBe(1);
      expect(gameState.currentPhase).toBe(TurnPhase.DRAW);

      // Advance through all phases to trigger turn change
      gameEngine.advancePhase(); // DRAW -> LEVEL
      gameEngine.advancePhase(); // LEVEL -> ACTION
      gameEngine.advancePhase(); // ACTION -> END
      
      // Advance END -> next turn (DRAW, Player B)
      const result = gameEngine.advancePhase();
      expect(result.success).toBe(true);
      
      gameState = gameEngine.getGameState()!;
      expect(gameState.currentPlayer).toBe('B');
      expect(gameState.currentTurn).toBe(1); // Still turn 1 until both players finish
      expect(gameState.currentPhase).toBe(TurnPhase.DRAW);
    });

    it('should increment turn number when returning to player A', () => {
      // Complete player A's turn
      gameEngine.advancePhase(); // DRAW -> LEVEL
      gameEngine.advancePhase(); // LEVEL -> ACTION
      gameEngine.advancePhase(); // ACTION -> END
      gameEngine.advancePhase(); // END -> Player B's turn

      // Complete player B's turn
      gameEngine.advancePhase(); // DRAW -> LEVEL
      gameEngine.advancePhase(); // LEVEL -> ACTION
      gameEngine.advancePhase(); // ACTION -> END
      gameEngine.advancePhase(); // END -> Player A's turn (Turn 2)

      const gameState = gameEngine.getGameState()!;
      expect(gameState.currentPlayer).toBe('A');
      expect(gameState.currentTurn).toBe(2);
      expect(gameState.currentPhase).toBe(TurnPhase.DRAW);
    });
  });

  describe('Action submission', () => {
    beforeEach(() => {
      gameEngine.initializeGame('test-game', mockPlayerA, mockPlayerB);
    });

    it('should reject actions when game not initialized', () => {
      const uninitializedEngine = new GameEngine();
      const action = createMockAction('A', 1, TurnPhase.DRAW, 'END_PHASE');
      
      const result = uninitializedEngine.submitAction('player-a', action);
      expect(result.success).toBe(false);
      expect(result.message).toBe('Game not initialized');
    });

    it('should validate player turn', () => {
      const action = createMockAction('B', 1, TurnPhase.DRAW, 'END_PHASE'); // Player B tries to act on Player A's turn
      
      const result = gameEngine.submitAction('player-b', action);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Not your turn');
    });

    it('should validate turn number', () => {
      const action = createMockAction('A', 5, TurnPhase.DRAW, 'END_PHASE'); // Wrong turn number
      
      const result = gameEngine.submitAction('player-a', action);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid turn number');
    });

    it('should validate phase', () => {
      const action = createMockAction('A', 1, TurnPhase.ACTION, 'END_PHASE'); // Wrong phase
      
      const result = gameEngine.submitAction('player-a', action);
      expect(result.success).toBe(false);
      expect(result.errors).toContain('Invalid phase for this action');
    });

    it('should accept valid actions', () => {
      const action = createMockAction('A', 1, TurnPhase.DRAW, 'END_PHASE');
      
      const result = gameEngine.submitAction('player-a', action);
      expect(result.success).toBe(true);
      expect(result.newGameState).toBeDefined();
    });

    it('should add actions to history', () => {
      const action = createMockAction('A', 1, TurnPhase.DRAW, 'END_PHASE');
      
      gameEngine.submitAction('player-a', action);
      const gameState = gameEngine.getGameState()!;
      
      expect(gameState.actionHistory).toHaveLength(1);
      expect(gameState.actionHistory[0]).toEqual(action);
    });
  });

  describe('Event system', () => {
    it('should emit and handle events', () => {
      const eventHandler = jest.fn();
      gameEngine.addEventListener(GameEventType.GAME_STARTED, eventHandler);

      gameEngine.initializeGame('test-game', mockPlayerA, mockPlayerB);

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: GameEventType.GAME_STARTED,
          gameId: 'test-game',
        })
      );
    });

    it('should remove event listeners', () => {
      const eventHandler = jest.fn();
      gameEngine.addEventListener(GameEventType.GAME_STARTED, eventHandler);
      gameEngine.removeEventListener(GameEventType.GAME_STARTED, eventHandler);

      gameEngine.initializeGame('test-game', mockPlayerA, mockPlayerB);

      expect(eventHandler).not.toHaveBeenCalled();
    });

    it('should emit phase change events', () => {
      const eventHandler = jest.fn();
      gameEngine.addEventListener(GameEventType.PHASE_CHANGED, eventHandler);
      gameEngine.initializeGame('test-game', mockPlayerA, mockPlayerB);

      gameEngine.advancePhase();

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: GameEventType.PHASE_CHANGED,
          data: expect.objectContaining({
            previousPhase: TurnPhase.DRAW,
            newPhase: TurnPhase.LEVEL,
          }),
        })
      );
    });

    it('should emit turn started events', () => {
      const eventHandler = jest.fn();
      gameEngine.addEventListener(GameEventType.TURN_STARTED, eventHandler);
      gameEngine.initializeGame('test-game', mockPlayerA, mockPlayerB);

      // Complete player A's turn to trigger player B's turn
      gameEngine.advancePhase(); // DRAW -> LEVEL
      gameEngine.advancePhase(); // LEVEL -> ACTION
      gameEngine.advancePhase(); // ACTION -> END
      gameEngine.advancePhase(); // END -> Player B's turn

      expect(eventHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: GameEventType.TURN_STARTED,
          data: expect.objectContaining({
            turn: 1,
            player: 'B',
          }),
        })
      );
    });
  });

  describe('Serialization', () => {
    beforeEach(() => {
      gameEngine.initializeGame('test-game', mockPlayerA, mockPlayerB);
    });

    it('should serialize game state to JSON', () => {
      const serialized = gameEngine.serializeGameState();
      expect(typeof serialized).toBe('string');
      
      const parsed = JSON.parse(serialized);
      expect(parsed.gameId).toBe('test-game');
      expect(parsed.currentPlayer).toBe('A');
      expect(parsed.currentTurn).toBe(1);
    });

    it('should deserialize game state from JSON', () => {
      const originalState = gameEngine.getGameState()!;
      const serialized = gameEngine.serializeGameState();
      const deserialized = gameEngine.deserializeGameState(serialized);

      expect(deserialized.gameId).toBe(originalState.gameId);
      expect(deserialized.currentPlayer).toBe(originalState.currentPlayer);
      expect(deserialized.currentTurn).toBe(originalState.currentTurn);
      expect(deserialized.board.summons).toBeInstanceOf(Map);
      expect(deserialized.board.buildings).toBeInstanceOf(Map);
    });

    it('should handle Maps in serialization/deserialization', () => {
      const originalState = gameEngine.getGameState()!;
      const serialized = gameEngine.serializeGameState();
      const deserialized = gameEngine.deserializeGameState(serialized);

      expect(deserialized.board.summons).toBeInstanceOf(Map);
      expect(deserialized.board.buildings).toBeInstanceOf(Map);
      expect(deserialized.playerA?.activeSummons).toBeInstanceOf(Map);
      expect(deserialized.playerA?.activeBuildings).toBeInstanceOf(Map);
      expect(deserialized.playerB?.activeSummons).toBeInstanceOf(Map);
      expect(deserialized.playerB?.activeBuildings).toBeInstanceOf(Map);
    });
  });

  describe('Victory conditions', () => {
    beforeEach(() => {
      gameEngine.initializeGame('test-game', mockPlayerA, mockPlayerB);
    });

    it('should detect no winner when game just started', () => {
      const result = gameEngine.checkGameEnd();
      expect(result.hasEnded).toBe(false);
    });

    it('should detect victory when player A reaches target VP', () => {
      const gameState = gameEngine.getGameState()!;
      // Manually set victory points for testing
      gameState.playerA!.victoryPoints = 3;
      
      const result = gameEngine.checkGameEnd();
      expect(result.hasEnded).toBe(true);
      expect(result.winner).toBe('A');
      expect(result.reason).toBe('Victory points reached');
    });

    it('should detect victory when player B reaches target VP', () => {
      const gameState = gameEngine.getGameState()!;
      gameState.playerB!.victoryPoints = 3;
      
      const result = gameEngine.checkGameEnd();
      expect(result.hasEnded).toBe(true);
      expect(result.winner).toBe('B');
      expect(result.reason).toBe('Victory points reached');
    });

    it('should handle tiebreaker by summon count', () => {
      const gameState = gameEngine.getGameState()!;
      gameState.playerA!.victoryPoints = 3;
      gameState.playerB!.victoryPoints = 3;
      
      // Add mock summons to player A
      gameState.playerA!.activeSummons.set('summon-1', {} as any);
      gameState.playerA!.activeSummons.set('summon-2', {} as any);
      gameState.playerB!.activeSummons.set('summon-3', {} as any);
      
      const result = gameEngine.checkGameEnd();
      expect(result.hasEnded).toBe(true);
      expect(result.winner).toBe('A');
      expect(result.reason).toBe('Victory points reached (tiebreaker: more summons)');
    });

    it('should handle draw when tied VP and summon count', () => {
      const gameState = gameEngine.getGameState()!;
      gameState.playerA!.victoryPoints = 3;
      gameState.playerB!.victoryPoints = 3;
      
      // Equal summon counts
      gameState.playerA!.activeSummons.set('summon-1', {} as any);
      gameState.playerB!.activeSummons.set('summon-2', {} as any);
      
      const result = gameEngine.checkGameEnd();
      expect(result.hasEnded).toBe(true);
      expect(result.winner).toBe('DRAW');
      expect(result.reason).toBe('Victory points reached (tied summon count)');
    });
  });
});

// Helper functions for creating test data

function createMockPlayer(id: string, username: string): Player {
  return {
    id,
    username,
    displayName: username,
    level: 1,
    experience: 0,
    rating: 1000,
    victoryPoints: 0,
    hand: [],
    mainDeck: [],
    advanceDeck: [],
    discardPile: [],
    rechargePile: [],
    activeSummons: new Map(),
    activeBuildings: new Map(),
  };
}

function createMockAction(
  player: 'A' | 'B',
  turn: number,
  phase: TurnPhase,
  type: string
): GameAction {
  return {
    id: `action-${Date.now()}`,
    player,
    turn,
    phase,
    timestamp: new Date(),
    type: type as any,
  };
}
