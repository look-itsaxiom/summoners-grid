/**
 * Resolution System Exports
 *
 * The resolution system handles:
 * - Effect handler registry for processing different effect types
 * - Trigger system for conditional effect activation
 * - Stack resolution for LIFO effect processing with speed locks
 */

// Effect handler registry
export {
  effectHandlerRegistry,
  registerEffectHandlers,
  noopEffectHandler,
  logEffectHandler,
  type EffectHandler,
  type EffectContext,
  type EffectResult,
  type TriggeredEffect,
} from './effect-handlers';

// Trigger system
export {
  triggerRegistry,
  registerTriggerCheckers,
  collectActiveTriggers,
  checkTriggersForEvent,
  TRIGGER_EVENTS,
  type TriggerChecker,
  type TriggerContext,
  type TriggerCheckResult,
  type TriggerEventType,
  type RegisteredTrigger,
} from './triggers';

// Stack resolution
export {
  // Speed lock
  getNewSpeedLock,
  canPlaySpeed,
  getEmptyStackSpeedLock,

  // Stack manipulation
  generateEntryId,
  resetEntryCounter,
  createStackEntry,
  addToStack,
  passPriority,
  shouldResolve,
  isStackEmpty,

  // Resolution
  resolveTopEntry,
  resolveStack,
  createSeededRandom,

  // Response validation
  hasValidResponses,
  getValidResponses,

  type ResolveResult,
} from './stack';
