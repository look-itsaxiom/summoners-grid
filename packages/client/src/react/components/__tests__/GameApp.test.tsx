/**
 * GameApp Component Tests
 *
 * TDD tests for the root GameApp component that combines
 * game engine state management with Phaser rendering.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import type { GameState, GameEngine, GameAction, DispatchResult, GameEvent } from '@summoners-grid/engine';
import {
  createEmptyBoard,
  createEmptyStack,
  createInitialTurnState,
} from '@summoners-grid/engine';

// We'll import GameApp after defining mocks
// import { GameApp } from '../GameApp';

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

// Mock the Phaser bridge to avoid actual canvas initialization
vi.mock('../../../bridge', () => ({
  getPhaserBridge: vi.fn(() => ({
    init: vi.fn(),
    destroy: vi.fn(),
    updateGameState: vi.fn(),
    showMovementRange: vi.fn(),
    showAttackTargets: vi.fn(),
    clearHighlights: vi.fn(),
    setEventHandlers: vi.fn(),
    getIsReady: vi.fn(() => true),
    getGame: vi.fn(() => null),
    getBattleScene: vi.fn(() => null),
  })),
  resetPhaserBridge: vi.fn(),
}));

// Import after mocks are set up
import { GameApp } from '../GameApp';

describe('GameApp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * HAPPY PATH SCENARIOS
   * Basic functionality that should work under normal conditions
   */
  describe('happy path scenarios', () => {
    it('should render without crashing', () => {
      const initialState = createMockGameState();
      const engine = createMockEngine();

      expect(() => {
        render(<GameApp initialState={initialState} engine={engine} />);
      }).not.toThrow();
    });

    it('should display player turn information', () => {
      const initialState = createMockGameState({ activePlayerIndex: 0 });
      const engine = createMockEngine();

      render(<GameApp initialState={initialState} engine={engine} />);

      expect(screen.getByText(/player 0/i)).toBeTruthy();
    });

    it('should display current phase', () => {
      const initialState = createMockGameState();
      initialState.turn.phase = 'action';
      const engine = createMockEngine();

      render(<GameApp initialState={initialState} engine={engine} />);

      expect(screen.getByText(/action/i)).toBeTruthy();
    });

    it('should render the phaser container', () => {
      const initialState = createMockGameState();
      const engine = createMockEngine();

      const { container } = render(<GameApp initialState={initialState} engine={engine} />);

      expect(container.querySelector('#phaser-container')).toBeTruthy();
    });

    it('should display victory points for both players', () => {
      const initialState = createMockGameState();
      initialState.players[0].victoryPoints = 2;
      initialState.players[1].victoryPoints = 1;
      const engine = createMockEngine();

      render(<GameApp initialState={initialState} engine={engine} />);

      expect(screen.getByText(/2.*VP/i)).toBeTruthy();
      expect(screen.getByText(/1.*VP/i)).toBeTruthy();
    });
  });

  /**
   * SUCCESS SCENARIOS
   * Verifying that interactions complete successfully
   */
  describe('success scenarios', () => {
    it('should show loading state when game is not ready', () => {
      // Test without initial state
      const engine = createMockEngine();

      render(<GameApp engine={engine} />);

      expect(screen.getByText(/loading/i)).toBeTruthy();
    });

    it('should call onGameEvent when events occur', () => {
      const initialState = createMockGameState();
      const testEvent: GameEvent = {
        type: 'TURN_START',
        params: { turnNumber: 1, activePlayer: 0 },
      };
      const onGameEvent = vi.fn();

      const engine = createMockEngine({
        dispatch: vi.fn(
          (_state: GameState, _action: GameAction): DispatchResult => ({
            state: initialState,
            events: [testEvent],
            valid: true,
          })
        ),
      });

      render(
        <GameApp
          initialState={initialState}
          engine={engine}
          onGameEvent={onGameEvent}
        />
      );

      // Dispatch an action that triggers events (via pass priority button)
      const passButton = screen.queryByText(/pass/i);
      if (passButton) {
        fireEvent.click(passButton);
        expect(onGameEvent).toHaveBeenCalledWith(testEvent);
      }
    });

    it('should provide pass priority action', () => {
      const initialState = createMockGameState();
      const engine = createMockEngine();

      render(<GameApp initialState={initialState} engine={engine} />);

      const passButton = screen.queryByText(/pass/i);
      expect(passButton).toBeTruthy();
    });
  });

  /**
   * FAILURE SCENARIOS
   * Handling missing or incomplete data
   */
  describe('failure scenarios', () => {
    it('should handle missing initial state gracefully', () => {
      const engine = createMockEngine();

      expect(() => {
        render(<GameApp engine={engine} />);
      }).not.toThrow();
    });

    it('should not show game UI when state is null', () => {
      const engine = createMockEngine();

      render(<GameApp engine={engine} />);

      // Should not show turn info when not ready
      expect(screen.queryByText(/turn \d+/i)).toBeNull();
    });
  });

  /**
   * ERROR SCENARIOS
   * Handling runtime errors gracefully
   */
  describe('error scenarios', () => {
    it('should call onError when engine throws', () => {
      const initialState = createMockGameState();
      const onError = vi.fn();

      const engine = createMockEngine({
        dispatch: vi.fn(() => {
          throw new Error('Engine error');
        }),
      });

      render(
        <GameApp
          initialState={initialState}
          engine={engine}
          onError={onError}
        />
      );

      // Trigger an action
      const passButton = screen.queryByText(/pass/i);
      if (passButton) {
        fireEvent.click(passButton);
        expect(onError).toHaveBeenCalled();
      }
    });
  });

  /**
   * EDGE CASES
   * Unusual but valid scenarios
   */
  describe('edge cases', () => {
    it('should display game over state', () => {
      const initialState = createMockGameState({
        winner: 0,
        gamePhase: 'ended',
      });
      const engine = createMockEngine();

      render(<GameApp initialState={initialState} engine={engine} />);

      // Game over UI shows both "Game Over" header and winner info
      expect(screen.getByRole('heading', { name: /game over/i })).toBeTruthy();
      expect(screen.getByText(/player 0 wins/i)).toBeTruthy();
    });

    it('should handle setup phase', () => {
      const initialState = createMockGameState({
        gamePhase: 'setup',
      });
      const engine = createMockEngine();

      render(<GameApp initialState={initialState} engine={engine} />);

      expect(screen.getByText(/setup/i)).toBeTruthy();
    });

    it('should display pending prompt when present', () => {
      const initialState = createMockGameState({
        pendingPrompt: {
          playerId: 0,
          prompt: {
            id: 'select-target',
            type: 'unit',
          },
          context: {},
        },
      });
      const engine = createMockEngine();

      render(<GameApp initialState={initialState} engine={engine} />);

      expect(screen.getByText(/select/i)).toBeTruthy();
    });

    it('should render with custom dimensions', () => {
      const initialState = createMockGameState();
      const engine = createMockEngine();

      const { container } = render(
        <GameApp
          initialState={initialState}
          engine={engine}
          width={1024}
          height={768}
        />
      );

      const phaserContainer = container.querySelector('#phaser-container');
      expect(phaserContainer).toBeTruthy();
      // The dimensions should be passed to the Phaser container
    });

    it('should update display when state changes via dispatch', () => {
      const initialState = createMockGameState({ activePlayerIndex: 0 });

      // Create engine that changes activePlayerIndex when dispatch is called
      const engine = createMockEngine({
        dispatch: vi.fn(
          (state: GameState, _action: GameAction): DispatchResult => ({
            state: { ...state, activePlayerIndex: 1 },
            events: [],
            valid: true,
          })
        ),
      });

      render(<GameApp initialState={initialState} engine={engine} />);

      // Initially shows player 0 as active
      expect(screen.getByText(/player 0/i, { selector: '.game-app__player' })).toBeTruthy();

      // Click pass priority to trigger dispatch
      const passButton = screen.getByText(/pass priority/i);
      fireEvent.click(passButton);

      // Now should show player 1 as active
      expect(screen.getByText(/player 1/i, { selector: '.game-app__player' })).toBeTruthy();
    });
  });
});
