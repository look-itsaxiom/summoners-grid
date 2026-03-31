import { describe, it, expect } from 'vitest';
import { dnaToNFTMetadata } from './metadata';
import { generateDNA, reconstructCardFromDNA } from './index';
import { STAT_KEYS } from '../../types';

describe('DNA → NFT Metadata', () => {
  it('should produce valid metadata structure', () => {
    const dna = generateDNA('fae', 'rare');
    const meta = dnaToNFTMetadata(dna);

    expect(meta.name).toBeTruthy();
    expect(meta.description).toBeTruthy();
    expect(meta.attributes.length).toBeGreaterThan(20);
  });

  it('should include DNA as first attribute', () => {
    const dna = generateDNA();
    const meta = dnaToNFTMetadata(dna);

    const dnaAttr = meta.attributes.find(a => a.trait_type === 'DNA');
    expect(dnaAttr).toBeTruthy();
    expect(dnaAttr!.value).toBe(dna);
  });

  it('should include all 9 stats as number attributes', () => {
    const dna = generateDNA();
    const meta = dnaToNFTMetadata(dna);
    const card = reconstructCardFromDNA(dna);

    for (const key of STAT_KEYS) {
      const attr = meta.attributes.find(a => a.trait_type === key);
      expect(attr).toBeTruthy();
      expect(attr!.value).toBe(card.baseStats[key]);
      expect(attr!.display_type).toBe('number');
    }
  });

  it('should include all 9 growth rates', () => {
    const dna = generateDNA();
    const meta = dnaToNFTMetadata(dna);

    for (const key of STAT_KEYS) {
      const attr = meta.attributes.find(a => a.trait_type === `${key} Growth`);
      expect(attr).toBeTruthy();
      expect(typeof attr!.value).toBe('string');
    }
  });

  it('should include species and rarity capitalized', () => {
    const dna = generateDNA('stoneheart', 'legend');
    const meta = dnaToNFTMetadata(dna);

    const species = meta.attributes.find(a => a.trait_type === 'Species');
    const rarity = meta.attributes.find(a => a.trait_type === 'Rarity');
    expect(species!.value).toBe('Stoneheart');
    expect(rarity!.value).toBe('Legend');
  });

  it('should include Stat Total and Growth Score', () => {
    const dna = generateDNA();
    const meta = dnaToNFTMetadata(dna);

    const statTotal = meta.attributes.find(a => a.trait_type === 'Stat Total');
    const growthScore = meta.attributes.find(a => a.trait_type === 'Growth Score');
    expect(statTotal).toBeTruthy();
    expect(statTotal!.display_type).toBe('number');
    expect((statTotal!.value as number)).toBeGreaterThan(0);
    expect(growthScore).toBeTruthy();
    expect((growthScore!.value as number)).toBeGreaterThan(0);
  });

  it('should include equipment names', () => {
    const dna = generateDNA();
    const meta = dnaToNFTMetadata(dna);

    const weapon = meta.attributes.find(a => a.trait_type === 'Weapon');
    const armor = meta.attributes.find(a => a.trait_type === 'Armor');
    const acc = meta.attributes.find(a => a.trait_type === 'Accessory');
    expect(weapon).toBeTruthy();
    expect(armor).toBeTruthy();
    expect(acc).toBeTruthy();
  });

  it('should set external_url with tokenId', () => {
    const dna = generateDNA();
    const meta = dnaToNFTMetadata(dna, '0x1234');
    expect(meta.external_url).toContain('0x1234');
  });

  it('should set image and animation_url when provided', () => {
    const dna = generateDNA();
    const meta = dnaToNFTMetadata(dna, '1', 'ipfs://art', 'ipfs://sprite');
    expect(meta.image).toBe('ipfs://art');
    expect(meta.animation_url).toBe('ipfs://sprite');
  });

  it('same DNA should produce identical metadata', () => {
    const dna = generateDNA();
    const meta1 = dnaToNFTMetadata(dna);
    const meta2 = dnaToNFTMetadata(dna);
    expect(JSON.stringify(meta1)).toBe(JSON.stringify(meta2));
  });
});
