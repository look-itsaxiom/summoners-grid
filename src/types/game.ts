/**
 * Game state and player types based on GDD structure
 */

import { PlayerId, SummonId, CardId, Phase, Coordinate, Zone, VictoryPoint } from './base';
import { Card, CardInPlay, SummonCard, BaseStats, CombatStats } from './card';

// Player zones from GDD: Game Board & Zones
export interface PlayerZones {
  hand: Card[];
  mainDeck: Card[];
  advanceDeck: Card[];
  discardPile: Card[];
  rechargePile: Card[];
  removedFromPlay: Card[];
}

// Summon unit when deployed from GDD: Summon System
export interface SummonUnit {
  id: SummonId;
  cardId: CardId;
  ownerId: PlayerId;
  position: Coordinate;
  level: number; // Always starts at 5, max 20
  baseStats: BaseStats;
  combatStats: CombatStats;
  damage: number; // Current damage taken
  hasAttacked: boolean;
  movementUsed: number;
  completedQuests: string[];
  statusEffects: StatusEffect[];
}

// Status effects and modifiers
export interface StatusEffect {
  id: string;
  name: string;
  sourceCardId: CardId;
  duration: 'permanent' | 'endOfTurn' | 'endOfOpponentTurn' | number;
  statModifiers?: Partial<BaseStats>;
  combatModifiers?: Partial<CombatStats>;
  effects: string[]; // References to active effects
}

// Player state
export interface Player {
  id: PlayerId;
  name: string;
  victoryPoints: VictoryPoint[];
  zones: PlayerZones;
  summons: SummonUnit[];
  hasPlayedTurnSummon: boolean;
  priority: boolean;
}

// Shared game zones from GDD
export interface SharedZones {
  inPlay: CardInPlay[]; // Buildings, quests, active effects
  gameBoard: Map<string, SummonUnit>; // coordinate key -> summon
}

// Turn state from GDD: Turn Structure
export interface TurnState {
  currentPlayer: PlayerId;
  phase: Phase;
  turnNumber: number;
  phaseStep: number; // For complex phases with multiple steps
}

// Main game state - immutable structure
export interface GameState {
  gameId: string;
  players: Record<PlayerId, Player>;
  playerOrder: PlayerId[];
  sharedZones: SharedZones;
  turnState: TurnState;
  effectStack: EffectStackEntry[];
  priorityQueue: PriorityWindow[];
  gameConfig: GameConfig;
  randomSeed: string; // For deterministic randomization
  events: GameEvent[];
  isGameOver: boolean;
  winner?: PlayerId;
}

// Game configuration
export interface GameConfig {
  format: '3v3';
  maxHandSize: number; // 6 from GDD
  maxVictoryPoints: number; // 3 from GDD
  boardDimensions: { width: number; height: number }; // 12x14 from GDD
  playerTerritoryRows: number; // 3 from GDD
}

// Effect stack entry for TRR system
export interface EffectStackEntry {
  id: string;
  ownerId: PlayerId;
  sourceCardId: CardId;
  effectId: string;
  speed: import('./base').SpeedLevel;
  parameters: Record<string, any>;
  targets: any[];
  timestamp: number;
}

// Priority window for player responses
export interface PriorityWindow {
  playerId: PlayerId;
  allowedSpeeds: import('./base').SpeedLevel[];
  triggeringEffect?: EffectStackEntry;
  passed: boolean;
}

// Game events for trigger system
export interface GameEvent {
  id: string;
  type: string;
  timestamp: number;
  playerId: PlayerId;
  data: Record<string, any>;
  processed: boolean;
}

// Default game config based on GDD
export const DEFAULT_GAME_CONFIG: GameConfig = {
  format: '3v3',
  maxHandSize: 6,
  maxVictoryPoints: 3,
  boardDimensions: { width: 12, height: 14 },
  playerTerritoryRows: 3
};