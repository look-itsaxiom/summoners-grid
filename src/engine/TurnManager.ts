/**
 * TurnManager.ts - Start game, turn/phase progression, priority windows
 * 
 * Manages turn structure and phase transitions according to GDD: Turn Structure.
 * Handles priority passing and player action windows.
 */

import { GameStateManager } from './GameState';
import { EventBus } from './EventBus';
import { Phase, PlayerId } from '../types/base';
import { EventType } from '../types/action';
import { GameState, Player, PriorityWindow } from '../types/game';

export class TurnManager {
  constructor(
    private gameState: GameStateManager,
    private eventBus: EventBus
  ) {}

  /**
   * Initialize a new game with players
   * @param playerIds - Array of player IDs in turn order
   * @returns Updated game state
   */
  startGame(playerIds: PlayerId[]): GameStateManager {
    if (playerIds.length !== 2) {
      throw new Error('Game requires exactly 2 players');
    }

    let updatedState = this.gameState;

    // Set player order and first player
    updatedState = updatedState.update({
      playerOrder: playerIds,
      turnState: {
        ...updatedState.getState().turnState,
        currentPlayer: playerIds[0],
        phase: Phase.Draw,
        turnNumber: 1,
        phaseStep: 0
      }
    });

    // Give priority to first player
    updatedState = updatedState.updatePlayer(playerIds[0], { priority: true });

    // Emit game started event
    this.eventBus.emit({
      type: EventType.GameStarted,
      playerId: playerIds[0],
      data: {
        players: playerIds,
        firstPlayer: playerIds[0]
      }
    });

    return updatedState;
  }

  /**
   * Advance to the next phase
   * @returns Updated game state after phase advancement
   */
  advancePhase(): GameStateManager {
    const state = this.gameState.getState();
    const currentPhase = state.turnState.phase;
    const currentPlayer = state.turnState.currentPlayer;

    // Emit phase end event
    this.eventBus.emit({
      type: EventType.PhaseEnded,
      playerId: currentPlayer,
      data: {
        phase: currentPhase,
        turnNumber: state.turnState.turnNumber
      }
    });

    let nextPhase: Phase;
    let nextPlayer = currentPlayer;
    let nextTurnNumber = state.turnState.turnNumber;

    // Determine next phase based on GDD: Turn Structure
    switch (currentPhase) {
      case Phase.Draw:
        nextPhase = Phase.Level;
        break;
      case Phase.Level:
        nextPhase = Phase.Action;
        break;
      case Phase.Action:
        nextPhase = Phase.End;
        break;
      case Phase.End:
        // End of turn - switch to next player's Draw phase
        nextPhase = Phase.Draw;
        nextPlayer = this.getNextPlayer(currentPlayer);
        nextTurnNumber++;
        break;
      default:
        throw new Error(`Unknown phase: ${currentPhase}`);
    }

    // Update turn state
    let updatedState = this.gameState.updateTurnState({
      phase: nextPhase,
      currentPlayer: nextPlayer,
      turnNumber: nextTurnNumber,
      phaseStep: 0
    });

    // Reset per-turn flags when starting new turn
    if (currentPhase === Phase.End) {
      updatedState = this.resetTurnFlags(updatedState, nextPlayer);
    }

    // Execute phase-specific logic
    updatedState = this.executePhaseLogic(updatedState, nextPhase);

    // Emit phase start event
    this.eventBus.emit({
      type: EventType.PhaseStarted,
      playerId: nextPlayer,
      data: {
        phase: nextPhase,
        turnNumber: nextTurnNumber
      }
    });

    return updatedState;
  }

  /**
   * Execute phase-specific automatic actions
   * @param gameState - Current game state
   * @param phase - Phase to execute logic for
   * @returns Updated game state
   */
  private executePhaseLogic(gameState: GameStateManager, phase: Phase): GameStateManager {
    const state = gameState.getState();
    const currentPlayer = state.turnState.currentPlayer;

    switch (phase) {
      case Phase.Draw:
        return this.executeDrawPhase(gameState, currentPlayer);
      case Phase.Level:
        return this.executeLevelPhase(gameState, currentPlayer);
      case Phase.Action:
        return this.executeActionPhase(gameState, currentPlayer);
      case Phase.End:
        return this.executeEndPhase(gameState, currentPlayer);
      default:
        return gameState;
    }
  }

  /**
   * Execute Draw Phase logic from GDD: Turn Structure - Draw Phase
   */
  private executeDrawPhase(gameState: GameStateManager, playerId: PlayerId): GameStateManager {
    const state = gameState.getState();
    const player = state.players[playerId];

    // Skip draw on first turn of game (GDD rule)
    if (state.turnState.turnNumber === 1) {
      return gameState;
    }

    // Draw 1 card from Main Deck
    if (player.zones.mainDeck.length > 0) {
      const drawnCard = player.zones.mainDeck[0];
      
      let updatedState = gameState
        .removeCardFromZone(playerId, drawnCard.id, 'mainDeck')
        .addCardToZone(playerId, drawnCard, 'hand');

      this.eventBus.emit({
        type: EventType.CardDrawn,
        playerId,
        data: { card: drawnCard }
      });

      return updatedState;
    } 
    // If Main Deck is empty, shuffle Recharge Pile to form new Main Deck
    else if (player.zones.rechargePile.length > 0) {
      const shuffledCards = this.shuffleArray([...player.zones.rechargePile]);
      const drawnCard = shuffledCards[0];
      const remainingCards = shuffledCards.slice(1);

      let updatedState = gameState.updatePlayer(playerId, {
        zones: {
          ...player.zones,
          mainDeck: remainingCards,
          rechargePile: [],
          hand: [...player.zones.hand, drawnCard]
        }
      });

      this.eventBus.emit({
        type: EventType.CardDrawn,
        playerId,
        data: { card: drawnCard, shuffledRecharge: true }
      });

      return updatedState;
    }

    // Both Main Deck and Recharge Pile are empty - draw attempt fails
    return gameState;
  }

  /**
   * Execute Level Phase logic from GDD: Turn Structure - Level Phase
   */
  private executeLevelPhase(gameState: GameStateManager, playerId: PlayerId): GameStateManager {
    const state = gameState.getState();
    const player = state.players[playerId];

    // Level up all summons controlled by turn player
    const updatedSummons = player.summons.map(summon => {
      if (summon.level < 20) { // Max level 20 from GDD
        const newLevel = summon.level + 1;
        
        // Emit level up event
        this.eventBus.emit({
          type: EventType.SummonLeveled,
          playerId,
          data: {
            summonId: summon.id,
            fromLevel: summon.level,
            toLevel: newLevel
          }
        });

        // TODO: Recalculate stats based on new level
        // HP damage retention: current damage stays the same when max HP increases
        return {
          ...summon,
          level: newLevel
          // combatStats will be recalculated by stat system
        };
      }
      return summon;
    });

    return gameState.updatePlayer(playerId, {
      summons: updatedSummons
    });
  }

  /**
   * Execute Action Phase logic - mainly set priority
   */
  private executeActionPhase(gameState: GameStateManager, playerId: PlayerId): GameStateManager {
    // Turn player gets priority during their Action Phase
    return this.givePriority(gameState, playerId);
  }

  /**
   * Execute End Phase logic from GDD: Turn Structure - End Phase
   */
  private executeEndPhase(gameState: GameStateManager, playerId: PlayerId): GameStateManager {
    const state = gameState.getState();
    const player = state.players[playerId];
    const maxHandSize = state.gameConfig.maxHandSize;

    let updatedState = gameState;

    // If player has more than 6 cards in hand, discard excess to Recharge Pile
    if (player.zones.hand.length > maxHandSize) {
      const excessCards = player.zones.hand.slice(maxHandSize);
      const remainingHand = player.zones.hand.slice(0, maxHandSize);

      updatedState = updatedState.updatePlayer(playerId, {
        zones: {
          ...player.zones,
          hand: remainingHand,
          rechargePile: [...player.zones.rechargePile, ...excessCards]
        }
      });

      // Emit discard events
      for (const card of excessCards) {
        this.eventBus.emit({
          type: EventType.CardDiscarded,
          playerId,
          data: { card, reason: 'handLimit' }
        });
      }
    }

    return updatedState;
  }

  /**
   * Get the next player in turn order
   */
  private getNextPlayer(currentPlayer: PlayerId): PlayerId {
    const state = this.gameState.getState();
    const currentIndex = state.playerOrder.indexOf(currentPlayer);
    const nextIndex = (currentIndex + 1) % state.playerOrder.length;
    return state.playerOrder[nextIndex];
  }

  /**
   * Reset per-turn flags for new turn
   */
  private resetTurnFlags(gameState: GameStateManager, playerId: PlayerId): GameStateManager {
    const state = gameState.getState();
    const player = state.players[playerId];

    // Reset turn-based flags
    const updatedSummons = player.summons.map(summon => ({
      ...summon,
      hasAttacked: false,
      movementUsed: 0
    }));

    return gameState.updatePlayer(playerId, {
      hasPlayedTurnSummon: false,
      summons: updatedSummons
    });
  }

  /**
   * Give priority to a specific player
   */
  private givePriority(gameState: GameStateManager, playerId: PlayerId): GameStateManager {
    const state = gameState.getState();
    let updatedState = gameState;

    // Remove priority from all players
    for (const pid of state.playerOrder) {
      updatedState = updatedState.updatePlayer(pid, { priority: false });
    }

    // Give priority to specified player
    return updatedState.updatePlayer(playerId, { priority: true });
  }

  /**
   * Fisher-Yates shuffle algorithm
   */
  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}