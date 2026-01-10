/**
 * Action Context System
 *
 * Determines what actions are available based on current game state.
 * Context-based interpretation means the same SELECT action can:
 * - Play a card from hand
 * - Select a unit to move
 * - Choose a target for an effect
 * - Respond to an opponent's action
 *
 * The context (state + pending prompts) determines meaning.
 */

import type { GameState } from '../state/game';
import type { PlayerIndex, EntityId, Speed } from '../state/base';
import type { TurnPhase } from '../state/turn';
import { isStackEmpty, canPlaySpeed } from '../resolution/stack';

/**
 * The current action context type.
 * Determines what kinds of selections are valid.
 */
export type ActionContextType =
  | 'awaiting_prompt_response'  // Player must respond to a prompt
  | 'awaiting_stack_response'   // Player can respond to stack or pass
  | 'action_phase_main'         // Main action phase - can play cards, move, attack
  | 'end_phase_discard'         // Must discard cards to hand limit
  | 'non_interactive'           // Draw/Level phases - no player input
  | 'game_over';                // Game has ended

/**
 * Context information for the current player's action.
 */
export interface ActionContext {
  /** Type of context */
  type: ActionContextType;
  /** Which player has input */
  inputPlayer: PlayerIndex;
  /** Current turn phase */
  phase: TurnPhase;
  /** Is the stack empty? */
  stackEmpty: boolean;
  /** Current speed lock */
  speedLock: Speed;
  /** Can pass priority? */
  canPass: boolean;
  /** Description of what's expected */
  description: string;
}

/**
 * Determine the current action context.
 */
export function getActionContext(state: GameState): ActionContext {
  const { turn, stack, activePlayerIndex, gamePhase, pendingPrompt } = state;

  // Game over - no actions possible
  if (gamePhase === 'ended' || state.winner !== null) {
    return {
      type: 'game_over',
      inputPlayer: activePlayerIndex,
      phase: turn.phase,
      stackEmpty: isStackEmpty(stack),
      speedLock: stack.speedLock,
      canPass: false,
      description: 'Game has ended',
    };
  }

  // Setup phase - no actions yet
  if (gamePhase === 'setup') {
    return {
      type: 'non_interactive',
      inputPlayer: activePlayerIndex,
      phase: turn.phase,
      stackEmpty: true,
      speedLock: 'action',
      canPass: false,
      description: 'Game is setting up',
    };
  }

  // Pending prompt - must respond to selection prompt
  if (pendingPrompt) {
    return {
      type: 'awaiting_prompt_response',
      inputPlayer: pendingPrompt.playerId,
      phase: turn.phase,
      stackEmpty: isStackEmpty(stack),
      speedLock: stack.speedLock,
      canPass: pendingPrompt.prompt.optional ?? false,
      description: `Select ${pendingPrompt.prompt.type}: ${pendingPrompt.prompt.id}`,
    };
  }

  // Stack has entries - awaiting responses
  if (!isStackEmpty(stack)) {
    const priorityPlayer = stack.priorityPlayer;
    return {
      type: 'awaiting_stack_response',
      inputPlayer: priorityPlayer,
      phase: turn.phase,
      stackEmpty: false,
      speedLock: stack.speedLock,
      canPass: true,
      description: `Respond to stack or pass priority`,
    };
  }

  // Phase-specific contexts
  switch (turn.phase) {
    case 'draw':
    case 'level':
      // These phases are automatic
      return {
        type: 'non_interactive',
        inputPlayer: activePlayerIndex,
        phase: turn.phase,
        stackEmpty: true,
        speedLock: 'action',
        canPass: false,
        description: `${turn.phase} phase (automatic)`,
      };

    case 'action':
      return {
        type: 'action_phase_main',
        inputPlayer: activePlayerIndex,
        phase: 'action',
        stackEmpty: true,
        speedLock: 'action',
        canPass: true, // Can pass to end action phase
        description: 'Take actions or pass to end phase',
      };

    case 'end':
      // Check if discard is needed
      const player = state.players[activePlayerIndex];
      if (player.hand.length > 6) {
        return {
          type: 'end_phase_discard',
          inputPlayer: activePlayerIndex,
          phase: 'end',
          stackEmpty: true,
          speedLock: 'action',
          canPass: false,
          description: `Discard ${player.hand.length - 6} card(s) to reach hand limit`,
        };
      }
      return {
        type: 'non_interactive',
        inputPlayer: activePlayerIndex,
        phase: 'end',
        stackEmpty: true,
        speedLock: 'action',
        canPass: false,
        description: 'End phase complete',
      };
  }
}

/**
 * Check if a player can take any action right now.
 */
export function canPlayerAct(state: GameState, player: PlayerIndex): boolean {
  const context = getActionContext(state);

  // Non-interactive contexts don't accept player input
  if (context.type === 'non_interactive' || context.type === 'game_over') {
    return false;
  }

  // Only the input player can act
  return context.inputPlayer === player;
}

/**
 * Check if a player can play a card at a given speed.
 */
export function canPlayCardAtSpeed(
  state: GameState,
  player: PlayerIndex,
  cardSpeed: Speed
): boolean {
  const context = getActionContext(state);

  // Must be the input player
  if (context.inputPlayer !== player) {
    return false;
  }

  // Check context allows card plays
  switch (context.type) {
    case 'action_phase_main':
      // Can play action speed cards during main action phase
      // Reactions can also be played from hand
      return cardSpeed === 'action' || cardSpeed === 'reaction';

    case 'awaiting_stack_response':
      // Can only respond with cards at or above speed lock
      return canPlaySpeed(context.speedLock, cardSpeed);

    default:
      return false;
  }
}

/**
 * Get what kind of selection is expected in the current context.
 */
export type ExpectedSelectionType =
  | 'card_from_hand'
  | 'unit_on_board'
  | 'target_for_effect'
  | 'position_on_board'
  | 'card_to_discard'
  | 'choice'
  | 'any';

export function getExpectedSelectionType(state: GameState): ExpectedSelectionType {
  const context = getActionContext(state);

  if (context.type === 'awaiting_prompt_response' && state.pendingPrompt) {
    switch (state.pendingPrompt.prompt.type) {
      case 'unit':
        return 'target_for_effect';
      case 'position':
        return 'position_on_board';
      case 'card':
        return 'card_from_hand';
      case 'choice':
        return 'choice';
      default:
        return 'any';
    }
  }

  if (context.type === 'end_phase_discard') {
    return 'card_to_discard';
  }

  if (context.type === 'action_phase_main') {
    return 'any'; // Can select cards or units
  }

  if (context.type === 'awaiting_stack_response') {
    return 'any'; // Can select response cards
  }

  return 'any';
}
