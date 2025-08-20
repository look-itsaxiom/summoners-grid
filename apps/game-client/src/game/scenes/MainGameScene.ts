/**
 * Main Game Scene for Summoner's Grid
 * 
 * Handles the core tactical combat gameplay including:
 * - 12x14 grid board management
 * - Turn-based gameplay phases
 * - Interactive summon placement and movement
 * - Integration with React UI overlays
 */

import Phaser from 'phaser';
import { GameBoard, BoardPosition } from '../entities/GameBoard';

export class MainGameScene extends Phaser.Scene {
  private gameBoard!: GameBoard;
  private debugText!: Phaser.GameObjects.Text;
  private uiText!: Phaser.GameObjects.Text;
  private currentTurn: 'player1' | 'player2' = 'player1';
  private gamePhase: 'draw' | 'level' | 'action' | 'end' = 'draw';

  constructor() {
    super({ key: 'MainGameScene' });
  }

  create(): void {
    this.setupScene();
    this.createGameBoard();
    this.setupUI();
    this.setupEventHandlers();
    this.startGameLoop();
  }

  private setupScene(): void {
    const { width, height } = this.cameras.main;

    // Background
    this.add.rectangle(width / 2, height / 2, width, height, 0x1a1a2e);

    // Title
    this.add.text(width / 2, 30, 'Summoner\'s Grid - Tactical Combat', {
      font: '24px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Back to menu button
    this.createBackButton();
  }

  private createBackButton(): void {
    const backButton = this.add.text(30, 30, '← Back to Menu', {
      font: '16px Arial',
      color: '#4a90e2',
      backgroundColor: '#2c3e50',
      padding: { x: 10, y: 5 }
    }).setInteractive();

    backButton.on('pointerover', () => {
      backButton.setStyle({ color: '#ffffff', backgroundColor: '#4a90e2' });
    });

    backButton.on('pointerout', () => {
      backButton.setStyle({ color: '#4a90e2', backgroundColor: '#2c3e50' });
    });

    backButton.on('pointerdown', () => {
      this.scene.start('MainMenuScene');
    });
  }

  private createGameBoard(): void {
    this.gameBoard = new GameBoard(this);
    
    // Add some example highlights to demonstrate functionality
    this.gameBoard.highlightTiles([
      { x: 1, y: 1 },
      { x: 2, y: 1 },
      { x: 1, y: 2 }
    ]);
  }

  private setupUI(): void {
    const { width, height } = this.cameras.main;

    // Game state display
    this.uiText = this.add.text(20, 80, '', {
      font: '16px Arial',
      color: '#ffffff',
      backgroundColor: '#000000',
      padding: { x: 10, y: 10 }
    });

    // Debug information display
    this.debugText = this.add.text(width - 20, 80, '', {
      font: '14px Arial',
      color: '#cccccc',
      backgroundColor: '#000000',
      padding: { x: 10, y: 10 }
    }).setOrigin(1, 0);

    this.updateUI();

    // Instructions
    this.add.text(width / 2, height - 50, 'Click on tiles to select them. This demonstrates the 12x14 grid with (0,0) at bottom-left.', {
      font: '14px Arial',
      color: '#999999'
    }).setOrigin(0.5);

    this.add.text(width / 2, height - 30, 'Blue tiles: Player 1 territory | Red tiles: Player 2 territory | Gray tiles: Neutral territory', {
      font: '12px Arial',
      color: '#777777'
    }).setOrigin(0.5);
  }

  private setupEventHandlers(): void {
    // Listen for tile selection events from GameBoard
    this.events.on('tileSelected', (position: BoardPosition) => {
      this.handleTileSelection(position);
    });

    // Example: Right-click to clear selection and highlights
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      if (pointer.rightButtonDown()) {
        this.gameBoard.clearHighlights();
        this.updateDebugInfo(null);
      }
    });

    // Keyboard shortcuts for testing
    this.input.keyboard?.on('keydown-SPACE', () => {
      this.nextPhase();
    });

    this.input.keyboard?.on('keydown-ESC', () => {
      this.scene.start('MainMenuScene');
    });
  }

  private handleTileSelection(position: BoardPosition): void {
    const tile = this.gameBoard.getTileAt(position);
    if (!tile) return;

    // Update debug information
    this.updateDebugInfo(tile);

    // Example game logic: Highlight adjacent tiles when a tile is selected
    const adjacentTiles = this.getAdjacentTiles(position);
    this.gameBoard.highlightTiles(adjacentTiles);

    // Example: Demonstrate territory control rules
    if (tile.territory === this.currentTurn) {
      console.log(`Selected friendly territory for ${this.currentTurn}`);
    } else if (tile.territory === 'neutral') {
      console.log('Selected neutral territory - can be contested');
    } else {
      console.log('Selected enemy territory - requires special actions');
    }
  }

  private getAdjacentTiles(position: BoardPosition): BoardPosition[] {
    const adjacent: BoardPosition[] = [];
    const directions = [
      { x: -1, y: 0 }, { x: 1, y: 0 },  // Left, Right
      { x: 0, y: -1 }, { x: 0, y: 1 },  // Down, Up
      { x: -1, y: -1 }, { x: -1, y: 1 }, // Diagonals (GDD allows diagonal movement)
      { x: 1, y: -1 }, { x: 1, y: 1 }
    ];

    directions.forEach(dir => {
      const newPos = {
        x: position.x + dir.x,
        y: position.y + dir.y
      };
      if (this.gameBoard.isValidPosition(newPos)) {
        adjacent.push(newPos);
      }
    });

    return adjacent;
  }

  private updateDebugInfo(tile: any): void {
    if (tile) {
      const debugInfo = [
        `Selected Tile:`,
        `Position: (${tile.position.x}, ${tile.position.y})`,
        `Territory: ${tile.territory}`,
        `Screen Pos: ${Math.round(tile.sprite.x)}, ${Math.round(tile.sprite.y)}`,
        ``,
        `Board Info:`,
        `Size: ${this.gameBoard.getDimensions().width}x${this.gameBoard.getDimensions().height}`,
        `Coordinate System: (0,0) at bottom-left`,
        ``,
        `Controls:`,
        `Right-click: Clear highlights`,
        `SPACE: Next phase`,
        `ESC: Back to menu`
      ];
      this.debugText.setText(debugInfo.join('\n'));
    } else {
      this.debugText.setText('Right-click to clear\nSPACE: Next phase\nESC: Back to menu');
    }
  }

  private startGameLoop(): void {
    // Example turn structure based on GDD
    console.log('Game started! Beginning turn-based gameplay.');
    this.gamePhase = 'draw';
    this.currentTurn = 'player1';
    this.updateUI();
  }

  private nextPhase(): void {
    // Cycle through the four phases per GDD: Draw -> Level -> Action -> End
    switch (this.gamePhase) {
      case 'draw':
        this.gamePhase = 'level';
        break;
      case 'level':
        this.gamePhase = 'action';
        break;
      case 'action':
        this.gamePhase = 'end';
        break;
      case 'end':
        // Switch players and return to draw phase
        this.currentTurn = this.currentTurn === 'player1' ? 'player2' : 'player1';
        this.gamePhase = 'draw';
        break;
    }
    this.updateUI();
    console.log(`Phase changed: ${this.currentTurn} - ${this.gamePhase} phase`);
  }

  private updateUI(): void {
    const gameInfo = [
      `Current Turn: ${this.currentTurn.toUpperCase()}`,
      `Phase: ${this.gamePhase.toUpperCase()}`,
      ``,
      `Turn Structure (GDD):`,
      `1. Draw Phase`,
      `2. Level Phase`, 
      `3. Action Phase`,
      `4. End Phase`,
      ``,
      `Press SPACE for next phase`
    ];
    this.uiText.setText(gameInfo.join('\n'));
  }

  /**
   * Handle window resize to maintain responsive layout
   */
  resize(): void {
    // The GameBoard will need to recalculate its position
    // In a full implementation, this would trigger board repositioning
    console.log('Window resized - board repositioning would happen here');
  }

  /**
   * Public method for React components to interact with the game
   * This enables the hybrid Phaser + React architecture
   */
  public getGameState() {
    return {
      currentTurn: this.currentTurn,
      gamePhase: this.gamePhase,
      selectedTile: this.gameBoard.getSelectedTile(),
      boardDimensions: this.gameBoard.getDimensions()
    };
  }

  /**
   * Public method for React components to send commands to the game
   */
  public executeCommand(command: string, data?: any) {
    switch (command) {
      case 'nextPhase':
        this.nextPhase();
        break;
      case 'selectTile':
        if (data && data.x !== undefined && data.y !== undefined) {
          this.gameBoard.selectTile(data);
        }
        break;
      case 'clearHighlights':
        this.gameBoard.clearHighlights();
        break;
      default:
        console.warn(`Unknown command: ${command}`);
    }
  }
}