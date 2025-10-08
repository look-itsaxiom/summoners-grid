import { SummonUnit } from '../types/SummonUnit';

/**
 * Interface for summon actions.
 * This follows the Interface Segregation Principle - actions implement
 * only the methods they need, and the Open/Closed Principle - new
 * actions can be added without modifying existing code.
 */
export interface ISummonAction {
  /**
   * Get the name of this action
   */
  getName(): string;

  /**
   * Check if this action can be performed on the given summon
   */
  canExecute(summon: SummonUnit): boolean;

  /**
   * Execute the action
   * @param summon The summon performing the action
   * @param scene The game scene
   * @param onComplete Callback when action completes
   */
  execute(
    summon: SummonUnit,
    scene: Phaser.Scene,
    onComplete: (success: boolean) => void
  ): void;

  /**
   * Cancel the action if it's currently in progress
   * This allows proper cleanup when switching between actions
   */
  cancel?(): void;
}
