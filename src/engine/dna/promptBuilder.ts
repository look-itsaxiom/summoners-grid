/**
 * DNA → AI Art Prompt builder.
 * Derives visual description from card DNA for ComfyUI/Stable Diffusion.
 */

import type { StatKey } from '../../types';
import { STAT_KEYS } from '../../types';
import { reconstructCardFromDNA, parseDNA } from './index';
// Constants used internally for index-based lookups

const SPECIES_VISUAL: Record<string, string> = {
  gignen: 'human-like adventurer, versatile build, neutral expression',
  fae: 'ethereal elf with pointed ears, graceful features, luminous skin',
  stoneheart: 'stout dwarf, broad shoulders, stone-like skin texture, craftsman build',
  wilderling: 'bestial humanoid, fur-covered, primal features, keen eyes',
  angar: 'celestial being, radiant features, wings of light, wise expression',
  demar: 'devilish figure, horns, clever expression, arcane markings',
  creptilis: 'reptilian humanoid, scales, calculating eyes, armored tail',
};

const RARITY_AURA: Record<string, string> = {
  common: 'no special aura, plain background',
  uncommon: 'faint green shimmer around the figure',
  rare: 'blue magical aura, glowing edges',
  legend: 'golden radiant aura, ornate frame elements',
  myth: 'prismatic rainbow aura, divine light, cosmic energy swirling',
};

const STAT_ARCHETYPE: Record<StatKey, string> = {
  STR: 'muscular build, powerful stance, imposing physique',
  END: 'scarred and weathered, thick-skinned, enduring posture',
  DEF: 'heavily armored, shield-bearing, defensive stance',
  INT: 'scholarly appearance, glowing runes, mystical implements',
  SPI: 'serene expression, holy symbols, gentle radiance',
  MDF: 'warded appearance, protective glyphs, barrier shimmer',
  SPD: 'lean and agile, wind-swept, dynamic pose',
  ACC: 'sharp-eyed, precise stance, focused expression',
  LCK: 'charmed appearance, four-leaf motifs, dice accessories',
};

const FLAIR_BACKGROUNDS = [
  'ancient forest clearing', 'crumbling ruins at dusk', 'battlefield aftermath',
  'mountain peak at dawn', 'underground cavern with crystals', 'stormy coastal cliff',
  'moonlit graveyard', 'sun-drenched meadow', 'volcanic forge',
  'floating island in clouds', 'frozen tundra', 'enchanted library',
];

const FLAIR_POSES = [
  'battle-ready stance', 'meditative pose', 'commanding gesture',
  'sneaking forward', 'leaping into action', 'standing victorious',
  'casting a spell', 'drawing a weapon', 'defensive crouch',
  'looking into the distance', 'emerging from shadows', 'rallying allies',
];

/**
 * Build an AI art generation prompt from a DNA string.
 */
export function dnaToArtPrompt(dna: string): string {
  const card = reconstructCardFromDNA(dna);
  const parsed = parseDNA(dna);
  const species = card.species;
  const rarity = card.rarity;

  // Find highest stat for archetype
  let highestStat: StatKey = 'STR';
  let highestValue = 0;
  for (const key of STAT_KEYS) {
    if (card.baseStats[key] > highestValue) {
      highestValue = card.baseStats[key];
      highestStat = key;
    }
  }

  // Equipment descriptions
  const weaponDesc = card.equipment.weapon?.name ?? 'bare hands';
  const armorDesc = card.equipment.armor?.name ?? 'simple clothing';
  const accessoryDesc = card.equipment.accessory?.name ?? 'no accessories';

  // Flair from visual seed
  const flairBg = FLAIR_BACKGROUNDS[parsed.flairSeed % FLAIR_BACKGROUNDS.length];
  const flairPose = FLAIR_POSES[Math.floor(parsed.flairSeed / FLAIR_BACKGROUNDS.length) % FLAIR_POSES.length];

  const parts = [
    'Fantasy TCG card art, portrait composition',
    SPECIES_VISUAL[species],
    RARITY_AURA[rarity],
    STAT_ARCHETYPE[highestStat],
    `wearing ${armorDesc}`,
    `wielding ${weaponDesc}`,
    `${accessoryDesc} visible`,
    flairPose,
    `background: ${flairBg}`,
    'detailed illustration, game card style, dark fantasy theme',
  ];

  return parts.join(', ');
}

/**
 * Build a shorter prompt for board sprite generation.
 */
export function dnaToSpritePrompt(dna: string): string {
  const card = reconstructCardFromDNA(dna);

  return [
    'Pixel art game sprite, 64x64',
    `${card.species} ${card.rarity}`,
    SPECIES_VISUAL[card.species].split(',')[0], // Just the creature type
    `holding ${card.equipment.weapon?.name ?? 'nothing'}`,
    'chibi proportions, transparent background',
  ].join(', ');
}
