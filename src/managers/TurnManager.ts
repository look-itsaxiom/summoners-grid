import { TurnPhase } from "../types/GameTypes";
import { Deck } from "../Deck";
import { IHandManager } from "./IHandManager";

/**
 * Manages the turn system and phase transitions.
 * Follows Single Responsibility Principle - only handles turn and phase management.
 */
export class TurnManager {
  private currentPlayer: number = 0; // 0 for Player A, 1 for Player B
  private currentPhase: TurnPhase = TurnPhase.Draw;
  private turnNumber: number = 0;
  private isFirstTurn: boolean = true;

  private readonly deck: Deck;
  private readonly handManager: IHandManager;
  private readonly scene: Phaser.Scene;
  
  private onCardDrawn: ((cardData: any) => void) | null = null;
  private onPhaseChanged: ((phase: TurnPhase, player: number) => void) | null = null;

  constructor(scene: Phaser.Scene, deck: Deck, handManager: IHandManager) {
    this.scene = scene;
    this.deck = deck;
    this.handManager = handManager;
  }

  /**
   * Starts the turn system
   */
  public startGame(): void {
    this.turnNumber = 1;
    this.currentPlayer = 0;
    this.isFirstTurn = true;
    this.currentPhase = TurnPhase.Draw;
    console.log('[TurnManager] Game started, Player A turn 1');
    this.notifyPhaseChanged();
  }

  /**
   * Gets the current turn phase
   */
  public getCurrentPhase(): TurnPhase {
    return this.currentPhase;
  }

  /**
   * Gets the current player
   */
  public getCurrentPlayer(): number {
    return this.currentPlayer;
  }

  /**
   * Gets the current turn number
   */
  public getTurnNumber(): number {
    return this.turnNumber;
  }

  /**
   * Sets callback for when a card is drawn
   */
  public setOnCardDrawn(callback: (cardData: any) => void): void {
    this.onCardDrawn = callback;
  }

  /**
   * Sets callback for when phase changes
   */
  public setOnPhaseChanged(callback: (phase: TurnPhase, player: number) => void): void {
    this.onPhaseChanged = callback;
  }

  /**
   * Advances to the next phase
   */
  public nextPhase(): void {
    switch (this.currentPhase) {
      case TurnPhase.Draw:
        this.executeDrawPhase();
        this.currentPhase = TurnPhase.Level;
        break;
      case TurnPhase.Level:
        this.executeLevelPhase();
        this.currentPhase = TurnPhase.Action;
        break;
      case TurnPhase.Action:
        this.currentPhase = TurnPhase.End;
        break;
      case TurnPhase.End:
        this.executeEndPhase();
        // End phase transitions to next player's draw phase
        this.switchPlayer();
        this.currentPhase = TurnPhase.Draw;
        break;
    }
    
    console.log(`[TurnManager] Phase changed to ${this.currentPhase} (Player ${this.currentPlayer === 0 ? 'A' : 'B'})`);
    this.notifyPhaseChanged();

    // Auto-progress through Player B's phases
    if (this.currentPlayer === 1 && this.currentPhase !== TurnPhase.Action) {
      // Add a small delay for visual feedback
      this.scene.time.delayedCall(1000, () => {
        this.nextPhase();
      });
    }
  }

  /**
   * Execute Draw Phase logic
   */
  private executeDrawPhase(): void {
    console.log('[TurnManager] Executing Draw Phase');
    
    // Skip draw on first turn of the game
    if (this.isFirstTurn && this.currentPlayer === 0) {
      console.log('[TurnManager] First turn - skipping draw');
      return;
    }

    // Only draw for Player A (Player B is AI/not implemented)
    if (this.currentPlayer === 0) {
      const cardData = this.deck.draw();
      if (cardData) {
        console.log(`[TurnManager] Drew card: ${cardData.name}`);
        if (this.onCardDrawn) {
          this.onCardDrawn(cardData);
        }
      } else {
        console.log('[TurnManager] No cards to draw (deck and recharge pile empty)');
      }
    }
  }

  /**
   * Execute Level Phase logic
   */
  private executeLevelPhase(): void {
    console.log('[TurnManager] Executing Level Phase');
    // TODO: Level up all summons controlled by current player
    // This will be implemented when summon leveling is added
  }

  /**
   * Execute End Phase logic
   */
  private executeEndPhase(): void {
    console.log('[TurnManager] Executing End Phase');
    
    // Only enforce hand limit for Player A
    if (this.currentPlayer === 0) {
      const handSize = this.handManager.getHandSize();
      const maxHandSize = 6;
      
      console.log(`[TurnManager] Current hand size: ${handSize}, max: ${maxHandSize}`);
      
      if (handSize > maxHandSize) {
        const cardsToDiscard = handSize - maxHandSize;
        console.log(`[TurnManager] Hand size ${handSize} exceeds limit of ${maxHandSize}, need to discard ${cardsToDiscard} cards`);
        
        // For now, auto-discard from the end of hand (should be player choice in full implementation)
        const cards = this.handManager.getCards();
        for (let i = 0; i < cardsToDiscard; i++) {
          const card = cards[cards.length - 1 - i];
          if (card) {
            const cardData = card.getCardData();
            console.log(`[TurnManager] Auto-discarding: ${cardData.name}`);
            this.deck.addToRechargePile(cardData);
            this.handManager.removeCard(card);
          }
        }
        this.handManager.repositionCards();
      } else {
        console.log(`[TurnManager] Hand size ${handSize} is within limit, no discard needed`);
      }
    }
  }

  /**
   * Switches to the next player
   */
  private switchPlayer(): void {
    this.currentPlayer = this.currentPlayer === 0 ? 1 : 0;
    
    if (this.currentPlayer === 0) {
      this.turnNumber++;
      this.isFirstTurn = false;
      console.log(`[TurnManager] Turn ${this.turnNumber} - Player A`);
    } else {
      console.log(`[TurnManager] Turn ${this.turnNumber} - Player B`);
    }
  }

  /**
   * Notifies listeners of phase change
   */
  private notifyPhaseChanged(): void {
    if (this.onPhaseChanged) {
      this.onPhaseChanged(this.currentPhase, this.currentPlayer);
    }
  }
}
