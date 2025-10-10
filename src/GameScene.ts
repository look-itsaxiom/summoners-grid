import Phaser from "phaser";
import { Card, CardData } from "./Card";
import { Deck } from "./Deck";
import { CardPlayHandlerRegistry, SummonPlayHandler } from "./cardHandlers";
import { PlayerInfo, TurnPhase } from "./types/GameTypes";
import { GameConfig } from "./config/GameConfig";
import { GridManager, HandManager, DeckVisualizer, UIManager, TurnManager, type IGridManager, type IHandManager, type IDeckVisualizer, type IUIManager } from "./managers";

/**
 * Main game scene that orchestrates the game flow.
 * Refactored to follow Single Responsibility Principle by delegating
 * specific responsibilities to dedicated manager classes.
 */
export class GameScene extends Phaser.Scene {
  // Core game components - one deck per player
  private deckA!: Deck;
  private deckB!: Deck;
  private cardPlayHandlerRegistry!: CardPlayHandlerRegistry;
  private playerInfoA: PlayerInfo = { playerId: 0, color: GameConfig.PLAYER_A_COLOR };
  private playerInfoB: PlayerInfo = { playerId: 1, color: GameConfig.PLAYER_B_COLOR };

  // Manager components (following SRP and DIP with interfaces)
  private gridManager!: IGridManager;
  private handManagerA!: IHandManager;
  private handManagerB!: IHandManager;
  private deckVisualizerA!: IDeckVisualizer;
  private deckVisualizerB!: IDeckVisualizer;
  private uiManager!: IUIManager;
  private turnManager!: TurnManager;

  // Grid reference (needed by card handlers)
  private grid: Phaser.GameObjects.Rectangle[][] = [];

  // Discard selection state
  private isSelectingDiscard: boolean = false;
  private discardCount: number = 0;
  private selectedForDiscard: Card[] = [];

  constructor() {
    super("GameScene");
  }

  create(): void {
    // Initialize decks - one for each player
    this.deckA = new Deck();
    this.deckB = new Deck();

    // Initialize managers
    this.initializeManagers();

    // Create the game board
    this.grid = this.gridManager.createGrid();

    // Initialize card play handler registry (after grid is created)
    this.initializeCardHandlers();

    // Create deck and discard visuals for both players
    this.deckVisualizerA.createDeckVisual(() => this.handleDrawCard());
    this.deckVisualizerA.createDiscardVisual();
    this.deckVisualizerB.createDeckVisual(() => this.handleDrawCard());
    this.deckVisualizerB.createDiscardVisual();

    // Draw initial hand for both players (3 summon cards each)
    this.drawInitialHand();

    // Create UI elements
    this.uiManager.createStaticUI();
    this.uiManager.createPlayButton(() => this.playSelectedCard());
    this.uiManager.createPhaseIndicator(() => this.handleNextPhase());

    // Initialize and start turn system
    this.turnManager = new TurnManager(this, this.deckA, this.deckB, this.handManagerA, this.handManagerB);
    this.turnManager.setOnCardDrawn((cardData, player) => this.onCardDrawn(cardData, player));
    this.turnManager.setOnPhaseChanged((phase, player) => this.onPhaseChanged(phase, player));
    this.turnManager.setOnRequestDiscard((count, player) => this.onRequestDiscard(count, player));
    this.turnManager.setOnLevelPhase((player) => this.onLevelPhase(player));
    this.turnManager.startGame();
  }

  /**
   * Initializes all manager components
   */
  private initializeManagers(): void {
    this.gridManager = new GridManager(this);
    this.handManagerA = new HandManager(this, 0); // Player A
    this.handManagerB = new HandManager(this, 1); // Player B
    this.deckVisualizerA = new DeckVisualizer(this, this.deckA, 0);
    this.deckVisualizerB = new DeckVisualizer(this, this.deckB, 1);
    this.uiManager = new UIManager(this);
  }

  private initializeCardHandlers(): void {
    // Create the handler registry
    this.cardPlayHandlerRegistry = new CardPlayHandlerRegistry();

    // Register the summon play handler for Player A
    const summonHandlerA = new SummonPlayHandler(
      this.grid, 
      this.playerInfoA,
      () => this.canPerformActions()
    );
    this.cardPlayHandlerRegistry.registerHandler(summonHandlerA);

    // Register the summon play handler for Player B
    const summonHandlerB = new SummonPlayHandler(
      this.grid, 
      this.playerInfoB,
      () => this.canPerformActions()
    );
    this.cardPlayHandlerRegistry.registerHandler(summonHandlerB);

    // Store references to summon handlers for level phase
    (this as any).summonHandlerA = summonHandlerA;
    (this as any).summonHandlerB = summonHandlerB;

    // Future handlers can be registered here:
    // this.cardPlayHandlerRegistry.registerHandler(new ActionPlayHandler(...));
    // this.cardPlayHandlerRegistry.registerHandler(new BuildingPlayHandler(...));
    // etc.
  }

  /**
   * Draws initial hand of 3 summon cards for both players
   */
  private drawInitialHand(): void {
    // Draw 3 summon cards for Player A (3v3 format)
    for (let i = 0; i < 3; i++) {
      const cardData = this.deckA.drawSummon();
      if (cardData) {
        this.handManagerA.addCard(
          cardData,
          (card) => this.onCardSelected(card, 0),
          (card) => this.onCardDeselected(card, 0)
        );
      }
    }
    this.handManagerA.repositionCards();

    // Draw 3 summon cards for Player B (3v3 format)
    for (let i = 0; i < 3; i++) {
      const cardData = this.deckB.drawSummon();
      if (cardData) {
        this.handManagerB.addCard(
          cardData,
          (card) => this.onCardSelected(card, 1),
          (card) => this.onCardDeselected(card, 1)
        );
      }
    }
    this.handManagerB.repositionCards();
  }

  /**
   * Handles drawing a card from the deck
   */
  private handleDrawCard(): void {
    // Manual draw via deck button - only during action phase
    if (this.turnManager.getCurrentPhase() !== TurnPhase.Action) {
      console.log('Can only draw cards manually during Action Phase');
      return;
    }

    const currentPlayer = this.turnManager.getCurrentPlayer();
    const deck = currentPlayer === 0 ? this.deckA : this.deckB;
    const handManager = currentPlayer === 0 ? this.handManagerA : this.handManagerB;

    const cardData = deck.draw();
    if (!cardData) {
      console.log("No more cards in deck");
      return;
    }

    handManager.addCard(
      cardData,
      (card) => this.onCardSelected(card, currentPlayer),
      (card) => this.onCardDeselected(card, currentPlayer)
    );
    handManager.repositionCards();
  }

  /**
   * Callback when a card is drawn by turn system
   */
  private onCardDrawn(cardData: CardData, player: number): void {
    const handManager = player === 0 ? this.handManagerA : this.handManagerB;
    handManager.addCard(
      cardData,
      (card) => this.onCardSelected(card, player),
      (card) => this.onCardDeselected(card, player)
    );
    handManager.repositionCards();
  }

  /**
   * Callback when phase changes
   */
  private onPhaseChanged(phase: TurnPhase, player: number): void {
    this.uiManager.updatePhaseIndicator(phase, player);
  }

  /**
   * Callback when level phase occurs
   */
  private onLevelPhase(player: number): void {
    console.log(`[GameScene] Level Phase for player ${player}`);
    const summonHandler = player === 0 ? (this as any).summonHandlerA : (this as any).summonHandlerB;
    if (summonHandler) {
      summonHandler.levelUpPlayerSummons(player);
    }
  }

  /**
   * Handles next phase button click
   */
  private handleNextPhase(): void {
    this.turnManager.nextPhase();
  }

  /**
   * Handles card selection
   */
  private onCardSelected(card: Card, player: number): void {
    // If selecting cards to discard
    if (this.isSelectingDiscard) {
      this.toggleDiscardSelection(card);
      return;
    }

    // Check if player can perform actions
    if (!this.canPerformActions()) {
      console.log("Cannot select cards during this phase or when it's not your turn");
      return;
    }

    const handManager = player === 0 ? this.handManagerA : this.handManagerB;

    // Deselect any previously selected card
    const previouslySelected = handManager.getSelectedCard();
    if (previouslySelected && previouslySelected !== card) {
      previouslySelected.deselect();
    }
    handManager.setSelectedCard(card);
    console.log("Card selected:", card.getCardData());

    // Show play button above the selected card
    this.uiManager.showPlayButton(card);
  }

  /**
   * Handles card deselection
   */
  private onCardDeselected(card: Card, player: number): void {
    const handManager = player === 0 ? this.handManagerA : this.handManagerB;
    handManager.deselectCard(card);
    this.uiManager.hidePlayButton();
    console.log("Card deselected");
  }

  /**
   * Plays the currently selected card
   */
  private playSelectedCard(): void {
    // Check if player can perform actions
    if (!this.canPerformActions()) {
      console.log("Cannot play cards during this phase or when it's not your turn");
      return;
    }

    const currentPlayer = this.turnManager.getCurrentPlayer();
    const handManager = currentPlayer === 0 ? this.handManagerA : this.handManagerB;
    const deckVisualizer = currentPlayer === 0 ? this.deckVisualizerA : this.deckVisualizerB;

    const selectedCard = handManager.getSelectedCard();
    if (!selectedCard) {
      console.log("No card selected");
      return;
    }

    const cardData = selectedCard.getCardData();
    console.log("Playing card:", cardData);

    // Add card to discard pile
    deckVisualizer.addToDiscard(cardData);

    // Remove card from hand
    handManager.removeCard(selectedCard);
    handManager.setSelectedCard(null);

    // Hide play button
    this.uiManager.hidePlayButton();

    // Reposition remaining cards
    handManager.repositionCards();

    // Execute card play logic
    this.onPlayCard(cardData);
  }

  /**
   * Executes card play logic through the appropriate handler
   */
  private onPlayCard(cardData: CardData): void {
    console.log(`[GameScene] Playing card: ${cardData.name} (${cardData.type})`);

    // Try to execute using the appropriate handler
    const handled = this.cardPlayHandlerRegistry.executePlay(cardData, this, (success: boolean) => {
      if (success) {
        console.log(`[GameScene] Card played successfully: ${cardData.name}`);
      } else {
        console.log(`[GameScene] Card play failed: ${cardData.name}`);
      }
    });

    if (!handled) {
      // No handler available for this card type yet
      console.log(`[GameScene] No handler implemented yet for ${cardData.type} cards`);
      console.log(`[GameScene] Card effect would be applied here in future implementation`);
    }
  }

  /**
   * Checks if the player can perform actions (select/play cards)
   * Only allowed during the current player's Action phase
   */
  private canPerformActions(): boolean {
    const currentPlayer = this.turnManager.getCurrentPlayer();
    const currentPhase = this.turnManager.getCurrentPhase();
    
    // Only the current player can perform actions during their Action phase
    return currentPhase === TurnPhase.Action;
  }

  /**
   * Callback when discard is requested at end phase
   */
  private onRequestDiscard(count: number, player: number): void {
    console.log(`[GameScene] Player ${player} needs to discard ${count} cards`);
    this.isSelectingDiscard = true;
    this.discardCount = count;
    this.selectedForDiscard = [];
    
    // Show discard UI
    this.uiManager.showDiscardUI(count, () => this.confirmDiscard(player));
  }

  /**
   * Toggles a card's selection for discard
   */
  private toggleDiscardSelection(card: Card): void {
    const index = this.selectedForDiscard.indexOf(card);
    
    if (index >= 0) {
      // Already selected, deselect it
      this.selectedForDiscard.splice(index, 1);
      card.deselect();
    } else if (this.selectedForDiscard.length < this.discardCount) {
      // Can select more cards
      this.selectedForDiscard.push(card);
      card.select();
    }
    
    // Update UI with count
    this.uiManager.updateDiscardCount(this.selectedForDiscard.length, this.discardCount);
  }

  /**
   * Confirms the discard selection
   */
  private confirmDiscard(player: number): void {
    if (this.selectedForDiscard.length !== this.discardCount) {
      console.log(`Must select exactly ${this.discardCount} cards to discard`);
      return;
    }

    // Discard the selected cards
    this.selectedForDiscard.forEach(card => {
      this.turnManager.discardCard(card, player);
    });

    // Clean up
    this.selectedForDiscard = [];
    this.isSelectingDiscard = false;
    
    const handManager = player === 0 ? this.handManagerA : this.handManagerB;
    handManager.repositionCards();
    
    // Hide discard UI
    this.uiManager.hideDiscardUI();

    // Complete the discard process
    this.turnManager.completeDiscard();
  }
}
