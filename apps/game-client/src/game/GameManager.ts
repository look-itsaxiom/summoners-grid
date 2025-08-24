/**
 * Game Manager for Summoner's Grid
 * 
 * Manages the Phaser game instance and provides the bridge between
 * Phaser game logic and React UI components.
 * 
 * This class handles:
 * - Phaser game initialization and lifecycle
 * - Communication between Phaser scenes and React components
 * - Game state management and synchronization
 * - Real-time multiplayer integration via WebSocket
 * - Window resize handling for responsive design
 */

import Phaser from 'phaser';
import GameConfig from './GameConfig';
import { MainGameScene } from './scenes/MainGameScene';
import { gameWebSocketService, GameConnectionState } from '../services/game-websocket-service';
import { GameState as ServerGameState, Position } from '@summoners-grid/shared-types';

export interface ClientGameState {
  currentTurn: 'player1' | 'player2';
  gamePhase: 'draw' | 'level' | 'action' | 'end';
  selectedTile: { x: number; y: number } | null;
  boardDimensions: { width: number; height: number };
  isMultiplayer: boolean;
  connectionState: GameConnectionState;
  serverGameState: ServerGameState | null;
}

export class GameManager extends EventTarget {
  private game: Phaser.Game | null = null;
  private isInitialized: boolean = false;
  private gameState: ClientGameState = {
    currentTurn: 'player1',
    gamePhase: 'draw',
    selectedTile: null,
    boardDimensions: { width: 12, height: 14 },
    isMultiplayer: false,
    connectionState: {
      isConnected: false,
      isAuthenticated: false,
      isInQueue: false,
      currentGameId: null,
      playerRole: null,
      latency: 0
    },
    serverGameState: null
  };

  constructor() {
    super();
    this.setupWebSocketListeners();
  }

  /**
   * Initialize the Phaser game instance
   * @param containerId - DOM element ID where the game canvas will be mounted
   */
  public async initialize(containerId: string): Promise<void> {
    if (this.isInitialized) {
      console.warn('Game already initialized');
      return;
    }

    try {
      // Update the config to use the provided container
      const config = {
        ...GameConfig,
        parent: containerId
      };

      // Create the Phaser game instance
      this.game = new Phaser.Game(config);

      // Set up event listeners for game state changes
      this.setupGameEventListeners();

      this.isInitialized = true;
      console.log('Phaser game initialized successfully');

      // Emit initialization complete event for React components
      this.dispatchEvent(new CustomEvent('gameInitialized'));

    } catch (error) {
      console.error('Failed to initialize Phaser game:', error);
      throw error;
    }
  }

  /**
   * Set up event listeners to synchronize game state with React
   */
  private setupGameEventListeners(): void {
    if (!this.game) return;

    // Listen for scene events that affect game state
    this.game.events.on('scene-ready', (scene: Phaser.Scene) => {
      console.log(`Scene ready: ${scene.scene.key}`);
      
      if (scene instanceof MainGameScene) {
        this.setupMainGameSceneListeners(scene);
      }
    });

    // Handle window resize for responsive design
    this.game.scale.on('resize', this.handleResize.bind(this));
  }

  /**
   * Set up WebSocket event listeners for real-time multiplayer
   */
  private setupWebSocketListeners(): void {
    // Connection events
    gameWebSocketService.addEventListener('connected', () => {
      this.updateConnectionState();
      this.dispatchEvent(new CustomEvent('networkConnected'));
    });

    gameWebSocketService.addEventListener('authenticated', (event: any) => {
      this.updateConnectionState();
      this.dispatchEvent(new CustomEvent('networkAuthenticated', { detail: event.detail }));
    });

    gameWebSocketService.addEventListener('disconnected', (event: any) => {
      this.updateConnectionState();
      this.dispatchEvent(new CustomEvent('networkDisconnected', { detail: event.detail }));
    });

    // Matchmaking events
    gameWebSocketService.addEventListener('queueStatus', (event: any) => {
      this.updateConnectionState();
      this.dispatchEvent(new CustomEvent('queueStatusChanged', { detail: event.detail }));
    });

    gameWebSocketService.addEventListener('matchFound', (event: any) => {
      this.dispatchEvent(new CustomEvent('matchFound', { detail: event.detail }));
    });

    // Game events
    gameWebSocketService.addEventListener('gameStarted', (event: any) => {
      this.handleGameStarted(event.detail);
    });

    gameWebSocketService.addEventListener('gameStateUpdate', (event: any) => {
      this.handleGameStateUpdate(event.detail);
    });

    gameWebSocketService.addEventListener('gameEnded', (event: any) => {
      this.handleGameEnded(event.detail);
    });

    // Prediction and lag compensation events
    gameWebSocketService.addEventListener('predictedMove', (event: any) => {
      this.handlePredictedMove(event.detail);
    });

    gameWebSocketService.addEventListener('moveConfirmed', (event: any) => {
      this.handleMoveConfirmed(event.detail);
    });

    gameWebSocketService.addEventListener('moveRejected', (event: any) => {
      this.handleMoveRejected(event.detail);
    });

    // Latency monitoring
    gameWebSocketService.addEventListener('latencyUpdate', (event: any) => {
      this.updateConnectionState();
      this.dispatchEvent(new CustomEvent('latencyChanged', { detail: event.detail }));
    });
  }

  /**
   * Update local connection state from WebSocket service
   */
  private updateConnectionState(): void {
    this.gameState.connectionState = gameWebSocketService.getConnectionState();
    this.dispatchEvent(new CustomEvent('gameStateChanged', { 
      detail: this.gameState 
    }));
  }

  /**
   * Handle multiplayer game started
   */
  private handleGameStarted(data: any): void {
    console.log('Multiplayer game started:', data);
    this.gameState.isMultiplayer = true;
    this.gameState.serverGameState = data.gameState;
    this.gameState.connectionState.currentGameId = data.gameState.gameId;
    this.gameState.connectionState.playerRole = data.playerRole;
    
    // Switch to the main game scene and sync with server state
    this.switchScene('MainGameScene');
    this.syncGameStateWithServer();
    
    this.dispatchEvent(new CustomEvent('multiplayerGameStarted', { detail: data }));
  }

  /**
   * Handle game state updates from server
   */
  private handleGameStateUpdate(data: { gameState: ServerGameState; updateReason: string }): void {
    console.log('Server game state update:', data.updateReason);
    this.gameState.serverGameState = data.gameState;
    
    // Sync Phaser game with server state
    this.syncGameStateWithServer();
    
    this.dispatchEvent(new CustomEvent('gameStateChanged', { 
      detail: this.gameState 
    }));
  }

  /**
   * Handle multiplayer game ended
   */
  private handleGameEnded(data: any): void {
    console.log('Multiplayer game ended:', data);
    this.gameState.isMultiplayer = false;
    this.gameState.serverGameState = null;
    this.gameState.connectionState.currentGameId = null;
    this.gameState.connectionState.playerRole = null;
    
    this.dispatchEvent(new CustomEvent('multiplayerGameEnded', { detail: data }));
  }

  /**
   * Handle predicted moves for lag compensation
   */
  private handlePredictedMove(data: any): void {
    console.log('Applying predicted move:', data);
    // Apply the move optimistically to the Phaser game
    this.sendCommand('applyPredictedMove', data);
  }

  /**
   * Handle confirmed moves
   */
  private handleMoveConfirmed(data: any): void {
    console.log('Move confirmed by server:', data);
    // Remove any visual indicators of unconfirmed moves
    this.sendCommand('confirmMove', data);
  }

  /**
   * Handle rejected moves
   */
  private handleMoveRejected(data: any): void {
    console.log('Move rejected by server:', data);
    // Rollback the predicted move in the Phaser game
    this.sendCommand('rollbackMove', data);
  }

  /**
   * Sync Phaser game state with server game state
   */
  private syncGameStateWithServer(): void {
    if (!this.gameState.serverGameState) return;
    
    const activeScene = this.game?.scene.getScene('MainGameScene') as MainGameScene;
    if (activeScene && activeScene.scene.isActive()) {
      // Send the server game state to the Phaser scene
      activeScene.executeCommand('syncServerState', this.gameState.serverGameState);
    }
  }

  /**
   * Set up specific listeners for the main game scene
   */
  private setupMainGameSceneListeners(scene: MainGameScene): void {
    // Listen for game state changes and sync with React
    const updateGameState = () => {
      this.gameState = scene.getGameState();
      this.dispatchEvent(new CustomEvent('gameStateChanged', { 
        detail: this.gameState 
      }));
    };

    // Set up periodic state sync (in a real implementation, this would be event-driven)
    setInterval(updateGameState, 100);
  }

  /**
   * Handle window resize events to maintain responsive layout
   */
  private handleResize(gameSize: any): void {
    console.log('Game resized:', gameSize);
    
    // Emit resize event for React components
    this.dispatchEvent(new CustomEvent('gameResized', { 
      detail: { 
        width: gameSize.width, 
        height: gameSize.height 
      } 
    }));
  }

  /**
   * Get the current game state for React components
   */
  public getGameState(): ClientGameState {
    return { ...this.gameState };
  }

  /**
   * Connect to the multiplayer game server
   */
  public async connectToGameServer(authToken: string): Promise<void> {
    try {
      await gameWebSocketService.connect(authToken);
      console.log('Connected to game server successfully');
    } catch (error) {
      console.error('Failed to connect to game server:', error);
      throw error;
    }
  }

  /**
   * Disconnect from the multiplayer game server
   */
  public disconnectFromGameServer(): void {
    gameWebSocketService.disconnect();
    this.gameState.isMultiplayer = false;
    this.gameState.serverGameState = null;
  }

  /**
   * Join matchmaking queue
   */
  public joinQueue(gameMode: 'RANKED' | 'CASUAL' | 'PRIVATE' = 'CASUAL', deckId: string = 'default-deck'): void {
    gameWebSocketService.joinQueue(gameMode, deckId);
  }

  /**
   * Leave matchmaking queue
   */
  public leaveQueue(): void {
    gameWebSocketService.leaveQueue();
  }

  /**
   * Accept a found match
   */
  public acceptMatch(gameId: string): void {
    gameWebSocketService.acceptMatch(gameId);
  }

  /**
   * Decline a found match
   */
  public declineMatch(gameId: string): void {
    gameWebSocketService.declineMatch(gameId);
  }

  /**
   * Signal ready for game start
   */
  public playerReady(): void {
    const gameId = this.gameState.connectionState.currentGameId;
    if (gameId) {
      gameWebSocketService.playerReady(gameId);
    }
  }

  /**
   * Play a card in multiplayer game
   */
  public playCard(cardId: string, position?: Position, target?: any): void {
    const gameId = this.gameState.connectionState.currentGameId;
    if (gameId && this.gameState.isMultiplayer) {
      gameWebSocketService.playCard(gameId, cardId, position, target);
    } else {
      // Single-player mode - execute locally
      this.sendCommand('playCard', { cardId, position, target });
    }
  }

  /**
   * Move a summon in multiplayer game
   */
  public moveSummon(summonId: string, fromPosition: Position, toPosition: Position): void {
    const gameId = this.gameState.connectionState.currentGameId;
    if (gameId && this.gameState.isMultiplayer) {
      gameWebSocketService.moveSummon(gameId, summonId, fromPosition, toPosition);
    } else {
      // Single-player mode - execute locally
      this.sendCommand('moveSummon', { summonId, fromPosition, toPosition });
    }
  }

  /**
   * Attack with a summon in multiplayer game
   */
  public attack(attackerId: string, target: any): void {
    const gameId = this.gameState.connectionState.currentGameId;
    if (gameId && this.gameState.isMultiplayer) {
      gameWebSocketService.attack(gameId, attackerId, target);
    } else {
      // Single-player mode - execute locally
      this.sendCommand('attack', { attackerId, target });
    }
  }

  /**
   * End the current phase
   */
  public endPhase(phase: string): void {
    const gameId = this.gameState.connectionState.currentGameId;
    if (gameId && this.gameState.isMultiplayer) {
      gameWebSocketService.endPhase(gameId, phase);
    } else {
      // Single-player mode - execute locally
      this.sendCommand('endPhase', { phase });
    }
  }

  /**
   * Surrender the current game
   */
  public surrender(): void {
    const gameId = this.gameState.connectionState.currentGameId;
    if (gameId && this.gameState.isMultiplayer) {
      gameWebSocketService.surrender(gameId);
    } else {
      // Single-player mode - handle locally
      this.sendCommand('surrender', {});
    }
  }

  /**
   * Get current network latency
   */
  public getLatency(): number {
    return gameWebSocketService.getLatency();
  }

  /**
   * Send a command to the active game scene
   */
  public sendCommand(command: string, data?: any): void {
    if (!this.game || !this.isInitialized) {
      console.warn('Game not initialized, command ignored:', command);
      return;
    }

    const activeScene = this.game.scene.getScene('MainGameScene') as MainGameScene;
    if (activeScene && activeScene.scene.isActive()) {
      activeScene.executeCommand(command, data);
    } else {
      console.warn('MainGameScene not active, command ignored:', command);
    }
  }

  /**
   * Transition to a specific scene
   */
  public switchScene(sceneKey: string): void {
    if (!this.game || !this.isInitialized) {
      console.warn('Game not initialized, scene switch ignored');
      return;
    }

    this.game.scene.start(sceneKey);
  }

  /**
   * Pause the game
   */
  public pause(): void {
    if (this.game && this.isInitialized) {
      this.game.scene.pause();
    }
  }

  /**
   * Resume the game
   */
  public resume(): void {
    if (this.game && this.isInitialized) {
      this.game.scene.resume();
    }
  }

  /**
   * Destroy the game instance and clean up resources
   */
  public destroy(): void {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
    }
    this.isInitialized = false;
    console.log('Phaser game destroyed');
  }

  /**
   * Check if the game is currently initialized
   */
  public isGameInitialized(): boolean {
    return this.isInitialized && this.game !== null;
  }

  /**
   * Get performance statistics for debugging
   */
  public getPerformanceStats(): any {
    if (!this.game) return null;

    return {
      fps: this.game.loop.actualFps,
      memory: (performance as any).memory ? {
        used: Math.round((performance as any).memory.usedJSHeapSize / 1048576),
        total: Math.round((performance as any).memory.totalJSHeapSize / 1048576)
      } : null,
      renderType: this.game.renderer.type === Phaser.WEBGL ? 'WebGL' : 'Canvas'
    };
  }
}