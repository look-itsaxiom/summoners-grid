import { describe, it, expect } from 'vitest';
import { getElementalMultiplier, getElementalInteraction } from './elements';

describe('getElementalMultiplier', () => {
  it('fire > wind = 1.25x', () => {
    expect(getElementalMultiplier('fire', 'wind')).toBe(1.25);
  });

  it('wind > earth = 1.25x', () => {
    expect(getElementalMultiplier('wind', 'earth')).toBe(1.25);
  });

  it('earth > water = 1.25x', () => {
    expect(getElementalMultiplier('earth', 'water')).toBe(1.25);
  });

  it('water > fire = 1.25x', () => {
    expect(getElementalMultiplier('water', 'fire')).toBe(1.25);
  });

  it('light > dark = 1.25x', () => {
    expect(getElementalMultiplier('light', 'dark')).toBe(1.25);
  });

  it('dark > light = 1.25x', () => {
    expect(getElementalMultiplier('dark', 'light')).toBe(1.25);
  });

  it('reverse cycle is neutral (wind attacking fire = 1.0x)', () => {
    expect(getElementalMultiplier('wind', 'fire')).toBe(1.0);
  });

  it('neutral has no effect', () => {
    expect(getElementalMultiplier('neutral', 'fire')).toBe(1.0);
    expect(getElementalMultiplier('fire', 'neutral')).toBe(1.0);
  });

  it('same element = neutral', () => {
    expect(getElementalMultiplier('fire', 'fire')).toBe(1.0);
    expect(getElementalMultiplier('earth', 'earth')).toBe(1.0);
  });
});

describe('getElementalInteraction', () => {
  it('returns advantage for fire vs wind', () => {
    expect(getElementalInteraction('fire', 'wind')).toBe('advantage');
  });

  it('returns neutral for wind vs fire (no reverse advantage)', () => {
    expect(getElementalInteraction('wind', 'fire')).toBe('neutral');
  });

  it('returns neutral for fire vs earth (no direct relationship)', () => {
    expect(getElementalInteraction('fire', 'earth')).toBe('neutral');
  });
});
