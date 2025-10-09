import { CardData } from '../Card';
import { ICardPlayHandler } from './ICardPlayHandler';
import { GridPosition, PlayerInfo } from '../types/GameTypes';
import { SummonUnit } from '../types/SummonUnit';
import { ISummonAction, MoveAction, AttackAction } from '../summonActions';
import { SummonActionMenu } from '../ui/SummonActionMenu';
import { GameConfig } from '../config/GameConfig';

/**
 * Handler for playing Summon cards.
 * This implements the Single Responsibility Principle - it only handles
 * the logic for playing summon cards onto the grid.
 */
export class SummonPlayHandler implements ICardPlayHandler {
  private grid: Phaser.GameObjects.Rectangle[][];
  private playerInfo: PlayerInfo;
  private highlightedCells: Phaser.GameObjects.Rectangle[] = [];
  private instructionText: Phaser.GameObjects.Text | null = null;
  private placedSummons: Map<string, SummonUnit> = new Map();
  private currentActionMenu: SummonActionMenu | null = null;
  private availableActions: ISummonAction[];
  private activeAction: ISummonAction | null = null;
  private canPerformActionsCheck: (() => boolean) | null = null;

  constructor(
    grid: Phaser.GameObjects.Rectangle[][],
    playerInfo: PlayerInfo,
    canPerformActionsCheck?: () => boolean
  ) {
    this.grid = grid;
    this.playerInfo = playerInfo;
    this.canPerformActionsCheck = canPerformActionsCheck || null;
    
    // Initialize available actions (can be expanded in the future)
    this.availableActions = [
      new MoveAction(this.grid, this.placedSummons),
      new AttackAction()
    ];
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
    this.instructionText = scene.add.text(
      GameConfig.INSTRUCTION_X,
      GameConfig.INSTRUCTION_Y,
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
      for (let col = 0; col < GameConfig.GRID_COLS; col++) {
        const cell = this.grid[row][col];
        
        // Store original color
        const originalFillColor = cell.fillColor;
        
        // Create highlight effect
        const highlight = scene.add.rectangle(
          cell.x,
          cell.y,
          GameConfig.CELL_SIZE - 2,
          GameConfig.CELL_SIZE - 2,
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
      return GameConfig.PLAYER_A_TERRITORY_ROWS;
    } else {
      return GameConfig.PLAYER_B_TERRITORY_ROWS;
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
      for (let col = 0; col < GameConfig.GRID_COLS; col++) {
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

    // Create SummonUnit object
    const summonUnit = new SummonUnit(
      cardData,
      position,
      this.playerInfo.playerId,
      token
    );

    // Store the summon with a unique key
    const tokenKey = this.getPositionKey(position);
    this.placedSummons.set(tokenKey, summonUnit);

    // Make token interactive
    this.makeTokenInteractive(scene, summonUnit);

    console.log(`[SummonPlayHandler] Summon placed at (${position.col},${position.row})`);
  }

  private makeTokenInteractive(scene: Phaser.Scene, summon: SummonUnit): void {
    summon.token.setInteractive();

    // Add hover effect
    summon.token.on('pointerover', () => {
      summon.token.setScale(1.2);
      summon.token.setStrokeStyle(3, 0xffff00);
    });

    summon.token.on('pointerout', () => {
      summon.token.setScale(1.0);
      summon.token.setStrokeStyle(2, 0xffffff);
    });

    // Add click handler to show action menu
    summon.token.on('pointerdown', () => {
      this.onSummonClicked(scene, summon);
    });
  }

  private onSummonClicked(scene: Phaser.Scene, summon: SummonUnit): void {
    console.log(`[SummonPlayHandler] Summon clicked: ${summon.cardData.name}`);

    // Check if actions can be performed (phase/turn restriction)
    if (this.canPerformActionsCheck && !this.canPerformActionsCheck()) {
      console.log('[SummonPlayHandler] Cannot interact with summons during this phase or turn');
      return;
    }

    // Cancel any active action before showing new menu
    if (this.activeAction && this.activeAction.cancel) {
      console.log('[SummonPlayHandler] Canceling previous active action');
      this.activeAction.cancel();
      this.activeAction = null;
    }

    // Hide any existing menu
    if (this.currentActionMenu) {
      this.currentActionMenu.hide();
    }

    // Show action menu
    this.currentActionMenu = new SummonActionMenu(
      scene,
      summon,
      this.availableActions
    );

    this.currentActionMenu.show((action: ISummonAction) => {
      this.executeSummonAction(scene, summon, action);
    });
  }

  private executeSummonAction(
    scene: Phaser.Scene,
    summon: SummonUnit,
    action: ISummonAction
  ): void {
    console.log(`[SummonPlayHandler] Executing action: ${action.getName()}`);

    // Cancel any previously active action before starting a new one
    if (this.activeAction && this.activeAction.cancel) {
      console.log('[SummonPlayHandler] Canceling previous active action before executing new one');
      this.activeAction.cancel();
    }

    // Track the currently active action
    this.activeAction = action;

    // Update the occupied positions map before moving
    const oldKey = this.getPositionKey(summon.position);

    action.execute(summon, scene, (success: boolean) => {
      if (success) {
        console.log(`[SummonPlayHandler] Action completed: ${action.getName()}`);

        // Update the map if position changed (for move action)
        const newKey = this.getPositionKey(summon.position);
        if (oldKey !== newKey) {
          this.placedSummons.delete(oldKey);
          this.placedSummons.set(newKey, summon);
        }
      } else {
        console.log(`[SummonPlayHandler] Action failed: ${action.getName()}`);
      }

      // Clear the active action when complete
      if (this.activeAction === action) {
        this.activeAction = null;
      }
    });
  }

  private getPositionKey(position: GridPosition): string {
    return `${position.col}-${position.row}`;
  }

  private cleanup(scene: Phaser.Scene): void {
    // Clear highlights
    this.clearHighlights();

    // Hide instructions
    this.hideInstructions();

    // Remove event handlers from all cells
    const validRows = this.getValidRows();
    validRows.forEach(row => {
      for (let col = 0; col < GameConfig.GRID_COLS; col++) {
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
