// =================================================================================================
// ENUMS & CONSTANTS
// =================================================================================================

export const BOARD_WIDTH = 12;
export const BOARD_HEIGHT = 14;

export enum Attribute {
  Neutral = 'Neutral',
  Fire = 'Fire',
  Water = 'Water',
  Earth = 'Earth',
  Wind = 'Wind',
  Light = 'Light',
  Dark = 'Dark',
  Nature = 'Nature',
}

export enum CardType {
  Summon = 'Summon',
  Action = 'Action',
  Building = 'Building',
  Quest = 'Quest',
  Counter = 'Counter',
  Reaction = 'Reaction',
  Role = 'Role',
  Equipment = 'Equipment',
  Advance = 'Advance',
  Unique = 'Unique',
  NamedSummon = 'NamedSummon',
}

export enum RoleFamily {
  Warrior = 'Warrior',
  Magician = 'Magician',
  Scout = 'Scout',
}

export enum Zone {
  Hand = 'Hand',
  MainDeck = 'MainDeck',
  AdvanceDeck = 'AdvanceDeck',
  DiscardPile = 'DiscardPile',
  RechargePile = 'RechargePile',
  RemovedFromPlay = 'RemovedFromPlay',
  InPlay = 'InPlay',
  Board = 'Board',
}

export enum EquipmentSlot {
  Weapon = 'Weapon',
  Offhand = 'Offhand',
  Armor = 'Armor',
  Accessory = 'Accessory',
}

export enum ActionSpeed {
  Counter = 3,
  Reaction = 2,
  Action = 1,
}

export enum TurnPhase {
    Draw = 'Draw',
    Level = 'Level',
    Action = 'Action',
    End = 'End',
}

// =================================================================================================
// CORE STATS & PROPERTIES
// =================================================================================================

export interface Stats {
  str: number; // Strength
  end: number; // Endurance
  def: number; // Defense
  int: number; // Intelligence
  spi: number; // Spirit
  mdf: number; // Magic Defense
  spd: number; // Speed
  acc: number; // Accuracy
  lck: number; // Luck
}

export interface GrowthRates {
  str: number;
  end: number;
  def: number;
  int: number;
  spi: number;
  mdf: number;
  spd: number;
  acc: number;
  lck: number;
}

// =================================================================================================
// BOARD & GAME ENTITIES
// =================================================================================================

export interface Coordinates {
  x: number;
  y: number;
}

export interface BoardSpace {
  coordinates: Coordinates;
  unitId?: string;
  buildingId?: string;
}

export interface Board {
  grid: BoardSpace[][];
}

export interface SummonUnit {
  id: string;
  cardId: string;
  ownerPlayerId: string;
  level: number;
  position: Coordinates;
  role: RoleCard;
  equipment: DeckSummon['equipment'];

  // Calculated properties
  calculatedStats: Stats;
  maxHp: number;
  movement: number;

  // State properties
  damageTaken: number;
  statuses: { type: string; duration: number }[];
  hasAttackedThisTurn: boolean;
  hasMovedThisTurn: number; // Can be split, so track distance
}

export interface BuildingUnit {
    id: string;
    cardId: string;
    ownerPlayerId: string;
    position: Coordinates[];
}

// =================================================================================================
// CARD DEFINITIONS
// =================================================================================================

export interface Card {
  id: string;
  name: string;
  type: CardType;
  rarity: string;
  attribute: Attribute;
  description: string;
}

export interface EquipmentCard extends Card {
  type: CardType.Equipment;
  slot: EquipmentSlot;
  power?: number;
  range?: number;
  damageStat?: keyof Stats | 'hybrid';
  statBonuses: Partial<Stats>;
}

export interface RoleCard extends Card {
  type: CardType.Role;
  tier: number;
  family: RoleFamily;
  statModifiers: Partial<{ [stat in keyof Stats]: number }>;
  advancementFrom?: string[];
}

export interface SummonCard extends Card {
  type: CardType.Summon;
  species: string;
  baseStats: Stats;
  growthRates: GrowthRates;
}

// This is a summon that has been configured in the deck builder
export interface DeckSummon {
    summon: SummonCard;
    role: RoleCard;
    equipment: {
        weapon: EquipmentCard;
        offhand?: EquipmentCard;
        armor?: EquipmentCard;
        accessory?: EquipmentCard;
    };
}

export interface ActionCard extends Card {
  type: CardType.Action;
  speed: ActionSpeed;
  // A function to check if the card can be played
  canPlay: (gameState: GameState, playerId: string, context: any) => boolean;
  // A function that returns the effects to be put on the stack
  getEffects: (gameState: GameState, playerId: string, context: any) => Effect[];
}

export interface BuildingCard extends Card {
    type: CardType.Building;
    dimensions: { width: number, height: number };
}

export interface QuestCard extends Card {
    type: CardType.Quest;
}

export interface CounterCard extends Card {
    type: CardType.Counter;
    speed: ActionSpeed;
}

export interface AdvanceCard extends Card {
    type: CardType.Advance;
    targetRole: string;
    newRole: RoleCard;
    levelRequirement: number;
}

export interface NamedSummonCard extends Card {
    type: CardType.NamedSummon;
    replaces: string;
    newRole: RoleCard;
}

export interface UniqueCard extends Card {
    type: CardType.Unique;
}

// =================================================================================================
// GAME STATE & PLAYER
// =================================================================================================

export interface Player {
  id: string;
  name: string;
  victoryPoints: number;
  zones: {
    [Zone.Hand]: Card[];
    [Zone.MainDeck]: Card[];
    [Zone.AdvanceDeck]: Card[];
    [Zone.DiscardPile]: Card[];
    [Zone.RechargePile]: Card[];
  };
  summons: SummonUnit[];
  buildings: BuildingUnit[];
}

export interface GameState {
  gameId: string;
  turn: number;
  activePlayerId: string;
  phase: TurnPhase;
  players: { [id: string]: Player };
  board: Board;
  stack: Effect[];
  rng: () => number;
  gameLog: string[];
  priorityPlayerId: string;
}

// =================================================================================================
// EFFECT & ACTION SYSTEM
// =================================================================================================

export interface Effect {
    id: string;
    sourceCardId: string;
    sourceUnitId?: string;
    speed: ActionSpeed;
    description: string;
    // The core function that mutates the game state
    resolve: (gameState: GameState) => GameState;
}

export interface PlayerAction {
    type: 'PLAY_CARD' | 'MOVE_SUMMON' | 'ATTACK' | 'PASS_PRIORITY';
    payload: any;
}