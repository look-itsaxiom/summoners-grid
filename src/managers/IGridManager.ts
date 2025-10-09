/**
 * Interface for grid management operations.
 * Following the Interface Segregation Principle - only contains methods
 * relevant to grid creation and management.
 */
export interface IGridManager {
  /**
   * Creates the game board with territory coloring
   * @returns The created grid
   */
  createGrid(): Phaser.GameObjects.Rectangle[][];

  /**
   * Gets the created grid
   * @returns The current grid or empty array if not created
   */
  getGrid(): Phaser.GameObjects.Rectangle[][];
}
