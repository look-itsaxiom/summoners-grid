// ============================================================================
// WEBSOCKET MESSAGE TYPES
// ============================================================================

import { GameState, CombatTarget, Position } from './shared-types.js';

/**
 * Base WebSocket message structure
 */
export interface BaseWebSocketMessage {
  type: string;
  timestamp: Date;
  messageId: string;
}

/**
 * WebSocket message with data payload
 */
export interface WebSocketMessage<T = any> extends BaseWebSocketMessage {
  data: T;
}

/**
 * WebSocket error message
 */
export interface WebSocketErrorMessage extends BaseWebSocketMessage {
  type: 'ERROR';
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

// ============================================================================
// CONNECTION MANAGEMENT MESSAGES
// ============================================================================

/**
 * Client authentication message
 */
export interface AuthenticateMessage extends BaseWebSocketMessage {
  type: 'AUTHENTICATE';
  token: string;
}

/**
 * Authentication success response
 */
export interface AuthenticatedMessage extends WebSocketMessage {
  type: 'AUTHENTICATED';
  data: {
    userId: string;
    username: string;
    sessionId: string;
  };
}

/**
 * Heartbeat ping message
 */
export interface PingMessage extends BaseWebSocketMessage {
  type: 'PING';
}

/**
 * Heartbeat pong response
 */
export interface PongMessage extends BaseWebSocketMessage {
  type: 'PONG';
}

/**
 * Client disconnect notification
 */
export interface DisconnectMessage extends BaseWebSocketMessage {
  type: 'DISCONNECT';
  reason?: string;
}

// ============================================================================
// MATCHMAKING MESSAGES
// ============================================================================

/**
 * Join matchmaking queue
 */
export interface JoinQueueMessage extends WebSocketMessage {
  type: 'JOIN_QUEUE';
  data: {
    gameMode: 'RANKED' | 'CASUAL' | 'PRIVATE';
    format: '3v3';
    deckId: string;
  };
}

/**
 * Leave matchmaking queue
 */
export interface LeaveQueueMessage extends BaseWebSocketMessage {
  type: 'LEAVE_QUEUE';
}

/**
 * Queue status update
 */
export interface QueueStatusMessage extends WebSocketMessage {
  type: 'QUEUE_STATUS';
  data: {
    inQueue: boolean;
    queueTime?: number;
    estimatedWaitTime?: number;
    playersInQueue?: number;
  };
}

/**
 * Match found notification
 */
export interface MatchFoundMessage extends WebSocketMessage {
  type: 'MATCH_FOUND';
  data: {
    gameId: string;
    opponent: {
      id: string;
      username: string;
      level: number;
      rating: number;
    };
    gameMode: string;
    format: string;
    timeToAccept: number; // Seconds
  };
}

/**
 * Match acceptance response
 */
export interface AcceptMatchMessage extends WebSocketMessage {
  type: 'ACCEPT_MATCH';
  data: {
    gameId: string;
    accepted: boolean;
  };
}

/**
 * Match cancelled notification
 */
export interface MatchCancelledMessage extends WebSocketMessage {
  type: 'MATCH_CANCELLED';
  data: {
    gameId: string;
    reason: 'DECLINED' | 'TIMEOUT' | 'ERROR';
  };
}

// ============================================================================
// GAME SESSION MESSAGES
// ============================================================================

/**
 * Game started notification
 */
export interface GameStartedMessage extends WebSocketMessage {
  type: 'GAME_STARTED';
  data: {
    gameState: GameState;
    playerRole: 'A' | 'B';
    timeLimit?: number; // Seconds per turn
  };
}

/**
 * Game state update (full state sync)
 */
export interface GameStateUpdateMessage extends WebSocketMessage {
  type: 'GAME_STATE_UPDATE';
  data: {
    gameState: GameState;
    updateReason: 'TURN_CHANGE' | 'PHASE_CHANGE' | 'ACTION_RESOLVED' | 'SYNC';
  };
}

/**
 * Game state delta update (incremental changes)
 */
export interface GameStateDeltaMessage extends WebSocketMessage {
  type: 'GAME_STATE_DELTA';
  data: {
    gameId: string;
    turn: number;
    changes: {
      type: 'CARD_MOVED' | 'STATS_CHANGED' | 'VP_CHANGED' | 'EFFECT_ADDED' | 'EFFECT_REMOVED';
      entityId: string;
      oldValue?: any;
      newValue: any;
    }[];
  };
}

/**
 * Turn timer update
 */
export interface TurnTimerMessage extends WebSocketMessage {
  type: 'TURN_TIMER';
  data: {
    gameId: string;
    currentPlayer: 'A' | 'B';
    timeRemaining: number; // Seconds
    phase: string;
  };
}

// ============================================================================
// PLAYER ACTION MESSAGES
// ============================================================================

/**
 * Player ready for game start
 */
export interface PlayerReadyMessage extends WebSocketMessage {
  type: 'PLAYER_READY';
  data: {
    gameId: string;
    ready: boolean;
  };
}

/**
 * Draw cards action
 */
export interface DrawCardsMessage extends WebSocketMessage {
  type: 'DRAW_CARDS';
  data: {
    gameId: string;
    count: number;
  };
}

/**
 * Play card action
 */
export interface PlayCardMessage extends WebSocketMessage {
  type: 'PLAY_CARD';
  data: {
    gameId: string;
    cardId: string;
    position?: Position;
    target?: CombatTarget;
    additionalChoices?: Record<string, any>;
  };
}

/**
 * Move summon action
 */
export interface MoveSummonMessage extends WebSocketMessage {
  type: 'MOVE_SUMMON';
  data: {
    gameId: string;
    summonId: string;
    fromPosition: Position;
    toPosition: Position;
    movementPath?: Position[];
  };
}

/**
 * Attack action
 */
export interface AttackMessage extends WebSocketMessage {
  type: 'ATTACK';
  data: {
    gameId: string;
    attackerId: string;
    target: CombatTarget;
    attackType: 'BASIC' | 'ABILITY';
    abilityId?: string;
  };
}

/**
 * Use ability action
 */
export interface UseAbilityMessage extends WebSocketMessage {
  type: 'USE_ABILITY';
  data: {
    gameId: string;
    sourceId: string;
    abilityId: string;
    target?: CombatTarget;
    additionalChoices?: Record<string, any>;
  };
}

/**
 * Advance role action
 */
export interface AdvanceRoleMessage extends WebSocketMessage {
  type: 'ADVANCE_ROLE';
  data: {
    gameId: string;
    summonId: string;
    advanceCardId: string;
    newRoleId: string;
  };
}

/**
 * End phase action
 */
export interface EndPhaseMessage extends WebSocketMessage {
  type: 'END_PHASE';
  data: {
    gameId: string;
    phase: string;
  };
}

/**
 * Surrender game action
 */
export interface SurrenderMessage extends WebSocketMessage {
  type: 'SURRENDER';
  data: {
    gameId: string;
  };
}

// ============================================================================
// EFFECT RESOLUTION MESSAGES
// ============================================================================

/**
 * Effect triggered notification
 */
export interface EffectTriggeredMessage extends WebSocketMessage {
  type: 'EFFECT_TRIGGERED';
  data: {
    gameId: string;
    effectId: string;
    sourceId: string;
    controllerId: 'A' | 'B';
    description: string;
    requiresChoice: boolean;
    choices?: {
      id: string;
      name: string;
      description: string;
    }[];
  };
}

/**
 * Effect choice response
 */
export interface EffectChoiceMessage extends WebSocketMessage {
  type: 'EFFECT_CHOICE';
  data: {
    gameId: string;
    effectId: string;
    choiceId: string;
    additionalData?: Record<string, any>;
  };
}

/**
 * Effect resolved notification
 */
export interface EffectResolvedMessage extends WebSocketMessage {
  type: 'EFFECT_RESOLVED';
  data: {
    gameId: string;
    effectId: string;
    result: {
      success: boolean;
      description: string;
      stateChanges: {
        type: string;
        entityId: string;
        change: any;
      }[];
    };
  };
}

/**
 * Stack update notification
 */
export interface StackUpdateMessage extends WebSocketMessage {
  type: 'STACK_UPDATE';
  data: {
    gameId: string;
    effects: {
      id: string;
      name: string;
      sourceId: string;
      controllerId: 'A' | 'B';
      priority: number;
    }[];
  };
}

// ============================================================================
// GAME RESULT MESSAGES
// ============================================================================

/**
 * Game ended notification
 */
export interface GameEndedMessage extends WebSocketMessage {
  type: 'GAME_ENDED';
  data: {
    gameId: string;
    result: 'WIN' | 'LOSS' | 'DRAW';
    reason: 'VICTORY_POINTS' | 'SURRENDER' | 'TIMEOUT' | 'DISCONNECT';
    finalScore: {
      playerA: number;
      playerB: number;
    };
    ratingChanges?: {
      playerA: number;
      playerB: number;
    };
    duration: number; // Seconds
    totalTurns: number;
  };
}

/**
 * Player disconnected notification
 */
export interface PlayerDisconnectedMessage extends WebSocketMessage {
  type: 'PLAYER_DISCONNECTED';
  data: {
    gameId: string;
    playerId: string;
    timeUntilForfeit: number; // Seconds
  };
}

/**
 * Player reconnected notification
 */
export interface PlayerReconnectedMessage extends WebSocketMessage {
  type: 'PLAYER_RECONNECTED';
  data: {
    gameId: string;
    playerId: string;
  };
}

// ============================================================================
// SPECTATOR MESSAGES
// ============================================================================

/**
 * Join as spectator
 */
export interface JoinSpectateMessage extends WebSocketMessage {
  type: 'JOIN_SPECTATE';
  data: {
    gameId: string;
  };
}

/**
 * Leave spectator mode
 */
export interface LeaveSpectateMessage extends WebSocketMessage {
  type: 'LEAVE_SPECTATE';
  data: {
    gameId: string;
  };
}

/**
 * Spectator joined notification
 */
export interface SpectatorJoinedMessage extends WebSocketMessage {
  type: 'SPECTATOR_JOINED';
  data: {
    gameId: string;
    spectatorId: string;
    spectatorUsername: string;
    spectatorCount: number;
  };
}

/**
 * Spectator left notification
 */
export interface SpectatorLeftMessage extends WebSocketMessage {
  type: 'SPECTATOR_LEFT';
  data: {
    gameId: string;
    spectatorId: string;
    spectatorCount: number;
  };
}

// ============================================================================
// CHAT MESSAGES
// ============================================================================

/**
 * Send chat message
 */
export interface SendChatMessage extends WebSocketMessage {
  type: 'SEND_CHAT';
  data: {
    gameId?: string;
    message: string;
    recipientId?: string; // For private messages
  };
}

/**
 * Chat message received
 */
export interface ChatMessageReceived extends WebSocketMessage {
  type: 'CHAT_MESSAGE';
  data: {
    gameId?: string;
    senderId: string;
    senderUsername: string;
    message: string;
    timestamp: Date;
    isPrivate: boolean;
  };
}

/**
 * Emote action
 */
export interface EmoteMessage extends WebSocketMessage {
  type: 'EMOTE';
  data: {
    gameId: string;
    emoteId: string;
    position?: Position;
  };
}

// ============================================================================
// MESSAGE TYPE UNIONS
// ============================================================================

/**
 * All possible incoming messages from client
 */
export type ClientMessage =
  | AuthenticateMessage
  | PingMessage
  | DisconnectMessage
  | JoinQueueMessage
  | LeaveQueueMessage
  | AcceptMatchMessage
  | PlayerReadyMessage
  | DrawCardsMessage
  | PlayCardMessage
  | MoveSummonMessage
  | AttackMessage
  | UseAbilityMessage
  | AdvanceRoleMessage
  | EndPhaseMessage
  | SurrenderMessage
  | EffectChoiceMessage
  | JoinSpectateMessage
  | LeaveSpectateMessage
  | SendChatMessage
  | EmoteMessage;

/**
 * All possible outgoing messages to client
 */
export type ServerMessage =
  | WebSocketErrorMessage
  | AuthenticatedMessage
  | PongMessage
  | QueueStatusMessage
  | MatchFoundMessage
  | MatchCancelledMessage
  | GameStartedMessage
  | GameStateUpdateMessage
  | GameStateDeltaMessage
  | TurnTimerMessage
  | EffectTriggeredMessage
  | EffectResolvedMessage
  | StackUpdateMessage
  | GameEndedMessage
  | PlayerDisconnectedMessage
  | PlayerReconnectedMessage
  | SpectatorJoinedMessage
  | SpectatorLeftMessage
  | ChatMessageReceived;

/**
 * Message type for handling any WebSocket message
 */
export type AnyWebSocketMessage = ClientMessage | ServerMessage;