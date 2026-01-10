/**
 * Game event type definitions.
 * These are emitted by the engine and consumed by the client for animation.
 */

import type { EntityId, GridPosition, PlayerIndex, UnitId } from './base';
import type { TurnPhase } from './turn';

/**
 * Event types for animation and logging.
 * Using string literal union for type safety while keeping flexibility.
 */

// Turn events
export interface TurnStartEvent {
  type: 'TURN_START';
  params: { turnNumber: number; activePlayer: PlayerIndex };
}

export interface PhaseChangeEvent {
  type: 'PHASE_CHANGE';
  params: { phase: TurnPhase; player: PlayerIndex };
}

export interface TurnEndEvent {
  type: 'TURN_END';
  params: { turnNumber: number; player: PlayerIndex };
}

// Card events
export interface CardDrawnEvent {
  type: 'CARD_DRAWN';
  params: { player: PlayerIndex; cardId: string; fromZone: string };
}

export interface CardPlayedEvent {
  type: 'CARD_PLAYED';
  params: { player: PlayerIndex; cardId: string; cardType: string };
}

export interface CardDiscardedEvent {
  type: 'CARD_DISCARDED';
  params: { player: PlayerIndex; cardId: string; toZone: string };
}

// Unit events
export interface UnitSpawnedEvent {
  type: 'UNIT_SPAWNED';
  params: { unitId: UnitId; owner: PlayerIndex; position: GridPosition };
}

export interface UnitMovedEvent {
  type: 'UNIT_MOVED';
  params: { unitId: UnitId; from: GridPosition; to: GridPosition; path?: GridPosition[] };
}

export interface UnitLevelUpEvent {
  type: 'UNIT_LEVEL_UP';
  params: { unitId: UnitId; newLevel: number };
}

export interface UnitDefeatedEvent {
  type: 'UNIT_DEFEATED';
  params: { unitId: UnitId; defeatedBy: EntityId; vpAwarded: number };
}

// Combat events
export interface AttackDeclaredEvent {
  type: 'ATTACK_DECLARED';
  params: { attackerId: UnitId; targetId: EntityId };
}

export interface AttackHitEvent {
  type: 'ATTACK_HIT';
  params: { attackerId: UnitId; targetId: EntityId; damage: number; isCritical: boolean };
}

export interface AttackMissedEvent {
  type: 'ATTACK_MISSED';
  params: { attackerId: UnitId; targetId: EntityId; hitChance: number };
}

export interface HealAppliedEvent {
  type: 'HEAL_APPLIED';
  params: { sourceId: EntityId; targetId: UnitId; amount: number; isCritical: boolean };
}

export interface DamageTakenEvent {
  type: 'DAMAGE_TAKEN';
  params: { targetId: UnitId; amount: number; source: EntityId; damageType: string };
}

// Effect events
export interface EffectAddedToStackEvent {
  type: 'EFFECT_ADDED_TO_STACK';
  params: { entryId: string; source: EntityId; speed: string };
}

export interface EffectResolvedEvent {
  type: 'EFFECT_RESOLVED';
  params: { entryId: string; effectType: string };
}

export interface StatusEffectAppliedEvent {
  type: 'STATUS_EFFECT_APPLIED';
  params: { targetId: UnitId; effectType: string; duration: number };
}

export interface StatusEffectRemovedEvent {
  type: 'STATUS_EFFECT_REMOVED';
  params: { targetId: UnitId; effectType: string };
}

// Priority events
export interface PriorityPassedEvent {
  type: 'PRIORITY_PASSED';
  params: { player: PlayerIndex };
}

// Victory events
export interface VictoryPointsGainedEvent {
  type: 'VICTORY_POINTS_GAINED';
  params: { player: PlayerIndex; amount: number; reason: string };
}

export interface GameEndedEvent {
  type: 'GAME_ENDED';
  params: { winner: PlayerIndex; reason: string };
}

// Role events
export interface RoleAdvancedEvent {
  type: 'ROLE_ADVANCED';
  params: { unitId: UnitId; fromRole: string; toRole: string };
}

// Selection events
export interface SelectionMadeEvent {
  type: 'SELECTION_MADE';
  params: { player: PlayerIndex; promptId: string; selection: EntityId | string };
}

// Play events
export interface SummonPlayedEvent {
  type: 'SUMMON_PLAYED';
  params: { player: PlayerIndex; cardId: string; unitId: string; position: GridPosition };
}

export interface CardSetEvent {
  type: 'CARD_SET';
  params: { player: PlayerIndex; cardId: string };
}

export interface BuildingPlayedEvent {
  type: 'BUILDING_PLAYED';
  params: { player: PlayerIndex; cardId: string; buildingId: EntityId; position: GridPosition };
}

export interface QuestPlayedEvent {
  type: 'QUEST_PLAYED';
  params: { player: PlayerIndex; cardId: string };
}

export interface CardRevealedEvent {
  type: 'CARD_REVEALED';
  params: { player: PlayerIndex; cardId: string };
}

// Game end events
export interface PlayerConcededEvent {
  type: 'PLAYER_CONCEDED';
  params: { player: PlayerIndex };
}

export interface GameEndEvent {
  type: 'GAME_END';
  params: { winner: PlayerIndex; reason: string };
}

/**
 * Union of all known event types.
 */
export type KnownGameEvent =
  | TurnStartEvent
  | PhaseChangeEvent
  | TurnEndEvent
  | CardDrawnEvent
  | CardPlayedEvent
  | CardDiscardedEvent
  | UnitSpawnedEvent
  | UnitMovedEvent
  | UnitLevelUpEvent
  | UnitDefeatedEvent
  | AttackDeclaredEvent
  | AttackHitEvent
  | AttackMissedEvent
  | HealAppliedEvent
  | DamageTakenEvent
  | EffectAddedToStackEvent
  | EffectResolvedEvent
  | StatusEffectAppliedEvent
  | StatusEffectRemovedEvent
  | PriorityPassedEvent
  | VictoryPointsGainedEvent
  | GameEndedEvent
  | RoleAdvancedEvent
  | SelectionMadeEvent
  | SummonPlayedEvent
  | CardSetEvent
  | BuildingPlayedEvent
  | QuestPlayedEvent
  | CardRevealedEvent
  | PlayerConcededEvent
  | GameEndEvent;

/**
 * Helper to create typed events.
 */
export function createEvent<T extends KnownGameEvent>(
  type: T['type'],
  params: T['params']
): T {
  return { type, params } as T;
}
