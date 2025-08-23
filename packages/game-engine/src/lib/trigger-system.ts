import {
  GameState,
  CardEffect,
  CombatTarget,
} from '@summoners-grid/shared-types';
import { StackEffect } from './stack-system.js';

/**
 * Game event that can trigger effects
 */
export interface GameEvent {
  type: GameEventType;
  source: string;
  player: 'A' | 'B';
  target?: CombatTarget;
  data?: Record<string, any>;
  timestamp: Date;
}

/**
 * Types of game events that can trigger effects
 */
export enum GameEventType {
  // Card play events
  CARD_PLAYED = 'CARD_PLAYED',
  CARD_ENTERS_PLAY = 'CARD_ENTERS_PLAY',
  
  // Combat events
  SUMMON_ATTACKS = 'SUMMON_ATTACKS',
  SUMMON_TAKES_DAMAGE = 'SUMMON_TAKES_DAMAGE',
  SUMMON_DEFEATED = 'SUMMON_DEFEATED',
  SUMMON_DESTROYED = 'SUMMON_DESTROYED',
  
  // Movement events
  SUMMON_MOVES = 'SUMMON_MOVES',
  SUMMON_ENTERS_TERRITORY = 'SUMMON_ENTERS_TERRITORY',
  
  // Turn events
  TURN_START = 'TURN_START',
  TURN_END = 'TURN_END',
  PHASE_START = 'PHASE_START',
  PHASE_END = 'PHASE_END',
  
  // Special events
  QUEST_COMPLETED = 'QUEST_COMPLETED',
  BUILDING_DESTROYED = 'BUILDING_DESTROYED',
  ROLE_ADVANCED = 'ROLE_ADVANCED'
}

/**
 * Trigger condition for conditional effects
 */
export interface TriggerCondition {
  eventType: GameEventType;
  conditions: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains';
    value: any;
  }>;
  timing: 'before' | 'after' | 'instead_of';
}

/**
 * Triggered effect waiting to be processed
 */
export interface TriggeredEffect {
  stackEffect: StackEffect;
  triggerEvent: GameEvent;
  condition: TriggerCondition;
  priority: number;
}

/**
 * System for managing conditional effect triggers and timing
 * Implements the "conditional effect triggers and timing" requirement
 */
export class TriggerSystem {
  private pendingTriggers: TriggeredEffect[] = [];
  private triggerListeners: Map<GameEventType, TriggeredEffect[]> = new Map();

  constructor() {
    // Initialize trigger listener maps
    Object.values(GameEventType).forEach(eventType => {
      this.triggerListeners.set(eventType, []);
    });
  }

  /**
   * Register an effect that can be triggered by game events
   */
  public registerTrigger(
    effect: CardEffect,
    source: string,
    controller: 'A' | 'B',
    target?: CombatTarget,
    parameters?: Record<string, any>
  ): void {
    const triggerCondition = this.parseTriggerCondition(effect.trigger);
    
    if (!triggerCondition) {
      return; // Effect doesn't have conditional triggers
    }

    const stackEffect: StackEffect = {
      id: `trigger-${Date.now()}-${Math.random()}`,
      effect,
      source,
      controller,
      target,
      speed: this.getSpeedFromTrigger(effect.trigger),
      priority: effect.priority,
      timestamp: new Date(),
      canRespond: false, // Triggered effects typically can't be responded to
      parameters
    };

    const triggeredEffect: TriggeredEffect = {
      stackEffect,
      triggerEvent: null as any, // Will be set when triggered
      condition: triggerCondition,
      priority: effect.priority
    };

    // Add to appropriate event listener
    const listeners = this.triggerListeners.get(triggerCondition.eventType);
    if (listeners) {
      listeners.push(triggeredEffect);
    }
  }

  /**
   * Process a game event and trigger any applicable effects
   */
  public processGameEvent(event: GameEvent, gameState: GameState): TriggeredEffect[] {
    const triggeredEffects: TriggeredEffect[] = [];
    const listeners = this.triggerListeners.get(event.type) || [];

    for (const triggeredEffect of listeners) {
      if (this.checkTriggerCondition(triggeredEffect.condition, event, gameState)) {
        // Create a copy with the trigger event set
        const activatedEffect: TriggeredEffect = {
          ...triggeredEffect,
          triggerEvent: event
        };
        triggeredEffects.push(activatedEffect);
      }
    }

    // Sort by priority (higher priority first)
    triggeredEffects.sort((a, b) => b.priority - a.priority);

    return triggeredEffects;
  }

  /**
   * Parse trigger condition string into structured condition
   */
  private parseTriggerCondition(trigger: string): TriggerCondition | null {
    const triggerMappings: Record<string, TriggerCondition> = {
      'on_play': {
        eventType: GameEventType.CARD_ENTERS_PLAY,
        conditions: [],
        timing: 'after'
      },
      'on_summon_defeated': {
        eventType: GameEventType.SUMMON_DEFEATED,
        conditions: [
          { field: 'controller', operator: 'equals', value: 'self' }
        ],
        timing: 'after'
      },
      'on_summon_destroyed': {
        eventType: GameEventType.SUMMON_DESTROYED,
        conditions: [
          { field: 'source', operator: 'equals', value: 'opponent' }
        ],
        timing: 'instead_of'
      },
      'on_warlock_damage': {
        eventType: GameEventType.SUMMON_TAKES_DAMAGE,
        conditions: [
          { field: 'target.role', operator: 'contains', value: 'Warlock' },
          { field: 'controller', operator: 'equals', value: 'self' }
        ],
        timing: 'after'
      },
      'on_turn_start': {
        eventType: GameEventType.TURN_START,
        conditions: [],
        timing: 'after'
      },
      'on_turn_end': {
        eventType: GameEventType.TURN_END,
        conditions: [],
        timing: 'before'
      },
      'on_phase_start': {
        eventType: GameEventType.PHASE_START,
        conditions: [],
        timing: 'after'
      },
      'on_attack': {
        eventType: GameEventType.SUMMON_ATTACKS,
        conditions: [
          { field: 'source', operator: 'equals', value: 'self' }
        ],
        timing: 'before'
      },
      'on_building_destroyed': {
        eventType: GameEventType.BUILDING_DESTROYED,
        conditions: [],
        timing: 'after'
      }
    };

    return triggerMappings[trigger] || null;
  }

  /**
   * Check if a trigger condition is met by the current event
   */
  private checkTriggerCondition(
    condition: TriggerCondition,
    event: GameEvent,
    gameState: GameState
  ): boolean {
    // All conditions must be true
    for (const cond of condition.conditions) {
      if (!this.evaluateCondition(cond, event, gameState)) {
        return false;
      }
    }
    return true;
  }

  /**
   * Evaluate a single condition
   */
  private evaluateCondition(
    condition: { field: string; operator: string; value: any },
    event: GameEvent,
    gameState: GameState
  ): boolean {
    const fieldValue = this.getFieldValue(condition.field, event, gameState);
    
    switch (condition.operator) {
      case 'equals':
        return this.resolveValue(fieldValue, event) === this.resolveValue(condition.value, event);
      case 'not_equals':
        return this.resolveValue(fieldValue, event) !== this.resolveValue(condition.value, event);
      case 'greater_than':
        return Number(fieldValue) > Number(condition.value);
      case 'less_than':
        return Number(fieldValue) < Number(condition.value);
      case 'contains':
        return String(fieldValue).includes(String(condition.value));
      default:
        return false;
    }
  }

  /**
   * Get field value from event or game state
   */
  private getFieldValue(field: string, event: GameEvent, gameState: GameState): any {
    const parts = field.split('.');
    let value: any = event;

    // Special field handling
    switch (parts[0]) {
      case 'controller':
        return event.player;
      case 'source':
        return event.source;
      case 'target':
        if (parts.length > 1) {
          // Navigate nested target properties
          value = event.target;
          for (let i = 1; i < parts.length; i++) {
            value = value?.[parts[i]];
          }
          return value;
        }
        return event.target;
      case 'data':
        if (parts.length > 1) {
          value = event.data;
          for (let i = 1; i < parts.length; i++) {
            value = value?.[parts[i]];
          }
          return value;
        }
        return event.data;
      default:
        // Navigate through the field path
        for (const part of parts) {
          value = value?.[part];
        }
        return value;
    }
  }

  /**
   * Resolve special values like 'self' and 'opponent'
   */
  private resolveValue(value: any, event: GameEvent): any {
    if (typeof value === 'string') {
      switch (value) {
        case 'self':
          return event.player;
        case 'opponent':
          return event.player === 'A' ? 'B' : 'A';
        default:
          return value;
      }
    }
    return value;
  }

  /**
   * Get speed level from trigger type
   */
  private getSpeedFromTrigger(trigger: string): any {
    // Most triggers are counter speed for immediate response
    const counterTriggers = [
      'on_summon_defeated',
      'on_summon_destroyed', 
      'on_warlock_damage'
    ];

    if (counterTriggers.includes(trigger)) {
      return 'COUNTER'; // Would use Speed.COUNTER but need to import
    }

    return 'ACTION'; // Default to action speed
  }

  /**
   * Remove triggered effects that are no longer valid
   */
  public cleanupExpiredTriggers(sourceId: string): void {
    for (const [eventType, listeners] of this.triggerListeners.entries()) {
      const filtered = listeners.filter(trigger => trigger.stackEffect.source !== sourceId);
      this.triggerListeners.set(eventType, filtered);
    }
  }

  /**
   * Get all active trigger listeners for debugging
   */
  public getActiveTriggers(): Map<GameEventType, TriggeredEffect[]> {
    return new Map(this.triggerListeners);
  }

  /**
   * Check if any triggers are waiting for a specific event type
   */
  public hasTriggersForEvent(eventType: GameEventType): boolean {
    const listeners = this.triggerListeners.get(eventType) || [];
    return listeners.length > 0;
  }
}