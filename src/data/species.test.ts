import { describe, it, expect } from 'vitest';
import { SPECIES, getSpeciesTemplate } from './species';
import { STAT_KEYS } from '../types';

describe('Species System', () => {
  it('should have all 7 species defined', () => {
    expect(Object.keys(SPECIES).length).toBe(7);
  });

  it('should have all species with valid stat ranges', () => {
    for (const species of Object.values(SPECIES)) {
      for (const key of STAT_KEYS) {
        const [min, max] = species.statRanges[key];
        expect(min).toBeGreaterThanOrEqual(1);
        expect(max).toBeGreaterThanOrEqual(min);
        expect(max).toBeLessThanOrEqual(20);
      }
    }
  });

  it('should have Gignen as a balanced generalist (8-12 range)', () => {
    const gignen = getSpeciesTemplate('gignen');
    for (const key of STAT_KEYS) {
      const [min, max] = gignen.statRanges[key];
      expect(min).toBeGreaterThanOrEqual(8);
      expect(max).toBeLessThanOrEqual(12);
    }
  });

  it('should have Fae with high INT and SPI', () => {
    const fae = getSpeciesTemplate('fae');
    expect(fae.statRanges.INT[1]).toBeGreaterThanOrEqual(14);
    expect(fae.statRanges.SPI[1]).toBeGreaterThanOrEqual(12);
  });

  it('should have Wilderling with high STR and SPD', () => {
    const wilderling = getSpeciesTemplate('wilderling');
    expect(wilderling.statRanges.STR[1]).toBeGreaterThanOrEqual(14);
    expect(wilderling.statRanges.SPD[1]).toBeGreaterThanOrEqual(14);
  });

  it('should have Stoneheart with high END and DEF', () => {
    const stoneheart = getSpeciesTemplate('stoneheart');
    expect(stoneheart.statRanges.END[1]).toBeGreaterThanOrEqual(14);
    expect(stoneheart.statRanges.DEF[1]).toBeGreaterThanOrEqual(12);
  });

  it('should have all species with name and description', () => {
    for (const species of Object.values(SPECIES)) {
      expect(species.name.length).toBeGreaterThan(0);
      expect(species.description.length).toBeGreaterThan(0);
    }
  });

  it('should have unique species IDs', () => {
    const ids = Object.keys(SPECIES);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
