import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    status: 'ok',
    game: 'Summoner\'s Grid',
    version: '0.3.0-alpha',
    timestamp: new Date().toISOString(),
  });
}
