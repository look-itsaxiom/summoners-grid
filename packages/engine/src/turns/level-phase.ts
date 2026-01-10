/**
 * Level Phase Handler
 *
 * Level Phase rules from GDD:
 * - All summons controlled by turn player gain 1 level
 * - Stat recalculation occurs immediately
 * - HP Damage Retention: When max HP increases, current damage taken remains the same
 * - Ongoing effects may trigger additional level gains
 */

import type { GameState } from '../state/game';
import type { KnownGameEvent } from '../state/events';
import type { PlayerIndex, UnitId } from '../state/base';
import type { SummonUnit, Board } from '../state/units';
import { createEvent } from '../state/events';
import { levelUpUnit } from '../stats/unit';
import { MAX_LEVEL } from '../stats/growth-rates';

/**
 * Result of leveling up a single unit.
 */
export interface LevelUpResult {
  /** Updated unit (null if unit couldn't level) */
  unit: SummonUnit | null;
  /** Events generated */
  events: KnownGameEvent[];
  /** Did the level up succeed? */
  success: boolean;
  /** Reason for failure (if any) */
  failureReason?: string;
}

/**
 * Level up a single unit by the specified amount.
 */
export function levelUpSingleUnit(
  unit: SummonUnit,
  levelsGained: number = 1
): LevelUpResult {
  // Check if already at max level
  if (unit.level >= MAX_LEVEL) {
    return {
      unit,
      events: [],
      success: false,
      failureReason: 'Already at max level',
    };
  }

  // Check if would exceed max level
  const newLevel = Math.min(unit.level + levelsGained, MAX_LEVEL);
  const actualGain = newLevel - unit.level;

  if (actualGain <= 0) {
    return {
      unit,
      events: [],
      success: false,
      failureReason: 'No levels to gain',
    };
  }

  try {
    const leveledUnit = levelUpUnit(unit, actualGain);
    const events: KnownGameEvent[] = [
      createEvent<KnownGameEvent>('UNIT_LEVEL_UP', {
        unitId: unit.id,
        newLevel: leveledUnit.level,
      }),
    ];

    return {
      unit: leveledUnit,
      events,
      success: true,
    };
  } catch {
    return {
      unit,
      events: [],
      success: false,
      failureReason: 'Level up failed',
    };
  }
}

/**
 * Get all units owned by a player on the board.
 */
export function getPlayerUnits(board: Board, player: PlayerIndex): SummonUnit[] {
  const units: SummonUnit[] = [];
  for (const unit of board.units.values()) {
    if (unit.owner === player) {
      units.push(unit);
    }
  }
  return units;
}

/**
 * Update a unit in the board's unit map.
 */
function updateUnitInBoard(board: Board, unit: SummonUnit): Board {
  const newUnits = new Map(board.units);
  newUnits.set(unit.id, unit);
  return {
    ...board,
    units: newUnits,
  };
}

/**
 * Execute the level phase for a player.
 * All of their units on the board gain 1 level.
 */
export function executeLevelPhase(state: GameState): {
  state: GameState;
  events: KnownGameEvent[];
} {
  const activePlayer = state.activePlayerIndex;
  const events: KnownGameEvent[] = [];
  let currentBoard = state.board;

  // Get all units owned by the active player
  const playerUnits = getPlayerUnits(currentBoard, activePlayer);

  // Level up each unit
  for (const unit of playerUnits) {
    const result = levelUpSingleUnit(unit, 1);

    if (result.success && result.unit) {
      currentBoard = updateUnitInBoard(currentBoard, result.unit);
      events.push(...result.events);
    }
  }

  return {
    state: {
      ...state,
      board: currentBoard,
    },
    events,
  };
}

/**
 * Apply bonus level gains from effects.
 * This is called when effects grant additional levels.
 */
export function applyBonusLevels(
  state: GameState,
  unitId: UnitId,
  levelsGained: number
): {
  state: GameState;
  events: KnownGameEvent[];
} {
  const unit = state.board.units.get(unitId);

  if (!unit) {
    return { state, events: [] };
  }

  const result = levelUpSingleUnit(unit, levelsGained);

  if (!result.success || !result.unit) {
    return { state, events: [] };
  }

  const newBoard = updateUnitInBoard(state.board, result.unit);

  return {
    state: {
      ...state,
      board: newBoard,
    },
    events: result.events,
  };
}
