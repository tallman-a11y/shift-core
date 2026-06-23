import type { FineTuningPair } from './genome.js';

export type FineTuningFormat = 'openai' | 'anthropic' | 'hf';

/**
 * Export fine-tuning pairs as JSONL in the target format.
 *
 * The Genome accumulates (user_message, accepted_shift_response) pairs.
 * When enough data exists, submit this output to a fine-tuning API to
 * evolve a base model into a domain-specialized Shift model.
 *
 * Volume thresholds (rough guidelines):
 *   - 1,000 pairs → measurable domain adaptation, better tone/terminology
 *   - 5,000 pairs → strong domain specialization, reliable style transfer
 *   - 20,000 pairs → model begins capturing business logic + user patterns
 *   - 100,000+ pairs → proprietary model with real competitive differentiation
 *
 * Format notes:
 *   'openai'    → compatible with OpenAI fine-tuning API (gpt-4o-mini, gpt-3.5)
 *   'anthropic' → compatible with Anthropic fine-tuning API (when available)
 *   'hf'        → HuggingFace SFTTrainer format (Llama, Mistral, Qwen, Phi, etc.)
 *                 Use this to train a self-hosted model that runs on your own GPU
 *                 with zero per-token cost and complete data ownership.
 */
export function exportForFineTuning(
  pairs: FineTuningPair[],
  format: FineTuningFormat,
  systemPrompt?: string,
): string {
  switch (format) {
    case 'openai':
      return exportOpenAI(pairs, systemPrompt);
    case 'anthropic':
      return exportAnthropic(pairs, systemPrompt);
    case 'hf':
      return exportHuggingFace(pairs, systemPrompt);
  }
}

/** One JSONL line per pair. */
function toJSONL(records: unknown[]): string {
  return records.map((r) => JSON.stringify(r)).join('\n');
}

function exportOpenAI(pairs: FineTuningPair[], system?: string): string {
  return toJSONL(
    pairs.map((p) => ({
      messages: [
        ...(system ? [{ role: 'system', content: system }] : []),
        ...p.messages,
        // If the user edited the response, the edited version is the ground truth
        ...(p.editedResponse
          ? [{ role: 'assistant', content: p.editedResponse }]
          : []),
      ].filter((_, i, arr) => {
        // Dedupe: if editedResponse present, drop the original assistant turn
        if (p.editedResponse && arr[i].role === 'assistant' && i < arr.length - 1) return false;
        return true;
      }),
    })),
  );
}

function exportAnthropic(pairs: FineTuningPair[], system?: string): string {
  return toJSONL(
    pairs.map((p) => ({
      system: system ?? '',
      messages: p.messages.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    })),
  );
}

function exportHuggingFace(pairs: FineTuningPair[], system?: string): string {
  return toJSONL(
    pairs.map((p) => {
      const systemPart = system ? `<|system|>\n${system}\n` : '';
      const userPart = `<|user|>\n${p.messages.find((m) => m.role === 'user')?.content ?? ''}\n`;
      const assistantContent =
        p.editedResponse ??
        p.messages.find((m) => m.role === 'assistant')?.content ??
        '';
      const assistantPart = `<|assistant|>\n${assistantContent}`;
      return { text: systemPart + userPart + assistantPart };
    }),
  );
}

// ── Training job tracking ─────────────────────────────────────────────────────

/**
 * Describes a fine-tuning job submitted to an external API.
 * Store via GenomeStore.recordTrainingJob() to track the journey to independence.
 */
export interface TrainingJob {
  id?: string;
  domain: string;
  product: string;
  format: FineTuningFormat;
  pairCount: number;
  submittedAt: string;
  status: 'pending' | 'training' | 'complete' | 'failed';
  /** The job ID returned by OpenAI/Anthropic fine-tuning API. */
  externalJobId?: string;
  /** The resulting model ID once training is complete (e.g. 'ft:gpt-4o-mini:allshift:...'). */
  fineTunedModelId?: string;
  notes?: string;
}

/**
 * Describes a deployed model version.
 * Track traffic allocation during gradual rollout via RouterProvider.
 */
export interface ModelVersion {
  id?: string;
  domain: string;
  product: string;
  /** Human-readable version tag: 'shift-lendshift-v1', 'shift-realshift-v2', etc. */
  version: string;
  /** The model ID passed to the provider: 'ft:gpt-4o-mini:...', 'shift-v1', etc. */
  modelId: string;
  /** Provider type: 'openai-compat' | 'ollama' | 'anthropic' | 'shift'. */
  providerType: string;
  /** Inference endpoint URL (for openai-compat/ollama providers). */
  baseURL?: string;
  /** Current traffic allocation (0–100). Increase during canary rollout. */
  trafficPercent: number;
  /** Deployment phase. */
  status: 'shadow' | 'canary' | 'production' | 'retired';
  createdAt?: string;
}
