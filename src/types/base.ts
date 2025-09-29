/**
 * Core types for Summoner's Grid game engine
 * Based on GDD sections: Game Board & Zones, Turn Structure, Effect System
 */

// Basic game constants
export type PlayerId = string;
export type CardId = string;
export type SummonId = string;
export type EventId = string;

// Board coordinates - GDD: 12x14 grid with (0,0) at bottom-left
export interface Coordinate {
  x: number;
  y: number;
}

// Zone types from GDD: Game Board & Zones
export enum Zone {
  Hand = 'hand',
  MainDeck = 'mainDeck',
  AdvanceDeck = 'advanceDeck',
  DiscardPile = 'discardPile',
  RechargePile = 'rechargePile',
  RemovedFromPlay = 'removedFromPlay',
  InPlay = 'inPlay',
  GameBoard = 'gameBoard'
}

// Card types from GDD: Card Types
export enum CardType {
  Summon = 'summon',
  Action = 'action',
  Building = 'building',
  Quest = 'quest',
  Counter = 'counter',
  Advance = 'advance',
  Role = 'role',
  Equipment = 'equipment'
}

// Speed levels from GDD: Effect System - Stack-Based Resolution
export enum SpeedLevel {
  Counter = 'counter',    // Fastest - can respond to any effect
  Reaction = 'reaction',  // Can be played during either player's turn
  Action = 'action'       // Slowest - only during controller's Action Phase
}

// Turn phases from GDD: Turn Structure
export enum Phase {
  Draw = 'draw',
  Level = 'level', 
  Action = 'action',
  End = 'end'
}

// Attribute types from GDD
export enum Attribute {
  Fire = 'fire',
  Water = 'water',
  Earth = 'earth',
  Light = 'light',
  Dark = 'dark',
  Neutral = 'neutral'
}

// Role families from Alpha Cards
export enum RoleType {
  // Tier 1 Base Roles
  Warrior = 'warrior',
  Scout = 'scout', 
  Magician = 'magician',
  
  // Tier 2 Advanced Roles
  Berserker = 'berserker',
  Knight = 'knight',
  Explorer = 'explorer',
  ElementMage = 'elementMage',
  LightMage = 'lightMage',
  Rogue = 'rogue',
  DarkMage = 'darkMage',
  
  // Tier 3 Master Roles
  Paladin = 'paladin',
  Sentinel = 'sentinel',
  Warlock = 'warlock'
}

// Game victory conditions from GDD: Victory Conditions
export interface VictoryPoint {
  source: 'defeat_tier1' | 'defeat_tier2+' | 'territory_attack' | 'quest' | 'card_effect';
  amount: number;
  description: string;
}

export { Zone as ZoneType, Phase as GamePhase };