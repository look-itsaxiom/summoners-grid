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

  // Execution methods would go here...
  private executePlayCard(action: PlayCardAction): GameStateManager {
    // TODO: Implement card playing logic
    return this.gameState;
  }

  private executeMoveSummon(action: MoveSummonAction): GameStateManager {
    // TODO: Implement summon movement logic
    return this.gameState;
  }

  private executeAttack(action: AttackAction): GameStateManager {
    // TODO: Implement attack logic
    return this.gameState;
  }

  private executePassPriority(action: PassPriorityAction): GameStateManager {
    // TODO: Implement priority passing logic
    return this.gameState;
  }

  private executeAdvancePhase(action: import('../types/action').AdvancePhaseAction): GameStateManager {
    // TODO: Implement phase advancement logic
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
    // TODO: Generate all valid move actions for summon
    return [];
  }

  private generateAttackActions(playerId: PlayerId, summonId: string): AttackAction[] {
    // TODO: Generate all valid attack actions for summon
    return [];
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
    // TODO: Implement cost validation logic
    return { isValid: true, errors: [] };
  }

  private findSummonById(summonId: string): any {
    // TODO: Find summon across all players
    return null;
  }

  private calculateDistance(pos1: Coordinate, pos2: Coordinate): number {
    return Math.max(Math.abs(pos1.x - pos2.x), Math.abs(pos1.y - pos2.y));
  }
}