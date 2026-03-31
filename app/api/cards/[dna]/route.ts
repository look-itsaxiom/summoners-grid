import { NextRequest, NextResponse } from 'next/server';
import { validateDNA, reconstructCardFromDNA } from '../../../../src/engine/dna';
import { dnaToNFTMetadata } from '../../../../src/engine/dna/metadata';
import { dnaToArtPrompt } from '../../../../src/engine/dna/promptBuilder';

/**
 * GET /api/cards/[dna]
 *
 * Reconstruct a card from its DNA string.
 * Returns full card data, NFT metadata, and art prompt.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ dna: string }> }
) {
  const { dna } = await params;

  if (!validateDNA(dna)) {
    return NextResponse.json(
      { error: 'Invalid DNA string' },
      { status: 400 }
    );
  }

  try {
    const card = reconstructCardFromDNA(dna);
    const metadata = dnaToNFTMetadata(dna);
    const artPrompt = dnaToArtPrompt(dna);

    return NextResponse.json({
      dna,
      card: {
        name: card.name,
        species: card.species,
        rarity: card.rarity,
        baseStats: card.baseStats,
        growthRates: card.growthRates,
        equipment: {
          weapon: card.equipment.weapon?.name ?? null,
          armor: card.equipment.armor?.name ?? null,
          accessory: card.equipment.accessory?.name ?? null,
        },
      },
      metadata,
      artPrompt,
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to reconstruct card from DNA' },
      { status: 500 }
    );
  }
}
