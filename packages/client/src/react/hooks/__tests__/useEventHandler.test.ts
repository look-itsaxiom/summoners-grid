/**
 * useEventHandler Hook Tests
 *
 * TDD tests for the event handler system that processes game events
 * and triggers appropriate UI updates and animations.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { GameEvent, KnownGameEvent } from '@summoners-grid/engine';
import { useEventHandler } from '../useEventHandler';

describe('useEventHandler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  /**
   * HAPPY PATH SCENARIOS
   * Basic functionality that should work under normal conditions
   */
  describe('happy path scenarios', () => {
    it('should return event handling functions', () => {
      const { result } = renderHook(() => useEventHandler());

      expect(typeof result.current.handleEvent).toBe('function');
      expect(typeof result.current.handleEvents).toBe('function');
      expect(typeof result.current.registerHandler).toBe('function');
    });

    it('should process a single event', () => {
      const handler = vi.fn();
      const { result } = renderHook(() => useEventHandler());

      act(() => {
        result.current.registerHandler('TURN_START', handler);
      });

      const event: GameEvent = {
        type: 'TURN_START',
        params: { turnNumber: 1, activePlayer: 0 },
      };

      act(() => {
        result.current.handleEvent(event);
      });

      expect(handler).toHaveBeenCalledWith(event);
    });

    it('should process multiple events in sequence', () => {
      const turnHandler = vi.fn();
      const phaseHandler = vi.fn();
      const { result } = renderHook(() => useEventHandler());

      act(() => {
        result.current.registerHandler('TURN_START', turnHandler);
        result.current.registerHandler('PHASE_CHANGE', phaseHandler);
      });

      const events: GameEvent[] = [
        { type: 'TURN_START', params: { turnNumber: 1, activePlayer: 0 } },
        { type: 'PHASE_CHANGE', params: { phase: 'action', player: 0 } },
      ];

      act(() => {
        result.current.handleEvents(events);
      });

      expect(turnHandler).toHaveBeenCalledTimes(1);
      expect(phaseHandler).toHaveBeenCalledTimes(1);
    });

    it('should track pending events', () => {
      const { result } = renderHook(() => useEventHandler());

      expect(result.current.pendingEvents).toHaveLength(0);
    });
  });

  /**
   * SUCCESS SCENARIOS
   * Verifying that operations complete successfully
   */
  describe('success scenarios', () => {
    it('should support multiple handlers for the same event type', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      const { result } = renderHook(() => useEventHandler());

      act(() => {
        result.current.registerHandler('UNIT_MOVED', handler1);
        result.current.registerHandler('UNIT_MOVED', handler2);
      });

      const event: GameEvent = {
        type: 'UNIT_MOVED',
        params: { unitId: 'unit-1', from: { x: 0, y: 0 }, to: { x: 1, y: 1 } },
      };

      act(() => {
        result.current.handleEvent(event);
      });

      expect(handler1).toHaveBeenCalledWith(event);
      expect(handler2).toHaveBeenCalledWith(event);
    });

    it('should support unregistering handlers', () => {
      const handler = vi.fn();
      const { result } = renderHook(() => useEventHandler());

      let unregister: () => void;
      act(() => {
        unregister = result.current.registerHandler('ATTACK_HIT', handler);
      });

      act(() => {
        unregister();
      });

      const event: GameEvent = {
        type: 'ATTACK_HIT',
        params: {
          attackerId: 'unit-1',
          targetId: 'unit-2',
          damage: 10,
          isCritical: false,
        },
      };

      act(() => {
        result.current.handleEvent(event);
      });

      expect(handler).not.toHaveBeenCalled();
    });

    it('should call global handler for all events', () => {
      const globalHandler = vi.fn();
      const { result } = renderHook(() =>
        useEventHandler({ onAnyEvent: globalHandler })
      );

      const event: GameEvent = {
        type: 'DAMAGE_TAKEN',
        params: {
          targetId: 'unit-1',
          amount: 15,
          source: 'unit-2',
          damageType: 'physical',
        },
      };

      act(() => {
        result.current.handleEvent(event);
      });

      expect(globalHandler).toHaveBeenCalledWith(event);
    });

    it('should report processing status', () => {
      const { result } = renderHook(() => useEventHandler());

      expect(result.current.isProcessing).toBe(false);
    });
  });

  /**
   * FAILURE SCENARIOS
   * Handling missing or incomplete data
   */
  describe('failure scenarios', () => {
    it('should handle events with no registered handlers', () => {
      const { result } = renderHook(() => useEventHandler());

      const event: GameEvent = {
        type: 'UNKNOWN_EVENT',
        params: {},
      };

      // Should not throw
      expect(() => {
        act(() => {
          result.current.handleEvent(event);
        });
      }).not.toThrow();
    });

    it('should handle empty events array', () => {
      const { result } = renderHook(() => useEventHandler());

      expect(() => {
        act(() => {
          result.current.handleEvents([]);
        });
      }).not.toThrow();
    });

    it('should handle null/undefined event gracefully', () => {
      const { result } = renderHook(() => useEventHandler());

      expect(() => {
        act(() => {
          result.current.handleEvent(null as unknown as GameEvent);
          result.current.handleEvent(undefined as unknown as GameEvent);
        });
      }).not.toThrow();
    });
  });

  /**
   * ERROR SCENARIOS
   * Handling runtime errors gracefully
   */
  describe('error scenarios', () => {
    it('should call onError when handler throws', () => {
      const onError = vi.fn();
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error');
      });
      const { result } = renderHook(() => useEventHandler({ onError }));

      act(() => {
        result.current.registerHandler('UNIT_DEFEATED', errorHandler);
      });

      const event: GameEvent = {
        type: 'UNIT_DEFEATED',
        params: { unitId: 'unit-1', defeatedBy: 'unit-2', vpAwarded: 1 },
      };

      act(() => {
        result.current.handleEvent(event);
      });

      expect(onError).toHaveBeenCalledWith(expect.any(Error), event);
    });

    it('should continue processing events after handler error', () => {
      const onError = vi.fn();
      const errorHandler = vi.fn(() => {
        throw new Error('First handler error');
      });
      const successHandler = vi.fn();
      const { result } = renderHook(() => useEventHandler({ onError }));

      act(() => {
        result.current.registerHandler('UNIT_DEFEATED', errorHandler);
        result.current.registerHandler('TURN_END', successHandler);
      });

      const events: GameEvent[] = [
        { type: 'UNIT_DEFEATED', params: { unitId: 'u1', defeatedBy: 'u2', vpAwarded: 1 } },
        { type: 'TURN_END', params: { turnNumber: 1, player: 0 } },
      ];

      act(() => {
        result.current.handleEvents(events);
      });

      expect(onError).toHaveBeenCalled();
      expect(successHandler).toHaveBeenCalled();
    });
  });

  /**
   * EDGE CASES
   * Unusual but valid scenarios
   */
  describe('edge cases', () => {
    it('should handle rapid event processing', () => {
      const handler = vi.fn();
      const { result } = renderHook(() => useEventHandler());

      act(() => {
        result.current.registerHandler('CARD_DRAWN', handler);
      });

      const events: GameEvent[] = Array.from({ length: 100 }, (_, i) => ({
        type: 'CARD_DRAWN',
        params: { player: 0, cardId: `card-${i}`, fromZone: 'deck' },
      }));

      act(() => {
        result.current.handleEvents(events);
      });

      expect(handler).toHaveBeenCalledTimes(100);
    });

    it('should support async handlers', async () => {
      const asyncHandler = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
      });

      const { result } = renderHook(() => useEventHandler());

      act(() => {
        result.current.registerHandler('STATUS_EFFECT_APPLIED', asyncHandler);
      });

      const event: GameEvent = {
        type: 'STATUS_EFFECT_APPLIED',
        params: { targetId: 'unit-1', effectType: 'burn', duration: 3 },
      };

      act(() => {
        result.current.handleEvent(event);
      });

      // Advance timers to let async handler complete
      await act(async () => {
        vi.advanceTimersByTime(100);
      });

      expect(asyncHandler).toHaveBeenCalled();
    });

    it('should preserve event order', () => {
      const callOrder: string[] = [];
      const { result } = renderHook(() => useEventHandler());

      act(() => {
        result.current.registerHandler('TURN_START', () => {
          callOrder.push('TURN_START');
        });
        result.current.registerHandler('PHASE_CHANGE', () => {
          callOrder.push('PHASE_CHANGE');
        });
        result.current.registerHandler('CARD_DRAWN', () => {
          callOrder.push('CARD_DRAWN');
        });
      });

      const events: GameEvent[] = [
        { type: 'TURN_START', params: { turnNumber: 1, activePlayer: 0 } },
        { type: 'PHASE_CHANGE', params: { phase: 'draw', player: 0 } },
        { type: 'CARD_DRAWN', params: { player: 0, cardId: 'c1', fromZone: 'deck' } },
      ];

      act(() => {
        result.current.handleEvents(events);
      });

      expect(callOrder).toEqual(['TURN_START', 'PHASE_CHANGE', 'CARD_DRAWN']);
    });

    it('should provide event history', () => {
      const { result } = renderHook(() => useEventHandler({ keepHistory: true }));

      const event: GameEvent = {
        type: 'VICTORY_POINTS_GAINED',
        params: { player: 0, amount: 1, reason: 'defeat' },
      };

      act(() => {
        result.current.handleEvent(event);
      });

      expect(result.current.eventHistory).toContainEqual(event);
    });

    it('should clear event history', () => {
      const { result } = renderHook(() => useEventHandler({ keepHistory: true }));

      const event: GameEvent = {
        type: 'GAME_ENDED',
        params: { winner: 0, reason: 'victory points' },
      };

      act(() => {
        result.current.handleEvent(event);
      });

      expect(result.current.eventHistory).toHaveLength(1);

      act(() => {
        result.current.clearHistory();
      });

      expect(result.current.eventHistory).toHaveLength(0);
    });

    it('should limit history size when configured', () => {
      const { result } = renderHook(() =>
        useEventHandler({ keepHistory: true, maxHistorySize: 5 })
      );

      act(() => {
        for (let i = 0; i < 10; i++) {
          result.current.handleEvent({
            type: 'CARD_DRAWN',
            params: { player: 0, cardId: `card-${i}`, fromZone: 'deck' },
          });
        }
      });

      expect(result.current.eventHistory).toHaveLength(5);
      // Should keep the most recent events
      expect(result.current.eventHistory[4].params.cardId).toBe('card-9');
    });
  });
});
