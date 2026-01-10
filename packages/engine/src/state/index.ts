/**
 * State module - all game state types and interfaces
 */

// Base types
export type {
  Attribute,
  CardDestination,
  CardId,
  EntityId,
  GridPosition,
  GrowthRates,
  GrowthRateSymbol,
  PlayerIndex,
  QuestId,
  Rarity,
  Speed,
  Stats,
  UnitId,
} from './base';

// Card types
export type {
  Ability,
  ActionCard,
  AdvanceCard,
  BaseCard,
  BuildingCard,
  Card,
  CardType,
  CounterCard,
  EquipmentCard,
  EquipmentSlot,
  QuestCard,
  ReactionCard,
  RoleCard,
  RoleDefinition,
  RoleFamily,
  RoleTier,
  Species,
  SummonCard,
  TriggerCondition,
  WeaponCard,
} from './cards';

// Effect types
export type {
  Effect,
  EffectStack,
  Requirement,
  Selection,
  SelectionPrompt,
  StackEntry,
  StatusEffect,
} from './effects';
export { createEmptyStack } from './effects';

// Unit types
export type {
  Board,
  BoardCell,
  Building,
  EquipmentLoadout,
  SummonUnit,
} from './units';
export {
  BOARD_HEIGHT,
  BOARD_WIDTH,
  createEmptyBoard,
  PLAYER_0_TERRITORY_ROWS,
  PLAYER_1_TERRITORY_ROWS,
} from './units';

// Player types
export type { InPlayCard, PlayerState, SummonSlot } from './player';
export {
  createInitialPlayerState,
  MAX_HAND_SIZE,
  SUMMON_DRAW_COUNT,
} from './player';

// Turn types
export type { TurnPhase, TurnState, UnitTurnActions } from './turn';
export {
  createInitialTurnState,
  createUnitTurnActions,
  PHASE_ORDER,
  resetUnitTurnActions,
} from './turn';

// Game types
export type {
  DispatchResult,
  GameAction,
  GameEngine,
  GameEvent,
  GameState,
  PendingPrompt,
} from './game';
export { VP_FOR_TIER_1_DEFEAT, VP_FOR_TIER_2_PLUS_DEFEAT, VP_TO_WIN } from './game';

// Event types
export type {
  AttackDeclaredEvent,
  AttackHitEvent,
  AttackMissedEvent,
  CardDiscardedEvent,
  CardDrawnEvent,
  CardPlayedEvent,
  DamageTakenEvent,
  EffectAddedToStackEvent,
  EffectResolvedEvent,
  GameEndedEvent,
  HealAppliedEvent,
  KnownGameEvent,
  PhaseChangeEvent,
  PriorityPassedEvent,
  RoleAdvancedEvent,
  StatusEffectAppliedEvent,
  StatusEffectRemovedEvent,
  TurnEndEvent,
  TurnStartEvent,
  UnitDefeatedEvent,
  UnitLevelUpEvent,
  UnitMovedEvent,
  UnitSpawnedEvent,
  VictoryPointsGainedEvent,
} from './events';
export { createEvent } from './events';
