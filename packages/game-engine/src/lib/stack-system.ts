import {
  CardEffect,
  Speed,
  GameState,
  CombatTarget,
} from '@summoners-grid/shared-types';

/**
 * Represents an effect on the stack with all necessary metadata
 */
export interface StackEffect {
  /** Unique identifier for this stack effect instance */
  id: string;
  /** The card effect definition */
  effect: CardEffect;
  /** Source card/entity that created this effect */
  source: string;
  /** Player who controls this effect */
  controller: 'A' | 'B';
  /** Target(s) of this effect */
  target?: CombatTarget;
  /** Speed level for resolution priority */
  speed: Speed;
  /** Priority value for same-speed ordering */
  priority: number;
  /** Timestamp when added to stack */
  timestamp: Date;
  /** Whether this effect can be responded to */
  canRespond: boolean;
  /** Additional parameters passed to effect */
  parameters?: Record<string, any>;
}

/**
 * Result of effect resolution
 */
export interface EffectResolutionResult {
  /** Whether the effect resolved successfully */
  success: boolean;
  /** New game state after resolution */
  gameState: GameState;
  /** Any triggered effects to add to stack */
  triggeredEffects: StackEffect[];
  /** Error message if resolution failed */
  error?: string;
  /** Details about what the effect did */
  resolutionDetails?: {
    description: string;
    affectedEntities: string[];
    stateChanges: any[];
  };
}

/**
 * Current stack state and resolution context
 */
export interface StackResolutionState {
  /** Current player who can add responses */
  priorityPlayer: 'A' | 'B';
  /** Whether stack is currently locked to specific speeds */
  speedLock?: Speed;
  /** Whether players are passing priority */
  passingPriority: { A: boolean; B: boolean };
  /** Number of consecutive passes */
  consecutivePasses: number;
  /** Whether stack is currently resolving */
  isResolving: boolean;
  /** Index of currently resolving effect */
  resolvingIndex?: number;
}

/**
 * Snapshot of game state for rollback purposes
 */
export interface GameStateSnapshot {
  /** Unique identifier for this snapshot */
  id: string;
  /** Timestamp when snapshot was created */
  timestamp: Date;
  /** Complete game state at time of snapshot */
  gameState: GameState;
  /** Stack state at time of snapshot */
  stackState: StackEffect[];
  /** Resolution state at time of snapshot */
  resolutionState: StackResolutionState;
  /** Description of what triggered this snapshot */
  description: string;
}

/**
 * StackSystem - Implements LIFO effect resolution with speed priorities
 * 
 * Key Features:
 * - Last-In-First-Out (LIFO) resolution order
 * - Speed-based priority system (Counter > Reaction > Action)
 * - Speed lock mechanism preventing invalid responses
 * - Player priority alternation for response windows
 * - State rollback capabilities for complex interactions
 * - Comprehensive validation and error handling
 */
export class StackSystem {
  private effectStack: StackEffect[] = [];
  private resolutionState: StackResolutionState;
  private effectIdCounter = 0;
  private snapshotIdCounter = 0;
  private gameStateSnapshots: Map<string, GameStateSnapshot> = new Map();

  constructor() {
    this.resolutionState = {
      priorityPlayer: 'A',
      passingPriority: { A: false, B: false },
      consecutivePasses: 0,
      isResolving: false,
    };
  }

  /**
   * Generate unique effect ID
   */
  private generateEffectId(): string {
    return `stack-effect-${Date.now()}-${++this.effectIdCounter}`;
  }

  /**
   * Generate unique snapshot ID
   */
  private generateSnapshotId(): string {
    return `snapshot-${Date.now()}-${++this.snapshotIdCounter}`;
  }

  /**
   * Get numerical priority for speed comparison
   */
  private getSpeedPriority(speed: Speed): number {
    switch (speed) {
      case Speed.COUNTER: return 3;
      case Speed.REACTION: return 2;
      case Speed.ACTION: return 1;
      default: return 0;
    }
  }

  /**
   * Check if a speed can be played given current speed lock
   */
  private canPlaySpeed(speed: Speed): boolean {
    if (!this.resolutionState.speedLock) {
      return true;
    }

    const currentLockPriority = this.getSpeedPriority(this.resolutionState.speedLock);
    const requestedPriority = this.getSpeedPriority(speed);

    // Can only play speeds equal to or higher than the lock
    return requestedPriority >= currentLockPriority;
  }

  /**
   * Update speed lock based on newly added effect
   */
  private updateSpeedLock(newEffectSpeed: Speed): void {
    const newPriority = this.getSpeedPriority(newEffectSpeed);
    const currentPriority = this.resolutionState.speedLock 
      ? this.getSpeedPriority(this.resolutionState.speedLock)
      : 0;

    // Speed lock increases to the highest speed on stack
    if (newPriority > currentPriority) {
      this.resolutionState.speedLock = newEffectSpeed;
    }
  }

  /**
   * Add effect to the stack with proper ordering and validation
   */
  public addEffect(
    effect: CardEffect,
    source: string,
    controller: 'A' | 'B',
    speed: Speed,
    target?: CombatTarget,
    parameters?: Record<string, any>
  ): { success: boolean; error?: string; effectId?: string } {
    // Validate that effect can be added
    if (this.resolutionState.isResolving) {
      return { 
        success: false, 
        error: 'Cannot add effects while stack is resolving' 
      };
    }

    // Check speed lock restrictions
    if (!this.canPlaySpeed(speed)) {
      return { 
        success: false, 
        error: `Cannot play ${speed} speed effect due to speed lock: ${this.resolutionState.speedLock}` 
      };
    }

    // Check if it's the correct player's priority
    if (this.resolutionState.priorityPlayer !== controller && this.effectStack.length > 0) {
      return { 
        success: false, 
        error: `Not ${controller}'s priority to add effects` 
      };
    }

    // Create stack effect
    const stackEffect: StackEffect = {
      id: this.generateEffectId(),
      effect,
      source,
      controller,
      target,
      speed,
      priority: effect.priority,
      timestamp: new Date(),
      canRespond: true, // Most effects can be responded to
      parameters,
    };

    // Add to stack
    this.effectStack.push(stackEffect);

    // Update speed lock
    this.updateSpeedLock(speed);

    // Switch priority to other player for response opportunity
    this.resolutionState.priorityPlayer = controller === 'A' ? 'B' : 'A';
    
    // Reset passing priority since a new effect was added
    this.resolutionState.passingPriority = { A: false, B: false };
    this.resolutionState.consecutivePasses = 0;

    return { success: true, effectId: stackEffect.id };
  }

  /**
   * Player passes priority (chooses not to respond)
   */
  public passPriority(player: 'A' | 'B'): { success: boolean; shouldResolve: boolean; error?: string } {
    if (this.resolutionState.isResolving) {
      return { 
        success: false, 
        shouldResolve: false,
        error: 'Cannot pass priority while resolving' 
      };
    }

    if (this.resolutionState.priorityPlayer !== player) {
      return { 
        success: false, 
        shouldResolve: false,
        error: `Not ${player}'s priority` 
      };
    }

    // Mark player as passing
    this.resolutionState.passingPriority[player] = true;
    this.resolutionState.consecutivePasses++;

    // Switch priority to other player
    this.resolutionState.priorityPlayer = player === 'A' ? 'B' : 'A';

    // Check if both players have passed consecutively
    const shouldResolve = this.resolutionState.passingPriority.A && 
                         this.resolutionState.passingPriority.B &&
                         this.effectStack.length > 0;

    return { success: true, shouldResolve };
  }

  /**
   * Begin stack resolution process
   */
  public beginResolution(gameState?: GameState): { success: boolean; error?: string; snapshotId?: string } {
    if (this.effectStack.length === 0) {
      return { success: false, error: 'No effects to resolve' };
    }

    if (this.resolutionState.isResolving) {
      return { success: false, error: 'Already resolving' };
    }

    // Check that both players have passed
    if (!this.resolutionState.passingPriority.A || !this.resolutionState.passingPriority.B) {
      return { success: false, error: 'Both players must pass before resolution begins' };
    }

    // Create a snapshot before beginning resolution if game state is provided
    let snapshotId: string | undefined;
    if (gameState) {
      snapshotId = this.createGameStateSnapshot(
        gameState, 
        `Before stack resolution - ${this.effectStack.length} effects`
      );
    }

    this.resolutionState.isResolving = true;
    this.resolutionState.resolvingIndex = this.effectStack.length - 1; // Start from top (LIFO)

    return { success: true, snapshotId };
  }

  /**
   * Resolve the next effect on the stack (LIFO order)
   */
  public resolveNextEffect(gameState: GameState): EffectResolutionResult {
    if (!this.resolutionState.isResolving || this.resolutionState.resolvingIndex === undefined) {
      return {
        success: false,
        gameState,
        triggeredEffects: [],
        error: 'Not currently resolving'
      };
    }

    if (this.effectStack.length === 0) {
      return {
        success: false,
        gameState,
        triggeredEffects: [],
        error: 'No effects to resolve'
      };
    }

    // Get the top effect (LIFO)
    const effectToResolve = this.effectStack[this.resolutionState.resolvingIndex];
    if (!effectToResolve) {
      return {
        success: false,
        gameState,
        triggeredEffects: [],
        error: 'Effect not found at resolution index'
      };
    }

    // Create snapshot before resolving individual effect
    const snapshotId = this.createGameStateSnapshot(
      gameState,
      `Before resolving effect: ${effectToResolve.effect.name}`
    );

    try {
      // Resolve the effect (this would call specific effect handlers)
      const result = this.processEffect(effectToResolve, gameState);

      if (!result.success) {
        // If effect resolution failed, we keep the snapshot for potential rollback
        return {
          ...result,
          error: `Effect resolution failed: ${result.error}. Snapshot ${snapshotId} available for rollback.`
        };
      }

      // Remove the resolved effect from stack
      this.effectStack.splice(this.resolutionState.resolvingIndex, 1);
      
      // Update resolution index
      this.resolutionState.resolvingIndex--;

      // Check if resolution is complete
      if (this.resolutionState.resolvingIndex < 0 || this.effectStack.length === 0) {
        this.completeResolution();
      }

      return result;
    } catch (error) {
      // On unexpected error, keep the snapshot for rollback
      return {
        success: false,
        gameState,
        triggeredEffects: [],
        error: `Error during resolution: ${error instanceof Error ? error.message : 'Unknown error'}. Snapshot ${snapshotId} available for rollback.`
      };
    }
  }

  /**
   * Process individual effect (placeholder - would be implemented with actual effect handlers)
   */
  private processEffect(stackEffect: StackEffect, gameState: GameState): EffectResolutionResult {
    // This is a placeholder implementation
    // In the full system, this would dispatch to specific effect handlers
    // based on the effect type and resolver
    
    const resolutionDetails = {
      description: `Resolved effect: ${stackEffect.effect.name}`,
      affectedEntities: [],
      stateChanges: []
    };

    // For now, just return success with no state changes
    // Real implementation would modify gameState based on effect
    return {
      success: true,
      gameState,
      triggeredEffects: [], // Effects might trigger other effects
      resolutionDetails
    };
  }

  /**
   * Complete the resolution process and reset stack state
   */
  private completeResolution(): void {
    this.resolutionState.isResolving = false;
    this.resolutionState.resolvingIndex = undefined;
    this.resolutionState.speedLock = undefined;
    this.resolutionState.passingPriority = { A: false, B: false };
    this.resolutionState.consecutivePasses = 0;
    this.resolutionState.priorityPlayer = 'A'; // Reset to player A
  }

  /**
   * Force clear the stack (for emergency situations)
   */
  public clearStack(): void {
    this.effectStack = [];
    this.completeResolution();
  }

  /**
   * Create a snapshot of the current game state and stack state for rollback
   */
  public createGameStateSnapshot(
    gameState: GameState, 
    description: string = 'Automatic snapshot'
  ): string {
    const snapshotId = this.generateSnapshotId();
    
    const snapshot: GameStateSnapshot = {
      id: snapshotId,
      timestamp: new Date(),
      gameState: JSON.parse(JSON.stringify(gameState)), // Deep clone
      stackState: JSON.parse(JSON.stringify(this.effectStack)), // Deep clone
      resolutionState: {
        priorityPlayer: this.resolutionState.priorityPlayer,
        speedLock: this.resolutionState.speedLock,
        passingPriority: {
          A: this.resolutionState.passingPriority.A,
          B: this.resolutionState.passingPriority.B
        },
        consecutivePasses: this.resolutionState.consecutivePasses,
        isResolving: this.resolutionState.isResolving,
        resolvingIndex: this.resolutionState.resolvingIndex
      },
      description
    };

    this.gameStateSnapshots.set(snapshotId, snapshot);
    
    // Limit snapshots to prevent memory leaks (keep last 50)
    if (this.gameStateSnapshots.size > 50) {
      const oldestKey = this.gameStateSnapshots.keys().next().value;
      this.gameStateSnapshots.delete(oldestKey);
    }

    return snapshotId;
  }

  /**
   * Rollback to a previous game state snapshot
   */
  public rollbackToSnapshot(snapshotId: string): { 
    success: boolean; 
    gameState?: GameState; 
    error?: string 
  } {
    const snapshot = this.gameStateSnapshots.get(snapshotId);
    
    if (!snapshot) {
      return {
        success: false,
        error: `Snapshot ${snapshotId} not found`
      };
    }

    try {
      // Restore stack state
      this.effectStack = JSON.parse(JSON.stringify(snapshot.stackState));
      
      // Restore resolution state with deep copy
      this.resolutionState = {
        priorityPlayer: snapshot.resolutionState.priorityPlayer,
        speedLock: snapshot.resolutionState.speedLock,
        passingPriority: {
          A: snapshot.resolutionState.passingPriority.A,
          B: snapshot.resolutionState.passingPriority.B
        },
        consecutivePasses: snapshot.resolutionState.consecutivePasses,
        isResolving: snapshot.resolutionState.isResolving,
        resolvingIndex: snapshot.resolutionState.resolvingIndex
      };
      
      return {
        success: true,
        gameState: JSON.parse(JSON.stringify(snapshot.gameState))
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown rollback error'
      };
    }
  }

  /**
   * Get information about available snapshots
   */
  public getAvailableSnapshots(): Array<{
    id: string;
    timestamp: Date;
    description: string;
    stackSize: number;
  }> {
    return Array.from(this.gameStateSnapshots.values()).map(snapshot => ({
      id: snapshot.id,
      timestamp: snapshot.timestamp,
      description: snapshot.description,
      stackSize: snapshot.stackState.length
    }));
  }

  /**
   * Remove old snapshots to free memory
   */
  public cleanupSnapshots(olderThanMinutes: number = 30): number {
    const cutoffTime = new Date(Date.now() - olderThanMinutes * 60 * 1000);
    const idsToRemove: string[] = [];
    
    for (const [id, snapshot] of this.gameStateSnapshots) {
      if (snapshot.timestamp < cutoffTime) {
        idsToRemove.push(id);
      }
    }
    
    idsToRemove.forEach(id => this.gameStateSnapshots.delete(id));
    return idsToRemove.length;
  }

  /**
   * Clear all snapshots
   */
  public clearSnapshots(): void {
    this.gameStateSnapshots.clear();
  }

  /**
   * Get current stack state for inspection
   */
  public getStackState(): {
    effects: StackEffect[];
    resolutionState: StackResolutionState;
    size: number;
    topEffect?: StackEffect;
  } {
    return {
      effects: [...this.effectStack], // Return copy
      resolutionState: { ...this.resolutionState },
      size: this.effectStack.length,
      topEffect: this.effectStack.length > 0 ? this.effectStack[this.effectStack.length - 1] : undefined
    };
  }

  /**
   * Check if stack is empty
   */
  public isEmpty(): boolean {
    return this.effectStack.length === 0;
  }

  /**
   * Check if player can add effects currently
   */
  public canPlayerAddEffect(player: 'A' | 'B', speed: Speed): boolean {
    return !this.resolutionState.isResolving &&
           this.resolutionState.priorityPlayer === player &&
           this.canPlaySpeed(speed);
  }

  /**
   * Get which speeds are currently allowed
   */
  public getAllowedSpeeds(): Speed[] {
    const allowed: Speed[] = [];
    
    if (this.canPlaySpeed(Speed.ACTION)) allowed.push(Speed.ACTION);
    if (this.canPlaySpeed(Speed.REACTION)) allowed.push(Speed.REACTION);
    if (this.canPlaySpeed(Speed.COUNTER)) allowed.push(Speed.COUNTER);
    
    return allowed;
  }

  /**
   * Validate that the stack is in a consistent state
   */
  public validateStackState(): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check for effects with invalid speeds
    this.effectStack.forEach((effect, index) => {
      if (!Object.values(Speed).includes(effect.speed)) {
        errors.push(`Effect at index ${index} has invalid speed: ${effect.speed}`);
      }
    });

    // Check resolution state consistency
    if (this.resolutionState.isResolving) {
      if (this.resolutionState.resolvingIndex === undefined) {
        errors.push('Resolving but no resolving index set');
      }
      if (this.effectStack.length === 0) {
        errors.push('Resolving but stack is empty');
      }
    }

    // Check speed lock consistency
    if (this.resolutionState.speedLock) {
      const hasSpeedAtLockLevel = this.effectStack.some(effect => 
        this.getSpeedPriority(effect.speed) >= this.getSpeedPriority(this.resolutionState.speedLock!)
      );
      if (!hasSpeedAtLockLevel) {
        errors.push('Speed lock set but no effects justify the lock level');
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Create a snapshot of the stack for debugging/logging
   */
  public createSnapshot(): any {
    return {
      stackSize: this.effectStack.length,
      effects: this.effectStack.map(effect => ({
        id: effect.id,
        name: effect.effect.name,
        speed: effect.speed,
        controller: effect.controller,
        source: effect.source,
        timestamp: effect.timestamp
      })),
      resolutionState: this.resolutionState,
      speedLock: this.resolutionState.speedLock,
      priorityPlayer: this.resolutionState.priorityPlayer,
      isResolving: this.resolutionState.isResolving
    };
  }
}