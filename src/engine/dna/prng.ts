/**
 * Mulberry32 — deterministic 32-bit PRNG.
 * Given the same seed, always produces the same sequence.
 * Used for DNA-based card reconstruction.
 */
export function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Seeded random integer in range [min, max] (inclusive).
 */
export function seededInt(rng: () => number, min: number, max: number): number {
  return min + Math.floor(rng() * (max - min + 1));
}

/**
 * Seeded weighted random selection.
 * weights: Record<string, number> — higher weight = more likely.
 * Returns the selected key.
 */
export function seededWeightedChoice<T extends string>(
  rng: () => number,
  weights: Record<T, number>
): T {
  const entries = Object.entries(weights) as Array<[T, number]>;
  const total = entries.reduce((sum, [, w]) => sum + (w as number), 0);
  let roll = rng() * total;

  for (const [key, weight] of entries) {
    roll -= weight as number;
    if (roll <= 0) return key;
  }

  return entries[entries.length - 1][0];
}
