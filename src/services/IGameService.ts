import { AnyPlayerAction } from "./PlayerAction";
import { GameState, GameStateResponse } from "./GameState";

/**
 * Interface for the game service.
 * This defines the contract between the UI (client) and game logic (service).
 * 
 * The service is responsible for:
 * - Managing authoritative game state
 * - Processing player actions
 * - Validating actions according to game rules
 * - Returning updated game state
 * 
 * This interface allows for future implementations:
 * - LocalGameService: In-process service for single player or local multiplayer
 * - RemoteGameService: Client that communicates with a server over network
 * - MockGameService: For testing UI components
 */
export interface IGameService {
  /**
   * Initialize a new game and return the initial state
   */
  initializeGame(): Promise<GameState>;
  
  /**
   * Process a player action and return the updated game state
   * @param action - The player action to process
   * @returns Response containing updated state and success status
   */
  processAction(action: AnyPlayerAction): Promise<GameStateResponse>;
  
  /**
   * Get the current game state (read-only)
   */
  getGameState(): Promise<GameState>;
}
