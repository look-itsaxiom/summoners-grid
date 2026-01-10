/**
 * Trigger System
 *
 * Triggers are conditions that, when met, cause effects to be added to the stack.
 * Common triggers include: on play, on defeat, phase triggers, combat triggers.
 *
 * The trigger system works by:
 * 1. Game events are emitted during resolution
 * 2. Trigger checkers examine events against registered triggers
 * 3. Matching triggers generate effects that go on the stack
 */

import type { GameState } from '../state/game';
import type { KnownGameEvent } from '../state/events';
import type { TriggerCondition } from '../state/cards';
import type { Effect } from '../state/effects';
import type { EntityId, PlayerIndex } from '../state/base';

/**
 * Context provided to trigger condition checkers.
 */
export interface TriggerContext {
  /** Current game state */
  state: GameState;
  /** The event that may trigger effects */
  event: KnownGameEvent;
  /** The trigger condition to check */
  condition: TriggerCondition;
  /** Entity that owns this trigger */
  owner: EntityId;
  /** Player who owns the trigger */
  ownerPlayer: PlayerIndex;
}

/**
 * Result of checking a trigger condition.
 */
export interface TriggerCheckResult {
  /** Did the trigger fire? */
  triggered: boolean;
  /** Effects to add to stack if triggered */
  effects?: Effect[];
  /** Selections needed (may require player input) */
  selectionsNeeded?: string[];
}

/**
 * Trigger condition checker function signature.
 */
export type TriggerChecker = (context: TriggerContext) => TriggerCheckResult;

/**
 * Registry of trigger condition checkers.
 */
class TriggerRegistry {
  private checkers: Map<string, TriggerChecker> = new Map();

  /**
   * Register a checker for a trigger condition type.
   */
  register(conditionType: string, checker: TriggerChecker): void {
    if (this.checkers.has(conditionType)) {
      console.warn(`Overwriting checker for trigger type: ${conditionType}`);
    }
    this.checkers.set(conditionType, checker);
  }

  /**
   * Get the checker for a trigger condition type.
   */
  get(conditionType: string): TriggerChecker | undefined {
    return this.checkers.get(conditionType);
  }

  /**
   * Check if a trigger condition is met.
   */
  check(context: TriggerContext): TriggerCheckResult {
    const checker = this.checkers.get(context.condition.type);

    if (!checker) {
      console.warn(`No checker for trigger type: ${context.condition.type}`);
      return { triggered: false };
    }

    return checker(context);
  }

  /**
   * Get all registered trigger types.
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.checkers.keys());
  }
}

/** Singleton trigger registry */
export const triggerRegistry = new TriggerRegistry();

/**
 * Helper to register multiple trigger checkers at once.
 */
export function registerTriggerCheckers(
  checkers: Record<string, TriggerChecker>
): void {
  for (const [type, checker] of Object.entries(checkers)) {
    triggerRegistry.register(type, checker);
  }
}

// ============================================================================
// Trigger Event Types
// ============================================================================

/**
 * Common trigger event types as string constants.
 * Cards can reference these in their trigger conditions.
 */
export const TRIGGER_EVENTS = {
  // Play triggers
  ON_PLAY: 'on_play',
  ON_SUMMON_PLAYED: 'on_summon_played',
  ON_CARD_PLAYED: 'on_card_played',

  // Combat triggers
  ON_ATTACK_DECLARED: 'on_attack_declared',
  ON_ATTACK_HIT: 'on_attack_hit',
  ON_ATTACK_MISSED: 'on_attack_missed',
  ON_DAMAGE_DEALT: 'on_damage_dealt',
  ON_DAMAGE_TAKEN: 'on_damage_taken',
  ON_HEAL: 'on_heal',

  // Defeat triggers
  ON_DEFEAT: 'on_defeat',
  ON_UNIT_DEFEATED: 'on_unit_defeated',

  // Phase triggers
  ON_TURN_START: 'on_turn_start',
  ON_TURN_END: 'on_turn_end',
  ON_DRAW_PHASE: 'on_draw_phase',
  ON_LEVEL_PHASE: 'on_level_phase',
  ON_ACTION_PHASE: 'on_action_phase',
  ON_END_PHASE: 'on_end_phase',

  // Movement triggers
  ON_MOVE: 'on_move',
  ON_ENTER_TERRITORY: 'on_enter_territory',
  ON_LEAVE_TERRITORY: 'on_leave_territory',

  // Level triggers
  ON_LEVEL_UP: 'on_level_up',
  ON_ROLE_CHANGE: 'on_role_change',

  // Stack triggers
  ON_EFFECT_ADDED: 'on_effect_added',
  ON_EFFECT_RESOLVED: 'on_effect_resolved',

  // Victory triggers
  ON_VP_GAINED: 'on_vp_gained',
} as const;

export type TriggerEventType = (typeof TRIGGER_EVENTS)[keyof typeof TRIGGER_EVENTS];

// ============================================================================
// Built-in Trigger Checkers
// ============================================================================

/**
 * Always trigger - for testing or unconditional effects.
 */
const alwaysTriggerChecker: TriggerChecker = () => ({
  triggered: true,
});

/**
 * Never trigger - for disabled triggers.
 */
const neverTriggerChecker: TriggerChecker = () => ({
  triggered: false,
});

/**
 * On unit defeated trigger - fires when any unit is defeated.
 */
const onUnitDefeatedChecker: TriggerChecker = (context) => {
  if (context.event.type !== 'UNIT_DEFEATED') {
    return { triggered: false };
  }

  // Check if we care about which unit was defeated
  const params = context.condition.params;
  if (params.ownUnit && context.event.params.defeatedBy !== context.owner) {
    return { triggered: false };
  }

  return { triggered: true };
};

/**
 * On turn start trigger - fires at the start of a turn.
 */
const onTurnStartChecker: TriggerChecker = (context) => {
  if (context.event.type !== 'TURN_START') {
    return { triggered: false };
  }

  // Check if we only care about our own turns
  const params = context.condition.params;
  if (params.ownTurnOnly && context.event.params.activePlayer !== context.ownerPlayer) {
    return { triggered: false };
  }

  return { triggered: true };
};

/**
 * On damage taken trigger - fires when a unit takes damage.
 */
const onDamageTakenChecker: TriggerChecker = (context) => {
  if (context.event.type !== 'DAMAGE_TAKEN') {
    return { triggered: false };
  }

  const params = context.condition.params;

  // Check minimum damage threshold
  if (params.minDamage && context.event.params.amount < (params.minDamage as number)) {
    return { triggered: false };
  }

  // Check damage type
  if (params.damageType && context.event.params.damageType !== params.damageType) {
    return { triggered: false };
  }

  return { triggered: true };
};

/**
 * On phase change trigger - fires when entering a specific phase.
 */
const onPhaseChangeChecker: TriggerChecker = (context) => {
  if (context.event.type !== 'PHASE_CHANGE') {
    return { triggered: false };
  }

  const params = context.condition.params;

  // Check if we care about a specific phase
  if (params.phase && context.event.params.phase !== params.phase) {
    return { triggered: false };
  }

  // Check if we only care about our own turns
  if (params.ownTurnOnly && context.event.params.player !== context.ownerPlayer) {
    return { triggered: false };
  }

  return { triggered: true };
};

// Register built-in checkers
triggerRegistry.register('always', alwaysTriggerChecker);
triggerRegistry.register('never', neverTriggerChecker);
triggerRegistry.register(TRIGGER_EVENTS.ON_UNIT_DEFEATED, onUnitDefeatedChecker);
triggerRegistry.register(TRIGGER_EVENTS.ON_TURN_START, onTurnStartChecker);
triggerRegistry.register(TRIGGER_EVENTS.ON_DAMAGE_TAKEN, onDamageTakenChecker);
triggerRegistry.register(TRIGGER_EVENTS.ON_DRAW_PHASE, onPhaseChangeChecker);
triggerRegistry.register(TRIGGER_EVENTS.ON_LEVEL_PHASE, onPhaseChangeChecker);
triggerRegistry.register(TRIGGER_EVENTS.ON_ACTION_PHASE, onPhaseChangeChecker);
triggerRegistry.register(TRIGGER_EVENTS.ON_END_PHASE, onPhaseChangeChecker);

// ============================================================================
// Trigger Collection Helpers
// ============================================================================

/**
 * A registered trigger source (card, ability, etc.) that can fire.
 */
export interface RegisteredTrigger {
  /** Unique ID for this trigger instance */
  id: string;
  /** Entity that owns this trigger */
  owner: EntityId;
  /** Player who owns the trigger */
  ownerPlayer: PlayerIndex;
  /** The trigger condition */
  condition: TriggerCondition;
  /** Effects to execute when triggered */
  effects: Effect[];
  /** Is this trigger currently active? */
  active: boolean;
}

/**
 * Collect all active triggers from the game state.
 * This scans cards in play, units with abilities, quests, etc.
 */
export function collectActiveTriggers(state: GameState): RegisteredTrigger[] {
  const triggers: RegisteredTrigger[] = [];

  // Collect from in-play cards for both players
  for (let playerIdx = 0; playerIdx < 2; playerIdx++) {
    const player = state.players[playerIdx as PlayerIndex];

    // Check in-play cards (counters, buildings, quests)
    for (const inPlayCard of player.inPlay) {
      // Counter cards have trigger conditions
      if (inPlayCard.card.type === 'counter' && !inPlayCard.faceDown) {
        // Face-up counters shouldn't exist, but handle gracefully
        continue;
      }

      if (inPlayCard.card.type === 'counter' && inPlayCard.faceDown) {
        const counterCard = inPlayCard.card;
        triggers.push({
          id: `trigger-${inPlayCard.id}`,
          owner: inPlayCard.id,
          ownerPlayer: playerIdx as PlayerIndex,
          condition: counterCard.triggerCondition,
          effects: counterCard.effects,
          active: true,
        });
      }

      // Quest cards with completion/failure conditions
      if (inPlayCard.card.type === 'quest') {
        const questCard = inPlayCard.card;
        triggers.push({
          id: `trigger-${inPlayCard.id}-complete`,
          owner: inPlayCard.id,
          ownerPlayer: playerIdx as PlayerIndex,
          condition: questCard.completionCondition,
          effects: questCard.completionEffects,
          active: true,
        });

        if (questCard.failureCondition) {
          triggers.push({
            id: `trigger-${inPlayCard.id}-fail`,
            owner: inPlayCard.id,
            ownerPlayer: playerIdx as PlayerIndex,
            condition: questCard.failureCondition,
            effects: questCard.failureEffects ?? [],
            active: true,
          });
        }
      }

      // Building traps
      if (inPlayCard.card.type === 'building' && inPlayCard.card.isTrap && inPlayCard.faceDown) {
        const buildingCard = inPlayCard.card;
        if (buildingCard.trapTrigger) {
          triggers.push({
            id: `trigger-${inPlayCard.id}-trap`,
            owner: inPlayCard.id,
            ownerPlayer: playerIdx as PlayerIndex,
            condition: buildingCard.trapTrigger,
            effects: buildingCard.ongoingEffects, // Traps use ongoing effects when triggered
            active: true,
          });
        }
      }
    }
  }

  return triggers;
}

/**
 * Check all triggers against an event and return those that fire.
 */
export function checkTriggersForEvent(
  state: GameState,
  event: KnownGameEvent,
  triggers: RegisteredTrigger[]
): RegisteredTrigger[] {
  const firedTriggers: RegisteredTrigger[] = [];

  for (const trigger of triggers) {
    if (!trigger.active) continue;

    const context: TriggerContext = {
      state,
      event,
      condition: trigger.condition,
      owner: trigger.owner,
      ownerPlayer: trigger.ownerPlayer,
    };

    const result = triggerRegistry.check(context);
    if (result.triggered) {
      firedTriggers.push(trigger);
    }
  }

  return firedTriggers;
}
