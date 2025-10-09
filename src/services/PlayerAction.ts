import { CardData } from "../Card";
import { GridPosition } from "../types/GameTypes";

/**
 * Base interface for all player actions.
 * Uses the Command pattern to encapsulate player input.
 */
export interface PlayerAction {
  /** Type discriminator for action type */
  type: string;
  
  /** Player who is performing the action */
  playerId: number;
}

/**
 * Action to advance to the next phase
 */
export interface NextPhaseAction extends PlayerAction {
  type: "NEXT_PHASE";
}

/**
 * Action to play a card from hand
 */
export interface PlayCardAction extends PlayerAction {
  type: "PLAY_CARD";
  cardData: CardData;
  targetPosition?: GridPosition; // For summon cards
}

/**
 * Action to move a summon
 */
export interface MoveSummonAction extends PlayerAction {
  type: "MOVE_SUMMON";
  fromPosition: GridPosition;
  toPosition: GridPosition;
}

/**
 * Action to attack with a summon
 */
export interface AttackAction extends PlayerAction {
  type: "ATTACK";
  attackerPosition: GridPosition;
  targetPosition: GridPosition;
}

/**
 * Action to discard cards during end phase
 */
export interface DiscardCardsAction extends PlayerAction {
  type: "DISCARD_CARDS";
  cards: CardData[];
}

/**
 * Action to manually draw a card (during action phase)
 */
export interface DrawCardAction extends PlayerAction {
  type: "DRAW_CARD";
}

/**
 * Union type of all possible player actions
 */
export type AnyPlayerAction = 
  | NextPhaseAction
  | PlayCardAction
  | MoveSummonAction
  | AttackAction
  | DiscardCardsAction
  | DrawCardAction;
