import { GameStateValidator, ValidationResult } from './game-state-validator';
import { 
  GameState, 
  TurnPhase, 
  Player, 
  GameAction,
  Position 
} from '@summoners-grid/shared-types';

describe('GameStateValidator', () => {
  let mockGameState: GameState;
  let mockPlayerA: Player;
  let mockPlayerB: Player;

  beforeEach(() => {
    mockPlayerA = createMockPlayer('player-a', 'PlayerA');
    mockPlayerB = createMockPlayer('player-b', 'PlayerB');
    mockGameState = createMockGameState('test-game', mockPlayerA, mockPlayerB);
  });

  describe('validateGameState', () => {
    it('should validate a correct game state', () => {
      const result = GameStateValidator.validateGameState(mockGameState);
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should detect missing game IDs', () => {
      const invalidState = { ...mockGameState, id: '' };
      const result = GameStateValidator.validateGameState(invalidState);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Game state missing required IDs');
    });

    it('should detect missing format', () => {
      const invalidState = { ...mockGameState, format: undefined as any };
      const result = GameStateValidator.validateGameState(invalidState);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Game state missing format definition');
    });

    it('should detect when no players exist', () => {
      const invalidState = { 
        ...mockGameState, 
        playerA: undefined, 
        playerB: undefined 
      };
      const result = GameStateValidator.validateGameState(invalidState);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Game state must have at least one player');
    });

    it('should detect invalid board dimensions', () => {
      const invalidState = {
        ...mockGameState,
        board: {
          ...mockGameState.board,
          width: 10,
          height: 10,
        }
      };
      const result = GameStateValidator.validateGameState(invalidState);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Board must be 12x14 grid');
    });

    it('should detect negative victory points', () => {
      const invalidState = {
        ...mockGameState,
        playerA: {
          ...mockPlayerA,
          victoryPoints: -1,
        }
      };
      const result = GameStateValidator.validateGameState(invalidState);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Player A has negative victory points');
    });

    it('should warn about large hand size', () => {
      const invalidState = {
        ...mockGameState,
        playerA: {
          ...mockPlayerA,
          hand: new Array(8).fill({}).map((_, i) => ({ id: `card-${i}` })) as any,
        }
      };
      const result = GameStateValidator.validateGameState(invalidState);
      
      expect(result.isValid).toBe(true); // Warning, not error
      expect(result.warnings).toContain('Player A has more than 6 cards in hand');
    });
  });

  describe('validateAction', () => {
    it('should validate a correct action', () => {
      const action = createMockAction('A', 1, TurnPhase.DRAW, 'END_PHASE');
      const result = GameStateValidator.validateAction(action, mockGameState);
      
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    it('should detect missing action fields', () => {
      const action = { ...createMockAction('A', 1, TurnPhase.DRAW, 'END_PHASE'), id: '' };
      const result = GameStateValidator.validateAction(action, mockGameState);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Action missing required fields');
    });

    it('should detect wrong player turn', () => {
      const action = createMockAction('B', 1, TurnPhase.DRAW, 'END_PHASE');
      const result = GameStateValidator.validateAction(action, mockGameState);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Action player does not match current player');
    });

    it('should detect wrong turn number', () => {
      const action = createMockAction('A', 5, TurnPhase.DRAW, 'END_PHASE');
      const result = GameStateValidator.validateAction(action, mockGameState);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Action turn does not match current turn');
    });

    it('should detect wrong phase', () => {
      const action = createMockAction('A', 1, TurnPhase.ACTION, 'END_PHASE');
      const result = GameStateValidator.validateAction(action, mockGameState);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Action phase does not match current phase');
    });

    it('should detect invalid action for phase', () => {
      const action = createMockAction('A', 1, TurnPhase.DRAW, 'ATTACK');
      const result = GameStateValidator.validateAction(action, mockGameState);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Action ATTACK not allowed during Draw phase');
    });

    it('should validate move summon action requirements', () => {
      mockGameState.currentPhase = TurnPhase.ACTION;
      const action = {
        ...createMockAction('A', 1, TurnPhase.ACTION, 'MOVE_SUMMON'),
        fromPosition: undefined,
        toPosition: undefined,
      };
      const result = GameStateValidator.validateAction(action, mockGameState);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('MOVE_SUMMON requires fromPosition and toPosition');
    });

    it('should validate play card action requirements', () => {
      mockGameState.currentPhase = TurnPhase.ACTION;
      const action = {
        ...createMockAction('A', 1, TurnPhase.ACTION, 'PLAY_CARD'),
        cardId: undefined,
      };
      const result = GameStateValidator.validateAction(action, mockGameState);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('PLAY_CARD requires cardId');
    });

    it('should validate attack action requirements', () => {
      mockGameState.currentPhase = TurnPhase.ACTION;
      const action = {
        ...createMockAction('A', 1, TurnPhase.ACTION, 'ATTACK'),
        target: undefined,
      };
      const result = GameStateValidator.validateAction(action, mockGameState);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('ATTACK requires target');
    });
  });

  describe('Movement validation', () => {
    it('should detect out of bounds positions', () => {
      mockGameState.currentPhase = TurnPhase.ACTION;
      const action = {
        ...createMockAction('A', 1, TurnPhase.ACTION, 'MOVE_SUMMON'),
        fromPosition: { x: -1, y: 0 },
        toPosition: { x: 0, y: 0 },
      };
      const result = GameStateValidator.validateAction(action, mockGameState);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Movement positions must be within board bounds');
    });

    it('should detect occupied destination', () => {
      // Add a summon to the board
      mockGameState.board.summons.set('existing-summon', { x: 1, y: 1 });
      mockGameState.board.summons.set('moving-summon', { x: 0, y: 0 });
      mockGameState.currentPhase = TurnPhase.ACTION;
      
      const action = {
        ...createMockAction('A', 1, TurnPhase.ACTION, 'MOVE_SUMMON'),
        fromPosition: { x: 0, y: 0 },
        toPosition: { x: 1, y: 1 }, // Occupied position
      };
      const result = GameStateValidator.validateAction(action, mockGameState);
      
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Destination position is occupied');
    });
  });

  describe('Position utilities', () => {
    it('should correctly identify valid positions', () => {
      expect(GameStateValidator['isPositionValid']({ x: 0, y: 0 })).toBe(true);
      expect(GameStateValidator['isPositionValid']({ x: 11, y: 13 })).toBe(true);
      expect(GameStateValidator['isPositionValid']({ x: 6, y: 7 })).toBe(true);
    });

    it('should correctly identify invalid positions', () => {
      expect(GameStateValidator['isPositionValid']({ x: -1, y: 0 })).toBe(false);
      expect(GameStateValidator['isPositionValid']({ x: 0, y: -1 })).toBe(false);
      expect(GameStateValidator['isPositionValid']({ x: 12, y: 0 })).toBe(false);
      expect(GameStateValidator['isPositionValid']({ x: 0, y: 14 })).toBe(false);
    });

    it('should correctly identify free positions', () => {
      const gameState = createMockGameState('test', mockPlayerA, mockPlayerB);
      
      expect(GameStateValidator.isPositionFree({ x: 0, y: 0 }, gameState)).toBe(true);
      
      // Add summon and check again
      gameState.board.summons.set('summon-1', { x: 0, y: 0 });
      expect(GameStateValidator.isPositionFree({ x: 0, y: 0 }, gameState)).toBe(false);
      expect(GameStateValidator.isPositionFree({ x: 1, y: 0 }, gameState)).toBe(true);
    });

    it('should correctly calculate distance', () => {
      expect(GameStateValidator.calculateDistance({ x: 0, y: 0 }, { x: 0, y: 0 })).toBe(0);
      expect(GameStateValidator.calculateDistance({ x: 0, y: 0 }, { x: 1, y: 1 })).toBe(1);
      expect(GameStateValidator.calculateDistance({ x: 0, y: 0 }, { x: 3, y: 2 })).toBe(3);
      expect(GameStateValidator.calculateDistance({ x: 2, y: 3 }, { x: 5, y: 1 })).toBe(3);
    });

    it('should correctly check movement range', () => {
      const from = { x: 5, y: 5 };
      
      expect(GameStateValidator.isWithinMovementRange(from, { x: 5, y: 6 }, 1)).toBe(true);
      expect(GameStateValidator.isWithinMovementRange(from, { x: 6, y: 6 }, 1)).toBe(true);
      expect(GameStateValidator.isWithinMovementRange(from, { x: 5, y: 7 }, 1)).toBe(false);
      expect(GameStateValidator.isWithinMovementRange(from, { x: 7, y: 7 }, 2)).toBe(true);
      expect(GameStateValidator.isWithinMovementRange(from, { x: 8, y: 8 }, 2)).toBe(false);
    });
  });

  describe('Victory condition validation', () => {
    it('should validate proper victory conditions', () => {
      const completedState = {
        ...mockGameState,
        status: 'COMPLETED' as const,
        winner: 'A' as const,
        playerA: {
          ...mockPlayerA,
          victoryPoints: 3,
        }
      };
      
      const result = GameStateValidator.validateGameState(completedState);
      expect(result.isValid).toBe(true);
    });

    it('should detect invalid winner without victory points', () => {
      const invalidState = {
        ...mockGameState,
        status: 'COMPLETED' as const,
        winner: 'A' as const,
        playerA: {
          ...mockPlayerA,
          victoryPoints: 1, // Insufficient VP
        }
      };
      
      const result = GameStateValidator.validateGameState(invalidState);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Player A declared winner without reaching victory points');
    });

    it('should detect completed game without winner', () => {
      const invalidState = {
        ...mockGameState,
        status: 'COMPLETED' as const,
        winner: undefined,
      };
      
      const result = GameStateValidator.validateGameState(invalidState);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Completed game must have a winner or be declared a draw');
    });
  });
});

// Helper functions

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

function createMockGameState(gameId: string, playerA: Player, playerB: Player): GameState {
  return {
    id: `state-${gameId}`,
    gameId,
    format: {
      name: '3v3',
      maxSummons: 3,
      victoryPointTarget: 3,
      handSizeLimit: 6,
    },
    status: 'IN_PROGRESS',
    playerA,
    playerB,
    currentPlayer: 'A',
    currentTurn: 1,
    currentPhase: TurnPhase.DRAW,
    board: {
      width: 12,
      height: 14,
      summons: new Map(),
      buildings: new Map(),
      territories: {
        playerA: [],
        playerB: [],
        contested: [],
      },
    },
    effectStack: [],
    startTime: new Date(),
    actionHistory: [],
  };
}

function createMockAction(
  player: 'A' | 'B',
  turn: number,
  phase: TurnPhase,
  type: string
): GameAction {
  return {
    id: `action-${Date.now()}-${Math.random()}`,
    player,
    turn,
    phase,
    timestamp: new Date(),
    type: type as any,
  };
}