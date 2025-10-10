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

  // Discard UI elements
  private discardContainer!: Phaser.GameObjects.Container;
  private discardText!: Phaser.GameObjects.Text;
  private discardConfirmButton!: Phaser.GameObjects.Rectangle;
  private discardConfirmText!: Phaser.GameObjects.Text;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Creates the title and other static UI elements
   */
  public createStaticUI(): void {
    // Main title with better styling
    this.scene.add
      .text(GameConfig.TITLE_X, GameConfig.TITLE_Y, "Summoner's Grid", {
        fontSize: "36px",
        color: "#ffffff",
        fontStyle: "bold",
        stroke: "#000000",
        strokeThickness: 3,
      })
      .setOrigin(0.5);

    // Add player labels on the board
    this.scene.add
      .text(100, 735, "PLAYER A", {
        fontSize: "14px",
        color: "#4a6fa5",
        fontStyle: "bold",
        backgroundColor: "#1a1a1a",
        padding: { x: 8, y: 4 }
      })
      .setOrigin(0.5)
      .setDepth(50);

    this.scene.add
      .text(100, 125, "PLAYER B", {
        fontSize: "14px",
        color: "#7a3a3a",
        fontStyle: "bold",
        backgroundColor: "#1a1a1a",
        padding: { x: 8, y: 4 }
      })
      .setOrigin(0.5)
      .setDepth(50);
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
    const x = GameConfig.PHASE_INDICATOR_X;
    const y = GameConfig.PHASE_INDICATOR_Y;

    // Create container for phase indicator
    this.phaseContainer = this.scene.add.container(x, y);

    // Background panel with shadow effect
    const shadow = this.scene.add.rectangle(2, 2, 220, 140, 0x000000, 0.3);
    this.phaseContainer.add(shadow);

    const bg = this.scene.add.rectangle(0, 0, 220, 140, 0x1a1a1a);
    bg.setStrokeStyle(3, 0x4a6fa5);
    this.phaseContainer.add(bg);

    // "CURRENT TURN" label
    const label = this.scene.add
      .text(0, -55, "CURRENT TURN", {
        fontSize: "12px",
        color: "#888888",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.phaseContainer.add(label);

    // Player text - larger and more prominent
    this.playerText = this.scene.add
      .text(0, -30, "Player A", {
        fontSize: "22px",
        color: "#4a6fa5",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.phaseContainer.add(this.playerText);

    // Phase text
    this.phaseText = this.scene.add
      .text(0, 0, "Draw Phase", {
        fontSize: "18px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    this.phaseContainer.add(this.phaseText);

    // Next phase button with better styling
    this.nextPhaseButton = this.scene.add.rectangle(0, 40, 170, 40, 0x4a6fa5);
    this.nextPhaseButton.setStrokeStyle(2, 0x6a9fc5);
    this.nextPhaseButton.setInteractive();
    this.phaseContainer.add(this.nextPhaseButton);

    this.nextPhaseButtonText = this.scene.add
      .text(0, 40, "Next Phase ▶", {
        fontSize: "16px",
        color: "#ffffff",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.phaseContainer.add(this.nextPhaseButtonText);

    // Button interactions
    this.nextPhaseButton.on("pointerdown", () => {
      onNextPhase();
    });

    this.nextPhaseButton.on("pointerover", () => {
      this.nextPhaseButton.setFillStyle(0x5a8fc5);
      this.nextPhaseButton.setScale(1.02);
    });

    this.nextPhaseButton.on("pointerout", () => {
      this.nextPhaseButton.setFillStyle(0x4a6fa5);
      this.nextPhaseButton.setScale(1.0);
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

  /**
   * Shows the discard UI
   */
  public showDiscardUI(count: number, onConfirm: () => void): void {
    const x = 600;
    const y = 350;

    // Create container for discard UI
    this.discardContainer = this.scene.add.container(x, y);

    // Background panel
    const bg = this.scene.add.rectangle(0, 0, 400, 150, 0x2a2a2a);
    bg.setStrokeStyle(3, 0xff6666);
    this.discardContainer.add(bg);

    // Title text
    const title = this.scene.add
      .text(0, -50, "Hand Limit Exceeded", {
        fontSize: "20px",
        color: "#ff6666",
        fontStyle: "bold",
      })
      .setOrigin(0.5);
    this.discardContainer.add(title);

    // Instruction text
    this.discardText = this.scene.add
      .text(0, -10, `Select ${count} card(s) to discard\n(0/${count} selected)`, {
        fontSize: "16px",
        color: "#ffffff",
        align: "center",
      })
      .setOrigin(0.5);
    this.discardContainer.add(this.discardText);

    // Confirm button
    this.discardConfirmButton = this.scene.add.rectangle(0, 45, 150, 35, 0x4a6fa5);
    this.discardConfirmButton.setStrokeStyle(2, 0x6a9fc5);
    this.discardConfirmButton.setInteractive();
    this.discardContainer.add(this.discardConfirmButton);

    this.discardConfirmText = this.scene.add
      .text(0, 45, "Confirm", {
        fontSize: "14px",
        color: "#ffffff",
      })
      .setOrigin(0.5);
    this.discardContainer.add(this.discardConfirmText);

    // Button interactions
    this.discardConfirmButton.on("pointerdown", () => {
      onConfirm();
    });

    this.discardConfirmButton.on("pointerover", () => {
      this.discardConfirmButton.setFillStyle(0x5a7fb5);
    });

    this.discardConfirmButton.on("pointerout", () => {
      this.discardConfirmButton.setFillStyle(0x4a6fa5);
    });

    this.discardContainer.setDepth(1000);
  }

  /**
   * Updates the discard count display
   */
  public updateDiscardCount(selected: number, required: number): void {
    if (this.discardText) {
      this.discardText.setText(`Select ${required} card(s) to discard\n(${selected}/${required} selected)`);
    }
  }

  /**
   * Hides the discard UI
   */
  public hideDiscardUI(): void {
    if (this.discardContainer) {
      this.discardContainer.destroy();
    }
  }
}
