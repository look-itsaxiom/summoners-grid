import { Card, CardData } from '../Card';
import { GameConfig } from '../config/GameConfig';

/**
 * Manages the player's hand of cards.
 * Single Responsibility: Only handles hand operations (add, remove, reposition).
 */
export class HandManager {
  private scene: Phaser.Scene;
  private hand: Card[] = [];
  private selectedCard: Card | null = null;

  constructor(scene: Phaser.Scene) {
    this.scene = scene;
  }

  /**
   * Adds a card to the hand
   */
  public addCard(cardData: CardData, onSelected: (card: Card) => void, onDeselected: (card: Card) => void): void {
    const card = new Card(
      this.scene,
      GameConfig.HAND_START_X + this.hand.length * GameConfig.CARD_SPACING,
      GameConfig.HAND_Y,
      cardData
    );

    card.on('cardSelected', () => onSelected(card));
    card.on('cardDeselected', () => onDeselected(card));

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
   */
  public repositionCards(): void {
    this.hand.forEach((card, index) => {
      this.scene.tweens.add({
        targets: card,
        x: GameConfig.HAND_START_X + index * GameConfig.CARD_SPACING,
        duration: 200,
        ease: 'Power2',
      });
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
