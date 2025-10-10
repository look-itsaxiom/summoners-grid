import { TurnPhase } from "../types/GameTypes";
import { Deck } from "../Deck";
import { IHandManager } from "./IHandManager";
import { SummonUnit } from "../types/SummonUnit";

/**
 * Manages the turn system and phase transitions.
 * Follows Single Responsibility Principle - only handles turn and phase management.
 */
export class TurnManager {
  private currentPlayer: number = 0; // 0 for Player A, 1 for Player B
  private currentPhase: TurnPhase = TurnPhase.Draw;
  private turnNumber: number = 0;
  private isFirstTurn: boolean = true;

  private readonly deckA: Deck;
  private readonly deckB: Deck;
  private readonly handManagerA: IHandManager;
  private readonly handManagerB: IHandManager;
  private readonly scene: Phaser.Scene;
  
  private onCardDrawn: ((cardData: any, player: number) => void) | null = null;
  private onPhaseChanged: ((phase: TurnPhase, player: number) => void) | null = null;
  private onRequestDiscard: ((count: number, player: number) => void) | null = null;
  private onLevelPhase: ((player: number) => void) | null = null;

  constructor(scene: Phaser.Scene, deckA: Deck, deckB: Deck, handManagerA: IHandManager, handManagerB: IHandManager) {
    this.scene = scene;
    this.deckA = deckA;
    this.deckB = deckB;
    this.handManagerA = handManagerA;
    this.handManagerB = handManagerB;
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
  public setOnCardDrawn(callback: (cardData: any, player: number) => void): void {
    this.onCardDrawn = callback;
  }

  /**
   * Sets callback for when phase changes
   */
  public setOnPhaseChanged(callback: (phase: TurnPhase, player: number) => void): void {
    this.onPhaseChanged = callback;
  }

  /**
   * Sets callback for when discard is requested
   */
  public setOnRequestDiscard(callback: (count: number, player: number) => void): void {
    this.onRequestDiscard = callback;
  }

  /**
   * Sets callback for when level phase occurs
   */
  public setOnLevelPhase(callback: (player: number) => void): void {
    this.onLevelPhase = callback;
  }

  /**
   * Completes the discard process and continues turn progression
   */
  public completeDiscard(): void {
    console.log('[TurnManager] Discard completed, switching player');
    this.switchPlayer();
    this.currentPhase = TurnPhase.Draw;
    this.notifyPhaseChanged();

    // No auto-progression - let user control both players
  }

  /**
   * Discards a specific card to the recharge pile
   */
  public discardCard(card: any, player: number): void {
    const cardData = card.getCardData();
    console.log(`[TurnManager] Player ${player} discarding: ${cardData.name}`);
    const deck = player === 0 ? this.deckA : this.deckB;
    const handManager = player === 0 ? this.handManagerA : this.handManagerB;
    deck.addToRechargePile(cardData);
    handManager.removeCard(card);
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
        // Note: If discard is required, executeEndPhase will handle it
        // and completeDiscard() will be called later to switch players
        // If no discard required, we switch immediately
        const handManager = this.currentPlayer === 0 ? this.handManagerA : this.handManagerB;
        const needsDiscard = handManager.getHandSize() > 6;
        if (!needsDiscard) {
          this.switchPlayer();
          this.currentPhase = TurnPhase.Draw;
        } else {
          // Stay in End phase until discard is complete
          return; // Don't notify phase change yet
        }
        break;
    }
    
    console.log(`[TurnManager] Phase changed to ${this.currentPhase} (Player ${this.currentPlayer === 0 ? 'A' : 'B'})`);
    this.notifyPhaseChanged();

    // No auto-progression - let user control both players
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

    // Draw for current player
    const deck = this.currentPlayer === 0 ? this.deckA : this.deckB;
    const cardData = deck.draw();
    if (cardData) {
      console.log(`[TurnManager] Drew card: ${cardData.name}`);
      if (this.onCardDrawn) {
        this.onCardDrawn(cardData, this.currentPlayer);
      }
    } else {
      console.log('[TurnManager] No cards to draw (deck and recharge pile empty)');
    }
  }

  /**
   * Execute Level Phase logic
   */
  private executeLevelPhase(): void {
    console.log('[TurnManager] Executing Level Phase');
    // Notify listeners to level up summons
    if (this.onLevelPhase) {
      this.onLevelPhase(this.currentPlayer);
    }
  }

  /**
   * Execute End Phase logic
   */
  private executeEndPhase(): void {
    console.log('[TurnManager] Executing End Phase');
    
    // Enforce hand limit for current player
    const handManager = this.currentPlayer === 0 ? this.handManagerA : this.handManagerB;
    const handSize = handManager.getHandSize();
    const maxHandSize = 6;
    
    console.log(`[TurnManager] Current hand size: ${handSize}, max: ${maxHandSize}`);
    
    if (handSize > maxHandSize) {
      const cardsToDiscard = handSize - maxHandSize;
      console.log(`[TurnManager] Hand size ${handSize} exceeds limit of ${maxHandSize}, need to discard ${cardsToDiscard} cards`);
      
      // Trigger card discard selection (GameScene will handle UI)
      // For now, we'll need to wait for user to select cards to discard
      // This will be handled by a callback
      if (this.onRequestDiscard) {
        this.onRequestDiscard(cardsToDiscard, this.currentPlayer);
      }
    } else {
      console.log(`[TurnManager] Hand size ${handSize} is within limit, no discard needed`);
      // Continue to next phase immediately if no discard needed
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
