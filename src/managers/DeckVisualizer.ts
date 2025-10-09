import { CardData } from '../Card';
import { Deck } from '../Deck';
import { GameConfig } from '../config/GameConfig';

/**
 * Manages the visual representation of the deck and discard pile.
 * Single Responsibility: Only handles deck/discard pile visualization and interaction.
 */
export class DeckVisualizer {
  private scene: Phaser.Scene;
  private deck: Deck;
  private deckVisual!: Phaser.GameObjects.Container;
  private discardVisual!: Phaser.GameObjects.Container;
  private discardPile: CardData[] = [];

  constructor(scene: Phaser.Scene, deck: Deck) {
    this.scene = scene;
    this.deck = deck;
  }

  /**
   * Creates the visual representation of the deck
   */
  public createDeckVisual(onDraw: () => void): void {
    this.deckVisual = this.scene.add.container(GameConfig.DECK_X, GameConfig.DECK_Y);

    // Create multiple card backs to show stack effect
    for (let i = 0; i < 3; i++) {
      const cardBack = this.scene.add.rectangle(i * 2, i * 2, 80, 110, 0x1a3a5a);
      cardBack.setStrokeStyle(2, 0x4a6fa5);
      this.deckVisual.add(cardBack);
    }

    // Add deck text
    const deckText = this.scene.add
      .text(0, -70, 'DECK', {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.deckVisual.add(deckText);

    // Add card count text
    const countText = this.scene.add
      .text(0, 70, '', {
        fontSize: '14px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);
    this.deckVisual.add(countText);

    // Update count text continuously
    this.scene.time.addEvent({
      delay: 100,
      callback: () => {
        countText.setText(`${this.deck.getRemainingCount()} cards`);
      },
      loop: true,
    });

    // Make deck interactive
    this.setupDeckInteraction(onDraw);

    // Add "Click to Draw" instruction
    const instructionText = this.scene.add
      .text(0, 100, 'Click to Draw', {
        fontSize: '12px',
        color: '#6a9fc5',
      })
      .setOrigin(0.5);
    this.deckVisual.add(instructionText);
  }

  /**
   * Sets up interaction handlers for the deck
   */
  private setupDeckInteraction(onDraw: () => void): void {
    const topCard = this.deckVisual.list[2] as Phaser.GameObjects.Rectangle;
    topCard.setInteractive();

    topCard.on('pointerdown', () => {
      onDraw();
    });

    topCard.on('pointerover', () => {
      topCard.setFillStyle(0x2a4a6a);
      this.deckVisual.setScale(1.05);
    });

    topCard.on('pointerout', () => {
      topCard.setFillStyle(0x1a3a5a);
      this.deckVisual.setScale(1.0);
    });
  }

  /**
   * Creates the visual representation of the discard pile
   */
  public createDiscardVisual(): void {
    this.discardVisual = this.scene.add.container(GameConfig.DISCARD_X, GameConfig.DISCARD_Y);

    // Create discard pile background
    const discardBack = this.scene.add.rectangle(0, 0, 80, 110, 0x3a3a1a);
    discardBack.setStrokeStyle(2, 0x6a6a4a);
    this.discardVisual.add(discardBack);

    // Add discard text
    const discardText = this.scene.add
      .text(0, -70, 'DISCARD', {
        fontSize: '16px',
        color: '#ffffff',
        fontStyle: 'bold',
      })
      .setOrigin(0.5);
    this.discardVisual.add(discardText);

    // Add card count text
    const countText = this.scene.add
      .text(0, 70, '0 cards', {
        fontSize: '14px',
        color: '#aaaaaa',
      })
      .setOrigin(0.5);
    this.discardVisual.add(countText);
  }

  /**
   * Adds a card to the discard pile
   */
  public addToDiscard(cardData: CardData): void {
    this.discardPile.push(cardData);
    this.updateDiscardVisual();
  }

  /**
   * Updates the discard pile visual to reflect current state
   */
  private updateDiscardVisual(): void {
    const countText = this.discardVisual.list[2] as Phaser.GameObjects.Text;
    countText.setText(`${this.discardPile.length} cards`);

    // Make the discard background more prominent if there are cards
    const discardBack = this.discardVisual.list[0] as Phaser.GameObjects.Rectangle;
    if (this.discardPile.length > 0) {
      discardBack.setFillStyle(0x4a4a2a);
      discardBack.setStrokeStyle(2, 0x7a7a5a);
    } else {
      discardBack.setFillStyle(0x3a3a1a);
      discardBack.setStrokeStyle(2, 0x6a6a4a);
    }
  }

  /**
   * Gets the discard pile
   */
  public getDiscardPile(): CardData[] {
    return this.discardPile;
  }
}
