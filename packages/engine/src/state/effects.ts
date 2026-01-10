/**
 * Effect system types
 */

import type { EntityId, Speed } from './base';

/**
 * Flexible effect definition.
 * Engine has handler registry that interprets effects by type.
 */
export interface Effect {
  type: string;
  params: Record<string, unknown>;
}

/**
 * Requirement that must be met to play/activate a card.
 */
export interface Requirement {
  type: string;
  params: Record<string, unknown>;
}

/**
 * Prompt for player to make a selection.
 */
export interface SelectionPrompt {
  id: string;
  type: 'unit' | 'card' | 'position' | 'player' | 'number' | 'choice';
  /** Filter expression for valid selections */
  filter?: string;
  /** Is this selection optional? */
  optional?: boolean;
  /** Min/max for number selections */
  min?: number;
  max?: number;
  /** Choices for choice selections */
  choices?: string[];
}

/** Selection value types */
export type Selection = EntityId | { x: number; y: number } | number | string;

/**
 * Effect stack for resolution.
 * Effects resolve LIFO with speed lock rules.
 */
export interface EffectStack {
  entries: StackEntry[];
  /** Current speed lock - determines what speeds can respond */
  speedLock: Speed;
  /** Which player has priority to respond */
  priorityPlayer: 0 | 1;
  /** Has current priority player passed? */
  priorityPassed: boolean;
}

/**
 * Entry on the effect stack.
 */
export interface StackEntry {
  id: string;
  /** Entity that created this effect */
  source: EntityId;
  /** Card that created this effect (if any) */
  sourceCardId?: string;
  /** Effects to resolve */
  effects: Effect[];
  /** Speed of this entry */
  speed: Speed;
  /** Selected targets/values */
  selections: Record<string, Selection>;
}

/**
 * Status effect applied to a unit.
 */
export interface StatusEffect {
  id: string;
  type: string;
  /** Source entity that applied this effect */
  source: EntityId;
  /** Turns remaining (-1 = permanent until removed) */
  duration: number;
  /** Effect parameters */
  params: Record<string, unknown>;
}

/** Empty stack factory */
export function createEmptyStack(activePlayer: 0 | 1): EffectStack {
  return {
    entries: [],
    speedLock: 'action',
    priorityPlayer: activePlayer,
    priorityPassed: false,
  };
}
