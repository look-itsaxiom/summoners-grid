/**
 * Card Definition Loader
 *
 * Loads and validates card definitions from JSON data.
 * Provides runtime validation to ensure data integrity.
 */

import type { Attribute, Rarity, Speed, Stats, GrowthRates, CardDestination } from '../state/base';
import type { RoleFamily, RoleTier, EquipmentSlot, Species } from '../state/cards';
import type {
  CardDefinition,
  CardDefinitionType,
  ActionCardDefinition,
  ReactionCardDefinition,
  CounterCardDefinition,
  BuildingCardDefinition,
  QuestCardDefinition,
  RoleCardDefinition,
  EquipmentCardDefinition,
  WeaponCardDefinition,
  AdvanceCardDefinition,
  SummonCardDefinition,
  RoleDefinitionData,
  AbilityDefinition,
} from './definitions';
import type { Effect, Requirement, SelectionPrompt } from '../state/effects';
import type { TriggerCondition } from '../state/cards';
import { CardRegistry } from './registry';

/**
 * Validation error with path information.
 */
export class CardValidationError extends Error {
  constructor(
    message: string,
    public readonly path: string,
    public readonly definitionId?: string
  ) {
    super(`${definitionId ? `[${definitionId}] ` : ''}${path}: ${message}`);
    this.name = 'CardValidationError';
  }
}

/**
 * Result of loading card definitions.
 */
export interface LoadResult {
  success: boolean;
  loaded: number;
  errors: CardValidationError[];
}

// Valid value sets for validation
const VALID_TYPES: CardDefinitionType[] = [
  'summon', 'action', 'reaction', 'counter', 'building',
  'quest', 'role', 'equipment', 'weapon', 'advance'
];

const VALID_RARITIES: Rarity[] = ['common', 'uncommon', 'rare', 'legend', 'myth'];

const VALID_ATTRIBUTES: Attribute[] = [
  'fire', 'water', 'earth', 'wind', 'light', 'dark', 'neutral'
];

const VALID_SPEEDS: Speed[] = ['action', 'reaction', 'counter'];

const VALID_DESTINATIONS: CardDestination[] = ['discard', 'recharge', 'removed'];

const VALID_SPECIES: Species[] = [
  'gignen', 'fae', 'stoneheart', 'wilderling', 'angar', 'demar', 'creptilis'
];

const VALID_ROLE_FAMILIES: RoleFamily[] = ['warrior', 'magician', 'scout'];

const VALID_ROLE_TIERS: RoleTier[] = [1, 2, 3];

const VALID_EQUIPMENT_SLOTS: EquipmentSlot[] = ['weapon', 'offhand', 'armor', 'accessory'];

const STAT_KEYS: (keyof Stats)[] = ['STR', 'END', 'DEF', 'INT', 'SPI', 'MDF', 'SPD', 'ACC', 'LCK'];

/**
 * Validate that a value is one of the allowed values.
 */
function validateEnum<T>(value: unknown, allowed: T[], path: string, defId?: string): T {
  if (!allowed.includes(value as T)) {
    throw new CardValidationError(
      `Invalid value "${value}". Expected one of: ${allowed.join(', ')}`,
      path,
      defId
    );
  }
  return value as T;
}

/**
 * Validate that a value is a non-empty string.
 */
function validateString(value: unknown, path: string, defId?: string): string {
  if (typeof value !== 'string' || value.length === 0) {
    throw new CardValidationError('Expected non-empty string', path, defId);
  }
  return value;
}

/**
 * Validate that a value is a number.
 */
function validateNumber(value: unknown, path: string, defId?: string, min?: number, max?: number): number {
  if (typeof value !== 'number' || isNaN(value)) {
    throw new CardValidationError('Expected number', path, defId);
  }
  if (min !== undefined && value < min) {
    throw new CardValidationError(`Value must be >= ${min}`, path, defId);
  }
  if (max !== undefined && value > max) {
    throw new CardValidationError(`Value must be <= ${max}`, path, defId);
  }
  return value;
}

/**
 * Validate that a value is a boolean.
 */
function validateBoolean(value: unknown, path: string, defId?: string): boolean {
  if (typeof value !== 'boolean') {
    throw new CardValidationError('Expected boolean', path, defId);
  }
  return value;
}

/**
 * Validate that a value is an array.
 */
function validateArray<T>(value: unknown, path: string, defId?: string): T[] {
  if (!Array.isArray(value)) {
    throw new CardValidationError('Expected array', path, defId);
  }
  return value as T[];
}

/**
 * Validate that a value is an object.
 */
function validateObject(value: unknown, path: string, defId?: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new CardValidationError('Expected object', path, defId);
  }
  return value as Record<string, unknown>;
}

/**
 * Validate Stats object.
 */
function validateStats(value: unknown, path: string, defId?: string): Stats {
  const obj = validateObject(value, path, defId);
  const stats: Partial<Stats> = {};

  for (const key of STAT_KEYS) {
    if (!(key in obj)) {
      throw new CardValidationError(`Missing required stat: ${key}`, path, defId);
    }
    stats[key] = validateNumber(obj[key], `${path}.${key}`, defId, 0);
  }

  return stats as Stats;
}

/**
 * Validate GrowthRates object.
 */
function validateGrowthRates(value: unknown, path: string, defId?: string): GrowthRates {
  const obj = validateObject(value, path, defId);
  const rates: Partial<GrowthRates> = {};
  const validSymbols = ['--', '-', '_', '+', '++', '*'];

  for (const key of STAT_KEYS) {
    if (!(key in obj)) {
      throw new CardValidationError(`Missing required growth rate: ${key}`, path, defId);
    }
    const symbol = obj[key];
    if (!validSymbols.includes(symbol as string)) {
      throw new CardValidationError(
        `Invalid growth rate symbol "${symbol}". Expected: ${validSymbols.join(', ')}`,
        `${path}.${key}`,
        defId
      );
    }
    rates[key] = symbol as GrowthRates[keyof GrowthRates];
  }

  return rates as GrowthRates;
}

/**
 * Validate partial Stats (for bonuses).
 */
function validatePartialStats(value: unknown, path: string, defId?: string): Partial<Stats> {
  const obj = validateObject(value, path, defId);
  const stats: Partial<Stats> = {};

  for (const key of Object.keys(obj)) {
    if (!STAT_KEYS.includes(key as keyof Stats)) {
      throw new CardValidationError(`Invalid stat key: ${key}`, path, defId);
    }
    stats[key as keyof Stats] = validateNumber(obj[key], `${path}.${key}`, defId);
  }

  return stats;
}

/**
 * Validate Effect object.
 */
function validateEffect(value: unknown, path: string, defId?: string): Effect {
  const obj = validateObject(value, path, defId);
  return {
    type: validateString(obj.type, `${path}.type`, defId),
    params: validateObject(obj.params ?? {}, `${path}.params`, defId),
  };
}

/**
 * Validate Requirement object.
 */
function validateRequirement(value: unknown, path: string, defId?: string): Requirement {
  const obj = validateObject(value, path, defId);
  return {
    type: validateString(obj.type, `${path}.type`, defId),
    params: validateObject(obj.params ?? {}, `${path}.params`, defId),
  };
}

/**
 * Validate SelectionPrompt object.
 */
function validateSelectionPrompt(value: unknown, path: string, defId?: string): SelectionPrompt {
  const obj = validateObject(value, path, defId);
  const promptTypes = ['unit', 'card', 'position', 'player', 'number', 'choice'] as const;

  const prompt: SelectionPrompt = {
    id: validateString(obj.id, `${path}.id`, defId),
    type: validateEnum(obj.type, [...promptTypes], `${path}.type`, defId),
  };

  if (obj.filter !== undefined) {
    prompt.filter = validateString(obj.filter, `${path}.filter`, defId);
  }
  if (obj.optional !== undefined) {
    prompt.optional = validateBoolean(obj.optional, `${path}.optional`, defId);
  }
  if (obj.min !== undefined) {
    prompt.min = validateNumber(obj.min, `${path}.min`, defId);
  }
  if (obj.max !== undefined) {
    prompt.max = validateNumber(obj.max, `${path}.max`, defId);
  }
  if (obj.choices !== undefined) {
    prompt.choices = validateArray<string>(obj.choices, `${path}.choices`, defId);
  }

  return prompt;
}

/**
 * Validate TriggerCondition object.
 */
function validateTriggerCondition(value: unknown, path: string, defId?: string): TriggerCondition {
  const obj = validateObject(value, path, defId);
  return {
    type: validateString(obj.type, `${path}.type`, defId),
    params: validateObject(obj.params ?? {}, `${path}.params`, defId),
  };
}

/**
 * Validate AbilityDefinition object.
 */
function validateAbility(value: unknown, path: string, defId?: string): AbilityDefinition {
  const obj = validateObject(value, path, defId);

  return {
    id: validateString(obj.id, `${path}.id`, defId),
    name: validateString(obj.name, `${path}.name`, defId),
    speed: validateEnum(obj.speed, VALID_SPEEDS, `${path}.speed`, defId),
    requirements: validateArray(obj.requirements ?? [], `${path}.requirements`, defId)
      .map((r, i) => validateRequirement(r, `${path}.requirements[${i}]`, defId)),
    selectionPrompts: validateArray(obj.selectionPrompts ?? [], `${path}.selectionPrompts`, defId)
      .map((p, i) => validateSelectionPrompt(p, `${path}.selectionPrompts[${i}]`, defId)),
    effects: validateArray(obj.effects ?? [], `${path}.effects`, defId)
      .map((e, i) => validateEffect(e, `${path}.effects[${i}]`, defId)),
    cooldown: validateNumber(obj.cooldown ?? 0, `${path}.cooldown`, defId, 0),
  };
}

/**
 * Validate RoleDefinitionData object.
 */
function validateRoleDefinition(value: unknown, path: string, defId?: string): RoleDefinitionData {
  const obj = validateObject(value, path, defId);

  return {
    name: validateString(obj.name, `${path}.name`, defId),
    family: validateEnum(obj.family, VALID_ROLE_FAMILIES, `${path}.family`, defId),
    tier: validateEnum(obj.tier, VALID_ROLE_TIERS, `${path}.tier`, defId),
    statModifiers: validatePartialStats(obj.statModifiers ?? {}, `${path}.statModifiers`, defId),
    passiveEffects: validateArray(obj.passiveEffects ?? [], `${path}.passiveEffects`, defId)
      .map((e, i) => validateEffect(e, `${path}.passiveEffects[${i}]`, defId)),
    abilities: validateArray(obj.abilities ?? [], `${path}.abilities`, defId)
      .map((a, i) => validateAbility(a, `${path}.abilities[${i}]`, defId)),
  };
}

/**
 * Validate base card properties.
 */
function validateBaseCard(obj: Record<string, unknown>, defId?: string): {
  definitionId: string;
  name: string;
  type: CardDefinitionType;
  rarity: Rarity;
  attribute: Attribute;
  flavorText?: string;
  set?: string;
  cardNumber?: number;
} {
  const base = {
    definitionId: validateString(obj.definitionId, 'definitionId', defId),
    name: validateString(obj.name, 'name', defId),
    type: validateEnum(obj.type, VALID_TYPES, 'type', defId),
    rarity: validateEnum(obj.rarity, VALID_RARITIES, 'rarity', defId),
    attribute: validateEnum(obj.attribute, VALID_ATTRIBUTES, 'attribute', defId),
  } as ReturnType<typeof validateBaseCard>;

  if (obj.flavorText !== undefined) {
    base.flavorText = validateString(obj.flavorText, 'flavorText', defId);
  }
  if (obj.set !== undefined) {
    base.set = validateString(obj.set, 'set', defId);
  }
  if (obj.cardNumber !== undefined) {
    base.cardNumber = validateNumber(obj.cardNumber, 'cardNumber', defId, 1);
  }

  return base;
}

/**
 * Validate a single card definition.
 */
export function validateCardDefinition(data: unknown): CardDefinition {
  const obj = validateObject(data, 'root');
  const defId = typeof obj.definitionId === 'string' ? obj.definitionId : undefined;
  const base = validateBaseCard(obj, defId);

  switch (base.type) {
    case 'summon':
      return {
        ...base,
        type: 'summon',
        species: validateEnum(obj.species, VALID_SPECIES, 'species', defId),
        baseStats: validateStats(obj.baseStats, 'baseStats', defId),
        growthRates: validateGrowthRates(obj.growthRates, 'growthRates', defId),
      } as SummonCardDefinition;

    case 'action':
      return {
        ...base,
        type: 'action',
        speed: validateEnum(obj.speed, VALID_SPEEDS, 'speed', defId),
        destination: validateEnum(obj.destination, VALID_DESTINATIONS, 'destination', defId),
        requirements: validateArray(obj.requirements ?? [], 'requirements', defId)
          .map((r, i) => validateRequirement(r, `requirements[${i}]`, defId)),
        selectionPrompts: validateArray(obj.selectionPrompts ?? [], 'selectionPrompts', defId)
          .map((p, i) => validateSelectionPrompt(p, `selectionPrompts[${i}]`, defId)),
        effects: validateArray(obj.effects ?? [], 'effects', defId)
          .map((e, i) => validateEffect(e, `effects[${i}]`, defId)),
      } as ActionCardDefinition;

    case 'reaction':
      return {
        ...base,
        type: 'reaction',
        speed: 'reaction',
        destination: validateEnum(obj.destination, VALID_DESTINATIONS, 'destination', defId),
        requirements: validateArray(obj.requirements ?? [], 'requirements', defId)
          .map((r, i) => validateRequirement(r, `requirements[${i}]`, defId)),
        selectionPrompts: validateArray(obj.selectionPrompts ?? [], 'selectionPrompts', defId)
          .map((p, i) => validateSelectionPrompt(p, `selectionPrompts[${i}]`, defId)),
        effects: validateArray(obj.effects ?? [], 'effects', defId)
          .map((e, i) => validateEffect(e, `effects[${i}]`, defId)),
      } as ReactionCardDefinition;

    case 'counter':
      return {
        ...base,
        type: 'counter',
        speed: 'counter',
        destination: validateEnum(obj.destination, VALID_DESTINATIONS, 'destination', defId),
        triggerCondition: validateTriggerCondition(obj.triggerCondition, 'triggerCondition', defId),
        requirements: validateArray(obj.requirements ?? [], 'requirements', defId)
          .map((r, i) => validateRequirement(r, `requirements[${i}]`, defId)),
        effects: validateArray(obj.effects ?? [], 'effects', defId)
          .map((e, i) => validateEffect(e, `effects[${i}]`, defId)),
      } as CounterCardDefinition;

    case 'building':
      return {
        ...base,
        type: 'building',
        destination: 'discard',
        dimensions: {
          width: validateNumber((obj.dimensions as Record<string, unknown>)?.width, 'dimensions.width', defId, 1),
          height: validateNumber((obj.dimensions as Record<string, unknown>)?.height, 'dimensions.height', defId, 1),
        },
        requirements: validateArray(obj.requirements ?? [], 'requirements', defId)
          .map((r, i) => validateRequirement(r, `requirements[${i}]`, defId)),
        ongoingEffects: validateArray(obj.ongoingEffects ?? [], 'ongoingEffects', defId)
          .map((e, i) => validateEffect(e, `ongoingEffects[${i}]`, defId)),
        destroyEffects: validateArray(obj.destroyEffects ?? [], 'destroyEffects', defId)
          .map((e, i) => validateEffect(e, `destroyEffects[${i}]`, defId)),
        isTrap: validateBoolean(obj.isTrap ?? false, 'isTrap', defId),
        trapTrigger: obj.trapTrigger
          ? validateTriggerCondition(obj.trapTrigger, 'trapTrigger', defId)
          : undefined,
      } as BuildingCardDefinition;

    case 'quest':
      return {
        ...base,
        type: 'quest',
        destination: validateEnum(obj.destination, VALID_DESTINATIONS, 'destination', defId),
        requirements: validateArray(obj.requirements ?? [], 'requirements', defId)
          .map((r, i) => validateRequirement(r, `requirements[${i}]`, defId)),
        completionCondition: validateTriggerCondition(obj.completionCondition, 'completionCondition', defId),
        failureCondition: obj.failureCondition
          ? validateTriggerCondition(obj.failureCondition, 'failureCondition', defId)
          : undefined,
        activationControl: validateEnum(
          obj.activationControl ?? 'owner',
          ['owner', 'opponent', 'either'],
          'activationControl',
          defId
        ),
        vpReward: validateNumber(obj.vpReward ?? 0, 'vpReward', defId, 0),
        completionEffects: validateArray(obj.completionEffects ?? [], 'completionEffects', defId)
          .map((e, i) => validateEffect(e, `completionEffects[${i}]`, defId)),
        failureEffects: obj.failureEffects
          ? validateArray(obj.failureEffects, 'failureEffects', defId)
              .map((e, i) => validateEffect(e, `failureEffects[${i}]`, defId))
          : undefined,
        ongoingEffects: validateArray(obj.ongoingEffects ?? [], 'ongoingEffects', defId)
          .map((e, i) => validateEffect(e, `ongoingEffects[${i}]`, defId)),
      } as QuestCardDefinition;

    case 'role':
      return {
        ...base,
        type: 'role',
        role: validateRoleDefinition(obj.role, 'role', defId),
        advancesFrom: obj.advancesFrom
          ? validateArray<string>(obj.advancesFrom, 'advancesFrom', defId)
          : undefined,
        advancesTo: obj.advancesTo
          ? validateArray<string>(obj.advancesTo, 'advancesTo', defId)
          : undefined,
      } as RoleCardDefinition;

    case 'equipment':
      return {
        ...base,
        type: 'equipment',
        slot: validateEnum(obj.slot, VALID_EQUIPMENT_SLOTS, 'slot', defId),
        requirements: validateArray(obj.requirements ?? [], 'requirements', defId)
          .map((r, i) => validateRequirement(r, `requirements[${i}]`, defId)),
        statBonuses: validatePartialStats(obj.statBonuses ?? {}, 'statBonuses', defId),
        effects: validateArray(obj.effects ?? [], 'effects', defId)
          .map((e, i) => validateEffect(e, `effects[${i}]`, defId)),
      } as EquipmentCardDefinition;

    case 'weapon':
      return {
        ...base,
        type: 'weapon',
        slot: 'weapon',
        requirements: validateArray(obj.requirements ?? [], 'requirements', defId)
          .map((r, i) => validateRequirement(r, `requirements[${i}]`, defId)),
        statBonuses: validatePartialStats(obj.statBonuses ?? {}, 'statBonuses', defId),
        effects: validateArray(obj.effects ?? [], 'effects', defId)
          .map((e, i) => validateEffect(e, `effects[${i}]`, defId)),
        weaponPower: validateNumber(obj.weaponPower, 'weaponPower', defId, 0),
        attackRange: validateNumber(obj.attackRange, 'attackRange', defId, 1),
        isMagical: validateBoolean(obj.isMagical ?? false, 'isMagical', defId),
        baseAccuracy: validateNumber(obj.baseAccuracy ?? 90, 'baseAccuracy', defId, 0, 100),
      } as WeaponCardDefinition;

    case 'advance':
      return {
        ...base,
        type: 'advance',
        isNamedSummon: validateBoolean(obj.isNamedSummon ?? false, 'isNamedSummon', defId),
        requirements: validateArray(obj.requirements ?? [], 'requirements', defId)
          .map((r, i) => validateRequirement(r, `requirements[${i}]`, defId)),
        newRole: validateRoleDefinition(obj.newRole, 'newRole', defId),
        effects: validateArray(obj.effects ?? [], 'effects', defId)
          .map((e, i) => validateEffect(e, `effects[${i}]`, defId)),
        namedSummonName: obj.namedSummonName
          ? validateString(obj.namedSummonName, 'namedSummonName', defId)
          : undefined,
      } as AdvanceCardDefinition;

    default:
      throw new CardValidationError(`Unknown card type: ${base.type}`, 'type', defId);
  }
}

/**
 * Load card definitions from JSON data.
 * Can be an array of definitions or a single definition.
 */
export function loadCardDefinitions(data: unknown): CardDefinition[] {
  if (Array.isArray(data)) {
    return data.map((item, index) => {
      try {
        return validateCardDefinition(item);
      } catch (e) {
        if (e instanceof CardValidationError) {
          throw e;
        }
        throw new CardValidationError(
          `Error at index ${index}: ${(e as Error).message}`,
          `[${index}]`
        );
      }
    });
  }

  return [validateCardDefinition(data)];
}

/**
 * Load card definitions into a registry.
 * Returns a result object with success status and any errors.
 */
export function loadIntoRegistry(
  data: unknown,
  registry: CardRegistry = new CardRegistry()
): LoadResult {
  const errors: CardValidationError[] = [];
  let loaded = 0;

  const items = Array.isArray(data) ? data : [data];

  for (let i = 0; i < items.length; i++) {
    try {
      const definition = validateCardDefinition(items[i]);
      registry.register(definition);
      loaded++;
    } catch (e) {
      if (e instanceof CardValidationError) {
        errors.push(e);
      } else {
        errors.push(new CardValidationError(
          (e as Error).message,
          `[${i}]`
        ));
      }
    }
  }

  return {
    success: errors.length === 0,
    loaded,
    errors,
  };
}
