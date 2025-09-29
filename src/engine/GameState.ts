/**
 * GameState.ts - Canonical immutable state model with serialization
 * 
 * Manages the complete game state with immutable updates and JSON serialization.
 * Based on GDD: Game Board & Zones, Turn Structure, Victory Conditions
 */

import crypto from 'crypto';
import { 
  GameState, 
  Player, 
  GameConfig, 
  DEFAULT_GAME_CONFIG,
  TurnState,
  SharedZones,
  EffectStackEntry,
  PriorityWindow,
  GameEvent
} from '../types/game';
import { 
  PlayerId, 
  Phase, 
  Zone,
  Coordinate 
} from '../types/base';
import { Card } from '../types/card';

export class GameStateManager {
  private state: GameState;

  constructor(initialState?: Partial<GameState>) {
    this.state = this.createInitialState(initialState);
  }

  /**
   * Get the current game state (immutable)
   */
  getState(): Readonly<GameState> {
    return this.state;
  }

  /**
   * Create a new game state with updates (immutable)
   * @param updates - Partial state updates to apply
   * @returns New GameStateManager with updated state
   */
  update(updates: Partial<GameState>): GameStateManager {
    const newState: GameState = {
      ...this.state,
      ...updates
    };
    
    const newManager = new GameStateManager();
    newManager.state = newState;
    return newManager;
  }

  /**
   * Update a specific player's state
   * @param playerId - ID of player to update
   * @param playerUpdates - Updates to apply to the player
   * @returns New GameStateManager with updated player state
   */
  updatePlayer(playerId: PlayerId, playerUpdates: Partial<Player>): GameStateManager {
    const currentPlayer = this.state.players[playerId];
    if (!currentPlayer) {
      throw new Error(`Player ${playerId} not found`);
    }

    const updatedPlayer: Player = {
      ...currentPlayer,
      ...playerUpdates
    };

    return this.update({
      players: {
        ...this.state.players,
        [playerId]: updatedPlayer
      }
    });
  }

  /**
   * Add a card to a player's zone
   * @param playerId - Player ID
   * @param card - Card to add
   * @param zone - Zone to add the card to
   * @returns New GameStateManager with card added
   */
  addCardToZone(playerId: PlayerId, card: Card, zone: keyof Player['zones']): GameStateManager {
    const player = this.state.players[playerId];
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    const updatedZone = [...player.zones[zone], card];
    
    return this.updatePlayer(playerId, {
      zones: {
        ...player.zones,
        [zone]: updatedZone
      }
    });
  }

  /**
   * Remove a card from a player's zone by card ID
   * @param playerId - Player ID
   * @param cardId - ID of card to remove
   * @param zone - Zone to remove from
   * @returns New GameStateManager with card removed
   */
  removeCardFromZone(playerId: PlayerId, cardId: string, zone: keyof Player['zones']): GameStateManager {
    const player = this.state.players[playerId];
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    const updatedZone = player.zones[zone].filter(card => card.id !== cardId);
    
    return this.updatePlayer(playerId, {
      zones: {
        ...player.zones,
        [zone]: updatedZone
      }
    });
  }

  /**
   * Update turn state
   * @param turnUpdates - Updates to apply to turn state
   * @returns New GameStateManager with updated turn state
   */
  updateTurnState(turnUpdates: Partial<TurnState>): GameStateManager {
    return this.update({
      turnState: {
        ...this.state.turnState,
        ...turnUpdates
      }
    });
  }

  /**
   * Add effect to the stack
   * @param effect - Effect to add
   * @returns New GameStateManager with effect on stack
   */
  addToEffectStack(effect: EffectStackEntry): GameStateManager {
    return this.update({
      effectStack: [...this.state.effectStack, effect]
    });
  }

  /**
   * Remove top effect from stack (LIFO)
   * @returns New GameStateManager with top effect removed
   */
  popFromEffectStack(): GameStateManager {
    const newStack = [...this.state.effectStack];
    newStack.pop();
    return this.update({
      effectStack: newStack
    });
  }

  /**
   * Add event to history
   * @param event - Game event to record
   * @returns New GameStateManager with event added
   */
  addEvent(event: GameEvent): GameStateManager {
    return this.update({
      events: [...this.state.events, event]
    });
  }

  /**
   * Generate a deterministic hash of the current state
   * @returns SHA-256 hash of the serialized state
   */
  getStateHash(): string {
    const stateJson = this.serialize();
    return crypto.createHash('sha256').update(stateJson).digest('hex');
  }

  /**
   * Serialize state to JSON string
   * @returns JSON representation of the game state
   */
  serialize(): string {
    return JSON.stringify(this.state, null, 2);
  }

  /**
   * Create GameStateManager from JSON string
   * @param json - JSON string to deserialize
   * @returns New GameStateManager with deserialized state
   */
  static deserialize(json: string): GameStateManager {
    try {
      const state = JSON.parse(json) as GameState;
      return new GameStateManager(state);
    } catch (error) {
      throw new Error(`Failed to deserialize game state: ${error}`);
    }
  }

  /**
   * Create initial game state
   * @param overrides - Optional state overrides
   * @returns Initial game state
   */
  private createInitialState(overrides?: Partial<GameState>): GameState {
    const defaultState: GameState = {
      gameId: crypto.randomUUID(),
      players: {},
      playerOrder: [],
      sharedZones: {
        inPlay: [],
        gameBoard: new Map()
      },
      turnState: {
        currentPlayer: '',
        phase: Phase.Draw,
        turnNumber: 1,
        phaseStep: 0
      },
      effectStack: [],
      priorityQueue: [],
      gameConfig: DEFAULT_GAME_CONFIG,
      randomSeed: Math.random().toString(36).substring(2),
      events: [],
      isGameOver: false
    };

    return {
      ...defaultState,
      ...overrides
    };
  }

  /**
   * Create a new player and add to game
   * @param playerId - Unique player ID
   * @param playerName - Display name for player
   * @returns New GameStateManager with player added
   */
  addPlayer(playerId: PlayerId, playerName: string): GameStateManager {
    if (this.state.players[playerId]) {
      throw new Error(`Player ${playerId} already exists`);
    }

    const newPlayer: Player = {
      id: playerId,
      name: playerName,
      victoryPoints: [],
      zones: {
        hand: [],
        mainDeck: [],
        advanceDeck: [],
        discardPile: [],
        rechargePile: [],
        removedFromPlay: []
      },
      summons: [],
      hasPlayedTurnSummon: false,
      priority: false
    };

    return this.update({
      players: {
        ...this.state.players,
        [playerId]: newPlayer
      },
      playerOrder: [...this.state.playerOrder, playerId]
    });
  }

  /**
   * Check if coordinate is valid on the board
   * @param coord - Coordinate to check
   * @returns True if coordinate is within board bounds
   */
  isValidCoordinate(coord: Coordinate): boolean {
    return coord.x >= 0 && coord.x < this.state.gameConfig.boardDimensions.width &&
           coord.y >= 0 && coord.y < this.state.gameConfig.boardDimensions.height;
  }

  /**
   * Check if coordinate is in a player's territory
   * @param coord - Coordinate to check
   * @param playerId - Player to check territory for
   * @returns True if coordinate is in player's territory
   */
  isInPlayerTerritory(coord: Coordinate, playerId: PlayerId): boolean {
    const playerIndex = this.state.playerOrder.indexOf(playerId);
    if (playerIndex === -1) return false;

    const territoryRows = this.state.gameConfig.playerTerritoryRows;
    
    if (playerIndex === 0) {
      // First player controls bottom rows
      return coord.y < territoryRows;
    } else {
      // Second player controls top rows
      return coord.y >= this.state.gameConfig.boardDimensions.height - territoryRows;
    }
  }
}