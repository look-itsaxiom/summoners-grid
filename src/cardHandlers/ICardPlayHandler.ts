import { CardData } from '../Card';

/**
 * Interface for handling card play actions.
 * Implementing classes define how specific card types are played.
 * This follows the Open/Closed Principle - new card types can be added
 * without modifying existing code.
 */
export interface ICardPlayHandler {
  /**
   * Check if this handler can handle the given card type
   */
  canHandle(cardData: CardData): boolean;

  /**
   * Execute the play action for the card
   * @param cardData The card being played
   * @param scene The game scene
   * @param onComplete Callback when the play action is complete
   */
  execute(
    cardData: CardData,
    scene: Phaser.Scene,
    onComplete: (success: boolean) => void
  ): void;
}
