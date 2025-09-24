import { Schema, type, MapSchema } from '@colyseus/schema';
import { CardType, Attribute, ActionSpeed, RoleFamily, Stat } from '../types';
import { Stats, GrowthRates } from './Properties';

export class Card extends Schema {
  @type('string') id: string; // Unique identifier for the card definition, e.g., "alpha-001"
  @type('string') instanceId: string; // Unique identifier for this instance of the card in the game
  @type('string') name: string;
  @type('string') type: CardType;
  @type('string') rarity: string;
  @type('string') attribute: Attribute;
  @type('string') description: string;
}

export class ActionCard extends Card {
  @type('string') speed: ActionSpeed;
  // Requirements will be handled by server logic based on card ID
}

export class EquipmentCard extends Card {
  @type('string') slot: 'Weapon' | 'Offhand' | 'Armor' | 'Accessory';
  @type('number') power?: number;
  @type('number') range?: number;
  @type('string') damageStat?: Stat;
  @type({ map: 'number' }) statBonuses = new MapSchema<number>();
}

export class SummonCard extends Card {
  @type(Stats) baseStats = new Stats();
  @type(GrowthRates) growthRates = new GrowthRates();
  @type('string') species: string;
  @type('string') role: string;
  @type({ map: EquipmentCard }) equipment = new MapSchema<EquipmentCard>();
}

export class BuildingCard extends Card {
  @type('number') width: number;
  @type('number') height: number;
}

export class QuestCard extends Card {
  // Quest logic is highly specific and will be handled by the server based on card ID
}

export class RoleCard extends Card {
  @type('number') tier: number;
  @type('string') family: RoleFamily;
  @type({ map: 'number' }) statModifiers = new MapSchema<number>();
}

export class AdvanceCard extends Card {
    // Advance logic is highly specific and will be handled by the server based on card ID
}

export class CounterCard extends Card {
    // Counter logic is highly specific and will be handled by the server based on card ID
}

export class ReactionCard extends Card {
    // Reaction logic is highly specific and will be handled by the server based on card ID
}
