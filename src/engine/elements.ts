import type { Element } from '../types';

/**
 * Elemental advantage system from the GDD.
 *
 * Cycle: Fire > Wind > Earth > Water > Fire
 * Light <> Dark (mutual advantage)
 * Neutral has no interactions
 *
 * Advantage = 1.25x damage
 * No "resistance" as a separate mechanic — just advantage or neutral
 */

const ADVANTAGES: Array<[Element, Element]> = [
  ['fire', 'wind'],
  ['wind', 'earth'],
  ['earth', 'water'],
  ['water', 'fire'],
  ['light', 'dark'],
  ['dark', 'light'],
];

const ADVANTAGE_SET = new Set(ADVANTAGES.map(([a, d]) => `${a}:${d}`));

const ADVANTAGE_MULTIPLIER = 1.25;

export function getElementalMultiplier(attackElement: Element, defenderElement: Element): number {
  if (attackElement === 'neutral' || defenderElement === 'neutral') return 1.0;
  if (ADVANTAGE_SET.has(`${attackElement}:${defenderElement}`)) return ADVANTAGE_MULTIPLIER;
  return 1.0;
}

export function getElementalInteraction(
  attackElement: Element,
  defenderElement: Element
): 'advantage' | 'neutral' {
  return getElementalMultiplier(attackElement, defenderElement) > 1 ? 'advantage' : 'neutral';
}

export const ELEMENT_COLORS: Record<Element, string> = {
  fire: '#f44',
  water: '#44f',
  earth: '#a84',
  wind: '#4f4',
  light: '#ffa',
  dark: '#a4f',
  neutral: '#aaa',
};
