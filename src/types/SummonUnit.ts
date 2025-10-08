import { CardData } from '../Card';
import { GridPosition } from './GameTypes';

/**
 * Represents a summon unit placed on the board with its state.
 * This follows the Single Responsibility Principle - it only manages
 * the state and basic properties of a summon unit.
 */
export class SummonUnit {
  public readonly cardData: CardData;
  public position: GridPosition;
  public readonly playerId: number;
  public token: Phaser.GameObjects.Arc;
  private hasAttacked: boolean = false;
  private movementUsed: number = 0;
  
  // Basic stats (simplified for now - can be expanded based on game design)
  public readonly maxMovement: number = 4; // Default movement value
  
  constructor(
    cardData: CardData,
    position: GridPosition,
    playerId: number,
    token: Phaser.GameObjects.Arc
  ) {
    this.cardData = cardData;
    this.position = position;
    this.playerId = playerId;
    this.token = token;
  }

  /**
   * Check if this summon can move
   */
  public canMove(): boolean {
    return this.movementUsed < this.maxMovement;
  }

  /**
   * Get remaining movement
   */
  public getRemainingMovement(): number {
    return this.maxMovement - this.movementUsed;
  }

  /**
   * Use movement points
   */
  public useMovement(amount: number): void {
    this.movementUsed = Math.min(this.movementUsed + amount, this.maxMovement);
  }

  /**
   * Check if this summon can attack
   */
  public canAttack(): boolean {
    return !this.hasAttacked;
  }

  /**
   * Mark this summon as having attacked
   */
  public markAttacked(): void {
    this.hasAttacked = true;
  }

  /**
   * Reset turn-based state (called at start of turn)
   */
  public resetForNewTurn(): void {
    this.hasAttacked = false;
    this.movementUsed = 0;
  }

  /**
   * Update the position of this summon
   */
  public updatePosition(newPosition: GridPosition): void {
    this.position = newPosition;
  }
}
