// ============================================================================
// CORE GAME TYPES
// ============================================================================

/**
 * Position on the 12x14 game board with (0,0) at bottom-left
 */
export interface Position {
  x: number; // 0-11 (12 columns)
  y: number; // 0-13 (14 rows)
}

/**
 * Game board representation as 12x14 grid
 */
export interface GameBoard {
  /** Grid dimensions */
  width: 12;
  height: 14;
  
  /** Positions occupied by summons */
  summons: Map<string, Position>; // summonId -> position
  
  /** Positions occupied by buildings */
  buildings: Map<string, Position>; // buildingId -> position
  
  /** Territory control markers */
  territories: {
    playerA: Position[]; // First 3 rows (y: 0-2)
    playerB: Position[]; // Last 3 rows (y: 11-13)
    contested: Position[]; // Middle rows (y: 3-10)
  };
}

/**
 * Turn phases as defined in GDD
 */
export enum TurnPhase {
  DRAW = 'DRAW',
  LEVEL = 'LEVEL', 
  ACTION = 'ACTION',
  END = 'END'
}

/**
 * Game format and victory conditions
 */
export interface GameFormat {
  name: '3v3';
  maxSummons: 3;
  victoryPointTarget: 3;
  handSizeLimit: 6;
}

// ============================================================================
// CARD SYSTEM TYPES
// ============================================================================

/**
 * Card types from database schema
 */
export enum CardType {
  SUMMON = 'SUMMON',
  ROLE = 'ROLE',
  ACTION = 'ACTION',
  BUILDING = 'BUILDING',
  WEAPON = 'WEAPON',
  ARMOR = 'ARMOR',
  ACCESSORY = 'ACCESSORY',
  ADVANCE = 'ADVANCE',
  COUNTER = 'COUNTER',
  QUEST = 'QUEST',
  UNIQUE = 'UNIQUE'
}

/**
 * Card rarity tiers
 */
export enum Rarity {
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  LEGENDARY = 'LEGENDARY',
  MYTH = 'MYTH',
  SPECIAL = 'SPECIAL'
}

/**
 * Elemental attributes for damage and resistance
 */
export enum Attribute {
  NEUTRAL = 'NEUTRAL',
  FIRE = 'FIRE',
  WATER = 'WATER',
  EARTH = 'EARTH',
  WIND = 'WIND',
  LIGHT = 'LIGHT',
  DARK = 'DARK',
  NATURE = 'NATURE'
}

/**
 * Card effect speeds for stack resolution
 */
export enum Speed {
  COUNTER = 'COUNTER',   // Fastest - can interrupt anything
  REACTION = 'REACTION', // Medium - responds to actions
  ACTION = 'ACTION'      // Slowest - normal play speed
}

/**
 * Base stats for summon cards (as defined in GDD)
 */
export interface SummonStats {
  /** Strength - Physical attack damage */
  str: number;
  /** Endurance - Health point calculation base */
  end: number;
  /** Defense - Physical damage reduction */
  def: number;
  /** Intelligence - Magical attack damage */
  int: number;
  /** Spirit - Healing effectiveness */
  spi: number;
  /** Magic Defense - Magical damage reduction */
  mdf: number;
  /** Speed - Movement speed calculation */
  spd: number;
  /** Accuracy - Hit chance bonus */
  acc: number;
  /** Luck - Critical hit chance and random effects */
  lck: number;
  /** Current level (gained each turn) */
  level: number;
  /** Current hit points */
  currentHp: number;
  /** Maximum hit points */
  maxHp: number;
  /** Movement speed per turn */
  movement: number;
}

/**
 * Card effect requirement types
 */
export interface CardRequirements {
  /** Minimum summon level required */
  minLevel?: number;
  /** Required role families */
  requiredRoles?: string[];
  /** Required board state conditions */
  boardConditions?: string[];
  /** Resource costs */
  costs?: {
    type: string;
    amount: number;
  }[];
}

/**
 * Card effect definition for universal rule system
 */
export interface CardEffect {
  /** Unique effect identifier */
  id: string;
  /** Effect name for display */
  name: string;
  /** Effect description */
  description: string;
  /** When this effect triggers */
  trigger: string;
  /** Requirements to activate */
  requirements?: CardRequirements;
  /** Effect resolution function identifier */
  resolver: string;
  /** Effect parameters */
  parameters: Record<string, any>;
  /** Effect priority for stack resolution */
  priority: number;
}

/**
 * Card template definition (from database)
 */
export interface CardTemplate {
  id: string;
  name: string;
  type: CardType;
  rarity: Rarity;
  attribute: Attribute;
  speed?: Speed;
  
  /** Card requirements and effects */
  requirements?: CardRequirements;
  effects?: CardEffect[];
  
  /** Summon-specific stats */
  stats?: {
    baseStr: number;
    baseEnd: number;
    baseDef: number;
    baseInt: number;
    baseSpi: number;
    baseMdf: number;
    baseSpd: number;
    baseAcc: number;
    baseLck: number;
    strGrowth: number;
    endGrowth: number;
    defGrowth: number;
    intGrowth: number;
    spiGrowth: number;
    mdfGrowth: number;
    spdGrowth: number;
    accGrowth: number;
    lckGrowth: number;
  };
  
  /** Equipment bonuses */
  equipment?: {
    strBonus?: number;
    endBonus?: number;
    defBonus?: number;
    intBonus?: number;
    spiBonus?: number;
    mdfBonus?: number;
    spdBonus?: number;
    accBonus?: number;
    lckBonus?: number;
    specialEffects?: CardEffect[];
  };
  
  /** Role information */
  tier?: number;
  family?: 'warrior' | 'magician' | 'scout';
  
  /** Set information */
  setCode: string;
  cardNumber: string;
  flavorText?: string;
  imageUrl?: string;
}

/**
 * Card instance with unique properties (from database)
 */
export interface CardInstance {
  id: string;
  templateId: string;
  ownerId: string;
  
  /** Unique procedurally generated stats */
  uniqueStats?: Partial<SummonStats>;
  uniqueProperties?: Record<string, any>;
  
  /** Digital provenance */
  signature: string;
  signatureChain: string[];
  mintedAt: Date;
  
  /** Acquisition tracking */
  acquiredMethod: string;
  acquisitionData?: Record<string, any>;
  lastTransferred?: Date;
  
  /** State tracking */
  isLocked: boolean;
  
  createdAt: Date;
}

// ============================================================================
// ROLE SYSTEM TYPES
// ============================================================================

/**
 * Role advancement tree families
 */
export enum RoleFamily {
  WARRIOR = 'warrior',
  MAGICIAN = 'magician', 
  SCOUT = 'scout'
}

/**
 * Role tier progression (1-3)
 */
export type RoleTier = 1 | 2 | 3;

/**
 * Role definition with stat modifiers
 */
export interface Role {
  id: string;
  name: string;
  family: RoleFamily;
  tier: RoleTier;
  
  /** Stat modifications */
  statModifiers: {
    strModifier: number;
    endModifier: number;
    defModifier: number;
    intModifier: number;
    spiModifier: number;
    mdfModifier: number;
    spdModifier: number;
    accModifier: number;
    lckModifier: number;
    hpModifier: number;
    movementModifier: number;
  };
  
  /** Special abilities granted by this role */
  abilities: CardEffect[];
  
  /** Advancement paths */
  advancementOptions: string[]; // Role IDs this can advance to
}

// ============================================================================
// EQUIPMENT SYSTEM TYPES
// ============================================================================

/**
 * Equipment slot types
 */
export enum EquipmentSlot {
  WEAPON = 'WEAPON',
  OFFHAND = 'OFFHAND', 
  ARMOR = 'ARMOR',
  ACCESSORY = 'ACCESSORY'
}

/**
 * Equipment configuration for a summon
 */
export interface EquipmentLoadout {
  weapon?: CardInstance;
  offhand?: CardInstance;
  armor?: CardInstance;
  accessory?: CardInstance;
}

// ============================================================================
// COMBAT SYSTEM TYPES
// ============================================================================

/**
 * Damage type for elemental interactions
 */
export interface Damage {
  amount: number;
  attribute: Attribute;
  source: string; // Card or ability that caused damage
}

/**
 * Status effect applied to summons
 */
export interface StatusEffect {
  id: string;
  name: string;
  description: string;
  duration: number; // Turns remaining
  effects: CardEffect[];
}

/**
 * Combat action types
 */
export enum CombatAction {
  ATTACK = 'ATTACK',
  MOVE = 'MOVE',
  CAST_SPELL = 'CAST_SPELL',
  USE_ABILITY = 'USE_ABILITY'
}

/**
 * Combat target specification
 */
export interface CombatTarget {
  type: 'summon' | 'building' | 'position' | 'player';
  id?: string; // Entity ID if targeting specific entity
  position?: Position; // Position if targeting location
}

// ============================================================================
// PLAYER AND GAME STATE TYPES  
// ============================================================================

/**
 * Player state during game
 */
export interface Player {
  id: string;
  username: string;
  displayName?: string;
  
  /** Current game statistics */
  level: number;
  experience: number;
  rating: number;
  
  /** Game state */
  victoryPoints: number;
  hand: CardInstance[];
  mainDeck: CardInstance[];
  advanceDeck: CardInstance[];
  discardPile: CardInstance[];
  rechargePile: CardInstance[];
  
  /** Active summons on board */
  activeSummons: Map<string, {
    cardInstance: CardInstance;
    currentStats: SummonStats;
    role: Role;
    equipment: EquipmentLoadout;
    position: Position;
    statusEffects: StatusEffect[];
    hasAttacked: boolean;
    movementUsed: number;
  }>;
  
  /** Active buildings */
  activeBuildings: Map<string, {
    cardInstance: CardInstance;
    position: Position;
    statusEffects: StatusEffect[];
  }>;
}

/**
 * Deck configuration for 3v3 format
 */
export interface DeckConfiguration {
  id: string;
  name: string;
  format: '3v3';
  
  /** 3 summon slots required */
  summonSlots: [
    {
      summon: CardInstance;
      role: CardInstance; // Tier 1 role card
      equipment: {
        weapon: CardInstance;
        offhand: CardInstance;
        armor: CardInstance;
        accessory: CardInstance;
      };
    },
    {
      summon: CardInstance;
      role: CardInstance;
      equipment: {
        weapon: CardInstance;
        offhand: CardInstance;
        armor: CardInstance;
        accessory: CardInstance;
      };
    },
    {
      summon: CardInstance;
      role: CardInstance;
      equipment: {
        weapon: CardInstance;
        offhand: CardInstance;
        armor: CardInstance;
        accessory: CardInstance;
      };
    }
  ];
  
  /** Main deck cards */
  mainDeck: CardInstance[];
  
  /** Advancement deck cards */
  advanceDeck: CardInstance[];
  
  /** Deck validation */
  isValid: boolean;
  validationErrors?: string[];
}

/**
 * Complete game state
 */
export interface GameState {
  /** Game identification */
  id: string;
  gameId: string; // Used by game server
  format: GameFormat;
  
  /** Game status */
  status: 'WAITING' | 'IN_PROGRESS' | 'COMPLETED' | 'ABANDONED';
  
  /** Players */
  playerA?: Player;
  playerB?: Player;
  currentPlayer: 'A' | 'B';
  winner?: 'A' | 'B' | 'DRAW';
  
  /** Turn management */
  currentTurn: number;
  currentPhase: TurnPhase;
  
  /** Game board */
  board: GameBoard;
  
  /** Effect stack for resolution */
  effectStack: {
    effect: CardEffect;
    source: string;
    target?: CombatTarget;
    controller: 'A' | 'B';
  }[];
  
  /** Timing */
  startTime?: Date;
  endTime?: Date;
  
  /** Game history for replay */
  actionHistory: GameAction[];
}

/**
 * Player action in the game
 */
export interface GameAction {
  id: string;
  player: 'A' | 'B';
  turn: number;
  phase: TurnPhase;
  timestamp: Date;
  
  type: 'DRAW_CARD' | 'PLAY_CARD' | 'MOVE_SUMMON' | 'ATTACK' | 'ADVANCE_ROLE' | 'END_PHASE';
  
  /** Action parameters */
  cardId?: string;
  fromPosition?: Position;
  toPosition?: Position;
  target?: CombatTarget;
  
  /** Resulting state changes */
  stateChanges?: {
    victoryPointChanges?: { playerA: number; playerB: number };
    cardMovements?: { cardId: string; from: string; to: string }[];
    damageDealt?: { targetId: string; damage: Damage }[];
  };
}
