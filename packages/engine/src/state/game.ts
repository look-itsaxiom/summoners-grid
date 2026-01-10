/**
 * Core game state and action types
 */

import type { EntityId, PlayerIndex } from './base';
import type { EffectStack, Selection, SelectionPrompt } from './effects';
import type { PlayerState } from './player';
import type { TurnState } from './turn';
import type { Board } from './units';

/**
 * Complete game state.
 * This is the authoritative source of truth for all game logic.
 */
export interface GameState {
  /** The game board with all entities */
  board: Board;
  /** Both players' states */
  players: [PlayerState, PlayerState];
  /** Index of the currently active player */
  activePlayerIndex: PlayerIndex;
  /** Current turn state */
  turn: TurnState;
  /** Effect resolution stack */
  stack: EffectStack;
  /** Winner (null if game in progress) */
  winner: PlayerIndex | null;
  /** Game phase */
  gamePhase: 'setup' | 'playing' | 'ended';
  /** Pending selection prompt (if any) */
  pendingPrompt: PendingPrompt | null;
  /** Random seed for reproducibility */
  seed: number;
}

/**
 * Pending selection prompt waiting for player input.
 */
export interface PendingPrompt {
  /** Player who must respond */
  playerId: PlayerIndex;
  /** What kind of selection is needed */
  prompt: SelectionPrompt;
  /** Context for this prompt */
  context: {
    sourceEntityId?: EntityId;
    forEffect?: string;
  };
}

/**
 * Player action types.
 * Minimal action set - context determines meaning.
 */
export type GameAction =
  | { type: 'SELECT'; entityId: EntityId; selections?: Selection[] }
  | { type: 'PASS_PRIORITY' }
  | { type: 'CONCEDE' };

/**
 * Result of dispatching an action.
 */
export interface DispatchResult {
  /** Updated game state */
  state: GameState;
  /** Events generated for animation/logging */
  events: GameEvent[];
  /** Was the action valid? */
  valid: boolean;
  /** Error message if invalid */
  error?: string;
}

/**
 * Game event for animation and logging.
 * Flexible structure - Phaser has animator registry.
 */
export interface GameEvent {
  type: string;
  params: Record<string, unknown>;
}

/**
 * Engine interface for game logic.
 */
export interface GameEngine {
  /**
   * Dispatch an action and get new state.
   */
  dispatch(state: GameState, action: GameAction): DispatchResult;

  /**
   * Get entities that the current player can select.
   */
  getSelectableEntities(state: GameState): EntityId[];

  /**
   * Get required selections for an entity.
   */
  getRequiredSelections(state: GameState, entityId: EntityId): SelectionPrompt[];

  /**
   * Get all legal actions from current state.
   */
  getLegalActions(state: GameState): GameAction[];
}

/** Victory point thresholds */
export const VP_TO_WIN = 3;
export const VP_FOR_TIER_1_DEFEAT = 1;
export const VP_FOR_TIER_2_PLUS_DEFEAT = 2;
