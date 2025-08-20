// ============================================================================
// SHARED UTILITIES TESTS (Basic Version)
// Tests for task #007: Implement shared utility functions
// ============================================================================

import {
  calculateDistance,
  isValidPosition,
  getAdjacentPositions,
  canPerformActionInPhase,
  isValidCardForSlot,
  validateHandSize,
  calculateFinalStat,
  calculateDerivedProperties,
  calculatePhysicalDamage,
  calculateBowDamage,
  calculateMagicalDamage,
  calculateHealingAmount,
  Logger,
  LogLevel,
  GameError
} from './utilities';

import { Position, TurnPhase, CardType, SummonStats } from './shared-types';

describe('Shared Utilities', () => {
  
  describe('Position and Movement Utilities', () => {
    
    it('should calculate Chebyshev distance correctly for grid movement', () => {
      // Chebyshev distance for diagonal movement: max(|x1-x2|, |y1-y2|)
      expect(calculateDistance({ x: 0, y: 0 }, { x: 3, y: 4 })).toBe(4); // max(3, 4) = 4
      expect(calculateDistance({ x: 5, y: 5 }, { x: 5, y: 5 })).toBe(0); // Same position
      expect(calculateDistance({ x: 0, y: 0 }, { x: 3, y: 3 })).toBe(3); // Diagonal movement
    });

    it('should validate positions within 12x14 grid', () => {
      expect(isValidPosition({ x: 0, y: 0 })).toBe(true);
      expect(isValidPosition({ x: 11, y: 13 })).toBe(true);
      expect(isValidPosition({ x: -1, y: 0 })).toBe(false);
      expect(isValidPosition({ x: 12, y: 0 })).toBe(false);
    });

    it('should return adjacent positions for center position', () => {
      const adjacent = getAdjacentPositions({ x: 5, y: 5 });
      expect(adjacent).toHaveLength(8);
      expect(adjacent).toContainEqual({ x: 4, y: 4 });
      expect(adjacent).toContainEqual({ x: 6, y: 6 });
    });
  });

  describe('Game Rule Validation Utilities', () => {
    
    it('should allow correct actions in each phase', () => {
      expect(canPerformActionInPhase('play_card', TurnPhase.ACTION)).toBe(true);
      expect(canPerformActionInPhase('draw_card', TurnPhase.DRAW)).toBe(true);
      expect(canPerformActionInPhase('play_card', TurnPhase.DRAW)).toBe(false);
    });

    it('should validate card types for slots', () => {
      expect(isValidCardForSlot(CardType.SUMMON, 'summon')).toBe(true);
      expect(isValidCardForSlot(CardType.ACTION, 'main_deck')).toBe(true);
      expect(isValidCardForSlot(CardType.ACTION, 'summon')).toBe(false);
    });

    it('should validate hand size within limits', () => {
      expect(validateHandSize(6, 6)).toBe(true);
      expect(validateHandSize(7, 6)).toBe(false);
    });
  });

  describe('Stat Calculation Utilities', () => {
    
    it('should calculate final stat with all modifiers', () => {
      const result = calculateFinalStat(10, 5, 1.5, 1.2, 3);
      expect(result).toBeGreaterThan(10);
    });

    it('should calculate derived properties correctly', () => {
      const stats: SummonStats = {
        str: 15, end: 12, def: 8, int: 10, spi: 6,
        mdf: 7, spd: 14, acc: 11, lck: 9,
        level: 1, currentHp: 86, maxHp: 86, movement: 4
      };
      
      const derived = calculateDerivedProperties(stats);
      expect(derived.maxHP).toBe(86); // 50 + 12*3 = 86
      expect(derived.movementSpeed).toBe(4); // 2 + floor(14/5) = 4
      expect(derived.criticalHitChance).toBe(4); // floor(9*0.3375 + 1.65) = 4
      expect(derived.basicAttackToHit).toBe(91); // 90 + floor(11/10) = 91
    });
  });

  describe('Combat Calculation Utilities', () => {
    
    it('should calculate physical damage using GDD formula', () => {
      // GDD Formula: STR × (1 + WeaponPower/100) × (STR/TargetDEF) × CritMultiplier
      const attackerSTR = 20;
      const defenderDEF = 10;
      const weaponPower = 150; // 150% weapon power
      
      const normalDamage = calculatePhysicalDamage(attackerSTR, defenderDEF, weaponPower, false);
      const critDamage = calculatePhysicalDamage(attackerSTR, defenderDEF, weaponPower, true);
      
      // Expected: 20 × (1 + 150/100) × (20/10) × 1.0 = 20 × 2.5 × 2 × 1 = 100
      expect(normalDamage).toBe(100);
      // Expected: 20 × (1 + 150/100) × (20/10) × 1.5 = 20 × 2.5 × 2 × 1.5 = 150
      expect(critDamage).toBe(150);
    });

    it('should calculate bow damage using GDD formula', () => {
      // GDD Formula: ((STR + ACC)/2) × (1 + WeaponPower/100) × (STR/TargetDEF) × CritMultiplier
      const attackerSTR = 18;
      const attackerACC = 14;
      const defenderDEF = 12;
      const weaponPower = 120;
      
      const normalDamage = calculateBowDamage(attackerSTR, attackerACC, defenderDEF, weaponPower, false);
      const critDamage = calculateBowDamage(attackerSTR, attackerACC, defenderDEF, weaponPower, true);
      
      // Expected: ((18+14)/2) × (1 + 120/100) × (18/12) × 1.0 = 16 × 2.2 × 1.5 × 1 = 52.8 = 52
      expect(normalDamage).toBe(52);
      // Expected: ((18+14)/2) × (1 + 120/100) × (18/12) × 1.5 = 16 × 2.2 × 1.5 × 1.5 = 79.2 = 79
      expect(critDamage).toBe(79);
    });

    it('should calculate magical damage using GDD formula', () => {
      // GDD Formula: INT × (1 + BasePower/100) × (INT/TargetMDF) × CritMultiplier
      const attackerINT = 25;
      const defenderMDF = 15;
      const basePower = 200;
      
      const normalDamage = calculateMagicalDamage(attackerINT, defenderMDF, basePower, false);
      const critDamage = calculateMagicalDamage(attackerINT, defenderMDF, basePower, true);
      
      // Expected: 25 × (1 + 200/100) × (25/15) × 1.0 = 25 × 3 × 1.67 × 1 = 125.25 = 125
      expect(normalDamage).toBe(125);
      // Expected: 25 × (1 + 200/100) × (25/15) × 1.5 = 25 × 3 × 1.67 × 1.5 = 187.875 = 187
      expect(critDamage).toBe(187);
    });

    it('should calculate healing using GDD formula', () => {
      // GDD Formula: SPI × (1 + BasePower/100) × CritMultiplier
      const healerSPI = 20;
      const basePower = 150;
      
      const normalHeal = calculateHealingAmount(healerSPI, basePower, false);
      const critHeal = calculateHealingAmount(healerSPI, basePower, true);
      
      // Expected: 20 × (1 + 150/100) × 1.0 = 20 × 2.5 × 1 = 50
      expect(normalHeal).toBe(50);
      // Expected: 20 × (1 + 150/100) × 1.5 = 20 × 2.5 × 1.5 = 75
      expect(critHeal).toBe(75);
    });

    it('should ensure minimum damage of 1', () => {
      // Test weak attacker vs strong defender
      const weakDamage = calculatePhysicalDamage(5, 50, 100, false);
      const weakMagical = calculateMagicalDamage(3, 40, 100, false);
      
      expect(weakDamage).toBe(1);
      expect(weakMagical).toBe(1);
    });
  });

  describe('Logging and Error Handling Utilities', () => {
    
    beforeEach(() => {
      Logger.clearLogs();
    });

    it('should log messages with correct metadata', () => {
      Logger.info('Test message', { key: 'value' }, 'TestSource');
      
      const logs = Logger.getLogs();
      expect(logs).toHaveLength(1);
      expect(logs[0].level).toBe(LogLevel.INFO);
      expect(logs[0].message).toBe('Test message');
    });

    it('should create GameError with code and context', () => {
      const error = new GameError('Test error', 'TEST_CODE', { extra: 'data' });
      
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
      expect(error.context).toEqual({ extra: 'data' });
    });
  });
});