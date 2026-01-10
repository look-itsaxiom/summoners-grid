/**
 * Turn structure and phase types
 */

import type { UnitId } from './base';

/** Turn phases in order */
export type TurnPhase = 'draw' | 'level' | 'action' | 'end';

/** Order of phases for iteration */
export const PHASE_ORDER: TurnPhase[] = ['draw', 'level', 'action', 'end'];

/**
 * Tracks actions available to a specific unit this turn.
 */
export interface UnitTurnActions {
  /** Attacks remaining this turn (normally 1) */
  attacksRemaining: number;
  /** Movement points remaining this turn */
  movementRemaining: number;
  /** Has this unit used its ability this turn? */
  abilityUsed: boolean;
}

/**
 * Turn state tracking.
 */
export interface TurnState {
  /** Turn number (starts at 1) */
  number: number;
  /** Current phase */
  phase: TurnPhase;
  /** Has the player used their one summon this turn? */
  turnSummonUsed: boolean;
  /** Per-unit action tracking */
  unitActions: Map<UnitId, UnitTurnActions>;
  /** Is this the first turn of the game? (skip draw phase) */
  isFirstTurn: boolean;
}

/**
 * Create initial turn state for a new game.
 */
export function createInitialTurnState(): TurnState {
  return {
    number: 1,
    phase: 'draw',
    turnSummonUsed: false,
    unitActions: new Map(),
    isFirstTurn: true,
  };
}

/**
 * Create unit action tracking for a newly played unit.
 */
export function createUnitTurnActions(movementSpeed: number): UnitTurnActions {
  return {
    attacksRemaining: 1,
    movementRemaining: movementSpeed,
    abilityUsed: false,
  };
}

/**
 * Reset unit actions at the start of a turn.
 */
export function resetUnitTurnActions(
  current: UnitTurnActions,
  movementSpeed: number
): UnitTurnActions {
  return {
    attacksRemaining: 1,
    movementRemaining: movementSpeed,
    abilityUsed: false,
  };
}
