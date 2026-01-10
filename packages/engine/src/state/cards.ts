/**
 * Card type definitions
 */

import type {
  Attribute,
  CardDestination,
  CardId,
  GrowthRates,
  Rarity,
  Speed,
  Stats,
} from './base';
import type { Effect, Requirement, SelectionPrompt } from './effects';

/** Species types available in the game */
export type Species =
  | 'gignen'
  | 'fae'
  | 'stoneheart'
  | 'wilderling'
  | 'angar'
  | 'demar'
  | 'creptilis';

/** Card types */
export type CardType =
  | 'summon'
  | 'action'
  | 'reaction'
  | 'counter'
  | 'building'
  | 'quest'
  | 'role'
  | 'equipment'
  | 'advance';

/** Base card properties shared by all cards */
export interface BaseCard {
  id: CardId;
  name: string;
  type: CardType;
  rarity: Rarity;
  attribute: Attribute;
}

/** Summon card - unique generated units */
export interface SummonCard extends BaseCard {
  type: 'summon';
  species: Species;
  baseStats: Stats;
  growthRates: GrowthRates;
  /** Cryptographic signature for provenance */
  signature: {
    timestamp: number;
    openerId: string;
    hash: string;
  };
}

/** Action card - single-use effects */
export interface ActionCard extends BaseCard {
  type: 'action';
  speed: Speed;
  destination: CardDestination;
  requirements: Requirement[];
  selectionPrompts: SelectionPrompt[];
  effects: Effect[];
}

/** Reaction card - flexible response cards */
export interface ReactionCard extends BaseCard {
  type: 'reaction';
  speed: 'reaction';
  destination: CardDestination;
  requirements: Requirement[];
  selectionPrompts: SelectionPrompt[];
  effects: Effect[];
}

/** Counter card - triggered defense cards */
export interface CounterCard extends BaseCard {
  type: 'counter';
  speed: 'counter';
  destination: 'discard';
  /** Condition that triggers this counter */
  triggerCondition: TriggerCondition;
  requirements: Requirement[];
  effects: Effect[];
}

/** Building card - persistent board effects */
export interface BuildingCard extends BaseCard {
  type: 'building';
  destination: 'discard';
  /** Size of the building on the grid */
  dimensions: { width: number; height: number };
  requirements: Requirement[];
  /** Effects while building is in play */
  ongoingEffects: Effect[];
  /** Effects when building is destroyed */
  destroyEffects: Effect[];
  /** Is this a trap (played face-down)? */
  isTrap: boolean;
  /** Trigger condition for traps */
  trapTrigger?: TriggerCondition;
}

/** Quest card - objective-based rewards */
export interface QuestCard extends BaseCard {
  type: 'quest';
  destination: CardDestination;
  requirements: Requirement[];
  /** Condition to complete the quest */
  completionCondition: TriggerCondition;
  /** Condition that fails the quest (optional) */
  failureCondition?: TriggerCondition;
  /** Who can activate/complete: 'owner', 'opponent', 'either' */
  activationControl: 'owner' | 'opponent' | 'either';
  /** Victory points awarded on completion */
  vpReward: number;
  /** Effects when completed */
  completionEffects: Effect[];
  /** Effects when failed (optional) */
  failureEffects?: Effect[];
  /** Ongoing effects while active */
  ongoingEffects: Effect[];
}

/** Role card - defines summon's tier 1 role */
export interface RoleCard extends BaseCard {
  type: 'role';
  role: RoleDefinition;
}

/** Equipment slot types */
export type EquipmentSlot = 'weapon' | 'offhand' | 'armor' | 'accessory';

/** Equipment card - combat enhancement */
export interface EquipmentCard extends BaseCard {
  type: 'equipment';
  slot: EquipmentSlot;
  requirements: Requirement[];
  /** Stat bonuses provided */
  statBonuses: Partial<Stats>;
  /** Special effects while equipped */
  effects: Effect[];
}

/** Weapon-specific properties */
export interface WeaponCard extends EquipmentCard {
  slot: 'weapon';
  /** Weapon power for damage formula */
  weaponPower: number;
  /** Attack range in grid spaces */
  attackRange: number;
  /** Is this a magical weapon? */
  isMagical: boolean;
  /** Base accuracy for this weapon */
  baseAccuracy: number;
}

/** Advance card - role progression */
export interface AdvanceCard extends BaseCard {
  type: 'advance';
  /** Is this a Named Summon transformation? */
  isNamedSummon: boolean;
  requirements: Requirement[];
  /** New role after advancement */
  newRole: RoleDefinition;
  /** Effects on advancement */
  effects: Effect[];
}

/** Role family */
export type RoleFamily = 'warrior' | 'magician' | 'scout';

/** Role tier */
export type RoleTier = 1 | 2 | 3;

/** Role definition */
export interface RoleDefinition {
  name: string;
  family: RoleFamily;
  tier: RoleTier;
  /** Stat modifiers (multiplicative) */
  statModifiers: Partial<Record<keyof Stats, number>>;
  /** Passive abilities */
  passiveEffects: Effect[];
  /** Active abilities granted */
  abilities: Ability[];
}

/** Ability definition */
export interface Ability {
  id: string;
  name: string;
  speed: Speed;
  requirements: Requirement[];
  selectionPrompts: SelectionPrompt[];
  effects: Effect[];
  /** Cooldown in turns (0 = no cooldown) */
  cooldown: number;
}

/** Trigger condition for counters, traps, quests */
export interface TriggerCondition {
  type: string;
  params: Record<string, unknown>;
}

/** Union of all card types */
export type Card =
  | SummonCard
  | ActionCard
  | ReactionCard
  | CounterCard
  | BuildingCard
  | QuestCard
  | RoleCard
  | EquipmentCard
  | WeaponCard
  | AdvanceCard;
