/**
 * Action Validation System
 *
 * Validates that actions are legal before execution.
 * Checks game rules, turn restrictions, card requirements.
 */

import type { GameState, GameAction } from '../state/game';
import type { EntityId, PlayerIndex, GridPosition } from '../state/base';
import type { Card, ActionCard, ReactionCard, SummonCard } from '../state/cards';
import type { SummonUnit } from '../state/units';
import { getActionContext, canPlayerAct, canPlayCardAtSpeed } from './context';
import { canPlaySummon, canUnitAttack, canUnitMove, getRemainingMovement } from '../turns/action-phase';

/**
 * Result of validating an action.
 */
export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate any game action.
 */
export function validateAction(
  state: GameState,
  action: GameAction,
  player: PlayerIndex
): ValidationResult {
  // Check if player can act at all
  if (!canPlayerAct(state, player)) {
    return { valid: false, error: 'Not your turn to act' };
  }

  switch (action.type) {
    case 'SELECT':
      return validateSelectAction(state, action.entityId, action.selections, player);

    case 'PASS_PRIORITY':
      return validatePassPriority(state, player);

    case 'CONCEDE':
      // Concede is always valid
      return { valid: true };

    default:
      return { valid: false, error: 'Unknown action type' };
  }
}

/**
 * Validate a SELECT action.
 */
export function validateSelectAction(
  state: GameState,
  entityId: EntityId,
  _selections: unknown[] | undefined,
  player: PlayerIndex
): ValidationResult {
  const context = getActionContext(state);

  switch (context.type) {
    case 'awaiting_prompt_response':
      return validatePromptResponse(state, entityId, player);

    case 'action_phase_main':
      return validateMainPhaseSelect(state, entityId, player);

    case 'awaiting_stack_response':
      return validateStackResponse(state, entityId, player);

    case 'end_phase_discard':
      return validateDiscardSelect(state, entityId, player);

    default:
      return { valid: false, error: 'Cannot select in current context' };
  }
}

/**
 * Validate selection in response to a prompt.
 */
function validatePromptResponse(
  state: GameState,
  entityId: EntityId,
  player: PlayerIndex
): ValidationResult {
  const prompt = state.pendingPrompt;

  if (!prompt) {
    return { valid: false, error: 'No pending prompt' };
  }

  if (prompt.playerId !== player) {
    return { valid: false, error: 'Not your prompt to respond to' };
  }

  // Validate the selection matches the prompt type
  switch (prompt.prompt.type) {
    case 'unit':
      // Check if entityId refers to a valid unit
      const unit = findUnitByEntityId(state, entityId);
      if (!unit) {
        return { valid: false, error: 'Invalid unit selection' };
      }
      // TODO: Check filter expression if provided
      return { valid: true };

    case 'card':
      // Check if entityId refers to a card in hand
      const card = findCardInHand(state, player, entityId);
      if (!card) {
        return { valid: false, error: 'Card not in hand' };
      }
      return { valid: true };

    case 'position':
      // Position selections come through differently
      return { valid: true };

    case 'choice':
      // Choice validation
      if (prompt.prompt.choices && !prompt.prompt.choices.includes(entityId)) {
        return { valid: false, error: 'Invalid choice' };
      }
      return { valid: true };

    default:
      return { valid: true };
  }
}

/**
 * Validate selection during main action phase.
 */
function validateMainPhaseSelect(
  state: GameState,
  entityId: EntityId,
  player: PlayerIndex
): ValidationResult {
  // Check if selecting a card in hand
  const card = findCardInHand(state, player, entityId);
  if (card) {
    return validatePlayCard(state, card, player);
  }

  // Check if selecting a unit on the board
  const unit = findUnitByEntityId(state, entityId);
  if (unit) {
    return validateSelectUnit(state, unit, player);
  }

  // Check if selecting a face-down counter/reaction
  const inPlayCard = findInPlayCard(state, player, entityId);
  if (inPlayCard) {
    // Can activate face-down cards
    return { valid: true };
  }

  return { valid: false, error: 'Invalid selection' };
}

/**
 * Validate playing a card from hand.
 */
export function validatePlayCard(
  state: GameState,
  card: Card,
  player: PlayerIndex
): ValidationResult {
  switch (card.type) {
    case 'summon':
      return validatePlaySummon(state, card, player);

    case 'action':
      return validatePlayAction(state, card, player);

    case 'reaction':
      return validatePlayReaction(state, card, player);

    case 'counter':
      // Counters must be set face-down, not played directly
      return { valid: true }; // Allow setting

    case 'building':
      return validatePlayBuilding(state, player);

    case 'quest':
      return validatePlayQuest(state, player);

    default:
      return { valid: false, error: 'Cannot play this card type' };
  }
}

/**
 * Validate playing a summon card.
 */
function validatePlaySummon(
  state: GameState,
  _card: SummonCard,
  player: PlayerIndex
): ValidationResult {
  // Check if turn summon already used
  if (!canPlaySummon(state.turn)) {
    return { valid: false, error: 'Already played a summon this turn' };
  }

  // Check if player has a valid spawn position
  if (!hasValidSpawnPosition(state, player)) {
    return { valid: false, error: 'No valid spawn position available' };
  }

  return { valid: true };
}

/**
 * Validate playing an action card.
 */
function validatePlayAction(
  state: GameState,
  card: ActionCard,
  player: PlayerIndex
): ValidationResult {
  // Check speed is allowed
  if (!canPlayCardAtSpeed(state, player, card.speed)) {
    return { valid: false, error: `Cannot play ${card.speed} speed card now` };
  }

  // TODO: Check requirements
  // TODO: Check if valid targets exist

  return { valid: true };
}

/**
 * Validate playing a reaction card.
 */
function validatePlayReaction(
  state: GameState,
  card: ReactionCard,
  player: PlayerIndex
): ValidationResult {
  // Reactions can be played during action phase or as stack response
  if (!canPlayCardAtSpeed(state, player, 'reaction')) {
    return { valid: false, error: 'Cannot play reaction now' };
  }

  // TODO: Check requirements

  return { valid: true };
}

/**
 * Validate playing a building card.
 */
function validatePlayBuilding(
  state: GameState,
  player: PlayerIndex
): ValidationResult {
  // Check if player has valid placement position
  if (!hasValidBuildingPosition(state, player)) {
    return { valid: false, error: 'No valid position for building' };
  }

  return { valid: true };
}

/**
 * Validate playing a quest card.
 */
function validatePlayQuest(
  _state: GameState,
  _player: PlayerIndex
): ValidationResult {
  // Quests can generally be played if requirements are met
  // TODO: Check requirements
  return { valid: true };
}

/**
 * Validate selecting a unit.
 */
function validateSelectUnit(
  state: GameState,
  unit: SummonUnit,
  player: PlayerIndex
): ValidationResult {
  // Must own the unit
  if (unit.owner !== player) {
    return { valid: false, error: 'Cannot select opponent\'s unit' };
  }

  // Unit must be able to do something
  const canAttack = canUnitAttack(state.turn, unit.id);
  const canMove = canUnitMove(state.turn, unit.id);

  if (!canAttack && !canMove) {
    return { valid: false, error: 'Unit has no actions remaining' };
  }

  return { valid: true };
}

/**
 * Validate response to stack.
 */
function validateStackResponse(
  state: GameState,
  entityId: EntityId,
  player: PlayerIndex
): ValidationResult {
  // Check if this is a valid response card
  const card = findCardInHand(state, player, entityId);
  if (card && (card.type === 'reaction' || card.type === 'action')) {
    const actionCard = card as ActionCard | ReactionCard;
    if (!canPlayCardAtSpeed(state, player, actionCard.speed)) {
      return { valid: false, error: `Cannot play ${actionCard.speed} speed as response` };
    }
    return { valid: true };
  }

  // Check face-down counters
  const inPlayCard = findInPlayCard(state, player, entityId);
  if (inPlayCard && inPlayCard.faceDown && inPlayCard.card.type === 'counter') {
    return { valid: true };
  }

  return { valid: false, error: 'Invalid stack response' };
}

/**
 * Validate discard selection in end phase.
 */
function validateDiscardSelect(
  state: GameState,
  entityId: EntityId,
  player: PlayerIndex
): ValidationResult {
  // Must select a card from hand
  const card = findCardInHand(state, player, entityId);
  if (!card) {
    return { valid: false, error: 'Must select a card from hand to discard' };
  }

  return { valid: true };
}

/**
 * Validate PASS_PRIORITY action.
 */
export function validatePassPriority(
  state: GameState,
  player: PlayerIndex
): ValidationResult {
  const context = getActionContext(state);

  if (!context.canPass) {
    return { valid: false, error: 'Cannot pass in current context' };
  }

  if (context.inputPlayer !== player) {
    return { valid: false, error: 'Not your priority to pass' };
  }

  return { valid: true };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Find a unit by its entity ID.
 */
export function findUnitByEntityId(
  state: GameState,
  entityId: EntityId
): SummonUnit | null {
  for (const unit of state.board.units.values()) {
    // Compare as strings to handle branded type differences
    if (String(unit.entityId) === String(entityId) || String(unit.id) === String(entityId)) {
      return unit;
    }
  }
  return null;
}

/**
 * Find a card in player's hand by entity ID.
 */
export function findCardInHand(
  state: GameState,
  player: PlayerIndex,
  entityId: EntityId
): Card | null {
  const playerState = state.players[player];
  // Compare as strings to handle branded type differences
  return playerState.hand.find(c => String(c.id) === String(entityId)) ?? null;
}

/**
 * Find an in-play card by entity ID.
 */
export function findInPlayCard(
  state: GameState,
  player: PlayerIndex,
  entityId: EntityId
): { card: Card; faceDown: boolean; id: string } | null {
  const playerState = state.players[player];
  for (const inPlay of playerState.inPlay) {
    // Compare as strings to handle branded type differences
    if (String(inPlay.id) === String(entityId)) {
      return { card: inPlay.card, faceDown: inPlay.faceDown, id: String(inPlay.id) };
    }
  }
  return null;
}

/**
 * Check if player has a valid spawn position for summons.
 */
export function hasValidSpawnPosition(
  state: GameState,
  player: PlayerIndex
): boolean {
  const territoryRows = player === 0 ? [0, 1, 2] : [11, 12, 13];

  for (const y of territoryRows) {
    for (let x = 0; x < 12; x++) {
      const cell = state.board.cells[x][y];
      if (!cell.unitId && !cell.buildingId) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if player has a valid position for buildings.
 */
export function hasValidBuildingPosition(
  state: GameState,
  player: PlayerIndex
): boolean {
  // Buildings can be placed in territory (same as summons for now)
  return hasValidSpawnPosition(state, player);
}

/**
 * Validate a movement from one position to another.
 */
export function validateMovement(
  state: GameState,
  unitId: EntityId,
  from: GridPosition,
  to: GridPosition,
  player: PlayerIndex
): ValidationResult {
  const unit = findUnitByEntityId(state, unitId);

  if (!unit) {
    return { valid: false, error: 'Unit not found' };
  }

  if (unit.owner !== player) {
    return { valid: false, error: 'Not your unit' };
  }

  // Check movement remaining
  const remaining = getRemainingMovement(state.turn, unit.id);
  const distance = Math.abs(to.x - from.x) + Math.abs(to.y - from.y);

  if (distance > remaining) {
    return { valid: false, error: 'Not enough movement remaining' };
  }

  // Check destination is valid
  if (to.x < 0 || to.x >= 12 || to.y < 0 || to.y >= 14) {
    return { valid: false, error: 'Destination out of bounds' };
  }

  const destCell = state.board.cells[to.x][to.y];
  if (destCell.unitId || destCell.buildingId) {
    return { valid: false, error: 'Destination occupied' };
  }

  return { valid: true };
}

/**
 * Validate an attack from one unit to another.
 */
export function validateAttack(
  state: GameState,
  attackerId: EntityId,
  targetId: EntityId,
  player: PlayerIndex
): ValidationResult {
  const attacker = findUnitByEntityId(state, attackerId);
  const target = findUnitByEntityId(state, targetId);

  if (!attacker) {
    return { valid: false, error: 'Attacker not found' };
  }

  if (!target) {
    return { valid: false, error: 'Target not found' };
  }

  if (attacker.owner !== player) {
    return { valid: false, error: 'Not your unit' };
  }

  if (target.owner === player) {
    return { valid: false, error: 'Cannot attack own units' };
  }

  // Check if unit can attack
  if (!canUnitAttack(state.turn, attacker.id)) {
    return { valid: false, error: 'Unit has no attacks remaining' };
  }

  // Check range
  const weapon = attacker.equipment.weapon;
  const range = weapon?.attackRange ?? 1;
  const distance = Math.abs(target.position.x - attacker.position.x) +
                   Math.abs(target.position.y - attacker.position.y);

  if (distance > range) {
    return { valid: false, error: 'Target out of range' };
  }

  return { valid: true };
}
