import { Card } from '../Card';
import { GameConfig } from '../config/GameConfig';

/**
 * Manages general UI elements like title, play button, and instructions.
 * Single Responsibility: Only handles general UI creation and visibility.
 */
export class UIManager {
  private scene: Phaser.Scene;
  private playButton!: Phaser.GameObjects.Rectangle;
  private playButtonText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Creates the title and other static UI elements
   */
  public createStaticUI(): void {
    // Title
    this.scene.add
      .text(GameConfig.TITLE_X, GameConfig.TITLE_Y, "Summoner's Grid", {
        fontSize: '32px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
  }

  /**
   * Creates the play button (initially hidden)
   */
  public createPlayButton(onPlay: () => void): void {
    this.playButton = this.scene.add.rectangle(0, 0, 120, 40, 0x4a6fa5);
    this.playButton.setStrokeStyle(2, 0x6a9fc5);
    this.playButton.setInteractive();
    this.playButton.setVisible(false);

    this.playButtonText = this.scene.add
      .text(0, 0, 'Play Card', {
        fontSize: '14px',
        color: '#ffffff',
      })
      .setOrigin(0.5);
    this.playButtonText.setVisible(false);

    this.playButton.on('pointerdown', () => {
      onPlay();
    });

    this.playButton.on('pointerover', () => {
      this.playButton.setFillStyle(0x5a7fb5);
    });

    this.playButton.on('pointerout', () => {
      this.playButton.setFillStyle(0x4a6fa5);
    });
  }

  /**
   * Shows the play button above the selected card
   */
  public showPlayButton(selectedCard: Card): void {
    const cardX = selectedCard.x;
    const cardY = selectedCard.y;

    this.playButton.setPosition(cardX, cardY - 80);
    this.playButtonText.setPosition(cardX, cardY - 80);

    this.playButton.setVisible(true);
    this.playButtonText.setVisible(true);

    // Bring button to front
    this.playButton.setDepth(1000);
    this.playButtonText.setDepth(1001);
  }

  /**
   * Hides the play button
   */
  public hidePlayButton(): void {
    this.playButton.setVisible(false);
    this.playButtonText.setVisible(false);
  }
}
