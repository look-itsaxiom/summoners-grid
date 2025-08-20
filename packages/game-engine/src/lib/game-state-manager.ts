import {
  GameState,
  Player,
  GameAction,
  Position,
  TurnPhase,
  CardInstance,
} from '@summoners-grid/shared-types';

/**
 * State change description for history tracking
 */
export interface StateChange {
  type: string;
  description: string;
  timestamp: Date;
  data?: any;
}

/**
 * GameStateManager - Handles immutable game state operations
 * 
 * This class provides utilities for:
 * - Immutable state updates
 * - State history tracking
 * - Deep cloning operations
 * - State comparison and diffing
 */
export class GameStateManager {
  
  /**
   * Create a deep clone of game state for immutable updates
   */
  public static cloneGameState(gameState: GameState): GameState {
    return {
      ...gameState,
      board: {
        ...gameState.board,
        summons: new Map(gameState.board.summons),
        buildings: new Map(gameState.board.buildings),
        territories: {
          playerA: [...gameState.board.territories.playerA],
          playerB: [...gameState.board.territories.playerB],
          contested: [...gameState.board.territories.contested],
        },
      },
      playerA: gameState.playerA ? this.clonePlayer(gameState.playerA) : undefined,
      playerB: gameState.playerB ? this.clonePlayer(gameState.playerB) : undefined,
      effectStack: [...gameState.effectStack],
      actionHistory: [...gameState.actionHistory],
    };
  }

  /**
   * Create a deep clone of player state
   */
  public static clonePlayer(player: Player): Player {
    return {
      ...player,
      hand: [...player.hand],
      mainDeck: [...player.mainDeck],
      advanceDeck: [...player.advanceDeck],
      discardPile: [...player.discardPile],
      rechargePile: [...player.rechargePile],
      activeSummons: new Map(player.activeSummons),
      activeBuildings: new Map(player.activeBuildings),
    };
  }

  /**
   * Update player state immutably
   */
  public static updatePlayer(
    gameState: GameState, 
    playerId: 'A' | 'B', 
    updates: Partial<Player>
  ): GameState {
    const newGameState = this.cloneGameState(gameState);
    const currentPlayer = playerId === 'A' ? newGameState.playerA : newGameState.playerB;
    
    if (!currentPlayer) {
      throw new Error(`Player ${playerId} not found`);
    }

    const updatedPlayer = { ...currentPlayer, ...updates };
    
    if (playerId === 'A') {
      newGameState.playerA = updatedPlayer;
    } else {
      newGameState.playerB = updatedPlayer;
    }

    return newGameState;
  }

  /**
   * Add card to player's hand
   */
  public static addCardToHand(
    gameState: GameState, 
    playerId: 'A' | 'B', 
    card: CardInstance
  ): GameState {
    const player = playerId === 'A' ? gameState.playerA : gameState.playerB;
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    return this.updatePlayer(gameState, playerId, {
      hand: [...player.hand, card],
    });
  }

  /**
   * Remove card from player's hand
   */
  public static removeCardFromHand(
    gameState: GameState, 
    playerId: 'A' | 'B', 
    cardId: string
  ): GameState {
    const player = playerId === 'A' ? gameState.playerA : gameState.playerB;
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    const newHand = player.hand.filter(card => card.id !== cardId);
    
    return this.updatePlayer(gameState, playerId, {
      hand: newHand,
    });
  }

  /**
   * Move card between player zones (hand, deck, discard, etc.)
   */
  public static moveCard(
    gameState: GameState,
    playerId: 'A' | 'B',
    cardId: string,
    fromZone: 'hand' | 'mainDeck' | 'discardPile' | 'rechargePile',
    toZone: 'hand' | 'mainDeck' | 'discardPile' | 'rechargePile'
  ): GameState {
    const player = playerId === 'A' ? gameState.playerA : gameState.playerB;
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    // Find and remove card from source zone
    const sourceZone = player[fromZone];
    const cardIndex = sourceZone.findIndex(card => card.id === cardId);
    
    if (cardIndex === -1) {
      throw new Error(`Card ${cardId} not found in ${fromZone}`);
    }

    const card = sourceZone[cardIndex];
    const newSourceZone = [...sourceZone];
    newSourceZone.splice(cardIndex, 1);

    // Add card to destination zone
    const destZone = player[toZone];
    const newDestZone = [...destZone, card];

    return this.updatePlayer(gameState, playerId, {
      [fromZone]: newSourceZone,
      [toZone]: newDestZone,
    });
  }

  /**
   * Update summon position on board
   */
  public static moveSummon(
    gameState: GameState,
    summonId: string,
    newPosition: Position
  ): GameState {
    const newGameState = this.cloneGameState(gameState);
    
    // Update board summons map
    newGameState.board.summons.set(summonId, newPosition);

    // Update summon position in player's active summons
    const updatePlayerSummon = (player: Player | undefined) => {
      if (!player) return;
      
      const summon = player.activeSummons.get(summonId);
      if (summon) {
        player.activeSummons.set(summonId, {
          ...summon,
          position: newPosition,
        });
      }
    };

    updatePlayerSummon(newGameState.playerA);
    updatePlayerSummon(newGameState.playerB);

    return newGameState;
  }

  /**
   * Add summon to board
   */
  public static addSummonToBoard(
    gameState: GameState,
    playerId: 'A' | 'B',
    summonId: string,
    summonData: any,
    position: Position
  ): GameState {
    const newGameState = this.cloneGameState(gameState);
    
    // Add to board summons map
    newGameState.board.summons.set(summonId, position);

    // Add to player's active summons
    const player = playerId === 'A' ? newGameState.playerA : newGameState.playerB;
    if (player) {
      player.activeSummons.set(summonId, {
        ...summonData,
        position,
      });
    }

    return newGameState;
  }

  /**
   * Remove summon from board
   */
  public static removeSummonFromBoard(
    gameState: GameState,
    summonId: string
  ): GameState {
    const newGameState = this.cloneGameState(gameState);
    
    // Remove from board
    newGameState.board.summons.delete(summonId);

    // Remove from both players' active summons
    newGameState.playerA?.activeSummons.delete(summonId);
    newGameState.playerB?.activeSummons.delete(summonId);

    return newGameState;
  }

  /**
   * Update turn phase
   */
  public static updateTurnPhase(
    gameState: GameState,
    newPhase: TurnPhase
  ): GameState {
    const newGameState = this.cloneGameState(gameState);
    newGameState.currentPhase = newPhase;
    return newGameState;
  }

  /**
   * Switch to next player's turn
   */
  public static switchToNextPlayer(gameState: GameState): GameState {
    const newGameState = this.cloneGameState(gameState);
    
    // Switch current player
    newGameState.currentPlayer = gameState.currentPlayer === 'A' ? 'B' : 'A';
    
    // Increment turn number when returning to player A
    if (newGameState.currentPlayer === 'A') {
      newGameState.currentTurn = gameState.currentTurn + 1;
    }
    
    // Reset to Draw phase
    newGameState.currentPhase = TurnPhase.DRAW;

    return newGameState;
  }

  /**
   * Add action to history
   */
  public static addActionToHistory(
    gameState: GameState,
    action: GameAction
  ): GameState {
    const newGameState = this.cloneGameState(gameState);
    newGameState.actionHistory.push(action);
    return newGameState;
  }

  /**
   * Update victory points for a player
   */
  public static updateVictoryPoints(
    gameState: GameState,
    playerId: 'A' | 'B',
    newPoints: number
  ): GameState {
    const player = playerId === 'A' ? gameState.playerA : gameState.playerB;
    if (!player) {
      throw new Error(`Player ${playerId} not found`);
    }

    return this.updatePlayer(gameState, playerId, {
      victoryPoints: Math.max(0, newPoints), // Ensure non-negative
    });
  }

  /**
   * Add effect to the effect stack
   */
  public static addEffectToStack(
    gameState: GameState,
    effect: any
  ): GameState {
    const newGameState = this.cloneGameState(gameState);
    newGameState.effectStack.push(effect);
    return newGameState;
  }

  /**
   * Remove effect from the effect stack (typically the top one)
   */
  public static removeEffectFromStack(
    gameState: GameState,
    effectIndex: number = -1 // Default to last (top) effect
  ): GameState {
    const newGameState = this.cloneGameState(gameState);
    
    if (effectIndex === -1) {
      newGameState.effectStack.pop();
    } else {
      newGameState.effectStack.splice(effectIndex, 1);
    }
    
    return newGameState;
  }

  /**
   * Compare two game states and return differences
   */
  public static compareGameStates(
    oldState: GameState,
    newState: GameState
  ): StateChange[] {
    const changes: StateChange[] = [];
    const timestamp = new Date();

    // Compare basic properties
    if (oldState.currentPlayer !== newState.currentPlayer) {
      changes.push({
        type: 'PLAYER_CHANGED',
        description: `Current player changed from ${oldState.currentPlayer} to ${newState.currentPlayer}`,
        timestamp,
        data: { from: oldState.currentPlayer, to: newState.currentPlayer },
      });
    }

    if (oldState.currentTurn !== newState.currentTurn) {
      changes.push({
        type: 'TURN_CHANGED',
        description: `Turn changed from ${oldState.currentTurn} to ${newState.currentTurn}`,
        timestamp,
        data: { from: oldState.currentTurn, to: newState.currentTurn },
      });
    }

    if (oldState.currentPhase !== newState.currentPhase) {
      changes.push({
        type: 'PHASE_CHANGED',
        description: `Phase changed from ${oldState.currentPhase} to ${newState.currentPhase}`,
        timestamp,
        data: { from: oldState.currentPhase, to: newState.currentPhase },
      });
    }

    // Compare victory points
    if (oldState.playerA && newState.playerA && 
        oldState.playerA.victoryPoints !== newState.playerA.victoryPoints) {
      changes.push({
        type: 'VICTORY_POINTS_CHANGED',
        description: `Player A victory points: ${oldState.playerA.victoryPoints} → ${newState.playerA.victoryPoints}`,
        timestamp,
        data: { 
          player: 'A', 
          from: oldState.playerA.victoryPoints, 
          to: newState.playerA.victoryPoints 
        },
      });
    }

    if (oldState.playerB && newState.playerB && 
        oldState.playerB.victoryPoints !== newState.playerB.victoryPoints) {
      changes.push({
        type: 'VICTORY_POINTS_CHANGED',
        description: `Player B victory points: ${oldState.playerB.victoryPoints} → ${newState.playerB.victoryPoints}`,
        timestamp,
        data: { 
          player: 'B', 
          from: oldState.playerB.victoryPoints, 
          to: newState.playerB.victoryPoints 
        },
      });
    }

    // Compare board positions
    const oldSummons = Array.from(oldState.board.summons.entries());
    const newSummons = Array.from(newState.board.summons.entries());

    // Check for moved summons
    oldSummons.forEach(([summonId, oldPos]) => {
      const newPos = newState.board.summons.get(summonId);
      if (newPos && (oldPos.x !== newPos.x || oldPos.y !== newPos.y)) {
        changes.push({
          type: 'SUMMON_MOVED',
          description: `Summon ${summonId} moved from (${oldPos.x},${oldPos.y}) to (${newPos.x},${newPos.y})`,
          timestamp,
          data: { summonId, from: oldPos, to: newPos },
        });
      }
    });

    // Check for new summons
    newSummons.forEach(([summonId, pos]) => {
      if (!oldState.board.summons.has(summonId)) {
        changes.push({
          type: 'SUMMON_ADDED',
          description: `Summon ${summonId} added at (${pos.x},${pos.y})`,
          timestamp,
          data: { summonId, position: pos },
        });
      }
    });

    // Check for removed summons
    oldSummons.forEach(([summonId, pos]) => {
      if (!newState.board.summons.has(summonId)) {
        changes.push({
          type: 'SUMMON_REMOVED',
          description: `Summon ${summonId} removed from (${pos.x},${pos.y})`,
          timestamp,
          data: { summonId, position: pos },
        });
      }
    });

    // Compare action history length
    if (newState.actionHistory.length > oldState.actionHistory.length) {
      const newActions = newState.actionHistory.slice(oldState.actionHistory.length);
      newActions.forEach(action => {
        changes.push({
          type: 'ACTION_ADDED',
          description: `Action added: ${action.type}`,
          timestamp,
          data: { action },
        });
      });
    }

    return changes;
  }

  /**
   * Create a minimal state representation for debugging
   */
  public static createStateSnapshot(gameState: GameState): any {
    return {
      gameId: gameState.gameId,
      status: gameState.status,
      turn: gameState.currentTurn,
      phase: gameState.currentPhase,
      currentPlayer: gameState.currentPlayer,
      playerAVP: gameState.playerA?.victoryPoints || 0,
      playerBVP: gameState.playerB?.victoryPoints || 0,
      summonCount: gameState.board.summons.size,
      buildingCount: gameState.board.buildings.size,
      effectStackSize: gameState.effectStack.length,
      actionCount: gameState.actionHistory.length,
    };
  }

  /**
   * Check if two game states are equal (deep comparison)
   */
  public static areStatesEqual(stateA: GameState, stateB: GameState): boolean {
    // Quick check for reference equality
    if (stateA === stateB) return true;

    // Compare basic properties
    if (stateA.id !== stateB.id ||
        stateA.gameId !== stateB.gameId ||
        stateA.currentPlayer !== stateB.currentPlayer ||
        stateA.currentTurn !== stateB.currentTurn ||
        stateA.currentPhase !== stateB.currentPhase ||
        stateA.status !== stateB.status) {
      return false;
    }

    // Compare player victory points
    if ((stateA.playerA?.victoryPoints || 0) !== (stateB.playerA?.victoryPoints || 0) ||
        (stateA.playerB?.victoryPoints || 0) !== (stateB.playerB?.victoryPoints || 0)) {
      return false;
    }

    // Compare board summons
    if (stateA.board.summons.size !== stateB.board.summons.size) {
      return false;
    }

    for (const [summonId, posA] of stateA.board.summons) {
      const posB = stateB.board.summons.get(summonId);
      if (!posB || posA.x !== posB.x || posA.y !== posB.y) {
        return false;
      }
    }

    // Compare action history length (full comparison would be expensive)
    if (stateA.actionHistory.length !== stateB.actionHistory.length) {
      return false;
    }

    return true;
  }
}