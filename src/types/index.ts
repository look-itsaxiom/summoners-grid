// ─── Core Stats ───────────────────────────────────────────────────────────────

export interface BaseStats {
  STR: number;
  END: number;
  DEF: number;
  INT: number;
  SPI: number;
  MDF: number;
  SPD: number;
  ACC: number;
  LCK: number;
}

export type StatKey = keyof BaseStats;

export const STAT_KEYS: StatKey[] = [
  'STR', 'END', 'DEF', 'INT', 'SPI', 'MDF', 'SPD', 'ACC', 'LCK',
];

// ─── Growth Rates ─────────────────────────────────────────────────────────────

export type GrowthRateType =
  | 'minimal'    // 0.5  per level  --
  | 'steady'     // 0.67 per level  -
  | 'normal'     // 1.0  per level  _
  | 'gradual'    // 1.33 per level  +
  | 'accelerated' // 1.5 per level  ++
  | 'exceptional'; // 2.0 per level *

export const GROWTH_RATE_VALUES: Record<GrowthRateType, number> = {
  minimal: 0.5,
  steady: 0.67,
  normal: 1.0,
  gradual: 1.33,
  accelerated: 1.5,
  exceptional: 2.0,
};

export const GROWTH_RATE_SYMBOLS: Record<GrowthRateType, string> = {
  minimal: '--',
  steady: '-',
  normal: '_',
  gradual: '+',
  accelerated: '++',
  exceptional: '*',
};

export type GrowthRates = Record<StatKey, GrowthRateType>;

// ─── Elements ─────────────────────────────────────────────────────────────────

export type Element =
  | 'fire'
  | 'water'
  | 'earth'
  | 'wind'
  | 'light'
  | 'dark'
  | 'neutral';

// Fire > Wind > Earth > Water > Fire; Light <> Dark
export const ELEMENT_ADVANTAGES: Record<Element, Element | null> = {
  fire: 'wind',
  wind: 'earth',
  earth: 'water',
  water: 'fire',
  light: 'dark',
  dark: 'light',
  neutral: null,
};

// ─── Species ──────────────────────────────────────────────────────────────────

export type SpeciesId =
  | 'gignen'
  | 'fae'
  | 'stoneheart'
  | 'wilderling'
  | 'angar'
  | 'demar'
  | 'creptilis';

export interface SpeciesTemplate {
  id: SpeciesId;
  name: string;
  description: string;
  statRanges: Record<StatKey, [min: number, max: number]>;
}

// ─── Rarity ───────────────────────────────────────────────────────────────────

export type Rarity = 'common' | 'uncommon' | 'rare' | 'legend' | 'myth';

// ─── Roles ────────────────────────────────────────────────────────────────────

export type RoleFamily = 'warrior' | 'magician' | 'scout';

export type RoleTier = 1 | 2 | 3;

export type RoleId =
  // Warrior family
  | 'warrior'
  | 'knight' | 'berserker'
  | 'sentinel' | 'paladin' | 'dread_knight' | 'warlord' | 'battle_dancer' | 'spellblade'
  // Magician family
  | 'magician'
  | 'elemental_mage' | 'light_mage' | 'dark_mage' | 'red_mage'
  | 'white_mage' | 'black_mage'
  | 'priest' | 'sage' | 'sorcerer' | 'warlock' | 'shadowblade'
  // Scout family
  | 'scout'
  | 'rogue' | 'explorer'
  | 'assassin' | 'ranger' | 'trailblazer';

export interface RoleDefinition {
  id: RoleId;
  name: string;
  family: RoleFamily;
  tier: RoleTier;
  statModifiers: Partial<Record<StatKey, number>>; // Multiplicative
  advancesFrom: RoleId[];
}

// ─── Equipment ────────────────────────────────────────────────────────────────

export type EquipmentSlot = 'weapon' | 'offhand' | 'armor' | 'accessory';

export type DamageType = 'physical_melee' | 'physical_ranged' | 'magical';

export interface WeaponCard {
  id: string;
  name: string;
  slot: 'weapon';
  basePower: number;
  damageType: DamageType;
  element: Element;
  range: number;
  baseAccuracy: number;
  statBonuses: Partial<BaseStats>;
}

export interface OffhandCard {
  id: string;
  name: string;
  slot: 'offhand';
  statBonuses: Partial<BaseStats>;
  effects: CardEffect[];
}

export interface ArmorCard {
  id: string;
  name: string;
  slot: 'armor';
  statBonuses: Partial<BaseStats>;
  effects: CardEffect[];
}

export interface AccessoryCard {
  id: string;
  name: string;
  slot: 'accessory';
  statBonuses: Partial<BaseStats>;
  effects: CardEffect[];
}

export type EquipmentCard = WeaponCard | OffhandCard | ArmorCard | AccessoryCard;

// ─── Cards ────────────────────────────────────────────────────────────────────

export type CardSpeed = 'action' | 'reaction' | 'counter';

export type CardType =
  | 'summon'
  | 'action'
  | 'building'
  | 'quest'
  | 'counter'
  | 'reaction'
  | 'role'
  | 'equipment'
  | 'advance';

export type PileDestination = 'discard' | 'recharge' | 'removed';

export interface CardEffect {
  id: string;
  type: 'damage' | 'heal' | 'buff' | 'debuff' | 'status' | 'movement' | 'special';
  description: string;
  formula?: string;
  basePower?: number;
  damageType?: DamageType;
  element?: Element;
  canCrit?: boolean;
  duration?: 'instant' | 'end_of_turn' | 'end_of_next_turn' | 'permanent';
  statModifiers?: Partial<BaseStats>;
}

export interface CardRequirement {
  type: 'role' | 'level' | 'board_state' | 'summon_in_play' | 'quest_completed';
  roleId?: RoleId;
  roleFamily?: RoleFamily;
  minLevel?: number;
  description: string;
}

export interface BaseCard {
  id: string;
  name: string;
  cardType: CardType;
  element: Element;
  description: string;
  requirements: CardRequirement[];
  pileDestination: PileDestination;
}

export interface SummonCard extends BaseCard {
  cardType: 'summon';
  species: SpeciesId;
  rarity: Rarity;
  baseStats: BaseStats;
  growthRates: GrowthRates;
  equipment: {
    weapon: WeaponCard | null;
    offhand: OffhandCard | null;
    armor: ArmorCard | null;
    accessory: AccessoryCard | null;
  };
  digitalSignature: string;
}

export interface ActionCard extends BaseCard {
  cardType: 'action';
  speed: CardSpeed;
  effects: CardEffect[];
  targetType: 'self_summon' | 'ally_summon' | 'enemy_summon' | 'any_summon' | 'board_space';
}

export interface BuildingCard extends BaseCard {
  cardType: 'building';
  dimensions: { width: number; height: number };
  effects: CardEffect[];
  isTrap: boolean;
}

export interface QuestCard extends BaseCard {
  cardType: 'quest';
  objective: string;
  rewardEffects: CardEffect[];
  vpReward: number;
  activatedBy: 'owner' | 'opponent' | 'either';
}

export interface CounterCard extends BaseCard {
  cardType: 'counter';
  triggerCondition: string;
  effects: CardEffect[];
}

export interface ReactionCard extends BaseCard {
  cardType: 'reaction';
  effects: CardEffect[];
}

export interface AdvanceCard extends BaseCard {
  cardType: 'advance';
  advanceType: 'role_change' | 'named_summon';
  targetRole: RoleId;
  namedSummonName?: string;
  namedSummonEffects?: CardEffect[];
  namedSummonStatOverrides?: Partial<BaseStats>;
  namedSummonGrowthOverrides?: Partial<GrowthRates>;
  uniqueActionCards?: ActionCard[];
}

export type Card =
  | SummonCard
  | ActionCard
  | BuildingCard
  | QuestCard
  | CounterCard
  | ReactionCard
  | AdvanceCard;

// ─── Board ────────────────────────────────────────────────────────────────────

export const BOARD_WIDTH = 12;
export const BOARD_HEIGHT = 14;
export const TERRITORY_DEPTH = 3;

export interface Position {
  x: number; // 0-11
  y: number; // 0-13
}

export type TerritoryOwner = 'playerA' | 'playerB' | 'unclaimed';

// ─── Summon Unit (in-play) ────────────────────────────────────────────────────

export interface SummonUnit {
  instanceId: string;
  card: SummonCard;
  owner: PlayerId;
  position: Position;
  level: number;          // Starts at 5, max 20
  currentHP: number;
  maxHP: number;
  currentRole: RoleId;
  calculatedStats: BaseStats;
  movementRemaining: number;
  hasAttacked: boolean;
  statusEffects: StatusEffect[];
  completedQuests: string[];
  isNamedSummon: boolean;
  namedSummonName?: string;
}

export interface StatusEffect {
  id: string;
  name: string;
  type: 'immobilize' | 'buff' | 'debuff' | 'dot' | 'hot';
  duration: 'end_of_turn' | 'end_of_next_turn' | 'permanent';
  turnsRemaining?: number;
  statModifiers?: Partial<BaseStats>;
  source: string;
}

// ─── Game State ───────────────────────────────────────────────────────────────

export type PlayerId = 'playerA' | 'playerB';

export type TurnPhase = 'draw' | 'level' | 'action' | 'end';

export interface PlayerState {
  id: PlayerId;
  hand: Card[];
  mainDeck: Card[];
  advanceDeck: AdvanceCard[];
  discardPile: Card[];
  rechargePile: Card[];
  removedFromPlay: Card[];
  victoryPoints: number;
  summonSlots: SummonCard[];  // The 3 summon cards in deck construction
  hasPlayedTurnSummon: boolean;
  faceDownCards: Card[];      // Set counter/reaction cards
}

export interface BuildingUnit {
  instanceId: string;
  card: BuildingCard;
  owner: PlayerId;
  position: Position;        // Top-left corner
  occupiedSpaces: Position[];
  isFaceDown: boolean;
}

export interface EffectStackEntry {
  id: string;
  speed: CardSpeed;
  source: Card;
  sourceOwner: PlayerId;
  effects: CardEffect[];
  targets: string[];          // instanceIds or positions
  resolved: boolean;
}

export interface GameState {
  phase: TurnPhase;
  turnNumber: number;
  activePlayer: PlayerId;
  players: Record<PlayerId, PlayerState>;
  board: {
    summons: SummonUnit[];
    buildings: BuildingUnit[];
  };
  effectStack: EffectStackEntry[];
  priorityPlayer: PlayerId;
  winner: PlayerId | null;
  gameOver: boolean;
  turnOrderDecided: boolean;
  coinFlipWinner: PlayerId | null;
  log: GameLogEntry[];
}

export interface GameLogEntry {
  turn: number;
  phase: TurnPhase;
  player: PlayerId;
  message: string;
  timestamp: number;
}

// ─── Derived Stat Helpers ─────────────────────────────────────────────────────

export const SUMMON_START_LEVEL = 5;
export const SUMMON_MAX_LEVEL = 20;
export const HAND_LIMIT = 6;
export const SUMMON_DRAW_COUNT = 3;
export const VP_TO_WIN = 3;
export const CRIT_MULTIPLIER = 1.5;
