/**
 * Alpha Set Card Definitions
 *
 * Cards used in the Play Example document.
 * Approximately 20+ cards across various types.
 * Card definitions follow the schema defined in @summoners-grid/engine.
 */

// Import card categories
import { actionCards } from './actions';
import { weaponCards } from './weapons';
import { buildingCards } from './buildings';
import { questCards } from './quests';
import { counterCards } from './counters';
import { advanceCards } from './advances';
import { roleCards } from './roles';
import { uniqueCards } from './unique';

/**
 * All Alpha set cards combined.
 */
export const alphaCards = [
  ...actionCards,
  ...weaponCards,
  ...buildingCards,
  ...questCards,
  ...counterCards,
  ...advanceCards,
  ...roleCards,
  ...uniqueCards,
];

// Re-export individual categories
export { actionCards } from './actions';
export { weaponCards } from './weapons';
export { buildingCards } from './buildings';
export { questCards } from './quests';
export { counterCards } from './counters';
export { advanceCards } from './advances';
export { roleCards } from './roles';
export { uniqueCards } from './unique';
