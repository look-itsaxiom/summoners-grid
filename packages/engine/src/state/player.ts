/**
 * Player state and zone types
 */

import type { EntityId, UnitId } from './base';
import type { Card } from './cards';

/**
 * Card in the In Play zone.
 */
export interface InPlayCard {
  /** Instance ID for this in-play card */
  id: EntityId;
  /** The card definition */
  card: Card;
  /** Is this card face-down? (counters, traps) */
  faceDown: boolean;
  /** Linked entity on board (unit or building) */
  linkedEntityId?: EntityId;
}

/**
 * Player state including all zones.
 */
export interface PlayerState {
  /** Victory points accumulated */
  victoryPoints: number;

  // Card zones
  /** Cards in hand (6 card limit at turn end) */
  hand: Card[];
  /** Main deck - primary draw source */
  mainDeck: Card[];
  /** Advance deck - role/named summon cards */
  advanceDeck: Card[];
  /** Discard pile - counter, building, quest cards go here */
  discardPile: Card[];
  /** Recharge pile - action, reaction cards; shuffles into main deck when empty */
  rechargePile: Card[];
  /** Removed from play - defeated summons; rarely interacted with */
  removedFromPlay: Card[];

  /** Cards currently in play */
  inPlay: InPlayCard[];

  /**
   * Summon slots for this player's team.
   * Index corresponds to which slot (0, 1, 2 for 3v3).
   * Each slot tracks the summon card, role card, and equipment.
   */
  summonSlots: SummonSlot[];
}

/**
 * A summon slot in the player's deck.
 * Represents one of the 3 summon positions.
 */
export interface SummonSlot {
  /** The summon card for this slot */
  summonCard: Card;
  /** The role card for this slot */
  roleCard: Card;
  /** Equipment cards for this slot */
  equipment: {
    weapon: Card | null;
    offhand: Card | null;
    armor: Card | null;
    accessory: Card | null;
  };
  /** Has this summon been played this game? */
  played: boolean;
  /** Unit ID if currently on board */
  unitId: UnitId | null;
}

/** Maximum hand size at end of turn */
export const MAX_HAND_SIZE = 6;

/** Number of cards drawn when playing a summon */
export const SUMMON_DRAW_COUNT = 3;

/**
 * Create initial player state for a new game.
 */
export function createInitialPlayerState(
  mainDeck: Card[],
  advanceDeck: Card[],
  summonSlots: SummonSlot[]
): PlayerState {
  return {
    victoryPoints: 0,
    hand: [],
    mainDeck: [...mainDeck],
    advanceDeck: [...advanceDeck],
    discardPile: [],
    rechargePile: [],
    removedFromPlay: [],
    inPlay: [],
    summonSlots,
  };
}
