// ============================================================================
// SHARED UTILITY FUNCTIONS
// Implementation of task #007: Implement shared utility functions
// ============================================================================

import { Position, GameBoard, TurnPhase, CardType, SummonStats } from './shared-types.js';

// ============================================================================
// POSITION AND MOVEMENT CALCULATION HELPERS
// ============================================================================

/**
 * Calculate distance between two positions
 */
export function calculateDistance(from: Position, to: Position): number {
  return Math.abs(from.x - to.x) + Math.abs(from.y - to.y);
}

/**
 * Check if a position is valid on the 12x14 grid
 */
export function isValidPosition(position: Position): boolean {
  return (
    position.x >= 0 && position.x <= 11 &&
    position.y >= 0 && position.y <= 13
  );
}

/**
 * Get adjacent positions (orthogonal and diagonal)
 */
export function getAdjacentPositions(position: Position): Position[] {
  const adjacent: Position[] = [];
  const directions = [
    { x: -1, y: -1 }, { x: 0, y: -1 }, { x: 1, y: -1 },
    { x: -1, y: 0 },                   { x: 1, y: 0 },
    { x: -1, y: 1 },  { x: 0, y: 1 },  { x: 1, y: 1 }
  ];

  for (const dir of directions) {
    const newPos = { x: position.x + dir.x, y: position.y + dir.y };
    if (isValidPosition(newPos)) {
      adjacent.push(newPos);
    }
  }

  return adjacent;
}

/**
 * Calculate movement path between positions
 */
export function calculateMovementPath(from: Position, to: Position): Position[] {
  const path: Position[] = [];
  let current = { ...from };

  while (current.x !== to.x || current.y !== to.y) {
    // Move one step closer to target
    const deltaX = to.x - current.x;
    const deltaY = to.y - current.y;
    
    // Normalize movement to one step
    const stepX = deltaX === 0 ? 0 : deltaX > 0 ? 1 : -1;
    const stepY = deltaY === 0 ? 0 : deltaY > 0 ? 1 : -1;
    
    current = {
      x: current.x + stepX,
      y: current.y + stepY
    };
    
    path.push({ ...current });
  }

  return path;
}

/**
 * Check if movement path is valid (no obstacles)
 */
export function isMovementPathClear(
  path: Position[], 
  board: GameBoard,
  excludePositions: Position[] = []
): boolean {
  const excludeSet = new Set(excludePositions.map(p => `${p.x},${p.y}`));
  
  for (const pos of path) {
    const posKey = `${pos.x},${pos.y}`;
    
    // Check if position is excluded (typically starting position)
    if (excludeSet.has(posKey)) continue;
    
    // Check for summons
    for (const [, summonPos] of board.summons) {
      if (summonPos.x === pos.x && summonPos.y === pos.y) {
        return false;
      }
    }
    
    // Check for buildings
    for (const [, buildingPos] of board.buildings) {
      if (buildingPos.x === pos.x && buildingPos.y === pos.y) {
        return false;
      }
    }
  }
  
  return true;
}

/**
 * Determine territory ownership of a position
 */
export function getTerritoryOwnership(position: Position): 'A' | 'B' | 'contested' {
  if (position.y <= 2) return 'A';
  if (position.y >= 11) return 'B';
  return 'contested';
}

/**
 * Check if position is in line of sight from another position
 */
export function hasLineOfSight(from: Position, to: Position, board: GameBoard): boolean {
  const path = calculateMovementPath(from, to);
  // Remove the target position from line of sight check (can shoot at targets)
  const pathToCheck = path.slice(0, -1);
  return isMovementPathClear(pathToCheck, board);
}

/**
 * Get positions within range of a given position (square range, not Manhattan distance)
 */
export function getPositionsInRange(center: Position, range: number): Position[] {
  const positions: Position[] = [];
  
  for (let x = center.x - range; x <= center.x + range; x++) {
    for (let y = center.y - range; y <= center.y + range; y++) {
      const pos = { x, y };
      if (isValidPosition(pos)) {
        positions.push(pos);
      }
    }
  }
  
  return positions;
}

// ============================================================================
// GAME RULE VALIDATION UTILITIES
// ============================================================================

/**
 * Validate if an action can be performed in the current turn phase
 */
export function canPerformActionInPhase(actionType: string, phase: TurnPhase): boolean {
  const phaseActions: Record<TurnPhase, string[]> = {
    [TurnPhase.DRAW]: ['draw_card'],
    [TurnPhase.LEVEL]: ['gain_level'],
    [TurnPhase.ACTION]: [
      'play_card', 'move_summon', 'attack', 'activate_ability',
      'play_building', 'play_quest', 'advance_role'
    ],
    [TurnPhase.END]: ['discard_excess', 'end_turn']
  };

  return phaseActions[phase].includes(actionType);
}

/**
 * Check if a card type is valid for a given deck slot
 */
export function isValidCardForSlot(cardType: CardType, slotType: string): boolean {
  const slotValidations: Record<string, CardType[]> = {
    'summon': [CardType.SUMMON],
    'role': [CardType.ROLE],
    'weapon': [CardType.WEAPON],
    'armor': [CardType.ARMOR],
    'accessory': [CardType.ACCESSORY],
    'main_deck': [
      CardType.ACTION, CardType.BUILDING, CardType.QUEST, 
      CardType.COUNTER, CardType.UNIQUE
    ],
    'advance_deck': [CardType.ADVANCE, CardType.ROLE]
  };

  return slotValidations[slotType]?.includes(cardType) ?? false;
}

/**
 * Validate hand size limits
 */
export function validateHandSize(handSize: number, limit: number = 6): boolean {
  return handSize <= limit;
}

/**
 * Check if summon can advance to a specific role
 */
export function canAdvanceToRole(
  currentRole: string,
  targetRole: string,
  roleTree: Record<string, string[]>
): boolean {
  return roleTree[currentRole]?.includes(targetRole) ?? false;
}

// ============================================================================
// DAMAGE AND STAT CALCULATION UTILITIES  
// ============================================================================

/**
 * Calculate final stat value with level and equipment bonuses
 */
export function calculateFinalStat(
  baseStat: number,
  level: number,
  growthRate: number,
  roleModifier: number = 1.0,
  equipmentBonus: number = 0
): number {
  return Math.floor((baseStat + Math.floor(level * growthRate)) * roleModifier) + equipmentBonus;
}

/**
 * Calculate derived properties from stats
 */
export function calculateDerivedProperties(stats: SummonStats) {
  return {
    maxHP: 50 + Math.floor(Math.pow(stats.str + stats.int, 1.5)), // Use combined stats as endurance substitute
    movementSpeed: 2 + Math.floor((stats.agi - 10) / 5), // Use agility as speed
    basicAttackToHit: 90 + Math.floor(stats.agi / 10), // Use agility as accuracy
    criticalHitChance: Math.floor((stats.agi * 0.3375) + 1.65), // Use agility as luck
    abilityToHit: (abilityAccuracy: number) => abilityAccuracy + Math.floor(stats.agi / 10)
  };
}

/**
 * Calculate physical damage
 */
export function calculatePhysicalDamage(
  attackerSTR: number,
  defenderDEF: number,
  basePower: number = 100
): number {
  const damage = attackerSTR * (basePower / 100) - defenderDEF;
  return Math.max(1, Math.floor(damage)); // Minimum 1 damage
}

/**
 * Calculate magical damage
 */
export function calculateMagicalDamage(
  attackerINT: number,
  defenderMDF: number,
  basePower: number = 100
): number {
  const damage = attackerINT * (basePower / 100) - defenderMDF;
  return Math.max(1, Math.floor(damage)); // Minimum 1 damage
}

/**
 * Calculate healing amount
 */
export function calculateHealingAmount(
  healerSPI: number,
  basePower: number = 40
): number {
  return Math.floor(healerSPI * (1 + basePower / 100));
}

// ============================================================================
// CARD EFFECT PARSING UTILITIES
// ============================================================================

/**
 * Parse card effect from JSON data
 */
export function parseCardEffect(effectData: any): ParsedCardEffect {
  return {
    type: effectData.type || 'unknown',
    targets: parseTargets(effectData.targets || []),
    conditions: parseConditions(effectData.conditions || []),
    effects: parseEffectsList(effectData.effects || []),
    timing: effectData.timing || 'action',
    speed: effectData.speed || 'normal',
    cost: effectData.cost || null
  };
}

interface ParsedCardEffect {
  type: string;
  targets: ParsedTarget[];
  conditions: ParsedCondition[];
  effects: ParsedEffectAction[];
  timing: string;
  speed: string;
  cost: any;
}

interface ParsedTarget {
  type: string;
  restrictions: string[];
  count: number;
  optional: boolean;
}

interface ParsedCondition {
  type: string;
  parameters: any;
  negated: boolean;
}

interface ParsedEffectAction {
  action: string;
  parameters: any;
  magnitude: number;
}

function parseTargets(targetsData: any[]): ParsedTarget[] {
  return targetsData.map(target => ({
    type: target.type || 'any',
    restrictions: target.restrictions || [],
    count: target.count || 1,
    optional: target.optional || false
  }));
}

function parseConditions(conditionsData: any[]): ParsedCondition[] {
  return conditionsData.map(condition => ({
    type: condition.type || 'always',
    parameters: condition.parameters || {},
    negated: condition.negated || false
  }));
}

function parseEffectsList(effectsData: any[]): ParsedEffectAction[] {
  return effectsData.map(effect => ({
    action: effect.action || 'none',
    parameters: effect.parameters || {},
    magnitude: effect.magnitude || 0
  }));
}

/**
 * Validate card effect structure
 */
export function validateCardEffect(effectData: any): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!effectData) {
    errors.push('Effect data is required');
    return { isValid: false, errors };
  }

  if (!effectData.type) {
    errors.push('Effect type is required');
  }

  if (!Array.isArray(effectData.effects)) {
    errors.push('Effects must be an array');
  }

  // Validate each effect action
  if (Array.isArray(effectData.effects)) {
    effectData.effects.forEach((effect: any, index: number) => {
      if (!effect.action) {
        errors.push(`Effect ${index} missing action`);
      }
    });
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check if effect can be activated given current game state
 */
export function canActivateEffect(
  effect: ParsedCardEffect,
  gameState: any
): boolean {
  // Check timing restrictions
  if (effect.timing === 'action' && gameState.currentPhase !== TurnPhase.ACTION) {
    return false;
  }

  // Check cost requirements
  if (effect.cost && !canPayCost(effect.cost, gameState)) {
    return false;
  }

  // Check conditions
  return effect.conditions.every(condition => 
    evaluateCondition(condition, gameState)
  );
}

function canPayCost(cost: any, gameState: any): boolean {
  // Simplified cost checking - would need more complex logic
  return true;
}

function evaluateCondition(condition: ParsedCondition, gameState: any): boolean {
  // Simplified condition evaluation - would need more complex logic
  return true;
}

// ============================================================================
// SHARED LOGGING AND ERROR HANDLING UTILITIES
// ============================================================================

export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: any;
  source?: string;
}

/**
 * Structured logging utility
 */
export class Logger {
  private static logs: LogEntry[] = [];
  private static maxLogs = 1000;

  static log(level: LogLevel, message: string, context?: any, source?: string): void {
    const entry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      source
    };

    this.logs.push(entry);
    
    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output in development
    if (process.env.NODE_ENV === 'development') {
      this.outputToConsole(entry);
    }
  }

  static debug(message: string, context?: any, source?: string): void {
    this.log(LogLevel.DEBUG, message, context, source);
  }

  static info(message: string, context?: any, source?: string): void {
    this.log(LogLevel.INFO, message, context, source);
  }

  static warn(message: string, context?: any, source?: string): void {
    this.log(LogLevel.WARN, message, context, source);
  }

  static error(message: string, context?: any, source?: string): void {
    this.log(LogLevel.ERROR, message, context, source);
  }

  static getLogs(level?: LogLevel): LogEntry[] {
    if (level) {
      return this.logs.filter(log => log.level === level);
    }
    return [...this.logs];
  }

  static clearLogs(): void {
    this.logs = [];
  }

  private static outputToConsole(entry: LogEntry): void {
    const timestamp = entry.timestamp.toISOString();
    const source = entry.source ? `[${entry.source}]` : '';
    const context = entry.context ? JSON.stringify(entry.context) : '';
    
    const message = `${timestamp} ${entry.level} ${source} ${entry.message} ${context}`;
    
    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(message);
        break;
      case LogLevel.INFO:
        console.info(message);
        break;
      case LogLevel.WARN:
        console.warn(message);
        break;
      case LogLevel.ERROR:
        console.error(message);
        break;
    }
  }
}

/**
 * Custom error types for better error handling
 */
export class GameError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: any
  ) {
    super(message);
    this.name = 'GameError';
  }
}

export class ValidationError extends GameError {
  constructor(message: string, context?: any) {
    super(message, 'VALIDATION_ERROR', context);
    this.name = 'ValidationError';
  }
}

export class MovementError extends GameError {
  constructor(message: string, context?: any) {
    super(message, 'MOVEMENT_ERROR', context);
    this.name = 'MovementError';
  }
}

export class CardError extends GameError {
  constructor(message: string, context?: any) {
    super(message, 'CARD_ERROR', context);
    this.name = 'CardError';
  }
}

export class GameStateError extends GameError {
  constructor(message: string, context?: any) {
    super(message, 'GAME_STATE_ERROR', context);
    this.name = 'GameStateError';
  }
}

/**
 * Error handler utility for consistent error processing
 */
export function handleError(error: Error, context?: any): void {
  if (error instanceof GameError) {
    Logger.error(error.message, { 
      code: error.code, 
      context: error.context, 
      additionalContext: context 
    }, 'ErrorHandler');
  } else {
    Logger.error(error.message, { 
      stack: error.stack, 
      context 
    }, 'ErrorHandler');
  }
}

/**
 * Safe execution wrapper that catches and logs errors
 */
export async function safeExecute<T>(
  operation: () => T | Promise<T>,
  context?: any,
  fallbackValue?: T
): Promise<T | undefined> {
  try {
    return await operation();
  } catch (error) {
    handleError(error as Error, context);
    return fallbackValue;
  }
}