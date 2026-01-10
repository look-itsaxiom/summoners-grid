/**
 * Stack Resolution System
 *
 * The stack is the core mechanism for resolving effects in Summoner's Grid.
 * Effects are added to the stack and resolve in Last-In-First-Out (LIFO) order.
 *
 * Key concepts:
 * - Speed Lock: Higher speed effects lock out lower speed responses
 * - Priority: Players alternate chances to respond
 * - Resolution: Effects resolve one at a time, potentially triggering more effects
 */

import type { GameState } from '../state/game';
import type {
  Effect,
  EffectStack,
  StackEntry,
  Selection,
} from '../state/effects';
import type { KnownGameEvent } from '../state/events';
import type { EntityId, Speed, PlayerIndex } from '../state/base';
import { createEvent } from '../state/events';
import {
  effectHandlerRegistry,
  type EffectContext,
  type TriggeredEffect,
} from './effect-handlers';
import {
  collectActiveTriggers,
  checkTriggersForEvent,
} from './triggers';

// ============================================================================
// Speed Lock Logic
// ============================================================================

/**
 * Speed hierarchy (higher index = faster speed).
 */
const SPEED_HIERARCHY: Record<Speed, number> = {
  action: 0,
  reaction: 1,
  counter: 2,
};

/**
 * Determine the new speed lock when an effect is added.
 * Higher speed effects create a lock preventing lower speeds from responding.
 */
export function getNewSpeedLock(currentLock: Speed, addedSpeed: Speed): Speed {
  const currentLevel = SPEED_HIERARCHY[currentLock];
  const addedLevel = SPEED_HIERARCHY[addedSpeed];

  // Speed lock moves to the higher of the two
  if (addedLevel > currentLevel) {
    return addedSpeed;
  }
  return currentLock;
}

/**
 * Check if a speed can be played given the current speed lock.
 */
export function canPlaySpeed(speedLock: Speed, playSpeed: Speed): boolean {
  const lockLevel = SPEED_HIERARCHY[speedLock];
  const playLevel = SPEED_HIERARCHY[playSpeed];

  // Can only play effects at or above the current lock level
  return playLevel >= lockLevel;
}

/**
 * Get the speed lock for an empty stack.
 */
export function getEmptyStackSpeedLock(): Speed {
  return 'action';
}

// ============================================================================
// Stack Manipulation
// ============================================================================

/**
 * Generate a unique ID for a stack entry.
 */
let entryCounter = 0;
export function generateEntryId(): string {
  return `entry-${++entryCounter}-${Date.now()}`;
}

/**
 * Reset entry counter (for testing).
 */
export function resetEntryCounter(): void {
  entryCounter = 0;
}

/**
 * Create a new stack entry.
 */
export function createStackEntry(
  source: EntityId,
  effects: Effect[],
  speed: Speed,
  selections: Record<string, Selection> = {},
  sourceCardId?: string
): StackEntry {
  return {
    id: generateEntryId(),
    source,
    sourceCardId,
    effects,
    speed,
    selections,
  };
}

/**
 * Add an entry to the stack.
 * Returns the updated stack with new speed lock.
 */
export function addToStack(
  stack: EffectStack,
  entry: StackEntry,
  activePlayer: PlayerIndex
): EffectStack {
  // Determine who gets priority after this effect is added
  // The opponent of the player who added the effect gets first response
  const priorityPlayer = (1 - activePlayer) as PlayerIndex;

  return {
    entries: [...stack.entries, entry],
    speedLock: getNewSpeedLock(stack.speedLock, entry.speed),
    priorityPlayer,
    priorityPassed: false,
  };
}

/**
 * Pass priority for the current player.
 * If both players pass consecutively, resolution begins.
 */
export function passPriority(
  stack: EffectStack,
  passingPlayer: PlayerIndex
): EffectStack {
  // Only the priority player can pass
  if (passingPlayer !== stack.priorityPlayer) {
    return stack;
  }

  if (stack.priorityPassed) {
    // Both players have passed - ready to resolve
    // Keep priorityPassed true to signal resolution should begin
    return stack;
  }

  // First pass - give priority to other player
  return {
    ...stack,
    priorityPlayer: (1 - stack.priorityPlayer) as PlayerIndex,
    priorityPassed: true,
  };
}

/**
 * Check if resolution should begin (both players passed).
 */
export function shouldResolve(stack: EffectStack): boolean {
  return stack.entries.length > 0 && stack.priorityPassed;
}

/**
 * Check if the stack is empty.
 */
export function isStackEmpty(stack: EffectStack): boolean {
  return stack.entries.length === 0;
}

// ============================================================================
// Stack Resolution
// ============================================================================

/**
 * Result of resolving the top stack entry.
 */
export interface ResolveResult {
  /** Updated game state */
  state: GameState;
  /** Events generated during resolution */
  events: KnownGameEvent[];
  /** Triggered effects that need to go on stack */
  triggeredEffects: TriggeredEffect[];
  /** Was resolution successful? */
  success: boolean;
  /** Error message if resolution failed */
  error?: string;
}

/**
 * Create a seeded random number generator for reproducible randomness.
 */
export function createSeededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    return state / 0x7fffffff;
  };
}

/**
 * Resolve the top entry on the stack.
 * This resolves all effects in the entry sequentially.
 */
export function resolveTopEntry(state: GameState): ResolveResult {
  const stack = state.stack;

  if (stack.entries.length === 0) {
    return {
      state,
      events: [],
      triggeredEffects: [],
      success: false,
      error: 'Stack is empty',
    };
  }

  // Pop the top entry (LIFO - last in, first out)
  const entry = stack.entries[stack.entries.length - 1];
  const remainingEntries = stack.entries.slice(0, -1);

  // Create events and track state changes
  const allEvents: KnownGameEvent[] = [];
  const allTriggeredEffects: TriggeredEffect[] = [];
  let currentState = state;

  // Create random generator from game seed
  const random = createSeededRandom(state.seed);

  // Resolve each effect in the entry
  for (const effect of entry.effects) {
    const context: EffectContext = {
      state: currentState,
      entry,
      effect,
      selections: entry.selections,
      random,
    };

    const result = effectHandlerRegistry.resolve(context);

    currentState = result.state;
    allEvents.push(...result.events);

    if (result.triggeredEffects) {
      allTriggeredEffects.push(...result.triggeredEffects);
    }
  }

  // Add effect resolved event
  allEvents.push(
    createEvent<KnownGameEvent>('EFFECT_RESOLVED', {
      entryId: entry.id,
      effectType: entry.effects.length > 0 ? entry.effects[0].type : 'unknown',
    })
  );

  // Collect triggers that may fire from these events
  const activeTriggers = collectActiveTriggers(currentState);
  for (const event of allEvents) {
    const firedTriggers = checkTriggersForEvent(currentState, event, activeTriggers);
    for (const trigger of firedTriggers) {
      allTriggeredEffects.push({
        source: trigger.owner,
        effects: trigger.effects,
        speed: 'counter', // Triggered effects are counter speed
      });
    }
  }

  // Update the stack - remove resolved entry, reset speed lock if empty
  const newSpeedLock = remainingEntries.length === 0
    ? getEmptyStackSpeedLock()
    : currentState.stack.speedLock;

  const newStack: EffectStack = {
    entries: remainingEntries,
    speedLock: newSpeedLock,
    priorityPlayer: currentState.stack.priorityPlayer,
    priorityPassed: false, // Reset for next resolution cycle
  };

  return {
    state: {
      ...currentState,
      stack: newStack,
    },
    events: allEvents,
    triggeredEffects: allTriggeredEffects,
    success: true,
  };
}

/**
 * Continue resolving the stack until it's empty or requires player input.
 * This handles automatic resolution when no responses are possible.
 */
export function resolveStack(
  state: GameState,
  canRespond: (state: GameState, player: PlayerIndex) => boolean
): ResolveResult {
  let currentState = state;
  const allEvents: KnownGameEvent[] = [];
  const allTriggeredEffects: TriggeredEffect[] = [];

  while (!isStackEmpty(currentState.stack)) {
    // Check if either player can respond
    const player0CanRespond = canRespond(currentState, 0);
    const player1CanRespond = canRespond(currentState, 1);

    if (player0CanRespond || player1CanRespond) {
      // Someone can respond - stop automatic resolution
      break;
    }

    // No one can respond - resolve top entry
    const result = resolveTopEntry(currentState);

    if (!result.success) {
      return {
        state: currentState,
        events: allEvents,
        triggeredEffects: allTriggeredEffects,
        success: false,
        error: result.error,
      };
    }

    currentState = result.state;
    allEvents.push(...result.events);
    allTriggeredEffects.push(...result.triggeredEffects);

    // Add triggered effects to stack
    for (const triggered of result.triggeredEffects) {
      const entry = createStackEntry(
        triggered.source as EntityId,
        triggered.effects,
        triggered.speed,
        triggered.selections
      );
      currentState = {
        ...currentState,
        stack: addToStack(currentState.stack, entry, currentState.activePlayerIndex),
      };
    }
  }

  return {
    state: currentState,
    events: allEvents,
    triggeredEffects: allTriggeredEffects,
    success: true,
  };
}

// ============================================================================
// Response Validation
// ============================================================================

/**
 * Check if a player has valid responses at the current speed lock.
 * This is a placeholder - actual implementation needs card checking.
 */
export function hasValidResponses(
  state: GameState,
  player: PlayerIndex,
  speedLock: Speed
): boolean {
  // Check if player has any cards/abilities that:
  // 1. Are at or above the current speed lock
  // 2. Meet their requirements
  // 3. Have valid targets

  const playerState = state.players[player];

  // Check hand for playable reaction/counter cards
  for (const card of playerState.hand) {
    if (card.type === 'reaction' && canPlaySpeed(speedLock, 'reaction')) {
      // Would need to check requirements and targets
      // For now, assume they might have valid responses
      return true;
    }
  }

  // Check in-play face-down counters
  for (const inPlay of playerState.inPlay) {
    if (inPlay.faceDown && inPlay.card.type === 'counter') {
      if (canPlaySpeed(speedLock, 'counter')) {
        return true;
      }
    }
  }

  return false;
}

/**
 * Get all valid responses a player can make.
 */
export function getValidResponses(
  state: GameState,
  player: PlayerIndex
): { type: 'card' | 'ability'; id: string; speed: Speed }[] {
  const responses: { type: 'card' | 'ability'; id: string; speed: Speed }[] = [];
  const speedLock = state.stack.speedLock;
  const playerState = state.players[player];

  // Check hand for playable cards
  for (const card of playerState.hand) {
    if (card.type === 'reaction' && canPlaySpeed(speedLock, 'reaction')) {
      responses.push({ type: 'card', id: card.id, speed: 'reaction' });
    }
  }

  // Check face-down counters
  for (const inPlay of playerState.inPlay) {
    if (inPlay.faceDown && inPlay.card.type === 'counter') {
      if (canPlaySpeed(speedLock, 'counter')) {
        responses.push({ type: 'card', id: inPlay.id, speed: 'counter' });
      }
    }
  }

  // TODO: Check unit abilities

  return responses;
}
