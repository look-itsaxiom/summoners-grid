/**
 * Selectable Entities System
 *
 * Determines what entities can be selected in the current game state.
 * This drives the UI highlighting and action availability.
 */

import type { GameState } from '../state/game';
import type { EntityId, PlayerIndex, GridPosition } from '../state/base';
import type { SelectionPrompt } from '../state/effects';
import type { Card } from '../state/cards';
import type { SummonUnit } from '../state/units';
import { getActionContext, type ActionContext } from './context';
import {
  validatePlayCard,
  findUnitByEntityId,
  hasValidSpawnPosition,
} from './validation';
import {
  canUnitAttack,
  canUnitMove,
  canPlaySummon,
  canUnitUseAbility,
} from '../turns/action-phase';
import { canPlaySpeed } from '../resolution/stack';

/**
 * Categories of selectable things.
 */
export interface SelectableEntities {
  /** Cards in hand that can be played */
  playableCards: EntityId[];
  /** Units that can be selected for actions */
  selectableUnits: EntityId[];
  /** Grid positions that can be selected */
  selectablePositions: GridPosition[];
  /** Face-down cards that can be activated */
  activatableCards: EntityId[];
  /** Choices for choice prompts */
  choices: string[];
}

/**
 * Get all entities that can be selected by a player.
 */
export function getSelectableEntities(
  state: GameState,
  player: PlayerIndex
): SelectableEntities {
  const context = getActionContext(state);

  // If not this player's turn to act, nothing is selectable
  if (context.inputPlayer !== player) {
    return emptySelectables();
  }

  switch (context.type) {
    case 'action_phase_main':
      return getMainPhaseSelectables(state, player);

    case 'awaiting_stack_response':
      return getStackResponseSelectables(state, player, context);

    case 'awaiting_prompt_response':
      return getPromptResponseSelectables(state, player);

    case 'end_phase_discard':
      return getDiscardSelectables(state, player);

    default:
      return emptySelectables();
  }
}

/**
 * Get selectables during main action phase.
 */
function getMainPhaseSelectables(
  state: GameState,
  player: PlayerIndex
): SelectableEntities {
  const result = emptySelectables();
  const playerState = state.players[player];

  // Playable cards in hand
  for (const card of playerState.hand) {
    if (validatePlayCard(state, card, player).valid) {
      result.playableCards.push(card.id as unknown as EntityId);
    }
  }

  // Selectable units (own units that can act)
  for (const unit of state.board.units.values()) {
    if (unit.owner === player) {
      const hasAttacks = canUnitAttack(state.turn, unit.id);
      const hasMovement = canUnitMove(state.turn, unit.id);
      const hasAbility = canUnitUseAbility(state.turn, unit.id);

      if (hasAttacks || hasMovement || hasAbility) {
        result.selectableUnits.push(unit.entityId);
      }
    }
  }

  // Face-down cards that can be activated
  for (const inPlay of playerState.inPlay) {
    if (inPlay.faceDown) {
      // Can activate face-down counters/reactions
      result.activatableCards.push(inPlay.id);
    }
  }

  return result;
}

/**
 * Get selectables when responding to the stack.
 */
function getStackResponseSelectables(
  state: GameState,
  player: PlayerIndex,
  context: ActionContext
): SelectableEntities {
  const result = emptySelectables();
  const playerState = state.players[player];

  // Cards in hand that can respond
  for (const card of playerState.hand) {
    if (card.type === 'reaction') {
      if (canPlaySpeed(context.speedLock, 'reaction')) {
        result.playableCards.push(card.id as unknown as EntityId);
      }
    }
    if (card.type === 'action' && 'speed' in card) {
      if (canPlaySpeed(context.speedLock, card.speed)) {
        result.playableCards.push(card.id as unknown as EntityId);
      }
    }
  }

  // Face-down counters
  for (const inPlay of playerState.inPlay) {
    if (inPlay.faceDown && inPlay.card.type === 'counter') {
      if (canPlaySpeed(context.speedLock, 'counter')) {
        result.activatableCards.push(inPlay.id);
      }
    }
  }

  return result;
}

/**
 * Get selectables when responding to a prompt.
 */
function getPromptResponseSelectables(
  state: GameState,
  player: PlayerIndex
): SelectableEntities {
  const result = emptySelectables();
  const prompt = state.pendingPrompt;

  if (!prompt || prompt.playerId !== player) {
    return result;
  }

  switch (prompt.prompt.type) {
    case 'unit':
      // Add all valid unit targets
      for (const unit of state.board.units.values()) {
        if (matchesUnitFilter(state, unit, prompt.prompt.filter, player)) {
          result.selectableUnits.push(unit.entityId);
        }
      }
      break;

    case 'card':
      // Add valid cards from hand
      const playerState = state.players[player];
      for (const card of playerState.hand) {
        if (matchesCardFilter(state, card, prompt.prompt.filter, player)) {
          result.playableCards.push(card.id as unknown as EntityId);
        }
      }
      break;

    case 'position':
      // Add valid grid positions
      result.selectablePositions = getValidPositions(state, prompt.prompt.filter, player);
      break;

    case 'choice':
      // Add choices
      if (prompt.prompt.choices) {
        result.choices = [...prompt.prompt.choices];
      }
      break;
  }

  return result;
}

/**
 * Get selectables when discarding in end phase.
 */
function getDiscardSelectables(
  state: GameState,
  player: PlayerIndex
): SelectableEntities {
  const result = emptySelectables();
  const playerState = state.players[player];

  // All cards in hand can be discarded
  for (const card of playerState.hand) {
    result.playableCards.push(card.id as unknown as EntityId);
  }

  return result;
}

// ============================================================================
// Filter Matching
// ============================================================================

/**
 * Check if a unit matches a filter expression.
 * Filter syntax: "own", "enemy", "role.family == 'magician'", etc.
 */
function matchesUnitFilter(
  state: GameState,
  unit: SummonUnit,
  filter: string | undefined,
  player: PlayerIndex
): boolean {
  if (!filter) {
    return true;
  }

  // Parse simple filter expressions
  const conditions = filter.split('&&').map(s => s.trim());

  for (const condition of conditions) {
    if (condition === 'own') {
      if (unit.owner !== player) return false;
    } else if (condition === 'enemy') {
      if (unit.owner === player) return false;
    } else if (condition.startsWith('role.family')) {
      // Parse role.family == 'value'
      const match = condition.match(/role\.family\s*==\s*['"](\w+)['"]/);
      if (match) {
        if (unit.role.family !== match[1]) return false;
      }
    } else if (condition.startsWith('role.tier')) {
      // Parse role.tier >= value
      const match = condition.match(/role\.tier\s*(>=|<=|==|>|<)\s*(\d+)/);
      if (match) {
        const op = match[1];
        const value = parseInt(match[2]);
        const tier = unit.role.tier;
        switch (op) {
          case '>=': if (!(tier >= value)) return false; break;
          case '<=': if (!(tier <= value)) return false; break;
          case '==': if (!(tier === value)) return false; break;
          case '>': if (!(tier > value)) return false; break;
          case '<': if (!(tier < value)) return false; break;
        }
      }
    }
  }

  return true;
}

/**
 * Check if a card matches a filter expression.
 */
function matchesCardFilter(
  _state: GameState,
  card: Card,
  filter: string | undefined,
  _player: PlayerIndex
): boolean {
  if (!filter) {
    return true;
  }

  // Parse simple filter expressions
  const conditions = filter.split('&&').map(s => s.trim());

  for (const condition of conditions) {
    if (condition.startsWith('type')) {
      const match = condition.match(/type\s*==\s*['"](\w+)['"]/);
      if (match) {
        if (card.type !== match[1]) return false;
      }
    } else if (condition.startsWith('attribute')) {
      const match = condition.match(/attribute\s*==\s*['"](\w+)['"]/);
      if (match) {
        if (card.attribute !== match[1]) return false;
      }
    }
  }

  return true;
}

/**
 * Get valid grid positions based on filter.
 */
function getValidPositions(
  state: GameState,
  filter: string | undefined,
  player: PlayerIndex
): GridPosition[] {
  const positions: GridPosition[] = [];

  for (let x = 0; x < 12; x++) {
    for (let y = 0; y < 14; y++) {
      if (matchesPositionFilter(state, { x, y }, filter, player)) {
        positions.push({ x, y });
      }
    }
  }

  return positions;
}

/**
 * Check if a position matches a filter.
 */
function matchesPositionFilter(
  state: GameState,
  pos: GridPosition,
  filter: string | undefined,
  player: PlayerIndex
): boolean {
  const cell = state.board.cells[pos.x][pos.y];

  if (!filter) {
    // Default: empty cells only
    return !cell.unitId && !cell.buildingId;
  }

  const conditions = filter.split('&&').map(s => s.trim());

  for (const condition of conditions) {
    if (condition === 'empty') {
      if (cell.unitId || cell.buildingId) return false;
    } else if (condition === 'own_territory') {
      if (cell.territory !== player) return false;
    } else if (condition === 'enemy_territory') {
      if (cell.territory !== (1 - player)) return false;
    } else if (condition === 'has_unit') {
      if (!cell.unitId) return false;
    } else if (condition === 'has_own_unit') {
      if (!cell.unitId) return false;
      const unit = state.board.units.get(cell.unitId);
      if (!unit || unit.owner !== player) return false;
    } else if (condition === 'has_enemy_unit') {
      if (!cell.unitId) return false;
      const unit = state.board.units.get(cell.unitId);
      if (!unit || unit.owner === player) return false;
    }
  }

  return true;
}

// ============================================================================
// Required Selections
// ============================================================================

/**
 * Get the required selections for playing/activating an entity.
 */
export function getRequiredSelections(
  state: GameState,
  entityId: EntityId,
  player: PlayerIndex
): SelectionPrompt[] {
  // Check if this is a card in hand (compare as strings)
  const card = state.players[player].hand.find(c => String(c.id) === String(entityId));
  if (card) {
    return getCardSelectionPrompts(state, card, player);
  }

  // Check if this is a unit
  const unit = findUnitByEntityId(state, entityId);
  if (unit && unit.owner === player) {
    return getUnitSelectionPrompts(state, unit);
  }

  // Check if this is an in-play card (compare as strings)
  const inPlay = state.players[player].inPlay.find(ip => String(ip.id) === String(entityId));
  if (inPlay) {
    return getCardSelectionPrompts(state, inPlay.card, player);
  }

  return [];
}

/**
 * Get selection prompts for a card.
 */
function getCardSelectionPrompts(
  state: GameState,
  card: Card,
  player: PlayerIndex
): SelectionPrompt[] {
  switch (card.type) {
    case 'summon':
      // Summon needs spawn position
      if (!canPlaySummon(state.turn)) {
        return [];
      }
      return [{
        id: 'spawn_position',
        type: 'position',
        filter: 'empty && own_territory',
      }];

    case 'action':
    case 'reaction':
      return card.selectionPrompts;

    case 'building':
      return [{
        id: 'build_position',
        type: 'position',
        filter: 'empty && own_territory',
      }];

    case 'quest':
      // Quests don't need selections to play
      return [];

    case 'counter':
      // Counters are set face-down, no selection needed
      return [];

    default:
      return [];
  }
}

/**
 * Get selection prompts for a unit action.
 */
function getUnitSelectionPrompts(
  state: GameState,
  unit: SummonUnit
): SelectionPrompt[] {
  const prompts: SelectionPrompt[] = [];

  // If unit can move, prompt for destination
  if (canUnitMove(state.turn, unit.id)) {
    prompts.push({
      id: 'move_destination',
      type: 'position',
      filter: 'empty',
      optional: true,
    });
  }

  // If unit can attack, prompt for target
  if (canUnitAttack(state.turn, unit.id)) {
    prompts.push({
      id: 'attack_target',
      type: 'unit',
      filter: 'enemy',
      optional: true,
    });
  }

  return prompts;
}

/**
 * Create empty selectables object.
 */
function emptySelectables(): SelectableEntities {
  return {
    playableCards: [],
    selectableUnits: [],
    selectablePositions: [],
    activatableCards: [],
    choices: [],
  };
}

/**
 * Get all legal actions from the current state.
 * Returns a simplified list of what actions are possible.
 */
export function getLegalActions(
  state: GameState,
  player: PlayerIndex
): { type: string; entityId?: EntityId }[] {
  const context = getActionContext(state);
  const actions: { type: string; entityId?: EntityId }[] = [];

  if (context.inputPlayer !== player) {
    return actions;
  }

  const selectables = getSelectableEntities(state, player);

  // Add SELECT actions for all selectables
  for (const cardId of selectables.playableCards) {
    actions.push({ type: 'SELECT', entityId: cardId });
  }
  for (const unitId of selectables.selectableUnits) {
    actions.push({ type: 'SELECT', entityId: unitId });
  }
  for (const cardId of selectables.activatableCards) {
    actions.push({ type: 'SELECT', entityId: cardId });
  }

  // Add PASS_PRIORITY if allowed
  if (context.canPass) {
    actions.push({ type: 'PASS_PRIORITY' });
  }

  // CONCEDE is always available
  actions.push({ type: 'CONCEDE' });

  return actions;
}
