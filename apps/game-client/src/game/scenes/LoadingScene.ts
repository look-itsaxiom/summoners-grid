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
    this.loadAssets();
  }

  private createLoadingUI(): void {
    const { width, height } = this.cameras.main;

    // Title text
    this.add.text(width / 2, height / 2 - 100, 'Summoner\'s Grid', {
      font: '48px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Loading text
    this.loadingText = this.add.text(width / 2, height / 2, 'Loading...', {
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

    this.load.on('fileprogress', (file: Phaser.Loader.File) => {
      this.loadingText.setText(`Loading: ${file.key}`);
    });

    this.load.on('complete', () => {
      this.loadingText.setText('Loading Complete!');
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

  private loadAssets(): void {
    // For now, create simple colored rectangles as placeholder assets
    // In a full implementation, these would be actual image files
    
    // Create simple colored rectangles for game board tiles
    this.load.image('tile-neutral', 'data:image/png;base64,' + this.createColoredSquare('#444444'));
    this.load.image('tile-player1', 'data:image/png;base64,' + this.createColoredSquare('#4a90e2'));
    this.load.image('tile-player2', 'data:image/png;base64,' + this.createColoredSquare('#e24a4a'));
    this.load.image('tile-selected', 'data:image/png;base64,' + this.createColoredSquare('#ffff00'));
    this.load.image('tile-highlighted', 'data:image/png;base64,' + this.createColoredSquare('#90ee90'));

    // Card placeholder
    this.load.image('card-back', 'data:image/png;base64,' + this.createCardBack());
    
    // UI elements
    this.load.image('button', 'data:image/png;base64,' + this.createButton());

    // Simulate some loading time for demonstration
    for (let i = 0; i < 10; i++) {
      this.load.image(`placeholder-${i}`, 'data:image/png;base64,' + this.createColoredSquare('#' + Math.floor(Math.random()*16777215).toString(16)));
    }
  }

  /**
   * Creates a base64 encoded colored square for placeholder graphics
   */
  private createColoredSquare(color: string): string {
    // Create a simple 64x64 colored square
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, 64, 64);
    
    // Add a border
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 62, 62);
    
    return canvas.toDataURL().split(',')[1];
  }

  /**
   * Creates a base64 encoded card back design
   */
  private createCardBack(): string {
    const canvas = document.createElement('canvas');
    canvas.width = 100;
    canvas.height = 140;
    const ctx = canvas.getContext('2d')!;
    
    // Card background
    ctx.fillStyle = '#2c3e50';
    ctx.fillRect(0, 0, 100, 140);
    
    // Border
    ctx.strokeStyle = '#34495e';
    ctx.lineWidth = 3;
    ctx.strokeRect(3, 3, 94, 134);
    
    // Pattern
    ctx.fillStyle = '#34495e';
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 7; j++) {
        if ((i + j) % 2 === 0) {
          ctx.fillRect(10 + i * 16, 10 + j * 16, 12, 12);
        }
      }
    }
    
    return canvas.toDataURL().split(',')[1];
  }

  /**
   * Creates a base64 encoded button
   */
  private createButton(): string {
    const canvas = document.createElement('canvas');
    canvas.width = 200;
    canvas.height = 50;
    const ctx = canvas.getContext('2d')!;
    
    // Button background
    const gradient = ctx.createLinearGradient(0, 0, 0, 50);
    gradient.addColorStop(0, '#5a67d8');
    gradient.addColorStop(1, '#4c51bf');
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 200, 50);
    
    // Border
    ctx.strokeStyle = '#3c366b';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, 198, 48);
    
    return canvas.toDataURL().split(',')[1];
  }
}