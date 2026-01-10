/**
 * Action Dispatch System
 *
 * The main entry point for processing player actions.
 * Validates actions, executes them, and returns updated state with events.
 */

import type { GameState, GameAction, DispatchResult, PendingPrompt } from '../state/game';
import type { KnownGameEvent } from '../state/events';
import type { EntityId, PlayerIndex, UnitId } from '../state/base';
import type { Selection } from '../state/effects';
import type { Card, SummonCard } from '../state/cards';
import type { PlayerState, InPlayCard } from '../state/player';
import type { SummonUnit } from '../state/units';
import { createEvent } from '../state/events';
import { getActionContext } from './context';
import { validateAction, findCardInHand, findUnitByEntityId, findInPlayCard } from './validation';
import { getRequiredSelections } from './selectables';
import {
  consumeTurnSummon,
  registerNewUnit,
} from '../turns/action-phase';
import { advancePhase } from '../turns/phases';
import { discardToHandLimit } from '../turns/end-phase';
import {
  passPriority as stackPassPriority,
  shouldResolve,
  resolveTopEntry,
  addToStack,
  createStackEntry,
} from '../resolution/stack';

/**
 * Generate a unique entity ID.
 */
function generateEntityId(prefix: string): EntityId {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}` as EntityId;
}

/**
 * Generate a unique unit ID.
 */
function generateUnitId(): UnitId {
  return `unit-${Date.now()}-${Math.random().toString(36).slice(2)}` as UnitId;
}

/**
 * Dispatch an action and return the result.
 * This is the main entry point for the game engine.
 */
export function dispatch(
  state: GameState,
  action: GameAction,
  player: PlayerIndex
): DispatchResult {
  // Validate the action
  const validation = validateAction(state, action, player);

  if (!validation.valid) {
    return {
      state,
      events: [],
      valid: false,
      error: validation.error,
    };
  }

  // Execute the action
  switch (action.type) {
    case 'SELECT':
      return executeSelect(state, action.entityId, action.selections, player);

    case 'PASS_PRIORITY':
      return executePassPriority(state, player);

    case 'CONCEDE':
      return executeConcede(state, player);

    default:
      return {
        state,
        events: [],
        valid: false,
        error: 'Unknown action type',
      };
  }
}

/**
 * Execute a SELECT action.
 */
function executeSelect(
  state: GameState,
  entityId: EntityId,
  selections: Selection[] | undefined,
  player: PlayerIndex
): DispatchResult {
  const context = getActionContext(state);

  switch (context.type) {
    case 'awaiting_prompt_response':
      return executePromptResponse(state, entityId, player);

    case 'action_phase_main':
      return executeMainPhaseSelect(state, entityId, selections, player);

    case 'awaiting_stack_response':
      return executeStackResponse(state, entityId, selections, player);

    case 'end_phase_discard':
      return executeDiscard(state, entityId, player);

    default:
      return {
        state,
        events: [],
        valid: false,
        error: 'Cannot select in current context',
      };
  }
}

/**
 * Execute selection in response to a prompt.
 */
function executePromptResponse(
  state: GameState,
  entityId: EntityId,
  player: PlayerIndex
): DispatchResult {
  const prompt = state.pendingPrompt;
  const events: KnownGameEvent[] = [];

  if (!prompt) {
    return { state, events, valid: false, error: 'No pending prompt' };
  }

  // Record the selection
  events.push(
    createEvent<KnownGameEvent>('SELECTION_MADE', {
      player,
      promptId: prompt.prompt.id,
      selection: entityId,
    })
  );

  // Clear the prompt
  const newState: GameState = {
    ...state,
    pendingPrompt: null,
  };

  return {
    state: newState,
    events,
    valid: true,
  };
}

/**
 * Execute selection during main action phase.
 */
function executeMainPhaseSelect(
  state: GameState,
  entityId: EntityId,
  selections: Selection[] | undefined,
  player: PlayerIndex
): DispatchResult {
  // Check what was selected - try to match by ID (cards use string IDs)
  const card = findCardInHandByAnyId(state, player, entityId);
  if (card) {
    return executePlayCard(state, card, selections, player);
  }

  const unit = findUnitByEntityId(state, entityId);
  if (unit && unit.owner === player) {
    return executeSelectUnit(state, unit, player);
  }

  const inPlayCard = findInPlayCardByAnyId(state, player, entityId);
  if (inPlayCard) {
    return executeActivateInPlayCard(state, inPlayCard, player);
  }

  return {
    state,
    events: [],
    valid: false,
    error: 'Invalid selection',
  };
}

/**
 * Find a card in hand by entity ID (comparing as strings).
 */
function findCardInHandByAnyId(
  state: GameState,
  player: PlayerIndex,
  entityId: EntityId
): Card | null {
  const playerState = state.players[player];
  // Compare as strings to handle branded type differences
  return playerState.hand.find(c => String(c.id) === String(entityId)) ?? null;
}

/**
 * Find an in-play card by any ID.
 */
function findInPlayCardByAnyId(
  state: GameState,
  player: PlayerIndex,
  entityId: EntityId
): InPlayCard | null {
  const playerState = state.players[player];
  return playerState.inPlay.find(ip => String(ip.id) === String(entityId)) ?? null;
}

/**
 * Execute playing a card from hand.
 */
function executePlayCard(
  state: GameState,
  card: Card,
  selections: Selection[] | undefined,
  player: PlayerIndex
): DispatchResult {
  const events: KnownGameEvent[] = [];

  // Check if we need selections
  const requiredSelections = getRequiredSelections(state, card.id as unknown as EntityId, player);

  if (requiredSelections.length > 0 && (!selections || selections.length < requiredSelections.length)) {
    // Need to prompt for selections
    const nextPrompt = requiredSelections[selections?.length ?? 0];
    const pendingPrompt: PendingPrompt = {
      playerId: player,
      prompt: nextPrompt,
      context: {
        sourceEntityId: card.id as unknown as EntityId,
        forEffect: `play_${card.type}`,
      },
    };

    return {
      state: { ...state, pendingPrompt },
      events,
      valid: true,
    };
  }

  // Execute based on card type
  switch (card.type) {
    case 'summon':
      return executePlaySummon(state, card, selections, player);

    case 'action':
    case 'reaction':
      return executePlayActionCard(state, card, selections, player);

    case 'counter':
      return executeSetCounter(state, card, player);

    case 'building':
      return executePlayBuilding(state, card, selections, player);

    case 'quest':
      return executePlayQuest(state, card, player);

    default:
      return {
        state,
        events,
        valid: false,
        error: 'Cannot play this card type',
      };
  }
}

/**
 * Execute playing a summon card.
 */
function executePlaySummon(
  state: GameState,
  card: SummonCard,
  selections: Selection[] | undefined,
  player: PlayerIndex
): DispatchResult {
  const events: KnownGameEvent[] = [];

  // Get spawn position from selections
  const posSelection = selections?.[0] as { x: number; y: number } | undefined;
  if (!posSelection) {
    return { state, events, valid: false, error: 'No spawn position selected' };
  }

  // Create the unit IDs
  const unitId = generateUnitId();
  const entityId = generateEntityId('entity');

  // Remove card from hand
  const playerState = state.players[player];
  const newHand = playerState.hand.filter(c => c.id !== card.id);

  // Create in-play entry
  const inPlayEntry: InPlayCard = {
    id: entityId,
    card: card,
    faceDown: false,
    linkedEntityId: entityId,
  };

  const newInPlay: InPlayCard[] = [...playerState.inPlay, inPlayEntry];

  // Calculate initial stats
  const { calculateStats, calculateMaxHp } = require('../stats/calculate');
  const baseRole = {
    name: 'Base',
    family: 'warrior' as const,
    tier: 1 as const,
    statModifiers: {},
    passiveEffects: [],
    abilities: [],
  };
  const calculatedStats = calculateStats(
    card.baseStats,
    card.growthRates,
    5,
    baseRole,
    { weapon: null, offhand: null, armor: null, accessory: null }
  );
  const maxHp = calculateMaxHp(calculatedStats.END);

  // Create unit
  const newUnit: SummonUnit = {
    id: unitId,
    entityId,
    owner: player,
    position: posSelection,
    summon: card,
    role: baseRole,
    equipment: {
      weapon: null,
      offhand: null,
      armor: null,
      accessory: null,
    },
    level: 5,
    currentHp: maxHp,
    maxHp,
    calculatedStats,
    statusEffects: [],
    completedQuests: [],
    cooldowns: new Map(),
  };

  // Update board
  const newUnits = new Map(state.board.units);
  newUnits.set(unitId, newUnit);

  const newCells = state.board.cells.map(col => [...col]);
  newCells[posSelection.x][posSelection.y] = {
    ...newCells[posSelection.x][posSelection.y],
    unitId,
  };

  // Update turn state
  let newTurn = consumeTurnSummon(state.turn);
  newTurn = registerNewUnit(newTurn, newUnit);

  // Update players
  const newPlayers: [PlayerState, PlayerState] = [...state.players] as [PlayerState, PlayerState];
  newPlayers[player] = {
    ...playerState,
    hand: newHand,
    inPlay: newInPlay,
  };

  events.push(
    createEvent<KnownGameEvent>('SUMMON_PLAYED', {
      player,
      cardId: card.id,
      unitId: unitId,
      position: posSelection,
    })
  );

  return {
    state: {
      ...state,
      players: newPlayers,
      board: {
        ...state.board,
        cells: newCells,
        units: newUnits,
      },
      turn: newTurn,
    },
    events,
    valid: true,
  };
}

/**
 * Execute playing an action/reaction card.
 */
function executePlayActionCard(
  state: GameState,
  card: Card,
  selections: Selection[] | undefined,
  player: PlayerIndex
): DispatchResult {
  const events: KnownGameEvent[] = [];

  if (card.type !== 'action' && card.type !== 'reaction') {
    return { state, events, valid: false, error: 'Not an action card' };
  }

  // Build selection map
  const selectionMap: Record<string, Selection> = {};
  const prompts = card.selectionPrompts;
  if (selections && prompts) {
    for (let i = 0; i < Math.min(selections.length, prompts.length); i++) {
      selectionMap[prompts[i].id] = selections[i];
    }
  }

  // Create stack entry
  const entry = createStackEntry(
    generateEntityId('effect'),
    card.effects,
    card.speed,
    selectionMap,
    card.id
  );

  // Remove card from hand
  const playerState = state.players[player];
  const newHand = playerState.hand.filter(c => c.id !== card.id);

  const newPlayers: [PlayerState, PlayerState] = [...state.players] as [PlayerState, PlayerState];
  newPlayers[player] = {
    ...playerState,
    hand: newHand,
  };

  // Add to stack
  const newStack = addToStack(state.stack, entry, player);

  events.push(
    createEvent<KnownGameEvent>('CARD_PLAYED', {
      player,
      cardId: card.id,
      cardType: card.type,
    })
  );

  return {
    state: {
      ...state,
      players: newPlayers,
      stack: newStack,
    },
    events,
    valid: true,
  };
}

/**
 * Execute setting a counter face-down.
 */
function executeSetCounter(
  state: GameState,
  card: Card,
  player: PlayerIndex
): DispatchResult {
  const events: KnownGameEvent[] = [];

  // Remove from hand
  const playerState = state.players[player];
  const newHand = playerState.hand.filter(c => c.id !== card.id);

  // Add to in-play face-down
  const inPlayEntry: InPlayCard = {
    id: generateEntityId('inplay'),
    card,
    faceDown: true,
  };

  const newInPlay: InPlayCard[] = [...playerState.inPlay, inPlayEntry];

  const newPlayers: [PlayerState, PlayerState] = [...state.players] as [PlayerState, PlayerState];
  newPlayers[player] = {
    ...playerState,
    hand: newHand,
    inPlay: newInPlay,
  };

  events.push(
    createEvent<KnownGameEvent>('CARD_SET', {
      player,
      cardId: card.id,
    })
  );

  return {
    state: {
      ...state,
      players: newPlayers,
    },
    events,
    valid: true,
  };
}

/**
 * Execute playing a building card.
 */
function executePlayBuilding(
  state: GameState,
  card: Card,
  selections: Selection[] | undefined,
  player: PlayerIndex
): DispatchResult {
  const events: KnownGameEvent[] = [];

  // Get position from selections
  const posSelection = selections?.[0] as { x: number; y: number } | undefined;
  if (!posSelection) {
    return { state, events, valid: false, error: 'No position selected' };
  }

  // Create building entity
  const buildingId = generateEntityId('building');

  // Remove card from hand
  const playerState = state.players[player];
  const newHand = playerState.hand.filter(c => c.id !== card.id);

  // Add building to board
  const newBuildings = new Map(state.board.buildings);
  newBuildings.set(buildingId, {
    id: buildingId,
    owner: player,
    position: posSelection,
    cardId: card.id,
  });

  const newCells = state.board.cells.map(col => [...col]);
  newCells[posSelection.x][posSelection.y] = {
    ...newCells[posSelection.x][posSelection.y],
    buildingId,
  };

  // Add to in-play
  const inPlayEntry: InPlayCard = {
    id: generateEntityId('inplay'),
    card,
    faceDown: false,
    linkedEntityId: buildingId,
  };

  const newInPlay: InPlayCard[] = [...playerState.inPlay, inPlayEntry];

  const newPlayers: [PlayerState, PlayerState] = [...state.players] as [PlayerState, PlayerState];
  newPlayers[player] = {
    ...playerState,
    hand: newHand,
    inPlay: newInPlay,
  };

  events.push(
    createEvent<KnownGameEvent>('BUILDING_PLAYED', {
      player,
      cardId: card.id,
      buildingId,
      position: posSelection,
    })
  );

  return {
    state: {
      ...state,
      players: newPlayers,
      board: {
        ...state.board,
        cells: newCells,
        buildings: newBuildings,
      },
    },
    events,
    valid: true,
  };
}

/**
 * Execute playing a quest card.
 */
function executePlayQuest(
  state: GameState,
  card: Card,
  player: PlayerIndex
): DispatchResult {
  const events: KnownGameEvent[] = [];

  // Remove from hand
  const playerState = state.players[player];
  const newHand = playerState.hand.filter(c => c.id !== card.id);

  // Add to in-play
  const inPlayEntry: InPlayCard = {
    id: generateEntityId('inplay'),
    card,
    faceDown: false,
  };

  const newInPlay: InPlayCard[] = [...playerState.inPlay, inPlayEntry];

  const newPlayers: [PlayerState, PlayerState] = [...state.players] as [PlayerState, PlayerState];
  newPlayers[player] = {
    ...playerState,
    hand: newHand,
    inPlay: newInPlay,
  };

  events.push(
    createEvent<KnownGameEvent>('QUEST_PLAYED', {
      player,
      cardId: card.id,
    })
  );

  return {
    state: {
      ...state,
      players: newPlayers,
    },
    events,
    valid: true,
  };
}

/**
 * Execute selecting a unit for action.
 */
function executeSelectUnit(
  state: GameState,
  _unit: SummonUnit,
  _player: PlayerIndex
): DispatchResult {
  // This creates a pending prompt for what to do with the unit
  // For now, return state unchanged - need selections to proceed

  return {
    state,
    events: [],
    valid: true,
  };
}

/**
 * Execute activating a face-down card.
 */
function executeActivateInPlayCard(
  state: GameState,
  inPlayCard: InPlayCard,
  player: PlayerIndex
): DispatchResult {
  const events: KnownGameEvent[] = [];

  if (!inPlayCard.faceDown) {
    return { state, events, valid: false, error: 'Card is not face-down' };
  }

  // Flip face-up
  const playerState = state.players[player];
  const newInPlay = playerState.inPlay.map(ip =>
    ip.id === inPlayCard.id ? { ...ip, faceDown: false } : ip
  );

  const newPlayers: [PlayerState, PlayerState] = [...state.players] as [PlayerState, PlayerState];
  newPlayers[player] = {
    ...playerState,
    inPlay: newInPlay,
  };

  events.push(
    createEvent<KnownGameEvent>('CARD_REVEALED', {
      player,
      cardId: inPlayCard.card.id,
    })
  );

  // If counter, add effects to stack
  if (inPlayCard.card.type === 'counter') {
    const entry = createStackEntry(
      inPlayCard.id,
      inPlayCard.card.effects,
      'counter'
    );
    const newStack = addToStack(state.stack, entry, player);

    return {
      state: {
        ...state,
        players: newPlayers,
        stack: newStack,
      },
      events,
      valid: true,
    };
  }

  return {
    state: {
      ...state,
      players: newPlayers,
    },
    events,
    valid: true,
  };
}

/**
 * Execute stack response selection.
 */
function executeStackResponse(
  state: GameState,
  entityId: EntityId,
  selections: Selection[] | undefined,
  player: PlayerIndex
): DispatchResult {
  // Check if this is a card response
  const card = findCardInHandByAnyId(state, player, entityId);
  if (card && (card.type === 'action' || card.type === 'reaction')) {
    return executePlayActionCard(state, card, selections, player);
  }

  // Check if activating a counter
  const inPlayCard = findInPlayCardByAnyId(state, player, entityId);
  if (inPlayCard && inPlayCard.faceDown) {
    return executeActivateInPlayCard(state, inPlayCard, player);
  }

  return {
    state,
    events: [],
    valid: false,
    error: 'Invalid stack response',
  };
}

/**
 * Execute discard during end phase.
 */
function executeDiscard(
  state: GameState,
  entityId: EntityId,
  player: PlayerIndex
): DispatchResult {
  const events: KnownGameEvent[] = [];

  const playerState = state.players[player];
  const cardIndex = playerState.hand.findIndex(c => String(c.id) === String(entityId));

  if (cardIndex === -1) {
    return { state, events, valid: false, error: 'Card not in hand' };
  }

  // Use discardToHandLimit with specific index
  const result = discardToHandLimit(playerState, player, [cardIndex]);

  const newPlayers: [PlayerState, PlayerState] = [...state.players] as [PlayerState, PlayerState];
  newPlayers[player] = result.player;

  events.push(...result.events);

  return {
    state: {
      ...state,
      players: newPlayers,
    },
    events,
    valid: true,
  };
}

/**
 * Execute PASS_PRIORITY action.
 */
function executePassPriority(
  state: GameState,
  player: PlayerIndex
): DispatchResult {
  const context = getActionContext(state);
  const events: KnownGameEvent[] = [];

  events.push(
    createEvent<KnownGameEvent>('PRIORITY_PASSED', {
      player,
    })
  );

  // If in stack response context, pass priority on stack
  if (context.type === 'awaiting_stack_response') {
    const newStack = stackPassPriority(state.stack, player);
    let newState = { ...state, stack: newStack };

    // Check if we should resolve
    if (shouldResolve(newStack)) {
      const resolveResult = resolveTopEntry(newState);
      if (resolveResult.success) {
        newState = resolveResult.state;
        events.push(...resolveResult.events);
      }
    }

    return {
      state: newState,
      events,
      valid: true,
    };
  }

  // If in main action phase, advance to end phase
  if (context.type === 'action_phase_main') {
    const phaseResult = advancePhase(state);

    if (phaseResult.success) {
      events.push(...phaseResult.events);
      return {
        state: phaseResult.state,
        events,
        valid: true,
      };
    }
  }

  return {
    state,
    events,
    valid: true,
  };
}

/**
 * Execute CONCEDE action.
 */
function executeConcede(
  state: GameState,
  player: PlayerIndex
): DispatchResult {
  const events: KnownGameEvent[] = [];
  const winner = (1 - player) as PlayerIndex;

  events.push(
    createEvent<KnownGameEvent>('PLAYER_CONCEDED', {
      player,
    })
  );

  events.push(
    createEvent<KnownGameEvent>('GAME_END', {
      winner,
      reason: 'concession',
    })
  );

  return {
    state: {
      ...state,
      winner,
      gamePhase: 'ended',
    },
    events,
    valid: true,
  };
}
