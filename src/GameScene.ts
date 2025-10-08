import Phaser from 'phaser';
import { Card, CardData } from './Card';
import { Deck } from './Deck';

export class GameScene extends Phaser.Scene {
  private readonly GRID_COLS = 12;
  private readonly GRID_ROWS = 14;
  private readonly CELL_SIZE = 40;
  private readonly HAND_SIZE = 6;

  private grid: Phaser.GameObjects.Rectangle[][] = [];
  private hand: Card[] = [];
  private deck!: Deck;
  private selectedCard: Card | null = null;

  constructor() {
    super('GameScene');
  }

  create(): void {
    // Initialize deck
    this.deck = new Deck();

    // Create the game board
    this.createBoard();

    // Draw initial hand
    this.drawInitialHand();

    // Add UI text
    this.createUI();
  }

  private createBoard(): void {
    const offsetX = 100;
    const offsetY = 50;

    // Create 12x14 grid
    for (let row = 0; row < this.GRID_ROWS; row++) {
      this.grid[row] = [];
      for (let col = 0; col < this.GRID_COLS; col++) {
        const x = offsetX + col * this.CELL_SIZE;
        const y = offsetY + row * this.CELL_SIZE;

        // Determine cell color based on territory
        let cellColor = 0x333333; // Neutral territory
        if (row < 3) {
          cellColor = 0x3a5a7a; // Player territory (bottom 3 rows)
        } else if (row >= this.GRID_ROWS - 3) {
          cellColor = 0x7a3a3a; // Opponent territory (top 3 rows)
        }

        const cell = this.add.rectangle(
          x + this.CELL_SIZE / 2,
          y + this.CELL_SIZE / 2,
          this.CELL_SIZE - 2,
          this.CELL_SIZE - 2,
          cellColor
        );
        cell.setStrokeStyle(1, 0x666666);

        this.grid[row][col] = cell;
      }
    }

    // Add coordinate labels
    this.addCoordinateLabels(offsetX, offsetY);
  }

  private addCoordinateLabels(offsetX: number, offsetY: number): void {
    // Column labels (0-11)
    for (let col = 0; col < this.GRID_COLS; col++) {
      const x = offsetX + col * this.CELL_SIZE + this.CELL_SIZE / 2;
      const y = offsetY - 15;
      this.add.text(x, y, col.toString(), {
        fontSize: '10px',
        color: '#888888'
      }).setOrigin(0.5);
    }

    // Row labels (0-13)
    for (let row = 0; row < this.GRID_ROWS; row++) {
      const x = offsetX - 15;
      const y = offsetY + row * this.CELL_SIZE + this.CELL_SIZE / 2;
      this.add.text(x, y, row.toString(), {
        fontSize: '10px',
        color: '#888888'
      }).setOrigin(0.5);
    }
  }

  private drawInitialHand(): void {
    for (let i = 0; i < this.HAND_SIZE; i++) {
      this.drawCard();
    }
  }

  private drawCard(): void {
    const cardData = this.deck.draw();
    if (!cardData) {
      console.log('No more cards in deck');
      return;
    }

    const handY = 650;
    const handStartX = 150;
    const cardSpacing = 100;

    const card = new Card(
      this,
      handStartX + this.hand.length * cardSpacing,
      handY,
      cardData
    );

    card.on('cardSelected', (data: CardData) => {
      this.onCardSelected(card);
    });

    card.on('cardDeselected', () => {
      this.onCardDeselected(card);
    });

    this.hand.push(card);
  }

  private onCardSelected(card: Card): void {
    // Deselect any previously selected card
    if (this.selectedCard && this.selectedCard !== card) {
      this.selectedCard.deselect();
    }
    this.selectedCard = card;
    console.log('Card selected:', card.getCardData());
  }

  private onCardDeselected(card: Card): void {
    if (this.selectedCard === card) {
      this.selectedCard = null;
    }
    console.log('Card deselected');
  }

  private createUI(): void {
    // Title
    this.add.text(400, 20, "Summoner's Grid", {
      fontSize: '24px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Instructions
    this.add.text(650, 100, 'Hand (Click to Select):', {
      fontSize: '16px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Play button
    const playButton = this.add.rectangle(650, 650, 120, 40, 0x4a6fa5);
    playButton.setStrokeStyle(2, 0x6a9fc5);
    playButton.setInteractive();

    const playButtonText = this.add.text(650, 650, 'Play Card', {
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5);

    playButton.on('pointerdown', () => {
      this.playSelectedCard();
    });

    playButton.on('pointerover', () => {
      playButton.setFillStyle(0x5a7fb5);
    });

    playButton.on('pointerout', () => {
      playButton.setFillStyle(0x4a6fa5);
    });

    // Deck info
    const deckText = this.add.text(650, 200, '', {
      fontSize: '12px',
      color: '#aaaaaa'
    }).setOrigin(0.5);

    this.time.addEvent({
      delay: 100,
      callback: () => {
        deckText.setText(`Cards in Deck: ${this.deck.getRemainingCount()}`);
      },
      loop: true
    });
  }

  private playSelectedCard(): void {
    if (!this.selectedCard) {
      console.log('No card selected');
      return;
    }

    const cardData = this.selectedCard.getCardData();
    console.log('Playing card:', cardData);

    // Remove card from hand
    const cardIndex = this.hand.indexOf(this.selectedCard);
    if (cardIndex !== -1) {
      this.hand.splice(cardIndex, 1);
      this.selectedCard.destroy();
      this.selectedCard = null;

      // Reposition remaining cards
      this.repositionHand();

      // Stub function for playing a card
      this.onPlayCard(cardData);

      // Draw a new card if available
      if (this.hand.length < this.HAND_SIZE) {
        this.drawCard();
        this.repositionHand();
      }
    }
  }

  private repositionHand(): void {
    const handY = 650;
    const handStartX = 150;
    const cardSpacing = 100;

    this.hand.forEach((card, index) => {
      this.tweens.add({
        targets: card,
        x: handStartX + index * cardSpacing,
        duration: 200,
        ease: 'Power2'
      });
    });
  }

  // Stubbed out function for playing a card
  private onPlayCard(cardData: CardData): void {
    console.log(`[STUB] Playing card: ${cardData.name} (${cardData.type})`);
    console.log(`[STUB] Card effect would be applied here`);
    // This is where game logic for playing the card would go
    // For example: applying effects, placing summons, etc.
  }
}
