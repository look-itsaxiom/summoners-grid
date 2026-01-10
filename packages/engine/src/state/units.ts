/**
 * Unit and board entity types
 */

import type { EntityId, GridPosition, PlayerIndex, QuestId, Stats, UnitId } from './base';
import type { EquipmentCard, RoleDefinition, SummonCard, WeaponCard } from './cards';
import type { StatusEffect } from './effects';

/**
 * Equipment loadout for a summon.
 */
export interface EquipmentLoadout {
  weapon: WeaponCard | null;
  offhand: EquipmentCard | null;
  armor: EquipmentCard | null;
  accessory: EquipmentCard | null;
}

/**
 * Summon unit on the board.
 */
export interface SummonUnit {
  id: UnitId;
  entityId: EntityId;
  owner: PlayerIndex;
  position: GridPosition;
  /** The summon card this unit is based on */
  summon: SummonCard;
  /** Current role */
  role: RoleDefinition;
  /** Equipped items */
  equipment: EquipmentLoadout;
  /** Current level (5-20) */
  level: number;
  /** Current HP */
  currentHp: number;
  /** Maximum HP (calculated from END) */
  maxHp: number;
  /** Calculated stats after all modifiers */
  calculatedStats: Stats;
  /** Active status effects */
  statusEffects: StatusEffect[];
  /** Quests this unit has completed */
  completedQuests: QuestId[];
  /** Ability cooldowns (ability id -> turns remaining) */
  cooldowns: Map<string, number>;
}

/**
 * Building on the board.
 */
export interface Building {
  id: EntityId;
  owner: PlayerIndex;
  /** Top-left position of the building */
  position: GridPosition;
  /** Card definition */
  cardId: string;
  /** Current HP (if applicable) */
  currentHp?: number;
}

/**
 * Board cell contents.
 */
export interface BoardCell {
  /** Unit occupying this cell (if any) */
  unitId: UnitId | null;
  /** Building occupying this cell (if any) */
  buildingId: EntityId | null;
  /** Territory owner (0, 1, or null for unclaimed) */
  territory: PlayerIndex | null;
}

/**
 * Game board - 12x14 grid.
 */
export interface Board {
  /** Grid cells [x][y] */
  cells: BoardCell[][];
  /** All units on the board */
  units: Map<UnitId, SummonUnit>;
  /** All buildings on the board */
  buildings: Map<EntityId, Building>;
}

/** Board dimensions */
export const BOARD_WIDTH = 12;
export const BOARD_HEIGHT = 14;

/** Territory rows */
export const PLAYER_0_TERRITORY_ROWS = [0, 1, 2]; // Bottom 3 rows
export const PLAYER_1_TERRITORY_ROWS = [11, 12, 13]; // Top 3 rows

/**
 * Create an empty board with initial territory setup.
 */
export function createEmptyBoard(): Board {
  const cells: BoardCell[][] = [];

  for (let x = 0; x < BOARD_WIDTH; x++) {
    cells[x] = [];
    for (let y = 0; y < BOARD_HEIGHT; y++) {
      let territory: PlayerIndex | null = null;
      if (PLAYER_0_TERRITORY_ROWS.includes(y)) {
        territory = 0;
      } else if (PLAYER_1_TERRITORY_ROWS.includes(y)) {
        territory = 1;
      }
      cells[x][y] = {
        unitId: null,
        buildingId: null,
        territory,
      };
    }
  }

  return {
    cells,
    units: new Map(),
    buildings: new Map(),
  };
}
