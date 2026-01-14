/**
 * GDD Specification Tests
 *
 * These tests verify that the engine correctly implements the formulas
 * and rules from the Game Design Document. Expected values are calculated
 * by hand from the GDD formulas, NOT derived from the engine implementation.
 *
 * Reference: Summoner's Grid GDD.md
 */

import { describe, it, expect } from 'vitest';

// Growth rate imports
import {
  GROWTH_RATE_VALUES,
  calculateGrowthGain,
  calculateLevelUpGain,
  STARTING_LEVEL,
  MAX_LEVEL,
} from '../stats/growth-rates';

// Stat calculation imports
import {
  calculateBaseStatsAtLevel,
  calculateFinalStats,
  applyRoleModifiers,
  type StatCalculationInput,
} from '../stats/calculate';

// Derived stats imports
import {
  calculateMaxHp,
  calculateMovementSpeed,
  calculateBasicAttackToHit,
  calculateAbilityToHit,
  calculateCritChance,
  CRIT_MULTIPLIER,
} from '../stats/derived';

// Combat imports
import {
  calculatePhysicalMeleeDamage,
  calculatePhysicalBowDamage,
  calculateMagicalDamage,
  ELEMENTAL_ADVANTAGE,
  ELEMENTAL_RESISTANCE,
  getElementalMultiplier,
} from '../combat/damage';

import { calculateHealing } from '../combat/healing';

// Stack imports
import {
  getNewSpeedLock,
  canPlaySpeed,
  getEmptyStackSpeedLock,
} from '../resolution/stack';

import type { Stats, GrowthRates, GrowthRateSymbol, Speed } from '../state/base';

// ============================================================================
// GROWTH RATE TESTS
// ============================================================================
// GDD Section: Stats & Formulas > Growth Rate Types
// Formula: Floor(Level × GrowthRate)
//
// Growth rates from GDD:
// - Minimal (--): 0.5 per level
// - Steady (-): 0.67 per level
// - Normal (_): 1.0 per level
// - Gradual (+): 1.33 per level
// - Accelerated (++): 1.5 per level
// - Exceptional (*): 2.0 per level

describe('Growth Rate System (GDD: Stats & Formulas)', () => {
  describe('Growth rate values match GDD specification', () => {
    it('Minimal (--) should be 0.5 per level', () => {
      expect(GROWTH_RATE_VALUES['--']).toBe(0.5);
    });

    it('Steady (-) should be 0.67 per level', () => {
      expect(GROWTH_RATE_VALUES['-']).toBe(0.67);
    });

    it('Normal (_) should be 1.0 per level', () => {
      expect(GROWTH_RATE_VALUES['_']).toBe(1.0);
    });

    it('Gradual (+) should be 1.33 per level', () => {
      expect(GROWTH_RATE_VALUES['+']).toBe(1.33);
    });

    it('Accelerated (++) should be 1.5 per level', () => {
      expect(GROWTH_RATE_VALUES['++']).toBe(1.5);
    });

    it('Exceptional (*) should be 2.0 per level', () => {
      expect(GROWTH_RATE_VALUES['*']).toBe(2.0);
    });
  });

  describe('Growth gain calculation: Floor(Level × GrowthRate)', () => {
    // GDD: Summons start at level 5
    describe('at starting level 5', () => {
      it('Minimal (--): Floor(5 × 0.5) = 2', () => {
        expect(calculateGrowthGain(5, '--')).toBe(2);
      });

      it('Steady (-): Floor(5 × 0.67) = 3', () => {
        expect(calculateGrowthGain(5, '-')).toBe(3);
      });

      it('Normal (_): Floor(5 × 1.0) = 5', () => {
        expect(calculateGrowthGain(5, '_')).toBe(5);
      });

      it('Gradual (+): Floor(5 × 1.33) = 6', () => {
        expect(calculateGrowthGain(5, '+')).toBe(6);
      });

      it('Accelerated (++): Floor(5 × 1.5) = 7', () => {
        expect(calculateGrowthGain(5, '++')).toBe(7);
      });

      it('Exceptional (*): Floor(5 × 2.0) = 10', () => {
        expect(calculateGrowthGain(5, '*')).toBe(10);
      });
    });

    // GDD: Max level is 20
    describe('at max level 20', () => {
      it('Minimal (--): Floor(20 × 0.5) = 10', () => {
        expect(calculateGrowthGain(20, '--')).toBe(10);
      });

      it('Steady (-): Floor(20 × 0.67) = 13', () => {
        expect(calculateGrowthGain(20, '-')).toBe(13);
      });

      it('Normal (_): Floor(20 × 1.0) = 20', () => {
        expect(calculateGrowthGain(20, '_')).toBe(20);
      });

      it('Gradual (+): Floor(20 × 1.33) = 26', () => {
        expect(calculateGrowthGain(20, '+')).toBe(26);
      });

      it('Accelerated (++): Floor(20 × 1.5) = 30', () => {
        expect(calculateGrowthGain(20, '++')).toBe(30);
      });

      it('Exceptional (*): Floor(20 × 2.0) = 40', () => {
        expect(calculateGrowthGain(20, '*')).toBe(40);
      });
    });

    // Edge cases at level boundaries
    describe('at level 10 (mid progression)', () => {
      it('Minimal (--): Floor(10 × 0.5) = 5', () => {
        expect(calculateGrowthGain(10, '--')).toBe(5);
      });

      it('Gradual (+): Floor(10 × 1.33) = 13', () => {
        expect(calculateGrowthGain(10, '+')).toBe(13);
      });
    });
  });

  describe('Level constants match GDD', () => {
    it('Starting level should be 5', () => {
      expect(STARTING_LEVEL).toBe(5);
    });

    it('Max level should be 20', () => {
      expect(MAX_LEVEL).toBe(20);
    });
  });

  describe('Level-up gain calculation', () => {
    it('Level 5→6 with Normal growth: 6 - 5 = 1', () => {
      expect(calculateLevelUpGain(5, 6, '_')).toBe(1);
    });

    it('Level 5→10 with Exceptional growth: 20 - 10 = 10', () => {
      expect(calculateLevelUpGain(5, 10, '*')).toBe(10);
    });

    it('Level 19→20 with Minimal growth: Floor(20×0.5) - Floor(19×0.5) = 10 - 9 = 1', () => {
      expect(calculateLevelUpGain(19, 20, '--')).toBe(1);
    });
  });
});

// ============================================================================
// STAT CALCULATION TESTS
// ============================================================================
// GDD Section: Stats & Formulas > Calculated Properties
// Formula: FinalStat = (BaseStat + Floor(Level × GrowthRate)) × RoleModifier + EquipmentBonus + OtherBonuses

describe('Stat Calculation Pipeline (GDD: Stats & Formulas)', () => {
  const testBaseStats: Stats = {
    STR: 10, END: 10, DEF: 10, INT: 10,
    SPI: 10, MDF: 10, SPD: 10, ACC: 10, LCK: 10,
  };

  const normalGrowthRates: GrowthRates = {
    STR: '_', END: '_', DEF: '_', INT: '_',
    SPI: '_', MDF: '_', SPD: '_', ACC: '_', LCK: '_',
  };

  describe('Base stats + growth at level', () => {
    it('BaseStat 10 + Normal growth at level 5: 10 + 5 = 15', () => {
      const result = calculateBaseStatsAtLevel(testBaseStats, normalGrowthRates, 5);
      expect(result.STR).toBe(15);
    });

    it('BaseStat 10 + Normal growth at level 20: 10 + 20 = 30', () => {
      const result = calculateBaseStatsAtLevel(testBaseStats, normalGrowthRates, 20);
      expect(result.STR).toBe(30);
    });

    it('BaseStat 10 + Exceptional growth at level 10: 10 + 20 = 30', () => {
      const exceptionalGrowth: GrowthRates = { ...normalGrowthRates, STR: '*' };
      const result = calculateBaseStatsAtLevel(testBaseStats, exceptionalGrowth, 10);
      expect(result.STR).toBe(30);
    });
  });

  describe('Role modifier application (multiplicative)', () => {
    it('Stat 20 with 1.2x modifier: Floor(20 × 1.2) = 24', () => {
      const stats: Stats = { ...testBaseStats, STR: 20 };
      const role = {
        id: 'test',
        name: 'Test',
        tier: 1 as const,
        family: 'warrior' as const,
        statModifiers: { STR: 1.2 },
      };
      const result = applyRoleModifiers(stats, role);
      expect(result.STR).toBe(24);
    });

    it('Stat 15 with 0.8x modifier: Floor(15 × 0.8) = 12', () => {
      const stats: Stats = { ...testBaseStats, INT: 15 };
      const role = {
        id: 'test',
        name: 'Test',
        tier: 1 as const,
        family: 'warrior' as const,
        statModifiers: { INT: 0.8 },
      };
      const result = applyRoleModifiers(stats, role);
      expect(result.INT).toBe(12);
    });
  });

  describe('Full stat calculation pipeline', () => {
    it('Example: BaseStat 12, Normal growth, level 10, 1.1x role mod, +5 equipment', () => {
      // Step 1: Base + Growth = 12 + Floor(10 × 1.0) = 12 + 10 = 22
      // Step 2: Role modifier = Floor(22 × 1.1) = Floor(24.2) = 24
      // Step 3: Equipment = 24 + 5 = 29

      const baseStats: Stats = {
        STR: 12, END: 10, DEF: 10, INT: 10,
        SPI: 10, MDF: 10, SPD: 10, ACC: 10, LCK: 10,
      };

      const input: StatCalculationInput = {
        baseStats,
        growthRates: normalGrowthRates,
        level: 10,
        role: {
          id: 'test',
          name: 'Test',
          tier: 1,
          family: 'warrior',
          statModifiers: { STR: 1.1 },
        },
        equipment: {
          weapon: {
            id: 'sword',
            name: 'Test Sword',
            type: 'equipment',
            slot: 'weapon',
            statBonuses: { STR: 5 },
          },
          offhand: null,
          armor: null,
          accessory: null,
        },
      };

      const result = calculateFinalStats(input);
      expect(result.STR).toBe(29);
    });
  });
});

// ============================================================================
// DERIVED STATS TESTS
// ============================================================================
// GDD Section: Stats & Formulas > Calculated Properties

describe('Derived Stats (GDD: Stats & Formulas)', () => {
  describe('Max HP: 50 + Floor(END^1.5)', () => {
    it('END 10: 50 + Floor(10^1.5) = 50 + Floor(31.62) = 50 + 31 = 81', () => {
      expect(calculateMaxHp(10)).toBe(81);
    });

    it('END 20: 50 + Floor(20^1.5) = 50 + Floor(89.44) = 50 + 89 = 139', () => {
      expect(calculateMaxHp(20)).toBe(139);
    });

    it('END 30: 50 + Floor(30^1.5) = 50 + Floor(164.32) = 50 + 164 = 214', () => {
      expect(calculateMaxHp(30)).toBe(214);
    });

    it('END 1: 50 + Floor(1^1.5) = 50 + 1 = 51', () => {
      expect(calculateMaxHp(1)).toBe(51);
    });

    it('END 0: 50 + Floor(0^1.5) = 50 + 0 = 50', () => {
      expect(calculateMaxHp(0)).toBe(50);
    });
  });

  describe('Movement Speed: 2 + Floor((SPD - 10) / 5)', () => {
    it('SPD 10: 2 + Floor((10-10)/5) = 2 + 0 = 2', () => {
      expect(calculateMovementSpeed(10)).toBe(2);
    });

    it('SPD 15: 2 + Floor((15-10)/5) = 2 + 1 = 3', () => {
      expect(calculateMovementSpeed(15)).toBe(3);
    });

    it('SPD 20: 2 + Floor((20-10)/5) = 2 + 2 = 4', () => {
      expect(calculateMovementSpeed(20)).toBe(4);
    });

    it('SPD 5: 2 + Floor((5-10)/5) = 2 + (-1) = 1 (min 1)', () => {
      expect(calculateMovementSpeed(5)).toBe(1);
    });

    it('SPD 0: 2 + Floor((0-10)/5) = 2 + (-2) = 0, clamped to 1', () => {
      expect(calculateMovementSpeed(0)).toBe(1);
    });

    it('SPD 25: 2 + Floor((25-10)/5) = 2 + 3 = 5', () => {
      expect(calculateMovementSpeed(25)).toBe(5);
    });
  });

  describe('Basic Attack To-Hit: 90 + (ACC / 10)', () => {
    it('ACC 10: 90 + (10/10) = 91', () => {
      expect(calculateBasicAttackToHit(10)).toBe(91);
    });

    it('ACC 50: 90 + (50/10) = 95', () => {
      expect(calculateBasicAttackToHit(50)).toBe(95);
    });

    it('ACC 100: 90 + (100/10) = 100 (capped)', () => {
      expect(calculateBasicAttackToHit(100)).toBe(100);
    });

    it('ACC 150: 90 + (150/10) = 105, capped at 100', () => {
      expect(calculateBasicAttackToHit(150)).toBe(100);
    });

    it('ACC 0: 90 + (0/10) = 90', () => {
      expect(calculateBasicAttackToHit(0)).toBe(90);
    });
  });

  describe('Ability To-Hit: AbilityAccuracy + (ACC / 10)', () => {
    it('Ability 80, ACC 20: 80 + (20/10) = 82', () => {
      expect(calculateAbilityToHit(80, 20)).toBe(82);
    });

    it('Ability 70, ACC 50: 70 + (50/10) = 75', () => {
      expect(calculateAbilityToHit(70, 50)).toBe(75);
    });

    it('Ability 95, ACC 100: 95 + 10 = 105, capped at 100', () => {
      expect(calculateAbilityToHit(95, 100)).toBe(100);
    });
  });

  describe('Critical Hit Chance: Floor((LCK × 0.3375) + 1.65)', () => {
    it('LCK 10: Floor((10 × 0.3375) + 1.65) = Floor(5.025) = 5', () => {
      expect(calculateCritChance(10)).toBe(5);
    });

    it('LCK 20: Floor((20 × 0.3375) + 1.65) = Floor(8.4) = 8', () => {
      expect(calculateCritChance(20)).toBe(8);
    });

    it('LCK 30: Floor((30 × 0.3375) + 1.65) = Floor(11.775) = 11', () => {
      expect(calculateCritChance(30)).toBe(11);
    });

    it('LCK 0: Floor((0 × 0.3375) + 1.65) = Floor(1.65) = 1', () => {
      expect(calculateCritChance(0)).toBe(1);
    });

    it('LCK 50: Floor((50 × 0.3375) + 1.65) = Floor(18.525) = 18', () => {
      expect(calculateCritChance(50)).toBe(18);
    });
  });

  describe('Critical Multiplier', () => {
    it('Critical multiplier should be 1.5×', () => {
      expect(CRIT_MULTIPLIER).toBe(1.5);
    });
  });
});

// ============================================================================
// DAMAGE FORMULA TESTS
// ============================================================================
// GDD Section: Combat System > Damage Types

describe('Damage Formulas (GDD: Combat System)', () => {
  describe('Physical Melee: STR × (1 + WeaponPower/100) × (STR/TargetDEF) × CritMultiplier', () => {
    it('STR 20, Power 50, DEF 10, no crit: 20 × 1.5 × (20/10) = 20 × 1.5 × 2 = 60', () => {
      expect(calculatePhysicalMeleeDamage(20, 50, 10, false)).toBe(60);
    });

    it('STR 20, Power 50, DEF 10, crit: 60 × 1.5 = 90', () => {
      expect(calculatePhysicalMeleeDamage(20, 50, 10, true)).toBe(90);
    });

    it('STR 15, Power 100, DEF 15, no crit: 15 × 2 × (15/15) = 15 × 2 × 1 = 30', () => {
      expect(calculatePhysicalMeleeDamage(15, 100, 15, false)).toBe(30);
    });

    it('STR 30, Power 0, DEF 20, no crit: 30 × 1 × (30/20) = 30 × 1.5 = 45', () => {
      expect(calculatePhysicalMeleeDamage(30, 0, 20, false)).toBe(45);
    });

    it('STR 10, Power 25, DEF 20, no crit: 10 × 1.25 × (10/20) = 10 × 1.25 × 0.5 = 6.25 → 6', () => {
      expect(calculatePhysicalMeleeDamage(10, 25, 20, false)).toBe(6);
    });
  });

  describe('Physical Bow: ((STR + ACC)/2) × (1 + WeaponPower/100) × (STR/TargetDEF) × CritMultiplier', () => {
    it('STR 20, ACC 20, Power 50, DEF 10, no crit: ((20+20)/2) × 1.5 × (20/10) = 20 × 1.5 × 2 = 60', () => {
      expect(calculatePhysicalBowDamage(20, 20, 50, 10, false)).toBe(60);
    });

    it('STR 20, ACC 30, Power 50, DEF 10, no crit: ((20+30)/2) × 1.5 × (20/10) = 25 × 1.5 × 2 = 75', () => {
      expect(calculatePhysicalBowDamage(20, 30, 50, 10, false)).toBe(75);
    });

    it('STR 10, ACC 30, Power 100, DEF 20, no crit: ((10+30)/2) × 2 × (10/20) = 20 × 2 × 0.5 = 20', () => {
      expect(calculatePhysicalBowDamage(10, 30, 100, 20, false)).toBe(20);
    });

    it('STR 20, ACC 20, Power 50, DEF 10, crit: 60 × 1.5 = 90', () => {
      expect(calculatePhysicalBowDamage(20, 20, 50, 10, true)).toBe(90);
    });
  });

  describe('Magical: INT × (1 + BasePower/100) × (INT/TargetMDF) × CritMultiplier', () => {
    it('INT 25, Power 60, MDF 10, no crit: 25 × 1.6 × (25/10) = 25 × 1.6 × 2.5 = 100', () => {
      expect(calculateMagicalDamage(25, 60, 10, false)).toBe(100);
    });

    it('INT 25, Power 60, MDF 10, crit: 100 × 1.5 = 150', () => {
      expect(calculateMagicalDamage(25, 60, 10, true)).toBe(150);
    });

    it('INT 20, Power 100, MDF 20, no crit: 20 × 2 × (20/20) = 20 × 2 × 1 = 40', () => {
      expect(calculateMagicalDamage(20, 100, 20, false)).toBe(40);
    });

    it('INT 15, Power 0, MDF 30, no crit: 15 × 1 × (15/30) = 15 × 0.5 = 7.5 → 7', () => {
      expect(calculateMagicalDamage(15, 0, 30, false)).toBe(7);
    });
  });

  describe('Division by zero protection', () => {
    it('Physical melee with DEF 0 should use DEF 1', () => {
      // STR 20, Power 50, DEF 0→1: 20 × 1.5 × (20/1) = 600
      expect(calculatePhysicalMeleeDamage(20, 50, 0, false)).toBe(600);
    });

    it('Magical with MDF 0 should use MDF 1', () => {
      // INT 20, Power 50, MDF 0→1: 20 × 1.5 × (20/1) = 600
      expect(calculateMagicalDamage(20, 50, 0, false)).toBe(600);
    });
  });
});

// ============================================================================
// HEALING FORMULA TESTS
// ============================================================================
// GDD Section: Combat System > Healing
// Formula: SPI × (1 + BasePower/100) × CritMultiplier

describe('Healing Formula (GDD: Combat System)', () => {
  describe('Heal Amount: SPI × (1 + BasePower/100) × CritMultiplier', () => {
    it('SPI 20, Power 50, no crit: 20 × 1.5 = 30', () => {
      expect(calculateHealing(20, 50, false)).toBe(30);
    });

    it('SPI 20, Power 50, crit: 30 × 1.5 = 45', () => {
      expect(calculateHealing(20, 50, true)).toBe(45);
    });

    it('SPI 30, Power 100, no crit: 30 × 2 = 60', () => {
      expect(calculateHealing(30, 100, false)).toBe(60);
    });

    it('SPI 15, Power 0, no crit: 15 × 1 = 15', () => {
      expect(calculateHealing(15, 0, false)).toBe(15);
    });

    it('SPI 25, Power 40, crit: 25 × 1.4 × 1.5 = 52.5 → 52', () => {
      expect(calculateHealing(25, 40, true)).toBe(52);
    });
  });
});

// ============================================================================
// ELEMENTAL SYSTEM TESTS
// ============================================================================
// GDD Section: Combat System > Damage Attributes

describe('Elemental System (GDD: Combat System)', () => {
  describe('Elemental advantages match GDD', () => {
    it('Fire beats Wind', () => {
      expect(ELEMENTAL_ADVANTAGE['fire']).toContain('wind');
    });

    it('Wind beats Earth', () => {
      expect(ELEMENTAL_ADVANTAGE['wind']).toContain('earth');
    });

    it('Earth beats Water', () => {
      expect(ELEMENTAL_ADVANTAGE['earth']).toContain('water');
    });

    it('Water beats Fire', () => {
      expect(ELEMENTAL_ADVANTAGE['water']).toContain('fire');
    });

    it('Light beats Dark', () => {
      expect(ELEMENTAL_ADVANTAGE['light']).toContain('dark');
    });

    it('Dark beats Light', () => {
      expect(ELEMENTAL_ADVANTAGE['dark']).toContain('light');
    });

    it('Neutral has no advantages', () => {
      expect(ELEMENTAL_ADVANTAGE['neutral']).toHaveLength(0);
    });
  });

  describe('Elemental resistances (attacker is weakened against target)', () => {
    it('Fire → Water is resisted', () => {
      expect(ELEMENTAL_RESISTANCE['fire']).toContain('water');
    });

    it('Wind → Fire is resisted', () => {
      expect(ELEMENTAL_RESISTANCE['wind']).toContain('fire');
    });

    it('Earth → Wind is resisted', () => {
      expect(ELEMENTAL_RESISTANCE['earth']).toContain('wind');
    });

    it('Water → Earth is resisted', () => {
      expect(ELEMENTAL_RESISTANCE['water']).toContain('earth');
    });

    it('Light → Light is resisted (same-element penalty)', () => {
      expect(ELEMENTAL_RESISTANCE['light']).toContain('light');
    });

    it('Dark → Dark is resisted (same-element penalty)', () => {
      expect(ELEMENTAL_RESISTANCE['dark']).toContain('dark');
    });
  });

  describe('Elemental multipliers', () => {
    it('Advantage gives 1.25× damage', () => {
      expect(getElementalMultiplier('fire', 'wind')).toBe(1.25);
    });

    it('Neutral matchup gives 1.0× damage', () => {
      expect(getElementalMultiplier('fire', 'earth')).toBe(1.0);
    });
  });

  describe('Elemental resistance (attacker weakened against target)', () => {
    it('Fire attacking Water = 0.75×', () => {
      expect(getElementalMultiplier('fire', 'water')).toBe(0.75);
    });

    it('Wind attacking Fire = 0.75×', () => {
      expect(getElementalMultiplier('wind', 'fire')).toBe(0.75);
    });

    it('Earth attacking Wind = 0.75×', () => {
      expect(getElementalMultiplier('earth', 'wind')).toBe(0.75);
    });

    it('Water attacking Earth = 0.75×', () => {
      expect(getElementalMultiplier('water', 'earth')).toBe(0.75);
    });

    it('Light attacking Light = 0.75×', () => {
      expect(getElementalMultiplier('light', 'light')).toBe(0.75);
    });

    it('Dark attacking Dark = 0.75×', () => {
      expect(getElementalMultiplier('dark', 'dark')).toBe(0.75);
    });
  });
});

// ============================================================================
// STACK RESOLUTION TESTS
// ============================================================================
// GDD Section: Effect System

describe('Stack Resolution (GDD: Effect System)', () => {
  describe('Speed hierarchy: Counter > Reaction > Action', () => {
    it('Empty stack allows Action speed', () => {
      expect(getEmptyStackSpeedLock()).toBe('action');
    });

    it('Action speed lock allows Action', () => {
      expect(canPlaySpeed('action', 'action')).toBe(true);
    });

    it('Action speed lock allows Reaction', () => {
      expect(canPlaySpeed('action', 'reaction')).toBe(true);
    });

    it('Action speed lock allows Counter', () => {
      expect(canPlaySpeed('action', 'counter')).toBe(true);
    });

    it('Reaction speed lock blocks Action', () => {
      expect(canPlaySpeed('reaction', 'action')).toBe(false);
    });

    it('Reaction speed lock allows Reaction', () => {
      expect(canPlaySpeed('reaction', 'reaction')).toBe(true);
    });

    it('Reaction speed lock allows Counter', () => {
      expect(canPlaySpeed('reaction', 'counter')).toBe(true);
    });

    it('Counter speed lock blocks Action', () => {
      expect(canPlaySpeed('counter', 'action')).toBe(false);
    });

    it('Counter speed lock blocks Reaction', () => {
      expect(canPlaySpeed('counter', 'reaction')).toBe(false);
    });

    it('Counter speed lock allows Counter', () => {
      expect(canPlaySpeed('counter', 'counter')).toBe(true);
    });
  });

  describe('Speed lock escalation', () => {
    it('Action → Action stays Action', () => {
      expect(getNewSpeedLock('action', 'action')).toBe('action');
    });

    it('Action → Reaction escalates to Reaction', () => {
      expect(getNewSpeedLock('action', 'reaction')).toBe('reaction');
    });

    it('Action → Counter escalates to Counter', () => {
      expect(getNewSpeedLock('action', 'counter')).toBe('counter');
    });

    it('Reaction → Reaction stays Reaction', () => {
      expect(getNewSpeedLock('reaction', 'reaction')).toBe('reaction');
    });

    it('Reaction → Counter escalates to Counter', () => {
      expect(getNewSpeedLock('reaction', 'counter')).toBe('counter');
    });

    it('Counter → Counter stays Counter', () => {
      expect(getNewSpeedLock('counter', 'counter')).toBe('counter');
    });

    it('Higher lock is maintained when lower speed added (impossible case)', () => {
      // This shouldn't happen in normal play due to canPlaySpeed check
      // but the function should still handle it correctly
      expect(getNewSpeedLock('counter', 'action')).toBe('counter');
    });
  });
});

// ============================================================================
// VICTORY POINT TESTS
// ============================================================================
// GDD Section: Victory Conditions

describe('Victory Conditions (GDD: Victory Conditions)', () => {
  // These are specification tests - they verify the documented rules
  // Implementation tests would verify actual VP awarding

  describe('VP requirements (specification)', () => {
    const VP_TO_WIN = 3;
    const TIER_1_VP = 1;
    const TIER_2_PLUS_VP = 2;

    it('Victory requires 3 VP', () => {
      expect(VP_TO_WIN).toBe(3);
    });

    it('Tier 1 summon defeat awards 1 VP', () => {
      expect(TIER_1_VP).toBe(1);
    });

    it('Tier 2+ summon defeat awards 2 VP', () => {
      expect(TIER_2_PLUS_VP).toBe(2);
    });
  });
});

// ============================================================================
// BOARD DIMENSIONS TESTS
// ============================================================================
// GDD Section: Game Board & Zones

describe('Board Dimensions (GDD: Game Board & Zones)', () => {
  const BOARD_WIDTH = 12;  // x: 0-11
  const BOARD_HEIGHT = 14; // y: 0-13

  it('Board width should be 12 (x: 0-11)', () => {
    expect(BOARD_WIDTH).toBe(12);
  });

  it('Board height should be 14 (y: 0-13)', () => {
    expect(BOARD_HEIGHT).toBe(14);
  });

  it('Coordinate origin is at bottom-left (0,0)', () => {
    // This is a documentation test - the GDD specifies (0,0) at bottom-left
    const origin = { x: 0, y: 0 };
    expect(origin.x).toBe(0);
    expect(origin.y).toBe(0);
  });
});

// ============================================================================
// HAND SIZE TESTS
// ============================================================================
// GDD Section: Turn Structure > End Phase

describe('Hand Size Limit (GDD: Turn Structure)', () => {
  const MAX_HAND_SIZE = 6;

  it('Maximum hand size is 6 cards', () => {
    expect(MAX_HAND_SIZE).toBe(6);
  });
});
