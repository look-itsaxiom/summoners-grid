import { CardData } from '../Card';
import { GridPosition } from './GameTypes';
import { CalculatedStats } from './Stats';
import { StatCalculator } from '../utils/StatCalculator';

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
  
  // Level and stats
  private level: number = 5; // Starting level is always 5
  private stats: CalculatedStats;
  
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
    
    // Calculate initial stats at level 5
    if (cardData.summonData) {
      this.stats = StatCalculator.calculateAllStats(
        cardData.summonData.baseStats,
        cardData.summonData.growthRates,
        this.level
      );
    } else {
      // Fallback for cards without summon data (shouldn't happen for summons)
      throw new Error('Summon card must have summonData');
    }
  }

  /**
   * Get current level
   */
  public getLevel(): number {
    return this.level;
  }

  /**
   * Get calculated stats
   */
  public getStats(): CalculatedStats {
    return { ...this.stats }; // Return copy to prevent external modification
  }

  /**
   * Level up the summon and recalculate stats
   * Preserves damage taken (HP damage retention)
   */
  public levelUp(): void {
    if (this.level >= 20) {
      console.log(`[SummonUnit] ${this.cardData.name} is already at max level (20)`);
      return;
    }

    if (!this.cardData.summonData) {
      throw new Error('Cannot level up summon without summonData');
    }

    const oldMaxHP = this.stats.maxHP;
    const oldCurrentHP = this.stats.currentHP;
    
    this.level++;
    
    // Recalculate stats while preserving damage
    this.stats = StatCalculator.recalculateStatsPreservingDamage(
      this.cardData.summonData.baseStats,
      this.cardData.summonData.growthRates,
      this.level,
      oldMaxHP,
      oldCurrentHP
    );

    console.log(`[SummonUnit] ${this.cardData.name} leveled up to ${this.level}. HP: ${this.stats.currentHP}/${this.stats.maxHP}`);
  }

  /**
   * Take damage
   */
  public takeDamage(amount: number): void {
    this.stats.currentHP = Math.max(0, this.stats.currentHP - amount);
    console.log(`[SummonUnit] ${this.cardData.name} took ${amount} damage. HP: ${this.stats.currentHP}/${this.stats.maxHP}`);
  }

  /**
   * Heal HP
   */
  public heal(amount: number): void {
    this.stats.currentHP = Math.min(this.stats.maxHP, this.stats.currentHP + amount);
    console.log(`[SummonUnit] ${this.cardData.name} healed ${amount}. HP: ${this.stats.currentHP}/${this.stats.maxHP}`);
  }

  /**
   * Check if this summon can move
   */
  public canMove(): boolean {
    return this.movementUsed < this.stats.movement;
  }

  /**
   * Get remaining movement
   */
  public getRemainingMovement(): number {
    return this.stats.movement - this.movementUsed;
  }

  /**
   * Use movement points
   */
  public useMovement(amount: number): void {
    this.movementUsed = Math.min(this.movementUsed + amount, this.stats.movement);
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
