/**
 * Turn System
 *
 * Manages the flow of turns and phases in the game.
 * Turn structure: Draw → Level → Action → End
 *
 * @module turns
 */

// Draw Phase
export {
  type DrawResult,
  shuffleArray,
  drawCard,
  drawMultipleCards,
  executeDrawPhase,
} from './draw-phase';

// Level Phase
export {
  type LevelUpResult,
  levelUpSingleUnit,
  getPlayerUnits,
  executeLevelPhase,
  applyBonusLevels,
} from './level-phase';

// Action Phase
export {
  type UnitActionSummary,
  canUnitAttack,
  canUnitMove,
  getRemainingMovement,
  canPlaySummon,
  canUnitUseAbility,
  consumeAttack,
  consumeMovement,
  consumeTurnSummon,
  consumeAbility,
  grantExtraAttacks,
  grantExtraMovement,
  registerNewUnit,
  initializeUnitActions,
  getUnitActionSummary,
  getUnitsWithActionsRemaining,
} from './action-phase';

// End Phase
export {
  MAX_HAND_SIZE,
  type DiscardResult,
  discardToHandLimit,
  executeEndPhase,
  canCompleteEndPhase,
  prepareNextTurn,
} from './end-phase';

// Phase Transitions
export {
  type PhaseTransitionResult,
  getNextPhase,
  canAdvancePhase,
  enterPhase,
  advancePhase,
  runAutomaticPhases,
  startGame,
} from './phases';
