/**
 * ComfyUI Art Generation Service.
 *
 * Connects to ComfyUI on home.skib (axiom@home.skib:8188) to generate
 * AI card art from DNA-derived prompts.
 *
 * This service is used by the server-side art pipeline (API routes).
 * It communicates with ComfyUI's REST API via SSH tunnel or direct connection.
 */

const COMFYUI_HOST = process.env.COMFYUI_HOST ?? 'home.skib';
const COMFYUI_PORT = process.env.COMFYUI_PORT ?? '8188';
const COMFYUI_URL = `http://${COMFYUI_HOST}:${COMFYUI_PORT}`;

/**
 * Flux Schnell text-to-image workflow for ComfyUI.
 * Uses flux1-schnell-fp8 checkpoint — fast, handles natural language prompts well.
 * No negative prompt needed for Flux.
 */
function buildFluxWorkflow(prompt: string, seed?: number): Record<string, unknown> {
  const actualSeed = seed ?? Math.floor(Math.random() * 2147483647);

  return {
    '1': {
      class_type: 'CheckpointLoaderSimple',
      inputs: {
        ckpt_name: 'flux1-schnell-fp8.safetensors',
      },
    },
    '2': {
      class_type: 'CLIPTextEncode',
      inputs: {
        text: prompt,
        clip: ['1', 1],
      },
    },
    '3': {
      class_type: 'EmptyLatentImage',
      inputs: {
        width: 512,
        height: 512,
        batch_size: 1,
      },
    },
    '4': {
      class_type: 'KSampler',
      inputs: {
        model: ['1', 0],
        positive: ['2', 0],
        negative: ['2', 0], // Flux doesn't use negative prompts effectively
        latent_image: ['3', 0],
        seed: actualSeed,
        steps: 4,             // Flux Schnell is fast — 4 steps is enough
        cfg: 1.0,             // Flux uses low CFG
        sampler_name: 'euler',
        scheduler: 'simple',
        denoise: 1.0,
      },
    },
    '5': {
      class_type: 'VAEDecode',
      inputs: {
        samples: ['4', 0],
        vae: ['1', 2],
      },
    },
    '6': {
      class_type: 'SaveImage',
      inputs: {
        images: ['5', 0],
        filename_prefix: 'summoners_grid',
      },
    },
  };
}

export interface GenerationResult {
  success: boolean;
  promptId?: string;
  images?: string[];
  error?: string;
}

/**
 * Queue a card art generation job on ComfyUI.
 */
export async function generateCardArt(
  prompt: string,
  seed?: number
): Promise<GenerationResult> {
  try {
    const workflow = buildFluxWorkflow(prompt, seed);

    const response = await fetch(`${COMFYUI_URL}/prompt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: workflow }),
    });

    if (!response.ok) {
      return { success: false, error: `ComfyUI returned ${response.status}` };
    }

    const data = await response.json() as { prompt_id: string };
    return { success: true, promptId: data.prompt_id };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to ComfyUI',
    };
  }
}

/**
 * Check the status of a generation job.
 */
export async function checkGenerationStatus(promptId: string): Promise<{
  status: 'pending' | 'running' | 'completed' | 'error';
  images?: string[];
}> {
  try {
    const response = await fetch(`${COMFYUI_URL}/history/${promptId}`);
    if (!response.ok) return { status: 'pending' };

    const data = await response.json() as Record<string, { outputs: Record<string, { images: Array<{ filename: string }> }> }>;
    const entry = data[promptId];

    if (!entry) return { status: 'pending' };

    // Find output images
    const images: string[] = [];
    for (const nodeOutput of Object.values(entry.outputs)) {
      if (nodeOutput.images) {
        for (const img of nodeOutput.images) {
          images.push(`${COMFYUI_URL}/view?filename=${img.filename}`);
        }
      }
    }

    if (images.length > 0) {
      return { status: 'completed', images };
    }

    return { status: 'running' };
  } catch {
    return { status: 'error' };
  }
}

/**
 * Check if ComfyUI is reachable.
 */
export async function checkComfyUIHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${COMFYUI_URL}/system_stats`, {
      signal: AbortSignal.timeout(5000),
    });
    return response.ok;
  } catch {
    return false;
  }
}
