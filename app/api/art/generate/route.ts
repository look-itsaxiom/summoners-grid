import { NextRequest, NextResponse } from 'next/server';
import { validateDNA } from '../../../../src/engine/dna';
import { dnaToArtPrompt } from '../../../../src/engine/dna/promptBuilder';
import { generateCardArt } from '../../../../src/services/comfyui';

/**
 * POST /api/art/generate
 *
 * Trigger AI art generation for a card via ComfyUI.
 * Body: { dna: string, seed?: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dna, seed } = body;

    if (!dna || !validateDNA(dna)) {
      return NextResponse.json(
        { error: 'Invalid DNA string' },
        { status: 400 }
      );
    }

    const prompt = dnaToArtPrompt(dna);
    const result = await generateCardArt(prompt, seed);

    if (result.success) {
      return NextResponse.json({
        success: true,
        dna,
        promptId: result.promptId,
        artPrompt: prompt,
        message: 'Art generation queued on ComfyUI',
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 502 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: 'Failed to trigger art generation' },
      { status: 500 }
    );
  }
}
