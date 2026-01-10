/**
 * End Phase Handler
 *
 * End Phase rules from GDD:
 * - If player has more than 6 cards in hand, discard excess to Recharge Pile
 * - Turn passes to opponent
 */

import type { GameState } from '../state/game';
import type { PlayerState, MAX_HAND_SIZE } from '../state/player';
import type { Card } from '../state/cards';
import type { KnownGameEvent } from '../state/events';
import type { PlayerIndex } from '../state/base';
import { createEvent } from '../state/events';

/** Maximum hand size (re-exported from player for convenience) */
export { MAX_HAND_SIZE } from '../state/player';

/**
 * Result of discarding down to hand limit.
 */
export interface DiscardResult {
  /** Updated player state */
  player: PlayerState;
  /** Cards that were discarded */
  discardedCards: Card[];
  /** Events generated */
  events: KnownGameEvent[];
}

/**
 * Discard cards from hand to recharge pile until at hand limit.
 *
 * Note: In a real game, the player would choose which cards to discard.
 * This function takes an array of card indices to discard.
 * If not enough indices are provided, cards from the end of hand are discarded.
 */
export function discardToHandLimit(
  player: PlayerState,
  playerIndex: PlayerIndex,
  cardIndicesToDiscard?: number[]
): DiscardResult {
  const maxHandSize = 6; // MAX_HAND_SIZE
  const excessCards = player.hand.length - maxHandSize;

  if (excessCards <= 0) {
    return {
      player,
      discardedCards: [],
      events: [],
    };
  }

  const events: KnownGameEvent[] = [];
  const discardedCards: Card[] = [];
  let newHand = [...player.hand];
  let newRechargePile = [...player.rechargePile];

  // Determine which cards to discard
  let indicesToRemove: number[];
  if (cardIndicesToDiscard && cardIndicesToDiscard.length >= excessCards) {
    // Use provided indices (sorted descending to remove from end first)
    indicesToRemove = cardIndicesToDiscard.slice(0, excessCards).sort((a, b) => b - a);
  } else {
    // Default: discard from end of hand
    indicesToRemove = [];
    for (let i = 0; i < excessCards; i++) {
      indicesToRemove.push(newHand.length - 1 - i);
    }
  }

  // Remove cards and add to recharge pile
  for (const index of indicesToRemove) {
    if (index >= 0 && index < newHand.length) {
      const card = newHand[index];
      discardedCards.push(card);
      newHand.splice(index, 1);
      newRechargePile.push(card);

      events.push(
        createEvent<KnownGameEvent>('CARD_DISCARDED', {
          player: playerIndex,
          cardId: card.id,
          toZone: 'rechargePile',
        })
      );
    }
  }

  return {
    player: {
      ...player,
      hand: newHand,
      rechargePile: newRechargePile,
    },
    discardedCards,
    events,
  };
}

/**
 * Execute the end phase for a player.
 * This handles the automatic discard and prepares for turn transition.
 *
 * Note: If the player has more than 6 cards, they need to choose which to discard.
 * This function returns a flag indicating if discard is needed.
 */
export function executeEndPhase(
  state: GameState,
  cardIndicesToDiscard?: number[]
): {
  state: GameState;
  events: KnownGameEvent[];
  needsDiscard: boolean;
  cardsToDiscard: number;
} {
  const activePlayer = state.activePlayerIndex;
  const player = state.players[activePlayer];
  const maxHandSize = 6;
  const excessCards = player.hand.length - maxHandSize;

  // Check if player needs to discard
  if (excessCards > 0 && !cardIndicesToDiscard) {
    // Player needs to choose cards to discard
    return {
      state,
      events: [],
      needsDiscard: true,
      cardsToDiscard: excessCards,
    };
  }

  // Discard if needed
  const discardResult = discardToHandLimit(player, activePlayer, cardIndicesToDiscard);

  // Update player state
  const newPlayers = [...state.players] as [PlayerState, PlayerState];
  newPlayers[activePlayer] = discardResult.player;

  return {
    state: {
      ...state,
      players: newPlayers,
    },
    events: discardResult.events,
    needsDiscard: false,
    cardsToDiscard: 0,
  };
}

/**
 * Check if the end phase can complete (no pending discards).
 */
export function canCompleteEndPhase(state: GameState): boolean {
  const activePlayer = state.activePlayerIndex;
  const player = state.players[activePlayer];
  return player.hand.length <= 6;
}

/**
 * Prepare the game state for the next player's turn.
 * This resets turn-specific state and switches the active player.
 */
export function prepareNextTurn(state: GameState): {
  state: GameState;
  events: KnownGameEvent[];
} {
  const events: KnownGameEvent[] = [];
  const currentPlayer = state.activePlayerIndex;
  const nextPlayer = (1 - currentPlayer) as PlayerIndex;

  // Emit turn end event
  events.push(
    createEvent<KnownGameEvent>('TURN_END', {
      turnNumber: state.turn.number,
      player: currentPlayer,
    })
  );

  // Calculate new turn number (increments after player 1's turn)
  const newTurnNumber = nextPlayer === 0 ? state.turn.number + 1 : state.turn.number;

  // Create new turn state
  const newTurn = {
    number: newTurnNumber,
    phase: 'draw' as const,
    turnSummonUsed: false,
    unitActions: new Map(),
    isFirstTurn: false, // First turn is only turn 1 for player 0
  };

  // Emit turn start event for next player
  events.push(
    createEvent<KnownGameEvent>('TURN_START', {
      turnNumber: newTurnNumber,
      activePlayer: nextPlayer,
    })
  );

  return {
    state: {
      ...state,
      activePlayerIndex: nextPlayer,
      turn: newTurn,
    },
    events,
  };
}
