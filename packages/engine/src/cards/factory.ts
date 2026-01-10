/**
 * Card Instance Factory
 *
 * Creates runtime card instances from card definitions.
 * Each card instance has a unique CardId generated at creation time.
 */

import type { CardId, Stats, GrowthRates } from '../state/base';
import type {
  Card,
  SummonCard,
  ActionCard,
  ReactionCard,
  CounterCard,
  BuildingCard,
  QuestCard,
  RoleCard,
  EquipmentCard,
  WeaponCard,
  AdvanceCard,
  RoleDefinition,
  Ability,
} from '../state/cards';
import type {
  CardDefinition,
  SummonCardDefinition,
  ActionCardDefinition,
  ReactionCardDefinition,
  CounterCardDefinition,
  BuildingCardDefinition,
  QuestCardDefinition,
  RoleCardDefinition,
  EquipmentCardDefinition,
  WeaponCardDefinition,
  AdvanceCardDefinition,
  RoleDefinitionData,
  AbilityDefinition,
} from './definitions';

/**
 * Generate a unique card ID.
 */
function generateCardId(): CardId {
  return `card-${Date.now()}-${Math.random().toString(36).slice(2)}` as CardId;
}

/**
 * Options for creating a summon card instance.
 */
export interface CreateSummonOptions {
  /** Override base stats (for procedural generation with variance) */
  baseStats?: Stats;
  /** Override growth rates (for procedural generation) */
  growthRates?: GrowthRates;
  /** Opener ID for digital provenance */
  openerId: string;
  /** Timestamp for digital provenance (defaults to now) */
  timestamp?: number;
}

/**
 * Generate a simple hash for summon provenance.
 * In production, this should be a proper cryptographic signature.
 */
function generateProvenanceHash(
  definitionId: string,
  openerId: string,
  timestamp: number
): string {
  const data = `${definitionId}:${openerId}:${timestamp}`;
  // Simple hash for now - in production use proper crypto
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(36);
}

/**
 * Convert RoleDefinitionData to RoleDefinition.
 */
function toRoleDefinition(data: RoleDefinitionData): RoleDefinition {
  return {
    name: data.name,
    family: data.family,
    tier: data.tier,
    statModifiers: data.statModifiers,
    passiveEffects: data.passiveEffects,
    abilities: data.abilities.map(toAbility),
  };
}

/**
 * Convert AbilityDefinition to Ability.
 */
function toAbility(data: AbilityDefinition): Ability {
  return {
    id: data.id,
    name: data.name,
    speed: data.speed,
    requirements: data.requirements,
    selectionPrompts: data.selectionPrompts,
    effects: data.effects,
    cooldown: data.cooldown,
  };
}

/**
 * Create a summon card instance from a definition.
 * Summons are procedurally generated with digital provenance.
 */
export function createSummonCard(
  definition: SummonCardDefinition,
  options: CreateSummonOptions
): SummonCard {
  const timestamp = options.timestamp ?? Date.now();

  return {
    id: generateCardId(),
    name: definition.name,
    type: 'summon',
    rarity: definition.rarity,
    attribute: definition.attribute,
    species: definition.species,
    baseStats: options.baseStats ?? { ...definition.baseStats },
    growthRates: options.growthRates ?? { ...definition.growthRates },
    signature: {
      timestamp,
      openerId: options.openerId,
      hash: generateProvenanceHash(definition.definitionId, options.openerId, timestamp),
    },
  };
}

/**
 * Create an action card instance from a definition.
 */
export function createActionCard(definition: ActionCardDefinition): ActionCard {
  return {
    id: generateCardId(),
    name: definition.name,
    type: 'action',
    rarity: definition.rarity,
    attribute: definition.attribute,
    speed: definition.speed,
    destination: definition.destination,
    requirements: [...definition.requirements],
    selectionPrompts: [...definition.selectionPrompts],
    effects: [...definition.effects],
  };
}

/**
 * Create a reaction card instance from a definition.
 */
export function createReactionCard(definition: ReactionCardDefinition): ReactionCard {
  return {
    id: generateCardId(),
    name: definition.name,
    type: 'reaction',
    rarity: definition.rarity,
    attribute: definition.attribute,
    speed: 'reaction',
    destination: definition.destination,
    requirements: [...definition.requirements],
    selectionPrompts: [...definition.selectionPrompts],
    effects: [...definition.effects],
  };
}

/**
 * Create a counter card instance from a definition.
 */
export function createCounterCard(definition: CounterCardDefinition): CounterCard {
  return {
    id: generateCardId(),
    name: definition.name,
    type: 'counter',
    rarity: definition.rarity,
    attribute: definition.attribute,
    speed: 'counter',
    destination: 'discard',
    triggerCondition: { ...definition.triggerCondition },
    requirements: [...definition.requirements],
    effects: [...definition.effects],
  };
}

/**
 * Create a building card instance from a definition.
 */
export function createBuildingCard(definition: BuildingCardDefinition): BuildingCard {
  return {
    id: generateCardId(),
    name: definition.name,
    type: 'building',
    rarity: definition.rarity,
    attribute: definition.attribute,
    destination: 'discard',
    dimensions: { ...definition.dimensions },
    requirements: [...definition.requirements],
    ongoingEffects: [...definition.ongoingEffects],
    destroyEffects: [...definition.destroyEffects],
    isTrap: definition.isTrap,
    trapTrigger: definition.trapTrigger ? { ...definition.trapTrigger } : undefined,
  };
}

/**
 * Create a quest card instance from a definition.
 */
export function createQuestCard(definition: QuestCardDefinition): QuestCard {
  return {
    id: generateCardId(),
    name: definition.name,
    type: 'quest',
    rarity: definition.rarity,
    attribute: definition.attribute,
    destination: definition.destination,
    requirements: [...definition.requirements],
    completionCondition: { ...definition.completionCondition },
    failureCondition: definition.failureCondition
      ? { ...definition.failureCondition }
      : undefined,
    activationControl: definition.activationControl,
    vpReward: definition.vpReward,
    completionEffects: [...definition.completionEffects],
    failureEffects: definition.failureEffects
      ? [...definition.failureEffects]
      : undefined,
    ongoingEffects: [...definition.ongoingEffects],
  };
}

/**
 * Create a role card instance from a definition.
 */
export function createRoleCard(definition: RoleCardDefinition): RoleCard {
  return {
    id: generateCardId(),
    name: definition.name,
    type: 'role',
    rarity: definition.rarity,
    attribute: definition.attribute,
    role: toRoleDefinition(definition.role),
  };
}

/**
 * Create an equipment card instance from a definition.
 */
export function createEquipmentCard(definition: EquipmentCardDefinition): EquipmentCard {
  return {
    id: generateCardId(),
    name: definition.name,
    type: 'equipment',
    rarity: definition.rarity,
    attribute: definition.attribute,
    slot: definition.slot,
    requirements: [...definition.requirements],
    statBonuses: { ...definition.statBonuses },
    effects: [...definition.effects],
  };
}

/**
 * Create a weapon card instance from a definition.
 */
export function createWeaponCard(definition: WeaponCardDefinition): WeaponCard {
  return {
    id: generateCardId(),
    name: definition.name,
    type: 'equipment',
    rarity: definition.rarity,
    attribute: definition.attribute,
    slot: 'weapon',
    requirements: [...definition.requirements],
    statBonuses: { ...definition.statBonuses },
    effects: [...definition.effects],
    weaponPower: definition.weaponPower,
    attackRange: definition.attackRange,
    isMagical: definition.isMagical,
    baseAccuracy: definition.baseAccuracy,
  };
}

/**
 * Create an advance card instance from a definition.
 */
export function createAdvanceCard(definition: AdvanceCardDefinition): AdvanceCard {
  return {
    id: generateCardId(),
    name: definition.name,
    type: 'advance',
    rarity: definition.rarity,
    attribute: definition.attribute,
    isNamedSummon: definition.isNamedSummon,
    requirements: [...definition.requirements],
    newRole: toRoleDefinition(definition.newRole),
    effects: [...definition.effects],
  };
}

/**
 * Create a card instance from any definition.
 * For summon cards, you must provide CreateSummonOptions.
 */
export function createCard(
  definition: CardDefinition,
  options?: CreateSummonOptions
): Card {
  switch (definition.type) {
    case 'summon':
      if (!options) {
        throw new Error('CreateSummonOptions required for summon cards');
      }
      return createSummonCard(definition, options);

    case 'action':
      return createActionCard(definition);

    case 'reaction':
      return createReactionCard(definition);

    case 'counter':
      return createCounterCard(definition);

    case 'building':
      return createBuildingCard(definition);

    case 'quest':
      return createQuestCard(definition);

    case 'role':
      return createRoleCard(definition);

    case 'equipment':
      return createEquipmentCard(definition);

    case 'weapon':
      return createWeaponCard(definition);

    case 'advance':
      return createAdvanceCard(definition);

    default:
      throw new Error(`Unknown card type: ${(definition as CardDefinition).type}`);
  }
}

/**
 * Create multiple card instances from definitions.
 * Returns a tuple of [cards, errors] for partial success handling.
 */
export function createCards(
  definitions: CardDefinition[],
  defaultOptions?: CreateSummonOptions
): [Card[], Error[]] {
  const cards: Card[] = [];
  const errors: Error[] = [];

  for (const def of definitions) {
    try {
      if (def.type === 'summon' && !defaultOptions) {
        errors.push(new Error(`Summon card ${def.definitionId} requires CreateSummonOptions`));
        continue;
      }
      cards.push(createCard(def, defaultOptions));
    } catch (e) {
      errors.push(e as Error);
    }
  }

  return [cards, errors];
}

/**
 * Clone a card with a new unique ID.
 * Useful for creating copies of cards (e.g., token generation).
 */
export function cloneCard(card: Card): Card {
  return {
    ...card,
    id: generateCardId(),
  };
}
