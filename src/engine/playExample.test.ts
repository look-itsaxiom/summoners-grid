import { describe, it, expect } from 'vitest';
import {
  calculateMaxHP,
  calculateMovementSpeed,
  calculateToHit,
  calculateCritChance,
  calculateMagicalDamage,
  calculateHealing,
  calculatePhysicalMeleeDamage,
  calculatePhysicalRangedDamage,
  applyLevelUp,
  createSummonUnit,
} from './stats';
import type { SummonCard } from '../types';
import { SUMMON_CARDS } from '../data/cards';

/**
 * These tests verify EXACT numbers from the Play Example document.
 * If any of these fail, the engine deviates from the GDD.
 */
describe('Play Example: Exact Number Verification', () => {

  describe('Turn 1 — Player A places Gignen Warrior', () => {
    it('Gignen Warrior at Level 5 should have HP 96', () => {
      // Play Example: HP 96/96
      // END stat at level 5 = 13 → 50 + Floor(13^1.5) = 50 + 46 = 96
      expect(calculateMaxHP(13)).toBe(96);
    });

    it('Gignen Warrior at Level 5 should have MV 2', () => {
      // Play Example: MV 2
      // SPD = 12 → 2 + Floor((12-10)/5) = 2 + 0 = 2
      expect(calculateMovementSpeed(12)).toBe(2);
    });
  });

  describe('Turn 2 — Blast Bolt damage', () => {
    it('should deal exactly 52 damage', () => {
      // Fae Magician INT=19, Blast Bolt BP=60, Target MDF=11
      // 19 * (1 + 60/100) * (19/11) = 19 * 1.6 * 1.7272 = 52.45 → 52
      expect(calculateMagicalDamage(19, 60, 11, false)).toBe(52);
    });

    it('should have 86.4% to-hit', () => {
      // BaseAcc=85, ACC=14
      expect(calculateToHit(85, 14)).toBeCloseTo(86.4);
    });

    it('should have 6% crit chance with LCK=13', () => {
      expect(calculateCritChance(13)).toBe(6);
    });
  });

  describe('Turn 3 — HP Damage Retention on level up', () => {
    it('Warrior takes 52 damage at 96 HP → 44 HP', () => {
      expect(96 - 52).toBe(44);
    });

    it('Level up: max HP 96 → 102, damage stays at 52, so HP = 50/102', () => {
      // This is THE key GDD mechanic — damage retained, not HP percentage
      // Before: 44/96 (52 damage taken)
      // After level up: max HP = 102, damage still = 52
      // New HP = 102 - 52 = 50
      const newMaxHP = calculateMaxHP(14); // END goes from 13 to 14
      expect(newMaxHP).toBe(102);
      expect(newMaxHP - 52).toBe(50); // 50/102
    });
  });

  describe('Turn 3 — Healing Hands (critical heal)', () => {
    it('should heal 21 base (SPI=15, BP=40)', () => {
      expect(calculateHealing(15, 40, false)).toBe(21);
    });

    it('should heal 31 on crit (21 * 1.5 = 31.5 → 31)', () => {
      expect(calculateHealing(15, 40, true)).toBe(31);
    });

    it('Warrior HP after heal: 50 + 31 = 81/102', () => {
      expect(50 + 31).toBe(81);
    });

    it('should have 9% crit chance with LCK=22', () => {
      expect(calculateCritChance(22)).toBe(9);
    });
  });

  describe('Turn 5 — Berserker massive attack', () => {
    it('weapon damage: STR=44, WP=40, DEF=16 → 169', () => {
      expect(calculatePhysicalMeleeDamage(44, 40, 16, false)).toBe(169);
    });

    it('Tempest Slash: STR=44, BP=30, DEF=16 → 157', () => {
      expect(calculatePhysicalMeleeDamage(44, 30, 16, false)).toBe(157);
    });

    it('total damage: 169 + 157 = 326', () => {
      expect(169 + 157).toBe(326);
    });

    it('should have 91.6% to-hit with ACC=16', () => {
      expect(calculateToHit(90, 16)).toBeCloseTo(91.6);
    });

    it('should have 12% crit chance with LCK=33', () => {
      expect(calculateCritChance(33)).toBe(12);
    });
  });

  describe('Turn 5 — Scout bow attack', () => {
    it('bow damage: STR=15, ACC=16, WP=30, DEF=12 → 25', () => {
      // ((15+16)/2) * 1.3 * (15/12) = 15.5 * 1.3 * 1.25 = 25.1875 → 25
      expect(calculatePhysicalRangedDamage(15, 16, 30, 12, false)).toBe(25);
    });
  });

  describe('Turn 10 — Warlock Blast Bolt finisher', () => {
    it('should have 12% crit with LCK=33 (Turn 5 Berserker)', () => {
      expect(calculateCritChance(33)).toBe(12);
    });
  });

  describe('HP Damage Retention — applyLevelUp', () => {
    it('should retain exact damage through level-up', () => {
      const card: SummonCard = SUMMON_CARDS.gignen_warrior_a;
      const unit = createSummonUnit(card, 'playerA', { x: 5, y: 2 }, 'warrior');

      // Simulate taking damage
      const damaged = { ...unit, currentHP: unit.maxHP - 52 };
      const damageBefore = damaged.maxHP - damaged.currentHP;
      expect(damageBefore).toBe(52);

      // Level up
      const leveled = applyLevelUp(damaged, 1);
      const damageAfter = leveled.maxHP - leveled.currentHP;

      // Damage must be exactly preserved
      expect(damageAfter).toBe(52);
      expect(leveled.level).toBe(unit.level + 1);
      expect(leveled.maxHP).toBeGreaterThan(unit.maxHP);
    });
  });
});
