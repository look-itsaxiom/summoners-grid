import {
  GameState,
  CombatTarget,
} from '@summoners-grid/shared-types';
import { StackEffect, EffectResolutionResult } from './stack-system.js';

/**
 * Effect resolution handler function type
 */
export type EffectHandler = (
  stackEffect: StackEffect,
  gameState: GameState,
  target?: CombatTarget,
  parameters?: Record<string, any>
) => EffectResolutionResult;

/**
 * Central effect resolver that dispatches to specific effect handlers
 * Implements the universal rule override system from GDD
 */
export class EffectResolver {
  private handlers: Map<string, EffectHandler> = new Map();

  constructor() {
    this.registerBuiltinHandlers();
  }

  /**
   * Register a custom effect handler
   */
  public registerHandler(resolver: string, handler: EffectHandler): void {
    this.handlers.set(resolver, handler);
  }

  /**
   * Resolve an effect by dispatching to appropriate handler
   */
  public resolveEffect(stackEffect: StackEffect, gameState: GameState): EffectResolutionResult {
    const resolver = stackEffect.effect.resolver;
    const handler = this.handlers.get(resolver);

    if (!handler) {
      return {
        success: false,
        gameState,
        triggeredEffects: [],
        error: `No handler found for resolver: ${resolver}`
      };
    }

    try {
      // Validate effect requirements before resolution
      const requirementCheck = this.validateEffectRequirements(stackEffect, gameState);
      if (!requirementCheck.valid) {
        return {
          success: false,
          gameState,
          triggeredEffects: [],
          error: `Requirements not met: ${requirementCheck.errors.join(', ')}`
        };
      }

      // Validate target if specified
      const targetCheck = this.validateEffectTarget(stackEffect, gameState);
      if (!targetCheck.valid) {
        return {
          success: false,
          gameState,
          triggeredEffects: [],
          error: `Invalid target: ${targetCheck.errors.join(', ')}`
        };
      }

      // Execute the effect handler
      return handler(stackEffect, gameState, stackEffect.target, stackEffect.parameters);
    } catch (error) {
      return {
        success: false,
        gameState,
        triggeredEffects: [],
        error: `Effect resolution error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Validate effect requirements (role requirements, board state, etc.)
   */
  private validateEffectRequirements(
    stackEffect: StackEffect,
    gameState: GameState
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const requirements = stackEffect.effect.requirements;

    if (!requirements) {
      return { valid: true, errors: [] };
    }

    // Validate role family requirements
    if (requirements.controlMagicianFamily) {
      if (!this.playerControlsRoleFamily(stackEffect.controller, 'MAGICIAN', gameState)) {
        errors.push('Requires control of a magician-family role');
      }
    }

    if (requirements.controlWarriorFamily) {
      if (!this.playerControlsRoleFamily(stackEffect.controller, 'WARRIOR', gameState)) {
        errors.push('Requires control of a warrior-family role');
      }
    }

    if (requirements.controlScoutFamily) {
      if (!this.playerControlsRoleFamily(stackEffect.controller, 'SCOUT', gameState)) {
        errors.push('Requires control of a scout-family role');
      }
    }

    // Additional requirement validations can be added here

    return { valid: errors.length === 0, errors };
  }

  /**
   * Validate effect target selection
   */
  private validateEffectTarget(
    stackEffect: StackEffect,
    gameState: GameState
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const target = stackEffect.target;

    if (!target) {
      // Some effects don't require targets
      return { valid: true, errors: [] };
    }

    // Validate target type and restrictions based on effect parameters
    const effectParams = stackEffect.effect.parameters;
    
    if (effectParams.targetType) {
      switch (effectParams.targetType) {
        case 'opponent_summon':
          if (target.type !== 'summon' || target.playerId === stackEffect.controller) {
            errors.push('Target must be an opponent summon');
          }
          break;
        case 'your_summon':
          if (target.type !== 'summon' || target.playerId !== stackEffect.controller) {
            errors.push('Target must be your own summon');
          }
          break;
        case 'any_summon':
          if (target.type !== 'summon') {
            errors.push('Target must be a summon');
          }
          break;
        case 'enemy_summon':
          if (target.type !== 'summon' || target.playerId === stackEffect.controller) {
            errors.push('Target must be an enemy summon');
          }
          break;
      }
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Check if player controls a summon of specific role family
   */
  private playerControlsRoleFamily(
    playerId: 'A' | 'B',
    family: 'WARRIOR' | 'MAGICIAN' | 'SCOUT',
    gameState: GameState
  ): boolean {
    // This would check the actual game state for summons with matching roles
    // For now, return true as placeholder - would need to check summon roles
    // TODO: Implement actual role family checking based on game state
    return true;
  }

  /**
   * Register built-in effect handlers for Alpha Card effects
   */
  private registerBuiltinHandlers(): void {
    // Action Card Effects
    this.registerHandler('dealFireDamage', this.handleDealFireDamage.bind(this));
    this.registerHandler('weaponBonus', this.handleWeaponBonus.bind(this));
    this.registerHandler('heal', this.handleHeal.bind(this));
    this.registerHandler('grantActions', this.handleGrantActions.bind(this));
    this.registerHandler('immobilize', this.handleImmobilize.bind(this));
    this.registerHandler('drainLife', this.handleDrainLife.bind(this));
    this.registerHandler('searchDeck', this.handleSearchDeck.bind(this));
    this.registerHandler('spellRecall', this.handleSpellRecall.bind(this));
    this.registerHandler('dualShot', this.handleDualShot.bind(this));
    this.registerHandler('lifeAlchemy', this.handleLifeAlchemy.bind(this));

    // Counter Card Effects
    this.registerHandler('dramaticReturn', this.handleDramaticReturn.bind(this));
    this.registerHandler('graverobbing', this.handleGraverobbing.bind(this));
    this.registerHandler('nightmarePain', this.handleNightmarePain.bind(this));

    // Building Card Effects
    this.registerHandler('buildingEffect', this.handleBuildingEffect.bind(this));

    // Equipment Effects
    this.registerHandler('equipmentBonus', this.handleEquipmentBonus.bind(this));

    // Role Effects
    this.registerHandler('roleAbility', this.handleRoleAbility.bind(this));
  }

  // =====================================================================
  // ACTION CARD EFFECT HANDLERS
  // =====================================================================

  /**
   * Handle "Deal Fire Damage" effect (Blast Bolt #001)
   */
  private handleDealFireDamage(
    stackEffect: StackEffect,
    gameState: GameState,
    target?: CombatTarget
  ): EffectResolutionResult {
    if (!target || target.type !== 'summon') {
      return {
        success: false,
        gameState,
        triggeredEffects: [],
        error: 'Fire damage requires a summon target'
      };
    }

    // Create a copy of game state for modification
    const newGameState = { ...gameState };
    
    // TODO: Implement actual damage calculation and application
    // This would involve:
    // 1. Calculate damage based on caster's stats and target's resistances
    // 2. Apply fire attribute modifier
    // 3. Reduce target's HP
    // 4. Check for defeat and trigger defeat effects if HP <= 0

    const resolutionDetails = {
      description: `${stackEffect.effect.name} dealt fire damage to ${target.id || 'target'}`,
      affectedEntities: [target?.id || 'unknown'],
      stateChanges: ['hp_reduced']
    };

    return {
      success: true,
      gameState: newGameState,
      triggeredEffects: [],
      resolutionDetails
    };
  }

  /**
   * Handle "Weapon Bonus" effect (Sharpened Blade #005)
   */
  private handleWeaponBonus(
    stackEffect: StackEffect,
    gameState: GameState,
    target?: CombatTarget
  ): EffectResolutionResult {
    if (!target || target.type !== 'summon') {
      return {
        success: false,
        gameState,
        triggeredEffects: [],
        error: 'Weapon bonus requires a summon target'
      };
    }

    const newGameState = { ...gameState };
    
    // TODO: Implement weapon bonus application
    // This would involve:
    // 1. Find the target summon in game state
    // 2. Add +5 power bonus to weapon until end of turn
    // 3. Set up duration tracking for "end of turn" cleanup

    const resolutionDetails = {
      description: `${stackEffect.effect.name} granted +5 weapon power to ${target.id}`,
      affectedEntities: [target.id],
      stateChanges: ['weapon_power_increased']
    };

    return {
      success: true,
      gameState: newGameState,
      triggeredEffects: [],
      resolutionDetails
    };
  }

  /**
   * Handle "Heal" effect (Healing Hands #006)
   */
  private handleHeal(
    stackEffect: StackEffect,
    gameState: GameState,
    target?: CombatTarget
  ): EffectResolutionResult {
    if (!target || target.type !== 'summon') {
      return {
        success: false,
        gameState,
        triggeredEffects: [],
        error: 'Heal requires a summon target'
      };
    }

    const newGameState = { ...gameState };
    
    // TODO: Implement healing
    // This would involve:
    // 1. Calculate heal amount based on caster's stats
    // 2. Apply light attribute modifier
    // 3. Increase target's HP (capped at max HP)

    const resolutionDetails = {
      description: `${stackEffect.effect.name} healed ${target.id}`,
      affectedEntities: [target.id],
      stateChanges: ['hp_increased']
    };

    return {
      success: true,
      gameState: newGameState,
      triggeredEffects: [],
      resolutionDetails
    };
  }

  /**
   * Handle "Grant Actions" effect (Rush #009)
   */
  private handleGrantActions(
    stackEffect: StackEffect,
    gameState: GameState,
    target?: CombatTarget
  ): EffectResolutionResult {
    if (!target || target.type !== 'summon') {
      return {
        success: false,
        gameState,
        triggeredEffects: [],
        error: 'Grant actions requires a summon target'
      };
    }

    const newGameState = { ...gameState };
    
    // TODO: Implement action granting
    // This would involve:
    // 1. Find the target summon
    // 2. Grant extra movement and attack this turn
    // 3. Track these bonuses for turn cleanup

    const resolutionDetails = {
      description: `${stackEffect.effect.name} granted extra movement and attack to ${target.id}`,
      affectedEntities: [target.id],
      stateChanges: ['actions_granted']
    };

    return {
      success: true,
      gameState: newGameState,
      triggeredEffects: [],
      resolutionDetails
    };
  }

  /**
   * Handle "Immobilize" effect (Ensnare #011)
   */
  private handleImmobilize(
    stackEffect: StackEffect,
    gameState: GameState,
    target?: CombatTarget
  ): EffectResolutionResult {
    if (!target || target.type !== 'summon') {
      return {
        success: false,
        gameState,
        triggeredEffects: [],
        error: 'Immobilize requires a summon target'
      };
    }

    const newGameState = { ...gameState };
    
    // TODO: Implement immobilization
    // This would involve:
    // 1. Find the target summon
    // 2. Apply immobilize status until next turn
    // 3. Prevent movement and attacks

    const resolutionDetails = {
      description: `${stackEffect.effect.name} immobilized ${target.id}`,
      affectedEntities: [target.id],
      stateChanges: ['immobilized']
    };

    return {
      success: true,
      gameState: newGameState,
      triggeredEffects: [],
      resolutionDetails
    };
  }

  /**
   * Handle "Drain Life" effect (Drain Touch #012)
   */
  private handleDrainLife(
    stackEffect: StackEffect,
    gameState: GameState,
    target?: CombatTarget
  ): EffectResolutionResult {
    if (!target || target.type !== 'summon') {
      return {
        success: false,
        gameState,
        triggeredEffects: [],
        error: 'Drain life requires a summon target'
      };
    }

    const newGameState = { ...gameState };
    
    // TODO: Implement life drain
    // This would involve:
    // 1. Deal dark damage to target
    // 2. Heal caster for same amount
    // 3. Apply dark attribute modifiers

    const resolutionDetails = {
      description: `${stackEffect.effect.name} drained life from ${target.id}`,
      affectedEntities: [target.id, stackEffect.source],
      stateChanges: ['hp_drained', 'hp_healed']
    };

    return {
      success: true,
      gameState: newGameState,
      triggeredEffects: [],
      resolutionDetails
    };
  }

  /**
   * Handle "Search Deck" effect (Adventurous Spirit #013)
   */
  private handleSearchDeck(
    stackEffect: StackEffect,
    gameState: GameState
  ): EffectResolutionResult {
    const newGameState = { ...gameState };
    
    // TODO: Implement deck searching
    // This would involve:
    // 1. Search player's deck for quest cards
    // 2. Let player choose one to add to hand
    // 3. Shuffle deck afterwards

    const resolutionDetails = {
      description: `${stackEffect.effect.name} searched deck for quest cards`,
      affectedEntities: [stackEffect.controller],
      stateChanges: ['deck_searched', 'card_drawn']
    };

    return {
      success: true,
      gameState: newGameState,
      triggeredEffects: [],
      resolutionDetails
    };
  }

  /**
   * Handle "Spell Recall" effect (Spell Recall #015)
   */
  private handleSpellRecall(
    stackEffect: StackEffect,
    gameState: GameState,
    target?: CombatTarget
  ): EffectResolutionResult {
    const newGameState = { ...gameState };
    
    // TODO: Implement spell recall
    // This would involve:
    // 1. Show player's discard pile action cards
    // 2. Let player choose one to return to hand
    // 3. Move card from discard to hand

    const resolutionDetails = {
      description: `${stackEffect.effect.name} recalled an action card from discard`,
      affectedEntities: [stackEffect.controller],
      stateChanges: ['card_recalled']
    };

    return {
      success: true,
      gameState: newGameState,
      triggeredEffects: [],
      resolutionDetails
    };
  }

  /**
   * Handle "Dual Shot" effect (Dual Shot #016)
   */
  private handleDualShot(
    stackEffect: StackEffect,
    gameState: GameState,
    target?: CombatTarget
  ): EffectResolutionResult {
    const newGameState = { ...gameState };
    
    // TODO: Implement dual shot enhancement
    // This would involve:
    // 1. Enhance bow attacks to hit adjacent targets
    // 2. Set up duration tracking

    const resolutionDetails = {
      description: `${stackEffect.effect.name} enhanced bow attacks`,
      affectedEntities: [stackEffect.source],
      stateChanges: ['dual_shot_active']
    };

    return {
      success: true,
      gameState: newGameState,
      triggeredEffects: [],
      resolutionDetails
    };
  }

  /**
   * Handle "Life Alchemy" effect (Life Alchemy #017)
   */
  private handleLifeAlchemy(
    stackEffect: StackEffect,
    gameState: GameState,
    target?: CombatTarget
  ): EffectResolutionResult {
    if (!target || target.type !== 'summon') {
      return {
        success: false,
        gameState,
        triggeredEffects: [],
        error: 'Life alchemy requires a summon target to sacrifice'
      };
    }

    const newGameState = { ...gameState };
    
    // TODO: Implement life alchemy
    // This would involve:
    // 1. Sacrifice target summon
    // 2. Heal another summon for the sacrificed HP amount

    const resolutionDetails = {
      description: `${stackEffect.effect.name} converted life force`,
      affectedEntities: [target.id],
      stateChanges: ['summon_sacrificed', 'hp_healed']
    };

    return {
      success: true,
      gameState: newGameState,
      triggeredEffects: [],
      resolutionDetails
    };
  }

  // =====================================================================
  // COUNTER CARD EFFECT HANDLERS
  // =====================================================================

  /**
   * Handle "Dramatic Return" effect (Dramatic Return! #003)
   */
  private handleDramaticReturn(
    stackEffect: StackEffect,
    gameState: GameState
  ): EffectResolutionResult {
    const newGameState = { ...gameState };
    
    // TODO: Implement dramatic return
    // This would involve:
    // 1. Return defeated summon to play with 10% HP
    // 2. Preserve level, role, and equipment
    // 3. Clear ongoing effects

    const resolutionDetails = {
      description: `${stackEffect.effect.name} returned a defeated summon to play`,
      affectedEntities: [stackEffect.controller],
      stateChanges: ['summon_resurrected']
    };

    return {
      success: true,
      gameState: newGameState,
      triggeredEffects: [],
      resolutionDetails
    };
  }

  /**
   * Handle "Graverobbing" effect (Graverobbing #041)
   */
  private handleGraverobbing(
    stackEffect: StackEffect,
    gameState: GameState,
    target?: CombatTarget
  ): EffectResolutionResult {
    const newGameState = { ...gameState };
    
    // TODO: Implement graverobbing
    // This would involve:
    // 1. Steal opponent's summon being destroyed/sacrificed
    // 2. Move to your control instead

    const resolutionDetails = {
      description: `${stackEffect.effect.name} stole a summon from opponent`,
      affectedEntities: [target?.id || 'unknown'],
      stateChanges: ['summon_stolen']
    };

    return {
      success: true,
      gameState: newGameState,
      triggeredEffects: [],
      resolutionDetails
    };
  }

  /**
   * Handle "Nightmare Pain" effect (Nightmare Pain #132)
   */
  private handleNightmarePain(
    stackEffect: StackEffect,
    gameState: GameState,
    target?: CombatTarget
  ): EffectResolutionResult {
    const newGameState = { ...gameState };
    
    // TODO: Implement nightmare pain
    // This would involve:
    // 1. Reflect damage taken by warlock to any target
    // 2. Apply as dark magical damage

    const resolutionDetails = {
      description: `${stackEffect.effect.name} reflected damage as dark magic`,
      affectedEntities: [target?.id || 'unknown'],
      stateChanges: ['damage_reflected']
    };

    return {
      success: true,
      gameState: newGameState,
      triggeredEffects: [],
      resolutionDetails
    };
  }

  // =====================================================================
  // PLACEHOLDER HANDLERS FOR OTHER CARD TYPES
  // =====================================================================

  private handleBuildingEffect(
    stackEffect: StackEffect,
    gameState: GameState
  ): EffectResolutionResult {
    // TODO: Implement building effects
    return {
      success: true,
      gameState,
      triggeredEffects: [],
      resolutionDetails: {
        description: 'Building effect processed',
        affectedEntities: [],
        stateChanges: []
      }
    };
  }

  private handleEquipmentBonus(
    stackEffect: StackEffect,
    gameState: GameState
  ): EffectResolutionResult {
    // TODO: Implement equipment bonuses
    return {
      success: true,
      gameState,
      triggeredEffects: [],
      resolutionDetails: {
        description: 'Equipment bonus applied',
        affectedEntities: [],
        stateChanges: []
      }
    };
  }

  private handleRoleAbility(
    stackEffect: StackEffect,
    gameState: GameState
  ): EffectResolutionResult {
    // TODO: Implement role abilities
    return {
      success: true,
      gameState,
      triggeredEffects: [],
      resolutionDetails: {
        description: 'Role ability activated',
        affectedEntities: [],
        stateChanges: []
      }
    };
  }
}