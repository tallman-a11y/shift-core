import type { EmbeddingProvider, EmbedInputType } from './types.js';

const VOYAGE_URL = 'https://api.voyageai.com/v1/embeddings';
const VOYAGE_MODEL = 'voyage-3-large';
export const EMBED_DIM = 1024;
const MAX_BATCH = 128;

/**
 * Voyage AI embedding provider (Anthropic's recommended embeddings partner).
 * Degrades gracefully: returns null everywhere when no API key is set,
 * so callers fall back to non-semantic behaviour without throwing.
 */
export class VoyageEmbeddingProvider implements EmbeddingProvider {
  constructor(private readonly apiKey: string | undefined) {}

  enabled(): boolean {
    return !!this.apiKey;
  }

  async embedBatch(texts: string[], inputType: EmbedInputType = 'document'): Promise<number[][] | null> {
    if (!this.enabled() || texts.length === 0) return null;
    const clean = texts.map((t) => (t ?? '').slice(0, 32000));
    const out: number[][] = [];
    for (let i = 0; i < clean.length; i += MAX_BATCH) {
      const batch = await this._voyageBatch(clean.slice(i, i + MAX_BATCH), inputType);
      if (!batch) return null;
      out.push(...batch);
    }
    return out;
  }

  async embedOne(text: string, inputType: EmbedInputType = 'document'): Promise<number[] | null> {
    const r = await this.embedBatch([text], inputType);
    return r ? r[0] : null;
  }

  private async _voyageBatch(texts: string[], inputType: EmbedInputType): Promise<number[][] | null> {
    try {
      const res = await fetch(VOYAGE_URL, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: texts,
          model: VOYAGE_MODEL,
          input_type: inputType,
          output_dimension: EMBED_DIM,
          truncation: true,
        }),
      });
      if (!res.ok) {
        console.error('[shift/core embeddings] voyage error', res.status, await res.text().catch(() => ''));
        return null;
      }
      const json = (await res.json()) as { data?: Array<{ embedding: number[]; index: number }> };
      if (!json.data) return null;
      return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
    } catch (err) {
      console.error('[shift/core embeddings] fetch failed', err);
      return null;
    }
  }
}
