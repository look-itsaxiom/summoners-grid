/**
 * Grid - Manages the 12x14 game board visualization.
 * Handles cell creation, territory setup, and grid-wide operations.
 */
import Phaser from 'phaser';
import type { PlayerIndex, GridPosition, Board } from '@summoners-grid/engine';
import {
  BOARD_WIDTH,
  BOARD_HEIGHT,
  PLAYER_0_TERRITORY_ROWS,
  PLAYER_1_TERRITORY_ROWS,
} from '@summoners-grid/engine';
import {
  GridCell,
  HighlightMode,
  GridCellConfig,
  DEFAULT_CELL_CONFIG,
  TerritoryState,
} from './GridCell';

/** Grid configuration */
export interface GridConfig {
  /** Offset from left edge of scene */
  offsetX: number;
  /** Offset from top edge of scene */
  offsetY: number;
  /** Cell configuration */
  cellConfig: GridCellConfig;
}

/** Default grid configuration */
export const DEFAULT_GRID_CONFIG: GridConfig = {
  offsetX: 50,
  offsetY: 50,
  cellConfig: DEFAULT_CELL_CONFIG,
};

/**
 * Grid manages the entire 12x14 game board.
 */
export class Grid extends Phaser.GameObjects.Container {
  /** All grid cells indexed by [x][y] */
  private cells: GridCell[][];
  /** Grid configuration */
  private config: GridConfig;
  /** Currently selected cell */
  private selectedCell: GridCell | null = null;

  constructor(
    scene: Phaser.Scene,
    config: GridConfig = DEFAULT_GRID_CONFIG
  ) {
    super(scene, config.offsetX, config.offsetY);
    this.config = config;
    this.cells = [];

    this.createCells();
    scene.add.existing(this);
  }

  /**
   * Create all grid cells with initial territory setup.
   */
  private createCells(): void {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      this.cells[x] = [];
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        // Determine initial territory
        let territory: TerritoryState = null;
        if (PLAYER_0_TERRITORY_ROWS.includes(y)) {
          territory = 0;
        } else if (PLAYER_1_TERRITORY_ROWS.includes(y)) {
          territory = 1;
        }

        const cell = new GridCell(
          this.scene,
          x,
          y,
          territory,
          this.config.cellConfig
        );

        // Set up click handler
        cell.on('pointerdown', () => this.onCellClick(cell));

        this.cells[x][y] = cell;
        this.add(cell);
      }
    }
  }

  /**
   * Handle cell click events.
   */
  private onCellClick(cell: GridCell): void {
    // Clear previous selection
    if (this.selectedCell) {
      this.selectedCell.setHighlight('none');
    }

    // Set new selection
    this.selectedCell = cell;
    cell.setHighlight('selected');

    // Emit event for external handlers
    this.emit('cellClicked', {
      gridX: cell.gridX,
      gridY: cell.gridY,
      territory: cell.getTerritory(),
    });
  }

  /**
   * Get a cell at the given grid position.
   */
  public getCell(x: number, y: number): GridCell | null {
    if (x < 0 || x >= BOARD_WIDTH || y < 0 || y >= BOARD_HEIGHT) {
      return null;
    }
    return this.cells[x][y];
  }

  /**
   * Get a cell at a GridPosition.
   */
  public getCellAt(position: GridPosition): GridCell | null {
    return this.getCell(position.x, position.y);
  }

  /**
   * Highlight multiple cells for movement.
   */
  public highlightMovement(positions: GridPosition[]): void {
    for (const pos of positions) {
      const cell = this.getCellAt(pos);
      if (cell) {
        cell.setHighlight('movement');
      }
    }
  }

  /**
   * Highlight multiple cells for attack targets.
   */
  public highlightAttack(positions: GridPosition[]): void {
    for (const pos of positions) {
      const cell = this.getCellAt(pos);
      if (cell) {
        cell.setHighlight('attack');
      }
    }
  }

  /**
   * Clear all highlights.
   */
  public clearHighlights(): void {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        this.cells[x][y].setHighlight('none');
      }
    }
    this.selectedCell = null;
  }

  /**
   * Update the grid to match a board state.
   */
  public syncWithBoard(board: Board): void {
    for (let x = 0; x < BOARD_WIDTH; x++) {
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        const boardCell = board.cells[x][y];
        const gridCell = this.cells[x][y];
        gridCell.setTerritory(boardCell.territory);
      }
    }
  }

  /**
   * Get all cells in a player's territory.
   */
  public getTerritoryPositions(player: PlayerIndex): GridPosition[] {
    const positions: GridPosition[] = [];
    for (let x = 0; x < BOARD_WIDTH; x++) {
      for (let y = 0; y < BOARD_HEIGHT; y++) {
        if (this.cells[x][y].isInTerritory(player)) {
          positions.push({ x, y });
        }
      }
    }
    return positions;
  }

  /**
   * Get the currently selected cell position.
   */
  public getSelectedPosition(): GridPosition | null {
    if (!this.selectedCell) {
      return null;
    }
    return { x: this.selectedCell.gridX, y: this.selectedCell.gridY };
  }

  /**
   * Get the total pixel dimensions of the grid.
   */
  public getDimensions(): { width: number; height: number } {
    return {
      width: BOARD_WIDTH * this.config.cellConfig.cellSize,
      height: BOARD_HEIGHT * this.config.cellConfig.cellSize,
    };
  }

  /**
   * Convert screen coordinates to grid position.
   */
  public screenToGrid(screenX: number, screenY: number): GridPosition | null {
    const localX = screenX - this.x;
    const localY = screenY - this.y;

    const gridX = Math.floor(localX / this.config.cellConfig.cellSize);
    // Invert Y since screen Y increases downward but grid Y=0 is at bottom
    const gridY =
      BOARD_HEIGHT - 1 - Math.floor(localY / this.config.cellConfig.cellSize);

    if (gridX < 0 || gridX >= BOARD_WIDTH || gridY < 0 || gridY >= BOARD_HEIGHT) {
      return null;
    }

    return { x: gridX, y: gridY };
  }

  /**
   * Convert grid position to screen coordinates (center of cell).
   */
  public gridToScreen(position: GridPosition): { x: number; y: number } {
    const cell = this.getCellAt(position);
    if (cell) {
      return { x: this.x + cell.x, y: this.y + cell.y };
    }
    // Fallback calculation
    const cellSize = this.config.cellConfig.cellSize;
    return {
      x: this.x + position.x * cellSize + cellSize / 2,
      y: this.y + (BOARD_HEIGHT - 1 - position.y) * cellSize + cellSize / 2,
    };
  }
}
