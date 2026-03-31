import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/auth/me
 *
 * Returns the authenticated user's info.
 * In production: verify Passport JWT from Authorization header.
 * For now: returns a placeholder to prove the auth route works.
 */
export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return NextResponse.json(
      { authenticated: false, error: 'No authorization token provided' },
      { status: 401 }
    );
  }

  const token = authHeader.slice(7);

  // TODO: Verify token with Immutable Passport JWT verification
  // const decoded = await verifyPassportToken(token);
  // For now, accept any non-empty token as valid (dev mode)

  if (!token) {
    return NextResponse.json(
      { authenticated: false, error: 'Invalid token' },
      { status: 401 }
    );
  }

  return NextResponse.json({
    authenticated: true,
    // In production: decoded JWT claims
    user: {
      address: '0x' + token.slice(0, 40).padEnd(40, '0'),
      email: null,
    },
    message: 'Auth route working. Passport JWT verification pending Hub registration.',
  });
}
