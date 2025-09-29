/**
 * EffectRegistry.ts - Registry mapping effect keywords/ids to resolver logic
 * 
 * Enables adding new cards without engine changes by mapping effect IDs to implementations.
 * Based on GDD: Effect System and extensibility requirements.
 */

import { GameStateManager } from './GameState';
import { EventBus } from './EventBus';
import { PlayerId, CardId } from '../types/base';

// Effect context passed to effect resolvers
export interface EffectContext {
  gameState: GameStateManager;
  eventBus: EventBus;
  sourceCardId: CardId;
  ownerId: PlayerId;
  targets: any[];
  parameters: Record<string, any>;
}

// Effect resolver function signature
export type EffectResolver = (context: EffectContext) => GameStateManager;

// Effect definition for registry
export interface EffectDefinition {
  id: string;
  name: string;
  description: string;
  resolver: EffectResolver;
  targetType?: 'none' | 'summon' | 'player' | 'coordinate' | 'card';
  requiresTargets?: boolean;
}

export class EffectRegistry {
  private effects: Map<string, EffectDefinition> = new Map();

  /**
   * Register an effect implementation
   * @param definition - Effect definition with resolver
   */
  register(definition: EffectDefinition): void {
    if (this.effects.has(definition.id)) {
      throw new Error(`Effect ${definition.id} is already registered`);
    }
    this.effects.set(definition.id, definition);
  }

  /**
   * Get effect definition by ID
   * @param effectId - ID of the effect to retrieve
   * @returns Effect definition or undefined if not found
   */
  getEffect(effectId: string): EffectDefinition | undefined {
    return this.effects.get(effectId);
  }

  /**
   * Execute an effect
   * @param effectId - ID of effect to execute
   * @param context - Execution context
   * @returns Updated game state
   */
  executeEffect(effectId: string, context: EffectContext): GameStateManager {
    const effect = this.effects.get(effectId);
    if (!effect) {
      throw new Error(`Effect ${effectId} not found in registry`);
    }

    try {
      return effect.resolver(context);
    } catch (error) {
      console.error(`Error executing effect ${effectId}:`, error);
      throw error;
    }
  }

  /**
   * Check if an effect is registered
   * @param effectId - ID to check
   * @returns True if effect is registered
   */
  hasEffect(effectId: string): boolean {
    return this.effects.has(effectId);
  }

  /**
   * Get all registered effect IDs
   * @returns Array of all registered effect IDs
   */
  getAllEffectIds(): string[] {
    return Array.from(this.effects.keys());
  }

  /**
   * Get all registered effects
   * @returns Map of all registered effects
   */
  getAllEffects(): Map<string, EffectDefinition> {
    return new Map(this.effects);
  }

  /**
   * Clear all registered effects (for testing)
   */
  clear(): void {
    this.effects.clear();
  }
}

// Default effect registry with common effects from Alpha Cards
export function createDefaultEffectRegistry(): EffectRegistry {
  const registry = new EffectRegistry();

  // Basic damage effect
  registry.register({
    id: 'deal_damage',
    name: 'Deal Damage',
    description: 'Deal damage to target summon',
    targetType: 'summon',
    requiresTargets: true,
    resolver: (context) => {
      const { gameState, parameters, targets, ownerId } = context;
      const damage = parameters.damage || 0;
      const targetSummonId = targets[0];

      // TODO: Implement damage dealing logic
      // For now, return state unchanged
      return gameState;
    }
  });

  // Heal effect
  registry.register({
    id: 'heal',
    name: 'Heal',
    description: 'Restore HP to target summon',
    targetType: 'summon',
    requiresTargets: true,
    resolver: (context) => {
      const { gameState, parameters, targets } = context;
      const healing = parameters.healing || 0;
      const targetSummonId = targets[0];

      // TODO: Implement healing logic
      return gameState;
    }
  });

  // Stat boost effect
  registry.register({
    id: 'stat_boost',
    name: 'Stat Boost',
    description: 'Temporarily boost summon stats',
    targetType: 'summon',
    requiresTargets: true,
    resolver: (context) => {
      const { gameState, parameters, targets } = context;
      const { statType, amount, duration } = parameters;

      // TODO: Implement stat modification system
      return gameState;
    }
  });

  // Draw cards effect
  registry.register({
    id: 'draw_cards',
    name: 'Draw Cards',
    description: 'Draw cards from deck',
    targetType: 'player',
    requiresTargets: true,
    resolver: (context) => {
      const { gameState, parameters, targets } = context;
      const cardCount = parameters.count || 1;
      const targetPlayer = targets[0];

      // TODO: Implement card drawing logic
      return gameState;
    }
  });

  // Level up effect
  registry.register({
    id: 'level_up',
    name: 'Level Up',
    description: 'Increase summon level',
    targetType: 'summon',
    requiresTargets: true,
    resolver: (context) => {
      const { gameState, parameters, targets } = context;
      const levelIncrease = parameters.levels || 1;
      const targetSummonId = targets[0];

      // TODO: Implement leveling logic
      return gameState;
    }
  });

  // Weapon enhancement effect - from "Sharpened Blade" card
  registry.register({
    id: 'weapon_enhancement',
    name: 'Weapon Enhancement',
    description: 'Enhance equipped weapon power',
    targetType: 'summon',
    requiresTargets: true,
    resolver: (context) => {
      const { gameState, parameters, targets } = context;
      const powerBoost = parameters.power || 0;
      const duration = parameters.duration || 'permanent';
      const targetSummonId = targets[0];

      // TODO: Implement weapon enhancement logic
      return gameState;
    }
  });

  // Movement speed modification - from "Rush" card
  registry.register({
    id: 'movement_boost',
    name: 'Movement Boost',
    description: 'Increase summon movement speed',
    targetType: 'summon', 
    requiresTargets: true,
    resolver: (context) => {
      const { gameState, parameters, targets } = context;
      const multiplier = parameters.multiplier || 2;
      const duration = parameters.duration || 'end_of_turn';

      // TODO: Implement movement modification
      return gameState;
    }
  });

  // Defense reduction - also from "Rush" card
  registry.register({
    id: 'defense_reduction',
    name: 'Defense Reduction', 
    description: 'Reduce summon defense',
    targetType: 'summon',
    requiresTargets: true,
    resolver: (context) => {
      const { gameState, parameters, targets } = context;
      const reduction = parameters.reduction || 0.5;
      const duration = parameters.duration || 'end_of_opponent_turn';

      // TODO: Implement defense modification
      return gameState;
    }
  });

  return registry;
}