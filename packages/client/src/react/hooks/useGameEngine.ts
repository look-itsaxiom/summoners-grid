/**
 * useGameEngine - React hook for managing game state and engine interaction.
 *
 * Provides a clean interface for React components to:
 * - Access current game state
 * - Dispatch actions to the game engine
 * - Subscribe to game events
 * - Track game status (ready, game over, etc.)
 */
import { useState, useCallback, useMemo } from 'react';
import type {
  GameState,
  GameAction,
  GameEngine,
  GameEvent,
  DispatchResult,
  EntityId,
  TurnPhase,
  PlayerIndex,
} from '@summoners-grid/engine';

/**
 * Options for the useGameEngine hook.
 */
export interface UseGameEngineOptions {
  /** Initial game state (optional - hook returns isReady=false until set) */
  initialState?: GameState;
  /** Game engine implementation */
  engine: GameEngine;
  /** Called when state changes */
  onStateChange?: (state: GameState, events: GameEvent[]) => void;
  /** Called for each game event */
  onEvent?: (event: GameEvent) => void;
  /** Called when an error occurs */
  onError?: (error: Error) => void;
}

/**
 * Return value of the useGameEngine hook.
 */
export interface UseGameEngineResult {
  /** Current game state (null if not initialized) */
  state: GameState | null;
  /** Whether the game is ready to play */
  isReady: boolean;
  /** Dispatch an action to the engine */
  dispatch: (action: GameAction) => DispatchResult | null;
  /** Accumulated events from dispatch results */
  events: GameEvent[];
  /** Clear accumulated events */
  clearEvents: () => void;
  /** Active player index */
  activePlayerIndex: PlayerIndex;
  /** Current turn phase */
  currentPhase: TurnPhase;
  /** Winner (if game ended) */
  winner: PlayerIndex | null;
  /** Whether the game has ended */
  isGameOver: boolean;
  /** Get selectable entities from engine */
  getSelectableEntities: () => EntityId[];
}

/**
 * Hook for managing game state and engine interaction.
 */
export function useGameEngine(options: UseGameEngineOptions): UseGameEngineResult {
  const { initialState, engine, onStateChange, onEvent, onError } = options;

  // Game state
  const [state, setState] = useState<GameState | null>(initialState ?? null);

  // Accumulated events
  const [events, setEvents] = useState<GameEvent[]>([]);

  // Dispatch action to engine
  const dispatch = useCallback(
    (action: GameAction): DispatchResult | null => {
      if (!state || !engine) {
        return null;
      }

      try {
        const result = engine.dispatch(state, action);

        if (result.valid) {
          setState(result.state);

          // Accumulate events
          if (result.events.length > 0) {
            setEvents((prev) => [...prev, ...result.events]);

            // Call event callbacks
            result.events.forEach((event) => {
              onEvent?.(event);
            });
          }

          // Call state change callback
          onStateChange?.(result.state, result.events);
        }

        return result;
      } catch (error) {
        onError?.(error instanceof Error ? error : new Error(String(error)));
        return null;
      }
    },
    [state, engine, onStateChange, onEvent, onError]
  );

  // Clear events
  const clearEvents = useCallback(() => {
    setEvents([]);
  }, []);

  // Get selectable entities
  const getSelectableEntities = useCallback((): EntityId[] => {
    if (!state || !engine) {
      return [];
    }
    return engine.getSelectableEntities(state);
  }, [state, engine]);

  // Derived values
  const isReady = state !== null;
  const activePlayerIndex = state?.activePlayerIndex ?? 0;
  const currentPhase = state?.turn.phase ?? 'draw';
  const winner = state?.winner ?? null;
  const isGameOver = state?.gamePhase === 'ended';

  return {
    state,
    isReady,
    dispatch,
    events,
    clearEvents,
    activePlayerIndex,
    currentPhase,
    winner,
    isGameOver,
    getSelectableEntities,
  };
}
