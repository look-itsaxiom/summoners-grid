import { NextRequest, NextResponse } from 'next/server';
import { checkGenerationStatus } from '../../../../../src/services/comfyui';

/**
 * GET /api/art/status/[promptId]
 *
 * Check the status of an art generation job.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ promptId: string }> }
) {
  const { promptId } = await params;

  if (!promptId) {
    return NextResponse.json({ error: 'promptId required' }, { status: 400 });
  }

  const status = await checkGenerationStatus(promptId);

  return NextResponse.json({
    promptId,
    ...status,
  });
}
