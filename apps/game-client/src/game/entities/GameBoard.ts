/**
 * GameBoard Entity for Summoner's Grid
 * 
 * Manages the 12x14 tactical grid board with proper coordinate system.
 * Implements the GDD specification:
 * - 12 columns (width) x 14 rows (height)
 * - Coordinate system with (0,0) at bottom-left
 * - Territory control visualization
 * - Interactive tile selection and highlighting
 */

import Phaser from 'phaser';

export interface BoardPosition {
  x: number; // 0-11 (columns)
  y: number; // 0-13 (rows)
}

export interface TileInfo {
  position: BoardPosition;
  territory: 'player1' | 'player2' | 'neutral';
  isHighlighted: boolean;
  isSelected: boolean;
  sprite: Phaser.GameObjects.Image;
}

export class GameBoard {
  private scene: Phaser.Scene;
  private tiles: TileInfo[][] = [];
  private tileSize: number = 48;
  private boardWidth: number = 12; // GDD specification: 12x14 grid
  private boardHeight: number = 14;
  private startX: number;
  private startY: number;
  private selectedTile: BoardPosition | null = null;
  private highlightedTiles: Set<string> = new Set();

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
    this.calculateBoardPosition();
    this.createBoard();
    this.setupInteraction();
  }

  /**
   * Calculate board position to center it in the scene
   */
  private calculateBoardPosition(): void {
    const { width, height } = this.scene.cameras.main;
    
    const totalBoardWidth = this.boardWidth * this.tileSize;
    const totalBoardHeight = this.boardHeight * this.tileSize;
    
    this.startX = (width - totalBoardWidth) / 2;
    this.startY = (height - totalBoardHeight) / 2;
  }

  /**
   * Create the 12x14 grid board with proper coordinate system
   * Note: Phaser Y increases downward, but GDD specifies (0,0) at bottom-left
   */
  private createBoard(): void {
    for (let gridX = 0; gridX < this.boardWidth; gridX++) {
      this.tiles[gridX] = [];
      
      for (let gridY = 0; gridY < this.boardHeight; gridY++) {
        // Convert from grid coordinates to screen coordinates
        const screenX = this.startX + gridX * this.tileSize + this.tileSize / 2;
        // Invert Y to match GDD coordinate system (0,0 at bottom-left)
        const screenY = this.startY + (this.boardHeight - 1 - gridY) * this.tileSize + this.tileSize / 2;
        
        // Determine territory based on GDD specification
        // Player 1 controls first 3 rows (0-2), Player 2 controls last 3 rows (11-13)
        let territory: 'player1' | 'player2' | 'neutral';
        if (gridY <= 2) {
          territory = 'player1';
        } else if (gridY >= 11) {
          territory = 'player2';
        } else {
          territory = 'neutral';
        }

        // Create tile sprite
        const tileKey = this.getTileTextureKey(territory);
        const sprite = this.scene.add.image(screenX, screenY, tileKey);
        sprite.setDisplaySize(this.tileSize - 2, this.tileSize - 2); // Small gap between tiles
        sprite.setInteractive();

        // Store tile information
        const tileInfo: TileInfo = {
          position: { x: gridX, y: gridY },
          territory,
          isHighlighted: false,
          isSelected: false,
          sprite
        };

        this.tiles[gridX][gridY] = tileInfo;

        // Add coordinate labels for development (can be disabled in production)
        if (this.scene.game.config.physics?.arcade?.debug) {
          this.scene.add.text(screenX, screenY, `${gridX},${gridY}`, {
            font: '8px Arial',
            color: '#ffffff',
            backgroundColor: '#000000'
          }).setOrigin(0.5);
        }
      }
    }
  }

  /**
   * Get the appropriate texture key based on tile territory and state
   */
  private getTileTextureKey(territory: 'player1' | 'player2' | 'neutral'): string {
    switch (territory) {
      case 'player1':
        return 'tile-player1';
      case 'player2':
        return 'tile-player2';
      default:
        return 'tile-neutral';
    }
  }

  /**
   * Setup mouse/touch interaction for tile selection
   */
  private setupInteraction(): void {
    this.tiles.forEach(column => {
      column.forEach(tileInfo => {
        const { sprite, position } = tileInfo;

        // Hover effects
        sprite.on('pointerover', () => {
          if (!tileInfo.isSelected) {
            sprite.setTint(0xdddddd);
          }
        });

        sprite.on('pointerout', () => {
          if (!tileInfo.isSelected && !tileInfo.isHighlighted) {
            sprite.clearTint();
          }
        });

        // Click selection
        sprite.on('pointerdown', () => {
          this.selectTile(position);
        });
      });
    });
  }

  /**
   * Select a tile and emit events for game logic
   */
  public selectTile(position: BoardPosition): void {
    // Clear previous selection
    if (this.selectedTile) {
      const prevTile = this.tiles[this.selectedTile.x][this.selectedTile.y];
      prevTile.isSelected = false;
      this.updateTileVisual(prevTile);
    }

    // Set new selection
    this.selectedTile = position;
    const tile = this.tiles[position.x][position.y];
    tile.isSelected = true;
    this.updateTileVisual(tile);

    // Emit custom event for game logic to handle
    this.scene.events.emit('tileSelected', position, tile);
    
    console.log(`Tile selected at (${position.x}, ${position.y}) - Territory: ${tile.territory}`);
  }

  /**
   * Highlight specific tiles (for movement range, attack range, etc.)
   */
  public highlightTiles(positions: BoardPosition[]): void {
    // Clear previous highlights
    this.clearHighlights();

    // Add new highlights
    positions.forEach(pos => {
      if (this.isValidPosition(pos)) {
        const tile = this.tiles[pos.x][pos.y];
        tile.isHighlighted = true;
        this.highlightedTiles.add(`${pos.x},${pos.y}`);
        this.updateTileVisual(tile);
      }
    });
  }

  /**
   * Clear all tile highlights
   */
  public clearHighlights(): void {
    this.highlightedTiles.forEach(posString => {
      const [x, y] = posString.split(',').map(Number);
      const tile = this.tiles[x][y];
      tile.isHighlighted = false;
      this.updateTileVisual(tile);
    });
    this.highlightedTiles.clear();
  }

  /**
   * Update tile visual appearance based on its state
   */
  private updateTileVisual(tile: TileInfo): void {
    if (tile.isSelected) {
      tile.sprite.setTexture('tile-selected');
      tile.sprite.setTint(0xffffff);
    } else if (tile.isHighlighted) {
      tile.sprite.setTexture('tile-highlighted');
      tile.sprite.setTint(0xffffff);
    } else {
      tile.sprite.setTexture(this.getTileTextureKey(tile.territory));
      tile.sprite.clearTint();
    }
  }

  /**
   * Check if a position is within board bounds
   */
  public isValidPosition(position: BoardPosition): boolean {
    return position.x >= 0 && position.x < this.boardWidth &&
           position.y >= 0 && position.y < this.boardHeight;
  }

  /**
   * Get tile information at a specific position
   */
  public getTileAt(position: BoardPosition): TileInfo | null {
    if (!this.isValidPosition(position)) {
      return null;
    }
    return this.tiles[position.x][position.y];
  }

  /**
   * Convert screen coordinates to grid position
   */
  public screenToGrid(screenX: number, screenY: number): BoardPosition | null {
    const gridX = Math.floor((screenX - this.startX) / this.tileSize);
    const gridY = this.boardHeight - 1 - Math.floor((screenY - this.startY) / this.tileSize);
    
    const position = { x: gridX, y: gridY };
    return this.isValidPosition(position) ? position : null;
  }

  /**
   * Convert grid position to screen coordinates
   */
  public gridToScreen(position: BoardPosition): { x: number; y: number } | null {
    if (!this.isValidPosition(position)) {
      return null;
    }

    const screenX = this.startX + position.x * this.tileSize + this.tileSize / 2;
    const screenY = this.startY + (this.boardHeight - 1 - position.y) * this.tileSize + this.tileSize / 2;
    
    return { x: screenX, y: screenY };
  }

  /**
   * Get the currently selected tile
   */
  public getSelectedTile(): BoardPosition | null {
    return this.selectedTile;
  }

  /**
   * Get board dimensions
   */
  public getDimensions(): { width: number; height: number } {
    return { width: this.boardWidth, height: this.boardHeight };
  }
}