import { ISummonAction } from './ISummonAction';
import { SummonUnit } from '../types/SummonUnit';
import { GridPosition } from '../types/GameTypes';
import { GameConfig } from '../config/GameConfig';

/**
 * Move action for summon units.
 * This follows the Single Responsibility Principle - it only handles
 * the logic for moving a summon unit.
 */
export class MoveAction implements ISummonAction {
  private grid: Phaser.GameObjects.Rectangle[][];
  private occupiedPositions: Map<string, SummonUnit>;
  private highlightedCells: Phaser.GameObjects.Rectangle[] = [];
  private instructionText: Phaser.GameObjects.Text | null = null;
  private isActive: boolean = false;
  private currentScene: Phaser.Scene | null = null;

  constructor(
    grid: Phaser.GameObjects.Rectangle[][],
    occupiedPositions: Map<string, SummonUnit>
  ) {
    this.grid = grid;
    this.occupiedPositions = occupiedPositions;
  }

  getName(): string {
    return 'Move';
  }

  canExecute(summon: SummonUnit): boolean {
    return summon.canMove();
  }

  execute(
    summon: SummonUnit,
    scene: Phaser.Scene,
    onComplete: (success: boolean) => void
  ): void {
    console.log(`[MoveAction] Moving summon: ${summon.cardData.name}`);

    // Mark this action as active
    this.isActive = true;
    this.currentScene = scene;

    // Show instruction text
    this.showInstructions(scene);

    // Highlight valid movement cells (for now, any empty cell)
    this.highlightValidCells(scene, summon);

    // Set up click handlers for grid cells
    this.setupGridCellHandlers(scene, summon, onComplete);
  }

  /**
   * Cancel the move action and clean up all UI elements
   */
  cancel(): void {
    if (this.isActive && this.currentScene) {
      console.log('[MoveAction] Canceling active move action');
      this.cleanup(this.currentScene);
      this.isActive = false;
      this.currentScene = null;
    }
  }

  private showInstructions(scene: Phaser.Scene): void {
    this.instructionText = scene.add
      .text(GameConfig.INSTRUCTION_X, GameConfig.INSTRUCTION_Y, 'Select a space to move to', {
        fontSize: '20px',
        color: '#00ff00',
        backgroundColor: '#000000',
        padding: { x: 10, y: 5 },
      })
      .setOrigin(0.5)
      .setDepth(2000);
  }

  private hideInstructions(): void {
    if (this.instructionText) {
      this.instructionText.destroy();
      this.instructionText = null;
    }
  }

  private highlightValidCells(scene: Phaser.Scene, summon: SummonUnit): void {
    // For now, allow movement to any space (as per requirements)
    // In future, can be restricted by movement range
    for (let row = 0; row < GameConfig.GRID_ROWS; row++) {
      for (let col = 0; col < GameConfig.GRID_COLS; col++) {
        const position: GridPosition = { row, col };
        
        // Skip current position
        if (row === summon.position.row && col === summon.position.col) {
          continue;
        }

        // Skip occupied positions
        const posKey = this.getPositionKey(position);
        if (this.occupiedPositions.has(posKey)) {
          continue;
        }

        const cell = this.grid[row][col];

        // Create highlight effect
        const highlight = scene.add.rectangle(
          cell.x,
          cell.y,
          GameConfig.CELL_SIZE - 2,
          GameConfig.CELL_SIZE - 2,
          0x00ff00,
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
          repeat: -1,
        });
      }
    }
  }

  private clearHighlights(): void {
    this.highlightedCells.forEach((highlight) => highlight.destroy());
    this.highlightedCells = [];
  }

  private setupGridCellHandlers(
    scene: Phaser.Scene,
    summon: SummonUnit,
    onComplete: (success: boolean) => void
  ): void {
    // Make all cells interactive for selection
    for (let row = 0; row < GameConfig.GRID_ROWS; row++) {
      for (let col = 0; col < GameConfig.GRID_COLS; col++) {
        const cell = this.grid[row][col];
        const position: GridPosition = { row, col };

        // Skip current position
        if (row === summon.position.row && col === summon.position.col) {
          continue;
        }

        // Skip occupied positions
        const posKey = this.getPositionKey(position);
        if (this.occupiedPositions.has(posKey)) {
          continue;
        }

        cell.setInteractive();

        const hoverHandler = () => {
          cell.setStrokeStyle(3, 0x00ff00);
        };

        const outHandler = () => {
          cell.setStrokeStyle(1, 0x666666);
        };

        const clickHandler = () => {
          console.log(`[MoveAction] Moving to (${col},${row})`);

          // Calculate movement cost (for now, just 1)
          const movementCost = 1;

          // Move the token
          this.moveToken(scene, summon, position);

          // Update summon state
          summon.useMovement(movementCost);
          summon.updatePosition(position);

          // Clean up
          this.cleanup(scene);

          // Complete the action
          onComplete(true);
        };

        cell.on('pointerover', hoverHandler);
        cell.on('pointerout', outHandler);
        cell.once('pointerdown', clickHandler);

        // Store cleanup data
        cell.setData('moveActionCleanup', {
          hoverHandler,
          outHandler,
          clickHandler,
        });
      }
    }
  }

  private moveToken(
    scene: Phaser.Scene,
    summon: SummonUnit,
    newPosition: GridPosition
  ): void {
    const cell = this.grid[newPosition.row][newPosition.col];

    // Animate the token to the new position
    scene.tweens.add({
      targets: summon.token,
      x: cell.x,
      y: cell.y,
      duration: 300,
      ease: 'Power2',
    });
  }

  private cleanup(scene: Phaser.Scene): void {
    // Clear highlights
    this.clearHighlights();

    // Hide instructions
    this.hideInstructions();

    // Remove event handlers from all cells
    for (let row = 0; row < GameConfig.GRID_ROWS; row++) {
      for (let col = 0; col < GameConfig.GRID_COLS; col++) {
        const cell = this.grid[row][col];
        const cleanupData = cell.getData('moveActionCleanup');

        if (cleanupData) {
          cell.off('pointerover', cleanupData.hoverHandler);
          cell.off('pointerout', cleanupData.outHandler);
          cell.off('pointerdown', cleanupData.clickHandler);
          cell.setData('moveActionCleanup', null);
        }

        // Reset stroke style
        cell.setStrokeStyle(1, 0x666666);
      }
    }

    // Mark as no longer active
    this.isActive = false;
    this.currentScene = null;
  }

  private getPositionKey(position: GridPosition): string {
    return `${position.col}-${position.row}`;
  }
}
