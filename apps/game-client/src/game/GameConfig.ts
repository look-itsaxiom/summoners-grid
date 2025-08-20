/**
 * Phaser.js Game Configuration for Summoner's Grid
 * 
 * Configures the core Phaser game instance with:
 * - WebGL rendering with Canvas fallback
 * - Responsive canvas scaling
 * - Scene management
 * - Asset loading configuration
 */

import Phaser from 'phaser';
import { LoadingScene } from './scenes/LoadingScene';
import { MainGameScene } from './scenes/MainGameScene';
import { MainMenuScene } from './scenes/MainMenuScene';

export const GameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO, // Use WebGL if available, fallback to Canvas
  width: 1280,
  height: 720,
  parent: 'phaser-game', // DOM element ID where Phaser canvas will be mounted
  backgroundColor: '#1a1a2e', // Dark blue background matching tactical theme
  scale: {
    mode: Phaser.Scale.RESIZE, // Responsive scaling
    autoCenter: Phaser.Scale.CENTER_BOTH,
    min: {
      width: 800,
      height: 600
    },
    max: {
      width: 1920,
      height: 1080
    }
  },
  scene: [
    LoadingScene,
    MainMenuScene,
    MainGameScene
  ],
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { x: 0, y: 0 }, // No gravity for tactical grid-based game
      debug: false // Set to true for development debugging
    }
  },
  render: {
    antialias: true,
    pixelArt: false, // Use smooth rendering for card game aesthetics
    transparent: false
  },
  audio: {
    disableWebAudio: false,
    context: undefined // Let Phaser manage audio context
  }
};

export default GameConfig;