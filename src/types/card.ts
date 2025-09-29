/**
 * Card-related types based on GDD and Alpha Cards documentation
 */

import { CardId, PlayerId, Coordinate, Attribute, SpeedLevel, CardType, RoleType } from './base';

// Base stats for summons from GDD: Summon System
export interface BaseStats {
  str: number;     // Strength - physical attack power
  end: number;     // Endurance - HP calculation
  def: number;     // Defense - physical damage reduction
  int: number;     // Intelligence - magical power
  spi: number;     // Spirit - magical defense base
  mdf: number;     // Magical Defense - magical damage reduction
  spd: number;     // Speed - turn order, dodge chance
  lck: number;     // Luck - critical hit chance
  acc: number;     // Accuracy - hit chance
}

// Growth rates for level progression
export interface GrowthRates extends BaseStats {}

// Calculated combat stats
export interface CombatStats {
  hp: number;
  maxHp: number;
  movement: number;
  attackRange: number;
  level: number;
}

// Equipment slot types from GDD: Equipment System
export enum EquipmentSlot {
  Weapon = 'weapon',
  Offhand = 'offhand', 
  Armor = 'armor',
  Accessory = 'accessory'
}

// Equipment card definition
export interface Equipment {
  id: CardId;
  name: string;
  slot: EquipmentSlot;
  basePower?: number;
  statModifiers: Partial<BaseStats>;
  effects: EffectDefinition[];
}

// Cost types for playing cards
export interface Cost {
  type: 'none' | 'role_requirement' | 'resource' | 'sacrifice';
  requirements?: {
    roles?: RoleType[];
    boardState?: string; // Specific board state conditions like "control 2+ summons"
    resources?: Record<string, number>;
  };
}

// Effect definition from GDD: Effect System
export interface EffectDefinition {
  id: string;
  name: string;
  description: string;
  effectId: string; // References EffectRegistry
  parameters: Record<string, any>;
}

// Trigger definition from GDD: Effect System - Trigger System  
export interface TriggerDefinition {
  event: TriggerEvent;
  condition?: string; // Condition expression for trigger activation
  effectRef: string;
  timing: 'immediate' | 'stack';
}

// Common trigger events from GDD
export enum TriggerEvent {
  OnPlay = 'onPlay',
  OnDefeat = 'onDefeat',  
  PhaseStart = 'phaseStart',
  PhaseEnd = 'phaseEnd',
  OnDamage = 'onDamage',
  OnAttack = 'onAttack',
  OnMove = 'onMove',
  OnLevelUp = 'onLevelUp'
}

// Base card interface
export interface BaseCard {
  id: CardId;
  name: string;
  type: CardType;
  attribute: Attribute;
  speed: SpeedLevel;
  cost: Cost;
  text: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
}

// Summon card from GDD: Summon System
export interface SummonCard extends BaseCard {
  type: CardType.Summon;
  species: string;
  role: RoleType;
  baseStats: BaseStats;
  growthRates: GrowthRates;
  equipment: Equipment[];
  triggers: TriggerDefinition[];
  passiveEffects: EffectDefinition[];
}

// Action card from GDD: Card Types
export interface ActionCard extends BaseCard {
  type: CardType.Action;
  effects: EffectDefinition[];
  targetType: 'none' | 'summon' | 'player' | 'zone' | 'coordinate';
  range?: 'any' | number;
}

// Building card from GDD: Card Types  
export interface BuildingCard extends BaseCard {
  type: CardType.Building;
  dimensions: { width: number; height: number };
  effects: EffectDefinition[];
  triggers: TriggerDefinition[];
  isDestroyed?: boolean;
}

// Quest card from GDD: Card Types
export interface QuestCard extends BaseCard {
  type: CardType.Quest;
  objective: string;
  failureCondition?: string;
  reward: EffectDefinition;
  failurePenalty?: EffectDefinition;
  canActivate: 'owner' | 'opponent' | 'either';
}

// Counter card from GDD: Card Types
export interface CounterCard extends BaseCard {
  type: CardType.Counter;
  speed: SpeedLevel.Counter;
  triggerCondition: string;
  effect: EffectDefinition;
  isFaceDown: boolean;
}

// Advance card from GDD: Card Types
export interface AdvanceCard extends BaseCard {
  type: CardType.Advance;
  requirements: {
    role: RoleType;
    level?: number;
    questsCompleted?: string[];
  };
  effect: EffectDefinition;
}

// Role card for role system
export interface RoleCard extends BaseCard {
  type: CardType.Role;
  roleType: RoleType;
  tier: 1 | 2 | 3;
  statModifiers: Partial<BaseStats>;
  abilities: EffectDefinition[];
}

// Union type for all cards
export type Card = SummonCard | ActionCard | BuildingCard | QuestCard | CounterCard | AdvanceCard | RoleCard;

// Card in play with runtime state
export interface CardInPlay {
  id: CardId;
  name: string;
  type: CardType;
  attribute: Attribute;
  speed: SpeedLevel;
  cost: Cost;
  text: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  ownerId: PlayerId;
  position?: Coordinate;
  isTapped?: boolean;
  damage?: number;
  modifications: EffectDefinition[];
  counters: Record<string, number>;
}

export { EffectDefinition as Effect, TriggerDefinition as Trigger };