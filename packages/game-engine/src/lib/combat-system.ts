import {
  SummonStats,
  Position,
  Damage,
  Attribute,
  CombatTarget,
} from '@summoners-grid/shared-types';

/**
 * Combat action types for resolution
 */
export enum CombatActionType {
  BASIC_ATTACK = 'BASIC_ATTACK',
  MAGICAL_ATTACK = 'MAGICAL_ATTACK',
  BOW_ATTACK = 'BOW_ATTACK',
  HEAL = 'HEAL',
}

/**
 * Weapon data for combat calculations
 */
export interface WeaponData {
  power: number;
  type: 'melee' | 'bow' | 'magic';
  range: number;
  attribute: Attribute;
}

/**
 * Combat action parameters
 */
export interface CombatAction {
  type: CombatActionType;
  attackerId: string;
  targetId: string;
  weapon?: WeaponData;
  basePower?: number; // For spells/abilities
  baseAccuracy?: number; // For spells/abilities  
}

/**
 * Result of hit chance calculation
 */
export interface HitResult {
  toHit: number; // Percentage chance
  rolled: number; // Random roll (0-99)
  hit: boolean;
}

/**
 * Result of critical hit calculation
 */
export interface CriticalResult {
  critChance: number; // Percentage chance
  rolled: number; // Random roll (0-99) 
  critical: boolean;
}

/**
 * Complete combat resolution result
 */
export interface CombatResult {
  success: boolean;
  hitResult: HitResult;
  criticalResult: CriticalResult;
  damage: Damage;
  attackerStats: SummonStats;
  targetStats: SummonStats;
  finalTargetHp: number;
  defeated: boolean;
  log: string[];
}

/**
 * Combat System - Handles all combat interactions between summons
 * 
 * Implements the exact damage calculation formulas from the Game Design Document:
 * - Basic Physical Attack: STR × (1 + WeaponPower/100) × (STR/TargetDEF) × IF_CRIT
 * - Basic Magical Attack: INT × (1 + BasePower/100) × (INT/TargetMDF) × IF_CRIT
 * - Bow Attack: ((STR + ACC)/2) × (1 + WeaponPower/100) × (STR/TargetDEF) × CritMultiplier
 * - Healing: SPI × (1 + BasePower/100) × IF_CRIT
 * - Hit Calculation: Base Accuracy + (Attacker ACC / 10)
 * - Critical Hit: Floor((Attacker LCK × 0.3375) + 1.65)
 */
export class CombatSystem {
  private randomSeed?: string;
  private randomCounter = 0;

  constructor(randomSeed?: string) {
    this.randomSeed = randomSeed;
  }

  /**
   * Generate a random number between 0-99 (inclusive)
   * Uses seed for deterministic gameplay if provided
   */
  private roll(): number {
    if (this.randomSeed) {
      // Simple seeded random for deterministic gameplay
      this.randomCounter++;
      const seed = this.randomSeed + this.randomCounter;
      let hash = 0;
      for (let i = 0; i < seed.length; i++) {
        const char = seed.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32-bit integer
      }
      return Math.abs(hash) % 100;
    }
    
    // Use standard random for non-deterministic gameplay
    return Math.floor(Math.random() * 100);
  }

  /**
   * Calculate hit chance according to GDD formula
   * Formula: Base Accuracy + (Attacker ACC / 10)
   */
  private calculateHitChance(
    attacker: SummonStats,
    baseAccuracy: number = 90
  ): HitResult {
    const toHit = baseAccuracy + (attacker.acc / 10);
    const rolled = this.roll();
    const hit = rolled < toHit;

    return {
      toHit: Math.round(toHit * 10) / 10, // Round to 1 decimal place
      rolled,
      hit
    };
  }

  /**
   * Calculate critical hit chance according to GDD formula
   * Formula: Floor((Attacker LCK × 0.3375) + 1.65)
   */
  private calculateCriticalHit(attacker: SummonStats): CriticalResult {
    const critChance = Math.floor((attacker.lck * 0.3375) + 1.65);
    const rolled = this.roll();
    const critical = rolled < critChance;

    return {
      critChance,
      rolled,
      critical
    };
  }

  /**
   * Calculate basic physical attack damage
   * Formula: STR × (1 + WeaponPower/100) × (STR/TargetDEF) × IF_CRIT
   */
  private calculatePhysicalDamage(
    attacker: SummonStats,
    target: SummonStats,
    weaponPower: number,
    isCritical: boolean
  ): number {
    const critMultiplier = isCritical ? 1.5 : 1.0;
    const damage = attacker.str * 
                   (1 + weaponPower / 100) * 
                   (attacker.str / target.def) * 
                   critMultiplier;
    
    return Math.floor(damage);
  }

  /**
   * Calculate bow attack damage
   * Formula: ((STR + ACC)/2) × (1 + WeaponPower/100) × (STR/TargetDEF) × CritMultiplier
   */
  private calculateBowDamage(
    attacker: SummonStats,
    target: SummonStats,
    weaponPower: number,
    isCritical: boolean
  ): number {
    const critMultiplier = isCritical ? 1.5 : 1.0;
    const averageStrAcc = (attacker.str + attacker.acc) / 2;
    const damage = averageStrAcc * 
                   (1 + weaponPower / 100) * 
                   (attacker.str / target.def) * 
                   critMultiplier;
    
    return Math.floor(damage);
  }

  /**
   * Calculate magical attack damage
   * Formula: INT × (1 + BasePower/100) × (INT/TargetMDF) × IF_CRIT
   */
  private calculateMagicalDamage(
    attacker: SummonStats,
    target: SummonStats,
    basePower: number,
    isCritical: boolean
  ): number {
    const critMultiplier = isCritical ? 1.5 : 1.0;
    const damage = attacker.int * 
                   (1 + basePower / 100) * 
                   (attacker.int / target.mdf) * 
                   critMultiplier;
    
    return Math.floor(damage);
  }

  /**
   * Calculate healing amount
   * Formula: SPI × (1 + BasePower/100) × IF_CRIT
   */
  private calculateHealing(
    caster: SummonStats,
    basePower: number,
    isCritical: boolean
  ): number {
    const critMultiplier = isCritical ? 1.5 : 1.0;
    const healing = caster.spi * 
                    (1 + basePower / 100) * 
                    critMultiplier;
    
    return Math.floor(healing);
  }

  /**
   * Validate if an attack is within range
   */
  private validateRange(
    attackerPosition: Position,
    targetPosition: Position,
    range: number
  ): boolean {
    const distance = Math.max(
      Math.abs(attackerPosition.x - targetPosition.x),
      Math.abs(attackerPosition.y - targetPosition.y)
    );
    return distance <= range;
  }

  /**
   * Resolve a complete combat action according to the 5-step process from GDD:
   * 1. Target Selection: Choose valid target within weapon range
   * 2. Hit Calculation: Roll against calculated to-hit percentage
   * 3. Critical Check: Separate roll for critical hit occurrence
   * 4. Damage Calculation: Apply appropriate damage formula
   * 5. Effect Application: Resolve damage and any additional effects
   */
  public resolveCombat(
    action: CombatAction,
    attacker: SummonStats,
    target: SummonStats,
    attackerPosition?: Position,
    targetPosition?: Position
  ): CombatResult {
    const log: string[] = [];
    
    // Step 1: Target Selection (range validation if positions provided)
    if (attackerPosition && targetPosition && action.weapon) {
      if (!this.validateRange(attackerPosition, targetPosition, action.weapon.range)) {
        return {
          success: false,
          hitResult: { toHit: 0, rolled: 0, hit: false },
          criticalResult: { critChance: 0, rolled: 0, critical: false },
          damage: { amount: 0, attribute: Attribute.NEUTRAL, source: action.attackerId },
          attackerStats: attacker,
          targetStats: target,
          finalTargetHp: target.currentHp,
          defeated: false,
          log: ['Attack failed: Target out of range']
        };
      }
      log.push(`Target in range (${action.weapon.range})`);
    }

    // Step 2: Hit Calculation
    const baseAccuracy = action.baseAccuracy ?? 90;
    const hitResult = this.calculateHitChance(attacker, baseAccuracy);
    log.push(`Hit chance: ${hitResult.toHit}%, rolled: ${hitResult.rolled} - ${hitResult.hit ? 'HIT' : 'MISS'}`);

    if (!hitResult.hit) {
      return {
        success: false,
        hitResult,
        criticalResult: { critChance: 0, rolled: 0, critical: false },
        damage: { amount: 0, attribute: Attribute.NEUTRAL, source: action.attackerId },
        attackerStats: attacker,
        targetStats: target,
        finalTargetHp: target.currentHp,
        defeated: false,
        log
      };
    }

    // Step 3: Critical Check
    const criticalResult = this.calculateCriticalHit(attacker);
    log.push(`Critical chance: ${criticalResult.critChance}%, rolled: ${criticalResult.rolled} - ${criticalResult.critical ? 'CRITICAL' : 'NORMAL'}`);

    // Step 4: Damage Calculation
    let damageAmount = 0;
    let attribute = Attribute.NEUTRAL;

    switch (action.type) {
      case CombatActionType.BASIC_ATTACK:
        damageAmount = this.calculatePhysicalDamage(
          attacker,
          target,
          action.weapon?.power ?? 0,
          criticalResult.critical
        );
        attribute = action.weapon?.attribute ?? Attribute.NEUTRAL;
        log.push(`Physical damage: ${damageAmount} (weapon power: ${action.weapon?.power ?? 0})`);
        break;

      case CombatActionType.BOW_ATTACK:
        damageAmount = this.calculateBowDamage(
          attacker,
          target,
          action.weapon?.power ?? 0,
          criticalResult.critical
        );
        attribute = action.weapon?.attribute ?? Attribute.NEUTRAL;
        log.push(`Bow damage: ${damageAmount} (weapon power: ${action.weapon?.power ?? 0})`);
        break;

      case CombatActionType.MAGICAL_ATTACK:
        damageAmount = this.calculateMagicalDamage(
          attacker,
          target,
          action.basePower ?? 0,
          criticalResult.critical
        );
        attribute = action.weapon?.attribute ?? Attribute.FIRE; // Default magical attribute
        log.push(`Magical damage: ${damageAmount} (base power: ${action.basePower ?? 0})`);
        break;

      case CombatActionType.HEAL:
        damageAmount = -this.calculateHealing(
          attacker,
          action.basePower ?? 0,
          criticalResult.critical
        );
        attribute = Attribute.LIGHT; // Healing is typically light attribute
        log.push(`Healing: ${Math.abs(damageAmount)} (base power: ${action.basePower ?? 0})`);
        break;
    }

    const damage: Damage = {
      amount: damageAmount,
      attribute,
      source: action.attackerId
    };

    // Step 5: Effect Application
    const newCurrentHp = Math.max(0, Math.min(target.maxHp, target.currentHp - damageAmount));
    const defeated = newCurrentHp <= 0;

    if (defeated) {
      log.push(`Target defeated! (HP: ${target.currentHp} -> 0)`);
    } else {
      log.push(`Target HP: ${target.currentHp} -> ${newCurrentHp}`);
    }

    return {
      success: true,
      hitResult,
      criticalResult,
      damage,
      attackerStats: attacker,
      targetStats: target,
      finalTargetHp: newCurrentHp,
      defeated,
      log
    };
  }

  /**
   * Apply damage to a summon's current HP
   */
  public applyDamage(target: SummonStats, damage: Damage): SummonStats {
    const newHp = Math.max(0, Math.min(target.maxHp, target.currentHp - damage.amount));
    
    return {
      ...target,
      currentHp: newHp
    };
  }

  /**
   * Check if a summon is defeated (HP <= 0)
   */
  public isDefeated(summon: SummonStats): boolean {
    return summon.currentHp <= 0;
  }

  /**
   * Get the appropriate damage type for a weapon
   */
  public getDamageTypeForWeapon(weapon: WeaponData): CombatActionType {
    switch (weapon.type) {
      case 'bow':
        return CombatActionType.BOW_ATTACK;
      case 'magic':
        return CombatActionType.MAGICAL_ATTACK;
      case 'melee':
      default:
        return CombatActionType.BASIC_ATTACK;
    }
  }
}