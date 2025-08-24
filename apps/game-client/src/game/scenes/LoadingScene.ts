/**
 * Loading Scene for Summoner's Grid
 * 
 * Handles initial asset loading and provides loading feedback to the player.
 * This scene loads all necessary assets for the game including:
 * - UI textures and sprites
 * - Game board assets
 * - Card images and icons
 * - Audio files
 */

import Phaser from 'phaser';

export class LoadingScene extends Phaser.Scene {
  private loadingText!: Phaser.GameObjects.Text;
  private progressBar!: Phaser.GameObjects.Graphics;
  private progressBox!: Phaser.GameObjects.Graphics;

  constructor() {
    super({ key: 'LoadingScene' });
  }

  preload(): void {
    this.createLoadingUI();
    this.setupLoadingEvents();
    this.createAssets();
  }

  private createLoadingUI(): void {
    const { width, height } = this.cameras.main;

    // Title text
    this.add.text(width / 2, height / 2 - 100, 'Summoner\'s Grid', {
      font: '48px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Loading text
    this.loadingText = this.add.text(width / 2, height / 2, 'Creating game assets...', {
      font: '24px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Progress bar background
    this.progressBox = this.add.graphics();
    this.progressBox.fillStyle(0x222222);
    this.progressBox.fillRect(width / 2 - 160, height / 2 + 50, 320, 30);

    // Progress bar
    this.progressBar = this.add.graphics();
  }

  private setupLoadingEvents(): void {
    this.load.on('progress', (value: number) => {
      this.updateProgress(value);
    });

    this.load.on('complete', () => {
      this.loadingText.setText('Assets created! Starting game...');
      // Transition to main menu after a brief delay
      this.time.delayedCall(1000, () => {
        this.scene.start('MainMenuScene');
      });
    });
  }

  private updateProgress(value: number): void {
    const { width, height } = this.cameras.main;
    
    this.progressBar.clear();
    this.progressBar.fillStyle(0x00ff00);
    this.progressBar.fillRect(width / 2 - 150, height / 2 + 60, 300 * value, 10);
  }

  /**
   * Create assets using Phaser's built-in graphics system
   */
  private createAssets(): void {
    // Create game assets directly using graphics
    this.createTileTextures();
    this.createCardTextures();
    this.createUITextures();
    
    this.loadingText.setText('All assets created!');
    
    // Trigger the complete event since we're creating assets directly
    this.time.delayedCall(500, () => {
      this.events.emit('complete');
    });
  }

  /**
   * Create tile textures for the game board using graphics
   */
  private createTileTextures(): void {
    this.createColoredTexture('tile-neutral', 64, 64, 0x444444, 0x666666);
    this.createColoredTexture('tile-player1', 64, 64, 0x4a90e2, 0x6ba3e8);
    this.createColoredTexture('tile-player2', 64, 64, 0xe24a4a, 0xe86b6b);
    this.createColoredTexture('tile-selected', 64, 64, 0xffff00, 0xffff66);
    this.createColoredTexture('tile-highlighted', 64, 64, 0x90ee90, 0xaaf2aa);
    
    this.updateProgress(0.4);
    this.loadingText.setText('Tile textures created...');
  }

  /**
   * Create card textures
   */
  private createCardTextures(): void {
    this.createColoredTexture('card-back', 100, 140, 0x2c3e50, 0x34495e);
    
    this.updateProgress(0.7);
    this.loadingText.setText('Card textures created...');
  }

  /**
   * Create UI element textures
   */
  private createUITextures(): void {
    this.createColoredTexture('button', 200, 50, 0x5a67d8, 0x4c51bf);
    
    this.updateProgress(1.0);
    this.loadingText.setText('UI textures created...');
  }

  /**
   * Create a colored texture with border using Phaser's graphics
   */
  private createColoredTexture(key: string, width: number, height: number, fillColor: number, borderColor?: number): void {
    // Check if texture already exists
    if (this.textures.exists(key)) {
      return;
    }
    
    const graphics = this.add.graphics();
    
    // Fill
    graphics.fillStyle(fillColor);
    graphics.fillRect(0, 0, width, height);
    
    // Border
    const useColor = borderColor !== undefined ? borderColor : 0x000000;
    graphics.lineStyle(2, useColor);
    graphics.strokeRect(1, 1, width - 2, height - 2);
    
    // Generate texture and clean up
    graphics.generateTexture(key, width, height);
    graphics.destroy();
  }
}