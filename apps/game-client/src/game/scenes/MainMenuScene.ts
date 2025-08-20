/**
 * Main Menu Scene for Summoner's Grid
 * 
 * Provides the main navigation interface for the game including:
 * - Start new game options
 * - Access to collection and deck building (future)
 * - Settings and options
 * - Game mode selection
 */

import Phaser from 'phaser';

export class MainMenuScene extends Phaser.Scene {
  constructor() {
    super({ key: 'MainMenuScene' });
  }

  create(): void {
    const { width, height } = this.cameras.main;

    // Game title
    this.add.text(width / 2, 100, 'Summoner\'s Grid', {
      font: '64px Arial',
      color: '#ffffff',
      stroke: '#000000',
      strokeThickness: 4
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, 160, 'Tactical Grid-Based RPG Card Game', {
      font: '24px Arial',
      color: '#cccccc'
    }).setOrigin(0.5);

    // Menu buttons
    this.createMenuButton(width / 2, 250, 'Start Game', () => {
      // Transition to the main game scene
      this.scene.start('MainGameScene');
    });

    this.createMenuButton(width / 2, 320, 'Collection (Coming Soon)', () => {
      // Future: Open collection interface
      console.log('Collection interface not yet implemented');
    });

    this.createMenuButton(width / 2, 390, 'Settings (Coming Soon)', () => {
      // Future: Open settings
      console.log('Settings not yet implemented');
    });

    // Version info
    this.add.text(width - 10, height - 10, 'Alpha v0.1.0 - Issue #013 Implementation', {
      font: '14px Arial',
      color: '#666666'
    }).setOrigin(1, 1);

    // Instructions
    this.add.text(width / 2, height - 100, 'Press any button to start playing!', {
      font: '18px Arial',
      color: '#999999'
    }).setOrigin(0.5);

    // Background decoration
    this.createBackgroundElements();
  }

  private createMenuButton(x: number, y: number, text: string, callback: () => void): void {
    // Button background
    const button = this.add.image(x, y, 'button');
    button.setInteractive();
    button.setScale(1.5, 1);

    // Button text
    const buttonText = this.add.text(x, y, text, {
      font: '20px Arial',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Hover effects
    button.on('pointerover', () => {
      button.setTint(0xdddddd);
      buttonText.setStyle({ color: '#000000' });
    });

    button.on('pointerout', () => {
      button.clearTint();
      buttonText.setStyle({ color: '#ffffff' });
    });

    // Click handler
    button.on('pointerdown', () => {
      button.setTint(0xaaaaaa);
    });

    button.on('pointerup', () => {
      button.clearTint();
      callback();
    });
  }

  private createBackgroundElements(): void {
    const { width, height } = this.cameras.main;

    // Create some decorative grid elements in the background
    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x333333, 0.5);

    // Draw a subtle grid pattern
    const gridSize = 40;
    for (let x = 0; x < width; x += gridSize) {
      graphics.moveTo(x, 0);
      graphics.lineTo(x, height);
    }
    for (let y = 0; y < height; y += gridSize) {
      graphics.moveTo(0, y);
      graphics.lineTo(width, y);
    }
    graphics.strokePath();

    // Add some card-like decorative elements
    this.createDecorativeCards();
  }

  private createDecorativeCards(): void {
    const { width, height } = this.cameras.main;

    // Place some rotated card backs as decoration
    const positions = [
      { x: 100, y: 200, rotation: -0.3 },
      { x: width - 100, y: 300, rotation: 0.2 },
      { x: 150, y: height - 150, rotation: 0.1 },
      { x: width - 150, y: 150, rotation: -0.2 }
    ];

    positions.forEach(pos => {
      const card = this.add.image(pos.x, pos.y, 'card-back');
      card.setRotation(pos.rotation);
      card.setAlpha(0.3);
      card.setScale(1.2);
    });
  }
}