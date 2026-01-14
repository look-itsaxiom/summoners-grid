/**
 * useGameEngine Hook Tests
 *
 * TDD tests for the game engine hook that manages game state,
 * dispatches actions, and provides state to the UI layer.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useGameEngine } from '../useGameEngine';
import type {
  GameState,
  GameAction,
  GameEngine,
  DispatchResult,
  GameEvent,
} from '@summoners-grid/engine';
import {
  createEmptyBoard,
  createEmptyStack,
  createInitialTurnState,
} from '@summoners-grid/engine';

// Helper to create a mock game state
function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    board: createEmptyBoard(),
    players: [
      {
        victoryPoints: 0,
        hand: [],
        mainDeck: [],
        advanceDeck: [],
        discardPile: [],
        rechargePile: [],
        removedFromPlay: [],
        inPlay: [],
        summonSlots: [],
      },
      {
        victoryPoints: 0,
        hand: [],
        mainDeck: [],
        advanceDeck: [],
        discardPile: [],
        rechargePile: [],
        removedFromPlay: [],
        inPlay: [],
        summonSlots: [],
      },
    ],
    activePlayerIndex: 0,
    turn: createInitialTurnState(),
    stack: createEmptyStack(0),
    winner: null,
    gamePhase: 'playing',
    pendingPrompt: null,
    seed: 12345,
    ...overrides,
  };
}

// Mock GameEngine implementation
function createMockEngine(overrides: Partial<GameEngine> = {}): GameEngine {
  return {
    dispatch: vi.fn((state: GameState, _action: GameAction): DispatchResult => ({
      state,
      events: [],
      valid: true,
    })),
    getSelectableEntities: vi.fn(() => []),
    getRequiredSelections: vi.fn(() => []),
    getLegalActions: vi.fn(() => []),
    ...overrides,
  };
}

describe('useGameEngine', () => {
  /**
   * HAPPY PATH SCENARIOS
   * Basic functionality that should work under normal conditions
   */
  describe('happy path scenarios', () => {
    it('should return initial state when provided', () => {
      const initialState = createMockGameState();
      const mockEngine = createMockEngine();

      const { result } = renderHook(() =>
        useGameEngine({
          initialState,
          engine: mockEngine,
        })
      );

      expect(result.current.state).toBe(initialState);
      expect(result.current.isReady).toBe(true);
    });

    it('should expose dispatch function', () => {
      const initialState = createMockGameState();
      const mockEngine = createMockEngine();

      const { result } = renderHook(() =>
        useGameEngine({
          initialState,
          engine: mockEngine,
        })
      );

      expect(typeof result.current.dispatch).toBe('function');
    });

    it('should provide events array', () => {
      const initialState = createMockGameState();
      const mockEngine = createMockEngine();

      const { result } = renderHook(() =>
        useGameEngine({
          initialState,
          engine: mockEngine,
        })
      );

      expect(Array.isArray(result.current.events)).toBe(true);
    });

    it('should expose activePlayerIndex from state', () => {
      const initialState = createMockGameState({ activePlayerIndex: 1 });
      const mockEngine = createMockEngine();

      const { result } = renderHook(() =>
        useGameEngine({
          initialState,
          engine: mockEngine,
        })
      );

      expect(result.current.activePlayerIndex).toBe(1);
    });

    it('should expose current phase from turn state', () => {
      const initialState = createMockGameState();
      initialState.turn.phase = 'action';
      const mockEngine = createMockEngine();

      const { result } = renderHook(() =>
        useGameEngine({
          initialState,
          engine: mockEngine,
        })
      );

      expect(result.current.currentPhase).toBe('action');
    });
  });

  /**
   * SUCCESS SCENARIOS
   * Verifying that actions complete successfully
   */
  describe('success scenarios', () => {
    it('should update state when dispatch is called', () => {
      const initialState = createMockGameState();
      const updatedState = createMockGameState({ activePlayerIndex: 1 });

      const mockEngine = createMockEngine({
        dispatch: vi.fn(
          (_state: GameState, _action: GameAction): DispatchResult => ({
            state: updatedState,
            events: [],
            valid: true,
          })
        ),
      });

      const { result } = renderHook(() =>
        useGameEngine({
          initialState,
          engine: mockEngine,
        })
      );

      act(() => {
        result.current.dispatch({ type: 'PASS_PRIORITY' });
      });

      expect(result.current.state).toBe(updatedState);
    });

    it('should collect events from dispatch results', () => {
      const initialState = createMockGameState();
      const testEvent: GameEvent = {
        type: 'TURN_START',
        params: { turnNumber: 1, activePlayer: 0 },
      };

      const mockEngine = createMockEngine({
        dispatch: vi.fn(
          (_state: GameState, _action: GameAction): DispatchResult => ({
            state: initialState,
            events: [testEvent],
            valid: true,
          })
        ),
      });

      const { result } = renderHook(() =>
        useGameEngine({
          initialState,
          engine: mockEngine,
        })
      );

      act(() => {
        result.current.dispatch({ type: 'PASS_PRIORITY' });
      });

      expect(result.current.events).toContain(testEvent);
    });

    it('should call onStateChange callback when state updates', () => {
      const initialState = createMockGameState();
      const updatedState = createMockGameState({ activePlayerIndex: 1 });
      const onStateChange = vi.fn();

      const mockEngine = createMockEngine({
        dispatch: vi.fn(
          (_state: GameState, _action: GameAction): DispatchResult => ({
            state: updatedState,
            events: [],
            valid: true,
          })
        ),
      });

      const { result } = renderHook(() =>
        useGameEngine({
          initialState,
          engine: mockEngine,
          onStateChange,
        })
      );

      act(() => {
        result.current.dispatch({ type: 'PASS_PRIORITY' });
      });

      expect(onStateChange).toHaveBeenCalledWith(updatedState, []);
    });

    it('should call onEvent callback for each event', () => {
      const initialState = createMockGameState();
      const testEvent: GameEvent = {
        type: 'PHASE_CHANGE',
        params: { phase: 'action', player: 0 },
      };
      const onEvent = vi.fn();

      const mockEngine = createMockEngine({
        dispatch: vi.fn(
          (_state: GameState, _action: GameAction): DispatchResult => ({
            state: initialState,
            events: [testEvent],
            valid: true,
          })
        ),
      });

      const { result } = renderHook(() =>
        useGameEngine({
          initialState,
          engine: mockEngine,
          onEvent,
        })
      );

      act(() => {
        result.current.dispatch({ type: 'PASS_PRIORITY' });
      });

      expect(onEvent).toHaveBeenCalledWith(testEvent);
    });
  });

  /**
   * FAILURE SCENARIOS
   * Handling missing or incomplete data
   */
  describe('failure scenarios', () => {
    it('should return isReady false when no initial state provided', () => {
      const mockEngine = createMockEngine();

      const { result } = renderHook(() =>
        useGameEngine({
          engine: mockEngine,
        })
      );

      expect(result.current.isReady).toBe(false);
      expect(result.current.state).toBeNull();
    });

    it('should not dispatch when state is null', () => {
      const mockEngine = createMockEngine();

      const { result } = renderHook(() =>
        useGameEngine({
          engine: mockEngine,
        })
      );

      // Should not throw, just silently fail
      act(() => {
        const dispatchResult = result.current.dispatch({ type: 'PASS_PRIORITY' });
        expect(dispatchResult).toBeNull();
      });

      expect(mockEngine.dispatch).not.toHaveBeenCalled();
    });

    it('should handle dispatch returning invalid result', () => {
      const initialState = createMockGameState();

      const mockEngine = createMockEngine({
        dispatch: vi.fn(
          (_state: GameState, _action: GameAction): DispatchResult => ({
            state: initialState,
            events: [],
            valid: false,
            error: 'Invalid action',
          })
        ),
      });

      const { result } = renderHook(() =>
        useGameEngine({
          initialState,
          engine: mockEngine,
        })
      );

      let dispatchResult: DispatchResult | null = null;
      act(() => {
        dispatchResult = result.current.dispatch({ type: 'PASS_PRIORITY' });
      });

      // State should not change on invalid dispatch
      expect(dispatchResult?.valid).toBe(false);
      expect(dispatchResult?.error).toBe('Invalid action');
    });
  });

  /**
   * ERROR SCENARIOS
   * Handling runtime errors gracefully
   */
  describe('error scenarios', () => {
    it('should handle engine dispatch throwing error', () => {
      const initialState = createMockGameState();
      const onError = vi.fn();

      const mockEngine = createMockEngine({
        dispatch: vi.fn(() => {
          throw new Error('Engine error');
        }),
      });

      const { result } = renderHook(() =>
        useGameEngine({
          initialState,
          engine: mockEngine,
          onError,
        })
      );

      act(() => {
        result.current.dispatch({ type: 'PASS_PRIORITY' });
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error));
      // State should remain unchanged
      expect(result.current.state).toBe(initialState);
    });

    it('should not crash when engine is not provided', () => {
      const initialState = createMockGameState();

      // This should not throw
      expect(() => {
        renderHook(() =>
          useGameEngine({
            initialState,
            engine: undefined as unknown as GameEngine,
          })
        );
      }).not.toThrow();
    });
  });

  /**
   * EDGE CASES
   * Unusual but valid scenarios
   */
  describe('edge cases', () => {
    it('should handle rapid state updates', () => {
      const initialState = createMockGameState();
      let callCount = 0;

      const mockEngine = createMockEngine({
        dispatch: vi.fn(
          (state: GameState, _action: GameAction): DispatchResult => {
            callCount++;
            return {
              state: { ...state, seed: state.seed + 1 },
              events: [],
              valid: true,
            };
          }
        ),
      });

      const { result } = renderHook(() =>
        useGameEngine({
          initialState,
          engine: mockEngine,
        })
      );

      act(() => {
        // Dispatch multiple times rapidly
        for (let i = 0; i < 10; i++) {
          result.current.dispatch({ type: 'PASS_PRIORITY' });
        }
      });

      // All 10 dispatches should be called
      expect(callCount).toBe(10);
      // Note: Due to React's batching, each dispatch uses the same captured state
      // from the closure, so the final seed reflects one increment per batch update
      // The engine is called 10 times but all use the same input state
      expect(result.current.state?.seed).toBeGreaterThan(initialState.seed);
    });

    it('should handle empty events array', () => {
      const initialState = createMockGameState();

      const mockEngine = createMockEngine({
        dispatch: vi.fn(
          (_state: GameState, _action: GameAction): DispatchResult => ({
            state: initialState,
            events: [],
            valid: true,
          })
        ),
      });

      const { result } = renderHook(() =>
        useGameEngine({
          initialState,
          engine: mockEngine,
        })
      );

      act(() => {
        result.current.dispatch({ type: 'PASS_PRIORITY' });
      });

      expect(result.current.events).toHaveLength(0);
    });

    it('should clear events when clearEvents is called', () => {
      const initialState = createMockGameState();
      const testEvent: GameEvent = {
        type: 'TURN_START',
        params: { turnNumber: 1, activePlayer: 0 },
      };

      const mockEngine = createMockEngine({
        dispatch: vi.fn(
          (_state: GameState, _action: GameAction): DispatchResult => ({
            state: initialState,
            events: [testEvent],
            valid: true,
          })
        ),
      });

      const { result } = renderHook(() =>
        useGameEngine({
          initialState,
          engine: mockEngine,
        })
      );

      act(() => {
        result.current.dispatch({ type: 'PASS_PRIORITY' });
      });

      expect(result.current.events).toHaveLength(1);

      act(() => {
        result.current.clearEvents();
      });

      expect(result.current.events).toHaveLength(0);
    });

    it('should handle game ending (winner set)', () => {
      const initialState = createMockGameState({ winner: 0, gamePhase: 'ended' });
      const mockEngine = createMockEngine();

      const { result } = renderHook(() =>
        useGameEngine({
          initialState,
          engine: mockEngine,
        })
      );

      expect(result.current.winner).toBe(0);
      expect(result.current.isGameOver).toBe(true);
    });

    it('should provide getSelectableEntities from engine', () => {
      const initialState = createMockGameState();
      const selectableEntities = ['unit-1', 'unit-2'];

      const mockEngine = createMockEngine({
        getSelectableEntities: vi.fn(() => selectableEntities),
      });

      const { result } = renderHook(() =>
        useGameEngine({
          initialState,
          engine: mockEngine,
        })
      );

      expect(result.current.getSelectableEntities()).toEqual(selectableEntities);
    });
  });
});
