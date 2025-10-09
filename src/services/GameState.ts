import { TurnPhase } from "../types/GameTypes";
import { CardData } from "../Card";
import { SummonUnit } from "../types/SummonUnit";

/**
 * Represents the complete game state.
 * This is the authoritative state managed by the game service.
 */
export interface GameState {
  /** Current turn number */
  turnNumber: number;
  
  /** Current player (0 for Player A, 1 for Player B) */
  currentPlayer: number;
  
  /** Current turn phase */
  currentPhase: TurnPhase;
  
  /** Is this the first turn of the game? */
  isFirstTurn: boolean;
  
  /** Player A's hand */
  playerAHand: CardData[];
  
  /** Player B's hand */
  playerBHand: CardData[];
  
  /** Placed summons (keyed by "row,col") */
  placedSummons: Map<string, SummonUnit>;
  
  /** Main deck card count */
  mainDeckCount: number;
  
  /** Recharge pile card count */
  rechargePileCount: number;
  
  /** Discard pile card count */
  discardPileCount: number;
  
  /** Whether a discard selection is in progress */
  isSelectingDiscard: boolean;
  
  /** Number of cards to discard */
  discardCount: number;
  
  /** Player A's victory points */
  playerAVictoryPoints: number;
  
  /** Player B's victory points */
  playerBVictoryPoints: number;
}

/**
 * Represents a response from the game service after processing an action.
 */
export interface GameStateResponse {
  /** Updated game state */
  state: GameState;
  
  /** Whether the action was successful */
  success: boolean;
  
  /** Optional message (e.g., error message or notification) */
  message?: string;
  
  /** Cards drawn (if any) */
  cardsDrawn?: CardData[];
}
