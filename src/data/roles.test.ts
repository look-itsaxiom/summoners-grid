import { describe, it, expect } from 'vitest';
import { ROLES, getRoleDefinition } from './roles';
import type { RoleId } from '../types';

describe('Role System', () => {
  it('should have all roles defined (26+ per GDD)', () => {
    expect(Object.keys(ROLES).length).toBeGreaterThanOrEqual(26);
  });

  it('should have 3 tier 1 roles (one per family)', () => {
    const tier1 = Object.values(ROLES).filter(r => r.tier === 1);
    expect(tier1.length).toBe(3);
    expect(tier1.map(r => r.family).sort()).toEqual(['magician', 'scout', 'warrior']);
  });

  it('should have correct advancement paths for Paladin (multi-path convergence)', () => {
    const paladin = getRoleDefinition('paladin');
    expect(paladin.tier).toBe(3);
    expect(paladin.advancesFrom).toContain('knight');
    expect(paladin.advancesFrom).toContain('white_mage');
  });

  it('should have correct advancement paths for Spellblade', () => {
    const spellblade = getRoleDefinition('spellblade');
    expect(spellblade.tier).toBe(3);
    expect(spellblade.advancesFrom).toContain('berserker');
    expect(spellblade.advancesFrom).toContain('red_mage');
  });

  it('should have stat modifiers for all roles', () => {
    for (const role of Object.values(ROLES)) {
      expect(Object.keys(role.statModifiers).length).toBeGreaterThan(0);
    }
  });

  it('should have Berserker with high STR and low DEF modifier', () => {
    const berserker = getRoleDefinition('berserker');
    expect(berserker.statModifiers.STR).toBeGreaterThan(1.2);
    expect(berserker.statModifiers.DEF).toBeLessThan(1.0);
  });

  it('should have Assassin as tier 3 with high SPD/ACC/LCK', () => {
    const assassin = getRoleDefinition('assassin');
    expect(assassin.tier).toBe(3);
    expect(assassin.statModifiers.SPD).toBeGreaterThan(1.2);
    expect(assassin.statModifiers.ACC).toBeGreaterThan(1.2);
    expect(assassin.statModifiers.LCK).toBeGreaterThan(1.1);
  });

  it('should have all convergence roles accessible from multiple paths', () => {
    const convergenceRoles: RoleId[] = ['paladin', 'dread_knight', 'spellblade', 'battle_dancer', 'sage', 'shadowblade'];
    for (const roleId of convergenceRoles) {
      const role = getRoleDefinition(roleId);
      expect(role.advancesFrom.length).toBeGreaterThanOrEqual(2);
    }
  });
});
