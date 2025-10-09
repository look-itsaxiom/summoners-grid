import { Card } from "../Card";
import { GameConfig } from "../config/GameConfig";
import { IUIManager } from "./IUIManager";
import { TurnPhase } from "../types/GameTypes";

/**
 * Manages general UI elements like title, play button, and instructions.
 * Single Responsibility: Only handles general UI creation and visibility.
 */
export class UIManager implements IUIManager {
  private readonly scene: Phaser.Scene;
  private playButton!: Phaser.GameObjects.Rectangle;
  private playButtonText!: Phaser.GameObjects.Text;
  
  // Phase indicator UI elements
  private phaseContainer!: Phaser.GameObjects.Container;
  private phaseText!: Phaser.GameObjects.Text;
  private playerText!: Phaser.GameObjects.Text;
  private nextPhaseButton!: Phaser.GameObjects.Rectangle;
  private nextPhaseButtonText!: Phaser.GameObjects.Text;

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
        fontSize: "32px",
        color: "#ffffff",
        fontStyle: "bold",
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
      .text(0, 0, "Play Card", {
        fontSize: "14px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    this.playButtonText.setVisible(false);

    this.playButton.on("pointerdown", () => {
      onPlay();
    });

    this.playButton.on("pointerover", () => {
      this.playButton.setFillStyle(0x5a7fb5);
    });

    this.playButton.on("pointerout", () => {
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

  /**
   * Creates the phase indicator UI
   */
  public createPhaseIndicator(onNextPhase: () => void): void {
    const x = 950;
    const y = 500;

    // Create container for phase indicator
    this.phaseContainer = this.scene.add.container(x, y);

    // Background panel
    const bg = this.scene.add.rectangle(0, 0, 200, 120, 0x2a2a2a);
    bg.setStrokeStyle(2, 0x4a6fa5);
    this.phaseContainer.add(bg);

    // Player text
    this.playerText = this.scene.add
      .text(0, -40, "Player A", {
        fontSize: "18px",
        color: "#4a6fa5",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.phaseContainer.add(this.playerText);

    // Phase text
    this.phaseText = this.scene.add
      .text(0, -10, "Draw Phase", {
        fontSize: "16px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    this.phaseContainer.add(this.phaseText);

    // Next phase button
    this.nextPhaseButton = this.scene.add.rectangle(0, 30, 150, 35, 0x4a6fa5);
    this.nextPhaseButton.setStrokeStyle(2, 0x6a9fc5);
    this.nextPhaseButton.setInteractive();
    this.phaseContainer.add(this.nextPhaseButton);

    this.nextPhaseButtonText = this.scene.add
      .text(0, 30, "Next Phase", {
        fontSize: "14px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    this.phaseContainer.add(this.nextPhaseButtonText);

    // Button interactions
    this.nextPhaseButton.on("pointerdown", () => {
      onNextPhase();
    });

    this.nextPhaseButton.on("pointerover", () => {
      this.nextPhaseButton.setFillStyle(0x5a7fb5);
    });

    this.nextPhaseButton.on("pointerout", () => {
      this.nextPhaseButton.setFillStyle(0x4a6fa5);
    });

    this.phaseContainer.setDepth(500);
  }

  /**
   * Updates the phase indicator display
   */
  public updatePhaseIndicator(phase: TurnPhase, player: number): void {
    const playerName = player === 0 ? "Player A" : "Player B";
    const playerColor = player === 0 ? "#4a6fa5" : "#7a3a3a";
    
    this.playerText.setText(playerName);
    this.playerText.setColor(playerColor);
    this.phaseText.setText(`${phase} Phase`);

    // Hide next phase button during Player B's turn (except action phase)
    const showButton = player === 0 || phase === TurnPhase.Action;
    this.nextPhaseButton.setVisible(showButton);
    this.nextPhaseButtonText.setVisible(showButton);
  }
}
