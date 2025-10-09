import { IGameService } from "./IGameService";
import { AnyPlayerAction, PlayCardAction, MoveSummonAction, DiscardCardsAction } from "./PlayerAction";
import { GameState, GameStateResponse } from "./GameState";
import { TurnPhase } from "../types/GameTypes";
import { Deck } from "../Deck";
import { CardData } from "../Card";
import { SummonUnit } from "../types/SummonUnit";

/**
 * Local implementation of the game service.
 * This runs in the same process as the UI, but is architecturally separated.
 * 
 * In the future, this can be replaced with a RemoteGameService that
 * communicates with an authoritative server over the network.
 * 
 * Follows Single Responsibility Principle: Only manages game state and rules.
 */
export class LocalGameService implements IGameService {
  private gameState: GameState;
  private deck: Deck;
  
  constructor() {
    this.deck = new Deck();
    this.gameState = this.createInitialState();
  }
  
  /**
   * Initialize a new game
   */
  async initializeGame(): Promise<GameState> {
    console.log('[LocalGameService] Initializing new game');
    this.deck = new Deck();
    this.gameState = this.createInitialState();
    
    // Draw initial hands (3 summon cards each)
    for (let i = 0; i < 3; i++) {
      const cardA = this.deck.drawSummon();
      if (cardA) this.gameState.playerAHand.push(cardA);
      
      const cardB = this.deck.drawSummon();
      if (cardB) this.gameState.playerBHand.push(cardB);
    }
    
    return this.cloneGameState(this.gameState);
  }
  
  /**
   * Get current game state
   */
  async getGameState(): Promise<GameState> {
    return this.cloneGameState(this.gameState);
  }
  
  /**
   * Process a player action
   */
  async processAction(action: AnyPlayerAction): Promise<GameStateResponse> {
    console.log(`[LocalGameService] Processing action: ${action.type}`);
    
    try {
      // Validate that it's the correct player's turn
      if (action.playerId !== this.gameState.currentPlayer) {
        return {
          state: this.cloneGameState(this.gameState),
          success: false,
          message: "It's not your turn"
        };
      }
      
      // Route to appropriate handler
      switch (action.type) {
        case "NEXT_PHASE":
          return await this.handleNextPhase(action.playerId);
        
        case "PLAY_CARD":
          return await this.handlePlayCard(action as PlayCardAction);
        
        case "MOVE_SUMMON":
          return await this.handleMoveSummon(action as MoveSummonAction);
        
        case "ATTACK":
          return {
            state: this.cloneGameState(this.gameState),
            success: false,
            message: "Attack not yet implemented"
          };
        
        case "DISCARD_CARDS":
          return await this.handleDiscardCards(action as DiscardCardsAction);
        
        case "DRAW_CARD":
          return await this.handleDrawCard(action.playerId);
        
        default:
          return {
            state: this.cloneGameState(this.gameState),
            success: false,
            message: `Unknown action type: ${(action as any).type}`
          };
      }
    } catch (error) {
      console.error('[LocalGameService] Error processing action:', error);
      return {
        state: this.cloneGameState(this.gameState),
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Handle next phase action
   */
  private async handleNextPhase(playerId: number): Promise<GameStateResponse> {
    const cardsDrawn: CardData[] = [];
    
    switch (this.gameState.currentPhase) {
      case TurnPhase.Draw:
        // Execute draw phase
        if (!this.gameState.isFirstTurn || this.gameState.currentPlayer === 1) {
          const card = this.deck.draw();
          if (card) {
            this.getCurrentPlayerHand().push(card);
            cardsDrawn.push(card);
          }
        }
        this.gameState.currentPhase = TurnPhase.Level;
        break;
      
      case TurnPhase.Level:
        // Execute level phase (TODO: level up summons)
        this.gameState.currentPhase = TurnPhase.Action;
        break;
      
      case TurnPhase.Action:
        this.gameState.currentPhase = TurnPhase.End;
        break;
      
      case TurnPhase.End:
        // Check hand size limit
        const handSize = this.getCurrentPlayerHand().length;
        if (handSize > 6) {
          this.gameState.isSelectingDiscard = true;
          this.gameState.discardCount = handSize - 6;
          return {
            state: this.cloneGameState(this.gameState),
            success: true,
            message: `You must discard ${this.gameState.discardCount} cards`,
            cardsDrawn
          };
        }
        
        // Switch players
        this.switchPlayer();
        this.gameState.currentPhase = TurnPhase.Draw;
        break;
    }
    
    this.updateDeckCounts();
    
    return {
      state: this.cloneGameState(this.gameState),
      success: true,
      cardsDrawn: cardsDrawn.length > 0 ? cardsDrawn : undefined
    };
  }
  
  /**
   * Handle play card action
   */
  private async handlePlayCard(action: PlayCardAction): Promise<GameStateResponse> {
    // Validate phase
    if (this.gameState.currentPhase !== TurnPhase.Action) {
      return {
        state: this.cloneGameState(this.gameState),
        success: false,
        message: "Cards can only be played during Action phase"
      };
    }
    
    const hand = this.getCurrentPlayerHand();
    const cardIndex = hand.findIndex(c => c.id === action.cardData.id);
    
    if (cardIndex === -1) {
      return {
        state: this.cloneGameState(this.gameState),
        success: false,
        message: "Card not found in hand"
      };
    }
    
    // Handle summon placement
    if (action.cardData.type === 'Summon' && action.targetPosition) {
      const posKey = `${action.targetPosition.row},${action.targetPosition.col}`;
      
      // Validate position is in player territory
      if (!this.isValidSummonPosition(action.targetPosition, action.playerId)) {
        return {
          state: this.cloneGameState(this.gameState),
          success: false,
          message: "Invalid summon position"
        };
      }
      
      // Create summon unit (without token, will be created by UI)
      // Token will be assigned by the UI layer when rendering
      const summon = new SummonUnit(
        action.cardData,
        action.targetPosition,
        action.playerId,
        null as any // Placeholder, will be set by UI
      );
      
      this.gameState.placedSummons.set(posKey, summon);
      
      // Remove from hand
      hand.splice(cardIndex, 1);
      
      // Draw 3 cards for summon play
      const cardsDrawn: CardData[] = [];
      for (let i = 0; i < 3; i++) {
        const card = this.deck.draw();
        if (card) {
          hand.push(card);
          cardsDrawn.push(card);
        }
      }
      
      this.updateDeckCounts();
      
      return {
        state: this.cloneGameState(this.gameState),
        success: true,
        message: "Summon placed successfully",
        cardsDrawn: cardsDrawn.length > 0 ? cardsDrawn : undefined
      };
    }
    
    // For other card types (not yet implemented)
    return {
      state: this.cloneGameState(this.gameState),
      success: false,
      message: `Playing ${action.cardData.type} cards is not yet implemented`
    };
  }
  
  /**
   * Handle move summon action
   */
  private async handleMoveSummon(action: MoveSummonAction): Promise<GameStateResponse> {
    const fromKey = `${action.fromPosition.row},${action.fromPosition.col}`;
    const toKey = `${action.toPosition.row},${action.toPosition.col}`;
    
    const summon = this.gameState.placedSummons.get(fromKey);
    
    if (!summon) {
      return {
        state: this.cloneGameState(this.gameState),
        success: false,
        message: "No summon at source position"
      };
    }
    
    if (summon.playerId !== action.playerId) {
      return {
        state: this.cloneGameState(this.gameState),
        success: false,
        message: "That's not your summon"
      };
    }
    
    if (!summon.canMove()) {
      return {
        state: this.cloneGameState(this.gameState),
        success: false,
        message: "Summon has already used its movement"
      };
    }
    
    // TODO: Validate movement distance based on summon's movement stat
    
    // Move the summon
    this.gameState.placedSummons.delete(fromKey);
    summon.position = action.toPosition;
    summon.useMovement(99); // Mark as used (simplified for now)
    this.gameState.placedSummons.set(toKey, summon);
    
    return {
      state: this.cloneGameState(this.gameState),
      success: true,
      message: "Summon moved successfully"
    };
  }
  
  /**
   * Handle discard cards action
   */
  private async handleDiscardCards(action: DiscardCardsAction): Promise<GameStateResponse> {
    if (!this.gameState.isSelectingDiscard) {
      return {
        state: this.cloneGameState(this.gameState),
        success: false,
        message: "Not currently discarding cards"
      };
    }
    
    if (action.cards.length !== this.gameState.discardCount) {
      return {
        state: this.cloneGameState(this.gameState),
        success: false,
        message: `Must discard exactly ${this.gameState.discardCount} cards`
      };
    }
    
    const hand = this.getCurrentPlayerHand();
    
    // Remove cards from hand and add to recharge pile
    for (const card of action.cards) {
      const index = hand.findIndex(c => c.id === card.id);
      if (index !== -1) {
        hand.splice(index, 1);
        this.deck.addToRechargePile(card);
      }
    }
    
    // Clear discard state
    this.gameState.isSelectingDiscard = false;
    this.gameState.discardCount = 0;
    
    // Switch players
    this.switchPlayer();
    this.gameState.currentPhase = TurnPhase.Draw;
    
    this.updateDeckCounts();
    
    return {
      state: this.cloneGameState(this.gameState),
      success: true,
      message: "Cards discarded successfully"
    };
  }
  
  /**
   * Handle draw card action
   */
  private async handleDrawCard(playerId: number): Promise<GameStateResponse> {
    if (this.gameState.currentPhase !== TurnPhase.Action) {
      return {
        state: this.cloneGameState(this.gameState),
        success: false,
        message: "Can only draw manually during Action phase"
      };
    }
    
    const card = this.deck.draw();
    if (!card) {
      return {
        state: this.cloneGameState(this.gameState),
        success: false,
        message: "No cards to draw"
      };
    }
    
    this.getCurrentPlayerHand().push(card);
    this.updateDeckCounts();
    
    return {
      state: this.cloneGameState(this.gameState),
      success: true,
      message: "Card drawn",
      cardsDrawn: [card]
    };
  }
  
  /**
   * Helper: Create initial game state
   */
  private createInitialState(): GameState {
    return {
      turnNumber: 1,
      currentPlayer: 0,
      currentPhase: TurnPhase.Draw,
      isFirstTurn: true,
      playerAHand: [],
      playerBHand: [],
      placedSummons: new Map(),
      mainDeckCount: this.deck.getRemainingCount(),
      rechargePileCount: this.deck.getRechargePileCount(),
      discardPileCount: 0, // TODO: Add getDiscardPileCount to Deck class
      isSelectingDiscard: false,
      discardCount: 0,
      playerAVictoryPoints: 0,
      playerBVictoryPoints: 0
    };
  }
  
  /**
   * Helper: Get current player's hand
   */
  private getCurrentPlayerHand(): CardData[] {
    return this.gameState.currentPlayer === 0 
      ? this.gameState.playerAHand 
      : this.gameState.playerBHand;
  }
  
  /**
   * Helper: Switch to next player
   */
  private switchPlayer(): void {
    this.gameState.currentPlayer = this.gameState.currentPlayer === 0 ? 1 : 0;
    
    if (this.gameState.currentPlayer === 0) {
      this.gameState.turnNumber++;
      this.gameState.isFirstTurn = false;
    }
  }
  
  /**
   * Helper: Validate summon position
   */
  private isValidSummonPosition(pos: { row: number; col: number }, playerId: number): boolean {
    // Player A territory: rows 0-2
    // Player B territory: rows 11-13
    if (playerId === 0) {
      return pos.row >= 0 && pos.row <= 2 && pos.col >= 0 && pos.col < 12;
    } else {
      return pos.row >= 11 && pos.row <= 13 && pos.col >= 0 && pos.col < 12;
    }
  }
  
  /**
   * Helper: Update deck counts in state
   */
  private updateDeckCounts(): void {
    this.gameState.mainDeckCount = this.deck.getRemainingCount();
    this.gameState.rechargePileCount = this.deck.getRechargePileCount();
    this.gameState.discardPileCount = 0; // TODO: Add getDiscardPileCount to Deck class
  }
  
  /**
   * Helper: Clone game state for immutability
   */
  private cloneGameState(state: GameState): GameState {
    return {
      ...state,
      playerAHand: [...state.playerAHand],
      playerBHand: [...state.playerBHand],
      placedSummons: new Map(state.placedSummons)
    };
  }
}
