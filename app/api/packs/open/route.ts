import { NextRequest, NextResponse } from 'next/server';
import { generateDNA, reconstructCardFromDNA } from '../../../../src/engine/dna';
import { dnaToNFTMetadata } from '../../../../src/engine/dna/metadata';
import type { Rarity } from '../../../../src/types';

/**
 * POST /api/packs/open
 *
 * Server-side pack opening — generates DNA with server entropy,
 * returns cards with their DNA strings.
 *
 * In production, this would also:
 * 1. Verify user authentication (Passport JWT)
 * 2. Mint NFTs on Immutable via Minting API
 * 3. Queue art generation jobs
 * 4. Debit pack cost from user
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const packSize = Math.min(Math.max(body.packSize ?? 5, 1), 10);

    // Generate cards with server-side entropy
    // In production: use crypto.getRandomValues() for true randomness
    const cards = [];

    for (let i = 0; i < packSize; i++) {
      // Rarity guarantees per slot
      let rarity: Rarity | undefined;
      if (i === packSize - 1) {
        // Last slot: guaranteed rare+
        const roll = Math.random();
        rarity = roll < 0.7 ? 'rare' : roll < 0.92 ? 'legend' : 'myth';
      } else if (i === packSize - 2) {
        // Second-to-last: guaranteed uncommon+
        const roll = Math.random();
        rarity = roll < 0.6 ? 'uncommon' : roll < 0.85 ? 'rare' : roll < 0.97 ? 'legend' : 'myth';
      }

      const dna = generateDNA(undefined, rarity);
      const card = reconstructCardFromDNA(dna);
      const metadata = dnaToNFTMetadata(dna);

      cards.push({
        dna,
        name: card.name,
        species: card.species,
        rarity: card.rarity,
        metadata,
        // In production: tokenId from Immutable mint response
        tokenId: null,
      });
    }

    return NextResponse.json({
      success: true,
      packSize,
      cards,
      // In production: reference_id for idempotency
      referenceId: `pack-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to open pack' },
      { status: 500 }
    );
  }
}
