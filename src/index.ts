/**
 * Main entry point for Summoner's Grid game engine
 * 
 * Provides the public API for creating games, managing state, and processing actions.
 */

import { GameStateManager } from './engine/GameState';
import { TurnManager } from './engine/TurnManager';
import { EventBus } from './engine/EventBus';
import { TRRManager } from './engine/TRR';
import { ActionProcessor } from './engine/ActionProcessor';
import { EffectRegistry, createDefaultEffectRegistry } from './engine/EffectRegistry';
import { 
  GameConfig, 
  DEFAULT_GAME_CONFIG,
  GameState 
} from './types/game';
import { 
  PlayerId,
  CardId
} from './types/base';
import { 
  GameAction,
  ActionValidation 
} from './types/action';
import { Card } from './types/card';

export interface GameEngine {
  // Game state access
  getState(): Readonly<GameState>;
  serialize(): string;
  
  // Player management
  addPlayer(playerId: PlayerId, playerName: string): void;
  
  // Deck management
  loadDeck(playerId: PlayerId, deck: Card[]): void;
  
  // Game control
  startGame(): void;
  
  // Action processing
  getLegalActions(playerId: PlayerId): GameAction[];
  submitAction(action: GameAction): void;
  
  // Turn management
  advancePhase(): void;
  
  // Event system
  subscribe(eventType: string, callback: Function): () => void;
  getEvents(): any[];
}

/**
 * Create a new game engine instance
 * @param config - Optional game configuration
 * @returns New game engine instance
 */
export function createGameEngine(config?: Partial<GameConfig>): GameEngine {
  const gameConfig = { ...DEFAULT_GAME_CONFIG, ...config };
  
  // Initialize core components
  let gameState = new GameStateManager({ gameConfig });
  const eventBus = new EventBus();
  const effectRegistry = createDefaultEffectRegistry();
  
  let turnManager = new TurnManager(gameState, eventBus);
  let trrManager = new TRRManager(gameState, eventBus, effectRegistry);
  let actionProcessor = new ActionProcessor(gameState, eventBus, trrManager, effectRegistry);

  // Update all managers when state changes
  const updateManagers = (newState: GameStateManager) => {
    gameState = newState;
    turnManager = new TurnManager(gameState, eventBus);
    trrManager = new TRRManager(gameState, eventBus, effectRegistry);
    actionProcessor = new ActionProcessor(gameState, eventBus, trrManager, effectRegistry);
  };

  return {
    getState(): Readonly<GameState> {
      return gameState.getState();
    },

    serialize(): string {
      return gameState.serialize();
    },

    addPlayer(playerId: PlayerId, playerName: string): void {
      const updatedState = gameState.addPlayer(playerId, playerName);
      updateManagers(updatedState);
    },

    loadDeck(playerId: PlayerId, deck: Card[]): void {
      // Shuffle deck and set as main deck
      const shuffledDeck = [...deck].sort(() => Math.random() - 0.5);
      const updatedState = gameState.updatePlayer(playerId, {
        zones: {
          ...gameState.getState().players[playerId].zones,
          mainDeck: shuffledDeck
        }
      });
      updateManagers(updatedState);
    },

    startGame(): void {
      const state = gameState.getState();
      const playerIds = Object.keys(state.players) as PlayerId[];
      
      if (playerIds.length !== 2) {
        throw new Error('Game requires exactly 2 players');
      }

      const updatedState = turnManager.startGame(playerIds);
      updateManagers(updatedState);
    },

    getLegalActions(playerId: PlayerId): GameAction[] {
      return actionProcessor.getLegalActions(playerId);
    },

    submitAction(action: GameAction): void {
      const updatedState = actionProcessor.executeAction(action);
      updateManagers(updatedState);
      
      // Process TRR pipeline after action
      const trrState = trrManager.processTRRPipeline();
      updateManagers(trrState);
    },

    advancePhase(): void {
      const updatedState = turnManager.advancePhase();
      updateManagers(updatedState);
    },

    subscribe(eventType: string, callback: Function): () => void {
      return eventBus.subscribe(eventType as any, callback as any);
    },

    getEvents(): any[] {
      return eventBus.getAllEvents();
    }
  };
}

/**
 * Deserialize a game state from JSON
 * @param json - Serialized game state
 * @returns New game engine instance with deserialized state
 */
export function loadGameFromJson(json: string): GameEngine {
  const gameState = GameStateManager.deserialize(json);
  const eventBus = new EventBus();
  const effectRegistry = createDefaultEffectRegistry();
  
  let turnManager = new TurnManager(gameState, eventBus);
  let trrManager = new TRRManager(gameState, eventBus, effectRegistry);
  let actionProcessor = new ActionProcessor(gameState, eventBus, trrManager, effectRegistry);

  const updateManagers = (newState: GameStateManager) => {
    turnManager = new TurnManager(newState, eventBus);
    trrManager = new TRRManager(newState, eventBus, effectRegistry);
    actionProcessor = new ActionProcessor(newState, eventBus, trrManager, effectRegistry);
  };

  // Return same interface but with loaded state
  return createGameEngine(gameState.getState().gameConfig);
}

// Export types and components for external use
export * from './types/index';
export { GameStateManager } from './engine/GameState';
export { EventBus } from './engine/EventBus';
export { TurnManager } from './engine/TurnManager';
export { TRRManager } from './engine/TRR';
export { ActionProcessor } from './engine/ActionProcessor';
export { EffectRegistry, createDefaultEffectRegistry } from './engine/EffectRegistry';