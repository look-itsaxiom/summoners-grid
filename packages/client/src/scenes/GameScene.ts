import Phaser from 'phaser';
import * as Colyseus from 'colyseus.js';
import { GameState, BOARD_WIDTH, BOARD_HEIGHT, TILE_SIZE } from '@summoners-grid/common';

export class GameScene extends Phaser.Scene {
  private client!: Colyseus.Client;
  private room!: Colyseus.Room<GameState>;

  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // This is where you would load assets like images and sounds
  }

  async create() {
    const connectingText = this.add.text(100, 100, 'Connecting to server...', {
      font: '32px Arial',
      color: '#ffffff'
    });

    this.client = new Colyseus.Client('ws://localhost:2567');

    try {
      this.room = await this.client.joinOrCreate<GameState>('game');
      console.log('Joined successfully!', this.room);
      connectingText.destroy();
      this.drawGrid();
      this.registerStateHandlers();
    } catch (e) {
      console.error('Join error', e);
      connectingText.setText('Failed to connect to server.');
    }
  }

  update() {
    // This is where you would handle game logic and updates
  }

  private registerStateHandlers() {
    this.room.state.players.onAdd((player, key) => {
      console.log('Player added:', player, 'at key:', key);
    });

    this.room.state.players.onRemove((player, key) => {
      console.log('Player removed:', player, 'at key:', key);
    });

    this.room.onStateChange((state) => {
      console.log('State changed:', state);
    });
  }

  private drawGrid() {
    const gridX = (this.scale.width - (BOARD_WIDTH * TILE_SIZE)) / 2;
    const gridY = (this.scale.height - (BOARD_HEIGHT * TILE_SIZE)) / 2;

    const graphics = this.add.graphics();
    graphics.lineStyle(1, 0x00ff00, 0.5);

    // Draw vertical lines
    for (let i = 0; i <= BOARD_WIDTH; i++) {
      const x = gridX + i * TILE_SIZE;
      graphics.moveTo(x, gridY);
      graphics.lineTo(x, gridY + BOARD_HEIGHT * TILE_SIZE);
    }

    // Draw horizontal lines
    for (let i = 0; i <= BOARD_HEIGHT; i++) {
      const y = gridY + i * TILE_SIZE;
      graphics.moveTo(gridX, y);
      graphics.lineTo(gridX + BOARD_WIDTH * TILE_SIZE, y);
    }

    graphics.strokePath();
  }
}
