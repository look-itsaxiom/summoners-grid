/**
 * GridCell - A single cell in the game grid.
 * Handles rendering, highlighting, and interaction for one grid position.
 */
import Phaser from 'phaser';
import type { PlayerIndex } from '@summoners-grid/engine';

/** Territory ownership state for visual styling */
export type TerritoryState = PlayerIndex | null;

/** Highlight modes for cell selection/targeting */
export type HighlightMode =
  | 'none'
  | 'movement' // Valid movement destination
  | 'attack' // Valid attack target
  | 'selected' // Currently selected
  | 'hover'; // Mouse hover

/** Configuration for cell appearance */
export interface GridCellConfig {
  cellSize: number;
  borderWidth: number;
  colors: {
    empty: number;
    player0Territory: number;
    player1Territory: number;
    border: number;
    movementHighlight: number;
    attackHighlight: number;
    selectedHighlight: number;
    hoverHighlight: number;
  };
}

/** Default cell configuration */
export const DEFAULT_CELL_CONFIG: GridCellConfig = {
  cellSize: 48,
  borderWidth: 1,
  colors: {
    empty: 0x2a2a2a,
    player0Territory: 0x1a3a5c, // Dark blue for player 0
    player1Territory: 0x5c1a1a, // Dark red for player 1
    border: 0x444444,
    movementHighlight: 0x3a7a3a, // Green
    attackHighlight: 0x7a3a3a, // Red
    selectedHighlight: 0x7a7a3a, // Yellow
    hoverHighlight: 0x4a4a4a, // Light gray
  },
};

/**
 * GridCell game object representing one cell of the 12x14 board.
 */
export class GridCell extends Phaser.GameObjects.Container {
  /** Grid X coordinate (0-11) */
  public readonly gridX: number;
  /** Grid Y coordinate (0-13, 0 at bottom) */
  public readonly gridY: number;
  /** Territory owner */
  private territory: TerritoryState;
  /** Current highlight mode */
  private highlightMode: HighlightMode = 'none';
  /** Cell configuration */
  private config: GridCellConfig;

  /** Graphics objects */
  private background: Phaser.GameObjects.Rectangle;
  private border: Phaser.GameObjects.Rectangle;
  private highlightOverlay: Phaser.GameObjects.Rectangle;

  constructor(
    scene: Phaser.Scene,
    gridX: number,
    gridY: number,
    territory: TerritoryState,
    config: GridCellConfig = DEFAULT_CELL_CONFIG
  ) {
    // Convert grid coordinates to screen coordinates
    // Y is inverted: grid Y=0 is at the bottom of the screen
    const screenX = gridX * config.cellSize + config.cellSize / 2;
    const screenY =
      (13 - gridY) * config.cellSize + config.cellSize / 2; // Invert Y for screen space

    super(scene, screenX, screenY);

    this.gridX = gridX;
    this.gridY = gridY;
    this.territory = territory;
    this.config = config;

    // Create background rectangle
    this.background = scene.add.rectangle(
      0,
      0,
      config.cellSize - config.borderWidth * 2,
      config.cellSize - config.borderWidth * 2,
      this.getTerritoryColor()
    );

    // Create border rectangle (stroke only)
    this.border = scene.add.rectangle(
      0,
      0,
      config.cellSize,
      config.cellSize
    );
    this.border.setStrokeStyle(config.borderWidth, config.colors.border);
    this.border.setFillStyle(0, 0); // Transparent fill

    // Create highlight overlay (initially invisible)
    this.highlightOverlay = scene.add.rectangle(
      0,
      0,
      config.cellSize - config.borderWidth * 2,
      config.cellSize - config.borderWidth * 2,
      0x000000,
      0
    );

    // Add children to container
    this.add([this.background, this.border, this.highlightOverlay]);

    // Enable interactivity
    this.setSize(config.cellSize, config.cellSize);
    this.setInteractive();

    // Set up hover events
    this.on('pointerover', this.onPointerOver, this);
    this.on('pointerout', this.onPointerOut, this);

    scene.add.existing(this);
  }

  /**
   * Get the fill color based on territory ownership.
   */
  private getTerritoryColor(): number {
    if (this.territory === 0) {
      return this.config.colors.player0Territory;
    } else if (this.territory === 1) {
      return this.config.colors.player1Territory;
    }
    return this.config.colors.empty;
  }

  /**
   * Set the highlight mode for this cell.
   */
  public setHighlight(mode: HighlightMode): void {
    this.highlightMode = mode;
    this.updateHighlight();
  }

  /**
   * Update the highlight overlay based on current mode.
   */
  private updateHighlight(): void {
    switch (this.highlightMode) {
      case 'movement':
        this.highlightOverlay.setFillStyle(
          this.config.colors.movementHighlight,
          0.4
        );
        break;
      case 'attack':
        this.highlightOverlay.setFillStyle(
          this.config.colors.attackHighlight,
          0.4
        );
        break;
      case 'selected':
        this.highlightOverlay.setFillStyle(
          this.config.colors.selectedHighlight,
          0.5
        );
        break;
      case 'hover':
        this.highlightOverlay.setFillStyle(
          this.config.colors.hoverHighlight,
          0.2
        );
        break;
      case 'none':
      default:
        this.highlightOverlay.setFillStyle(0, 0);
        break;
    }
  }

  /**
   * Handle pointer over (hover).
   */
  private onPointerOver(): void {
    if (this.highlightMode === 'none') {
      this.highlightOverlay.setFillStyle(this.config.colors.hoverHighlight, 0.2);
    }
  }

  /**
   * Handle pointer out.
   */
  private onPointerOut(): void {
    if (this.highlightMode === 'none') {
      this.highlightOverlay.setFillStyle(0, 0);
    }
  }

  /**
   * Update the territory ownership.
   */
  public setTerritory(territory: TerritoryState): void {
    this.territory = territory;
    this.background.setFillStyle(this.getTerritoryColor());
  }

  /**
   * Get current territory owner.
   */
  public getTerritory(): TerritoryState {
    return this.territory;
  }

  /**
   * Check if this cell is in a specific player's territory.
   */
  public isInTerritory(player: PlayerIndex): boolean {
    return this.territory === player;
  }
}
