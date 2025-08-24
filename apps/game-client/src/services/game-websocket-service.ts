/**
 * Game WebSocket Service - Real-time multiplayer communication
 * 
 * This service implements the real-time game client functionality by:
 * - Connecting to the WebSocket game server
 * - Handling bidirectional game state synchronization
 * - Implementing lag compensation and prediction systems
 * - Managing real-time position and animation updates
 * 
 * Implements task #019: Implement real-time game client
 */

import { io, Socket } from 'socket.io-client';
import {
  AuthenticateMessage,
  AuthenticatedMessage,
  WebSocketErrorMessage,
  GameState,
  JoinQueueMessage,
  QueueStatusMessage,
  MatchFoundMessage,
  AcceptMatchMessage,
  MatchCancelledMessage,
  GameStartedMessage,
  PlayerReadyMessage,
  GameStateUpdateMessage,
  GameEndedMessage,
  PlayerDisconnectedMessage,
  PlayerReconnectedMessage,
  PingMessage,
  PongMessage,
  PlayCardMessage,
  MoveSummonMessage,
  AttackMessage,
  EndPhaseMessage,
  SurrenderMessage,
  ClientMessage,
  ServerMessage,
  Position
} from '@summoners-grid/shared-types';

export interface GameWebSocketConfig {
  serverUrl: string;
  autoReconnect: boolean;
  reconnectAttempts: number;
  reconnectDelay: number;
  pingInterval: number;
  lagCompensationEnabled: boolean;
  predictionEnabled: boolean;
}

export interface GameConnectionState {
  isConnected: boolean;
  isAuthenticated: boolean;
  isInQueue: boolean;
  currentGameId: string | null;
  playerRole: 'A' | 'B' | null;
  latency: number;
}

export interface PredictedMove {
  id: string;
  timestamp: number;
  action: 'MOVE_SUMMON' | 'PLAY_CARD' | 'ATTACK';
  data: any;
  confirmed: boolean;
}

/**
 * Real-time game WebSocket service
 */
export class GameWebSocketService extends EventTarget {
  private socket: Socket | null = null;
  private config: GameWebSocketConfig;
  private connectionState: GameConnectionState = {
    isConnected: false,
    isAuthenticated: false,
    isInQueue: false,
    currentGameId: null,
    playerRole: null,
    latency: 0
  };

  // Lag compensation and prediction
  private serverTimeOffset: number = 0;
  private pendingMoves: Map<string, PredictedMove> = new Map();
  private latencyHistory: number[] = [];
  private pingStartTime: number = 0;

  // Reconnection state
  private reconnectAttempts: number = 0;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private authToken: string | null = null;

  constructor(config: Partial<GameWebSocketConfig> = {}) {
    super();
    
    // Handle environment variables safely for Jest testing environment
    const getEnvVar = (key: string, defaultValue: string): string => {
      // In test environment, just return the default
      if (typeof jest !== 'undefined') {
        return defaultValue;
      }
      
      // Try to get from environment variables
      if (typeof window !== 'undefined' && (window as any).import?.meta?.env) {
        return (window as any).import.meta.env[key] || defaultValue;
      }
      
      // Fallback to default
      return defaultValue;
    };
    
    this.config = {
      serverUrl: getEnvVar('VITE_GAME_SERVER_URL', 'http://localhost:3002'),
      autoReconnect: true,
      reconnectAttempts: 5,
      reconnectDelay: 2000,
      pingInterval: 30000,
      lagCompensationEnabled: true,
      predictionEnabled: true,
      ...config
    };
  }

  /**
   * Connect to the game server
   */
  public async connect(token: string): Promise<void> {
    if (this.socket?.connected) {
      console.warn('Already connected to game server');
      return;
    }

    this.authToken = token;

    return new Promise((resolve, reject) => {
      try {
        console.log(`Connecting to game server: ${this.config.serverUrl}`);
        
        this.socket = io(this.config.serverUrl, {
          autoConnect: true,
          reconnection: this.config.autoReconnect,
          reconnectionAttempts: this.config.reconnectAttempts,
          reconnectionDelay: this.config.reconnectDelay,
          timeout: 10000,
          transports: ['websocket', 'polling']
        });

        this.setupSocketEventListeners();

        // Handle connection success
        this.socket.on('connect', () => {
          console.log('Connected to game server');
          this.connectionState.isConnected = true;
          this.reconnectAttempts = 0;
          
          // Authenticate immediately after connection
          this.authenticate(token);
          
          this.dispatchEvent(new CustomEvent('connected'));
          resolve();
        });

        // Handle connection failure
        this.socket.on('connect_error', (error) => {
          console.error('Failed to connect to game server:', error);
          this.connectionState.isConnected = false;
          this.dispatchEvent(new CustomEvent('connectionError', { detail: error }));
          reject(error);
        });

      } catch (error) {
        console.error('Error creating socket connection:', error);
        reject(error);
      }
    });
  }

  /**
   * Set up all socket event listeners
   */
  private setupSocketEventListeners(): void {
    if (!this.socket) return;

    // Connection management
    this.socket.on('disconnect', this.handleDisconnect.bind(this));
    this.socket.on('reconnect', this.handleReconnect.bind(this));
    this.socket.on('reconnect_error', this.handleReconnectError.bind(this));

    // Authentication
    this.socket.on('AUTHENTICATED', this.handleAuthenticated.bind(this));
    this.socket.on('ERROR', this.handleError.bind(this));

    // Matchmaking
    this.socket.on('QUEUE_STATUS', this.handleQueueStatus.bind(this));
    this.socket.on('MATCH_FOUND', this.handleMatchFound.bind(this));
    this.socket.on('MATCH_CANCELLED', this.handleMatchCancelled.bind(this));

    // Game session
    this.socket.on('GAME_STARTED', this.handleGameStarted.bind(this));
    this.socket.on('GAME_STATE_UPDATE', this.handleGameStateUpdate.bind(this));
    this.socket.on('GAME_ENDED', this.handleGameEnded.bind(this));
    this.socket.on('PLAYER_DISCONNECTED', this.handlePlayerDisconnected.bind(this));
    this.socket.on('PLAYER_RECONNECTED', this.handlePlayerReconnected.bind(this));

    // Ping/Pong for latency measurement
    this.socket.on('PONG', this.handlePong.bind(this));

    // Set up periodic ping
    setInterval(() => {
      this.sendPing();
    }, this.config.pingInterval);
  }

  /**
   * Authenticate with the server
   */
  private authenticate(token: string): void {
    if (!this.socket) return;

    const authMessage: AuthenticateMessage = {
      type: 'AUTHENTICATE',
      timestamp: new Date(),
      messageId: this.generateMessageId(),
      token
    };

    this.socket.emit('AUTHENTICATE', authMessage);
  }

  /**
   * Join the matchmaking queue
   */
  public joinQueue(gameMode: 'RANKED' | 'CASUAL' | 'PRIVATE', deckId: string): void {
    if (!this.isReady()) {
      console.warn('Cannot join queue - not connected or authenticated');
      return;
    }

    const message: JoinQueueMessage = {
      type: 'JOIN_QUEUE',
      timestamp: new Date(),
      messageId: this.generateMessageId(),
      data: {
        gameMode,
        format: '3v3',
        deckId
      }
    };

    this.socket!.emit('JOIN_QUEUE', message);
  }

  /**
   * Leave the matchmaking queue
   */
  public leaveQueue(): void {
    if (!this.socket) return;

    const message = {
      type: 'LEAVE_QUEUE',
      timestamp: new Date(),
      messageId: this.generateMessageId()
    };

    this.socket.emit('LEAVE_QUEUE', message);
  }

  /**
   * Accept a found match
   */
  public acceptMatch(gameId: string): void {
    if (!this.socket) return;

    const message: AcceptMatchMessage = {
      type: 'ACCEPT_MATCH',
      timestamp: new Date(),
      messageId: this.generateMessageId(),
      data: {
        gameId,
        accepted: true
      }
    };

    this.socket.emit('ACCEPT_MATCH', message);
  }

  /**
   * Decline a found match
   */
  public declineMatch(gameId: string): void {
    if (!this.socket) return;

    const message: AcceptMatchMessage = {
      type: 'ACCEPT_MATCH',
      timestamp: new Date(),
      messageId: this.generateMessageId(),
      data: {
        gameId,
        accepted: false
      }
    };

    this.socket.emit('ACCEPT_MATCH', message);
  }

  /**
   * Signal that the player is ready to start the game
   */
  public playerReady(gameId: string): void {
    if (!this.socket) return;

    const message: PlayerReadyMessage = {
      type: 'PLAYER_READY',
      timestamp: new Date(),
      messageId: this.generateMessageId(),
      data: {
        gameId,
        ready: true
      }
    };

    this.socket.emit('PLAYER_READY', message);
  }

  /**
   * Play a card with lag compensation
   */
  public playCard(gameId: string, cardId: string, position?: Position, target?: any): void {
    if (!this.socket || !gameId) return;

    const moveId = this.generateMessageId();
    const message: PlayCardMessage = {
      type: 'PLAY_CARD',
      timestamp: new Date(),
      messageId: moveId,
      data: {
        gameId,
        cardId,
        position,
        target
      }
    };

    // Prediction: optimistically apply the move locally
    if (this.config.predictionEnabled) {
      this.addPredictedMove(moveId, 'PLAY_CARD', message.data);
      this.dispatchEvent(new CustomEvent('predictedMove', { detail: message.data }));
    }

    this.socket.emit('PLAY_CARD', message);
  }

  /**
   * Move a summon with lag compensation
   */
  public moveSummon(gameId: string, summonId: string, fromPosition: Position, toPosition: Position): void {
    if (!this.socket || !gameId) return;

    const moveId = this.generateMessageId();
    const message: MoveSummonMessage = {
      type: 'MOVE_SUMMON',
      timestamp: new Date(),
      messageId: moveId,
      data: {
        gameId,
        summonId,
        fromPosition,
        toPosition
      }
    };

    // Prediction: optimistically apply the move locally
    if (this.config.predictionEnabled) {
      this.addPredictedMove(moveId, 'MOVE_SUMMON', message.data);
      this.dispatchEvent(new CustomEvent('predictedMove', { detail: message.data }));
    }

    this.socket.emit('MOVE_SUMMON', message);
  }

  /**
   * Attack with a summon
   */
  public attack(gameId: string, attackerId: string, target: any): void {
    if (!this.socket || !gameId) return;

    const moveId = this.generateMessageId();
    const message: AttackMessage = {
      type: 'ATTACK',
      timestamp: new Date(),
      messageId: moveId,
      data: {
        gameId,
        attackerId,
        target,
        attackType: 'BASIC'
      }
    };

    // Prediction: optimistically apply the attack locally
    if (this.config.predictionEnabled) {
      this.addPredictedMove(moveId, 'ATTACK', message.data);
      this.dispatchEvent(new CustomEvent('predictedMove', { detail: message.data }));
    }

    this.socket.emit('ATTACK', message);
  }

  /**
   * End the current phase
   */
  public endPhase(gameId: string, phase: string): void {
    if (!this.socket || !gameId) return;

    const message: EndPhaseMessage = {
      type: 'END_PHASE',
      timestamp: new Date(),
      messageId: this.generateMessageId(),
      data: {
        gameId,
        phase
      }
    };

    this.socket.emit('END_PHASE', message);
  }

  /**
   * Surrender the current game
   */
  public surrender(gameId: string): void {
    if (!this.socket || !gameId) return;

    const message: SurrenderMessage = {
      type: 'SURRENDER',
      timestamp: new Date(),
      messageId: this.generateMessageId(),
      data: {
        gameId
      }
    };

    this.socket.emit('SURRENDER', message);
  }

  /**
   * Send ping to measure latency
   */
  private sendPing(): void {
    if (!this.socket?.connected) return;

    this.pingStartTime = Date.now();
    const message: PingMessage = {
      type: 'PING',
      timestamp: new Date(),
      messageId: this.generateMessageId()
    };

    this.socket.emit('PING', message);
  }

  /**
   * Handle authentication success
   */
  private handleAuthenticated(message: AuthenticatedMessage): void {
    console.log('Authenticated with game server:', message.data);
    this.connectionState.isAuthenticated = true;
    this.dispatchEvent(new CustomEvent('authenticated', { detail: message.data }));
  }

  /**
   * Handle errors from the server
   */
  private handleError(message: WebSocketErrorMessage): void {
    console.error('Game server error:', message.error);
    this.dispatchEvent(new CustomEvent('error', { detail: message.error }));
  }

  /**
   * Handle queue status updates
   */
  private handleQueueStatus(message: QueueStatusMessage): void {
    this.connectionState.isInQueue = message.data.inQueue;
    this.dispatchEvent(new CustomEvent('queueStatus', { detail: message.data }));
  }

  /**
   * Handle match found notification
   */
  private handleMatchFound(message: MatchFoundMessage): void {
    this.dispatchEvent(new CustomEvent('matchFound', { detail: message.data }));
  }

  /**
   * Handle match cancelled notification
   */
  private handleMatchCancelled(message: MatchCancelledMessage): void {
    this.dispatchEvent(new CustomEvent('matchCancelled', { detail: message.data }));
  }

  /**
   * Handle game started notification
   */
  private handleGameStarted(message: GameStartedMessage): void {
    this.connectionState.currentGameId = message.data.gameState.gameId;
    this.connectionState.playerRole = message.data.playerRole;
    this.dispatchEvent(new CustomEvent('gameStarted', { detail: message.data }));
  }

  /**
   * Handle game state updates with lag compensation
   */
  private handleGameStateUpdate(message: GameStateUpdateMessage): void {
    const { gameState, updateReason } = message.data;
    
    // Apply lag compensation
    if (this.config.lagCompensationEnabled) {
      this.applyLagCompensation(gameState, message.timestamp);
    }

    // Confirm any predicted moves that were accepted
    this.confirmPredictedMoves(gameState);

    this.dispatchEvent(new CustomEvent('gameStateUpdate', { 
      detail: { gameState, updateReason } 
    }));
  }

  /**
   * Handle game ended notification
   */
  private handleGameEnded(message: GameEndedMessage): void {
    this.connectionState.currentGameId = null;
    this.connectionState.playerRole = null;
    this.connectionState.isInQueue = false;
    this.clearPredictedMoves();
    
    this.dispatchEvent(new CustomEvent('gameEnded', { detail: message.data }));
  }

  /**
   * Handle player disconnected notification
   */
  private handlePlayerDisconnected(message: PlayerDisconnectedMessage): void {
    this.dispatchEvent(new CustomEvent('playerDisconnected', { detail: message.data }));
  }

  /**
   * Handle player reconnected notification
   */
  private handlePlayerReconnected(message: PlayerReconnectedMessage): void {
    this.dispatchEvent(new CustomEvent('playerReconnected', { detail: message.data }));
  }

  /**
   * Handle pong response and calculate latency
   */
  private handlePong(message: PongMessage): void {
    const latency = Date.now() - this.pingStartTime;
    this.updateLatency(latency);
  }

  /**
   * Handle disconnection
   */
  private handleDisconnect(reason: string): void {
    console.log('Disconnected from game server:', reason);
    this.connectionState.isConnected = false;
    this.connectionState.isAuthenticated = false;
    this.dispatchEvent(new CustomEvent('disconnected', { detail: reason }));
  }

  /**
   * Handle reconnection
   */
  private handleReconnect(attemptNumber: number): void {
    console.log('Reconnected to game server after', attemptNumber, 'attempts');
    this.connectionState.isConnected = true;
    
    // Re-authenticate after reconnection
    if (this.authToken) {
      this.authenticate(this.authToken);
    }
    
    this.dispatchEvent(new CustomEvent('reconnected', { detail: attemptNumber }));
  }

  /**
   * Handle reconnection error
   */
  private handleReconnectError(error: Error): void {
    this.reconnectAttempts++;
    console.error(`Reconnection attempt ${this.reconnectAttempts} failed:`, error);
    this.dispatchEvent(new CustomEvent('reconnectError', { detail: { error, attempts: this.reconnectAttempts } }));
  }

  /**
   * Add a predicted move for lag compensation
   */
  private addPredictedMove(id: string, action: PredictedMove['action'], data: any): void {
    const predictedMove: PredictedMove = {
      id,
      timestamp: Date.now(),
      action,
      data,
      confirmed: false
    };
    
    this.pendingMoves.set(id, predictedMove);
    
    // Remove old unconfirmed moves after 5 seconds
    setTimeout(() => {
      if (this.pendingMoves.has(id) && !this.pendingMoves.get(id)?.confirmed) {
        this.pendingMoves.delete(id);
        this.dispatchEvent(new CustomEvent('moveRejected', { detail: data }));
      }
    }, 5000);
  }

  /**
   * Confirm predicted moves that were accepted by the server
   */
  private confirmPredictedMoves(gameState: GameState): void {
    for (const [id, move] of this.pendingMoves) {
      if (!move.confirmed) {
        // Simple confirmation logic - in a real implementation,
        // this would compare the game state to see if the move was applied
        move.confirmed = true;
        this.dispatchEvent(new CustomEvent('moveConfirmed', { detail: move.data }));
      }
    }
    
    // Clean up confirmed moves
    for (const [id, move] of this.pendingMoves) {
      if (move.confirmed && Date.now() - move.timestamp > 1000) {
        this.pendingMoves.delete(id);
      }
    }
  }

  /**
   * Clear all predicted moves
   */
  private clearPredictedMoves(): void {
    this.pendingMoves.clear();
  }

  /**
   * Apply lag compensation to game state
   */
  private applyLagCompensation(gameState: GameState, serverTimestamp: Date): void {
    // Calculate server time offset for lag compensation
    const clientTime = Date.now();
    const serverTime = new Date(serverTimestamp).getTime();
    this.serverTimeOffset = serverTime - clientTime;
    
    // In a full implementation, this would adjust entity positions
    // based on predicted movement and time differences
  }

  /**
   * Update latency measurement
   */
  private updateLatency(latency: number): void {
    this.latencyHistory.push(latency);
    
    // Keep only the last 10 measurements
    if (this.latencyHistory.length > 10) {
      this.latencyHistory.shift();
    }
    
    // Calculate average latency
    this.connectionState.latency = this.latencyHistory.reduce((a, b) => a + b, 0) / this.latencyHistory.length;
    
    this.dispatchEvent(new CustomEvent('latencyUpdate', { detail: this.connectionState.latency }));
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Check if the service is ready for game actions
   */
  public isReady(): boolean {
    return this.connectionState.isConnected && this.connectionState.isAuthenticated;
  }

  /**
   * Get current connection state
   */
  public getConnectionState(): GameConnectionState {
    return { ...this.connectionState };
  }

  /**
   * Get current latency
   */
  public getLatency(): number {
    return this.connectionState.latency;
  }

  /**
   * Disconnect from the server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    this.connectionState = {
      isConnected: false,
      isAuthenticated: false,
      isInQueue: false,
      currentGameId: null,
      playerRole: null,
      latency: 0
    };
    
    this.clearPredictedMoves();
  }
}

// Export singleton instance
export const gameWebSocketService = new GameWebSocketService();