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
  private playButton!: Phaser.GameObjects.Rectangle;
  private playButtonText!: Phaser.GameObjects.Text;
  private deckVisual!: Phaser.GameObjects.Container;
  private discardPile: CardData[] = [];
  private discardVisual!: Phaser.GameObjects.Container;

  constructor() {
    super('GameScene');
  }

  create(): void {
    // Initialize deck
    this.deck = new Deck();

    // Create the game board
    this.createBoard();

    // Create visual deck
    this.createDeckVisual();

    // Create discard pile visual
    this.createDiscardVisual();

    // Draw initial hand (3 summon cards only)
    this.drawInitialHand();

    // Add UI text
    this.createUI();
  }

  private createBoard(): void {
    const offsetX = 200;
    const offsetY = 100;

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

  private createDeckVisual(): void {
    const deckX = 900;
    const deckY = 400;

    // Create deck container
    this.deckVisual = this.add.container(deckX, deckY);

    // Create multiple card backs to show stack effect
    for (let i = 0; i < 3; i++) {
      const cardBack = this.add.rectangle(i * 2, i * 2, 80, 110, 0x1a3a5a);
      cardBack.setStrokeStyle(2, 0x4a6fa5);
      this.deckVisual.add(cardBack);
    }

    // Add deck text
    const deckText = this.add.text(0, -70, 'DECK', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.deckVisual.add(deckText);

    // Add card count text
    const countText = this.add.text(0, 70, '', {
      fontSize: '14px',
      color: '#aaaaaa'
    }).setOrigin(0.5);
    this.deckVisual.add(countText);

    // Update count text continuously
    this.time.addEvent({
      delay: 100,
      callback: () => {
        countText.setText(`${this.deck.getRemainingCount()} cards`);
      },
      loop: true
    });

    // Make deck interactive
    const topCard = this.deckVisual.list[2] as Phaser.GameObjects.Rectangle;
    topCard.setInteractive();

    topCard.on('pointerdown', () => {
      if (this.hand.length < this.HAND_SIZE) {
        this.drawCard();
        this.repositionHand();
      } else {
        console.log('Hand is full (6 cards max)');
      }
    });

    topCard.on('pointerover', () => {
      topCard.setFillStyle(0x2a4a6a);
      this.deckVisual.setScale(1.05);
    });

    topCard.on('pointerout', () => {
      topCard.setFillStyle(0x1a3a5a);
      this.deckVisual.setScale(1.0);
    });

    // Add "Click to Draw" instruction
    const instructionText = this.add.text(0, 100, 'Click to Draw', {
      fontSize: '12px',
      color: '#6a9fc5'
    }).setOrigin(0.5);
    this.deckVisual.add(instructionText);
  }

  private createDiscardVisual(): void {
    const discardX = 900;
    const discardY = 200;

    // Create discard container
    this.discardVisual = this.add.container(discardX, discardY);

    // Create discard pile background
    const discardBack = this.add.rectangle(0, 0, 80, 110, 0x3a3a1a);
    discardBack.setStrokeStyle(2, 0x6a6a4a);
    this.discardVisual.add(discardBack);

    // Add discard text
    const discardText = this.add.text(0, -70, 'DISCARD', {
      fontSize: '16px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);
    this.discardVisual.add(discardText);

    // Add card count text
    const countText = this.add.text(0, 70, '0 cards', {
      fontSize: '14px',
      color: '#aaaaaa'
    }).setOrigin(0.5);
    this.discardVisual.add(countText);
  }

  private updateDiscardVisual(): void {
    // Update the discard pile visuals to show cards
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

  private drawInitialHand(): void {
    // Draw 3 summon cards for initial hand (3v3 format)
    for (let i = 0; i < 3; i++) {
      const cardData = this.deck.drawSummon();
      if (cardData) {
        this.addCardToHand(cardData);
      }
    }
    this.repositionHand();
  }

  private drawCard(): void {
    const cardData = this.deck.draw();
    if (!cardData) {
      console.log('No more cards in deck');
      return;
    }

    this.addCardToHand(cardData);
    this.repositionHand();
  }

  private addCardToHand(cardData: CardData): void {
    const handY = 780;
    const handStartX = 250;
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
    
    // Show play button above the selected card
    this.showPlayButton();
  }

  private onCardDeselected(card: Card): void {
    if (this.selectedCard === card) {
      this.selectedCard = null;
      this.hidePlayButton();
    }
    console.log('Card deselected');
  }

  private createUI(): void {
    // Title
    this.add.text(600, 30, "Summoner's Grid", {
      fontSize: '32px',
      color: '#ffffff',
      fontStyle: 'bold'
    }).setOrigin(0.5);

    // Instructions
    this.add.text(600, 720, 'Hand (Click to Select):', {
      fontSize: '18px',
      color: '#ffffff'
    }).setOrigin(0.5);

    // Create Play button (initially hidden)
    this.playButton = this.add.rectangle(0, 0, 120, 40, 0x4a6fa5);
    this.playButton.setStrokeStyle(2, 0x6a9fc5);
    this.playButton.setInteractive();
    this.playButton.setVisible(false);

    this.playButtonText = this.add.text(0, 0, 'Play Card', {
      fontSize: '14px',
      color: '#ffffff'
    }).setOrigin(0.5);
    this.playButtonText.setVisible(false);

    this.playButton.on('pointerdown', () => {
      this.playSelectedCard();
    });

    this.playButton.on('pointerover', () => {
      this.playButton.setFillStyle(0x5a7fb5);
    });

    this.playButton.on('pointerout', () => {
      this.playButton.setFillStyle(0x4a6fa5);
    });
  }

  private showPlayButton(): void {
    if (this.selectedCard) {
      // Position button above the selected card
      const cardX = this.selectedCard.x;
      const cardY = this.selectedCard.y;
      
      this.playButton.setPosition(cardX, cardY - 80);
      this.playButtonText.setPosition(cardX, cardY - 80);
      
      this.playButton.setVisible(true);
      this.playButtonText.setVisible(true);

      // Bring button to front
      this.playButton.setDepth(1000);
      this.playButtonText.setDepth(1001);
    }
  }

  private hidePlayButton(): void {
    this.playButton.setVisible(false);
    this.playButtonText.setVisible(false);
  }

  private playSelectedCard(): void {
    if (!this.selectedCard) {
      console.log('No card selected');
      return;
    }

    const cardData = this.selectedCard.getCardData();
    console.log('Playing card:', cardData);

    // Add card to discard pile
    this.discardPile.push(cardData);
    this.updateDiscardVisual();

    // Remove card from hand
    const cardIndex = this.hand.indexOf(this.selectedCard);
    if (cardIndex !== -1) {
      this.hand.splice(cardIndex, 1);
      this.selectedCard.destroy();
      this.selectedCard = null;

      // Hide play button
      this.hidePlayButton();

      // Reposition remaining cards
      this.repositionHand();

      // Stub function for playing a card
      this.onPlayCard(cardData);

      // Note: Do NOT automatically draw a new card - player must click deck to draw
    }
  }

  private repositionHand(): void {
    const handY = 780;
    const handStartX = 250;
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
