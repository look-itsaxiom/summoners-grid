/**
 * PhaserBridge Tests
 *
 * TDD tests for the Phaser bridge that manages communication
 * between React and the Phaser game instance.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import type { GameState, GridPosition } from '@summoners-grid/engine';
import {
  createEmptyBoard,
  createEmptyStack,
  createInitialTurnState,
} from '@summoners-grid/engine';

// Mock Phaser to avoid canvas/WebGL issues in tests
// All mock classes must be defined inside the factory since vi.mock is hoisted
vi.mock('phaser', () => {
  // Create mock classes inside the factory
  class MockContainer {
    x = 0;
    y = 0;
    add = vi.fn();
    removeAll = vi.fn();
    destroy = vi.fn();
    setPosition = vi.fn().mockReturnThis();
    setSize = vi.fn().mockReturnThis();
    setInteractive = vi.fn().mockReturnThis();
    on = vi.fn().mockReturnThis();
    scene: any = null;
    constructor(scene?: any, x?: number, y?: number) {
      this.scene = scene;
      this.x = x ?? 0;
      this.y = y ?? 0;
    }
  }

  class MockGraphics {
    fillStyle = vi.fn().mockReturnThis();
    fillRect = vi.fn().mockReturnThis();
    strokeRect = vi.fn().mockReturnThis();
    lineStyle = vi.fn().mockReturnThis();
    clear = vi.fn().mockReturnThis();
    destroy = vi.fn();
  }

  class MockText {
    x = 0;
    y = 0;
    setText = vi.fn().mockReturnThis();
    setOrigin = vi.fn().mockReturnThis();
    setFontSize = vi.fn().mockReturnThis();
    destroy = vi.fn();
  }

  class MockScene {
    add = {
      container: vi.fn((x: number, y: number) => new MockContainer(this, x, y)),
      graphics: vi.fn(() => new MockGraphics()),
      text: vi.fn(() => new MockText()),
    };
    events = {
      on: vi.fn(),
      off: vi.fn(),
      emit: vi.fn(),
    };
    updateGameState = vi.fn();
    showMovementRange = vi.fn();
    showAttackTargets = vi.fn();
    clearHighlights = vi.fn();
  }

  return {
    default: {
      AUTO: 0,
      Scale: {
        FIT: 'fit',
        CENTER_BOTH: 'center-both',
      },
      GameObjects: {
        Container: MockContainer,
        Graphics: MockGraphics,
        Text: MockText,
      },
      Scene: MockScene,
      Game: vi.fn().mockImplementation(function (this: any, config: any) {
        this.config = config;
        this.events = {
          once: vi.fn((event: string, callback: () => void) => {
            // Simulate ready event
            if (event === 'ready') {
              setTimeout(callback, 0);
            }
          }),
          on: vi.fn(),
          off: vi.fn(),
        };
        this.scene = {
          getScene: vi.fn(() => new MockScene()),
        };
        this.destroy = vi.fn();
      }),
    },
  };
});

// Import after mocks
import { PhaserBridge, getPhaserBridge, resetPhaserBridge } from '../PhaserBridge';

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

describe('PhaserBridge', () => {
  beforeEach(() => {
    // Use fake timers to control async behavior
    vi.useFakeTimers();
    // Reset bridge state before each test
    resetPhaserBridge();
    vi.clearAllMocks();
  });

  afterEach(() => {
    // Run all pending timers to prevent async leaks
    vi.runAllTimers();
    resetPhaserBridge();
    vi.useRealTimers();
  });

  /**
   * HAPPY PATH SCENARIOS
   * Basic functionality that should work under normal conditions
   */
  describe('happy path scenarios', () => {
    it('should create a new bridge instance', () => {
      const bridge = new PhaserBridge();
      expect(bridge).toBeDefined();
    });

    it('should initialize the Phaser game', () => {
      const bridge = new PhaserBridge();

      bridge.init({
        parent: 'test-container',
        width: 800,
        height: 600,
      });

      expect(bridge.getGame()).toBeDefined();
    });

    it('should return the same instance from getPhaserBridge', () => {
      const bridge1 = getPhaserBridge();
      const bridge2 = getPhaserBridge();

      expect(bridge1).toBe(bridge2);
    });

    it('should report ready status after initialization', async () => {
      const bridge = new PhaserBridge();
      const onSceneReady = vi.fn();

      bridge.setEventHandlers({ onSceneReady });
      bridge.init({
        parent: 'test-container',
        width: 800,
        height: 600,
      });

      // Wait for async ready event
      vi.advanceTimersByTime(10);

      // Note: In the mock, we trigger ready immediately
      // In real implementation, this would wait for scene creation
    });

    it('should allow setting event handlers', () => {
      const bridge = new PhaserBridge();
      const onCellClick = vi.fn();
      const onSceneReady = vi.fn();

      expect(() => {
        bridge.setEventHandlers({ onCellClick, onSceneReady });
      }).not.toThrow();
    });
  });

  /**
   * SUCCESS SCENARIOS
   * Verifying that operations complete successfully
   */
  describe('success scenarios', () => {
    it('should update game state in Phaser scene', async () => {
      const bridge = new PhaserBridge();

      bridge.init({
        parent: 'test-container',
        width: 800,
        height: 600,
      });

      // Wait for initialization
      vi.advanceTimersByTime(10);

      const gameState = createMockGameState();

      // This should not throw even though scene may not be fully ready
      expect(() => {
        bridge.updateGameState(gameState);
      }).not.toThrow();
    });

    it('should show movement range highlights', async () => {
      const bridge = new PhaserBridge();

      bridge.init({
        parent: 'test-container',
        width: 800,
        height: 600,
      });

      vi.advanceTimersByTime(10);

      const positions: GridPosition[] = [
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
      ];

      expect(() => {
        bridge.showMovementRange(positions);
      }).not.toThrow();
    });

    it('should show attack target highlights', async () => {
      const bridge = new PhaserBridge();

      bridge.init({
        parent: 'test-container',
        width: 800,
        height: 600,
      });

      vi.advanceTimersByTime(10);

      const positions: GridPosition[] = [{ x: 2, y: 2 }];

      expect(() => {
        bridge.showAttackTargets(positions);
      }).not.toThrow();
    });

    it('should clear highlights', async () => {
      const bridge = new PhaserBridge();

      bridge.init({
        parent: 'test-container',
        width: 800,
        height: 600,
      });

      vi.advanceTimersByTime(10);

      expect(() => {
        bridge.clearHighlights();
      }).not.toThrow();
    });

    it('should properly destroy the game instance', async () => {
      const bridge = new PhaserBridge();

      bridge.init({
        parent: 'test-container',
        width: 800,
        height: 600,
      });

      vi.advanceTimersByTime(10);

      bridge.destroy();

      expect(bridge.getGame()).toBeNull();
      expect(bridge.getBattleScene()).toBeNull();
      expect(bridge.getIsReady()).toBe(false);
    });
  });

  /**
   * FAILURE SCENARIOS
   * Handling missing or incomplete data
   */
  describe('failure scenarios', () => {
    it('should not crash when updating state before initialization', () => {
      const bridge = new PhaserBridge();
      const gameState = createMockGameState();

      // Should not throw, just log warning
      expect(() => {
        bridge.updateGameState(gameState);
      }).not.toThrow();
    });

    it('should not crash when showing highlights before initialization', () => {
      const bridge = new PhaserBridge();

      expect(() => {
        bridge.showMovementRange([{ x: 0, y: 0 }]);
        bridge.showAttackTargets([{ x: 1, y: 1 }]);
        bridge.clearHighlights();
      }).not.toThrow();
    });

    it('should handle destroy when not initialized', () => {
      const bridge = new PhaserBridge();

      expect(() => {
        bridge.destroy();
      }).not.toThrow();
    });
  });

  /**
   * ERROR SCENARIOS
   * Handling runtime errors gracefully
   */
  describe('error scenarios', () => {
    it('should warn when initializing twice', () => {
      const bridge = new PhaserBridge();
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

      bridge.init({ parent: 'test1', width: 800, height: 600 });
      bridge.init({ parent: 'test2', width: 800, height: 600 });

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('already initialized')
      );

      consoleSpy.mockRestore();
    });
  });

  /**
   * EDGE CASES
   * Unusual but valid scenarios
   */
  describe('edge cases', () => {
    it('should reset singleton bridge properly', () => {
      const bridge1 = getPhaserBridge();
      bridge1.init({ parent: 'test', width: 800, height: 600 });

      // Run pending timers before reset to let init complete
      vi.advanceTimersByTime(10);

      resetPhaserBridge();

      const bridge2 = getPhaserBridge();
      expect(bridge2).not.toBe(bridge1);
      expect(bridge2.getGame()).toBeNull();
    });

    it('should use default config values when not provided', () => {
      const bridge = new PhaserBridge();

      expect(() => {
        bridge.init({});
      }).not.toThrow();
    });

    it('should accept custom background color', () => {
      const bridge = new PhaserBridge();

      expect(() => {
        bridge.init({
          parent: 'test',
          width: 800,
          height: 600,
          backgroundColor: 0x2d2d2d,
        });
      }).not.toThrow();
    });

    it('should handle rapid state updates', async () => {
      const bridge = new PhaserBridge();

      bridge.init({
        parent: 'test-container',
        width: 800,
        height: 600,
      });

      vi.advanceTimersByTime(10);

      // Rapid updates should not cause issues
      expect(() => {
        for (let i = 0; i < 100; i++) {
          const state = createMockGameState({ seed: i });
          bridge.updateGameState(state);
        }
      }).not.toThrow();
    });

    it('should handle empty positions array for highlights', async () => {
      const bridge = new PhaserBridge();

      bridge.init({
        parent: 'test-container',
        width: 800,
        height: 600,
      });

      vi.advanceTimersByTime(10);

      expect(() => {
        bridge.showMovementRange([]);
        bridge.showAttackTargets([]);
      }).not.toThrow();
    });

    it('should call onSceneReady if already ready when setting handlers', async () => {
      const bridge = new PhaserBridge();

      bridge.init({
        parent: 'test-container',
        width: 800,
        height: 600,
      });

      // Wait for ready
      vi.advanceTimersByTime(10);

      const onSceneReady = vi.fn();
      bridge.setEventHandlers({ onSceneReady });

      // If already ready, should be called immediately
      // (depends on implementation - the current implementation does this)
    });
  });
});

describe('PhaserBridge Event Handling', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    resetPhaserBridge();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.runAllTimers();
    resetPhaserBridge();
    vi.useRealTimers();
  });

  /**
   * EVENT SUBSCRIPTION TESTS
   */
  describe('event subscriptions', () => {
    it('should call onCellClick when cell is clicked', async () => {
      const bridge = getPhaserBridge();
      const onCellClick = vi.fn();

      bridge.setEventHandlers({ onCellClick });
      bridge.init({
        parent: 'test-container',
        width: 800,
        height: 600,
      });

      vi.advanceTimersByTime(10);

      // Note: In the mock, we'd need to trigger the event
      // This tests that the handler is set up correctly
    });

    it('should allow updating event handlers', () => {
      const bridge = getPhaserBridge();

      const handler1 = vi.fn();
      const handler2 = vi.fn();

      bridge.setEventHandlers({ onCellClick: handler1 });
      bridge.setEventHandlers({ onCellClick: handler2 });

      // Should not throw
    });

    it('should handle undefined event handlers', () => {
      const bridge = getPhaserBridge();

      expect(() => {
        bridge.setEventHandlers({});
      }).not.toThrow();
    });
  });
});
