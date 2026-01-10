/**
 * Card Data Module
 *
 * Provides card definitions, registry, loading, and factory functions.
 */

// Card definitions (templates/blueprints)
export {
  type BaseCardDefinition,
  type CardDefinitionType,
  type CardDefinition,
  type SummonCardDefinition,
  type ActionCardDefinition,
  type ReactionCardDefinition,
  type CounterCardDefinition,
  type BuildingCardDefinition,
  type QuestCardDefinition,
  type RoleCardDefinition,
  type EquipmentCardDefinition,
  type WeaponCardDefinition,
  type AdvanceCardDefinition,
  type RoleDefinitionData,
  type AbilityDefinition,
  isSummonDefinition,
  isActionDefinition,
  isReactionDefinition,
  isCounterDefinition,
  isBuildingDefinition,
  isQuestDefinition,
  isRoleDefinition,
  isEquipmentDefinition,
  isWeaponDefinition,
  isAdvanceDefinition,
} from './definitions';

// Card registry
export {
  CardRegistry,
  globalRegistry,
  type CardFilter,
} from './registry';

// JSON loading and validation
export {
  CardValidationError,
  validateCardDefinition,
  loadCardDefinitions,
  loadIntoRegistry,
  type LoadResult,
} from './loader';

// Card instance factory
export {
  createCard,
  createCards,
  createSummonCard,
  createActionCard,
  createReactionCard,
  createCounterCard,
  createBuildingCard,
  createQuestCard,
  createRoleCard,
  createEquipmentCard,
  createWeaponCard,
  createAdvanceCard,
  cloneCard,
  type CreateSummonOptions,
} from './factory';
