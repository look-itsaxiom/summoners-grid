/**
 * Action Dispatch System
 *
 * Handles player actions, validation, and context-based interpretation.
 * The minimal action types (SELECT, PASS_PRIORITY, CONCEDE) are interpreted
 * based on the current game context.
 *
 * @module actions
 */

// Context determination
export {
  type ActionContextType,
  type ActionContext,
  type ExpectedSelectionType,
  getActionContext,
  canPlayerAct,
  canPlayCardAtSpeed,
  getExpectedSelectionType,
} from './context';

// Action validation
export {
  type ValidationResult,
  validateAction,
  validateSelectAction,
  validatePlayCard,
  validatePassPriority,
  validateMovement,
  validateAttack,
  findUnitByEntityId,
  findCardInHand,
  findInPlayCard,
  hasValidSpawnPosition,
  hasValidBuildingPosition,
} from './validation';

// Selectable entities
export {
  type SelectableEntities,
  getSelectableEntities,
  getRequiredSelections,
  getLegalActions,
} from './selectables';

// Action dispatch
export { dispatch } from './dispatch';
