/**
 * Client-side API service for communicating with the Next.js backend.
 *
 * In development: Vite client on :5174, Next.js API on :3002
 * In production: same origin (Next.js serves both)
 */

const API_BASE = import.meta.env.VITE_API_URL ?? 'http://localhost:3002';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

async function apiFetch<T>(path: string, options?: RequestInit): Promise<ApiResponse<T>> {
  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        // In future: add Passport JWT token here
        // 'Authorization': `Bearer ${getToken()}`,
      },
      ...options,
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({ error: 'Unknown error' }));
      return { success: false, error: errorBody.error ?? `HTTP ${response.status}` };
    }

    const data = await response.json();
    return { success: true, data };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Network error' };
  }
}

// ─── API Methods ──────────────────────────────────────────────────────────────

export interface PackOpenResponse {
  success: boolean;
  packSize: number;
  cards: Array<{
    dna: string;
    name: string;
    species: string;
    rarity: string;
    metadata: Record<string, unknown>;
    tokenId: string | null;
  }>;
  referenceId: string;
}

export interface CardLookupResponse {
  dna: string;
  card: {
    name: string;
    species: string;
    rarity: string;
    baseStats: Record<string, number>;
    growthRates: Record<string, string>;
    equipment: { weapon: string | null; armor: string | null; accessory: string | null };
  };
  metadata: Record<string, unknown>;
  artPrompt: string;
}

export const api = {
  /** Check if the API server is available */
  async health(): Promise<boolean> {
    const result = await apiFetch('/api/health');
    return result.success;
  },

  /** Open a card pack via the server (server-side DNA generation) */
  async openPack(packSize: number = 5): Promise<ApiResponse<PackOpenResponse>> {
    return apiFetch('/api/packs/open', {
      method: 'POST',
      body: JSON.stringify({ packSize }),
    });
  },

  /** Look up a card by its DNA string */
  async lookupCard(dna: string): Promise<ApiResponse<CardLookupResponse>> {
    return apiFetch(`/api/cards/${dna}`);
  },
};
