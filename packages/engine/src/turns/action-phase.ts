/**
 * Action Phase Tracking
 *
 * Action Phase rules from GDD:
 * - One Turn Summon: Only one summon can be played per turn
 * - Summon Draws: Playing a summon triggers drawing 3 cards from Main Deck
 * - One Attack: Each summon can only attack once per turn
 * - Movement Limit: Summons can move up to their movement speed per turn
 * - Split Actions: Movement can be divided before/after attacking
 *
 * This module tracks what actions units have remaining and validates
 * whether actions are legal. The actual action dispatch is handled
 * by the action dispatch system.
 */

import type { GameState } from '../state/game';
import type { TurnState, UnitTurnActions } from '../state/turn';
import type { UnitId, PlayerIndex } from '../state/base';
import type { SummonUnit, Board } from '../state/units';
import { createUnitTurnActions } from '../state/turn';
import { calculateMovementSpeed } from '../stats/derived';

/**
 * Check if a unit can attack (has attacks remaining).
 */
export function canUnitAttack(
  turn: TurnState,
  unitId: UnitId
): boolean {
  const unitActions = turn.unitActions.get(unitId);
  if (!unitActions) {
    return false; // Unit not tracked (may not have been played yet)
  }
  return unitActions.attacksRemaining > 0;
}

/**
 * Check if a unit can move (has movement remaining).
 */
export function canUnitMove(
  turn: TurnState,
  unitId: UnitId
): boolean {
  const unitActions = turn.unitActions.get(unitId);
  if (!unitActions) {
    return false;
  }
  return unitActions.movementRemaining > 0;
}

/**
 * Check how much movement a unit has remaining.
 */
export function getRemainingMovement(
  turn: TurnState,
  unitId: UnitId
): number {
  const unitActions = turn.unitActions.get(unitId);
  return unitActions?.movementRemaining ?? 0;
}

/**
 * Check if the turn summon has been used.
 */
export function canPlaySummon(turn: TurnState): boolean {
  return !turn.turnSummonUsed;
}

/**
 * Check if a unit can use its ability.
 */
export function canUnitUseAbility(
  turn: TurnState,
  unitId: UnitId
): boolean {
  const unitActions = turn.unitActions.get(unitId);
  if (!unitActions) {
    return false;
  }
  return !unitActions.abilityUsed;
}

/**
 * Consume an attack for a unit.
 */
export function consumeAttack(
  turn: TurnState,
  unitId: UnitId
): TurnState {
  const unitActions = turn.unitActions.get(unitId);
  if (!unitActions || unitActions.attacksRemaining <= 0) {
    return turn;
  }

  const newUnitActions = new Map(turn.unitActions);
  newUnitActions.set(unitId, {
    ...unitActions,
    attacksRemaining: unitActions.attacksRemaining - 1,
  });

  return {
    ...turn,
    unitActions: newUnitActions,
  };
}

/**
 * Consume movement for a unit.
 */
export function consumeMovement(
  turn: TurnState,
  unitId: UnitId,
  amount: number
): TurnState {
  const unitActions = turn.unitActions.get(unitId);
  if (!unitActions || unitActions.movementRemaining < amount) {
    return turn;
  }

  const newUnitActions = new Map(turn.unitActions);
  newUnitActions.set(unitId, {
    ...unitActions,
    movementRemaining: unitActions.movementRemaining - amount,
  });

  return {
    ...turn,
    unitActions: newUnitActions,
  };
}

/**
 * Mark the turn summon as used.
 */
export function consumeTurnSummon(turn: TurnState): TurnState {
  return {
    ...turn,
    turnSummonUsed: true,
  };
}

/**
 * Mark a unit's ability as used.
 */
export function consumeAbility(
  turn: TurnState,
  unitId: UnitId
): TurnState {
  const unitActions = turn.unitActions.get(unitId);
  if (!unitActions) {
    return turn;
  }

  const newUnitActions = new Map(turn.unitActions);
  newUnitActions.set(unitId, {
    ...unitActions,
    abilityUsed: true,
  });

  return {
    ...turn,
    unitActions: newUnitActions,
  };
}

/**
 * Grant additional attacks to a unit (from card effects).
 */
export function grantExtraAttacks(
  turn: TurnState,
  unitId: UnitId,
  amount: number
): TurnState {
  const unitActions = turn.unitActions.get(unitId);
  if (!unitActions) {
    return turn;
  }

  const newUnitActions = new Map(turn.unitActions);
  newUnitActions.set(unitId, {
    ...unitActions,
    attacksRemaining: unitActions.attacksRemaining + amount,
  });

  return {
    ...turn,
    unitActions: newUnitActions,
  };
}

/**
 * Grant additional movement to a unit (from card effects).
 */
export function grantExtraMovement(
  turn: TurnState,
  unitId: UnitId,
  amount: number
): TurnState {
  const unitActions = turn.unitActions.get(unitId);
  if (!unitActions) {
    return turn;
  }

  const newUnitActions = new Map(turn.unitActions);
  newUnitActions.set(unitId, {
    ...unitActions,
    movementRemaining: unitActions.movementRemaining + amount,
  });

  return {
    ...turn,
    unitActions: newUnitActions,
  };
}

/**
 * Register a newly played unit in the turn tracking.
 */
export function registerNewUnit(
  turn: TurnState,
  unit: SummonUnit
): TurnState {
  const movementSpeed = calculateMovementSpeed(unit.calculatedStats.SPD);
  const newUnitActions = new Map(turn.unitActions);
  newUnitActions.set(unit.id, createUnitTurnActions(movementSpeed));

  return {
    ...turn,
    unitActions: newUnitActions,
  };
}

/**
 * Initialize action tracking for all units at the start of a turn.
 */
export function initializeUnitActions(
  turn: TurnState,
  board: Board,
  activePlayer: PlayerIndex
): TurnState {
  const newUnitActions = new Map<UnitId, UnitTurnActions>();

  // Initialize actions for all units owned by the active player
  for (const unit of board.units.values()) {
    if (unit.owner === activePlayer) {
      const movementSpeed = calculateMovementSpeed(unit.calculatedStats.SPD);
      newUnitActions.set(unit.id, createUnitTurnActions(movementSpeed));
    }
  }

  return {
    ...turn,
    unitActions: newUnitActions,
    turnSummonUsed: false,
  };
}

/**
 * Get a summary of what actions are available for a unit.
 */
export interface UnitActionSummary {
  canAttack: boolean;
  attacksRemaining: number;
  canMove: boolean;
  movementRemaining: number;
  canUseAbility: boolean;
}

export function getUnitActionSummary(
  turn: TurnState,
  unitId: UnitId
): UnitActionSummary | null {
  const unitActions = turn.unitActions.get(unitId);
  if (!unitActions) {
    return null;
  }

  return {
    canAttack: unitActions.attacksRemaining > 0,
    attacksRemaining: unitActions.attacksRemaining,
    canMove: unitActions.movementRemaining > 0,
    movementRemaining: unitActions.movementRemaining,
    canUseAbility: !unitActions.abilityUsed,
  };
}

/**
 * Get all units that can still act this turn.
 */
export function getUnitsWithActionsRemaining(
  turn: TurnState,
  board: Board,
  player: PlayerIndex
): UnitId[] {
  const unitsWithActions: UnitId[] = [];

  for (const [unitId, actions] of turn.unitActions) {
    const unit = board.units.get(unitId);
    if (!unit || unit.owner !== player) continue;

    // Unit can act if it has attacks, movement, or ability available
    if (
      actions.attacksRemaining > 0 ||
      actions.movementRemaining > 0 ||
      !actions.abilityUsed
    ) {
      unitsWithActions.push(unitId);
    }
  }

  return unitsWithActions;
}
