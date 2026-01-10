/**
 * Card Definition Types
 *
 * Card definitions are templates/blueprints for cards.
 * They use a definitionId (e.g., "001-blast-bolt") instead of a unique CardId.
 * When a card is instantiated (added to deck, drawn, etc.), a unique CardId is generated.
 */

import type {
  Attribute,
  CardDestination,
  GrowthRates,
  Rarity,
  Speed,
  Stats,
} from '../state/base';
import type { Effect, Requirement, SelectionPrompt } from '../state/effects';
import type {
  Species,
  RoleFamily,
  RoleTier,
  EquipmentSlot,
  TriggerCondition,
} from '../state/cards';

/**
 * Base properties shared by all card definitions.
 */
export interface BaseCardDefinition {
  /** Unique identifier for this card definition (e.g., "001-blast-bolt") */
  definitionId: string;
  /** Display name */
  name: string;
  /** Card type discriminator */
  type: CardDefinitionType;
  /** Card rarity */
  rarity: Rarity;
  /** Elemental attribute */
  attribute: Attribute;
  /** Flavor text (optional) */
  flavorText?: string;
  /** Set identifier (e.g., "alpha") */
  set?: string;
  /** Card number within set */
  cardNumber?: number;
}

/**
 * All card definition types.
 */
export type CardDefinitionType =
  | 'summon'
  | 'action'
  | 'reaction'
  | 'counter'
  | 'building'
  | 'quest'
  | 'role'
  | 'equipment'
  | 'weapon'
  | 'advance';

/**
 * Summon card definition - species template for generating unique summons.
 * Actual summon cards are procedurally generated at pack opening time.
 */
export interface SummonCardDefinition extends BaseCardDefinition {
  type: 'summon';
  species: Species;
  /** Base stats template (may have variance when generated) */
  baseStats: Stats;
  /** Growth rates template */
  growthRates: GrowthRates;
}

/**
 * Action card definition - instant effect cards.
 */
export interface ActionCardDefinition extends BaseCardDefinition {
  type: 'action';
  speed: Speed;
  destination: CardDestination;
  requirements: Requirement[];
  selectionPrompts: SelectionPrompt[];
  effects: Effect[];
}

/**
 * Reaction card definition - flexible response cards.
 */
export interface ReactionCardDefinition extends BaseCardDefinition {
  type: 'reaction';
  speed: 'reaction';
  destination: CardDestination;
  requirements: Requirement[];
  selectionPrompts: SelectionPrompt[];
  effects: Effect[];
}

/**
 * Counter card definition - triggered defense cards.
 */
export interface CounterCardDefinition extends BaseCardDefinition {
  type: 'counter';
  speed: 'counter';
  destination: CardDestination;
  triggerCondition: TriggerCondition;
  requirements: Requirement[];
  effects: Effect[];
}

/**
 * Building card definition - persistent board structures.
 */
export interface BuildingCardDefinition extends BaseCardDefinition {
  type: 'building';
  destination: 'discard';
  dimensions: { width: number; height: number };
  requirements: Requirement[];
  ongoingEffects: Effect[];
  destroyEffects: Effect[];
  isTrap: boolean;
  trapTrigger?: TriggerCondition;
}

/**
 * Quest card definition - objective-based challenges.
 */
export interface QuestCardDefinition extends BaseCardDefinition {
  type: 'quest';
  destination: CardDestination;
  requirements: Requirement[];
  completionCondition: TriggerCondition;
  failureCondition?: TriggerCondition;
  activationControl: 'owner' | 'opponent' | 'either';
  vpReward: number;
  completionEffects: Effect[];
  failureEffects?: Effect[];
  ongoingEffects: Effect[];
}

/**
 * Role definition for role and advance cards.
 */
export interface RoleDefinitionData {
  name: string;
  family: RoleFamily;
  tier: RoleTier;
  /** Stat modifiers as percentages (e.g., 0.25 = +25%) */
  statModifiers: Partial<Record<keyof Stats, number>>;
  passiveEffects: Effect[];
  abilities: AbilityDefinition[];
}

/**
 * Ability definition for roles.
 */
export interface AbilityDefinition {
  id: string;
  name: string;
  speed: Speed;
  requirements: Requirement[];
  selectionPrompts: SelectionPrompt[];
  effects: Effect[];
  cooldown: number;
}

/**
 * Role card definition - defines a role that summons can have.
 */
export interface RoleCardDefinition extends BaseCardDefinition {
  type: 'role';
  role: RoleDefinitionData;
  /** Which roles can advance to this one */
  advancesFrom?: string[];
  /** Which roles this can advance to */
  advancesTo?: string[];
}

/**
 * Equipment card definition - generic equipment.
 */
export interface EquipmentCardDefinition extends BaseCardDefinition {
  type: 'equipment';
  slot: EquipmentSlot;
  requirements: Requirement[];
  statBonuses: Partial<Stats>;
  effects: Effect[];
}

/**
 * Weapon card definition - weapon-specific equipment.
 */
export interface WeaponCardDefinition extends BaseCardDefinition {
  type: 'weapon';
  slot: 'weapon';
  requirements: Requirement[];
  statBonuses: Partial<Stats>;
  effects: Effect[];
  /** Weapon power for damage formula */
  weaponPower: number;
  /** Attack range in grid spaces */
  attackRange: number;
  /** Is this a magical weapon (uses INT instead of STR)? */
  isMagical: boolean;
  /** Base accuracy for this weapon */
  baseAccuracy: number;
}

/**
 * Advance card definition - role progression cards.
 */
export interface AdvanceCardDefinition extends BaseCardDefinition {
  type: 'advance';
  /** Is this a Named Summon transformation? */
  isNamedSummon: boolean;
  requirements: Requirement[];
  /** Role granted by this advancement */
  newRole: RoleDefinitionData;
  /** Effects applied on advancement */
  effects: Effect[];
  /** Name for Named Summons */
  namedSummonName?: string;
}

/**
 * Union of all card definition types.
 */
export type CardDefinition =
  | SummonCardDefinition
  | ActionCardDefinition
  | ReactionCardDefinition
  | CounterCardDefinition
  | BuildingCardDefinition
  | QuestCardDefinition
  | RoleCardDefinition
  | EquipmentCardDefinition
  | WeaponCardDefinition
  | AdvanceCardDefinition;

/**
 * Type guard for summon card definitions.
 */
export function isSummonDefinition(def: CardDefinition): def is SummonCardDefinition {
  return def.type === 'summon';
}

/**
 * Type guard for action card definitions.
 */
export function isActionDefinition(def: CardDefinition): def is ActionCardDefinition {
  return def.type === 'action';
}

/**
 * Type guard for reaction card definitions.
 */
export function isReactionDefinition(def: CardDefinition): def is ReactionCardDefinition {
  return def.type === 'reaction';
}

/**
 * Type guard for counter card definitions.
 */
export function isCounterDefinition(def: CardDefinition): def is CounterCardDefinition {
  return def.type === 'counter';
}

/**
 * Type guard for building card definitions.
 */
export function isBuildingDefinition(def: CardDefinition): def is BuildingCardDefinition {
  return def.type === 'building';
}

/**
 * Type guard for quest card definitions.
 */
export function isQuestDefinition(def: CardDefinition): def is QuestCardDefinition {
  return def.type === 'quest';
}

/**
 * Type guard for role card definitions.
 */
export function isRoleDefinition(def: CardDefinition): def is RoleCardDefinition {
  return def.type === 'role';
}

/**
 * Type guard for equipment card definitions (including weapons).
 */
export function isEquipmentDefinition(def: CardDefinition): def is EquipmentCardDefinition | WeaponCardDefinition {
  return def.type === 'equipment' || def.type === 'weapon';
}

/**
 * Type guard for weapon card definitions.
 */
export function isWeaponDefinition(def: CardDefinition): def is WeaponCardDefinition {
  return def.type === 'weapon';
}

/**
 * Type guard for advance card definitions.
 */
export function isAdvanceDefinition(def: CardDefinition): def is AdvanceCardDefinition {
  return def.type === 'advance';
}
