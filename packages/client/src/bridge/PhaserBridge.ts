/**
 * PhaserBridge - Manages communication between React and Phaser.
 * Provides a clean interface for React components to interact with the Phaser game.
 */
import Phaser from 'phaser';
import type { GameState, GridPosition } from '@summoners-grid/engine';
import { BattleScene, BATTLE_SCENE_KEY } from '../phaser/scenes/BattleScene';

/** Events that can be subscribed to */
export interface BridgeEvents {
  /** Called when a grid cell is clicked */
  onCellClick?: (position: GridPosition, territory: number | null) => void;
  /** Called when the scene is ready */
  onSceneReady?: () => void;
}

/** Phaser game configuration */
export interface PhaserGameConfig {
  /** DOM element ID or element to mount the game */
  parent: string | HTMLElement;
  /** Game width */
  width: number;
  /** Game height */
  height: number;
  /** Background color */
  backgroundColor?: number;
}

/** Default game configuration */
const DEFAULT_GAME_CONFIG: PhaserGameConfig = {
  parent: 'phaser-container',
  width: 800,
  height: 800,
  backgroundColor: 0x1a1a1a,
};

/**
 * PhaserBridge manages the Phaser game instance and provides
 * a clean API for React to interact with the game.
 */
export class PhaserBridge {
  private game: Phaser.Game | null = null;
  private battleScene: BattleScene | null = null;
  private eventHandlers: BridgeEvents = {};
  private isReady = false;

  /**
   * Initialize the Phaser game.
   */
  public init(config: Partial<PhaserGameConfig> = {}): void {
    if (this.game) {
      console.warn('PhaserBridge: Game already initialized');
      return;
    }

    const finalConfig = { ...DEFAULT_GAME_CONFIG, ...config };

    // Create Phaser game configuration
    const phaserConfig: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: finalConfig.parent,
      width: finalConfig.width,
      height: finalConfig.height,
      backgroundColor: finalConfig.backgroundColor,
      scene: [BattleScene],
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
      render: {
        pixelArt: false,
        antialias: true,
      },
    };

    this.game = new Phaser.Game(phaserConfig);

    // Wait for scene to be ready
    this.game.events.once('ready', () => {
      this.battleScene = this.game!.scene.getScene(BATTLE_SCENE_KEY) as BattleScene;
      this.setupSceneEvents();
    });
  }

  /**
   * Set up event listeners on the battle scene.
   */
  private setupSceneEvents(): void {
    if (!this.battleScene) return;

    // Listen for scene ready
    this.battleScene.events.on('ready', () => {
      this.isReady = true;
      this.eventHandlers.onSceneReady?.();
    });

    // Listen for cell clicks
    this.battleScene.events.on('cellClicked', (position: GridPosition, territory: number | null) => {
      this.eventHandlers.onCellClick?.(position, territory);
    });
  }

  /**
   * Set event handlers.
   */
  public setEventHandlers(handlers: BridgeEvents): void {
    this.eventHandlers = handlers;

    // If already ready, call the handler
    if (this.isReady && handlers.onSceneReady) {
      handlers.onSceneReady();
    }
  }

  /**
   * Update the game state in Phaser.
   */
  public updateGameState(state: GameState): void {
    if (!this.battleScene) {
      console.warn('PhaserBridge: Scene not ready');
      return;
    }
    this.battleScene.updateGameState(state);
  }

  /**
   * Show movement range for a unit.
   */
  public showMovementRange(positions: GridPosition[]): void {
    this.battleScene?.showMovementRange(positions);
  }

  /**
   * Show attack targets.
   */
  public showAttackTargets(positions: GridPosition[]): void {
    this.battleScene?.showAttackTargets(positions);
  }

  /**
   * Clear all highlights.
   */
  public clearHighlights(): void {
    this.battleScene?.clearHighlights();
  }

  /**
   * Check if the bridge is ready.
   */
  public getIsReady(): boolean {
    return this.isReady;
  }

  /**
   * Get the Phaser game instance.
   */
  public getGame(): Phaser.Game | null {
    return this.game;
  }

  /**
   * Get the battle scene instance.
   */
  public getBattleScene(): BattleScene | null {
    return this.battleScene;
  }

  /**
   * Destroy the Phaser game.
   */
  public destroy(): void {
    if (this.game) {
      this.game.destroy(true);
      this.game = null;
      this.battleScene = null;
      this.isReady = false;
    }
  }
}

/** Singleton bridge instance */
let bridgeInstance: PhaserBridge | null = null;

/**
 * Get the shared PhaserBridge instance.
 */
export function getPhaserBridge(): PhaserBridge {
  if (!bridgeInstance) {
    bridgeInstance = new PhaserBridge();
  }
  return bridgeInstance;
}

/**
 * Reset the bridge instance (useful for hot reloading).
 */
export function resetPhaserBridge(): void {
  if (bridgeInstance) {
    bridgeInstance.destroy();
    bridgeInstance = null;
  }
}
