import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/collection
 *
 * Returns NFTs owned by the authenticated user.
 * In production: queries Immutable Indexer by wallet address.
 * For now: returns empty collection.
 *
 * Query params:
 * - species: filter by species
 * - rarity: filter by rarity
 * - sort: 'stat_total' | 'rarity' | 'name'
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // Query params
  const { searchParams } = new URL(request.url);
  const species = searchParams.get('species');
  const rarity = searchParams.get('rarity');
  const sort = searchParams.get('sort') ?? 'name';

  // TODO: Query Immutable Indexer
  // const indexer = new blockchainData.BlockchainData({ ... });
  // const nfts = await indexer.listNFTsByAccountAddress({ ... });

  return NextResponse.json({
    success: true,
    collection: [],
    filters: { species, rarity, sort },
    total: 0,
    message: 'Collection endpoint ready. Indexer integration pending contract deployment.',
  });
}
