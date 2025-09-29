/**
 * TRR.ts - Trigger → Response → Resolution pipeline
 * 
 * Implements the core TRR system with effect stack, reaction windows, interrupts,
 * and resolution ordering per GDD: Effect System - Stack-Based Resolution.
 */

import { GameStateManager } from './GameState';
import { EventBus } from './EventBus';
import { EffectRegistry, EffectContext } from './EffectRegistry';
import { 
  EffectStackEntry, 
  PriorityWindow, 
  GameEvent 
} from '../types/game';
import { 
  SpeedLevel, 
  PlayerId, 
  CardId 
} from '../types/base';
import { EventType, GameEventData } from '../types/action';

export class TRRManager {
  constructor(
    private gameState: GameStateManager,
    private eventBus: EventBus,
    private effectRegistry: EffectRegistry
  ) {
    // Subscribe to all events for trigger detection
    this.subscribeToTriggerEvents();
  }

  /**
   * Process the complete TRR pipeline
   * @returns Updated game state after TRR processing
   */
  public processTRRPipeline(): GameStateManager {
    let currentState = this.gameState;

    // 1. Trigger Phase: Detect triggers from recent events
    currentState = this.detectTriggers(currentState);

    // 2. Response Phase: Open priority windows for responses
    currentState = this.openResponseWindows(currentState);

    // 3. Resolution Phase: Resolve effects in LIFO order
    currentState = this.resolveEffectStack(currentState);

    return currentState;
  }

  /**
   * Add effect to stack with speed lock validation
   * @param effect - Effect to add
   * @returns Updated game state
   */
  public addEffectToStack(effect: EffectStackEntry): GameStateManager {
    const state = this.gameState.getState();
    
    // Check speed lock rules from GDD: Effect System
    if (!this.canAddEffectToStack(effect.speed, state.effectStack)) {
      throw new Error(`Speed lock prevents adding ${effect.speed} effect to stack`);
    }

    // Add to stack (LIFO)
    const updatedState = this.gameState.addToEffectStack(effect);
    
    // Emit effect activation event
    this.eventBus.emit({
      type: EventType.EffectActivated,
      playerId: effect.ownerId,
      data: {
        effectId: effect.effectId,
        sourceCardId: effect.sourceCardId,
        speed: effect.speed,
        targets: effect.targets
      }
    });

    return updatedState;
  }

  /**
   * Check if effect can be added to stack based on speed lock rules
   * From GDD: Speed Lock Examples:
   * - Action → Reaction added: No more Actions until Reaction resolves
   * - Reaction → Counter added: No Actions or Reactions until Counter resolves
   */
  private canAddEffectToStack(speed: SpeedLevel, stack: EffectStackEntry[]): boolean {
    if (stack.length === 0) return true;

    const topEffect = stack[stack.length - 1];
    
    switch (topEffect.speed) {
      case SpeedLevel.Counter:
        // Counter on stack blocks all lower speeds
        return speed === SpeedLevel.Counter;
      
      case SpeedLevel.Reaction:
        // Reaction on stack blocks Actions
        return speed === SpeedLevel.Counter || speed === SpeedLevel.Reaction;
      
      case SpeedLevel.Action:
        // Action allows all speeds
        return true;
      
      default:
        return true;
    }
  }

  /**
   * Detect triggers from recent events
   */
  private detectTriggers(gameState: GameStateManager): GameStateManager {
    const state = gameState.getState();
    const recentEvents = this.getUnprocessedEvents(state.events);
    let updatedState = gameState;

    for (const event of recentEvents) {
      // Check all cards in play for triggers
      for (const card of state.sharedZones.inPlay) {
        const triggers = this.getTriggersForCard(card);
        
        for (const trigger of triggers) {
          if (this.doesEventMatchTrigger(event, trigger)) {
            // Create effect stack entry for trigger
            const effectEntry: EffectStackEntry = {
              id: `trigger_${Date.now()}_${Math.random()}`,
              ownerId: card.ownerId,
              sourceCardId: card.id,
              effectId: trigger.effectRef,
              speed: SpeedLevel.Action, // Most triggers are Action speed
              parameters: trigger.parameters || {},
              targets: this.resolveTargetsForTrigger(trigger, event),
              timestamp: Date.now()
            };

            // Add trigger to stack if valid
            if (this.canAddEffectToStack(effectEntry.speed, state.effectStack)) {
              updatedState = updatedState.addToEffectStack(effectEntry);
            }
          }
        }
      }

      // Mark event as processed
      const updatedEvents = state.events.map(e => 
        e.id === event.id ? { ...e, processed: true } : e
      );
      updatedState = updatedState.update({ events: updatedEvents });
    }

    return updatedState;
  }

  /**
   * Open priority windows for player responses
   */
  private openResponseWindows(gameState: GameStateManager): GameStateManager {
    const state = gameState.getState();
    
    // If stack is empty, no responses needed
    if (state.effectStack.length === 0) {
      return gameState;
    }

    // Get non-turn player priority first (GDD: Priority System)
    const currentPlayer = state.turnState.currentPlayer;
    const nonTurnPlayer = this.getNonTurnPlayer(state.playerOrder, currentPlayer);
    
    // Create priority windows alternating between players
    const priorityWindows: PriorityWindow[] = [
      {
        playerId: nonTurnPlayer,
        allowedSpeeds: this.getAllowedSpeedsForStack(state.effectStack),
        triggeringEffect: state.effectStack[state.effectStack.length - 1],
        passed: false
      },
      {
        playerId: currentPlayer,
        allowedSpeeds: this.getAllowedSpeedsForStack(state.effectStack),
        triggeringEffect: state.effectStack[state.effectStack.length - 1],
        passed: false
      }
    ];

    return gameState.update({
      priorityQueue: priorityWindows
    });
  }

  /**
   * Resolve effects from stack in LIFO order
   */
  private resolveEffectStack(gameState: GameStateManager): GameStateManager {
    const state = gameState.getState();
    let updatedState = gameState;

    // Continue resolving while stack has effects and both players have passed
    while (this.shouldResolveStack(updatedState.getState())) {
      const currentState = updatedState.getState();
      const topEffect = currentState.effectStack[currentState.effectStack.length - 1];

      // Resolve the top effect
      updatedState = this.resolveSingleEffect(updatedState, topEffect);

      // Remove resolved effect from stack
      updatedState = updatedState.popFromEffectStack();

      // Clear priority queue after resolution
      updatedState = updatedState.update({ priorityQueue: [] });

      // Check for new triggers after resolution
      updatedState = this.detectTriggers(updatedState);
      
      // If new effects were added, open new response windows
      if (updatedState.getState().effectStack.length > 0) {
        updatedState = this.openResponseWindows(updatedState);
      }
    }

    return updatedState;
  }

  /**
   * Resolve a single effect using the effect registry
   */
  private resolveSingleEffect(gameState: GameStateManager, effect: EffectStackEntry): GameStateManager {
    const context: EffectContext = {
      gameState,
      eventBus: this.eventBus,
      sourceCardId: effect.sourceCardId,
      ownerId: effect.ownerId,
      targets: effect.targets,
      parameters: effect.parameters
    };

    let updatedState: GameStateManager;
    try {
      updatedState = this.effectRegistry.executeEffect(effect.effectId, context);
    } catch (error) {
      console.error(`Failed to resolve effect ${effect.effectId}:`, error);
      updatedState = gameState; // Continue with unchanged state
    }

    // Emit resolution event
    this.eventBus.emit({
      type: EventType.EffectResolved,
      playerId: effect.ownerId,
      data: {
        effectId: effect.effectId,
        sourceCardId: effect.sourceCardId,
        targets: effect.targets,
        success: updatedState !== gameState
      }
    });

    return updatedState;
  }

  /**
   * Check if stack should resolve (both players passed)
   */
  private shouldResolveStack(state: import('../types/game').GameState): boolean {
    if (state.effectStack.length === 0) return false;
    if (state.priorityQueue.length === 0) return true;
    
    return state.priorityQueue.every(window => window.passed);
  }

  /**
   * Get allowed speeds based on current stack state
   */
  private getAllowedSpeedsForStack(stack: EffectStackEntry[]): SpeedLevel[] {
    if (stack.length === 0) {
      return [SpeedLevel.Action, SpeedLevel.Reaction, SpeedLevel.Counter];
    }

    const topSpeed = stack[stack.length - 1].speed;
    
    switch (topSpeed) {
      case SpeedLevel.Counter:
        return [SpeedLevel.Counter];
      case SpeedLevel.Reaction:
        return [SpeedLevel.Reaction, SpeedLevel.Counter];
      case SpeedLevel.Action:
        return [SpeedLevel.Action, SpeedLevel.Reaction, SpeedLevel.Counter];
      default:
        return [];
    }
  }

  /**
   * Get unprocessed events from event list
   */
  private getUnprocessedEvents(events: GameEvent[]): GameEvent[] {
    return events.filter(event => !event.processed);
  }

  /**
   * Get triggers defined on a card
   */
  private getTriggersForCard(card: import('../types/card').CardInPlay): any[] {
    // TODO: Extract triggers from card definition
    return [];
  }

  /**
   * Check if event matches trigger condition
   */
  private doesEventMatchTrigger(event: GameEvent, trigger: any): boolean {
    // TODO: Implement trigger matching logic
    return false;
  }

  /**
   * Resolve targets for a trigger based on event data
   */
  private resolveTargetsForTrigger(trigger: any, event: GameEvent): any[] {
    // TODO: Implement target resolution
    return [];
  }

  /**
   * Get the non-turn player
   */
  private getNonTurnPlayer(playerOrder: PlayerId[], currentPlayer: PlayerId): PlayerId {
    return playerOrder.find(p => p !== currentPlayer) || currentPlayer;
  }

  /**
   * Subscribe to events for trigger detection
   */
  private subscribeToTriggerEvents(): void {
    // Subscribe to key events that can trigger effects
    const triggerEvents = [
      EventType.CardPlayed,
      EventType.CardEntersPlay,
      EventType.SummonDeployed,
      EventType.SummonDefeated,
      EventType.SummonAttacked,
      EventType.SummonDamaged,
      EventType.PhaseStarted,
      EventType.PhaseEnded
    ];

    for (const eventType of triggerEvents) {
      this.eventBus.subscribe(eventType, (event) => {
        // Trigger detection will be handled in the main TRR processing
        this.eventBus.emit({
          type: EventType.TriggerActivated,
          playerId: event.playerId,
          data: {
            triggerSource: event.type,
            originalEvent: event
          }
        });
      });
    }
  }
}