/**
 * Represents a position on the game grid
 */
export interface GridPosition {
  row: number;
  col: number;
}

/**
 * Represents player-related information
 */
export interface PlayerInfo {
  playerId: number; // 0 for Player A (bottom), 1 for Player B (top)
  color: number; // Phaser color value for the player
}
