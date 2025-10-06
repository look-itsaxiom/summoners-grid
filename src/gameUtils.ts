import { Stats, GrowthRates, SummonCard, SummonUnit } from './types';
import { GROWTH_RATE_VALUES } from './constants';

// Calculate stats for a summon unit based on level and growth rates
export function calculateStats(baseStats: Stats, growthRates: GrowthRates, level: number): Stats {
  const calculated: Stats = { ...baseStats };
  
  // Apply growth for each level beyond level 1
  for (let i = 1; i < level; i++) {
    calculated.STR += GROWTH_RATE_VALUES[growthRates.STR];
    calculated.END += GROWTH_RATE_VALUES[growthRates.END];
    calculated.DEF += GROWTH_RATE_VALUES[growthRates.DEF];
    calculated.INT += GROWTH_RATE_VALUES[growthRates.INT];
    calculated.SPI += GROWTH_RATE_VALUES[growthRates.SPI];
    calculated.MDF += GROWTH_RATE_VALUES[growthRates.MDF];
    calculated.SPD += GROWTH_RATE_VALUES[growthRates.SPD];
    calculated.ACC += GROWTH_RATE_VALUES[growthRates.ACC];
    calculated.LCK += GROWTH_RATE_VALUES[growthRates.LCK];
  }
  
  // Round all values
  Object.keys(calculated).forEach(key => {
    calculated[key as keyof Stats] = Math.floor(calculated[key as keyof Stats]);
  });
  
  return calculated;
}

// Calculate max HP based on END stat (HP = END * 10)
export function calculateMaxHP(endurance: number): number {
  return endurance * 10;
}

// Calculate movement based on SPD stat (MV = floor(SPD / 10) + 4)
export function calculateMovement(speed: number): number {
  return Math.floor(speed / 10) + 4;
}

// Calculate critical hit chance (CritChance = floor((LCK * 0.3375) + 1.65))
export function calculateCritChance(luck: number): number {
  return Math.floor((luck * 0.3375) + 1.65);
}

// Calculate hit chance (BaseHitRate = 50 + ACC)
export function calculateHitChance(accuracy: number): number {
  return 50 + accuracy;
}

// Check if position is valid on the board
export function isValidPosition(x: number, y: number, boardWidth: number, boardHeight: number): boolean {
  return x >= 0 && x < boardWidth && y >= 0 && y < boardHeight;
}

// Check if position is in player A's territory (rows 0-2)
export function isPlayerATerritory(y: number): boolean {
  return y <= 2;
}

// Check if position is in player B's territory (rows 11-13)
export function isPlayerBTerritory(y: number): boolean {
  return y >= 11;
}

// Calculate distance between two positions (Manhattan distance)
export function calculateDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.abs(x2 - x1) + Math.abs(y2 - y1);
}

// Level up a summon unit
export function levelUpSummon(unit: SummonUnit): void {
  if (unit.card.level >= 20) return; // Max level
  
  const oldMaxHP = unit.maxHP;
  unit.card.level++;
  
  // Recalculate stats
  unit.calculatedStats = calculateStats(unit.card.baseStats, unit.card.growthRates, unit.card.level);
  unit.maxHP = calculateMaxHP(unit.calculatedStats.END);
  unit.movement = calculateMovement(unit.calculatedStats.SPD);
  
  // HP damage retention: current damage stays the same
  const damage = oldMaxHP - unit.currentHP;
  unit.currentHP = unit.maxHP - damage;
  if (unit.currentHP > unit.maxHP) unit.currentHP = unit.maxHP;
  if (unit.currentHP < 0) unit.currentHP = 0;
}
