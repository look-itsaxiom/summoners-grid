/**
 * ActionProcessor.ts - Valid action enumeration, validation, application, and rule enforcement
 * 
 * Handles player action validation and execution according to GDD rules.
 * Integrates with TRR system for action processing.
 */

import { GameStateManager } from './GameState';
import { EventBus } from './EventBus';
import { TRRManager } from './TRR';
import { EffectRegistry } from './EffectRegistry';
import {
  GameAction,
  ActionType,
  ActionValidation,
  PlayCardAction,
  MoveSummonAction,
  AttackAction,
  ActivateAbilityAction,
  PassPriorityAction
} from '../types/action';
import {
  PlayerId,
  Phase,
  SpeedLevel,
  CardType,
  Coordinate
} from '../types/base';
import { Card, SummonCard } from '../types/card';

export class ActionProcessor {
  constructor(
    private gameState: GameStateManager,
    private eventBus: EventBus,
    private trrManager: TRRManager,
    private effectRegistry: EffectRegistry
  ) {}

  /**
   * Get all legal actions for a player in the current state
   * @param playerId - Player to get actions for
   * @returns Array of legal actions
   */
  getLegalActions(playerId: PlayerId): GameAction[] {
    const state = this.gameState.getState();
    const player = state.players[playerId];
    
    if (!player) {
      return [];
    }

    const actions: GameAction[] = [];

    // Always allow passing priority
    actions.push({
      type: ActionType.PassPriority,
      playerId,
      timestamp: Date.now()
    });

    // Check if it's player's turn and what phase
    const isPlayerTurn = state.turnState.currentPlayer === playerId;
    const currentPhase = state.turnState.phase;
    
    // Action phase specific actions
    if (isPlayerTurn && currentPhase === Phase.Action) {
      // Phase advancement
      actions.push({
        type: ActionType.AdvancePhase,
        playerId,
        timestamp: Date.now(),
        fromPhase: Phase.Action,
        toPhase: Phase.End
      });

      // Play cards from hand
      for (const card of player.zones.hand) {
        const playCardAction = this.createPlayCardAction(playerId, card);
        if (playCardAction && this.validatePlayCard(playCardAction).isValid) {
          actions.push(playCardAction);
        }
      }

      // Move summons
      for (const summon of player.summons) {
        const moveActions = this.generateMoveActions(playerId, summon.id);
        actions.push(...moveActions);
      }

      // Attack with summons
      for (const summon of player.summons) {
        const attackActions = this.generateAttackActions(playerId, summon.id);
        actions.push(...attackActions);
      }
    }

    // Priority-based response actions (can happen during any phase)
    if (player.priority && state.effectStack.length > 0) {
      const allowedSpeeds = this.getAllowedResponseSpeeds(state.effectStack);
      
      for (const card of player.zones.hand) {
        if (allowedSpeeds.includes(card.speed)) {
          const responseAction = this.createPlayCardAction(playerId, card);
          if (responseAction && this.validatePlayCard(responseAction).isValid) {
            actions.push(responseAction);
          }
        }
      }
    }

    return actions;
  }

  /**
   * Validate if an action is legal
   * @param action - Action to validate
   * @returns Validation result
   */
  validateAction(action: GameAction): ActionValidation {
    switch (action.type) {
      case ActionType.PlayCard:
        return this.validatePlayCard(action);
      case ActionType.MoveSummon:
        return this.validateMoveSummon(action);
      case ActionType.AttackWithSummon:
        return this.validateAttack(action);
      case ActionType.PassPriority:
        return this.validatePassPriority(action);
      case ActionType.AdvancePhase:
        return this.validateAdvancePhase(action);
      default:
        return {
          isValid: false,
          errors: [`Unknown action type: ${(action as any).type}`]
        };
    }
  }

  /**
   * Execute a validated action
   * @param action - Action to execute
   * @returns Updated game state
   */
  executeAction(action: GameAction): GameStateManager {
    const validation = this.validateAction(action);
    if (!validation.isValid) {
      throw new Error(`Invalid action: ${validation.errors.join(', ')}`);
    }

    switch (action.type) {
      case ActionType.PlayCard:
        return this.executePlayCard(action);
      case ActionType.MoveSummon:
        return this.executeMoveSummon(action);
      case ActionType.AttackWithSummon:
        return this.executeAttack(action);
      case ActionType.PassPriority:
        return this.executePassPriority(action);
      case ActionType.AdvancePhase:
        return this.executeAdvancePhase(action);
      default:
        throw new Error(`Cannot execute unknown action type: ${(action as any).type}`);
    }
  }

  /**
   * Validate play card action
   */
  private validatePlayCard(action: PlayCardAction): ActionValidation {
    const state = this.gameState.getState();
    const player = state.players[action.playerId];
    const card = player?.zones.hand.find(c => c.id === action.cardId);

    if (!card) {
      return {
        isValid: false,
        errors: ['Card not found in hand']
      };
    }

    // Check phase restrictions
    if (card.speed === SpeedLevel.Action && state.turnState.phase !== Phase.Action) {
      return {
        isValid: false,
        errors: ['Action speed cards can only be played during Action Phase']
      };
    }

    // Check turn restrictions
    if (card.speed === SpeedLevel.Action && state.turnState.currentPlayer !== action.playerId) {
      return {
        isValid: false,
        errors: ['Cannot play Action speed cards on opponent\'s turn']
      };
    }

    // Check stack speed restrictions
    if (state.effectStack.length > 0) {
      const allowedSpeeds = this.getAllowedResponseSpeeds(state.effectStack);
      if (!allowedSpeeds.includes(card.speed)) {
        return {
          isValid: false,
          errors: [`Cannot play ${card.speed} speed card in response to current stack`]
        };
      }
    }

    // Check summon-specific restrictions
    if (card.type === CardType.Summon) {
      if (player.hasPlayedTurnSummon) {
        return {
          isValid: false,
          errors: ['Can only play one summon per turn']
        };
      }

      if (!action.position) {
        return {
          isValid: false,
          errors: ['Summon cards require a board position']
        };
      }

      if (!this.gameState.isValidCoordinate(action.position)) {
        return {
          isValid: false,
          errors: ['Invalid board position']
        };
      }

      if (!this.gameState.isInPlayerTerritory(action.position, action.playerId)) {
        return {
          isValid: false,
          errors: ['Summons must be deployed in player territory']
        };
      }
    }

    // Check cost requirements
    const costValidation = this.validateCost(card, action.playerId);
    if (!costValidation.isValid) {
      return costValidation;
    }

    return { isValid: true, errors: [] };
  }

  /**
   * Validate movement action
   */
  private validateMoveSummon(action: MoveSummonAction): ActionValidation {
    const state = this.gameState.getState();
    const player = state.players[action.playerId];
    const summon = player?.summons.find(s => s.id === action.summonId);

    if (!summon) {
      return {
        isValid: false,
        errors: ['Summon not found']
      };
    }

    // Check if it's player's turn and Action phase
    if (state.turnState.currentPlayer !== action.playerId || state.turnState.phase !== Phase.Action) {
      return {
        isValid: false,
        errors: ['Can only move summons during your Action Phase']
      };
    }

    // Check movement points remaining
    const remainingMovement = summon.combatStats.movement - summon.movementUsed;
    if (action.movementCost > remainingMovement) {
      return {
        isValid: false,
        errors: ['Insufficient movement points']
      };
    }

    // Check destination is valid and unoccupied
    if (!this.gameState.isValidCoordinate(action.toPosition)) {
      return {
        isValid: false,
        errors: ['Invalid destination coordinate']
      };
    }

    const boardKey = `${action.toPosition.x},${action.toPosition.y}`;
    if (state.sharedZones.gameBoard.has(boardKey)) {
      return {
        isValid: false,
        errors: ['Destination is occupied']
      };
    }

    return { isValid: true, errors: [] };
  }

  /**
   * Validate attack action
   */
  private validateAttack(action: AttackAction): ActionValidation {
    const state = this.gameState.getState();
    const player = state.players[action.playerId];
    const attacker = player?.summons.find(s => s.id === action.attackerId);

    if (!attacker) {
      return {
        isValid: false,
        errors: ['Attacking summon not found']
      };
    }

    if (attacker.hasAttacked) {
      return {
        isValid: false,
        errors: ['Summon has already attacked this turn']
      };
    }

    // Check if it's player's turn and Action phase
    if (state.turnState.currentPlayer !== action.playerId || state.turnState.phase !== Phase.Action) {
      return {
        isValid: false,
        errors: ['Can only attack during your Action Phase']
      };
    }

    // Find target summon
    const targetSummon = this.findSummonById(action.targetId);
    if (!targetSummon) {
      return {
        isValid: false,
        errors: ['Target summon not found']
      };
    }

    // Check attack range
    const distance = this.calculateDistance(attacker.position, targetSummon.position);
    if (distance > attacker.combatStats.attackRange) {
      return {
        isValid: false,
        errors: ['Target is out of attack range']
      };
    }

    return { isValid: true, errors: [] };
  }

  /**
   * Validate pass priority action
   */
  private validatePassPriority(action: PassPriorityAction): ActionValidation {
    const state = this.gameState.getState();
    const player = state.players[action.playerId];

    if (!player?.priority) {
      return {
        isValid: false,
        errors: ['Player does not have priority']
      };
    }

    return { isValid: true, errors: [] };
  }

  /**
   * Validate phase advancement
   */
  private validateAdvancePhase(action: import('../types/action').AdvancePhaseAction): ActionValidation {
    const state = this.gameState.getState();

    if (state.turnState.currentPlayer !== action.playerId) {
      return {
        isValid: false,
        errors: ['Only current turn player can advance phase']
      };
    }

    if (state.effectStack.length > 0) {
      return {
        isValid: false,
        errors: ['Cannot advance phase while effects are on the stack']
      };
    }

    return { isValid: true, errors: [] };
  }

  // Execution methods
  private executePlayCard(action: PlayCardAction): GameStateManager {
    const state = this.gameState.getState();
    const player = state.players[action.playerId];
    const card = player?.zones.hand.find(c => c.id === action.cardId);

    if (!card) {
      throw new Error('Card not found in hand');
    }

    let updatedState = this.gameState;

    // Remove card from hand
    updatedState = updatedState.removeCardFromZone(action.playerId, action.cardId, 'hand');

    // Handle different card types
    switch (card.type) {
      case CardType.Summon:
        updatedState = this.executeSummonPlay(updatedState, action, card as any);
        break;
      case CardType.Action:
        updatedState = this.executeActionPlay(updatedState, action, card as any);
        break;
      case CardType.Building:
      case CardType.Quest:
        updatedState = this.executePermanentPlay(updatedState, action, card);
        break;
      default:
        // Other card types would be handled here
        break;
    }

    // Emit card played event
    this.eventBus.emit({
      type: 'cardPlayed' as any,
      playerId: action.playerId,
      data: {
        card: card,
        targets: action.targets,
        position: action.position
      }
    });

    return updatedState;
  }

  private executeSummonPlay(gameState: GameStateManager, action: PlayCardAction, card: any): GameStateManager {
    const state = gameState.getState();
    const player = state.players[action.playerId];

    // Create summon unit
    const summonUnit = {
      id: `summon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      cardId: card.id,
      ownerId: action.playerId,
      position: action.position!,
      level: 5, // Starting level from GDD
      baseStats: card.baseStats,
      combatStats: {
        hp: this.calculateMaxHP(card.baseStats, 5),
        maxHp: this.calculateMaxHP(card.baseStats, 5),
        movement: this.calculateMovement(card.baseStats),
        attackRange: 1, // Default attack range
        level: 5
      },
      damage: 0,
      hasAttacked: false,
      movementUsed: 0,
      completedQuests: [],
      statusEffects: []
    };

    // Add summon to player's summons
    const updatedSummons = [...player.summons, summonUnit];
    let updatedState = gameState.updatePlayer(action.playerId, {
      summons: updatedSummons,
      hasPlayedTurnSummon: true
    });

    // Update game board
    const boardKey = `${action.position!.x},${action.position!.y}`;
    const updatedBoard = new Map(state.sharedZones.gameBoard);
    updatedBoard.set(boardKey, summonUnit);
    
    updatedState = updatedState.update({
      sharedZones: {
        ...state.sharedZones,
        gameBoard: updatedBoard
      }
    });

    // Trigger summon draws (3 cards from GDD)
    const drawEffect = {
      id: `summon_draw_${Date.now()}`,
      ownerId: action.playerId,
      sourceCardId: card.id,
      effectId: 'draw_cards',
      speed: SpeedLevel.Action,
      parameters: { count: 3 },
      targets: [action.playerId],
      timestamp: Date.now()
    };

    updatedState = updatedState.addToEffectStack(drawEffect);

    // Emit summon deployed event
    this.eventBus.emit({
      type: 'summonDeployed' as any,
      playerId: action.playerId,
      data: {
        summonId: summonUnit.id,
        cardId: card.id,
        position: action.position
      }
    });

    return updatedState;
  }

  private executeActionPlay(gameState: GameStateManager, action: PlayCardAction, card: any): GameStateManager {
    let updatedState = gameState;

    // Create effect entries for each effect on the card
    if (card.effects && card.effects.length > 0) {
      for (const effect of card.effects) {
        const effectEntry = {
          id: `effect_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ownerId: action.playerId,
          sourceCardId: card.id,
          effectId: effect.effectId,
          speed: card.speed,
          parameters: effect.parameters || {},
          targets: action.targets || [],
          timestamp: Date.now()
        };

        updatedState = updatedState.addToEffectStack(effectEntry);
      }
    }

    // Move card to appropriate pile based on GDD rules
    const destinationZone = card.speed === SpeedLevel.Counter ? 'discardPile' : 'rechargePile';
    updatedState = updatedState.addCardToZone(action.playerId, card, destinationZone);

    return updatedState;
  }

  private executePermanentPlay(gameState: GameStateManager, action: PlayCardAction, card: Card): GameStateManager {
    const cardInPlay = {
      ...card,
      ownerId: action.playerId,
      position: action.position,
      modifications: [],
      counters: {}
    };

    // Add to in play zone
    const state = gameState.getState();
    const updatedInPlay = [...state.sharedZones.inPlay, cardInPlay];
    
    return gameState.update({
      sharedZones: {
        ...state.sharedZones,
        inPlay: updatedInPlay
      }
    });
  }

  private executeMoveSummon(action: MoveSummonAction): GameStateManager {
    const state = this.gameState.getState();
    const player = state.players[action.playerId];
    const summon = player?.summons.find(s => s.id === action.summonId);

    if (!summon) {
      throw new Error('Summon not found');
    }

    // Update summon position and movement used
    const updatedSummon = {
      ...summon,
      position: action.toPosition,
      movementUsed: summon.movementUsed + action.movementCost
    };

    const updatedSummons = player.summons.map(s => 
      s.id === action.summonId ? updatedSummon : s
    );

    let updatedState = this.gameState.updatePlayer(action.playerId, {
      summons: updatedSummons
    });

    // Update game board
    const oldBoardKey = `${action.fromPosition.x},${action.fromPosition.y}`;
    const newBoardKey = `${action.toPosition.x},${action.toPosition.y}`;
    
    const updatedBoard = new Map(state.sharedZones.gameBoard);
    updatedBoard.delete(oldBoardKey);
    updatedBoard.set(newBoardKey, updatedSummon);
    
    updatedState = updatedState.update({
      sharedZones: {
        ...state.sharedZones,
        gameBoard: updatedBoard
      }
    });

    // Emit movement event
    this.eventBus.emit({
      type: 'summonMoved' as any,
      playerId: action.playerId,
      data: {
        summonId: action.summonId,
        fromPosition: action.fromPosition,
        toPosition: action.toPosition,
        movementCost: action.movementCost
      }
    });

    return updatedState;
  }

  private executeAttack(action: AttackAction): GameStateManager {
    const state = this.gameState.getState();
    const attackerOwner = state.players[action.playerId];
    const attacker = attackerOwner?.summons.find(s => s.id === action.attackerId);

    if (!attacker) {
      throw new Error('Attacking summon not found');
    }

    // Mark attacker as having attacked
    const updatedAttacker = { ...attacker, hasAttacked: true };
    const updatedAttackerSummons = attackerOwner.summons.map(s => 
      s.id === action.attackerId ? updatedAttacker : s
    );

    let updatedState = this.gameState.updatePlayer(action.playerId, {
      summons: updatedAttackerSummons
    });

    // Create attack effect on the stack
    const attackEffect = {
      id: `attack_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ownerId: action.playerId,
      sourceCardId: attacker.cardId,
      effectId: 'combat_attack',
      speed: SpeedLevel.Action,
      parameters: {
        attackerId: action.attackerId,
        targetId: action.targetId,
        attackType: 'basic'
      },
      targets: [action.targetId],
      timestamp: Date.now()
    };

    updatedState = updatedState.addToEffectStack(attackEffect);

    // Emit attack event
    this.eventBus.emit({
      type: 'summonAttacked' as any,
      playerId: action.playerId,
      data: {
        attackerId: action.attackerId,
        targetId: action.targetId
      }
    });

    return updatedState;
  }

  private executePassPriority(action: PassPriorityAction): GameStateManager {
    const state = this.gameState.getState();
    let updatedState = this.gameState;

    // Remove priority from the passing player
    updatedState = updatedState.updatePlayer(action.playerId, { priority: false });

    // Update priority queue to mark this player as passed
    const updatedPriorityQueue = state.priorityQueue.map(window => 
      window.playerId === action.playerId 
        ? { ...window, passed: true }
        : window
    );

    updatedState = updatedState.update({
      priorityQueue: updatedPriorityQueue
    });

    // Find next player with priority who hasn't passed
    const nextPriorityWindow = updatedPriorityQueue.find(window => !window.passed);
    
    if (nextPriorityWindow) {
      // Give priority to next player
      updatedState = updatedState.updatePlayer(nextPriorityWindow.playerId, { priority: true });
    }

    // Emit priority passed event
    this.eventBus.emit({
      type: 'priorityPassed' as any,
      playerId: action.playerId,
      data: {
        nextPlayer: nextPriorityWindow?.playerId || null
      }
    });

    return updatedState;
  }

  private executeAdvancePhase(action: import('../types/action').AdvancePhaseAction): GameStateManager {
    // Phase advancement should be handled by the main game engine
    // For now, just return the current state as the action processor shouldn't handle phase changes directly
    return this.gameState;
  }

  // Helper methods
  private createPlayCardAction(playerId: PlayerId, card: Card): PlayCardAction | null {
    return {
      type: ActionType.PlayCard,
      playerId,
      cardId: card.id,
      timestamp: Date.now()
    };
  }

  private generateMoveActions(playerId: PlayerId, summonId: string): MoveSummonAction[] {
    const state = this.gameState.getState();
    const player = state.players[playerId];
    const summon = player?.summons.find(s => s.id === summonId);
    
    if (!summon) {
      return [];
    }

    const actions: MoveSummonAction[] = [];
    const remainingMovement = summon.combatStats.movement - summon.movementUsed;
    
    if (remainingMovement <= 0) {
      return [];
    }

    // Generate all valid adjacent moves (simplified - could be expanded for pathfinding)
    const directions = [
      { x: 0, y: 1 },   // Up
      { x: 0, y: -1 },  // Down  
      { x: 1, y: 0 },   // Right
      { x: -1, y: 0 },  // Left
      { x: 1, y: 1 },   // Up-Right
      { x: 1, y: -1 },  // Down-Right
      { x: -1, y: 1 },  // Up-Left
      { x: -1, y: -1 }  // Down-Left
    ];

    for (const dir of directions) {
      const newPosition = {
        x: summon.position.x + dir.x,
        y: summon.position.y + dir.y
      };

      // Check if position is valid and unoccupied
      if (this.gameState.isValidCoordinate(newPosition)) {
        const boardKey = `${newPosition.x},${newPosition.y}`;
        if (!state.sharedZones.gameBoard.has(boardKey)) {
          actions.push({
            type: ActionType.MoveSummon,
            playerId,
            summonId,
            fromPosition: summon.position,
            toPosition: newPosition,
            movementCost: 1,
            timestamp: Date.now()
          });
        }
      }
    }

    return actions;
  }

  private generateAttackActions(playerId: PlayerId, summonId: string): AttackAction[] {
    const state = this.gameState.getState();
    const player = state.players[playerId];
    const attacker = player?.summons.find(s => s.id === summonId);
    
    if (!attacker || attacker.hasAttacked) {
      return [];
    }

    const actions: AttackAction[] = [];
    const attackRange = attacker.combatStats.attackRange;

    // Find all enemy summons within attack range
    for (const [enemyPlayerId, enemyPlayer] of Object.entries(state.players)) {
      if (enemyPlayerId === playerId) continue; // Skip own summons

      for (const enemySummon of enemyPlayer.summons) {
        const distance = this.calculateDistance(attacker.position, enemySummon.position);
        
        if (distance <= attackRange) {
          actions.push({
            type: ActionType.AttackWithSummon,
            playerId,
            attackerId: summonId,
            targetId: enemySummon.id,
            timestamp: Date.now()
          });
        }
      }
    }

    return actions;
  }

  private getAllowedResponseSpeeds(stack: import('../types/game').EffectStackEntry[]): SpeedLevel[] {
    if (stack.length === 0) return [SpeedLevel.Action, SpeedLevel.Reaction, SpeedLevel.Counter];
    
    const topSpeed = stack[stack.length - 1].speed;
    switch (topSpeed) {
      case SpeedLevel.Counter:
        return [SpeedLevel.Counter];
      case SpeedLevel.Reaction:
        return [SpeedLevel.Reaction, SpeedLevel.Counter];
      case SpeedLevel.Action:
        return [SpeedLevel.Action, SpeedLevel.Reaction, SpeedLevel.Counter];
      default:
        return [];
    }
  }

  private validateCost(card: Card, playerId: PlayerId): ActionValidation {
    const state = this.gameState.getState();
    const player = state.players[playerId];

    if (!player) {
      return { isValid: false, errors: ['Player not found'] };
    }

    // Check cost requirements
    switch (card.cost.type) {
      case 'none':
        return { isValid: true, errors: [] };
        
      case 'role_requirement':
        if (card.cost.requirements?.roles) {
          // Check if player has any summons with required roles
          const hasRequiredRole = player.summons.some(summon => {
            // For now, we'll assume the summon's role is stored in a baseCard reference
            // This could be expanded to actually track role information
            return card.cost.requirements!.roles!.some(requiredRole => {
              // Simplified role check - in full implementation would check summon's actual role
              return true; // For now, allow all role requirements
            });
          });
          
          if (!hasRequiredRole) {
            return {
              isValid: false,
              errors: [`Requires controlling a summon with role: ${card.cost.requirements.roles.join(' or ')}`]
            };
          }
        }
        return { isValid: true, errors: [] };
        
      case 'resource':
        // Resource costs would be implemented here
        return { isValid: true, errors: [] };
        
      case 'sacrifice':
        // Sacrifice costs would be implemented here  
        return { isValid: true, errors: [] };
        
      default:
        return { isValid: false, errors: ['Unknown cost type'] };
    }
  }

  private findSummonById(summonId: string): any {
    const state = this.gameState.getState();
    
    // Search across all players for the summon
    for (const [playerId, player] of Object.entries(state.players)) {
      const summon = player.summons.find(s => s.id === summonId);
      if (summon) {
        return { summon, playerId };
      }
    }
    
    return null;
  }

  // Helper methods for stat calculations
  private calculateMaxHP(baseStats: any, level: number): number {
    // Simplified HP calculation - would use proper formulas from GDD
    return Math.floor((baseStats.end * 2 + baseStats.str * 0.5) * (1 + level * 0.1));
  }

  private calculateMovement(baseStats: any): number {
    // Simplified movement calculation
    return Math.max(1, Math.floor(baseStats.spd * 0.2));
  }

  private calculateDistance(pos1: Coordinate, pos2: Coordinate): number {
    return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y));
  }
}