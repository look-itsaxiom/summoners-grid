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
  // Core game components
  private deck!: Deck;
  private cardPlayHandlerRegistry!: CardPlayHandlerRegistry;
  private readonly playerInfo: PlayerInfo = { playerId: 0, color: GameConfig.PLAYER_A_COLOR };

  // Manager components (following SRP and DIP with interfaces)
  private gridManager!: IGridManager;
  private handManager!: IHandManager;
  private deckVisualizer!: IDeckVisualizer;
  private uiManager!: IUIManager;
  private turnManager!: TurnManager;

  // Grid reference (needed by card handlers)
  private grid: Phaser.GameObjects.Rectangle[][] = [];

  constructor() {
    super("GameScene");
  }

  create(): void {
    // Initialize deck
    this.deck = new Deck();

    // Initialize managers
    this.initializeManagers();

    // Create the game board
    this.grid = this.gridManager.createGrid();

    // Initialize card play handler registry (after grid is created)
    this.initializeCardHandlers();

    // Create deck and discard visuals
    this.deckVisualizer.createDeckVisual(() => this.handleDrawCard());
    this.deckVisualizer.createDiscardVisual();

    // Draw initial hand (3 summon cards only)
    this.drawInitialHand();

    // Create UI elements
    this.uiManager.createStaticUI();
    this.uiManager.createPlayButton(() => this.playSelectedCard());
    this.uiManager.createPhaseIndicator(() => this.handleNextPhase());

    // Initialize and start turn system
    this.turnManager = new TurnManager(this, this.deck, this.handManager);
    this.turnManager.setOnCardDrawn((cardData) => this.onCardDrawn(cardData));
    this.turnManager.setOnPhaseChanged((phase, player) => this.onPhaseChanged(phase, player));
    this.turnManager.startGame();
  }

  /**
   * Initializes all manager components
   */
  private initializeManagers(): void {
    this.gridManager = new GridManager(this);
    this.handManager = new HandManager(this);
    this.deckVisualizer = new DeckVisualizer(this, this.deck);
    this.uiManager = new UIManager(this);
  }

  private initializeCardHandlers(): void {
    // Create the handler registry
    this.cardPlayHandlerRegistry = new CardPlayHandlerRegistry();

    // Register the summon play handler
    const summonHandler = new SummonPlayHandler(this.grid, this.playerInfo);
    this.cardPlayHandlerRegistry.registerHandler(summonHandler);

    // Future handlers can be registered here:
    // this.cardPlayHandlerRegistry.registerHandler(new ActionPlayHandler(...));
    // this.cardPlayHandlerRegistry.registerHandler(new BuildingPlayHandler(...));
    // etc.
  }

  /**
   * Draws initial hand of 3 summon cards
   */
  private drawInitialHand(): void {
    // Draw 3 summon cards for initial hand (3v3 format)
    for (let i = 0; i < 3; i++) {
      const cardData = this.deck.drawSummon();
      if (cardData) {
        this.handManager.addCard(
          cardData,
          (card) => this.onCardSelected(card),
          (card) => this.onCardDeselected(card)
        );
      }
    }
    this.handManager.repositionCards();
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

    const cardData = this.deck.draw();
    if (!cardData) {
      console.log("No more cards in deck");
      return;
    }

    this.handManager.addCard(
      cardData,
      (card) => this.onCardSelected(card),
      (card) => this.onCardDeselected(card)
    );
    this.handManager.repositionCards();
  }

  /**
   * Callback when a card is drawn by turn system
   */
  private onCardDrawn(cardData: CardData): void {
    this.handManager.addCard(
      cardData,
      (card) => this.onCardSelected(card),
      (card) => this.onCardDeselected(card)
    );
    this.handManager.repositionCards();
  }

  /**
   * Callback when phase changes
   */
  private onPhaseChanged(phase: TurnPhase, player: number): void {
    this.uiManager.updatePhaseIndicator(phase, player);
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
  private onCardSelected(card: Card): void {
    // Deselect any previously selected card
    const previouslySelected = this.handManager.getSelectedCard();
    if (previouslySelected && previouslySelected !== card) {
      previouslySelected.deselect();
    }
    this.handManager.setSelectedCard(card);
    console.log("Card selected:", card.getCardData());

    // Show play button above the selected card
    this.uiManager.showPlayButton(card);
  }

  /**
   * Handles card deselection
   */
  private onCardDeselected(card: Card): void {
    this.handManager.deselectCard(card);
    this.uiManager.hidePlayButton();
    console.log("Card deselected");
  }

  /**
   * Plays the currently selected card
   */
  private playSelectedCard(): void {
    const selectedCard = this.handManager.getSelectedCard();
    if (!selectedCard) {
      console.log("No card selected");
      return;
    }

    const cardData = selectedCard.getCardData();
    console.log("Playing card:", cardData);

    // Add card to discard pile
    this.deckVisualizer.addToDiscard(cardData);

    // Remove card from hand
    this.handManager.removeCard(selectedCard);
    this.handManager.setSelectedCard(null);

    // Hide play button
    this.uiManager.hidePlayButton();

    // Reposition remaining cards
    this.handManager.repositionCards();

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
}
