import { describe, it, expect } from 'vitest';
import { dnaToArtPrompt, dnaToSpritePrompt } from './promptBuilder';
import { generateDNA, reconstructCardFromDNA } from './index';

describe('DNA → Art Prompt Builder', () => {
  it('should produce a non-empty prompt string', () => {
    const dna = generateDNA('fae', 'rare');
    const prompt = dnaToArtPrompt(dna);
    expect(prompt.length).toBeGreaterThan(50);
  });

  it('should include species visual description', () => {
    const dna = generateDNA('stoneheart', 'common');
    const prompt = dnaToArtPrompt(dna);
    expect(prompt).toContain('dwarf');
    expect(prompt).toContain('stone-like');
  });

  it('should include rarity aura for legend cards', () => {
    const dna = generateDNA('gignen', 'legend');
    const prompt = dnaToArtPrompt(dna);
    expect(prompt).toContain('golden');
  });

  it('should include rarity aura for myth cards', () => {
    const dna = generateDNA('fae', 'myth');
    const prompt = dnaToArtPrompt(dna);
    expect(prompt).toContain('prismatic');
  });

  it('should include weapon name in prompt', () => {
    const dna = generateDNA('gignen', 'rare');
    const card = reconstructCardFromDNA(dna);
    const prompt = dnaToArtPrompt(dna);
    if (card.equipment.weapon) {
      expect(prompt.toLowerCase()).toContain(card.equipment.weapon.name.toLowerCase());
    }
  });

  it('should include armor name in prompt', () => {
    const dna = generateDNA('wilderling', 'uncommon');
    const card = reconstructCardFromDNA(dna);
    const prompt = dnaToArtPrompt(dna);
    if (card.equipment.armor) {
      expect(prompt.toLowerCase()).toContain(card.equipment.armor.name.toLowerCase());
    }
  });

  it('same DNA should produce same prompt', () => {
    const dna = generateDNA();
    const prompt1 = dnaToArtPrompt(dna);
    const prompt2 = dnaToArtPrompt(dna);
    expect(prompt1).toBe(prompt2);
  });

  it('should include dark fantasy theme', () => {
    const dna = generateDNA();
    const prompt = dnaToArtPrompt(dna);
    expect(prompt).toContain('dark fantasy');
  });
});

describe('DNA → Sprite Prompt Builder', () => {
  it('should produce a pixel art prompt', () => {
    const dna = generateDNA('creptilis', 'rare');
    const prompt = dnaToSpritePrompt(dna);
    expect(prompt).toContain('Pixel art');
    expect(prompt).toContain('64x64');
  });

  it('should include species in sprite prompt', () => {
    const dna = generateDNA('demar', 'uncommon');
    const prompt = dnaToSpritePrompt(dna);
    expect(prompt).toContain('demar');
  });
});
