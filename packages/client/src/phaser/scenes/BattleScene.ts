/**
 * BattleScene - Main game scene for Summoner's Grid battles.
 * Handles grid rendering, player input, and game state visualization.
 */
import Phaser from 'phaser';
import type { GameState, GridPosition, Board } from '@summoners-grid/engine';
import { BOARD_WIDTH, BOARD_HEIGHT } from '@summoners-grid/engine';
import { Grid, DEFAULT_GRID_CONFIG, GridConfig } from '../objects/Grid';
import { DEFAULT_CELL_CONFIG } from '../objects/GridCell';

/** Scene key for registration */
export const BATTLE_SCENE_KEY = 'BattleScene';

/** BattleScene configuration */
export interface BattleSceneConfig {
  /** Grid configuration */
  gridConfig?: GridConfig;
  /** Background color */
  backgroundColor?: number;
}

/** Default BattleScene configuration */
const DEFAULT_BATTLE_SCENE_CONFIG: BattleSceneConfig = {
  gridConfig: DEFAULT_GRID_CONFIG,
  backgroundColor: 0x1a1a1a,
};

/** Events emitted by BattleScene */
export interface BattleSceneEvents {
  /** Emitted when a grid cell is clicked */
  cellClicked: (position: GridPosition, territory: number | null) => void;
  /** Emitted when the scene is ready */
  ready: () => void;
}

/**
 * BattleScene is the main Phaser scene for gameplay.
 * It renders the game board, units, and handles player input.
 */
export class BattleScene extends Phaser.Scene {
  /** The game grid */
  private grid!: Grid;
  /** Scene configuration */
  private config: BattleSceneConfig;
  /** Current game state (if any) */
  private gameState: GameState | null = null;

  constructor(config: BattleSceneConfig = DEFAULT_BATTLE_SCENE_CONFIG) {
    super({ key: BATTLE_SCENE_KEY });
    this.config = { ...DEFAULT_BATTLE_SCENE_CONFIG, ...config };
  }

  /**
   * Phaser preload - load assets.
   */
  preload(): void {
    // No assets to load for the minimal prototype
    // Future: load unit sprites, card images, etc.
  }

  /**
   * Phaser create - set up the scene.
   */
  create(): void {
    // Set background color
    this.cameras.main.setBackgroundColor(this.config.backgroundColor!);

    // Calculate grid position to center it
    const gridConfig = this.calculateGridConfig();

    // Create the grid
    this.grid = new Grid(this, gridConfig);

    // Set up grid event listeners
    this.grid.on('cellClicked', this.onGridCellClicked, this);

    // Add coordinate labels for debugging
    this.addCoordinateLabels();

    // Add territory legend
    this.addTerritoryLegend();

    // Emit ready event
    this.events.emit('ready');
  }

  /**
   * Calculate grid configuration to center the grid.
   */
  private calculateGridConfig(): GridConfig {
    const cellSize = this.config.gridConfig?.cellConfig?.cellSize ?? DEFAULT_CELL_CONFIG.cellSize;
    const gridWidth = BOARD_WIDTH * cellSize;
    const gridHeight = BOARD_HEIGHT * cellSize;
    const gameWidth = this.scale.width;
    const gameHeight = this.scale.height;

    return {
      ...DEFAULT_GRID_CONFIG,
      ...this.config.gridConfig,
      offsetX: Math.max(50, (gameWidth - gridWidth) / 2),
      offsetY: Math.max(50, (gameHeight - gridHeight) / 2),
    };
  }

  /**
   * Add coordinate labels around the grid edges.
   */
  private addCoordinateLabels(): void {
    const cellSize = this.config.gridConfig?.cellConfig?.cellSize ?? DEFAULT_CELL_CONFIG.cellSize;
    const offsetX = this.grid.x;
    const offsetY = this.grid.y;

    // X-axis labels (0-11) at bottom
    for (let x = 0; x < BOARD_WIDTH; x++) {
      this.add.text(
        offsetX + x * cellSize + cellSize / 2,
        offsetY + BOARD_HEIGHT * cellSize + 10,
        x.toString(),
        {
          fontSize: '12px',
          color: '#888888',
        }
      ).setOrigin(0.5, 0);
    }

    // Y-axis labels (0-13, with 0 at bottom)
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      // Screen Y is inverted from grid Y
      const screenY = (BOARD_HEIGHT - 1 - y) * cellSize + cellSize / 2;
      this.add.text(
        offsetX - 15,
        offsetY + screenY,
        y.toString(),
        {
          fontSize: '12px',
          color: '#888888',
        }
      ).setOrigin(1, 0.5);
    }
  }

  /**
   * Add a territory legend showing what colors mean.
   */
  private addTerritoryLegend(): void {
    const cellConfig = this.config.gridConfig?.cellConfig ?? DEFAULT_CELL_CONFIG;
    const legendX = this.scale.width - 150;
    const legendY = 20;

    // Title
    this.add.text(legendX, legendY, 'Territory', {
      fontSize: '14px',
      color: '#ffffff',
      fontStyle: 'bold',
    });

    // Player 0 (bottom)
    this.add.rectangle(legendX + 10, legendY + 30, 16, 16, cellConfig.colors.player0Territory);
    this.add.text(legendX + 25, legendY + 30, 'Player 0 (rows 0-2)', {
      fontSize: '11px',
      color: '#aaaaaa',
    }).setOrigin(0, 0.5);

    // Player 1 (top)
    this.add.rectangle(legendX + 10, legendY + 55, 16, 16, cellConfig.colors.player1Territory);
    this.add.text(legendX + 25, legendY + 55, 'Player 1 (rows 11-13)', {
      fontSize: '11px',
      color: '#aaaaaa',
    }).setOrigin(0, 0.5);

    // Unclaimed
    this.add.rectangle(legendX + 10, legendY + 80, 16, 16, cellConfig.colors.empty);
    this.add.text(legendX + 25, legendY + 80, 'Unclaimed', {
      fontSize: '11px',
      color: '#aaaaaa',
    }).setOrigin(0, 0.5);
  }

  /**
   * Handle grid cell click events.
   */
  private onGridCellClicked(data: {
    gridX: number;
    gridY: number;
    territory: number | null;
  }): void {
    // Emit event for external handlers (React bridge)
    this.events.emit('cellClicked', {
      x: data.gridX,
      y: data.gridY,
    }, data.territory);
  }

  /**
   * Update the scene with new game state.
   */
  public updateGameState(state: GameState): void {
    this.gameState = state;

    // Sync grid with board state
    this.grid.syncWithBoard(state.board);

    // Clear any existing highlights
    this.grid.clearHighlights();
  }

  /**
   * Highlight valid movement positions.
   */
  public showMovementRange(positions: GridPosition[]): void {
    this.grid.highlightMovement(positions);
  }

  /**
   * Highlight valid attack targets.
   */
  public showAttackTargets(positions: GridPosition[]): void {
    this.grid.highlightAttack(positions);
  }

  /**
   * Clear all highlights.
   */
  public clearHighlights(): void {
    this.grid.clearHighlights();
  }

  /**
   * Get the grid instance for external access.
   */
  public getGrid(): Grid {
    return this.grid;
  }

  /**
   * Convert screen position to grid position.
   */
  public screenToGrid(screenX: number, screenY: number): GridPosition | null {
    return this.grid.screenToGrid(screenX, screenY);
  }

  /**
   * Convert grid position to screen position.
   */
  public gridToScreen(position: GridPosition): { x: number; y: number } {
    return this.grid.gridToScreen(position);
  }

  /**
   * Phaser update - called every frame.
   */
  update(_time: number, _delta: number): void {
    // Future: animation updates, interpolation, etc.
  }
}
