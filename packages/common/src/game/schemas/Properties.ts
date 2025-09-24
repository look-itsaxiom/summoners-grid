import { Schema, type } from '@colyseus/schema';
import { Stat, GrowthRate } from '../types';

export class Stats extends Schema {
  @type('number') [Stat.STR]: number = 10;
  @type('number') [Stat.END]: number = 10;
  @type('number') [Stat.DEF]: number = 10;
  @type('number') [Stat.INT]: number = 10;
  @type('number') [Stat.SPI]: number = 10;
  @type('number') [Stat.MDF]: number = 10;
  @type('number') [Stat.SPD]: number = 10;
  @type('number') [Stat.ACC]: number = 10;
  @type('number') [Stat.LCK]: number = 10;
}

export class GrowthRates extends Schema {
  @type('string') [Stat.STR]: GrowthRate = GrowthRate.NORMAL;
  @type('string') [Stat.END]: GrowthRate = GrowthRate.NORMAL;
  @type('string') [Stat.DEF]: GrowthRate = GrowthRate.NORMAL;
  @type('string') [Stat.INT]: GrowthRate = GrowthRate.NORMAL;
  @type('string') [Stat.SPI]: GrowthRate = GrowthRate.NORMAL;
  @type('string') [Stat.MDF]: GrowthRate = GrowthRate.NORMAL;
  @type('string') [Stat.SPD]: GrowthRate = GrowthRate.NORMAL;
  @type('string') [Stat.ACC]: GrowthRate = GrowthRate.NORMAL;
  @type('string') [Stat.LCK]: GrowthRate = GrowthRate.NORMAL;
}

export class CalculatedProperties extends Schema {
  @type('number') maxHP: number = 0;
  @type('number') movement: number = 0;
  @type('number') toHit: number = 0;
  @type('number') critChance: number = 0;
}
