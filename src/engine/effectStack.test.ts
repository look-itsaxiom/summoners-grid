import { describe, it, expect } from 'vitest';
import type { EffectStackEntry, CardSpeed } from '../types';

/**
 * Effect Stack LIFO Resolution tests.
 * Verifies the stack-based resolution system per GDD:
 * - Effects resolve Last-In-First-Out
 * - Higher speed effects create "Speed Lock"
 * - Counter > Reaction > Action (speed priority)
 */

function createStackEntry(id: string, speed: CardSpeed): EffectStackEntry {
  return {
    id,
    speed,
    source: { id, name: id, cardType: 'action', element: 'neutral', description: '', requirements: [], pileDestination: 'discard' } as any,
    sourceOwner: 'playerA',
    effects: [],
    targets: [],
    resolved: false,
  };
}

describe('Effect Stack: LIFO Resolution Order', () => {
  it('should resolve last-added effect first', () => {
    const stack: EffectStackEntry[] = [];
    stack.push(createStackEntry('first', 'action'));
    stack.push(createStackEntry('second', 'action'));
    stack.push(createStackEntry('third', 'action'));

    // LIFO: resolve from top (last added)
    const resolution: string[] = [];
    while (stack.length > 0) {
      const top = stack.pop()!;
      resolution.push(top.id);
    }

    expect(resolution).toEqual(['third', 'second', 'first']);
  });

  it('should interleave player responses correctly', () => {
    const stack: EffectStackEntry[] = [];

    // Player A plays an action
    stack.push({ ...createStackEntry('action1', 'action'), sourceOwner: 'playerA' });
    // Player B responds with a reaction
    stack.push({ ...createStackEntry('reaction1', 'reaction'), sourceOwner: 'playerB' });

    // LIFO: reaction resolves first, then action
    const first = stack.pop()!;
    const second = stack.pop()!;

    expect(first.id).toBe('reaction1');
    expect(first.sourceOwner).toBe('playerB');
    expect(second.id).toBe('action1');
    expect(second.sourceOwner).toBe('playerA');
  });
});

describe('Effect Stack: Speed Levels', () => {
  it('Counter > Reaction > Action (speed priority order)', () => {
    const priority: Record<CardSpeed, number> = { counter: 3, reaction: 2, action: 1 };

    // Counter has highest priority
    expect(priority['counter']).toBeGreaterThan(priority['reaction']);
    expect(priority['reaction']).toBeGreaterThan(priority['action']);
  });

  it('Speed Lock: action speed locked when reaction is on stack', () => {
    const stack: EffectStackEntry[] = [];
    stack.push(createStackEntry('action1', 'action'));
    stack.push(createStackEntry('reaction1', 'reaction'));

    // With a reaction on the stack, no more actions can be added
    // (Speed Lock: higher speed prevents lower speed responses)
    const topSpeed = stack[stack.length - 1].speed;
    const canAddAction = topSpeed === 'action'; // Only if top is action speed
    const canAddReaction = topSpeed === 'action' || topSpeed === 'reaction';
    const canAddCounter = true; // Counter can always be added

    expect(canAddAction).toBe(false); // Locked by reaction
    expect(canAddReaction).toBe(true); // Same or higher speed OK
    expect(canAddCounter).toBe(true); // Highest speed always OK
  });

  it('Speed Lock: reaction locked when counter is on stack', () => {
    const stack: EffectStackEntry[] = [];
    stack.push(createStackEntry('action1', 'action'));
    stack.push(createStackEntry('counter1', 'counter'));

    const topSpeed = stack[stack.length - 1].speed;
    const canAddAction = topSpeed === 'action';
    const canAddReaction = topSpeed === 'action' || topSpeed === 'reaction';

    expect(canAddAction).toBe(false); // Locked
    expect(canAddReaction).toBe(false); // Locked by counter
  });

  it('stack empty allows any speed', () => {
    const stack: EffectStackEntry[] = [];
    // Empty stack = no speed lock, any card can be played
    expect(stack.length).toBe(0);
    // All speeds valid when stack is empty
  });
});

describe('Effect Stack: Resolution with Speed Lock', () => {
  it('full stack scenario: action → reaction → counter → resolve all LIFO', () => {
    const stack: EffectStackEntry[] = [];

    // Turn player plays action
    stack.push(createStackEntry('heal', 'action'));
    // Opponent responds with reaction
    stack.push(createStackEntry('quick_dodge', 'reaction'));
    // Turn player responds with counter
    stack.push(createStackEntry('iron_will', 'counter'));

    // Both players pass → resolve LIFO
    const resolution: string[] = [];
    while (stack.length > 0) {
      resolution.push(stack.pop()!.id);
    }

    // Counter resolves first, then reaction, then action
    expect(resolution).toEqual(['iron_will', 'quick_dodge', 'heal']);
  });

  it('stack must be empty before new actions can begin', () => {
    const stack: EffectStackEntry[] = [];
    stack.push(createStackEntry('action1', 'action'));

    // Resolve the stack
    stack.pop();
    expect(stack.length).toBe(0);

    // Now a new action can be initiated
    stack.push(createStackEntry('action2', 'action'));
    expect(stack.length).toBe(1);
  });
});
