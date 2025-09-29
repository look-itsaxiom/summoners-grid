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
      const { gameState, parameters, targets, ownerId, eventBus } = context;
      const damage = parameters.damage || 0;
      const targetSummonId = targets[0];

      const state = gameState.getState();
      
      // Find target summon across all players
      let targetSummon = null;
      let targetPlayerId = null;
      
      for (const [playerId, player] of Object.entries(state.players)) {
        const summon = player.summons.find(s => s.id === targetSummonId);
        if (summon) {
          targetSummon = summon;
          targetPlayerId = playerId;
          break;
        }
      }

      if (!targetSummon || !targetPlayerId) {
        return gameState; // Target not found
      }

      // Apply damage
      const newDamage = targetSummon.damage + damage;
      const updatedSummon = { ...targetSummon, damage: newDamage };
      
      // Check if summon is defeated
      const isDefeated = newDamage >= targetSummon.combatStats.maxHp;
      
      let updatedState = gameState;
      
      if (isDefeated) {
        // Remove summon and emit defeat event
        const updatedSummons = state.players[targetPlayerId].summons.filter(s => s.id !== targetSummonId);
        updatedState = updatedState.updatePlayer(targetPlayerId, {
          summons: updatedSummons
        });
        
        eventBus.emit({
          type: 'summonDefeated' as any,
          playerId: targetPlayerId,
          data: {
            summonId: targetSummonId,
            killerId: ownerId,
            damage: damage
          }
        });
      } else {
        // Update summon damage
        const updatedSummons = state.players[targetPlayerId].summons.map(s => 
          s.id === targetSummonId ? updatedSummon : s
        );
        updatedState = updatedState.updatePlayer(targetPlayerId, {
          summons: updatedSummons
        });
        
        eventBus.emit({
          type: 'summonDamaged' as any,
          playerId: targetPlayerId,
          data: {
            summonId: targetSummonId,
            damage: damage,
            totalDamage: newDamage
          }
        });
      }

      return updatedState;
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
      const { gameState, parameters, targets, eventBus } = context;
      const healing = parameters.healing || 0;
      const targetSummonId = targets[0];

      const state = gameState.getState();
      
      // Find target summon across all players
      let targetSummon = null;
      let targetPlayerId = null;
      
      for (const [playerId, player] of Object.entries(state.players)) {
        const summon = player.summons.find(s => s.id === targetSummonId);
        if (summon) {
          targetSummon = summon;
          targetPlayerId = playerId;
          break;
        }
      }

      if (!targetSummon || !targetPlayerId) {
        return gameState; // Target not found
      }

      // Apply healing (cannot exceed max HP)
      const currentDamage = targetSummon.damage;
      const healedDamage = Math.max(0, currentDamage - healing);
      const actualHealing = currentDamage - healedDamage;
      
      if (actualHealing <= 0) {
        return gameState; // No healing needed
      }

      const updatedSummon = { ...targetSummon, damage: healedDamage };
      const updatedSummons = state.players[targetPlayerId].summons.map(s => 
        s.id === targetSummonId ? updatedSummon : s
      );
      
      const updatedState = gameState.updatePlayer(targetPlayerId, {
        summons: updatedSummons
      });
      
      eventBus.emit({
        type: 'summonHealed' as any,
        playerId: targetPlayerId,
        data: {
          summonId: targetSummonId,
          healing: actualHealing,
          newDamage: healedDamage
        }
      });

      return updatedState;
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
      const { gameState, parameters, targets, eventBus } = context;
      const { statType, amount, duration } = parameters;

      const state = gameState.getState();
      
      // Find target summon across all players
      let targetSummon = null;
      let targetPlayerId = null;
      
      for (const [playerId, player] of Object.entries(state.players)) {
        const summon = player.summons.find(s => s.id === targets[0]);
        if (summon) {
          targetSummon = summon;
          targetPlayerId = playerId;
          break;
        }
      }

      if (!targetSummon || !targetPlayerId) {
        return gameState; // Target not found
      }

      // Create status effect for stat modification
      const statusEffect = {
        id: `stat_boost_${Date.now()}`,
        name: `${statType} Boost`,
        sourceCardId: context.sourceCardId,
        duration: duration || 'endOfTurn',
        statModifiers: { [statType]: amount },
        effects: []
      };

      const updatedSummon = {
        ...targetSummon,
        statusEffects: [...targetSummon.statusEffects, statusEffect]
      };

      const updatedSummons = state.players[targetPlayerId].summons.map(s => 
        s.id === targets[0] ? updatedSummon : s
      );
      
      const updatedState = gameState.updatePlayer(targetPlayerId, {
        summons: updatedSummons
      });
      
      eventBus.emit({
        type: 'statusEffectApplied' as any,
        playerId: targetPlayerId,
        data: {
          summonId: targets[0],
          effect: statusEffect
        }
      });

      return updatedState;
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
      const { gameState, parameters, targets, eventBus } = context;
      const cardCount = parameters.count || 1;
      const targetPlayer = targets[0];

      const state = gameState.getState();
      const player = state.players[targetPlayer];
      
      if (!player) {
        return gameState; // Player not found
      }

      let updatedState = gameState;
      let cardsDrawn = 0;

      // Draw cards one by one, handling deck shuffling
      for (let i = 0; i < cardCount; i++) {
        const currentState = updatedState.getState();
        const currentPlayer = currentState.players[targetPlayer];
        
        if (currentPlayer.zones.mainDeck.length > 0) {
          // Draw from main deck
          const drawnCard = currentPlayer.zones.mainDeck[0];
          updatedState = updatedState
            .removeCardFromZone(targetPlayer, drawnCard.id, 'mainDeck')
            .addCardToZone(targetPlayer, drawnCard, 'hand');
          cardsDrawn++;
          
          eventBus.emit({
            type: 'cardDrawn' as any,
            playerId: targetPlayer,
            data: { card: drawnCard }
          });
        } else if (currentPlayer.zones.rechargePile.length > 0) {
          // Shuffle recharge pile into main deck and draw
          const shuffledCards = [...currentPlayer.zones.rechargePile].sort(() => Math.random() - 0.5);
          const drawnCard = shuffledCards[0];
          const remainingCards = shuffledCards.slice(1);
          
          updatedState = updatedState.updatePlayer(targetPlayer, {
            zones: {
              ...currentPlayer.zones,
              mainDeck: remainingCards,
              rechargePile: [],
              hand: [...currentPlayer.zones.hand, drawnCard]
            }
          });
          cardsDrawn++;
          
          eventBus.emit({
            type: 'cardDrawn' as any,
            playerId: targetPlayer,
            data: { card: drawnCard, shuffledRecharge: true }
          });
        } else {
          // No more cards to draw
          break;
        }
      }

      return updatedState;
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
      const { gameState, parameters, targets, eventBus } = context;
      const levelIncrease = parameters.levels || 1;
      const targetSummonId = targets[0];

      const state = gameState.getState();
      
      // Find target summon across all players
      let targetSummon = null;
      let targetPlayerId = null;
      
      for (const [playerId, player] of Object.entries(state.players)) {
        const summon = player.summons.find(s => s.id === targetSummonId);
        if (summon) {
          targetSummon = summon;
          targetPlayerId = playerId;
          break;
        }
      }

      if (!targetSummon || !targetPlayerId) {
        return gameState; // Target not found
      }

      // Apply level increase (max level 20)
      const newLevel = Math.min(20, targetSummon.level + levelIncrease);
      const actualIncrease = newLevel - targetSummon.level;
      
      if (actualIncrease <= 0) {
        return gameState; // Already at max level
      }

      const updatedSummon = { ...targetSummon, level: newLevel };
      const updatedSummons = state.players[targetPlayerId].summons.map(s => 
        s.id === targetSummonId ? updatedSummon : s
      );
      
      const updatedState = gameState.updatePlayer(targetPlayerId, {
        summons: updatedSummons
      });
      
      eventBus.emit({
        type: 'summonLeveled' as any,
        playerId: targetPlayerId,
        data: {
          summonId: targetSummonId,
          fromLevel: targetSummon.level,
          toLevel: newLevel,
          levelIncrease: actualIncrease
        }
      });

      return updatedState;
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
      const { gameState, parameters, targets, eventBus } = context;
      const powerBoost = parameters.power || 0;
      const duration = parameters.duration || 'permanent';
      const targetSummonId = targets[0];

      const state = gameState.getState();
      
      // Find target summon across all players  
      let targetSummon = null;
      let targetPlayerId = null;
      
      for (const [playerId, player] of Object.entries(state.players)) {
        const summon = player.summons.find(s => s.id === targetSummonId);
        if (summon) {
          targetSummon = summon;
          targetPlayerId = playerId;
          break;
        }
      }

      if (!targetSummon || !targetPlayerId) {
        return gameState; // Target not found
      }

      // For now, create a status effect that represents weapon enhancement
      const statusEffect = {
        id: `weapon_enhancement_${Date.now()}`,
        name: 'Weapon Enhancement',
        sourceCardId: context.sourceCardId,
        duration: duration,
        statModifiers: {},
        combatModifiers: { weaponPower: powerBoost },
        effects: [`weapon_power_+${powerBoost}`]
      };

      const updatedSummon = {
        ...targetSummon,
        statusEffects: [...targetSummon.statusEffects, statusEffect]
      };

      const updatedSummons = state.players[targetPlayerId].summons.map(s => 
        s.id === targetSummonId ? updatedSummon : s
      );
      
      const updatedState = gameState.updatePlayer(targetPlayerId, {
        summons: updatedSummons
      });
      
      eventBus.emit({
        type: 'weaponEnhanced' as any,
        playerId: targetPlayerId,
        data: {
          summonId: targetSummonId,
          powerBoost: powerBoost,
          duration: duration
        }
      });

      return updatedState;
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
      const { gameState, parameters, targets, eventBus } = context;
      const multiplier = parameters.multiplier || 2;
      const duration = parameters.duration || 'end_of_turn';

      const state = gameState.getState();
      
      // Find target summon across all players
      let targetSummon = null;
      let targetPlayerId = null;
      
      for (const [playerId, player] of Object.entries(state.players)) {
        const summon = player.summons.find(s => s.id === targets[0]);
        if (summon) {
          targetSummon = summon;
          targetPlayerId = playerId;
          break;
        }
      }

      if (!targetSummon || !targetPlayerId) {
        return gameState; // Target not found
      }

      // Create status effect for movement boost
      const statusEffect = {
        id: `movement_boost_${Date.now()}`,
        name: 'Movement Boost',
        sourceCardId: context.sourceCardId,
        duration: duration,
        statModifiers: {},
        combatModifiers: { movementMultiplier: multiplier },
        effects: [`movement_x${multiplier}`]
      };

      const updatedSummon = {
        ...targetSummon,
        statusEffects: [...targetSummon.statusEffects, statusEffect]
      };

      const updatedSummons = state.players[targetPlayerId].summons.map(s => 
        s.id === targets[0] ? updatedSummon : s
      );
      
      const updatedState = gameState.updatePlayer(targetPlayerId, {
        summons: updatedSummons
      });
      
      eventBus.emit({
        type: 'movementBoosted' as any,
        playerId: targetPlayerId,
        data: {
          summonId: targets[0],
          multiplier: multiplier,
          duration: duration
        }
      });

      return updatedState;
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
      const { gameState, parameters, targets, eventBus } = context;
      const reduction = parameters.reduction || 0.5;
      const duration = parameters.duration || 'end_of_opponent_turn';

      const state = gameState.getState();
      
      // Find target summon across all players
      let targetSummon = null;
      let targetPlayerId = null;
      
      for (const [playerId, player] of Object.entries(state.players)) {
        const summon = player.summons.find(s => s.id === targets[0]);
        if (summon) {
          targetSummon = summon;
          targetPlayerId = playerId;
          break;
        }
      }

      if (!targetSummon || !targetPlayerId) {
        return gameState; // Target not found
      }

      // Create status effect for defense reduction
      const statusEffect = {
        id: `defense_reduction_${Date.now()}`,
        name: 'Defense Reduction',
        sourceCardId: context.sourceCardId,
        duration: duration,
        statModifiers: {},
        combatModifiers: { defenseMultiplier: reduction },
        effects: [`defense_x${reduction}`]
      };

      const updatedSummon = {
        ...targetSummon,
        statusEffects: [...targetSummon.statusEffects, statusEffect]
      };

      const updatedSummons = state.players[targetPlayerId].summons.map(s => 
        s.id === targets[0] ? updatedSummon : s
      );
      
      const updatedState = gameState.updatePlayer(targetPlayerId, {
        summons: updatedSummons
      });
      
      eventBus.emit({
        type: 'defenseReduced' as any,
        playerId: targetPlayerId,
        data: {
          summonId: targets[0],
          reduction: reduction,
          duration: duration
        }
      });

      return updatedState;
    }
  });

  // Combat attack effect
  registry.register({
    id: 'combat_attack',
    name: 'Combat Attack',
    description: 'Execute a combat attack between summons',
    targetType: 'summon',
    requiresTargets: true,
    resolver: (context) => {
      const { gameState, parameters, targets, eventBus } = context;
      const { attackerId, targetId, attackType } = parameters;

      // Find attacker and target
      const attackerInfo = findSummonById(gameState.getState(), attackerId);
      const targetInfo = findSummonById(gameState.getState(), targetId);

      if (!attackerInfo || !targetInfo) {
        return gameState; // Invalid attack
      }

      // Simplified combat calculation (would use GDD formulas in full implementation)
      const baseDamage = Math.floor(attackerInfo.summon.baseStats.str * 0.8);
      const actualDamage = Math.max(1, baseDamage - Math.floor(targetInfo.summon.baseStats.def * 0.3));

      // Apply damage using the damage effect
      const damageContext = {
        gameState,
        eventBus,
        sourceCardId: attackerInfo.summon.cardId,
        ownerId: attackerInfo.playerId,
        targets: [targetId],
        parameters: { damage: actualDamage, damageType: 'physical' }
      };

      return registry.executeEffect('deal_damage', damageContext);
    }
  });

  // Helper function for finding summons
  function findSummonById(state: any, summonId: string): any {
    for (const [playerId, player] of Object.entries(state.players) as any) {
      const summon = player.summons.find((s: any) => s.id === summonId);
      if (summon) {
        return { summon, playerId };
      }
    }
    return null;
  }

  return registry;
}