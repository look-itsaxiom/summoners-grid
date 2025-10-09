import { GameConfig } from '../config/GameConfig';

/**
 * Manages the game grid/board creation and coordinate system.
 * Single Responsibility: Only handles grid creation and coordinate labeling.
 */
export class GridManager {
  private scene: Phaser.Scene;
  private grid: Phaser.GameObjects.Rectangle[][];

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.grid = [];
  }

  /**
   * Creates the game board with territory coloring
   * @returns The created grid
   */
  public createGrid(): Phaser.GameObjects.Rectangle[][] {
    // Create 12x14 grid
    for (let row = 0; row < GameConfig.GRID_ROWS; row++) {
      this.grid[row] = [];
      for (let col = 0; col < GameConfig.GRID_COLS; col++) {
        const x = GameConfig.GRID_OFFSET_X + col * GameConfig.CELL_SIZE;
        // Flip Y coordinate so row 0 appears at bottom (Player A territory faces player)
        const y = GameConfig.GRID_OFFSET_Y + (GameConfig.GRID_ROWS - 1 - row) * GameConfig.CELL_SIZE;

        // Determine cell color based on territory
        const cellColor = this.getCellColor(row);

        const cell = this.scene.add.rectangle(
          x + GameConfig.CELL_SIZE / 2,
          y + GameConfig.CELL_SIZE / 2,
          GameConfig.CELL_SIZE - 2,
          GameConfig.CELL_SIZE - 2,
          cellColor
        );
        cell.setStrokeStyle(1, 0x666666);

        this.grid[row][col] = cell;
      }
    }

    // Add coordinate labels
    this.addCoordinateLabels();

    return this.grid;
  }

  /**
   * Determines the color of a cell based on its row (territory)
   */
  private getCellColor(row: number): number {
    if (row < 3) {
      return GameConfig.PLAYER_A_TERRITORY_COLOR; // Player territory (bottom 3 rows)
    } else if (row >= GameConfig.GRID_ROWS - 3) {
      return GameConfig.PLAYER_B_TERRITORY_COLOR; // Opponent territory (top 3 rows)
    }
    return GameConfig.NEUTRAL_TERRITORY_COLOR; // Neutral territory
  }

  /**
   * Adds coordinate labels to the grid
   */
  private addCoordinateLabels(): void {
    // Column labels (1-12)
    for (let col = 0; col < GameConfig.GRID_COLS; col++) {
      const x = GameConfig.GRID_OFFSET_X + col * GameConfig.CELL_SIZE + GameConfig.CELL_SIZE / 2;
      const y = GameConfig.GRID_OFFSET_Y - 15;
      this.scene.add
        .text(x, y, (col + 1).toString(), {
          fontSize: '10px',
          color: '#888888',
        })
        .setOrigin(0.5);
    }

    // Row labels (1-14) - flip to match visual layout
    for (let row = 0; row < GameConfig.GRID_ROWS; row++) {
      const x = GameConfig.GRID_OFFSET_X - 15;
      // Use flipped Y coordinate to match visual grid position
      const y = GameConfig.GRID_OFFSET_Y + (GameConfig.GRID_ROWS - 1 - row) * GameConfig.CELL_SIZE + GameConfig.CELL_SIZE / 2;
      this.scene.add
        .text(x, y, (row + 1).toString(), {
          fontSize: '10px',
          color: '#888888',
        })
        .setOrigin(0.5);
    }
  }

  /**
   * Gets the created grid
   */
  public getGrid(): Phaser.GameObjects.Rectangle[][] {
    return this.grid;
  }
}
