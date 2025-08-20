import { Server, Socket } from 'socket.io';
import { createServer } from 'http';
import { v4 as uuidv4 } from 'uuid';
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
  DisconnectMessage,
  PlayerDisconnectedMessage,
  PingMessage,
  PongMessage,
} from '@summoners-grid/shared-types';
import { GameEngine } from '@summoners-grid/game-engine';

/**
 * Configuration for WebSocket server
 */
export interface WebSocketServerConfig {
  port: number;
  cors?: {
    origin: string | string[];
    credentials: boolean;
  };
  pingTimeout?: number;
  pingInterval?: number;
}

/**
 * Connected player information
 */
export interface ConnectedPlayer {
  id: string;
  username: string;
  socket: Socket;
  sessionId: string;
  currentGameId?: string;
  isInQueue: boolean;
  queueStartTime?: Date;
  lastPingTime: Date;
}

/**
 * Game session information
 */
export interface GameSession {
  id: string;
  playerA: ConnectedPlayer;
  playerB: ConnectedPlayer;
  gameEngine: GameEngine;
  state: 'LOBBY' | 'WAITING_FOR_READY' | 'IN_PROGRESS' | 'ENDED';
  createdAt: Date;
  lastActivity: Date;
  spectators: Map<string, ConnectedPlayer>;
}

/**
 * Matchmaking queue entry
 */
export interface QueueEntry {
  player: ConnectedPlayer;
  gameMode: 'RANKED' | 'CASUAL' | 'PRIVATE';
  format: '3v3';
  deckId: string;
  joinTime: Date;
}

/**
 * WebSocket Game Server implementation with Socket.IO
 * Handles real-time multiplayer game sessions, matchmaking, and authoritative game state
 */
export class WebSocketServer {
  private server: Server;
  private httpServer: any;
  private connectedPlayers = new Map<string, ConnectedPlayer>();
  private gameSessions = new Map<string, GameSession>();
  private matchmakingQueue: QueueEntry[] = [];
  private config: WebSocketServerConfig;
  private pingInterval?: NodeJS.Timeout;

  constructor(config: WebSocketServerConfig) {
    this.config = config;
    this.httpServer = createServer();
    
    this.server = new Server(this.httpServer, {
      cors: config.cors || {
        origin: '*',
        credentials: false,
      },
      pingTimeout: config.pingTimeout || 60000,
      pingInterval: config.pingInterval || 25000,
    });

    this.setupEventHandlers();
    this.startPingSystem();
  }

  /**
   * Start the WebSocket server
   */
  public async start(): Promise<void> {
    return new Promise((resolve) => {
      this.httpServer.listen(this.config.port, () => {
        console.log(`[WebSocketServer] Server started on port ${this.config.port}`);
        resolve();
      });
    });
  }

  /**
   * Stop the WebSocket server
   */
  public async stop(): Promise<void> {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    
    // Disconnect all players
    for (const player of this.connectedPlayers.values()) {
      player.socket.disconnect(true);
    }
    
    return new Promise((resolve) => {
      this.httpServer.close(() => {
        console.log('[WebSocketServer] Server stopped');
        resolve();
      });
    });
  }

  /**
   * Get server statistics
   */
  public getStats() {
    return {
      connectedPlayers: this.connectedPlayers.size,
      activeSessions: this.gameSessions.size,
      queueSize: this.matchmakingQueue.length,
      uptime: process.uptime(),
    };
  }

  private setupEventHandlers(): void {
    this.server.on('connection', (socket: Socket) => {
      console.log(`[WebSocketServer] New connection: ${socket.id}`);

      // Handle client authentication
      socket.on('AUTHENTICATE', (message: AuthenticateMessage) => {
        this.handleAuthentication(socket, message);
      });

      // Handle ping/pong for heartbeat
      socket.on('PING', (message: PingMessage) => {
        this.handlePing(socket, message);
      });

      // Handle matchmaking
      socket.on('JOIN_QUEUE', (message: JoinQueueMessage) => {
        this.handleJoinQueue(socket, message);
      });

      socket.on('LEAVE_QUEUE', () => {
        this.handleLeaveQueue(socket);
      });

      socket.on('ACCEPT_MATCH', (message: AcceptMatchMessage) => {
        this.handleAcceptMatch(socket, message);
      });

      // Handle game session events
      socket.on('PLAYER_READY', (message: PlayerReadyMessage) => {
        this.handlePlayerReady(socket, message);
      });

      // Handle game actions
      socket.on('PLAY_CARD', (message: any) => {
        this.handleGameAction(socket, message);
      });

      socket.on('MOVE_SUMMON', (message: any) => {
        this.handleGameAction(socket, message);
      });

      socket.on('ATTACK', (message: any) => {
        this.handleGameAction(socket, message);
      });

      socket.on('USE_ABILITY', (message: any) => {
        this.handleGameAction(socket, message);
      });

      socket.on('END_PHASE', (message: any) => {
        this.handleGameAction(socket, message);
      });

      socket.on('SURRENDER', (message: any) => {
        this.handleSurrender(socket, message);
      });

      // Handle disconnection
      socket.on('disconnect', (reason: string) => {
        this.handleDisconnection(socket, reason);
      });

      socket.on('DISCONNECT', (message: DisconnectMessage) => {
        this.handleDisconnection(socket, message.reason || 'client_disconnect');
      });
    });
  }

  private handleAuthentication(socket: Socket, message: AuthenticateMessage): void {
    try {
      // TODO: Validate JWT token and get user info
      // For now, we'll use a simple mock authentication
      const userId = this.extractUserIdFromToken(message.token);
      const username = `Player_${userId}`;
      
      const player: ConnectedPlayer = {
        id: userId,
        username,
        socket,
        sessionId: uuidv4(),
        isInQueue: false,
        lastPingTime: new Date(),
      };

      this.connectedPlayers.set(socket.id, player);

      const response: AuthenticatedMessage = {
        type: 'AUTHENTICATED',
        timestamp: new Date(),
        messageId: uuidv4(),
        data: {
          userId,
          username,
          sessionId: player.sessionId,
        },
      };

      socket.emit('AUTHENTICATED', response);
      console.log(`[WebSocketServer] Player authenticated: ${username} (${userId})`);
    } catch (error) {
      console.error('[WebSocketServer] Authentication failed:', error);
      this.sendError(socket, 'AUTH_FAILED', 'Authentication failed', error);
    }
  }

  private handlePing(socket: Socket, message: PingMessage): void {
    const player = this.connectedPlayers.get(socket.id);
    if (player) {
      player.lastPingTime = new Date();
      
      const response: PongMessage = {
        type: 'PONG',
        timestamp: new Date(),
        messageId: uuidv4(),
      };
      
      socket.emit('PONG', response);
    }
  }

  private handleJoinQueue(socket: Socket, message: JoinQueueMessage): void {
    const player = this.connectedPlayers.get(socket.id);
    if (!player) {
      this.sendError(socket, 'NOT_AUTHENTICATED', 'Player not authenticated');
      return;
    }

    if (player.isInQueue) {
      this.sendError(socket, 'ALREADY_IN_QUEUE', 'Player already in queue');
      return;
    }

    if (player.currentGameId) {
      this.sendError(socket, 'ALREADY_IN_GAME', 'Player already in a game');
      return;
    }

    const queueEntry: QueueEntry = {
      player,
      gameMode: message.data.gameMode,
      format: message.data.format,
      deckId: message.data.deckId,
      joinTime: new Date(),
    };

    this.matchmakingQueue.push(queueEntry);
    player.isInQueue = true;
    player.queueStartTime = new Date();

    const response: QueueStatusMessage = {
      type: 'QUEUE_STATUS',
      timestamp: new Date(),
      messageId: uuidv4(),
      data: {
        inQueue: true,
        queueTime: 0,
        playersInQueue: this.matchmakingQueue.length,
      },
    };

    socket.emit('QUEUE_STATUS', response);
    console.log(`[WebSocketServer] Player ${player.username} joined queue`);

    // Try to find a match
    this.processMatchmaking();
  }

  private handleLeaveQueue(socket: Socket): void {
    const player = this.connectedPlayers.get(socket.id);
    if (!player) return;

    this.removeFromQueue(player);
    player.isInQueue = false;
    player.queueStartTime = undefined;

    const response: QueueStatusMessage = {
      type: 'QUEUE_STATUS',
      timestamp: new Date(),
      messageId: uuidv4(),
      data: {
        inQueue: false,
      },
    };

    socket.emit('QUEUE_STATUS', response);
    console.log(`[WebSocketServer] Player ${player.username} left queue`);
  }

  private handleAcceptMatch(socket: Socket, message: AcceptMatchMessage): void {
    const gameSession = this.gameSessions.get(message.data.gameId);
    if (!gameSession) {
      this.sendError(socket, 'GAME_NOT_FOUND', 'Game session not found');
      return;
    }

    const player = this.connectedPlayers.get(socket.id);
    if (!player) return;

    if (message.data.accepted) {
      console.log(`[WebSocketServer] Player ${player.username} accepted match`);
      // Check if both players have accepted
      this.checkGameReadyToStart(gameSession);
    } else {
      console.log(`[WebSocketServer] Player ${player.username} declined match`);
      this.cancelMatch(gameSession, 'DECLINED');
    }
  }

  private handlePlayerReady(socket: Socket, message: PlayerReadyMessage): void {
    const gameSession = this.gameSessions.get(message.data.gameId);
    if (!gameSession) {
      this.sendError(socket, 'GAME_NOT_FOUND', 'Game session not found');
      return;
    }

    const player = this.connectedPlayers.get(socket.id);
    if (!player) return;

    console.log(`[WebSocketServer] Player ${player.username} ready: ${message.data.ready}`);
    
    // Check if both players are ready to start the game
    if (message.data.ready) {
      this.startGame(gameSession);
    }
  }

  private handleGameAction(socket: Socket, message: any): void {
    const player = this.connectedPlayers.get(socket.id);
    if (!player || !player.currentGameId) {
      this.sendError(socket, 'NOT_IN_GAME', 'Player not in a game');
      return;
    }

    const gameSession = this.gameSessions.get(player.currentGameId);
    if (!gameSession) {
      this.sendError(socket, 'GAME_NOT_FOUND', 'Game session not found');
      return;
    }

    try {
      // Submit action to game engine
      const result = gameSession.gameEngine.submitAction(player.id, message.data);
      
      if (result.success && result.newGameState) {
        gameSession.lastActivity = new Date();
        
        // Broadcast state update to both players
        this.broadcastGameStateUpdate(gameSession, result.newGameState, 'ACTION_RESOLVED');
        
        console.log(`[WebSocketServer] Action ${message.type} applied by ${player.username}`);
      } else {
        this.sendError(socket, 'INVALID_ACTION', result.message || 'Invalid action', result.errors);
      }
    } catch (error) {
      console.error('[WebSocketServer] Error applying game action:', error);
      this.sendError(socket, 'ACTION_ERROR', 'Error processing action', error);
    }
  }

  private handleSurrender(socket: Socket, message: any): void {
    const player = this.connectedPlayers.get(socket.id);
    if (!player || !player.currentGameId) return;

    const gameSession = this.gameSessions.get(player.currentGameId);
    if (!gameSession) return;

    console.log(`[WebSocketServer] Player ${player.username} surrendered`);
    this.endGame(gameSession, player.id === gameSession.playerA.id ? 'B' : 'A', 'SURRENDER');
  }

  private handleDisconnection(socket: Socket, reason: string): void {
    const player = this.connectedPlayers.get(socket.id);
    if (!player) return;

    console.log(`[WebSocketServer] Player ${player.username} disconnected: ${reason}`);

    // Remove from queue if in queue
    if (player.isInQueue) {
      this.removeFromQueue(player);
    }

    // Handle game disconnection
    if (player.currentGameId) {
      this.handleGameDisconnection(player, reason);
    }

    this.connectedPlayers.delete(socket.id);
  }

  private processMatchmaking(): void {
    if (this.matchmakingQueue.length < 2) return;

    // Simple FIFO matchmaking for now
    const playerA = this.matchmakingQueue.shift()!;
    const playerB = this.matchmakingQueue.shift()!;

    this.createGameSession(playerA.player, playerB.player);
  }

  private createGameSession(playerA: ConnectedPlayer, playerB: ConnectedPlayer): void {
    const gameId = uuidv4();
    
    // Initialize game engine
    const gameEngine = new GameEngine({
      debugMode: true,
      format: {
        name: '3v3',
        maxSummons: 3,
        victoryPointTarget: 3,
        handSizeLimit: 6,
      },
    });

    const gameSession: GameSession = {
      id: gameId,
      playerA,
      playerB,
      gameEngine,
      state: 'WAITING_FOR_READY',
      createdAt: new Date(),
      lastActivity: new Date(),
      spectators: new Map(),
    };

    this.gameSessions.set(gameId, gameSession);
    
    // Remove players from queue
    playerA.isInQueue = false;
    playerA.currentGameId = gameId;
    playerB.isInQueue = false;
    playerB.currentGameId = gameId;

    // Notify both players of match found
    const matchFoundA: MatchFoundMessage = {
      type: 'MATCH_FOUND',
      timestamp: new Date(),
      messageId: uuidv4(),
      data: {
        gameId,
        opponent: {
          id: playerB.id,
          username: playerB.username,
          level: 1, // TODO: Get from player data
          rating: 1200, // TODO: Get from player data
        },
        gameMode: 'CASUAL',
        format: '3v3',
        timeToAccept: 30,
      },
    };

    const matchFoundB: MatchFoundMessage = {
      ...matchFoundA,
      data: {
        ...matchFoundA.data,
        opponent: {
          id: playerA.id,
          username: playerA.username,
          level: 1,
          rating: 1200,
        },
      },
    };

    playerA.socket.emit('MATCH_FOUND', matchFoundA);
    playerB.socket.emit('MATCH_FOUND', matchFoundB);

    console.log(`[WebSocketServer] Match created: ${playerA.username} vs ${playerB.username}`);
  }

  private checkGameReadyToStart(gameSession: GameSession): void {
    // For simplicity, auto-accept matches and start immediately
    this.startGame(gameSession);
  }

  private startGame(gameSession: GameSession): void {
    try {
      // Initialize game with both players
      const gameId = gameSession.id;
      
      // Create full Player objects with required properties
      const playerA = {
        id: gameSession.playerA.id,
        username: gameSession.playerA.username,
        level: 1,
        experience: 0,
        rating: 1200,
        victoryPoints: 0,
        hand: [],
        mainDeck: [],
        advanceDeck: [],
        discardPile: [],
        rechargePile: [],
        activeSummons: new Map(),
        activeBuildings: new Map(),
      };
      
      const playerB = {
        id: gameSession.playerB.id,
        username: gameSession.playerB.username,
        level: 1,
        experience: 0,
        rating: 1200,
        victoryPoints: 0,
        hand: [],
        mainDeck: [],
        advanceDeck: [],
        discardPile: [],
        rechargePile: [],
        activeSummons: new Map(),
        activeBuildings: new Map(),
      };
      
      const initialState = gameSession.gameEngine.initializeGame(gameId, playerA, playerB);

      gameSession.state = 'IN_PROGRESS';

      // Notify both players that game started
      const gameStartedA: GameStartedMessage = {
        type: 'GAME_STARTED',
        timestamp: new Date(),
        messageId: uuidv4(),
        data: {
          gameState: initialState,
          playerRole: 'A',
          timeLimit: 300, // 5 minutes per turn
        },
      };

      const gameStartedB: GameStartedMessage = {
        ...gameStartedA,
        data: {
          ...gameStartedA.data,
          playerRole: 'B',
        },
      };

      gameSession.playerA.socket.emit('GAME_STARTED', gameStartedA);
      gameSession.playerB.socket.emit('GAME_STARTED', gameStartedB);

      console.log(`[WebSocketServer] Game started: ${gameSession.id}`);
    } catch (error) {
      console.error('[WebSocketServer] Error starting game:', error);
      this.cancelMatch(gameSession, 'ERROR');
    }
  }

  private broadcastGameStateUpdate(gameSession: GameSession, gameState: GameState, reason: string): void {
    const message: GameStateUpdateMessage = {
      type: 'GAME_STATE_UPDATE',
      timestamp: new Date(),
      messageId: uuidv4(),
      data: {
        gameState,
        updateReason: reason as any,
      },
    };

    gameSession.playerA.socket.emit('GAME_STATE_UPDATE', message);
    gameSession.playerB.socket.emit('GAME_STATE_UPDATE', message);

    // Also send to spectators
    gameSession.spectators.forEach((spectator) => {
      spectator.socket.emit('GAME_STATE_UPDATE', message);
    });
  }

  private endGame(gameSession: GameSession, winner: 'A' | 'B', reason: string): void {
    gameSession.state = 'ENDED';

    const gameEndedMessage: GameEndedMessage = {
      type: 'GAME_ENDED',
      timestamp: new Date(),
      messageId: uuidv4(),
      data: {
        gameId: gameSession.id,
        result: winner === 'A' ? 'WIN' : 'LOSS',
        reason: reason as any,
        finalScore: {
          playerA: winner === 'A' ? 3 : 0,
          playerB: winner === 'B' ? 3 : 0,
        },
        duration: Math.floor((Date.now() - gameSession.createdAt.getTime()) / 1000),
        totalTurns: gameSession.gameEngine.getGameState()?.currentTurn || 0,
      },
    };

    // Send appropriate result to each player
    gameSession.playerA.socket.emit('GAME_ENDED', {
      ...gameEndedMessage,
      data: {
        ...gameEndedMessage.data,
        result: winner === 'A' ? 'WIN' : 'LOSS',
      },
    });

    gameSession.playerB.socket.emit('GAME_ENDED', {
      ...gameEndedMessage,
      data: {
        ...gameEndedMessage.data,
        result: winner === 'B' ? 'WIN' : 'LOSS',
      },
    });

    // Clean up
    gameSession.playerA.currentGameId = undefined;
    gameSession.playerB.currentGameId = undefined;
    this.gameSessions.delete(gameSession.id);

    console.log(`[WebSocketServer] Game ended: ${gameSession.id}, Winner: Player ${winner}`);
  }

  private cancelMatch(gameSession: GameSession, reason: string): void {
    const message: MatchCancelledMessage = {
      type: 'MATCH_CANCELLED',
      timestamp: new Date(),
      messageId: uuidv4(),
      data: {
        gameId: gameSession.id,
        reason: reason as any,
      },
    };

    gameSession.playerA.socket.emit('MATCH_CANCELLED', message);
    gameSession.playerB.socket.emit('MATCH_CANCELLED', message);

    // Clean up
    gameSession.playerA.currentGameId = undefined;
    gameSession.playerB.currentGameId = undefined;
    this.gameSessions.delete(gameSession.id);

    console.log(`[WebSocketServer] Match cancelled: ${gameSession.id}, Reason: ${reason}`);
  }

  private handleGameDisconnection(player: ConnectedPlayer, reason: string): void {
    if (!player.currentGameId) return;

    const gameSession = this.gameSessions.get(player.currentGameId);
    if (!gameSession) return;

    const message: PlayerDisconnectedMessage = {
      type: 'PLAYER_DISCONNECTED',
      timestamp: new Date(),
      messageId: uuidv4(),
      data: {
        gameId: gameSession.id,
        playerId: player.id,
        timeUntilForfeit: 60, // 60 seconds to reconnect
      },
    };

    // Notify the other player
    const otherPlayer = gameSession.playerA.id === player.id ? gameSession.playerB : gameSession.playerA;
    otherPlayer.socket.emit('PLAYER_DISCONNECTED', message);

    // TODO: Implement reconnection window
    // For now, end the game after disconnection
    setTimeout(() => {
      this.endGame(gameSession, gameSession.playerA.id === player.id ? 'B' : 'A', 'DISCONNECT');
    }, 60000);
  }

  private removeFromQueue(player: ConnectedPlayer): void {
    const index = this.matchmakingQueue.findIndex(entry => entry.player.id === player.id);
    if (index >= 0) {
      this.matchmakingQueue.splice(index, 1);
    }
  }

  private sendError(socket: Socket, code: string, message: string, details?: any): void {
    const error: WebSocketErrorMessage = {
      type: 'ERROR',
      timestamp: new Date(),
      messageId: uuidv4(),
      error: {
        code,
        message,
        details,
      },
    };

    socket.emit('ERROR', error);
  }

  private extractUserIdFromToken(token: string): string {
    // TODO: Implement proper JWT validation
    // For now, validate token is not empty and return a simple ID
    if (!token || token.trim().length === 0) {
      throw new Error('Invalid token: empty or undefined');
    }
    return token.length > 10 ? token.substring(0, 10) : uuidv4();
  }

  private startPingSystem(): void {
    this.pingInterval = setInterval(() => {
      const now = new Date();
      const timeout = this.config.pingTimeout || 60000;

      for (const [, player] of this.connectedPlayers.entries()) {
        const timeSinceLastPing = now.getTime() - player.lastPingTime.getTime();
        
        if (timeSinceLastPing > timeout) {
          console.log(`[WebSocketServer] Player ${player.username} timed out`);
          player.socket.disconnect(true);
        }
      }
    }, (this.config.pingInterval || 25000));
  }
}