import { CombatSystem, CombatActionType, WeaponData, CombatAction } from './combat-system';
import { SummonStats, Attribute } from '@summoners-grid/shared-types';

describe('CombatSystem', () => {
  let combatSystem: CombatSystem;

  beforeEach(() => {
    // Use a deterministic seed for testing
    combatSystem = new CombatSystem('test-seed');
  });

  // Helper function to create sample stats
  const createSummonStats = (overrides: Partial<SummonStats> = {}): SummonStats => ({
    str: 15,
    end: 15,
    def: 15,
    int: 15,
    spi: 15,
    mdf: 15,
    spd: 15,
    acc: 15,
    lck: 15,
    level: 5,
    currentHp: 100,
    maxHp: 100,
    movement: 3,
    ...overrides
  });

  // Helper function to create sample weapon
  const createWeapon = (overrides: Partial<WeaponData> = {}): WeaponData => ({
    power: 30,
    type: 'melee',
    range: 1,
    attribute: Attribute.NEUTRAL,
    ...overrides
  });

  describe('Hit Calculation', () => {
    it('should calculate hit chance using GDD formula: Base Accuracy + (ACC / 10)', () => {
      // Test case from play example: ToHit = 85 + (14 / 10) = 86.4%
      const attacker = createSummonStats({ acc: 14 });
      
      const action: CombatAction = {
        type: CombatActionType.MAGICAL_ATTACK,
        attackerId: 'attacker',
        targetId: 'target',
        baseAccuracy: 85
      };

      const target = createSummonStats();
      const result = combatSystem.resolveCombat(action, attacker, target);
      
      expect(result.hitResult.toHit).toBe(86.4);
    });

    it('should use default 90% base accuracy for basic attacks', () => {
      // Test case from play example: ToHit = 90 + (16 / 10) = 91.6%
      const attacker = createSummonStats({ acc: 16 });
      
      const action: CombatAction = {
        type: CombatActionType.BASIC_ATTACK,
        attackerId: 'attacker',
        targetId: 'target',
        weapon: createWeapon()
      };

      const target = createSummonStats();
      const result = combatSystem.resolveCombat(action, attacker, target);
      
      expect(result.hitResult.toHit).toBe(91.6);
    });
  });

  describe('Critical Hit Calculation', () => {
    it('should calculate critical chance using GDD formula: Floor((LCK × 0.3375) + 1.65)', () => {
      // Test case from play example: CritChance = Floor((33 × 0.3375) + 1.65) = Floor(12.7875) = 12%
      const attacker = createSummonStats({ lck: 33 });
      
      const action: CombatAction = {
        type: CombatActionType.BASIC_ATTACK,
        attackerId: 'attacker',
        targetId: 'target',
        weapon: createWeapon()
      };

      const target = createSummonStats();
      const result = combatSystem.resolveCombat(action, attacker, target);
      
      expect(result.criticalResult.critChance).toBe(12);
    });

    it('should handle different luck values correctly', () => {
      // Test with LCK = 27: Floor((27 × 0.3375) + 1.65) = Floor(10.7625) = 10%
      const attacker = createSummonStats({ lck: 27 });
      
      const action: CombatAction = {
        type: CombatActionType.BASIC_ATTACK,
        attackerId: 'attacker',
        targetId: 'target',
        weapon: createWeapon()
      };

      const target = createSummonStats();
      const result = combatSystem.resolveCombat(action, attacker, target);
      
      expect(result.criticalResult.critChance).toBe(10);
    });
  });

  describe('Basic Physical Attack Damage', () => {
    it('should calculate damage using GDD formula: STR × (1 + WeaponPower/100) × (STR/TargetDEF) × IF_CRIT', () => {
      // Test case from play example: 44 × (1 + 40/100) × (44/16) × 1 = 44 × 1.4 × 2.75 = 169
      const attacker = createSummonStats({ str: 44 });
      const target = createSummonStats({ def: 16 });
      const weapon = createWeapon({ power: 40 });
      
      const action: CombatAction = {
        type: CombatActionType.BASIC_ATTACK,
        attackerId: 'attacker',
        targetId: 'target',
        weapon
      };

      // Force hit but no critical for this test
      const systemWithControlledRandom = new CombatSystem();
      // Mock the internal roll method to ensure hit but no crit
      (systemWithControlledRandom as any).roll = jest.fn()
        .mockReturnValueOnce(0) // Hit (0 < any reasonable to-hit)
        .mockReturnValueOnce(99); // No crit (99 >= crit chance)

      const result = systemWithControlledRandom.resolveCombat(action, attacker, target);
      
      expect(result.success).toBe(true);
      expect(result.damage.amount).toBe(169);
    });

    it('should apply critical multiplier of 1.5x for critical hits', () => {
      const attacker = createSummonStats({ str: 20 });
      const target = createSummonStats({ def: 10 });
      const weapon = createWeapon({ power: 0 });
      
      const action: CombatAction = {
        type: CombatActionType.BASIC_ATTACK,
        attackerId: 'attacker',
        targetId: 'target',
        weapon
      };

      // Force hit and critical
      const systemWithControlledRandom = new CombatSystem();
      (systemWithControlledRandom as any).roll = jest.fn()
        .mockReturnValueOnce(0) // Hit
        .mockReturnValueOnce(0); // Critical

      const result = systemWithControlledRandom.resolveCombat(action, attacker, target);
      
      // Expected: 20 × 1.0 × (20/10) × 1.5 = 60
      expect(result.damage.amount).toBe(60);
      expect(result.criticalResult.critical).toBe(true);
    });
  });

  describe('Bow Attack Damage', () => {
    it('should calculate damage using GDD formula: ((STR + ACC)/2) × (1 + WeaponPower/100) × (STR/TargetDEF) × CritMultiplier', () => {
      // Test case from play example: ((15 + 16)/2) × (1 + 30/100) × (15/12) × 1 = 15.5 × 1.3 × 1.25 = 25.1875 ≈ 25
      const attacker = createSummonStats({ str: 15, acc: 16 });
      const target = createSummonStats({ def: 12 });
      const weapon = createWeapon({ power: 30, type: 'bow' });
      
      const action: CombatAction = {
        type: CombatActionType.BOW_ATTACK,
        attackerId: 'attacker',
        targetId: 'target',
        weapon
      };

      // Force hit but no critical
      const systemWithControlledRandom = new CombatSystem();
      (systemWithControlledRandom as any).roll = jest.fn()
        .mockReturnValueOnce(0) // Hit
        .mockReturnValueOnce(99); // No crit

      const result = systemWithControlledRandom.resolveCombat(action, attacker, target);
      
      expect(result.success).toBe(true);
      expect(result.damage.amount).toBe(25);
    });

    it('should handle higher accuracy bow attacks correctly', () => {
      // Test from later in play example: ((25 + 45)/2) × 1.3 × (25/50) = 35 × 1.3 × 0.5 = 22.75 ≈ 22
      const attacker = createSummonStats({ str: 25, acc: 45 });
      const target = createSummonStats({ def: 50 });
      const weapon = createWeapon({ power: 30, type: 'bow' });
      
      const action: CombatAction = {
        type: CombatActionType.BOW_ATTACK,
        attackerId: 'attacker',
        targetId: 'target',
        weapon
      };

      // Force hit but no critical
      const systemWithControlledRandom = new CombatSystem();
      (systemWithControlledRandom as any).roll = jest.fn()
        .mockReturnValueOnce(0) // Hit
        .mockReturnValueOnce(99); // No crit

      const result = systemWithControlledRandom.resolveCombat(action, attacker, target);
      
      expect(result.damage.amount).toBe(22);
    });
  });

  describe('Magical Attack Damage', () => {
    it('should calculate damage using GDD formula: INT × (1 + BasePower/100) × (INT/TargetMDF) × IF_CRIT', () => {
      // Test case from play example: 19 × (1 + 60/100) × (19/11) = 19 × 1.6 × 1.7272... = 52.45... ≈ 52
      const attacker = createSummonStats({ int: 19 });
      const target = createSummonStats({ mdf: 11 });
      
      const action: CombatAction = {
        type: CombatActionType.MAGICAL_ATTACK,
        attackerId: 'attacker',
        targetId: 'target',
        basePower: 60,
        weapon: createWeapon({ attribute: Attribute.FIRE })
      };

      // Force hit but no critical
      const systemWithControlledRandom = new CombatSystem();
      (systemWithControlledRandom as any).roll = jest.fn()
        .mockReturnValueOnce(0) // Hit
        .mockReturnValueOnce(99); // No crit

      const result = systemWithControlledRandom.resolveCombat(action, attacker, target);
      
      expect(result.success).toBe(true);
      expect(result.damage.amount).toBe(52);
    });

    it('should handle different magical power levels', () => {
      // Test case from play example: 29 × (1 + 30/100) × (29/18) = 29 × 1.3 × 1.611... = 60.63... ≈ 60
      const attacker = createSummonStats({ int: 29 });
      const target = createSummonStats({ mdf: 18 });
      
      const action: CombatAction = {
        type: CombatActionType.MAGICAL_ATTACK,
        attackerId: 'attacker',
        targetId: 'target',
        basePower: 30
      };

      // Force hit but no critical
      const systemWithControlledRandom = new CombatSystem();
      (systemWithControlledRandom as any).roll = jest.fn()
        .mockReturnValueOnce(0) // Hit
        .mockReturnValueOnce(99); // No crit

      const result = systemWithControlledRandom.resolveCombat(action, attacker, target);
      
      expect(result.damage.amount).toBe(60);
    });
  });

  describe('Healing', () => {
    it('should calculate healing using GDD formula: SPI × (1 + BasePower/100) × IF_CRIT', () => {
      const caster = createSummonStats({ spi: 20 });
      const target = createSummonStats({ currentHp: 50 }); // Wounded target
      
      const action: CombatAction = {
        type: CombatActionType.HEAL,
        attackerId: 'caster',
        targetId: 'target',
        basePower: 50
      };

      // Force hit but no critical
      const systemWithControlledRandom = new CombatSystem();
      (systemWithControlledRandom as any).roll = jest.fn()
        .mockReturnValueOnce(0) // Hit
        .mockReturnValueOnce(99); // No crit

      const result = systemWithControlledRandom.resolveCombat(action, caster, target);
      
      // Expected: 20 × (1 + 50/100) × 1 = 20 × 1.5 = 30 healing
      expect(result.success).toBe(true);
      expect(result.damage.amount).toBe(-30); // Negative for healing
      expect(result.finalTargetHp).toBe(80); // 50 + 30
    });

    it('should not heal beyond max HP', () => {
      const caster = createSummonStats({ spi: 30 });
      const target = createSummonStats({ currentHp: 90, maxHp: 100 });
      
      const action: CombatAction = {
        type: CombatActionType.HEAL,
        attackerId: 'caster',
        targetId: 'target',
        basePower: 100
      };

      // Force hit but no critical
      const systemWithControlledRandom = new CombatSystem();
      (systemWithControlledRandom as any).roll = jest.fn()
        .mockReturnValueOnce(0) // Hit
        .mockReturnValueOnce(99); // No crit

      const result = systemWithControlledRandom.resolveCombat(action, caster, target);
      
      // Healing would be 30 × 2 = 60, but should cap at max HP
      expect(result.finalTargetHp).toBe(100);
    });
  });

  describe('Miss Handling', () => {
    it('should deal no damage on miss', () => {
      const attacker = createSummonStats();
      const target = createSummonStats();
      
      const action: CombatAction = {
        type: CombatActionType.BASIC_ATTACK,
        attackerId: 'attacker',
        targetId: 'target',
        weapon: createWeapon()
      };

      // Force miss
      const systemWithControlledRandom = new CombatSystem();
      (systemWithControlledRandom as any).roll = jest.fn()
        .mockReturnValue(99); // Miss (99 >= any reasonable to-hit)

      const result = systemWithControlledRandom.resolveCombat(action, attacker, target);
      
      expect(result.success).toBe(false);
      expect(result.hitResult.hit).toBe(false);
      expect(result.damage.amount).toBe(0);
      expect(result.finalTargetHp).toBe(target.currentHp);
    });
  });

  describe('Range Validation', () => {
    it('should fail combat if target is out of range', () => {
      const attacker = createSummonStats();
      const target = createSummonStats();
      const weapon = createWeapon({ range: 1 });
      
      const action: CombatAction = {
        type: CombatActionType.BASIC_ATTACK,
        attackerId: 'attacker',
        targetId: 'target',
        weapon
      };

      const attackerPos = { x: 0, y: 0 };
      const targetPos = { x: 3, y: 0 }; // 3 squares away, outside range 1
      
      const result = combatSystem.resolveCombat(action, attacker, target, attackerPos, targetPos);
      
      expect(result.success).toBe(false);
      expect(result.log).toContain('Attack failed: Target out of range');
    });

    it('should succeed if target is within range', () => {
      const attacker = createSummonStats();
      const target = createSummonStats();
      const weapon = createWeapon({ range: 3 });
      
      const action: CombatAction = {
        type: CombatActionType.BASIC_ATTACK,
        attackerId: 'attacker',
        targetId: 'target',
        weapon
      };

      const attackerPos = { x: 0, y: 0 };
      const targetPos = { x: 2, y: 2 }; // 2 squares away diagonally, within range 3
      
      // Force hit for this test
      const systemWithControlledRandom = new CombatSystem();
      (systemWithControlledRandom as any).roll = jest.fn()
        .mockReturnValueOnce(0) // Hit
        .mockReturnValueOnce(99); // No crit

      const result = systemWithControlledRandom.resolveCombat(action, attacker, target, attackerPos, targetPos);
      
      expect(result.success).toBe(true);
    });
  });

  describe('Defeat Detection', () => {
    it('should detect when a summon is defeated', () => {
      const attacker = createSummonStats({ str: 100 }); // High damage
      const target = createSummonStats({ currentHp: 10, def: 1 }); // Low HP and defense
      const weapon = createWeapon({ power: 100 });
      
      const action: CombatAction = {
        type: CombatActionType.BASIC_ATTACK,
        attackerId: 'attacker',
        targetId: 'target',
        weapon
      };

      // Force hit but no critical
      const systemWithControlledRandom = new CombatSystem();
      (systemWithControlledRandom as any).roll = jest.fn()
        .mockReturnValueOnce(0) // Hit
        .mockReturnValueOnce(99); // No crit

      const result = systemWithControlledRandom.resolveCombat(action, attacker, target);
      
      expect(result.success).toBe(true);
      expect(result.defeated).toBe(true);
      expect(result.finalTargetHp).toBe(0);
    });
  });

  describe('Utility Methods', () => {
    it('should apply damage correctly', () => {
      const summon = createSummonStats({ currentHp: 80, maxHp: 100 });
      const damage = { amount: 30, attribute: Attribute.FIRE, source: 'test' };
      
      const result = combatSystem.applyDamage(summon, damage);
      
      expect(result.currentHp).toBe(50);
    });

    it('should detect defeat correctly', () => {
      const aliveSummon = createSummonStats({ currentHp: 1 });
      const deadSummon = createSummonStats({ currentHp: 0 });
      
      expect(combatSystem.isDefeated(aliveSummon)).toBe(false);
      expect(combatSystem.isDefeated(deadSummon)).toBe(true);
    });

    it('should determine correct damage type for weapons', () => {
      const meleeWeapon = createWeapon({ type: 'melee' });
      const bowWeapon = createWeapon({ type: 'bow' });
      const magicWeapon = createWeapon({ type: 'magic' });
      
      expect(combatSystem.getDamageTypeForWeapon(meleeWeapon)).toBe(CombatActionType.BASIC_ATTACK);
      expect(combatSystem.getDamageTypeForWeapon(bowWeapon)).toBe(CombatActionType.BOW_ATTACK);
      expect(combatSystem.getDamageTypeForWeapon(magicWeapon)).toBe(CombatActionType.MAGICAL_ATTACK);
    });
  });

  describe('Complex Combat Scenarios', () => {
    it('should handle the Berserker vs Fae Magician scenario from play example', () => {
      // This tests the specific example from Turn 5 of the play document
      const berserker = createSummonStats({
        str: 44,
        lck: 33,
        acc: 16,
        currentHp: 169,
        maxHp: 190
      });
      
      const faeMagician = createSummonStats({
        def: 16,
        currentHp: 102,
        maxHp: 102
      });
      
      const weapon = createWeapon({ power: 40, type: 'melee' });
      
      const action: CombatAction = {
        type: CombatActionType.BASIC_ATTACK,
        attackerId: 'berserker',
        targetId: 'fae-magician',
        weapon
      };

      // Force hit but no critical (as shown in play example)
      const systemWithControlledRandom = new CombatSystem();
      (systemWithControlledRandom as any).roll = jest.fn()
        .mockReturnValueOnce(27) // Hit (example shows roll of 27)
        .mockReturnValueOnce(45); // No crit (example shows roll of 45)

      const result = systemWithControlledRandom.resolveCombat(action, berserker, faeMagician);
      
      expect(result.success).toBe(true);
      expect(result.hitResult.hit).toBe(true);
      expect(result.criticalResult.critical).toBe(false);
      expect(result.damage.amount).toBe(169); // Expected from play example
      expect(result.defeated).toBe(true); // 102 HP - 169 damage = defeated
    });
  });
});