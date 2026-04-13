import { NextRequest, NextResponse } from 'next/server';
import { findOrCreateUser, getUserCards } from '../../../src/server/db';

/**
 * GET /api/collection?walletAddress=0x...
 *
 * Returns cards owned by the user.
 * Dev mode: accepts walletAddress as query param.
 * Production: extract wallet from Passport JWT.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const walletAddress = searchParams.get('walletAddress');

  // Auth check
  const authHeader = request.headers.get('authorization');
  let resolvedWallet = walletAddress;

  if (authHeader?.startsWith('Bearer ')) {
    // TODO: verify JWT and extract wallet
  }

  if (!resolvedWallet) {
    return NextResponse.json({ error: 'walletAddress required' }, { status: 400 });
  }

  const user = findOrCreateUser(resolvedWallet);
  const cards = getUserCards(user.id);

  // Optional filters
  const species = searchParams.get('species');
  const rarity = searchParams.get('rarity');

  let filtered = cards as any[];
  if (species) filtered = filtered.filter((c: any) => c.species === species);
  if (rarity) filtered = filtered.filter((c: any) => c.rarity === rarity);

  return NextResponse.json({
    success: true,
    collection: filtered,
    total: filtered.length,
    user: { id: user.id, walletAddress: user.wallet_address },
  });
}
