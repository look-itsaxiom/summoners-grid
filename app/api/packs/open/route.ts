import { NextRequest, NextResponse } from 'next/server';
import { generateDNA, reconstructCardFromDNA } from '../../../../src/engine/dna';
import { dnaToNFTMetadata } from '../../../../src/engine/dna/metadata';
import { findOrCreateUser, createCard, createPackPurchase, completePackPurchase } from '../../../../src/server/db';
import type { Rarity } from '../../../../src/types';

/**
 * POST /api/packs/open
 *
 * Opens a card pack:
 * 1. Verify user auth (or create dev user)
 * 2. Create pack purchase record
 * 3. Generate cards with DNA
 * 4. Store cards in database
 * 5. Return card data
 *
 * Body: { packType?: "standard" | "premium", walletAddress?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const packType: string = body.packType ?? 'standard';
    const packSize = packType === 'premium' ? 10 : 5;
    const priceCents = packType === 'premium' ? 1000 : 300; // $10 or $3

    // Auth: get wallet address from header or body (dev mode: accept body)
    const authHeader = request.headers.get('authorization');
    let walletAddress = body.walletAddress ?? null;

    if (authHeader?.startsWith('Bearer ')) {
      // TODO: verify Immutable Passport JWT and extract wallet
      // For now: use wallet from body
    }

    if (!walletAddress) {
      // Dev mode: create a test user
      walletAddress = '0xdev_' + Date.now().toString(16);
    }

    // Find or create user
    const user = findOrCreateUser(walletAddress, body.email);

    // Create pack purchase record
    const packId = createPackPurchase(user.id, packType, packSize, priceCents);

    // Generate cards
    const cards = [];
    const cardDNAs: string[] = [];

    for (let i = 0; i < packSize; i++) {
      // Rarity guarantees
      let rarity: Rarity | undefined;
      if (i === packSize - 1) {
        const roll = Math.random();
        rarity = roll < 0.7 ? 'rare' : roll < 0.92 ? 'legend' : 'myth';
      } else if (i === packSize - 2) {
        const roll = Math.random();
        rarity = roll < 0.6 ? 'uncommon' : roll < 0.85 ? 'rare' : roll < 0.97 ? 'legend' : 'myth';
      }

      const dna = generateDNA(undefined, rarity);
      const card = reconstructCardFromDNA(dna);
      const metadata = dnaToNFTMetadata(dna);

      // Store card in database
      const cardId = createCard(user.id, dna, card.species, card.rarity, card.name, card.role ?? undefined);
      cardDNAs.push(dna);

      cards.push({
        id: cardId,
        dna,
        name: card.name,
        species: card.species,
        rarity: card.rarity,
        role: card.role,
        metadata,
        tokenId: null, // Will be set after NFT minting
      });
    }

    // Complete the pack purchase (dev mode: auto-complete without payment)
    completePackPurchase(packId, `dev_${Date.now()}`, cardDNAs);

    return NextResponse.json({
      success: true,
      packId,
      packType,
      packSize,
      priceCents,
      cards,
      user: { id: user.id, walletAddress: user.wallet_address },
    });
  } catch (error) {
    console.error('Pack open error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to open pack' },
      { status: 500 }
    );
  }
}
