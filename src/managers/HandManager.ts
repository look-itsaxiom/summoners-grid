import { Card, CardData } from "../Card";
import { GameConfig } from "../config/GameConfig";
import { IHandManager } from "./IHandManager";

/**
 * Manages the player's hand of cards.
 * Single Responsibility: Only handles hand operations (add, remove, reposition).
 */
export class HandManager implements IHandManager {
  private readonly scene: Phaser.Scene;
  private readonly hand: Card[] = [];
  private selectedCard: Card | null = null;
  private readonly playerId: number; // 0 for Player A, 1 for Player B

  constructor(scene: Phaser.Scene, playerId: number = 0) {
    this.scene = scene;
    this.playerId = playerId;
  }

  /**
   * Gets the Y position for this player's hand
   */
  private getHandY(): number {
    // Player A (0) at bottom, Player B (1) at top
    return this.playerId === 0 ? GameConfig.HAND_Y : GameConfig.HAND_Y_PLAYER_B;
  }

  /**
   * Adds a card to the hand
   */
  public addCard(cardData: CardData, onSelected: (card: Card) => void, onDeselected: (card: Card) => void): void {
    const card = new Card(this.scene, GameConfig.HAND_START_X + this.hand.length * GameConfig.CARD_SPACING, this.getHandY(), cardData);

    card.on("cardSelected", () => onSelected(card));
    card.on("cardDeselected", () => onDeselected(card));

    this.hand.push(card);
  }

  /**
   * Removes a card from the hand
   */
  public removeCard(card: Card): void {
    const cardIndex = this.hand.indexOf(card);
    if (cardIndex !== -1) {
      this.hand.splice(cardIndex, 1);
      card.destroy();
    }
  }

  /**
   * Repositions all cards in the hand with smooth animation
   * Cards will overlap when there are many cards to fit on screen
   */
  public repositionCards(): void {
    const handSize = this.hand.length;
    
    if (handSize === 0) return;

    // Calculate spacing - reduce spacing as more cards are added
    let spacing = GameConfig.CARD_SPACING;
    const maxCardsAtFullSpacing = 7; // Cards start overlapping after 7
    const minSpacing = 60; // Minimum spacing when heavily overlapped

    if (handSize > maxCardsAtFullSpacing) {
      // Calculate reduced spacing to fit all cards
      const availableWidth = 800; // Available width for hand
      const cardWidth = 120; // Width of a card
      const neededWidth = cardWidth + (handSize - 1) * minSpacing;
      
      if (neededWidth > availableWidth) {
        spacing = Math.max(minSpacing, (availableWidth - cardWidth) / (handSize - 1));
      } else {
        spacing = minSpacing;
      }
    }

    const handY = this.getHandY();

    this.hand.forEach((card, index) => {
      const targetX = GameConfig.HAND_START_X + index * spacing;
      
      this.scene.tweens.add({
        targets: card,
        x: targetX,
        y: handY,
        duration: 200,
        ease: "Power2",
      });

      // Set depth so cards overlap correctly (left to right)
      card.setDepth(100 + index);

      // Add hover effect to bring card to front
      this.setupCardHoverDepth(card, 100 + this.hand.length);
    });
  }

  /**
   * Sets up hover effect to bring card to front
   */
  private setupCardHoverDepth(card: Card, frontDepth: number): void {
    const originalDepth = card.depth;
    
    card.on('pointerover', () => {
      card.setDepth(frontDepth);
      card.setScale(1.1);
    });

    card.on('pointerout', () => {
      card.setDepth(originalDepth);
      // Only reset scale if not selected
      const isSelected = card === this.selectedCard;
      if (!isSelected) {
        card.setScale(1.0);
      }
    });
  }

  /**
   * Gets the current hand size
   */
  public getHandSize(): number {
    return this.hand.length;
  }

  /**
   * Checks if hand is full
   */
  public isFull(): boolean {
    return this.hand.length >= GameConfig.HAND_SIZE;
  }

  /**
   * Sets the selected card
   */
  public setSelectedCard(card: Card | null): void {
    this.selectedCard = card;
  }

  /**
   * Gets the selected card
   */
  public getSelectedCard(): Card | null {
    return this.selectedCard;
  }

  /**
   * Deselects the currently selected card if it matches
   */
  public deselectCard(card: Card): void {
    if (this.selectedCard === card) {
      this.selectedCard = null;
    }
  }

  /**
   * Gets all cards in hand
   */
  public getCards(): Card[] {
    return this.hand;
  }
}
