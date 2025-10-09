import { BaseStats, CalculatedStats, StatGrowthRates } from '../types/Stats';

/**
 * Utility class for calculating summon stats according to GDD formulas.
 * All formulas are based on the Summoner's Grid GDD.md specification.
 */
export class StatCalculator {
  /**
   * Calculate final stat value
   * Formula: FinalStat = (BaseStat + Floor(Level × GrowthRate)) × RoleModifier + EquipmentBonus + OtherBonuses
   * 
   * For now, we implement the core calculation without role/equipment modifiers:
   * FinalStat = BaseStat + Floor(Level × GrowthRate)
   */
  public static calculateStat(
    baseStat: number,
    growthRate: number,
    level: number,
    roleModifier: number = 1.0,
    equipmentBonus: number = 0,
    otherBonuses: number = 0
  ): number {
    return Math.floor(
      (baseStat + Math.floor(level * growthRate)) * roleModifier + equipmentBonus + otherBonuses
    );
  }

  /**
   * Calculate all base stats for a given level
   */
  public static calculateStats(
    baseStats: BaseStats,
    growthRates: StatGrowthRates,
    level: number
  ): BaseStats {
    return {
      STR: this.calculateStat(baseStats.STR, growthRates.STR, level),
      END: this.calculateStat(baseStats.END, growthRates.END, level),
      DEF: this.calculateStat(baseStats.DEF, growthRates.DEF, level),
      INT: this.calculateStat(baseStats.INT, growthRates.INT, level),
      SPI: this.calculateStat(baseStats.SPI, growthRates.SPI, level),
      MDF: this.calculateStat(baseStats.MDF, growthRates.MDF, level),
      SPD: this.calculateStat(baseStats.SPD, growthRates.SPD, level),
      ACC: this.calculateStat(baseStats.ACC, growthRates.ACC, level),
      LCK: this.calculateStat(baseStats.LCK, growthRates.LCK, level)
    };
  }

  /**
   * Calculate max HP
   * Formula: 50 + Floor(END^1.5)
   */
  public static calculateMaxHP(endurance: number): number {
    return 50 + Math.floor(Math.pow(endurance, 1.5));
  }

  /**
   * Calculate movement speed
   * Formula: 2 + Floor((SPD - 10) / 5)
   */
  public static calculateMovement(speed: number): number {
    return 2 + Math.floor((speed - 10) / 5);
  }

  /**
   * Calculate basic attack to-hit chance
   * Formula: 90 + (ACC / 10)
   */
  public static calculateBasicToHit(accuracy: number): number {
    return 90 + Math.floor(accuracy / 10);
  }

  /**
   * Calculate critical hit chance
   * Formula: Floor((LCK × 0.3375) + 1.65)
   */
  public static calculateCritChance(luck: number): number {
    return Math.floor((luck * 0.3375) + 1.65);
  }

  /**
   * Calculate all stats including derived properties
   */
  public static calculateAllStats(
    baseStats: BaseStats,
    growthRates: StatGrowthRates,
    level: number,
    currentHP?: number
  ): CalculatedStats {
    // Calculate level-adjusted base stats
    const leveledStats = this.calculateStats(baseStats, growthRates, level);

    // Calculate derived properties
    const maxHP = this.calculateMaxHP(leveledStats.END);
    const movement = this.calculateMovement(leveledStats.SPD);
    const basicToHit = this.calculateBasicToHit(leveledStats.ACC);
    const critChance = this.calculateCritChance(leveledStats.LCK);

    return {
      ...leveledStats,
      maxHP,
      currentHP: currentHP !== undefined ? currentHP : maxHP, // Default to full HP
      movement,
      basicToHit,
      critChance
    };
  }

  /**
   * Recalculate stats while preserving damage taken
   * Used when leveling up - damage taken remains the same, max HP increases
   */
  public static recalculateStatsPreservingDamage(
    baseStats: BaseStats,
    growthRates: StatGrowthRates,
    level: number,
    oldMaxHP: number,
    oldCurrentHP: number
  ): CalculatedStats {
    const damageTaken = oldMaxHP - oldCurrentHP;
    const newStats = this.calculateAllStats(baseStats, growthRates, level);
    newStats.currentHP = Math.max(1, newStats.maxHP - damageTaken); // Ensure at least 1 HP
    return newStats;
  }
}
