/**
 * A simple Linear Congruential Generator (LCG) for deterministic, seedable random numbers.
 * This avoids external dependencies.
 */
export class SeedableRNG {
    private seed: number;

    constructor(seed: number) {
        this.seed = seed;
    }

    /**
     * Returns a pseudo-random number between 0 (inclusive) and 1 (exclusive).
     */
    public next(): number {
        // Parameters from a common LCG implementation (e.g., ANSI C)
        const a = 1103515245;
        const c = 12345;
        const m = Math.pow(2, 31);
        this.seed = (a * this.seed + c) % m;
        return this.seed / m;
    }
}

/**
 * A simple function to generate a v4-like UUID without external dependencies.
 */
export function generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}