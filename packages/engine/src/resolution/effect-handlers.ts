/**
 * Effect Handler Registry
 *
 * The engine uses a handler registry pattern where each effect type has a
 * registered handler that knows how to resolve it. This keeps effect logic
 * extensible without modifying core resolution code.
 */

import type { GameState } from '../state/game';
import type { Effect, StackEntry, Selection } from '../state/effects';
import type { KnownGameEvent } from '../state/events';

/**
 * Context provided to effect handlers during resolution.
 */
export interface EffectContext {
  /** Current game state (immutable - handlers return new state) */
  state: GameState;
  /** The stack entry being resolved */
  entry: StackEntry;
  /** The specific effect being resolved */
  effect: Effect;
  /** Selections made for this entry */
  selections: Record<string, Selection>;
  /** Random number generator (seeded for reproducibility) */
  random: () => number;
}

/**
 * Result of resolving an effect.
 */
export interface EffectResult {
  /** Updated game state */
  state: GameState;
  /** Events generated for animation/logging */
  events: KnownGameEvent[];
  /** Additional effects triggered by this resolution (go on stack) */
  triggeredEffects?: TriggeredEffect[];
}

/**
 * An effect triggered during resolution that needs to go on the stack.
 */
export interface TriggeredEffect {
  /** Source entity that triggered this */
  source: string;
  /** Effects to add */
  effects: Effect[];
  /** Speed of triggered effects (usually 'counter' for triggers) */
  speed: 'action' | 'reaction' | 'counter';
  /** Selections (may need player input) */
  selections?: Record<string, Selection>;
}

/**
 * Effect handler function signature.
 * Handlers are pure functions that take context and return results.
 */
export type EffectHandler = (context: EffectContext) => EffectResult;

/**
 * Registry of effect handlers by type.
 */
class EffectHandlerRegistry {
  private handlers: Map<string, EffectHandler> = new Map();

  /**
   * Register a handler for an effect type.
   */
  register(effectType: string, handler: EffectHandler): void {
    if (this.handlers.has(effectType)) {
      console.warn(`Overwriting handler for effect type: ${effectType}`);
    }
    this.handlers.set(effectType, handler);
  }

  /**
   * Get the handler for an effect type.
   */
  get(effectType: string): EffectHandler | undefined {
    return this.handlers.get(effectType);
  }

  /**
   * Check if a handler exists for an effect type.
   */
  has(effectType: string): boolean {
    return this.handlers.has(effectType);
  }

  /**
   * Resolve an effect using the registered handler.
   * Returns unchanged state if no handler exists.
   */
  resolve(context: EffectContext): EffectResult {
    const handler = this.handlers.get(context.effect.type);

    if (!handler) {
      console.warn(`No handler for effect type: ${context.effect.type}`);
      // Return unchanged state with no events
      return {
        state: context.state,
        events: [],
      };
    }

    return handler(context);
  }

  /**
   * Get all registered effect types.
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.handlers.keys());
  }
}

/** Singleton effect handler registry */
export const effectHandlerRegistry = new EffectHandlerRegistry();

/**
 * Helper to register multiple handlers at once.
 */
export function registerEffectHandlers(
  handlers: Record<string, EffectHandler>
): void {
  for (const [type, handler] of Object.entries(handlers)) {
    effectHandlerRegistry.register(type, handler);
  }
}

// ============================================================================
// Built-in Effect Handlers
// ============================================================================

/**
 * No-op effect handler - does nothing.
 * Useful for effects that are purely cosmetic or handled elsewhere.
 */
export const noopEffectHandler: EffectHandler = (context) => ({
  state: context.state,
  events: [],
});

/**
 * Log effect handler - logs effect params for debugging.
 */
export const logEffectHandler: EffectHandler = (context) => {
  console.log(`[Effect] ${context.effect.type}:`, context.effect.params);
  return {
    state: context.state,
    events: [],
  };
};

// Register built-in handlers
effectHandlerRegistry.register('noop', noopEffectHandler);
effectHandlerRegistry.register('log', logEffectHandler);
