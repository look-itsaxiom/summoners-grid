import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/marketplace/listings
 *
 * Browse active marketplace listings.
 * In production: queries Immutable Orderbook for active sell orders.
 *
 * Query params:
 * - species: filter by species
 * - rarity: filter by rarity
 * - minStat: minimum stat total
 * - maxPrice: maximum price in IMX
 * - sort: 'price_asc' | 'price_desc' | 'newest' | 'stat_total'
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  return NextResponse.json({
    success: true,
    listings: [],
    filters: {
      species: searchParams.get('species'),
      rarity: searchParams.get('rarity'),
      minStat: searchParams.get('minStat'),
      maxPrice: searchParams.get('maxPrice'),
      sort: searchParams.get('sort') ?? 'newest',
    },
    total: 0,
    message: 'Marketplace endpoint ready. Orderbook integration pending contract deployment.',
  });
}

/**
 * POST /api/marketplace/listings
 *
 * Create a new sell listing (gasless via Orderbook).
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  try {
    const body = await request.json();
    const { tokenId, price, currency } = body;

    if (!tokenId || !price) {
      return NextResponse.json(
        { error: 'tokenId and price are required' },
        { status: 400 }
      );
    }

    // TODO: Create Orderbook listing
    // const orderbook = new orderbook.Orderbook({ ... });
    // const listing = await orderbook.prepareListing({ ... });

    return NextResponse.json({
      success: true,
      listing: {
        tokenId,
        price,
        currency: currency ?? 'IMX',
        status: 'pending',
      },
      message: 'Listing endpoint ready. Orderbook integration pending.',
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    );
  }
}
