/**
 * Card Registry
 *
 * Central registry for all card definitions.
 * Provides lookup, filtering, and querying capabilities.
 */

import type { Attribute, Rarity } from '../state/base';
import type { RoleFamily, Species } from '../state/cards';
import type {
  CardDefinition,
  CardDefinitionType,
  RoleCardDefinition,
  WeaponCardDefinition,
} from './definitions';

/**
 * Filter options for querying card definitions.
 */
export interface CardFilter {
  /** Filter by card type */
  type?: CardDefinitionType | CardDefinitionType[];
  /** Filter by rarity */
  rarity?: Rarity | Rarity[];
  /** Filter by attribute */
  attribute?: Attribute | Attribute[];
  /** Filter by set */
  set?: string;
  /** Filter by species (for summon cards) */
  species?: Species;
  /** Filter by role family (for role cards) */
  roleFamily?: RoleFamily;
  /** Custom filter function */
  custom?: (def: CardDefinition) => boolean;
}

/**
 * Card Registry - stores and manages card definitions.
 */
export class CardRegistry {
  private definitions: Map<string, CardDefinition> = new Map();
  private byType: Map<CardDefinitionType, Set<string>> = new Map();
  private byRarity: Map<Rarity, Set<string>> = new Map();
  private byAttribute: Map<Attribute, Set<string>> = new Map();
  private bySet: Map<string, Set<string>> = new Map();

  /**
   * Register a card definition.
   * @throws Error if definition with same ID already exists
   */
  register(definition: CardDefinition): void {
    if (this.definitions.has(definition.definitionId)) {
      throw new Error(`Card definition already registered: ${definition.definitionId}`);
    }

    this.definitions.set(definition.definitionId, definition);
    this.indexDefinition(definition);
  }

  /**
   * Register multiple card definitions.
   */
  registerAll(definitions: CardDefinition[]): void {
    for (const def of definitions) {
      this.register(def);
    }
  }

  /**
   * Get a card definition by ID.
   * @returns The definition or undefined if not found
   */
  get(definitionId: string): CardDefinition | undefined {
    return this.definitions.get(definitionId);
  }

  /**
   * Get a card definition by ID, throwing if not found.
   * @throws Error if definition not found
   */
  getOrThrow(definitionId: string): CardDefinition {
    const def = this.definitions.get(definitionId);
    if (!def) {
      throw new Error(`Card definition not found: ${definitionId}`);
    }
    return def;
  }

  /**
   * Check if a definition exists.
   */
  has(definitionId: string): boolean {
    return this.definitions.has(definitionId);
  }

  /**
   * Get all registered definition IDs.
   */
  getAllIds(): string[] {
    return Array.from(this.definitions.keys());
  }

  /**
   * Get all registered definitions.
   */
  getAll(): CardDefinition[] {
    return Array.from(this.definitions.values());
  }

  /**
   * Get the number of registered definitions.
   */
  get size(): number {
    return this.definitions.size;
  }

  /**
   * Query definitions by filter.
   */
  query(filter: CardFilter): CardDefinition[] {
    let results: CardDefinition[];

    // Start with type filter if specified (most selective)
    if (filter.type) {
      const types = Array.isArray(filter.type) ? filter.type : [filter.type];
      const ids = new Set<string>();
      for (const type of types) {
        const typeIds = this.byType.get(type);
        if (typeIds) {
          for (const id of typeIds) {
            ids.add(id);
          }
        }
      }
      results = Array.from(ids).map(id => this.definitions.get(id)!);
    } else {
      results = this.getAll();
    }

    // Apply rarity filter
    if (filter.rarity) {
      const rarities = Array.isArray(filter.rarity) ? filter.rarity : [filter.rarity];
      const raritySet = new Set(rarities);
      results = results.filter(def => raritySet.has(def.rarity));
    }

    // Apply attribute filter
    if (filter.attribute) {
      const attributes = Array.isArray(filter.attribute) ? filter.attribute : [filter.attribute];
      const attrSet = new Set(attributes);
      results = results.filter(def => attrSet.has(def.attribute));
    }

    // Apply set filter
    if (filter.set) {
      results = results.filter(def => def.set === filter.set);
    }

    // Apply species filter (summon cards only)
    if (filter.species) {
      results = results.filter(def =>
        def.type === 'summon' && def.species === filter.species
      );
    }

    // Apply role family filter (role cards only)
    if (filter.roleFamily) {
      results = results.filter(def =>
        def.type === 'role' && (def as RoleCardDefinition).role.family === filter.roleFamily
      );
    }

    // Apply custom filter
    if (filter.custom) {
      results = results.filter(filter.custom);
    }

    return results;
  }

  /**
   * Get all definitions of a specific type.
   */
  getByType<T extends CardDefinition>(type: CardDefinitionType): T[] {
    const ids = this.byType.get(type);
    if (!ids) return [];
    return Array.from(ids).map(id => this.definitions.get(id) as T);
  }

  /**
   * Get all role definitions.
   */
  getRoles(): RoleCardDefinition[] {
    return this.getByType<RoleCardDefinition>('role');
  }

  /**
   * Get all weapon definitions.
   */
  getWeapons(): WeaponCardDefinition[] {
    return this.getByType<WeaponCardDefinition>('weapon');
  }

  /**
   * Get a role definition by role name.
   */
  getRoleByName(roleName: string): RoleCardDefinition | undefined {
    for (const def of this.getByType<RoleCardDefinition>('role')) {
      if (def.role.name.toLowerCase() === roleName.toLowerCase()) {
        return def;
      }
    }
    return undefined;
  }

  /**
   * Get advancement paths for a role.
   * Returns role definitions that this role can advance to.
   */
  getAdvancementPaths(roleName: string): RoleCardDefinition[] {
    const role = this.getRoleByName(roleName);
    if (!role || !role.advancesTo) return [];

    return role.advancesTo
      .map(name => this.getRoleByName(name))
      .filter((r): r is RoleCardDefinition => r !== undefined);
  }

  /**
   * Clear all registered definitions.
   */
  clear(): void {
    this.definitions.clear();
    this.byType.clear();
    this.byRarity.clear();
    this.byAttribute.clear();
    this.bySet.clear();
  }

  /**
   * Remove a definition by ID.
   */
  remove(definitionId: string): boolean {
    const def = this.definitions.get(definitionId);
    if (!def) return false;

    this.definitions.delete(definitionId);
    this.removeFromIndex(def);
    return true;
  }

  /**
   * Index a definition for fast lookup.
   */
  private indexDefinition(def: CardDefinition): void {
    // Index by type
    if (!this.byType.has(def.type)) {
      this.byType.set(def.type, new Set());
    }
    this.byType.get(def.type)!.add(def.definitionId);

    // Index by rarity
    if (!this.byRarity.has(def.rarity)) {
      this.byRarity.set(def.rarity, new Set());
    }
    this.byRarity.get(def.rarity)!.add(def.definitionId);

    // Index by attribute
    if (!this.byAttribute.has(def.attribute)) {
      this.byAttribute.set(def.attribute, new Set());
    }
    this.byAttribute.get(def.attribute)!.add(def.definitionId);

    // Index by set
    if (def.set) {
      if (!this.bySet.has(def.set)) {
        this.bySet.set(def.set, new Set());
      }
      this.bySet.get(def.set)!.add(def.definitionId);
    }
  }

  /**
   * Remove a definition from indexes.
   */
  private removeFromIndex(def: CardDefinition): void {
    this.byType.get(def.type)?.delete(def.definitionId);
    this.byRarity.get(def.rarity)?.delete(def.definitionId);
    this.byAttribute.get(def.attribute)?.delete(def.definitionId);
    if (def.set) {
      this.bySet.get(def.set)?.delete(def.definitionId);
    }
  }
}

/**
 * Global card registry instance.
 * Can be used as a singleton or create new instances for testing.
 */
export const globalRegistry = new CardRegistry();
