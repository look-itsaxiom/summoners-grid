import {
  GameState,
  GameFormat,
  TurnPhase,
  Player,
  GameAction,
  Position,
  GameBoard,
  CardEffect,
  Speed,
  CombatTarget,
  SummonStats,
  CombatAction as CombatActionEnum,
  CardInstance,
  Role,
  EquipmentLoadout,
  StatusEffect,
} from '@summoners-grid/shared-types';
import { StackSystem, StackEffect } from './stack-system.js';
import { CombatSystem, CombatActionType, WeaponData, CombatAction } from './combat-system.js';

/**
 * Configuration for GameEngine initialization
 */
export interface GameEngineConfig {
  /** Optional random seed for deterministic gameplay */
  randomSeed?: string;
  /** Debug mode for additional logging */
  debugMode?: boolean;
  /** Game format (currently supports 3v3) */
  format?: GameFormat;
}

/**
 * Result of a player action submission
 */
export interface ActionResult {
  success: boolean;
  message?: string;
  newGameState?: GameState;
  errors?: string[];
}

/**
 * Game event types for the event system
 */
export enum GameEventType {
  GAME_STARTED = 'GAME_STARTED',
  TURN_STARTED = 'TURN_STARTED',
  PHASE_CHANGED = 'PHASE_CHANGED',
  PLAYER_ACTION = 'PLAYER_ACTION',
  GAME_ENDED = 'GAME_ENDED',
  STATE_CHANGED = 'STATE_CHANGED',
}

/**
 * Game event data structure
 */
export interface GameEvent {
  type: GameEventType;
  timestamp: Date;
  gameId: string;
  data?: any;
}

/**
 * Event handler function type
 */
export type EventHandler = (event: GameEvent) => void;

/**
 * Core Game Engine - Orchestrates all game systems and manages game state
 * 
 * Responsibilities:
 * - Initialize and configure all game systems
 * - Coordinate turn phases and state transitions  
 * - Handle player action submission and validation
 * - Manage game lifecycle (start, pause, end)
 * - Provide external API for game server integration
 */
export class GameEngine {
  private gameState: GameState | null = null;
  private eventHandlers: Map<GameEventType, EventHandler[]> = new Map();
  private config: GameEngineConfig;
  private stackSystem: StackSystem;
  private combatSystem: CombatSystem;

  constructor(config: GameEngineConfig = {}) {
    this.config = {
      debugMode: false,
      format: {
        name: '3v3',
        maxSummons: 3,
        victoryPointTarget: 3,
        handSizeLimit: 6,
      },
      ...config,
    };

    this.stackSystem = new StackSystem();
    this.combatSystem = new CombatSystem(config.randomSeed);

    this.initializeEventHandlers();
  }

  /**
   * Generate a simple UUID for browser compatibility
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c == 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
  /**
   * Initialize a new game with two players
   */
  public initializeGame(gameId: string, playerA: Player, playerB: Player): GameState {
    // Create initial game board (12x14 grid)
    const board: GameBoard = {
      width: 12,
      height: 14,
      summons: new Map(),
      buildings: new Map(),
      territories: {
        playerA: this.generateTerritoryPositions(0, 2), // First 3 rows (y: 0-2)
        playerB: this.generateTerritoryPositions(11, 13), // Last 3 rows (y: 11-13)  
        contested: this.generateTerritoryPositions(3, 10), // Middle rows (y: 3-10)
      },
    };

    // Initialize game state
    this.gameState = {
      id: this.generateUUID(),
      gameId,
      format: this.config.format!,
      status: 'IN_PROGRESS',
      playerA,
      playerB,
      currentPlayer: 'A', // First player starts
      currentTurn: 1,
      currentPhase: TurnPhase.DRAW,
      board,
      effectStack: [],
      startTime: new Date(),
      actionHistory: [],
    };

    this.emitEvent(GameEventType.GAME_STARTED, { gameState: this.gameState });
    this.log('Game initialized', this.gameState.id);

    return this.gameState;
  }

  /**
   * Submit a player action and update game state
   */
  public submitAction(playerId: string, action: GameAction): ActionResult {
    if (!this.gameState) {
      return {
        success: false,
        message: 'Game not initialized',
      };
    }

    // Validate the action
    const validation = this.validateAction(action);
    if (!validation.isValid) {
      return {
        success: false,
        message: 'Invalid action',
        errors: validation.errors,
      };
    }

    try {
      // Apply the action to create new game state
      const newGameState = this.applyAction(action);
      
      // Update internal state
      this.gameState = newGameState;
      
      // Emit events
      this.emitEvent(GameEventType.PLAYER_ACTION, { action, gameState: newGameState });
      this.emitEvent(GameEventType.STATE_CHANGED, { gameState: newGameState });

      this.log(`Action applied: ${action.type}`, action.id);

      return {
        success: true,
        newGameState,
      };
    } catch (error) {
      this.log('Error applying action', error);
      return {
        success: false,
        message: 'Failed to apply action',
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  /**
   * Get current game state (immutable copy)
   */
  public getGameState(): GameState | null {
    return this.gameState ? { ...this.gameState } : null;
  }

  /**
   * Get the CombatSystem instance for external use
   */
  public getCombatSystem(): CombatSystem {
    return this.combatSystem;
  }

  /**
   * Advance to the next phase in the current turn
   */
  public advancePhase(): ActionResult {
    if (!this.gameState) {
      return { success: false, message: 'Game not initialized' };
    }

    const currentPhase = this.gameState.currentPhase;
    let nextPhase: TurnPhase;

    // Determine next phase based on current phase
    switch (currentPhase) {
      case TurnPhase.DRAW:
        nextPhase = TurnPhase.LEVEL;
        break;
      case TurnPhase.LEVEL:
        nextPhase = TurnPhase.ACTION;
        break;
      case TurnPhase.ACTION:
        nextPhase = TurnPhase.END;
        break;
      case TurnPhase.END:
        // End of turn - switch players and start new turn
        return this.advanceTurn();
      default:
        return { success: false, message: 'Invalid phase' };
    }

    // Create new game state with updated phase
    const newGameState: GameState = {
      ...this.gameState,
      currentPhase: nextPhase,
    };

    this.gameState = newGameState;
    this.emitEvent(GameEventType.PHASE_CHANGED, { 
      previousPhase: currentPhase,
      newPhase: nextPhase,
      gameState: newGameState,
    });

    this.log(`Phase advanced: ${currentPhase} -> ${nextPhase}`);

    return { success: true, newGameState };
  }

  /**
   * Advance to the next turn (switch players)
   */
  public advanceTurn(): ActionResult {
    if (!this.gameState) {
      return { success: false, message: 'Game not initialized' };
    }

    // Switch current player
    const newCurrentPlayer = this.gameState.currentPlayer === 'A' ? 'B' : 'A';
    
    // Increment turn number when returning to player A
    const newTurn = newCurrentPlayer === 'A' 
      ? this.gameState.currentTurn + 1 
      : this.gameState.currentTurn;

    const newGameState: GameState = {
      ...this.gameState,
      currentPlayer: newCurrentPlayer,
      currentTurn: newTurn,
      currentPhase: TurnPhase.DRAW,
    };

    this.gameState = newGameState;
    this.emitEvent(GameEventType.TURN_STARTED, {
      turn: newTurn,
      player: newCurrentPlayer,
      gameState: newGameState,
    });

    this.log(`Turn advanced: Turn ${newTurn}, Player ${newCurrentPlayer}`);

    return { success: true, newGameState };
  }

  /**
   * Add event listener for game events
   */
  public addEventListener(eventType: GameEventType, handler: EventHandler): void {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, []);
    }
    this.eventHandlers.get(eventType)!.push(handler);
  }

  /**
   * Remove event listener
   */
  public removeEventListener(eventType: GameEventType, handler: EventHandler): void {
    const handlers = this.eventHandlers.get(eventType);
    if (handlers) {
      const index = handlers.indexOf(handler);
      if (index > -1) {
        handlers.splice(index, 1);
      }
    }
  }

  /**
   * Serialize game state to JSON string
   */
  public serializeGameState(): string {
    if (!this.gameState) {
      throw new Error('No game state to serialize');
    }

    // Convert Maps to objects for JSON serialization
    const serializable = {
      ...this.gameState,
      board: {
        ...this.gameState.board,
        summons: Array.from(this.gameState.board.summons.entries()),
        buildings: Array.from(this.gameState.board.buildings.entries()),
      },
      playerA: this.gameState.playerA ? {
        ...this.gameState.playerA,
        activeSummons: Array.from(this.gameState.playerA.activeSummons.entries()),
        activeBuildings: Array.from(this.gameState.playerA.activeBuildings.entries()),
      } : undefined,
      playerB: this.gameState.playerB ? {
        ...this.gameState.playerB,
        activeSummons: Array.from(this.gameState.playerB.activeSummons.entries()),
        activeBuildings: Array.from(this.gameState.playerB.activeBuildings.entries()),
      } : undefined,
    };

    return JSON.stringify(serializable);
  }

  /**
   * Deserialize game state from JSON string
   */
  public deserializeGameState(serializedState: string): GameState {
    const parsed = JSON.parse(serializedState);

    // Convert arrays back to Maps
    const gameState: GameState = {
      ...parsed,
      board: {
        ...parsed.board,
        summons: new Map(parsed.board.summons),
        buildings: new Map(parsed.board.buildings),
      },
      playerA: parsed.playerA ? {
        ...parsed.playerA,
        activeSummons: new Map(parsed.playerA.activeSummons),
        activeBuildings: new Map(parsed.playerA.activeBuildings),
      } : undefined,
      playerB: parsed.playerB ? {
        ...parsed.playerB,
        activeSummons: new Map(parsed.playerB.activeSummons),
        activeBuildings: new Map(parsed.playerB.activeBuildings),
      } : undefined,
    };

    return gameState;
  }

  /**
   * Check if game has ended and determine winner
   */
  public checkGameEnd(): { hasEnded: boolean; winner?: 'A' | 'B' | 'DRAW'; reason?: string } {
    if (!this.gameState || !this.gameState.playerA || !this.gameState.playerB) {
      return { hasEnded: false };
    }

    const { playerA, playerB } = this.gameState;
    const targetVP = this.gameState.format.victoryPointTarget;

    // Check victory point conditions
    if (playerA.victoryPoints >= targetVP && playerB.victoryPoints >= targetVP) {
      // Both reached target simultaneously - check tiebreakers
      const summonCountA = playerA.activeSummons.size;
      const summonCountB = playerB.activeSummons.size;
      
      if (summonCountA > summonCountB) {
        return { hasEnded: true, winner: 'A', reason: 'Victory points reached (tiebreaker: more summons)' };
      } else if (summonCountB > summonCountA) {
        return { hasEnded: true, winner: 'B', reason: 'Victory points reached (tiebreaker: more summons)' };
      } else {
        return { hasEnded: true, winner: 'DRAW', reason: 'Victory points reached (tied summon count)' };
      }
    } else if (playerA.victoryPoints >= targetVP) {
      return { hasEnded: true, winner: 'A', reason: 'Victory points reached' };
    } else if (playerB.victoryPoints >= targetVP) {
      return { hasEnded: true, winner: 'B', reason: 'Victory points reached' };
    }

    return { hasEnded: false };
  }

  // Private helper methods

  private initializeEventHandlers(): void {
    // Initialize event handler maps
    Object.values(GameEventType).forEach(eventType => {
      this.eventHandlers.set(eventType, []);
    });
  }

  private emitEvent(type: GameEventType, data?: any): void {
    const event: GameEvent = {
      type,
      timestamp: new Date(),
      gameId: this.gameState?.gameId || 'unknown',
      data,
    };

    const handlers = this.eventHandlers.get(type) || [];
    handlers.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        this.log('Error in event handler', error);
      }
    });
  }

  private validateAction(action: GameAction): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!this.gameState) {
      errors.push('Game not initialized');
      return { isValid: false, errors };
    }

    // Validate player turn
    if (action.player !== this.gameState.currentPlayer) {
      errors.push('Not your turn');
    }

    // Validate turn and phase
    if (action.turn !== this.gameState.currentTurn) {
      errors.push('Invalid turn number');
    }

    if (action.phase !== this.gameState.currentPhase) {
      errors.push('Invalid phase for this action');
    }

    // Add more specific validation based on action type
    switch (action.type) {
      case 'MOVE_SUMMON':
        if (!action.fromPosition || !action.toPosition) {
          errors.push('Movement requires from and to positions');
        }
        break;
      case 'PLAY_CARD':
        if (!action.cardId) {
          errors.push('Card play requires card ID');
        }
        break;
      case 'ATTACK':
        if (!action.target) {
          errors.push('Attack requires target');
        }
        break;
    }

    return { isValid: errors.length === 0, errors };
  }

  private applyAction(action: GameAction): GameState {
    if (!this.gameState) {
      throw new Error('Game state not initialized');
    }

    // Create new game state (immutable update)
    let newGameState: GameState = { ...this.gameState };

    // Add action to history
    newGameState.actionHistory = [...newGameState.actionHistory, action];

    // Apply action-specific changes
    switch (action.type) {
      case 'END_PHASE':
        // Phase advancement is handled by advancePhase method
        break;
      case 'DRAW_CARD':
        newGameState = this.applyDrawCard(newGameState, action);
        break;
      case 'MOVE_SUMMON':
        newGameState = this.applyMoveSummon(newGameState, action);
        break;
      case 'PLAY_CARD':
        newGameState = this.applyPlayCard(newGameState, action);
        break;
      case 'ATTACK':
        newGameState = this.applyAttack(newGameState, action);
        break;
      // Add more action types as needed
    }

    return newGameState;
  }

  private applyDrawCard(gameState: GameState, action: GameAction): GameState {
    // Implementation for draw card action
    // This is a placeholder - full implementation would handle deck management
    this.log('Draw card action applied', action.id);
    return gameState;
  }

  private applyMoveSummon(gameState: GameState, action: GameAction): GameState {
    // Implementation for move summon action
    // This is a placeholder - full implementation would handle position validation and updates
    this.log('Move summon action applied', action.id);
    return gameState;
  }

  private applyPlayCard(gameState: GameState, action: GameAction): GameState {
    // Implementation for play card action
    // This is a placeholder - full implementation would handle card effects
    this.log('Play card action applied', action.id);
    return gameState;
  }

  private applyAttack(gameState: GameState, action: GameAction): GameState {
    // Implementation for attack action using the CombatSystem
    if (!action.target || !action.cardId) {
      this.log('Attack action failed: Missing target or attacker ID');
      return gameState;
    }

    // Find the attacking summon
    const attackingPlayer = gameState.currentPlayer === 'A' ? gameState.playerA : gameState.playerB;
    if (!attackingPlayer) {
      this.log('Attack action failed: No attacking player found');
      return gameState;
    }

    const attackingSummon = attackingPlayer.activeSummons.get(action.cardId);
    if (!attackingSummon) {
      this.log('Attack action failed: Attacking summon not found');
      return gameState;
    }

    // Find the target summon
    let targetPlayer: Player | undefined;
    let targetSummon: { cardInstance: any; currentStats: SummonStats; position: Position } | undefined;

    if (action.target.type === 'summon' && action.target.id) {
      if (action.target.playerId === 'A') {
        targetPlayer = gameState.playerA;
      } else if (action.target.playerId === 'B') {
        targetPlayer = gameState.playerB;
      }

      if (targetPlayer) {
        targetSummon = targetPlayer.activeSummons.get(action.target.id);
      }
    }

    if (!targetSummon || !targetPlayer) {
      this.log('Attack action failed: Target summon not found');
      return gameState;
    }

    // Create a basic weapon from equipment (simplified for now)
    const weapon: WeaponData = {
      power: 30, // Default weapon power
      type: 'melee', // Default weapon type
      range: 1,
      attribute: 'NEUTRAL' as any
    };

    // Create combat action
    const combatAction: CombatAction = {
      type: CombatActionType.BASIC_ATTACK,
      attackerId: action.cardId,
      targetId: action.target.id,
      weapon
    };

    // Resolve combat using CombatSystem
    const combatResult = this.combatSystem.resolveCombat(
      combatAction,
      attackingSummon.currentStats,
      targetSummon.currentStats,
      attackingSummon.position,
      targetSummon.position
    );

    // Log combat result
    this.log('Combat resolved:', {
      success: combatResult.success,
      damage: combatResult.damage.amount,
      defeated: combatResult.defeated,
      log: combatResult.log
    });

    // If combat was successful, apply the results to game state
    if (combatResult.success) {
      // Update target summon's HP
      const updatedTargetStats = this.combatSystem.applyDamage(targetSummon.currentStats, combatResult.damage);
      
      // Create updated game state with new summon stats
      const newGameState = { ...gameState };
      
      // Update the target player's summon data
      if (targetPlayer === gameState.playerA) {
        newGameState.playerA = {
          ...targetPlayer,
          activeSummons: new Map(targetPlayer.activeSummons)
        };
        newGameState.playerA.activeSummons.set(action.target.id!, {
          ...targetSummon,
          currentStats: updatedTargetStats
        });
      } else {
        newGameState.playerB = {
          ...targetPlayer,
          activeSummons: new Map(targetPlayer.activeSummons)
        };
        newGameState.playerB.activeSummons.set(action.target.id!, {
          ...targetSummon,
          currentStats: updatedTargetStats
        });
      }

      // If the target was defeated, remove it from the board and award victory points
      if (combatResult.defeated) {
        this.log('Summon defeated:', action.target.id);
        
        // Remove summon from active summons
        if (targetPlayer === gameState.playerA) {
          newGameState.playerA!.activeSummons.delete(action.target.id!);
        } else {
          newGameState.playerB!.activeSummons.delete(action.target.id!);
        }

        // Award victory points to the attacking player
        if (gameState.currentPlayer === 'A' && newGameState.playerA) {
          newGameState.playerA.victoryPoints += 1; // Simplified - should check tier for 1 or 2 VP
        } else if (gameState.currentPlayer === 'B' && newGameState.playerB) {
          newGameState.playerB.victoryPoints += 1; // Simplified - should check tier for 1 or 2 VP
        }
      }

      return newGameState;
    }

    // Combat failed (miss, out of range, etc.)
    return gameState;
  }

  private generateTerritoryPositions(startY: number, endY: number): Position[] {
    const positions: Position[] = [];
    for (let y = startY; y <= endY; y++) {
      for (let x = 0; x < 12; x++) {
        positions.push({ x, y });
      }
    }
    return positions;
  }

  private log(message: string, data?: any): void {
    if (this.config.debugMode) {
      console.log(`[GameEngine] ${message}`, data || '');
    }
  }

  // ============================================================================
  // STACK SYSTEM INTEGRATION
  // ============================================================================

  /**
   * Add an effect to the stack system
   */
  public addEffectToStack(
    effect: CardEffect,
    source: string,
    controller: 'A' | 'B',
    speed: Speed,
    target?: CombatTarget,
    parameters?: Record<string, any>
  ): ActionResult {
    const result = this.stackSystem.addEffect(effect, source, controller, speed, target, parameters);
    
    if (!result.success) {
      return {
        success: false,
        message: 'Failed to add effect to stack',
        errors: [result.error || 'Unknown error']
      };
    }

    this.log(`Effect added to stack: ${effect.name} by ${controller}`, result.effectId);
    this.emitEvent(GameEventType.STATE_CHANGED, { 
      type: 'EFFECT_ADDED',
      effect: effect.name,
      controller,
      stackSize: this.stackSystem.getStackState().size
    });

    return {
      success: true,
      message: `Effect ${effect.name} added to stack`,
      newGameState: this.gameState || undefined
    };
  }

  /**
   * Player passes priority on the stack
   */
  public passPriorityOnStack(player: 'A' | 'B'): ActionResult {
    const result = this.stackSystem.passPriority(player);
    
    if (!result.success) {
      return {
        success: false,
        message: 'Failed to pass priority',
        errors: [result.error || 'Unknown error']
      };
    }

    this.log(`Player ${player} passed priority`);
    
    if (result.shouldResolve) {
      this.log('Both players passed - beginning stack resolution');
      return this.beginStackResolution();
    }

    return {
      success: true,
      message: `Player ${player} passed priority`,
      newGameState: this.gameState || undefined
    };
  }

  /**
   * Begin resolving the effect stack
   */
  public beginStackResolution(): ActionResult {
    const result = this.stackSystem.beginResolution(this.gameState || undefined);
    
    if (!result.success) {
      return {
        success: false,
        message: 'Failed to begin stack resolution',
        errors: [result.error || 'Unknown error']
      };
    }

    this.log('Stack resolution began', result.snapshotId);
    this.emitEvent(GameEventType.STATE_CHANGED, { 
      type: 'STACK_RESOLUTION_BEGAN',
      stackSize: this.stackSystem.getStackState().size,
      snapshotId: result.snapshotId
    });

    return {
      success: true,
      message: 'Stack resolution began',
      newGameState: this.gameState || undefined
    };
  }

  /**
   * Resolve the next effect on the stack
   */
  public resolveNextStackEffect(): ActionResult {
    if (!this.gameState) {
      return {
        success: false,
        message: 'Game not initialized',
        errors: ['No game state available']
      };
    }

    const result = this.stackSystem.resolveNextEffect(this.gameState);
    
    if (!result.success) {
      return {
        success: false,
        message: 'Failed to resolve effect',
        errors: [result.error || 'Unknown error']
      };
    }

    // Update game state with resolution results
    this.gameState = result.gameState;

    // Add any triggered effects to the stack
    result.triggeredEffects.forEach((triggeredEffect: StackEffect) => {
      this.stackSystem.addEffect(
        triggeredEffect.effect,
        triggeredEffect.source,
        triggeredEffect.controller,
        triggeredEffect.speed,
        triggeredEffect.target,
        triggeredEffect.parameters
      );
    });

    this.log('Stack effect resolved', result.resolutionDetails);
    this.emitEvent(GameEventType.STATE_CHANGED, { 
      type: 'EFFECT_RESOLVED',
      details: result.resolutionDetails,
      gameState: this.gameState
    });

    return {
      success: true,
      message: 'Effect resolved successfully',
      newGameState: this.gameState || undefined
    };
  }

  /**
   * Get current stack state for inspection
   */
  public getStackState() {
    return this.stackSystem.getStackState();
  }

  /**
   * Check if a player can add an effect with the given speed
   */
  public canPlayerAddEffect(player: 'A' | 'B', speed: Speed): boolean {
    return this.stackSystem.canPlayerAddEffect(player, speed);
  }

  /**
   * Get which speeds are currently allowed
   */
  public getAllowedSpeeds(): Speed[] {
    return this.stackSystem.getAllowedSpeeds();
  }

  /**
   * Check if the stack is empty
   */
  public isStackEmpty(): boolean {
    return this.stackSystem.isEmpty();
  }

  /**
   * Clear the effect stack (emergency use)
   */
  public clearEffectStack(): ActionResult {
    this.stackSystem.clearStack();
    this.log('Effect stack cleared');
    
    this.emitEvent(GameEventType.STATE_CHANGED, { 
      type: 'STACK_CLEARED'
    });

    return {
      success: true,
      message: 'Effect stack cleared',
      newGameState: this.gameState || undefined
    };
  }

  /**
   * Validate that the stack system is in a consistent state
   */
  public validateStackState(): { isValid: boolean; errors: string[] } {
    return this.stackSystem.validateStackState();
  }

  /**
   * Create a snapshot of the current stack for debugging
   */
  public createStackSnapshot() {
    return this.stackSystem.createSnapshot();
  }

  /**
   * Create a snapshot of the current game state for rollback
   */
  public createGameStateSnapshot(description: string = 'Manual snapshot'): ActionResult {
    if (!this.gameState) {
      return {
        success: false,
        message: 'Cannot create snapshot without game state',
        errors: ['No game state available']
      };
    }

    const snapshotId = this.stackSystem.createGameStateSnapshot(this.gameState, description);
    
    this.log(`Game state snapshot created: ${snapshotId}`, description);
    this.emitEvent(GameEventType.STATE_CHANGED, { 
      type: 'SNAPSHOT_CREATED',
      snapshotId,
      description
    });

    return {
      success: true,
      message: `Snapshot created: ${snapshotId}`,
      newGameState: this.gameState
    };
  }

  /**
   * Rollback to a previous game state snapshot
   */
  public rollbackToSnapshot(snapshotId: string): ActionResult {
    const result = this.stackSystem.rollbackToSnapshot(snapshotId);
    
    if (!result.success) {
      return {
        success: false,
        message: 'Failed to rollback to snapshot',
        errors: [result.error || 'Unknown error']
      };
    }

    // Update game state with rolled back state
    this.gameState = result.gameState || this.gameState;
    
    this.log(`Rolled back to snapshot: ${snapshotId}`);
    this.emitEvent(GameEventType.STATE_CHANGED, { 
      type: 'ROLLBACK_COMPLETED',
      snapshotId,
      gameState: this.gameState
    });

    return {
      success: true,
      message: `Rolled back to snapshot: ${snapshotId}`,
      newGameState: this.gameState || undefined
    };
  }

  /**
   * Get list of available snapshots for rollback
   */
  public getAvailableSnapshots() {
    return this.stackSystem.getAvailableSnapshots();
  }

  /**
   * Clean up old snapshots to free memory
   */
  public cleanupOldSnapshots(olderThanMinutes: number = 30): ActionResult {
    const removedCount = this.stackSystem.cleanupSnapshots(olderThanMinutes);
    
    this.log(`Cleaned up ${removedCount} old snapshots`);
    
    return {
      success: true,
      message: `Cleaned up ${removedCount} snapshots older than ${olderThanMinutes} minutes`,
      newGameState: this.gameState || undefined
    };
  }
}

// Export convenience function for backward compatibility
export function gameEngine(): string {
  return 'game-engine';
}
