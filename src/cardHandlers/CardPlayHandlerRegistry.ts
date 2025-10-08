import { CardData } from '../Card';
import { ICardPlayHandler } from './ICardPlayHandler';

/**
 * Registry for card play handlers.
 * This follows the Dependency Inversion Principle - the game scene depends
 * on this registry abstraction rather than concrete handler implementations.
 * Also follows the Single Responsibility Principle - this class only manages
 * the registration and retrieval of handlers.
 */
export class CardPlayHandlerRegistry {
  private handlers: ICardPlayHandler[] = [];

  /**
   * Register a new card play handler
   */
  registerHandler(handler: ICardPlayHandler): void {
    this.handlers.push(handler);
  }

  /**
   * Get the appropriate handler for a card, or null if none found
   */
  getHandler(cardData: CardData): ICardPlayHandler | null {
    for (const handler of this.handlers) {
      if (handler.canHandle(cardData)) {
        return handler;
      }
    }
    return null;
  }

  /**
   * Execute the play action for a card using the appropriate handler
   * @returns true if a handler was found and executed, false otherwise
   */
  executePlay(
    cardData: CardData,
    scene: Phaser.Scene,
    onComplete: (success: boolean) => void
  ): boolean {
    const handler = this.getHandler(cardData);
    
    if (handler) {
      handler.execute(cardData, scene, onComplete);
      return true;
    }

    console.warn(`[CardPlayHandlerRegistry] No handler found for card type: ${cardData.type}`);
    return false;
  }
}
