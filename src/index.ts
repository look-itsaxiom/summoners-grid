import Phaser from 'phaser';
import { GameScene } from './GameScene';
import { BOARD_CONFIG, COLORS, UI_CONFIG } from './constants';

const config: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: BOARD_CONFIG.WIDTH * BOARD_CONFIG.CELL_SIZE + UI_CONFIG.INFO_PANEL_WIDTH + 50,
  height: BOARD_CONFIG.HEIGHT * BOARD_CONFIG.CELL_SIZE + 50,
  parent: 'game-container',
  backgroundColor: COLORS.BACKGROUND,
  scene: [GameScene],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0, x: 0 },
      debug: false,
    },
  },
};

const game = new Phaser.Game(config);

export default game;
