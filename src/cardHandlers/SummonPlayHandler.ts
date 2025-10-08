import { CardData } from '../Card';
import { ICardPlayHandler } from './ICardPlayHandler';
import { GridPosition, PlayerInfo } from '../types/GameTypes';

/**
 * Handler for playing Summon cards.
 * This implements the Single Responsibility Principle - it only handles
 * the logic for playing summon cards onto the grid.
 */
export class SummonPlayHandler implements ICardPlayHandler {
  private readonly GRID_COLS = 12;
  private readonly GRID_ROWS = 14;
  private readonly CELL_SIZE = 40;
  private readonly GRID_OFFSET_X = 200;
  private readonly GRID_OFFSET_Y = 100;

  private grid: Phaser.GameObjects.Rectangle[][];
  private playerInfo: PlayerInfo;
  private highlightedCells: Phaser.GameObjects.Rectangle[] = [];
  private instructionText: Phaser.GameObjects.Text | null = null;
  private placedTokens: Map<string, Phaser.GameObjects.Arc> = new Map();

  constructor(
    grid: Phaser.GameObjects.Rectangle[][],
    playerInfo: PlayerInfo
  ) {
    this.grid = grid;
    this.playerInfo = playerInfo;
  }

  canHandle(cardData: CardData): boolean {
    return cardData.type === 'Summon';
  }

  execute(
    cardData: CardData,
    scene: Phaser.Scene,
    onComplete: (success: boolean) => void
  ): void {
    console.log(`[SummonPlayHandler] Playing summon: ${cardData.name}`);

    // Show instruction text
    this.showInstructions(scene);

    // Highlight valid placement cells
    this.highlightValidCells(scene);

    // Set up click handlers for grid cells
    this.setupGridCellHandlers(scene, cardData, onComplete);
  }

  private showInstructions(scene: Phaser.Scene): void {
    const centerX = 600;
    const centerY = 650;

    this.instructionText = scene.add.text(
      centerX,
      centerY,
      'Select a valid territory space to summon',
      {
        fontSize: '20px',
        color: '#ffff00',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 }
      }
    ).setOrigin(0.5).setDepth(2000);
  }

  private hideInstructions(): void {
    if (this.instructionText) {
      this.instructionText.destroy();
      this.instructionText = null;
    }
  }

  private highlightValidCells(scene: Phaser.Scene): void {
    // Get valid rows based on player (bottom 3 rows for Player A)
    const validRows = this.getValidRows();

    validRows.forEach(row => {
      for (let col = 0; col < this.GRID_COLS; col++) {
        const cell = this.grid[row][col];
        
        // Store original color
        const originalFillColor = cell.fillColor;
        
        // Create highlight effect
        const highlight = scene.add.rectangle(
          cell.x,
          cell.y,
          this.CELL_SIZE - 2,
          this.CELL_SIZE - 2,
          0xffff00,
          0.2
        );
        highlight.setDepth(10);
        this.highlightedCells.push(highlight);

        // Add pulsing animation
        scene.tweens.add({
          targets: highlight,
          alpha: { from: 0.2, to: 0.4 },
          duration: 800,
          yoyo: true,
          repeat: -1
        });
      }
    });
  }

  private clearHighlights(): void {
    this.highlightedCells.forEach(highlight => highlight.destroy());
    this.highlightedCells = [];
  }

  private getValidRows(): number[] {
    // Player A (playerId 0) controls bottom 3 rows (0-2)
    // Player B (playerId 1) controls top 3 rows (11-13)
    if (this.playerInfo.playerId === 0) {
      return [0, 1, 2];
    } else {
      return [11, 12, 13];
    }
  }

  private isValidPlacement(position: GridPosition): boolean {
    const validRows = this.getValidRows();
    return validRows.includes(position.row);
  }

  private setupGridCellHandlers(
    scene: Phaser.Scene,
    cardData: CardData,
    onComplete: (success: boolean) => void
  ): void {
    const validRows = this.getValidRows();

    // Make valid cells interactive
    validRows.forEach(row => {
      for (let col = 0; col < this.GRID_COLS; col++) {
        const cell = this.grid[row][col];
        const position: GridPosition = { row, col };

        // Store if it was already interactive
        const wasInteractive = cell.input?.enabled || false;

        cell.setInteractive();

        // Add hover effect
        const hoverHandler = () => {
          if (this.isValidPlacement(position)) {
            cell.setStrokeStyle(3, 0xffff00);
          }
        };

        const outHandler = () => {
          cell.setStrokeStyle(1, 0x666666);
        };

        const clickHandler = () => {
          if (this.isValidPlacement(position)) {
            console.log(`[SummonPlayHandler] Placing summon at (${col},${row})`);
            
            // Place the token
            this.placeToken(scene, position, cardData);

            // Clean up
            this.cleanup(scene);

            // Complete the action
            onComplete(true);
          }
        };

        cell.on('pointerover', hoverHandler);
        cell.on('pointerout', outHandler);
        cell.once('pointerdown', clickHandler);

        // Store cleanup data
        cell.setData('summonHandlerCleanup', {
          hoverHandler,
          outHandler,
          clickHandler,
          wasInteractive
        });
      }
    });
  }

  private placeToken(
    scene: Phaser.Scene,
    position: GridPosition,
    cardData: CardData
  ): void {
    const cell = this.grid[position.row][position.col];
    const tokenRadius = 12;

    // Create a colored circle token
    const token = scene.add.circle(
      cell.x,
      cell.y,
      tokenRadius,
      this.playerInfo.color,
      1.0
    );
    token.setStrokeStyle(2, 0xffffff);
    token.setDepth(100);

    // Add a small animation
    token.setScale(0);
    scene.tweens.add({
      targets: token,
      scale: 1,
      duration: 300,
      ease: 'Back.easeOut'
    });

    // Store the token with a unique key
    const tokenKey = `${position.col}-${position.row}`;
    this.placedTokens.set(tokenKey, token);

    console.log(`[SummonPlayHandler] Token placed at (${position.col},${position.row})`);
  }

  private cleanup(scene: Phaser.Scene): void {
    // Clear highlights
    this.clearHighlights();

    // Hide instructions
    this.hideInstructions();

    // Remove event handlers from all cells
    const validRows = this.getValidRows();
    validRows.forEach(row => {
      for (let col = 0; col < this.GRID_COLS; col++) {
        const cell = this.grid[row][col];
        const cleanupData = cell.getData('summonHandlerCleanup');

        if (cleanupData) {
          cell.off('pointerover', cleanupData.hoverHandler);
          cell.off('pointerout', cleanupData.outHandler);
          cell.off('pointerdown', cleanupData.clickHandler);

          // Restore original interactive state
          if (!cleanupData.wasInteractive) {
            cell.disableInteractive();
          }

          cell.setData('summonHandlerCleanup', null);
        }

        // Reset stroke style
        cell.setStrokeStyle(1, 0x666666);
      }
    });
  }
}
