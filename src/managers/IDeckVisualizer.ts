import { CardData } from "../Card";

/**
 * Interface for deck and discard pile visualization operations.
 * Following the Interface Segregation Principle - focused on deck visualization only.
 */
export interface IDeckVisualizer {
  /**
   * Creates the visual representation of the deck
   * @param onDraw Callback function to execute when deck is clicked for drawing
   */
  createDeckVisual(onDraw: () => void): void;

  /**
   * Creates the visual representation of the discard pile
   */
  createDiscardVisual(): void;

  /**
   * Adds a card to the discard pile
   * @param cardData The card data to add to discard pile
   */
  addToDiscard(cardData: CardData): void;

  /**
   * Gets the current discard pile
   * @returns Array of cards in the discard pile
   */
  getDiscardPile(): CardData[];
}
