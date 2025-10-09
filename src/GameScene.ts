import Phaser from "phaser";
import { Card, CardData } from "./Card";
import { Deck } from "./Deck";
import { CardPlayHandlerRegistry, SummonPlayHandler } from "./cardHandlers";
import { PlayerInfo, TurnPhase, GridPosition } from "./types/GameTypes";
import { GameConfig } from "./config/GameConfig";
import { GridManager, HandManager, DeckVisualizer, UIManager, TurnManager, type IGridManager, type IHandManager, type IDeckVisualizer, type IUIManager } from "./managers";
import { IGameService, LocalGameService, type GameState, type AnyPlayerAction } from "./services";

/**
 * Main game scene that orchestrates the game flow.
 * 
 * REFACTORED: Now uses GameService for all game state management.
 * The UI (GameScene) accepts player input and sends it to the GameService,
 * which processes the input and returns updated game state.
 * 
 * This separation prepares for future server-based architecture where
 * LocalGameService can be replaced with RemoteGameService.
 */
export class GameScene extends Phaser.Scene {
  // Game service (the authoritative source of game state)
  private gameService!: IGameService;
  private currentGameState!: GameState;
  
  // Core game components (now mainly for UI display)
  private deck!: Deck; // TODO: Can be removed once fully integrated with service
  private cardPlayHandlerRegistry!: CardPlayHandlerRegistry;
  private readonly playerInfo: PlayerInfo = { playerId: 0, color: GameConfig.PLAYER_A_COLOR };

  // Manager components (following SRP and DIP with interfaces)
  private gridManager!: IGridManager;
  private handManager!: IHandManager;
  private deckVisualizer!: IDeckVisualizer;
  private uiManager!: IUIManager;
  private turnManager!: TurnManager; // TODO: Can be removed once fully integrated with service

  // Grid reference (needed by card handlers)
  private grid: Phaser.GameObjects.Rectangle[][] = [];

  // Discard selection state
  private isSelectingDiscard: boolean = false;
  private discardCount: number = 0;
  private selectedForDiscard: Card[] = [];

  constructor() {
    super("GameScene");
  }

  async create(): Promise<void> {
    // Initialize game service
    this.gameService = new LocalGameService();
    this.currentGameState = await this.gameService.initializeGame();
    
    // Initialize deck (temporary - for UI display)
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

    // Initialize hand from game state
    this.syncHandFromGameState();

    // Create UI elements
    this.uiManager.createStaticUI();
    this.uiManager.createPlayButton(() => this.playSelectedCard());
    this.uiManager.createPhaseIndicator(() => this.handleNextPhase());

    // Initialize and start turn system (temporary compatibility layer)
    this.turnManager = new TurnManager(this, this.deck, this.handManager);
    this.turnManager.setOnCardDrawn((cardData) => this.onCardDrawn(cardData));
    this.turnManager.setOnPhaseChanged((phase, player) => this.onPhaseChanged(phase, player));
    this.turnManager.setOnRequestDiscard((count) => this.onRequestDiscard(count));
    this.turnManager.startGame();
    
    // Sync initial UI with game state
    this.syncUIWithGameState();
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

    // Register the summon play handler with phase/turn check and service callbacks
    const summonHandler = new SummonPlayHandler(
      this.grid, 
      this.playerInfo,
      () => this.canPerformActions(),
      (cardData, position) => this.onSummonPlacementRequested(cardData, position),
      (fromPos, toPos) => this.onSummonMoveRequested(fromPos, toPos)
    );
    this.cardPlayHandlerRegistry.registerHandler(summonHandler);

    // Future handlers can be registered here:
    // this.cardPlayHandlerRegistry.registerHandler(new ActionPlayHandler(...));
    // this.cardPlayHandlerRegistry.registerHandler(new BuildingPlayHandler(...));
    // etc.
  }
  
  /**
   * Called when player requests to place a summon
   * REFACTORED: Sends action to game service instead of directly placing
   */
  private async onSummonPlacementRequested(cardData: CardData, position: GridPosition): Promise<void> {
    console.log(`[GameScene] Summon placement requested at (${position.col},${position.row})`);
    
    // Send play card action to service
    await this.processPlayerAction({
      type: "PLAY_CARD",
      playerId: this.playerInfo.playerId,
      cardData: cardData,
      targetPosition: position
    });
    
    // Service has updated state, now create visual token
    // Get the summon handler to place the visual token
    const summonHandler = this.cardPlayHandlerRegistry.getHandler(cardData);
    if (summonHandler && summonHandler instanceof SummonPlayHandler) {
      summonHandler.placeToken(this, position, cardData);
      // Sync handler's placed summons with game state
      summonHandler.syncPlacedSummons(this.currentGameState.placedSummons);
    }
  }
  
  /**
   * Called when player requests to move a summon
   * REFACTORED: Sends action to game service instead of directly moving
   */
  private async onSummonMoveRequested(fromPos: GridPosition, toPos: GridPosition): Promise<void> {
    console.log(`[GameScene] Summon move requested from (${fromPos.col},${fromPos.row}) to (${toPos.col},${toPos.row})`);
    
    // Send move summon action to service
    await this.processPlayerAction({
      type: "MOVE_SUMMON",
      playerId: this.playerInfo.playerId,
      fromPosition: fromPos,
      toPosition: toPos
    });
    
    // Service has updated state, now animate the visual token
    const fromKey = `${fromPos.row},${fromPos.col}`;
    const summon = this.currentGameState.placedSummons.get(fromKey);
    
    if (summon) {
      // Find MoveAction to animate the token
      const summonHandler = this.cardPlayHandlerRegistry.getHandler({ type: 'Summon' } as CardData);
      if (summonHandler && summonHandler instanceof SummonPlayHandler) {
        // Get the MoveAction from available actions
        const moveAction = (summonHandler as any).availableActions?.find(
          (action: any) => action.getName() === 'Move'
        );
        
        if (moveAction && 'moveToken' in moveAction) {
          (moveAction as any).moveToken(this, summon, toPos);
        }
        
        // Sync handler's placed summons with game state
        summonHandler.syncPlacedSummons(this.currentGameState.placedSummons);
      }
    }
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
   * REFACTORED: Now sends action to game service
   */
  private handleNextPhase(): void {
    // Use service to process phase change
    this.processPlayerAction({
      type: "NEXT_PHASE",
      playerId: this.currentGameState.currentPlayer
    });
  }

  /**
   * Handles card selection
   */
  private onCardSelected(card: Card): void {
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
    // Check if player can perform actions
    if (!this.canPerformActions()) {
      console.log("Cannot play cards during this phase or when it's not your turn");
      return;
    }

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

  /**
   * Checks if the player can perform actions (select/play cards)
   * Only allowed during Player A's Action phase
   */
  private canPerformActions(): boolean {
    // Use game state from service
    return this.currentGameState.currentPhase === TurnPhase.Action && 
           this.currentGameState.currentPlayer === 0; // Player A
  }
  
  /**
   * Sync hand display from game state
   */
  private syncHandFromGameState(): void {
    this.handManager.clearHand();
    const hand = this.currentGameState.currentPlayer === 0 
      ? this.currentGameState.playerAHand 
      : this.currentGameState.playerBHand;
    
    for (const cardData of hand) {
      this.handManager.addCard(
        cardData,
        (card) => this.onCardSelected(card),
        (card) => this.onCardDeselected(card)
      );
    }
    this.handManager.repositionCards();
  }
  
  /**
   * Sync all UI elements with current game state
   */
  private syncUIWithGameState(): void {
    // Update phase indicator
    this.uiManager.updatePhaseIndicator(
      this.currentGameState.currentPhase,
      this.currentGameState.currentPlayer
    );
    
    // Sync hand
    this.syncHandFromGameState();
    
    // Handle discard selection state
    if (this.currentGameState.isSelectingDiscard && !this.isSelectingDiscard) {
      this.onRequestDiscard(this.currentGameState.discardCount);
    }
  }
  
  /**
   * Process a player action through the game service
   */
  private async processPlayerAction(action: AnyPlayerAction): Promise<void> {
    const response = await this.gameService.processAction(action);
    
    if (!response.success) {
      console.warn(`[GameScene] Action failed: ${response.message}`);
      // TODO: Show error message to player
      return;
    }
    
    // Update local game state
    this.currentGameState = response.state;
    
    // Sync UI with new state
    this.syncUIWithGameState();
    
    // Handle cards drawn
    if (response.cardsDrawn && response.cardsDrawn.length > 0) {
      for (const cardData of response.cardsDrawn) {
        this.onCardDrawn(cardData);
      }
    }
    
    console.log(`[GameScene] Action processed successfully: ${response.message || 'OK'}`);
  }

  /**
   * Callback when discard is requested at end phase
   */
  private onRequestDiscard(count: number): void {
    console.log(`[GameScene] Need to discard ${count} cards`);
    this.isSelectingDiscard = true;
    this.discardCount = count;
    this.selectedForDiscard = [];
    
    // Show discard UI
    this.uiManager.showDiscardUI(count, () => this.confirmDiscard());
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
  private confirmDiscard(): void {
    if (this.selectedForDiscard.length !== this.discardCount) {
      console.log(`Must select exactly ${this.discardCount} cards to discard`);
      return;
    }

    // Discard the selected cards
    this.selectedForDiscard.forEach(card => {
      this.turnManager.discardCard(card);
    });

    // Clean up
    this.selectedForDiscard = [];
    this.isSelectingDiscard = false;
    this.handManager.repositionCards();
    
    // Hide discard UI
    this.uiManager.hideDiscardUI();

    // Complete the discard process
    this.turnManager.completeDiscard();
  }
}
