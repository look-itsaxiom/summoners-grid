/**
 * EventBus.ts - Typed event system for all in-game events
 * 
 * Implements event emission and subscription system for the TRR pipeline.
 * Based on GDD: Effect System - Trigger System
 */

import { EventType, GameEventData } from '../types/action';

export type EventListener<T = any> = (event: GameEventData & { data: T }) => void;
export type EventUnsubscriber = () => void;

export class EventBus {
  private listeners: Map<EventType, Set<EventListener>> = new Map();
  private eventHistory: GameEventData[] = [];
  private eventIdCounter = 0;

  /**
   * Subscribe to a specific event type
   * @param eventType - The type of event to listen for
   * @param listener - Callback function to handle the event
   * @returns Unsubscriber function
   */
  subscribe<T = any>(eventType: EventType, listener: EventListener<T>): EventUnsubscriber {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    
    this.listeners.get(eventType)!.add(listener);
    
    // Return unsubscriber
    return () => {
      const eventListeners = this.listeners.get(eventType);
      if (eventListeners) {
        eventListeners.delete(listener);
        if (eventListeners.size === 0) {
          this.listeners.delete(eventType);
        }
      }
    };
  }

  /**
   * Emit an event to all subscribers
   * @param event - Event data to emit
   */
  emit(event: Omit<GameEventData, 'id' | 'timestamp'>): GameEventData {
    const fullEvent: GameEventData = {
      ...event,
      id: `event_${++this.eventIdCounter}`,
      timestamp: Date.now()
    };

    // Store in history
    this.eventHistory.push(fullEvent);

    // Notify listeners
    const eventListeners = this.listeners.get(event.type);
    if (eventListeners) {
      for (const listener of eventListeners) {
        try {
          listener(fullEvent);
        } catch (error) {
          console.error(`Error in event listener for ${event.type}:`, error);
        }
      }
    }

    return fullEvent;
  }

  /**
   * Get all events since a specific timestamp
   * @param since - Timestamp to filter events from
   * @returns Array of events since the timestamp
   */
  getEventsSince(since: number): GameEventData[] {
    return this.eventHistory.filter(event => event.timestamp >= since);
  }

  /**
   * Get all events of a specific type
   * @param eventType - Type of events to retrieve
   * @returns Array of events matching the type
   */
  getEventsByType(eventType: EventType): GameEventData[] {
    return this.eventHistory.filter(event => event.type === eventType);
  }

  /**
   * Get the full event history
   * @returns All events that have occurred
   */
  getAllEvents(): GameEventData[] {
    return [...this.eventHistory];
  }

  /**
   * Clear event history and listeners (for testing)
   */
  reset(): void {
    this.listeners.clear();
    this.eventHistory = [];
    this.eventIdCounter = 0;
  }

  /**
   * Get current number of listeners for debugging
   */
  getListenerCount(): Record<string, number> {
    const counts: Record<string, number> = {};
    for (const [eventType, listeners] of this.listeners.entries()) {
      counts[eventType] = listeners.size;
    }
    return counts;
  }
}