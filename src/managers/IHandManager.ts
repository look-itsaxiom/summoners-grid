import { Card, CardData } from "../Card";

/**
 * Interface for hand management operations.
 * Following the Interface Segregation Principle - focused on hand operations only.
 */
export interface IHandManager {
  /**
   * Adds a card to the hand
   * @param cardData The card data to create and add
   * @param onSelected Callback when card is selected
   * @param onDeselected Callback when card is deselected
   */
  addCard(cardData: CardData, onSelected: (card: Card) => void, onDeselected: (card: Card) => void): void;

  /**
   * Removes a card from the hand
   * @param card The card to remove
   */
  removeCard(card: Card): void;

  /**
   * Repositions all cards in the hand with smooth animation
   */
  repositionCards(): void;

  /**
   * Gets the current hand size
   * @returns Number of cards in hand
   */
  getHandSize(): number;

  /**
   * Checks if hand is full
   * @returns True if hand is at maximum capacity
   */
  isFull(): boolean;

  /**
   * Sets the selected card
   * @param card The card to select, or null to clear selection
   */
  setSelectedCard(card: Card | null): void;

  /**
   * Gets the selected card
   * @returns The currently selected card or null
   */
  getSelectedCard(): Card | null;

  /**
   * Deselects the currently selected card if it matches
   * @param card The card to deselect
   */
  deselectCard(card: Card): void;

  /**
   * Gets all cards in hand
   * @returns Array of all cards currently in hand
   */
  getCards(): Card[];
  
  /**
   * Clears all cards from hand
   */
  clearHand(): void;
}
