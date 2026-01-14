/**
 * useEventHandler - React hook for processing game events.
 *
 * Provides a centralized system for:
 * - Registering handlers for specific event types
 * - Processing events with proper error handling
 * - Maintaining event history for debugging/replay
 */
import { useState, useCallback, useRef, useMemo } from 'react';
import type { GameEvent } from '@summoners-grid/engine';

/**
 * Handler function for a game event.
 */
export type EventHandler = (event: GameEvent) => void | Promise<void>;

/**
 * Options for the useEventHandler hook.
 */
export interface UseEventHandlerOptions {
  /** Called for every event processed */
  onAnyEvent?: (event: GameEvent) => void;
  /** Called when a handler throws an error */
  onError?: (error: Error, event: GameEvent) => void;
  /** Whether to keep event history */
  keepHistory?: boolean;
  /** Maximum number of events to keep in history */
  maxHistorySize?: number;
}

/**
 * Return value of the useEventHandler hook.
 */
export interface UseEventHandlerResult {
  /** Handle a single event */
  handleEvent: (event: GameEvent) => void;
  /** Handle multiple events in sequence */
  handleEvents: (events: GameEvent[]) => void;
  /** Register a handler for an event type */
  registerHandler: (eventType: string, handler: EventHandler) => () => void;
  /** Pending events waiting to be processed */
  pendingEvents: GameEvent[];
  /** Whether events are currently being processed */
  isProcessing: boolean;
  /** Event history (if keepHistory is enabled) */
  eventHistory: GameEvent[];
  /** Clear event history */
  clearHistory: () => void;
}

/**
 * Hook for processing game events.
 */
export function useEventHandler(
  options: UseEventHandlerOptions = {}
): UseEventHandlerResult {
  const { onAnyEvent, onError, keepHistory = false, maxHistorySize = 100 } = options;

  // Registered handlers by event type
  const handlersRef = useRef<Map<string, Set<EventHandler>>>(new Map());

  // Pending events queue
  const [pendingEvents, setPendingEvents] = useState<GameEvent[]>([]);

  // Processing status
  const [isProcessing, setIsProcessing] = useState(false);

  // Event history
  const [eventHistory, setEventHistory] = useState<GameEvent[]>([]);

  // Register a handler for an event type
  const registerHandler = useCallback(
    (eventType: string, handler: EventHandler): (() => void) => {
      const handlers = handlersRef.current;

      if (!handlers.has(eventType)) {
        handlers.set(eventType, new Set());
      }

      handlers.get(eventType)!.add(handler);

      // Return unregister function
      return () => {
        const typeHandlers = handlers.get(eventType);
        if (typeHandlers) {
          typeHandlers.delete(handler);
          if (typeHandlers.size === 0) {
            handlers.delete(eventType);
          }
        }
      };
    },
    []
  );

  // Handle a single event
  const handleEvent = useCallback(
    (event: GameEvent): void => {
      // Guard against null/undefined events
      if (!event) {
        return;
      }

      // Call global handler
      onAnyEvent?.(event);

      // Add to history if enabled
      if (keepHistory) {
        setEventHistory((prev) => {
          const newHistory = [...prev, event];
          // Trim to max size, keeping most recent
          if (newHistory.length > maxHistorySize) {
            return newHistory.slice(newHistory.length - maxHistorySize);
          }
          return newHistory;
        });
      }

      // Get handlers for this event type
      const typeHandlers = handlersRef.current.get(event.type);
      if (!typeHandlers || typeHandlers.size === 0) {
        return;
      }

      // Call all registered handlers
      typeHandlers.forEach((handler) => {
        try {
          const result = handler(event);
          // Handle async handlers (we don't await, but we catch errors)
          if (result instanceof Promise) {
            result.catch((error) => {
              onError?.(error instanceof Error ? error : new Error(String(error)), event);
            });
          }
        } catch (error) {
          onError?.(error instanceof Error ? error : new Error(String(error)), event);
        }
      });
    },
    [onAnyEvent, onError, keepHistory, maxHistorySize]
  );

  // Handle multiple events in sequence
  const handleEvents = useCallback(
    (events: GameEvent[]): void => {
      if (!events || events.length === 0) {
        return;
      }

      setIsProcessing(true);

      try {
        events.forEach((event) => {
          handleEvent(event);
        });
      } finally {
        setIsProcessing(false);
      }
    },
    [handleEvent]
  );

  // Clear event history
  const clearHistory = useCallback(() => {
    setEventHistory([]);
  }, []);

  return {
    handleEvent,
    handleEvents,
    registerHandler,
    pendingEvents,
    isProcessing,
    eventHistory,
    clearHistory,
  };
}
