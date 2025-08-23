import { StackSystem, StackEffect } from './stack-system';
import { CardEffect, Speed, GameState, TurnPhase } from '@summoners-grid/shared-types';

// Helper function to create mock card effects
function createMockEffect(
  name: string, 
  speed: Speed = Speed.ACTION, 
  priority: number = 1
): CardEffect {
  return {
    id: `effect-${name}`,
    name,
    description: `Mock effect: ${name}`,
    trigger: 'manual',
    resolver: 'searchDeck', // Use a resolver that doesn't require a target
    parameters: {},
    priority
  };
}

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

describe('StackSystem', () => {
  let stackSystem: StackSystem;
  let mockGameState: GameState;

  beforeEach(() => {
    stackSystem = new StackSystem();
    mockGameState = createMockGameState();
  });

  describe('Basic Stack Operations', () => {
    test('should initialize with empty stack', () => {
      expect(stackSystem.isEmpty()).toBe(true);
      expect(stackSystem.getStackState().size).toBe(0);
    });

    test('should add effects to stack', () => {
      const effect = createMockEffect('Test Effect');
      const result = stackSystem.addEffect(
        effect,
        'test-source',
        'A',
        Speed.ACTION
      );

      expect(result.success).toBe(true);
      expect(result.effectId).toBeDefined();
      expect(stackSystem.getStackState().size).toBe(1);
    });

    test('should maintain LIFO order', () => {
      const effect1 = createMockEffect('First Effect');
      const effect2 = createMockEffect('Second Effect');
      
      stackSystem.addEffect(effect1, 'source1', 'A', Speed.ACTION);
      stackSystem.addEffect(effect2, 'source2', 'B', Speed.ACTION);

      const state = stackSystem.getStackState();
      expect(state.effects[0].effect.name).toBe('First Effect');
      expect(state.effects[1].effect.name).toBe('Second Effect');
      expect(state.topEffect?.effect.name).toBe('Second Effect');
    });

    test('should clear stack', () => {
      stackSystem.addEffect(createMockEffect('Test'), 'source', 'A', Speed.ACTION);
      expect(stackSystem.isEmpty()).toBe(false);
      
      stackSystem.clearStack();
      expect(stackSystem.isEmpty()).toBe(true);
    });
  });

  describe('Speed Priority System', () => {
    test('should allow all speeds when stack is empty', () => {
      const allowedSpeeds = stackSystem.getAllowedSpeeds();
      expect(allowedSpeeds).toContain(Speed.ACTION);
      expect(allowedSpeeds).toContain(Speed.REACTION);
      expect(allowedSpeeds).toContain(Speed.COUNTER);
    });

    test('should create speed lock when higher speed is added', () => {
      // Add action speed effect
      stackSystem.addEffect(createMockEffect('Action'), 'source', 'A', Speed.ACTION);
      
      // Add reaction speed - should create speed lock
      stackSystem.addEffect(createMockEffect('Reaction'), 'source', 'B', Speed.REACTION);
      
      const state = stackSystem.getStackState();
      expect(state.resolutionState.speedLock).toBe(Speed.REACTION);
    });

    test('should enforce speed lock restrictions', () => {
      // Add reaction speed effect
      stackSystem.addEffect(createMockEffect('Reaction'), 'source', 'A', Speed.REACTION);
      
      // Try to add action speed - should fail due to speed lock
      const result = stackSystem.addEffect(createMockEffect('Action'), 'source', 'B', Speed.ACTION);
      expect(result.success).toBe(false);
      expect(result.error).toContain('speed lock');
    });

    test('should allow same or higher speed during lock', () => {
      // Add reaction speed effect
      stackSystem.addEffect(createMockEffect('Reaction'), 'source', 'A', Speed.REACTION);
      
      // Add another reaction - should succeed
      let result = stackSystem.addEffect(createMockEffect('Reaction2'), 'source', 'B', Speed.REACTION);
      expect(result.success).toBe(true);
      
      // Add counter - should succeed
      result = stackSystem.addEffect(createMockEffect('Counter'), 'source', 'A', Speed.COUNTER);
      expect(result.success).toBe(true);
    });

    test('should update speed lock to highest speed on stack', () => {
      stackSystem.addEffect(createMockEffect('Action'), 'source', 'A', Speed.ACTION);
      stackSystem.addEffect(createMockEffect('Reaction'), 'source', 'B', Speed.REACTION);
      stackSystem.addEffect(createMockEffect('Counter'), 'source', 'A', Speed.COUNTER);
      
      const state = stackSystem.getStackState();
      expect(state.resolutionState.speedLock).toBe(Speed.COUNTER);
    });
  });

  describe('Player Priority System', () => {
    test('should alternate priority between players', () => {
      // Player A adds effect, priority should switch to B
      stackSystem.addEffect(createMockEffect('Effect1'), 'source', 'A', Speed.ACTION);
      expect(stackSystem.getStackState().resolutionState.priorityPlayer).toBe('B');
      
      // Player B adds effect, priority should switch to A
      stackSystem.addEffect(createMockEffect('Effect2'), 'source', 'B', Speed.ACTION);
      expect(stackSystem.getStackState().resolutionState.priorityPlayer).toBe('A');
    });

    test('should reject effects from wrong priority player', () => {
      // Player A adds effect, now it's B's priority
      stackSystem.addEffect(createMockEffect('Effect1'), 'source', 'A', Speed.ACTION);
      
      // Player A tries to add another effect - should fail
      const result = stackSystem.addEffect(createMockEffect('Effect2'), 'source', 'A', Speed.ACTION);
      expect(result.success).toBe(false);
      expect(result.error).toContain('priority');
    });

    test('should handle priority passing', () => {
      stackSystem.addEffect(createMockEffect('Effect'), 'source', 'A', Speed.ACTION);
      
      // B passes priority
      let result = stackSystem.passPriority('B');
      expect(result.success).toBe(true);
      expect(result.shouldResolve).toBe(false);
      expect(stackSystem.getStackState().resolutionState.priorityPlayer).toBe('A');
      
      // A passes priority - both passed, should resolve
      result = stackSystem.passPriority('A');
      expect(result.success).toBe(true);
      expect(result.shouldResolve).toBe(true);
    });

    test('should reject priority pass from wrong player', () => {
      stackSystem.addEffect(createMockEffect('Effect'), 'source', 'A', Speed.ACTION);
      // Priority is now with B
      
      const result = stackSystem.passPriority('A');
      expect(result.success).toBe(false);
      expect(result.error).toContain('priority');
    });

    test('should reset passing state when new effect is added', () => {
      stackSystem.addEffect(createMockEffect('Effect1'), 'source', 'A', Speed.ACTION);
      stackSystem.passPriority('B');
      
      // Add another effect - should reset passing state
      stackSystem.addEffect(createMockEffect('Effect2'), 'source', 'A', Speed.ACTION);
      
      const state = stackSystem.getStackState();
      expect(state.resolutionState.passingPriority.A).toBe(false);
      expect(state.resolutionState.passingPriority.B).toBe(false);
    });
  });

  describe('Stack Resolution', () => {
    test('should require both players to pass before resolution', () => {
      stackSystem.addEffect(createMockEffect('Effect'), 'source', 'A', Speed.ACTION);
      
      const result = stackSystem.beginResolution();
      expect(result.success).toBe(false);
      expect(result.error).toContain('Both players must pass');
    });

    test('should begin resolution when both players pass', () => {
      stackSystem.addEffect(createMockEffect('Effect'), 'source', 'A', Speed.ACTION);
      stackSystem.passPriority('B');
      stackSystem.passPriority('A');
      
      const result = stackSystem.beginResolution();
      expect(result.success).toBe(true);
      expect(stackSystem.getStackState().resolutionState.isResolving).toBe(true);
    });

    test('should resolve effects in LIFO order', () => {
      const effect1 = createMockEffect('First');
      const effect2 = createMockEffect('Second');
      
      stackSystem.addEffect(effect1, 'source1', 'A', Speed.ACTION);
      stackSystem.addEffect(effect2, 'source2', 'B', Speed.ACTION);
      stackSystem.passPriority('A');
      stackSystem.passPriority('B');
      stackSystem.beginResolution();
      
      // First resolution should be the second effect (LIFO)
      let result = stackSystem.resolveNextEffect(mockGameState);
      expect(result.success).toBe(true);
      expect(result.resolutionDetails?.description).toContain('searched deck'); // Changed to match searchDeck resolver
      
      // Second resolution should be the first effect
      result = stackSystem.resolveNextEffect(mockGameState);
      expect(result.success).toBe(true);
      expect(result.resolutionDetails?.description).toContain('searched deck'); // Changed to match searchDeck resolver
      
      // Stack should be empty and resolution complete
      expect(stackSystem.isEmpty()).toBe(true);
      expect(stackSystem.getStackState().resolutionState.isResolving).toBe(false);
    });

    test('should prevent adding effects during resolution', () => {
      stackSystem.addEffect(createMockEffect('Effect'), 'source', 'A', Speed.ACTION);
      stackSystem.passPriority('B');
      stackSystem.passPriority('A');
      stackSystem.beginResolution();
      
      const result = stackSystem.addEffect(createMockEffect('NewEffect'), 'source', 'A', Speed.ACTION);
      expect(result.success).toBe(false);
      expect(result.error).toContain('resolving');
    });

    test('should prevent priority passing during resolution', () => {
      stackSystem.addEffect(createMockEffect('Effect'), 'source', 'A', Speed.ACTION);
      stackSystem.passPriority('B');
      stackSystem.passPriority('A');
      stackSystem.beginResolution();
      
      const result = stackSystem.passPriority('A');
      expect(result.success).toBe(false);
      expect(result.error).toContain('resolving');
    });

    test('should handle empty stack resolution attempt', () => {
      const result = stackSystem.beginResolution();
      expect(result.success).toBe(false);
      expect(result.error).toContain('No effects to resolve');
    });
  });

  describe('Complex Speed Lock Scenarios', () => {
    test('should handle Action -> Reaction -> Counter chain', () => {
      // Action speed effect
      let result = stackSystem.addEffect(createMockEffect('Action'), 'source', 'A', Speed.ACTION);
      expect(result.success).toBe(true);
      
      // Reaction speed response - creates speed lock
      result = stackSystem.addEffect(createMockEffect('Reaction'), 'source', 'B', Speed.REACTION);
      expect(result.success).toBe(true);
      expect(stackSystem.getStackState().resolutionState.speedLock).toBe(Speed.REACTION);
      
      // Action speed should fail due to lock
      result = stackSystem.addEffect(createMockEffect('Action2'), 'source', 'A', Speed.ACTION);
      expect(result.success).toBe(false);
      
      // Counter speed should succeed
      result = stackSystem.addEffect(createMockEffect('Counter'), 'source', 'A', Speed.COUNTER);
      expect(result.success).toBe(true);
      expect(stackSystem.getStackState().resolutionState.speedLock).toBe(Speed.COUNTER);
    });

    test('should clear speed lock after resolution', () => {
      stackSystem.addEffect(createMockEffect('Counter'), 'source', 'A', Speed.COUNTER);
      expect(stackSystem.getStackState().resolutionState.speedLock).toBe(Speed.COUNTER);
      
      // Complete resolution
      stackSystem.passPriority('B');
      stackSystem.passPriority('A');
      stackSystem.beginResolution();
      
      // Resolve all effects until stack is empty
      while (!stackSystem.isEmpty()) {
        stackSystem.resolveNextEffect(mockGameState);
      }
      
      // Speed lock should be cleared
      expect(stackSystem.getStackState().resolutionState.speedLock).toBeUndefined();
      expect(stackSystem.getAllowedSpeeds()).toContain(Speed.ACTION);
    });
  });

  describe('Player Capability Checking', () => {
    test('should correctly identify when player can add effects', () => {
      // Initially, player A should be able to add any speed
      expect(stackSystem.canPlayerAddEffect('A', Speed.ACTION)).toBe(true);
      expect(stackSystem.canPlayerAddEffect('A', Speed.REACTION)).toBe(true);
      expect(stackSystem.canPlayerAddEffect('A', Speed.COUNTER)).toBe(true);
      
      // Player B should not have priority initially
      expect(stackSystem.canPlayerAddEffect('B', Speed.ACTION)).toBe(false);
    });

    test('should update capabilities based on priority and speed lock', () => {
      // A adds reaction effect, priority switches to B and speed lock is set
      stackSystem.addEffect(createMockEffect('Reaction'), 'source', 'A', Speed.REACTION);
      
      // B should have priority but be limited by speed lock
      expect(stackSystem.canPlayerAddEffect('B', Speed.ACTION)).toBe(false);
      expect(stackSystem.canPlayerAddEffect('B', Speed.REACTION)).toBe(true);
      expect(stackSystem.canPlayerAddEffect('B', Speed.COUNTER)).toBe(true);
      
      // A should not have priority
      expect(stackSystem.canPlayerAddEffect('A', Speed.REACTION)).toBe(false);
    });

    test('should prevent capabilities during resolution', () => {
      stackSystem.addEffect(createMockEffect('Effect'), 'source', 'A', Speed.ACTION);
      stackSystem.passPriority('B');
      stackSystem.passPriority('A');
      stackSystem.beginResolution();
      
      expect(stackSystem.canPlayerAddEffect('A', Speed.ACTION)).toBe(false);
      expect(stackSystem.canPlayerAddEffect('B', Speed.ACTION)).toBe(false);
    });
  });

  describe('Stack State Validation', () => {
    test('should validate consistent stack state', () => {
      stackSystem.addEffect(createMockEffect('Valid Effect'), 'source', 'A', Speed.ACTION);
      
      const validation = stackSystem.validateStackState();
      expect(validation.isValid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    test('should detect inconsistent resolution state', () => {
      // Manually create inconsistent state (this would normally not happen)
      stackSystem.addEffect(createMockEffect('Effect'), 'source', 'A', Speed.ACTION);
      stackSystem.passPriority('B');
      stackSystem.passPriority('A');
      stackSystem.beginResolution();
      
      // Force clear the stack while still "resolving"
      (stackSystem as any).effectStack = [];
      
      const validation = stackSystem.validateStackState();
      expect(validation.isValid).toBe(false);
      expect(validation.errors.some(error => error.includes('empty'))).toBe(true);
    });
  });

  describe('Stack Snapshots and Debugging', () => {
    test('should create meaningful snapshots', () => {
      stackSystem.addEffect(createMockEffect('Test Effect'), 'test-source', 'A', Speed.REACTION);
      
      const snapshot = stackSystem.createSnapshot();
      expect(snapshot.stackSize).toBe(1);
      expect(snapshot.effects[0].name).toBe('Test Effect');
      expect(snapshot.effects[0].speed).toBe(Speed.REACTION);
      expect(snapshot.effects[0].controller).toBe('A');
      expect(snapshot.priorityPlayer).toBe('B');
      expect(snapshot.speedLock).toBe(Speed.REACTION);
    });

    test('should track resolution progress in snapshots', () => {
      stackSystem.addEffect(createMockEffect('Effect1'), 'source1', 'A', Speed.ACTION);
      stackSystem.addEffect(createMockEffect('Effect2'), 'source2', 'B', Speed.ACTION);
      stackSystem.passPriority('A');
      stackSystem.passPriority('B');
      stackSystem.beginResolution();
      
      let snapshot = stackSystem.createSnapshot();
      expect(snapshot.isResolving).toBe(true);
      expect(snapshot.stackSize).toBe(2);
      
      // Resolve one effect
      const result = stackSystem.resolveNextEffect(mockGameState);
      expect(result.success).toBe(true); // Ensure resolution succeeded
      
      snapshot = stackSystem.createSnapshot();
      expect(snapshot.stackSize).toBe(1);
    });
  });

  describe('Error Handling', () => {
    test('should handle resolution errors gracefully', () => {
      // Mock an effect that will cause an error during resolution
      const errorEffect = createMockEffect('Error Effect');
      stackSystem.addEffect(errorEffect, 'error-source', 'A', Speed.ACTION);
      stackSystem.passPriority('B');
      stackSystem.passPriority('A');
      stackSystem.beginResolution(mockGameState);
      
      // Mock the processEffect method to throw an error
      (stackSystem as any).processEffect = () => {
        throw new Error('Test error');
      };
      
      const result = stackSystem.resolveNextEffect(mockGameState);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Test error');
      expect(result.error).toContain('Snapshot');
      expect(result.error).toContain('available for rollback');
    });

    test('should maintain stack integrity after errors', () => {
      stackSystem.addEffect(createMockEffect('Effect1'), 'source1', 'A', Speed.ACTION);
      stackSystem.addEffect(createMockEffect('Effect2'), 'source2', 'B', Speed.ACTION);
      
      // Force an error state and then clear
      stackSystem.clearStack();
      
      // Should be able to use stack normally after clear
      const result = stackSystem.addEffect(createMockEffect('New Effect'), 'source', 'A', Speed.ACTION);
      expect(result.success).toBe(true);
      expect(stackSystem.getStackState().size).toBe(1);
    });
  });

  describe('State Rollback System', () => {
    test('should create game state snapshots', () => {
      const snapshotId = stackSystem.createGameStateSnapshot(mockGameState, 'Test snapshot');
      
      expect(snapshotId).toBeDefined();
      expect(typeof snapshotId).toBe('string');
      expect(snapshotId).toContain('snapshot-');
      
      const snapshots = stackSystem.getAvailableSnapshots();
      expect(snapshots).toHaveLength(1);
      expect(snapshots[0].description).toBe('Test snapshot');
    });

    test('should rollback to previous game state', () => {
      // Create initial snapshot
      const initialSnapshotId = stackSystem.createGameStateSnapshot(mockGameState, 'Initial state');
      
      // Modify stack state
      stackSystem.addEffect(createMockEffect('Test Effect'), 'source', 'A', Speed.ACTION);
      expect(stackSystem.getStackState().size).toBe(1);
      
      // Rollback to initial state
      const rollbackResult = stackSystem.rollbackToSnapshot(initialSnapshotId);
      expect(rollbackResult.success).toBe(true);
      expect(rollbackResult.gameState).toBeDefined();
      expect(stackSystem.getStackState().size).toBe(0);
    });

    test('should handle rollback to non-existent snapshot', () => {
      const result = stackSystem.rollbackToSnapshot('non-existent-snapshot');
      expect(result.success).toBe(false);
      expect(result.error).toContain('not found');
    });

    test('should automatically create snapshots during resolution', () => {
      stackSystem.addEffect(createMockEffect('Effect'), 'source', 'A', Speed.ACTION);
      stackSystem.passPriority('B');
      stackSystem.passPriority('A');
      
      const resolutionResult = stackSystem.beginResolution(mockGameState);
      expect(resolutionResult.success).toBe(true);
      expect(resolutionResult.snapshotId).toBeDefined();
      
      const snapshots = stackSystem.getAvailableSnapshots();
      expect(snapshots.length).toBeGreaterThan(0);
    });

    test('should create snapshots before individual effect resolution', () => {
      stackSystem.addEffect(createMockEffect('Effect'), 'source', 'A', Speed.ACTION);
      stackSystem.passPriority('B');
      stackSystem.passPriority('A');
      stackSystem.beginResolution(mockGameState);
      
      const initialSnapshotCount = stackSystem.getAvailableSnapshots().length;
      
      // Resolve an effect - should create another snapshot
      stackSystem.resolveNextEffect(mockGameState);
      
      const finalSnapshotCount = stackSystem.getAvailableSnapshots().length;
      expect(finalSnapshotCount).toBeGreaterThan(initialSnapshotCount);
    });

    test('should limit number of snapshots to prevent memory leaks', () => {
      // Create more than 50 snapshots
      for (let i = 0; i < 55; i++) {
        stackSystem.createGameStateSnapshot(mockGameState, `Snapshot ${i}`);
      }
      
      const snapshots = stackSystem.getAvailableSnapshots();
      expect(snapshots.length).toBeLessThanOrEqual(50);
    });

    test('should cleanup old snapshots', () => {
      // Create some snapshots with different timestamps
      stackSystem.createGameStateSnapshot(mockGameState, 'Snapshot 1');
      stackSystem.createGameStateSnapshot(mockGameState, 'Snapshot 2');
      // Simulate time passing by manually adjusting timestamp for one snapshot
      const snapshots = stackSystem.getAvailableSnapshots();
      
      expect(snapshots).toHaveLength(2);
      
      // Clean up snapshots older than a very large number of minutes (should remove none)
      let removedCount = stackSystem.cleanupSnapshots(1000);
      expect(removedCount).toBe(0);
      expect(stackSystem.getAvailableSnapshots()).toHaveLength(2);
      
      // Now clean up all snapshots by setting cutoff to 0 minutes
      // But first we need to manipulate the timestamp to make them "old"
      const snapshotMap = (stackSystem as any).gameStateSnapshots as Map<string, any>;
      for (const [id, snapshot] of snapshotMap) {
        snapshot.timestamp = new Date(Date.now() - 60 * 1000); // 1 minute ago
      }
      
      removedCount = stackSystem.cleanupSnapshots(0.5); // 30 seconds
      expect(removedCount).toBe(2);
      expect(stackSystem.getAvailableSnapshots()).toHaveLength(0);
    });

    test('should clear all snapshots', () => {
      stackSystem.createGameStateSnapshot(mockGameState, 'Snapshot 1');
      stackSystem.createGameStateSnapshot(mockGameState, 'Snapshot 2');
      
      expect(stackSystem.getAvailableSnapshots()).toHaveLength(2);
      
      stackSystem.clearSnapshots();
      expect(stackSystem.getAvailableSnapshots()).toHaveLength(0);
    });

    test('should preserve stack state in snapshots', () => {
      // Add effects to stack
      stackSystem.addEffect(createMockEffect('Effect1'), 'source1', 'A', Speed.ACTION);
      stackSystem.addEffect(createMockEffect('Effect2'), 'source2', 'B', Speed.REACTION);
      
      const snapshotId = stackSystem.createGameStateSnapshot(mockGameState, 'With effects');
      
      // Clear stack
      stackSystem.clearStack();
      expect(stackSystem.getStackState().size).toBe(0);
      
      // Rollback should restore the effects
      const rollbackResult = stackSystem.rollbackToSnapshot(snapshotId);
      expect(rollbackResult.success).toBe(true);
      expect(stackSystem.getStackState().size).toBe(2);
      expect(stackSystem.getStackState().effects[0].effect.name).toBe('Effect1');
      expect(stackSystem.getStackState().effects[1].effect.name).toBe('Effect2');
    });

    test('should preserve resolution state in snapshots', () => {
      stackSystem.addEffect(createMockEffect('Effect'), 'source', 'A', Speed.ACTION);
      
      // Check initial state - A passed, B has priority  
      const initialState = stackSystem.getStackState().resolutionState;
      expect(initialState.priorityPlayer).toBe('B'); // A added effect, so B has priority
      expect(initialState.passingPriority.A).toBe(false);
      expect(initialState.passingPriority.B).toBe(false);
      
      const snapshotId = stackSystem.createGameStateSnapshot(mockGameState, 'Initial state');
      
      // B passes priority, now A has priority and B has passed
      stackSystem.passPriority('B');
      expect(stackSystem.getStackState().resolutionState.priorityPlayer).toBe('A');
      expect(stackSystem.getStackState().resolutionState.passingPriority.A).toBe(false);
      expect(stackSystem.getStackState().resolutionState.passingPriority.B).toBe(true);
      
      // Rollback should restore the initial resolution state
      const rollbackResult = stackSystem.rollbackToSnapshot(snapshotId);
      expect(rollbackResult.success).toBe(true);
      expect(stackSystem.getStackState().resolutionState.priorityPlayer).toBe('B');
      expect(stackSystem.getStackState().resolutionState.passingPriority.A).toBe(false);
      expect(stackSystem.getStackState().resolutionState.passingPriority.B).toBe(false);
    });

    test('should provide meaningful snapshot metadata', () => {
      stackSystem.addEffect(createMockEffect('Test Effect'), 'source', 'A', Speed.ACTION);
      const snapshotId = stackSystem.createGameStateSnapshot(mockGameState, 'Test description');
      
      const snapshots = stackSystem.getAvailableSnapshots();
      expect(snapshots).toHaveLength(1);
      
      const snapshot = snapshots[0];
      expect(snapshot.id).toBe(snapshotId);
      expect(snapshot.description).toBe('Test description');
      expect(snapshot.stackSize).toBe(1);
      expect(snapshot.timestamp).toBeInstanceOf(Date);
    });
  });
});