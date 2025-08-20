import { GameStateManager, StateChange } from './game-state-manager';
import { 
  GameState, 
  TurnPhase, 
  Player, 
  CardInstance,
  Position 
} from '@summoners-grid/shared-types';

describe('GameStateManager', () => {
  let mockGameState: GameState;
  let mockPlayerA: Player;
  let mockPlayerB: Player;
  let mockCard: CardInstance;

  beforeEach(() => {
    mockPlayerA = createMockPlayer('player-a', 'PlayerA');
    mockPlayerB = createMockPlayer('player-b', 'PlayerB');
    mockGameState = createMockGameState('test-game', mockPlayerA, mockPlayerB);
    mockCard = createMockCard('test-card');
  });

  describe('cloneGameState', () => {
    it('should create a deep clone of game state', () => {
      const cloned = GameStateManager.cloneGameState(mockGameState);
      
      expect(cloned).not.toBe(mockGameState);
      expect(cloned).toEqual(mockGameState);
      
      // Verify maps are cloned
      expect(cloned.board.summons).not.toBe(mockGameState.board.summons);
      expect(cloned.board.buildings).not.toBe(mockGameState.board.buildings);
      
      // Verify arrays are cloned
      expect(cloned.actionHistory).not.toBe(mockGameState.actionHistory);
      expect(cloned.effectStack).not.toBe(mockGameState.effectStack);
      
      // Verify player objects are cloned
      expect(cloned.playerA).not.toBe(mockGameState.playerA);
      expect(cloned.playerB).not.toBe(mockGameState.playerB);
    });

    it('should handle undefined players', () => {
      const stateWithoutPlayers = { ...mockGameState, playerA: undefined, playerB: undefined };
      const cloned = GameStateManager.cloneGameState(stateWithoutPlayers);
      
      expect(cloned.playerA).toBeUndefined();
      expect(cloned.playerB).toBeUndefined();
    });
  });

  describe('clonePlayer', () => {
    it('should create a deep clone of player', () => {
      const cloned = GameStateManager.clonePlayer(mockPlayerA);
      
      expect(cloned).not.toBe(mockPlayerA);
      expect(cloned).toEqual(mockPlayerA);
      
      // Verify arrays are cloned
      expect(cloned.hand).not.toBe(mockPlayerA.hand);
      expect(cloned.mainDeck).not.toBe(mockPlayerA.mainDeck);
      
      // Verify maps are cloned
      expect(cloned.activeSummons).not.toBe(mockPlayerA.activeSummons);
      expect(cloned.activeBuildings).not.toBe(mockPlayerA.activeBuildings);
    });
  });

  describe('updatePlayer', () => {
    it('should update player A state immutably', () => {
      const newState = GameStateManager.updatePlayer(mockGameState, 'A', {
        victoryPoints: 2,
        level: 5,
      });
      
      expect(newState).not.toBe(mockGameState);
      expect(newState.playerA!.victoryPoints).toBe(2);
      expect(newState.playerA!.level).toBe(5);
      expect(mockGameState.playerA!.victoryPoints).toBe(0); // Original unchanged
    });

    it('should update player B state immutably', () => {
      const newState = GameStateManager.updatePlayer(mockGameState, 'B', {
        victoryPoints: 1,
        experience: 1000,
      });
      
      expect(newState).not.toBe(mockGameState);
      expect(newState.playerB!.victoryPoints).toBe(1);
      expect(newState.playerB!.experience).toBe(1000);
      expect(mockGameState.playerB!.victoryPoints).toBe(0); // Original unchanged
    });

    it('should throw error for non-existent player', () => {
      const stateWithoutPlayerA = { ...mockGameState, playerA: undefined };
      
      expect(() => {
        GameStateManager.updatePlayer(stateWithoutPlayerA, 'A', { victoryPoints: 1 });
      }).toThrow('Player A not found');
    });
  });

  describe('Card management', () => {
    it('should add card to hand', () => {
      const newState = GameStateManager.addCardToHand(mockGameState, 'A', mockCard);
      
      expect(newState.playerA!.hand).toHaveLength(1);
      expect(newState.playerA!.hand[0]).toBe(mockCard);
      expect(mockGameState.playerA!.hand).toHaveLength(0); // Original unchanged
    });

    it('should remove card from hand', () => {
      // First add a card
      mockGameState.playerA!.hand = [mockCard];
      
      const newState = GameStateManager.removeCardFromHand(mockGameState, 'A', mockCard.id);
      
      expect(newState.playerA!.hand).toHaveLength(0);
      expect(mockGameState.playerA!.hand).toHaveLength(1); // Original unchanged
    });

    it('should move card between zones', () => {
      // Setup: card in hand
      mockGameState.playerA!.hand = [mockCard];
      
      const newState = GameStateManager.moveCard(
        mockGameState, 
        'A', 
        mockCard.id, 
        'hand', 
        'discardPile'
      );
      
      expect(newState.playerA!.hand).toHaveLength(0);
      expect(newState.playerA!.discardPile).toHaveLength(1);
      expect(newState.playerA!.discardPile[0]).toBe(mockCard);
      
      // Original unchanged
      expect(mockGameState.playerA!.hand).toHaveLength(1);
      expect(mockGameState.playerA!.discardPile).toHaveLength(0);
    });

    it('should throw error when moving non-existent card', () => {
      expect(() => {
        GameStateManager.moveCard(mockGameState, 'A', 'non-existent', 'hand', 'discardPile');
      }).toThrow('Card non-existent not found in hand');
    });
  });

  describe('Board management', () => {
    const mockSummonData = {
      cardInstance: mockCard,
      currentStats: {} as any,
      role: {} as any,
      equipment: {} as any,
      statusEffects: [],
      hasAttacked: false,
      movementUsed: 0,
    };

    it('should move summon on board', () => {
      const summonId = 'summon-1';
      const oldPosition = { x: 0, y: 0 };
      const newPosition = { x: 1, y: 1 };
      
      // Setup: summon on board
      mockGameState.board.summons.set(summonId, oldPosition);
      mockGameState.playerA!.activeSummons.set(summonId, {
        ...mockSummonData,
        position: oldPosition,
      });
      
      const newState = GameStateManager.moveSummon(mockGameState, summonId, newPosition);
      
      expect(newState.board.summons.get(summonId)).toEqual(newPosition);
      expect(newState.playerA!.activeSummons.get(summonId)!.position).toEqual(newPosition);
      
      // Original unchanged
      expect(mockGameState.board.summons.get(summonId)).toEqual(oldPosition);
    });

    it('should add summon to board', () => {
      const summonId = 'summon-1';
      const position = { x: 2, y: 2 };
      
      const newState = GameStateManager.addSummonToBoard(
        mockGameState, 
        'A', 
        summonId, 
        mockSummonData, 
        position
      );
      
      expect(newState.board.summons.get(summonId)).toEqual(position);
      expect(newState.playerA!.activeSummons.has(summonId)).toBe(true);
      
      // Original unchanged
      expect(mockGameState.board.summons.has(summonId)).toBe(false);
    });

    it('should remove summon from board', () => {
      const summonId = 'summon-1';
      const position = { x: 3, y: 3 };
      
      // Setup: summon on board
      mockGameState.board.summons.set(summonId, position);
      mockGameState.playerA!.activeSummons.set(summonId, mockSummonData);
      
      const newState = GameStateManager.removeSummonFromBoard(mockGameState, summonId);
      
      expect(newState.board.summons.has(summonId)).toBe(false);
      expect(newState.playerA!.activeSummons.has(summonId)).toBe(false);
      
      // Original unchanged
      expect(mockGameState.board.summons.has(summonId)).toBe(true);
    });
  });

  describe('Turn management', () => {
    it('should update turn phase', () => {
      const newState = GameStateManager.updateTurnPhase(mockGameState, TurnPhase.ACTION);
      
      expect(newState.currentPhase).toBe(TurnPhase.ACTION);
      expect(mockGameState.currentPhase).toBe(TurnPhase.DRAW); // Original unchanged
    });

    it('should switch to next player', () => {
      const newState = GameStateManager.switchToNextPlayer(mockGameState);
      
      expect(newState.currentPlayer).toBe('B');
      expect(newState.currentTurn).toBe(1); // Still turn 1
      expect(newState.currentPhase).toBe(TurnPhase.DRAW);
      
      // Original unchanged
      expect(mockGameState.currentPlayer).toBe('A');
    });

    it('should increment turn when returning to player A', () => {
      // Start with player B
      mockGameState.currentPlayer = 'B';
      mockGameState.currentTurn = 1;
      
      const newState = GameStateManager.switchToNextPlayer(mockGameState);
      
      expect(newState.currentPlayer).toBe('A');
      expect(newState.currentTurn).toBe(2);
      expect(newState.currentPhase).toBe(TurnPhase.DRAW);
    });
  });

  describe('Victory points management', () => {
    it('should update victory points', () => {
      const newState = GameStateManager.updateVictoryPoints(mockGameState, 'A', 2);
      
      expect(newState.playerA!.victoryPoints).toBe(2);
      expect(mockGameState.playerA!.victoryPoints).toBe(0); // Original unchanged
    });

    it('should prevent negative victory points', () => {
      const newState = GameStateManager.updateVictoryPoints(mockGameState, 'A', -5);
      
      expect(newState.playerA!.victoryPoints).toBe(0);
    });

    it('should throw error for non-existent player', () => {
      const stateWithoutPlayerA = { ...mockGameState, playerA: undefined };
      
      expect(() => {
        GameStateManager.updateVictoryPoints(stateWithoutPlayerA, 'A', 1);
      }).toThrow('Player A not found');
    });
  });

  describe('Effect stack management', () => {
    const mockEffect = { id: 'effect-1', type: 'test' };

    it('should add effect to stack', () => {
      const newState = GameStateManager.addEffectToStack(mockGameState, mockEffect);
      
      expect(newState.effectStack).toHaveLength(1);
      expect(newState.effectStack[0]).toBe(mockEffect);
      expect(mockGameState.effectStack).toHaveLength(0); // Original unchanged
    });

    it('should remove effect from stack (top)', () => {
      mockGameState.effectStack = [mockEffect, { id: 'effect-2', type: 'test2' }];
      
      const newState = GameStateManager.removeEffectFromStack(mockGameState);
      
      expect(newState.effectStack).toHaveLength(1);
      expect(newState.effectStack[0].id).toBe('effect-1');
      expect(mockGameState.effectStack).toHaveLength(2); // Original unchanged
    });

    it('should remove effect from stack (specific index)', () => {
      mockGameState.effectStack = [mockEffect, { id: 'effect-2', type: 'test2' }];
      
      const newState = GameStateManager.removeEffectFromStack(mockGameState, 0);
      
      expect(newState.effectStack).toHaveLength(1);
      expect(newState.effectStack[0].id).toBe('effect-2');
    });
  });

  describe('State comparison', () => {
    it('should detect changes between states', () => {
      const originalState = GameStateManager.cloneGameState(mockGameState);
      const modifiedState = GameStateManager.updatePlayer(originalState, 'A', { victoryPoints: 2 });
      
      const changes = GameStateManager.compareGameStates(originalState, modifiedState);
      
      expect(changes).toHaveLength(1);
      expect(changes[0].type).toBe('VICTORY_POINTS_CHANGED');
      expect(changes[0].data.player).toBe('A');
      expect(changes[0].data.from).toBe(0);
      expect(changes[0].data.to).toBe(2);
    });

    it('should detect player changes', () => {
      const originalState = GameStateManager.cloneGameState(mockGameState);
      const modifiedState = GameStateManager.switchToNextPlayer(originalState);
      
      const changes = GameStateManager.compareGameStates(originalState, modifiedState);
      
      const playerChange = changes.find(c => c.type === 'PLAYER_CHANGED');
      expect(playerChange).toBeDefined();
      expect(playerChange!.data.from).toBe('A');
      expect(playerChange!.data.to).toBe('B');
    });

    it('should detect summon movements', () => {
      const originalState = GameStateManager.cloneGameState(mockGameState);
      originalState.board.summons.set('summon-1', { x: 0, y: 0 });
      
      const modifiedState = GameStateManager.moveSummon(originalState, 'summon-1', { x: 1, y: 1 });
      
      const changes = GameStateManager.compareGameStates(originalState, modifiedState);
      
      const moveChange = changes.find(c => c.type === 'SUMMON_MOVED');
      expect(moveChange).toBeDefined();
      expect(moveChange!.data.summonId).toBe('summon-1');
      expect(moveChange!.data.from).toEqual({ x: 0, y: 0 });
      expect(moveChange!.data.to).toEqual({ x: 1, y: 1 });
    });

    it('should return empty changes for identical states', () => {
      const changes = GameStateManager.compareGameStates(mockGameState, mockGameState);
      expect(changes).toEqual([]);
    });
  });

  describe('State equality', () => {
    it('should return true for identical states', () => {
      const isEqual = GameStateManager.areStatesEqual(mockGameState, mockGameState);
      expect(isEqual).toBe(true);
    });

    it('should return true for equivalent states', () => {
      const cloned = GameStateManager.cloneGameState(mockGameState);
      const isEqual = GameStateManager.areStatesEqual(mockGameState, cloned);
      expect(isEqual).toBe(true);
    });

    it('should return false for different states', () => {
      const modified = GameStateManager.updatePlayer(mockGameState, 'A', { victoryPoints: 1 });
      const isEqual = GameStateManager.areStatesEqual(mockGameState, modified);
      expect(isEqual).toBe(false);
    });

    it('should return false for different board states', () => {
      const modified = GameStateManager.cloneGameState(mockGameState);
      modified.board.summons.set('test-summon', { x: 0, y: 0 });
      
      const isEqual = GameStateManager.areStatesEqual(mockGameState, modified);
      expect(isEqual).toBe(false);
    });
  });

  describe('State snapshot', () => {
    it('should create minimal state representation', () => {
      const snapshot = GameStateManager.createStateSnapshot(mockGameState);
      
      expect(snapshot).toEqual({
        gameId: 'test-game',
        status: 'IN_PROGRESS',
        turn: 1,
        phase: TurnPhase.DRAW,
        currentPlayer: 'A',
        playerAVP: 0,
        playerBVP: 0,
        summonCount: 0,
        buildingCount: 0,
        effectStackSize: 0,
        actionCount: 0,
      });
    });

    it('should handle undefined players in snapshot', () => {
      const stateWithoutPlayers = { ...mockGameState, playerA: undefined, playerB: undefined };
      const snapshot = GameStateManager.createStateSnapshot(stateWithoutPlayers);
      
      expect(snapshot.playerAVP).toBe(0);
      expect(snapshot.playerBVP).toBe(0);
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

function createMockCard(id: string): CardInstance {
  return {
    id,
    templateId: 'template-1',
    ownerId: 'player-a',
    signature: 'test-signature',
    signatureChain: [],
    mintedAt: new Date(),
    acquiredMethod: 'TEST',
    isLocked: false,
    createdAt: new Date(),
  };
}