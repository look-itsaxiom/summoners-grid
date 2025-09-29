/**
 * Action and event types for game engine
 */

import { PlayerId, CardId, SummonId, Coordinate, Phase, SpeedLevel } from './base';
import { Card } from './card';

// Action types that players can perform
export enum ActionType {
  PlayCard = 'playCard',
  MoveSummon = 'moveSummon', 
  AttackWithSummon = 'attackWithSummon',
  ActivateAbility = 'activateAbility',
  PassPriority = 'passPriority',
  AdvancePhase = 'advancePhase',
  PlayAdvanceCard = 'playAdvanceCard'
}

// Base action interface
export interface BaseAction {
  type: ActionType;
  playerId: PlayerId;
  timestamp: number;
}

// Specific action implementations
export interface PlayCardAction extends BaseAction {
  type: ActionType.PlayCard;
  cardId: CardId;
  targets?: any[];
  position?: Coordinate; // For summons/buildings
}

export interface MoveSummonAction extends BaseAction {
  type: ActionType.MoveSummon;
  summonId: SummonId;
  fromPosition: Coordinate;
  toPosition: Coordinate;
  movementCost: number;
}

export interface AttackAction extends BaseAction {
  type: ActionType.AttackWithSummon;
  attackerId: SummonId;
  targetId: SummonId;
  position?: Coordinate; // For positional attacks
}

export interface ActivateAbilityAction extends BaseAction {
  type: ActionType.ActivateAbility;
  sourceId: CardId | SummonId;
  abilityId: string;
  targets?: any[];
}

export interface PassPriorityAction extends BaseAction {
  type: ActionType.PassPriority;
}

export interface AdvancePhaseAction extends BaseAction {
  type: ActionType.AdvancePhase;
  fromPhase: Phase;
  toPhase: Phase;
}

export interface PlayAdvanceCardAction extends BaseAction {
  type: ActionType.PlayAdvanceCard;
  cardId: CardId;
  targetSummonId: SummonId;
}

// Union type for all actions
export type GameAction = 
  | PlayCardAction 
  | MoveSummonAction 
  | AttackAction 
  | ActivateAbilityAction
  | PassPriorityAction
  | AdvancePhaseAction
  | PlayAdvanceCardAction;

// Action validation result
export interface ActionValidation {
  isValid: boolean;
  errors: string[];
  requiredResources?: Record<string, number>;
  alternativeActions?: GameAction[];
}

// Event types for trigger system based on GDD: Effect System - Trigger System
export enum EventType {
  // Game flow events
  GameStarted = 'gameStarted',
  TurnStarted = 'turnStarted', 
  TurnEnded = 'turnEnded',
  PhaseStarted = 'phaseStarted',
  PhaseEnded = 'phaseEnded',
  
  // Card events
  CardPlayed = 'cardPlayed',
  CardEntersPlay = 'cardEntersPlay',
  CardLeavesPlay = 'cardLeavesPlay',
  CardDrawn = 'cardDrawn',
  CardDiscarded = 'cardDiscarded',
  
  // Summon events
  SummonDeployed = 'summonDeployed',
  SummonDefeated = 'summonDefeated',
  SummonMoved = 'summonMoved',
  SummonAttacked = 'summonAttacked',
  SummonDamaged = 'summonDamaged',
  SummonLeveled = 'summonLeveled',
  
  // Effect events
  EffectActivated = 'effectActivated',
  EffectResolved = 'effectResolved',
  TriggerActivated = 'triggerActivated',
  
  // Priority events
  PriorityPassed = 'priorityPassed',
  PriorityRetained = 'priorityRetained',
  
  // Victory events
  VictoryPointAwarded = 'victoryPointAwarded',
  GameEnded = 'gameEnded'
}

// Event data structures
export interface GameStartedEvent {
  type: EventType.GameStarted;
  players: PlayerId[];
  firstPlayer: PlayerId;
}

export interface CardPlayedEvent {
  type: EventType.CardPlayed;
  playerId: PlayerId;
  card: Card;
  targets?: any[];
  position?: Coordinate;
}

export interface SummonDeployedEvent {
  type: EventType.SummonDeployed;
  playerId: PlayerId;
  summonId: SummonId;
  cardId: CardId;
  position: Coordinate;
}

export interface SummonDefeatedEvent {
  type: EventType.SummonDefeated;
  summonId: SummonId;
  ownerId: PlayerId;
  killerId?: PlayerId;
  position: Coordinate;
}

export interface EffectResolvedEvent {
  type: EventType.EffectResolved;
  effectId: string;
  sourceCardId: CardId;
  ownerId: PlayerId;
  targets: any[];
  results: any[];
}

export interface PhaseStartedEvent {
  type: EventType.PhaseStarted;
  phase: Phase;
  playerId: PlayerId;
  turnNumber: number;
}

// Generic event wrapper
export interface GameEventData {
  id: string;
  type: EventType;
  timestamp: number;
  playerId: PlayerId;
  data: any; // Specific event data
}