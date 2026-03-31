import { describe, it, expect } from 'vitest';
import {
  generateDNA,
  parseDNA,
  validateDNA,
  reconstructCardFromDNA,
  mulberry32,
} from './index';
import { STAT_KEYS } from '../../types';

describe('DNA: PRNG Determinism', () => {
  it('mulberry32 produces same sequence from same seed', () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(42);
    for (let i = 0; i < 100; i++) {
      expect(rng1()).toBe(rng2());
    }
  });

  it('different seeds produce different sequences', () => {
    const rng1 = mulberry32(42);
    const rng2 = mulberry32(43);
    // At least one of the first 10 values should differ
    let allSame = true;
    for (let i = 0; i < 10; i++) {
      if (rng1() !== rng2()) allSame = false;
    }
    expect(allSame).toBe(false);
  });
});

describe('DNA: Generation', () => {
  it('generates a 32-character hex string', () => {
    const dna = generateDNA();
    expect(dna).toHaveLength(32);
    expect(/^[0-9a-f]{32}$/.test(dna)).toBe(true);
  });

  it('generates valid DNA (passes validation)', () => {
    for (let i = 0; i < 20; i++) {
      const dna = generateDNA();
      expect(validateDNA(dna)).toBe(true);
    }
  });

  it('respects specified species', () => {
    const dna = generateDNA('fae');
    const parsed = parseDNA(dna);
    expect(parsed.speciesIndex).toBe(1); // fae = index 1
  });

  it('respects specified rarity', () => {
    const dna = generateDNA(undefined, 'myth');
    const parsed = parseDNA(dna);
    expect(parsed.rarityIndex).toBe(4); // myth = index 4
  });
});

describe('DNA: Validation', () => {
  it('rejects wrong length', () => {
    expect(validateDNA('abc')).toBe(false);
  });

  it('rejects non-hex characters', () => {
    expect(validateDNA('01023a4bf8c2d1e09a7b3c4d5e6fXXXX')).toBe(false);
  });

  it('rejects corrupted checksum', () => {
    const dna = generateDNA();
    // Flip last character
    const corrupted = dna.slice(0, 31) + (dna[31] === '0' ? '1' : '0');
    expect(validateDNA(corrupted)).toBe(false);
  });
});

describe('DNA: Round-Trip Reconstruction', () => {
  it('same DNA always produces identical card', () => {
    const dna = generateDNA();
    const card1 = reconstructCardFromDNA(dna);
    const card2 = reconstructCardFromDNA(dna);

    expect(card1.name).toBe(card2.name);
    expect(card1.species).toBe(card2.species);
    expect(card1.rarity).toBe(card2.rarity);
    expect(card1.baseStats).toEqual(card2.baseStats);
    expect(card1.growthRates).toEqual(card2.growthRates);
    expect(card1.equipment.weapon?.name).toBe(card2.equipment.weapon?.name);
    expect(card1.equipment.armor?.name).toBe(card2.equipment.armor?.name);
    expect(card1.equipment.accessory?.name).toBe(card2.equipment.accessory?.name);
  });

  it('round-trips 50 cards without any mismatch', () => {
    for (let i = 0; i < 50; i++) {
      const dna = generateDNA();
      const a = reconstructCardFromDNA(dna);
      const b = reconstructCardFromDNA(dna);
      expect(a.name).toBe(b.name);
      expect(a.baseStats).toEqual(b.baseStats);
      expect(a.growthRates).toEqual(b.growthRates);
    }
  });

  it('produces valid SummonCard fields', () => {
    const dna = generateDNA('stoneheart', 'rare');
    const card = reconstructCardFromDNA(dna);

    expect(card.cardType).toBe('summon');
    expect(card.species).toBe('stoneheart');
    expect(card.rarity).toBe('rare');
    expect(card.dna).toBe(dna);
    expect(card.id).toBe(`dna-${dna}`);

    // All 9 stats present and positive
    for (const key of STAT_KEYS) {
      expect(card.baseStats[key]).toBeGreaterThan(0);
      expect(card.baseStats[key]).toBeLessThanOrEqual(20);
    }

    // All 9 growth rates present
    for (const key of STAT_KEYS) {
      expect(card.growthRates[key]).toBeTruthy();
    }

    // Equipment present
    expect(card.equipment.weapon).toBeTruthy();
    expect(card.equipment.armor).toBeTruthy();
    expect(card.equipment.accessory).toBeTruthy();
  });

  it('different DNA produces different cards', () => {
    const dna1 = generateDNA();
    const dna2 = generateDNA();
    const card1 = reconstructCardFromDNA(dna1);
    const card2 = reconstructCardFromDNA(dna2);

    // At least name or stats should differ (astronomically unlikely to match)
    const statsMatch = JSON.stringify(card1.baseStats) === JSON.stringify(card2.baseStats);
    const nameMatch = card1.name === card2.name;
    expect(statsMatch && nameMatch).toBe(false);
  });

  it('rarity affects stat floors correctly', () => {
    // Generate many common and myth cards, verify myth has higher average stats
    let commonTotal = 0;
    let mythTotal = 0;
    const n = 50;

    for (let i = 0; i < n; i++) {
      const commonDna = generateDNA('gignen', 'common');
      const mythDna = generateDNA('gignen', 'myth');
      const commonCard = reconstructCardFromDNA(commonDna);
      const mythCard = reconstructCardFromDNA(mythDna);

      commonTotal += STAT_KEYS.reduce((s, k) => s + commonCard.baseStats[k], 0);
      mythTotal += STAT_KEYS.reduce((s, k) => s + mythCard.baseStats[k], 0);
    }

    // Myth should have higher average stat total due to +4 floor bonus
    expect(mythTotal / n).toBeGreaterThan(commonTotal / n);
  });
});

describe('DNA: Species-based equipment', () => {
  it('Fae should get magical weapons', () => {
    let magicalCount = 0;
    for (let i = 0; i < 20; i++) {
      const dna = generateDNA('fae');
      const card = reconstructCardFromDNA(dna);
      if (card.equipment.weapon?.damageType === 'magical') magicalCount++;
    }
    expect(magicalCount).toBe(20); // All Fae should get magical weapons
  });

  it('Wilderling should get ranged weapons', () => {
    let rangedCount = 0;
    for (let i = 0; i < 20; i++) {
      const dna = generateDNA('wilderling');
      const card = reconstructCardFromDNA(dna);
      if (card.equipment.weapon?.damageType === 'physical_ranged') rangedCount++;
    }
    expect(rangedCount).toBe(20);
  });

  it('Gignen should get melee weapons', () => {
    let meleeCount = 0;
    for (let i = 0; i < 20; i++) {
      const dna = generateDNA('gignen');
      const card = reconstructCardFromDNA(dna);
      if (card.equipment.weapon?.damageType === 'physical_melee') meleeCount++;
    }
    expect(meleeCount).toBe(20);
  });
});
