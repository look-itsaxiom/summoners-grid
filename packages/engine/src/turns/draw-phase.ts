/**
 * Draw Phase Handler
 *
 * Draw Phase rules from GDD:
 * - Draw 1 card from Main Deck (skipped on first turn of game)
 * - If Main Deck is empty, shuffle Recharge Pile to form new Main Deck
 * - If both Main Deck and Recharge Pile are empty, draw attempt fails
 */

import type { GameState } from '../state/game';
import type { PlayerState } from '../state/player';
import type { Card } from '../state/cards';
import type { KnownGameEvent } from '../state/events';
import type { PlayerIndex } from '../state/base';
import { createEvent } from '../state/events';

/**
 * Result of a draw attempt.
 */
export interface DrawResult {
  /** Updated player state */
  player: PlayerState;
  /** Card drawn (null if draw failed) */
  drawnCard: Card | null;
  /** Events generated */
  events: KnownGameEvent[];
  /** Was the draw successful? */
  success: boolean;
  /** Did we shuffle the recharge pile? */
  shuffledRecharge: boolean;
}

/**
 * Shuffle an array using Fisher-Yates algorithm.
 * Uses a seeded random function for reproducibility.
 */
export function shuffleArray<T>(array: T[], random: () => number): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

/**
 * Attempt to draw a card for a player.
 * Handles empty deck by shuffling recharge pile.
 */
export function drawCard(
  player: PlayerState,
  playerIndex: PlayerIndex,
  random: () => number
): DrawResult {
  let updatedPlayer = player;
  let shuffledRecharge = false;
  const events: KnownGameEvent[] = [];

  // If main deck is empty, shuffle recharge pile into it
  if (updatedPlayer.mainDeck.length === 0) {
    if (updatedPlayer.rechargePile.length === 0) {
      // Both empty - draw fails
      return {
        player: updatedPlayer,
        drawnCard: null,
        events: [],
        success: false,
        shuffledRecharge: false,
      };
    }

    // Shuffle recharge pile into main deck
    const shuffledDeck = shuffleArray(updatedPlayer.rechargePile, random);
    updatedPlayer = {
      ...updatedPlayer,
      mainDeck: shuffledDeck,
      rechargePile: [],
    };
    shuffledRecharge = true;
  }

  // Draw from top of deck
  const drawnCard = updatedPlayer.mainDeck[0];
  const remainingDeck = updatedPlayer.mainDeck.slice(1);

  updatedPlayer = {
    ...updatedPlayer,
    mainDeck: remainingDeck,
    hand: [...updatedPlayer.hand, drawnCard],
  };

  events.push(
    createEvent<KnownGameEvent>('CARD_DRAWN', {
      player: playerIndex,
      cardId: drawnCard.id,
      fromZone: shuffledRecharge ? 'recharge' : 'mainDeck',
    })
  );

  return {
    player: updatedPlayer,
    drawnCard,
    events,
    success: true,
    shuffledRecharge,
  };
}

/**
 * Draw multiple cards (e.g., when playing a summon).
 */
export function drawMultipleCards(
  player: PlayerState,
  playerIndex: PlayerIndex,
  count: number,
  random: () => number
): {
  player: PlayerState;
  drawnCards: Card[];
  events: KnownGameEvent[];
  drawsFailed: number;
} {
  let currentPlayer = player;
  const drawnCards: Card[] = [];
  const allEvents: KnownGameEvent[] = [];
  let drawsFailed = 0;

  for (let i = 0; i < count; i++) {
    const result = drawCard(currentPlayer, playerIndex, random);
    currentPlayer = result.player;
    allEvents.push(...result.events);

    if (result.success && result.drawnCard) {
      drawnCards.push(result.drawnCard);
    } else {
      drawsFailed++;
    }
  }

  return {
    player: currentPlayer,
    drawnCards,
    events: allEvents,
    drawsFailed,
  };
}

/**
 * Execute the draw phase for a player.
 */
export function executeDrawPhase(
  state: GameState,
  random: () => number
): {
  state: GameState;
  events: KnownGameEvent[];
} {
  const events: KnownGameEvent[] = [];
  const activePlayer = state.activePlayerIndex;

  // Skip draw on first turn
  if (state.turn.isFirstTurn) {
    return { state, events };
  }

  // Draw 1 card
  const result = drawCard(
    state.players[activePlayer],
    activePlayer,
    random
  );

  // Update player state
  const newPlayers = [...state.players] as [PlayerState, PlayerState];
  newPlayers[activePlayer] = result.player;

  return {
    state: {
      ...state,
      players: newPlayers,
    },
    events: [...events, ...result.events],
  };
}
