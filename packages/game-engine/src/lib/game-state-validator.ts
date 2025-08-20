import {
  GameState,
  GameAction,
  TurnPhase,
  Position,
  Player,
} from '@summoners-grid/shared-types';

/**
 * Validation result with success status and error messages
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

/**
 * Validation context for more detailed validation
 */
export interface ValidationContext {
  gameState: GameState;
  action?: GameAction;
  playerId?: string;
}

/**
 * GameStateValidator - Validates game state integrity and rule compliance
 * 
 * This class provides comprehensive validation for:
 * - Game state consistency
 * - Rule compliance 
 * - Action validity
 * - Board state integrity
 */
export class GameStateValidator {
  
  /**
   * Validate complete game state for consistency and rule compliance
   */
  public static validateGameState(gameState: GameState): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate basic game state structure
    if (!gameState.id || !gameState.gameId) {
      errors.push('Game state missing required IDs');
    }

    if (!gameState.format) {
      errors.push('Game state missing format definition');
    }

    // Validate player states
    if (!gameState.playerA && !gameState.playerB) {
      errors.push('Game state must have at least one player');
    }

    if (gameState.playerA) {
      const playerAValidation = this.validatePlayer(gameState.playerA, 'A');
      errors.push(...playerAValidation.errors);
      warnings.push(...(playerAValidation.warnings || []));
    }

    if (gameState.playerB) {
      const playerBValidation = this.validatePlayer(gameState.playerB, 'B');
      errors.push(...playerBValidation.errors);
      warnings.push(...(playerBValidation.warnings || []));
    }

    // Validate turn and phase consistency
    const turnValidation = this.validateTurnState(gameState);
    errors.push(...turnValidation.errors);

    // Validate board state
    const boardValidation = this.validateBoard(gameState);
    errors.push(...boardValidation.errors);
    warnings.push(...(boardValidation.warnings || []));

    // Validate victory conditions
    if (gameState.status === 'COMPLETED') {
      const victoryValidation = this.validateVictoryConditions(gameState);
      errors.push(...victoryValidation.errors);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings: warnings.length > 0 ? warnings : undefined,
    };
  }

  /**
   * Validate a specific player action against current game state
   */
  public static validateAction(action: GameAction, gameState: GameState): ValidationResult {
    const errors: string[] = [];

    // Basic action structure validation
    if (!action.id || !action.type || !action.player) {
      errors.push('Action missing required fields');
    }

    if (!action.timestamp || action.timestamp > new Date()) {
      errors.push('Invalid action timestamp');
    }

    // Turn and phase validation
    if (action.player !== gameState.currentPlayer) {
      errors.push('Action player does not match current player');
    }

    if (action.turn !== gameState.currentTurn) {
      errors.push('Action turn does not match current turn');
    }

    if (action.phase !== gameState.currentPhase) {
      errors.push('Action phase does not match current phase');
    }

    // Phase-specific action validation
    const phaseValidation = this.validateActionForPhase(action, gameState);
    errors.push(...phaseValidation.errors);

    // Action-specific validation
    const typeValidation = this.validateActionType(action, gameState);
    errors.push(...typeValidation.errors);

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  /**
   * Validate action is appropriate for current phase
   */
  private static validateActionForPhase(action: GameAction, gameState: GameState): ValidationResult {
    const errors: string[] = [];

    switch (gameState.currentPhase) {
      case TurnPhase.DRAW:
        if (!['DRAW_CARD', 'END_PHASE'].includes(action.type)) {
          errors.push(`Action ${action.type} not allowed during Draw phase`);
        }
        break;
      
      case TurnPhase.LEVEL:
        if (!['END_PHASE'].includes(action.type)) {
          errors.push(`Action ${action.type} not allowed during Level phase`);
        }
        break;
      
      case TurnPhase.ACTION:
        if (!['PLAY_CARD', 'MOVE_SUMMON', 'ATTACK', 'ADVANCE_ROLE', 'END_PHASE'].includes(action.type)) {
          errors.push(`Action ${action.type} not allowed during Action phase`);
        }
        break;
      
      case TurnPhase.END:
        if (action.type !== 'END_PHASE') {
          errors.push(`Only END_PHASE allowed during End phase`);
        }
        break;
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate specific action types
   */
  private static validateActionType(action: GameAction, gameState: GameState): ValidationResult {
    const errors: string[] = [];

    switch (action.type) {
      case 'MOVE_SUMMON':
        if (!action.fromPosition || !action.toPosition) {
          errors.push('MOVE_SUMMON requires fromPosition and toPosition');
        } else {
          const moveValidation = this.validateMovement(action.fromPosition, action.toPosition, gameState);
          errors.push(...moveValidation.errors);
        }
        break;

      case 'PLAY_CARD':
        if (!action.cardId) {
          errors.push('PLAY_CARD requires cardId');
        } else {
          const cardValidation = this.validateCardPlay(action.cardId, gameState, action.player);
          errors.push(...cardValidation.errors);
        }
        break;

      case 'ATTACK':
        if (!action.target) {
          errors.push('ATTACK requires target');
        }
        break;

      case 'ADVANCE_ROLE':
        if (!action.cardId) {
          errors.push('ADVANCE_ROLE requires cardId for the summon');
        }
        break;
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate movement action
   */
  private static validateMovement(from: Position, to: Position, gameState: GameState): ValidationResult {
    const errors: string[] = [];

    // Validate positions are within board bounds
    if (!this.isPositionValid(from) || !this.isPositionValid(to)) {
      errors.push('Movement positions must be within board bounds');
    }

    // Check if there's a summon at the from position
    const fromOccupied = Array.from(gameState.board.summons.values()).some(
      pos => pos.x === from.x && pos.y === from.y
    );

    if (!fromOccupied) {
      errors.push('No summon found at source position');
    }

    // Check if destination is occupied
    const toOccupied = Array.from(gameState.board.summons.values()).some(
      pos => pos.x === to.x && pos.y === to.y
    ) || Array.from(gameState.board.buildings.values()).some(
      pos => pos.x === to.x && pos.y === to.y
    );

    if (toOccupied) {
      errors.push('Destination position is occupied');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate card play action
   */
  private static validateCardPlay(cardId: string, gameState: GameState, playerId: 'A' | 'B'): ValidationResult {
    const errors: string[] = [];

    const player = playerId === 'A' ? gameState.playerA : gameState.playerB;
    if (!player) {
      errors.push('Player not found');
      return { isValid: false, errors };
    }

    // Check if card is in player's hand
    const cardInHand = player.hand.find(card => card.id === cardId);
    if (!cardInHand) {
      errors.push('Card not found in player hand');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate player state
   */
  private static validatePlayer(player: Player, playerId: string): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!player.id || !player.username) {
      errors.push(`Player ${playerId} missing required identification`);
    }

    // Validate hand size
    if (player.hand.length > 6) {
      warnings.push(`Player ${playerId} has more than 6 cards in hand`);
    }

    // Validate victory points
    if (player.victoryPoints < 0) {
      errors.push(`Player ${playerId} has negative victory points`);
    }

    // Validate summon positions
    player.activeSummons.forEach((summon, summonId) => {
      if (!this.isPositionValid(summon.position)) {
        errors.push(`Summon ${summonId} has invalid position`);
      }
    });

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate turn and phase state
   */
  private static validateTurnState(gameState: GameState): ValidationResult {
    const errors: string[] = [];

    if (gameState.currentTurn < 1) {
      errors.push('Turn number must be positive');
    }

    if (!['A', 'B'].includes(gameState.currentPlayer)) {
      errors.push('Current player must be A or B');
    }

    if (!Object.values(TurnPhase).includes(gameState.currentPhase)) {
      errors.push('Invalid turn phase');
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Validate board state
   */
  private static validateBoard(gameState: GameState): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    const board = gameState.board;

    // Validate board dimensions
    if (board.width !== 12 || board.height !== 14) {
      errors.push('Board must be 12x14 grid');
    }

    // Validate summon positions
    board.summons.forEach((position, summonId) => {
      if (!this.isPositionValid(position)) {
        errors.push(`Summon ${summonId} at invalid position`);
      }
    });

    // Validate building positions
    board.buildings.forEach((position, buildingId) => {
      if (!this.isPositionValid(position)) {
        errors.push(`Building ${buildingId} at invalid position`);
      }
    });

    // Check for position conflicts
    const allPositions = [
      ...Array.from(board.summons.values()),
      ...Array.from(board.buildings.values()),
    ];

    const positionStrings = allPositions.map(pos => `${pos.x},${pos.y}`);
    const uniquePositions = new Set(positionStrings);

    if (positionStrings.length !== uniquePositions.size) {
      errors.push('Multiple entities occupy the same position');
    }

    // Validate territories
    const territories = board.territories;
    if (!territories.playerA || !territories.playerB || !territories.contested) {
      errors.push('Board missing territory definitions');
    }

    return { isValid: errors.length === 0, errors, warnings };
  }

  /**
   * Validate victory conditions for completed game
   */
  private static validateVictoryConditions(gameState: GameState): ValidationResult {
    const errors: string[] = [];

    if (!gameState.winner) {
      errors.push('Completed game must have a winner or be declared a draw');
    }

    if (gameState.winner && !['A', 'B', 'DRAW'].includes(gameState.winner)) {
      errors.push('Invalid winner designation');
    }

    // Check if victory conditions were actually met
    const playerA = gameState.playerA;
    const playerB = gameState.playerB;

    if (playerA && playerB) {
      const targetVP = gameState.format.victoryPointTarget;
      
      if (gameState.winner === 'A' && playerA.victoryPoints < targetVP) {
        errors.push('Player A declared winner without reaching victory points');
      }
      
      if (gameState.winner === 'B' && playerB.victoryPoints < targetVP) {
        errors.push('Player B declared winner without reaching victory points');
      }
    }

    return { isValid: errors.length === 0, errors };
  }

  /**
   * Check if position is within valid board bounds
   */
  private static isPositionValid(position: Position): boolean {
    return (
      position.x >= 0 && 
      position.x < 12 && 
      position.y >= 0 && 
      position.y < 14
    );
  }

  /**
   * Validate position is not occupied
   */
  public static isPositionFree(position: Position, gameState: GameState): boolean {
    const summonOccupied = Array.from(gameState.board.summons.values()).some(
      pos => pos.x === position.x && pos.y === position.y
    );

    const buildingOccupied = Array.from(gameState.board.buildings.values()).some(
      pos => pos.x === position.x && pos.y === position.y
    );

    return !summonOccupied && !buildingOccupied;
  }

  /**
   * Calculate distance between two positions
   */
  public static calculateDistance(from: Position, to: Position): number {
    return Math.max(Math.abs(to.x - from.x), Math.abs(to.y - from.y));
  }

  /**
   * Check if position is within movement range
   */
  public static isWithinMovementRange(from: Position, to: Position, maxDistance: number): boolean {
    return this.calculateDistance(from, to) <= maxDistance;
  }
}