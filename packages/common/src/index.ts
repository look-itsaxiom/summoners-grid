import { Schema, MapSchema, ArraySchema, type } from '@colyseus/schema';
import { GamePhase, PlayerID, Stat } from './game/types';
import { CalculatedProperties, Stats } from './game/schemas/Properties';

// --- CONSTANTS ---
export const BOARD_WIDTH = 12;
export const BOARD_HEIGHT = 14;
export const TILE_SIZE = 40; // Used by client for rendering

// --- GAME-RELATED SCHEMAS ---

export class Coordinate extends Schema {
  @type('number') x: number;
  @type('number') y: number;
}

// Represents a specific instance of a card in a player's deck, hand, etc.
export class CardInstance extends Schema {
  @type('string') instanceId: string; // Unique ID for this instance
  @type('string') cardId: string; // ID of the card definition in card-data.ts
}

// Represents a Summon that is on the game board
export class SummonInstance extends Schema {
  @type('string') instanceId: string; // Matches the CardInstance id it was created from
  @type('string') cardId: string;
  @type('string') ownerId: string; // Session ID of the owner

  @type('string') name: string;
  @type('number') level: number = 5;
  @type('number') currentHP: number = 0;

  @type(Coordinate) position = new Coordinate();
  @type(Stats) calculatedStats = new Stats();
  @type(CalculatedProperties) calculatedProperties = new CalculatedProperties();

  @type({ map: "string" }) effects = new MapSchema<string>();

  @type('boolean') canMove: boolean = true;
  @type('boolean') canAttack: boolean = true;
}

// --- PLAYER AND GAME STATE SCHEMAS ---

export class Player extends Schema {
  @type('string') sessionId: string;
  @type('string') playerId: PlayerID; // 'A' or 'B'
  @type('string') name: string = 'Anonymous';
  @type('boolean') connected: boolean = true;
  @type('number') victoryPoints: number = 0;

  @type('boolean') hasPlayedTurnSummon: boolean = false;

  @type([CardInstance]) hand = new ArraySchema<CardInstance>();
  @type([CardInstance]) mainDeck = new ArraySchema<CardInstance>();
  @type([CardInstance]) advanceDeck = new ArraySchema<CardInstance>();
  @type([CardInstance]) discardPile = new ArraySchema<CardInstance>();
  @type([CardInstance]) rechargePile = new ArraySchema<CardInstance>();
}

export class GameState extends Schema {
  @type({ map: Player })
  players = new MapSchema<Player>();

  @type({ map: SummonInstance })
  board = new MapSchema<SummonInstance>(); // Keyed by instanceId

  @type('string') activePlayerId: PlayerID; // 'A' or 'B'
  @type('string') currentPhase: GamePhase = GamePhase.DRAW;
  @type('number') turn: number = 1;

  @type('boolean') gameStarted: boolean = false;
  @type('string') winner: PlayerID | null = null;
  @type('string') gameStatusMessage: string = 'Waiting for players...';

  @type(['string']) gameLog = new ArraySchema<string>();
}
