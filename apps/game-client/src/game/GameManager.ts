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
 * - Window resize handling for responsive design
 */

import Phaser from 'phaser';
import GameConfig from './GameConfig';
import { MainGameScene } from './scenes/MainGameScene';

export interface GameState {
  currentTurn: 'player1' | 'player2';
  gamePhase: 'draw' | 'level' | 'action' | 'end';
  selectedTile: { x: number; y: number } | null;
  boardDimensions: { width: number; height: number };
}

export class GameManager extends EventTarget {
  private game: Phaser.Game | null = null;
  private isInitialized: boolean = false;
  private gameState: GameState = {
    currentTurn: 'player1',
    gamePhase: 'draw',
    selectedTile: null,
    boardDimensions: { width: 12, height: 14 }
  };

  constructor() {
    super();
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
  public getGameState(): GameState {
    return { ...this.gameState };
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