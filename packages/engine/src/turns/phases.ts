/**
 * Phase Transition System
 *
 * Manages the flow between turn phases:
 * Draw -> Level -> Action -> End -> (next player's) Draw -> ...
 *
 * Each phase has:
 * - Entry logic (what happens when entering the phase)
 * - Exit conditions (when can we leave this phase)
 * - Transition logic (what happens when leaving)
 */

import type { GameState } from '../state/game';
import type { TurnPhase, TurnState } from '../state/turn';
import type { KnownGameEvent } from '../state/events';
import { PHASE_ORDER } from '../state/turn';
import { createEvent } from '../state/events';
import { createSeededRandom } from '../resolution/stack';
import { executeDrawPhase } from './draw-phase';
import { executeLevelPhase } from './level-phase';
import { initializeUnitActions } from './action-phase';
import { executeEndPhase, prepareNextTurn, canCompleteEndPhase } from './end-phase';

/**
 * Result of a phase transition.
 */
export interface PhaseTransitionResult {
  /** Updated game state */
  state: GameState;
  /** Events generated during transition */
  events: KnownGameEvent[];
  /** Was the transition successful? */
  success: boolean;
  /** Error message if transition failed */
  error?: string;
  /** Does the phase require player input before continuing? */
  needsInput: boolean;
  /** Description of input needed (if any) */
  inputNeeded?: string;
}

/**
 * Get the next phase in the sequence.
 */
export function getNextPhase(currentPhase: TurnPhase): TurnPhase | null {
  const currentIndex = PHASE_ORDER.indexOf(currentPhase);
  if (currentIndex === -1 || currentIndex >= PHASE_ORDER.length - 1) {
    return null; // End of turn
  }
  return PHASE_ORDER[currentIndex + 1];
}

/**
 * Check if we can advance from the current phase.
 */
export function canAdvancePhase(state: GameState): {
  canAdvance: boolean;
  reason?: string;
} {
  const { phase } = state.turn;

  switch (phase) {
    case 'draw':
      // Draw phase can always advance (draw happens automatically)
      return { canAdvance: true };

    case 'level':
      // Level phase can always advance (level up happens automatically)
      return { canAdvance: true };

    case 'action':
      // Action phase advances when player chooses to end it
      // (or when stack is empty and they pass priority)
      if (state.stack.entries.length > 0) {
        return {
          canAdvance: false,
          reason: 'Stack must be empty to end action phase',
        };
      }
      return { canAdvance: true };

    case 'end':
      // End phase advances when hand is at limit
      if (!canCompleteEndPhase(state)) {
        return {
          canAdvance: false,
          reason: 'Must discard down to hand limit',
        };
      }
      return { canAdvance: true };

    default:
      return { canAdvance: false, reason: 'Unknown phase' };
  }
}

/**
 * Enter a specific phase, executing its entry logic.
 */
export function enterPhase(
  state: GameState,
  phase: TurnPhase
): PhaseTransitionResult {
  const events: KnownGameEvent[] = [];
  let currentState = state;

  // Emit phase change event
  events.push(
    createEvent<KnownGameEvent>('PHASE_CHANGE', {
      phase,
      player: state.activePlayerIndex,
    })
  );

  // Update turn phase
  currentState = {
    ...currentState,
    turn: {
      ...currentState.turn,
      phase,
    },
  };

  // Execute phase-specific entry logic
  switch (phase) {
    case 'draw': {
      const random = createSeededRandom(currentState.seed);
      const drawResult = executeDrawPhase(currentState, random);
      currentState = drawResult.state;
      events.push(...drawResult.events);
      break;
    }

    case 'level': {
      const levelResult = executeLevelPhase(currentState);
      currentState = levelResult.state;
      events.push(...levelResult.events);
      break;
    }

    case 'action': {
      // Initialize unit action tracking
      const newTurn = initializeUnitActions(
        currentState.turn,
        currentState.board,
        currentState.activePlayerIndex
      );
      currentState = {
        ...currentState,
        turn: newTurn,
      };
      break;
    }

    case 'end': {
      // End phase entry - check if discard is needed
      const endResult = executeEndPhase(currentState);
      currentState = endResult.state;
      events.push(...endResult.events);

      if (endResult.needsDiscard) {
        return {
          state: currentState,
          events,
          success: true,
          needsInput: true,
          inputNeeded: `Discard ${endResult.cardsToDiscard} card(s) to reach hand limit`,
        };
      }
      break;
    }
  }

  return {
    state: currentState,
    events,
    success: true,
    needsInput: false,
  };
}

/**
 * Advance to the next phase.
 * Handles automatic phase execution for non-interactive phases.
 */
export function advancePhase(state: GameState): PhaseTransitionResult {
  const { canAdvance, reason } = canAdvancePhase(state);

  if (!canAdvance) {
    return {
      state,
      events: [],
      success: false,
      error: reason,
      needsInput: false,
    };
  }

  const nextPhase = getNextPhase(state.turn.phase);

  if (nextPhase === null) {
    // End of turn - transition to next player
    const { state: newState, events } = prepareNextTurn(state);

    // Automatically enter draw phase for next player
    const drawResult = enterPhase(newState, 'draw');

    return {
      state: drawResult.state,
      events: [...events, ...drawResult.events],
      success: true,
      needsInput: drawResult.needsInput,
      inputNeeded: drawResult.inputNeeded,
    };
  }

  // Enter the next phase
  return enterPhase(state, nextPhase);
}

/**
 * Execute automatic phase transitions until player input is needed.
 * Draw and Level phases are automatic; Action phase waits for player.
 */
export function runAutomaticPhases(state: GameState): PhaseTransitionResult {
  let currentState = state;
  const allEvents: KnownGameEvent[] = [];

  // Keep advancing through automatic phases
  while (true) {
    const { phase } = currentState.turn;

    // Action phase is not automatic - player must take actions or pass
    if (phase === 'action') {
      return {
        state: currentState,
        events: allEvents,
        success: true,
        needsInput: true,
        inputNeeded: 'Action phase - take actions or pass to end phase',
      };
    }

    // Try to advance to next phase
    const { canAdvance } = canAdvancePhase(currentState);

    if (!canAdvance) {
      // Can't advance - need input (likely end phase discard)
      return {
        state: currentState,
        events: allEvents,
        success: true,
        needsInput: true,
        inputNeeded: 'Player input required',
      };
    }

    const result = advancePhase(currentState);

    if (!result.success) {
      return {
        state: currentState,
        events: allEvents,
        success: false,
        error: result.error,
        needsInput: false,
      };
    }

    currentState = result.state;
    allEvents.push(...result.events);

    if (result.needsInput) {
      return {
        state: currentState,
        events: allEvents,
        success: true,
        needsInput: true,
        inputNeeded: result.inputNeeded,
      };
    }
  }
}

/**
 * Start a new game by entering the first phase.
 */
export function startGame(state: GameState): PhaseTransitionResult {
  const events: KnownGameEvent[] = [];

  // Emit turn start event
  events.push(
    createEvent<KnownGameEvent>('TURN_START', {
      turnNumber: 1,
      activePlayer: state.activePlayerIndex,
    })
  );

  // Enter draw phase (will skip drawing on first turn)
  const drawResult = enterPhase(state, 'draw');

  return {
    state: drawResult.state,
    events: [...events, ...drawResult.events],
    success: drawResult.success,
    needsInput: drawResult.needsInput,
    inputNeeded: drawResult.inputNeeded,
  };
}
