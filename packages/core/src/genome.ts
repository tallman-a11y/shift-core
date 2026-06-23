import type { EmbeddingProvider } from './types.js';
import type { FeedbackSignal } from './learning.js';

// ── Collective Intelligence ───────────────────────────────────────────────────

/**
 * A pattern distilled from many users' accepted signals within a domain.
 * Represents what actually works — extracted by Shift itself from its own feedback.
 */
export interface CollectivePattern {
  id?: string;
  domain: string;
  /** Natural language description of the pattern, extracted by LLM from signal clusters. */
  pattern: string;
  /** 0–1. Grows with signal volume. */
  confidence: number;
  signalCount: number;
  /** Sample accepted response snippets from the cluster. */
  examples?: string[];
  embedding?: number[];
  updatedAt?: string;
}

/**
 * A training pair ready for fine-tuning.
 * Accepted and edited signals become (user_message → shift_response) examples.
 */
export interface FineTuningPair {
  messages: Array<{ role: 'user' | 'assistant'; content: string }>;
  signal: FeedbackSignal;
  /** If signal='edit', the user's corrected version — the ground truth response. */
  editedResponse?: string;
  domain: string;
  product: string;
}

// ── Genome Store Interface ────────────────────────────────────────────────────

/**
 * GenomeStore — the collective intelligence layer of Shift Brain.
 *
 * Operates above the per-user LearningStore. Where LearningStore personalizes
 * for one user, GenomeStore mines patterns across ALL users in a domain, then
 * feeds those patterns back into every conversation as "what works here."
 *
 * Over time, as signals accumulate across products (LendShift, RealShift, GSO…),
 * the Genome becomes a distilled corpus of human decision-making patterns that
 * makes Shift smarter for every new user before they've typed a single message.
 *
 * The ultimate form: a fine-tunable model trained on these patterns, making
 * Shift Brain progressively less dependent on the base LLM for domain knowledge.
 *
 * Products provide a Supabase implementation. NoOpGenomeStore is the default.
 */
export interface GenomeStore {
  /**
   * Attach response + query embedding vectors to a recorded feedback signal.
   * Call immediately after LearningStore.recordFeedback() returns a feedbackId.
   */
  recordSignalEmbeddings(
    feedbackId: string,
    responseEmbedding: number[],
    queryEmbedding: number[],
  ): Promise<void>;

  /**
   * Semantic search over distilled collective patterns.
   * Pass queryEmbedding for relevance-ranked results; omit for confidence-ranked.
   */
  getCollectivePatterns(
    domain: string,
    queryEmbedding?: number[] | null,
    limit?: number,
  ): Promise<CollectivePattern[]>;

  /**
   * Nightly distillation job.
   * Pulls accepted signals with embeddings → clusters them → extracts patterns
   * via LLM → stores results in shift_collective_patterns.
   * Returns the number of patterns written.
   */
  distill(
    domain: string,
    anthropicApiKey: string,
    embeddingProvider: EmbeddingProvider,
  ): Promise<number>;

  /**
   * Export fine-tuning training pairs.
   * Returns (user_message, shift_response) pairs from accepted + edited signals.
   * When enough data accumulates, submit to fine-tuning API to evolve the base model.
   */
  exportFineTuningData(
    domain: string,
    since?: Date,
    limit?: number,
  ): Promise<FineTuningPair[]>;
}

// ── No-op default ─────────────────────────────────────────────────────────────

export class NoOpGenomeStore implements GenomeStore {
  async recordSignalEmbeddings(): Promise<void> {}
  async getCollectivePatterns(): Promise<CollectivePattern[]> { return []; }
  async distill(): Promise<number> { return 0; }
  async exportFineTuningData(): Promise<FineTuningPair[]> { return []; }
}

// ── Prompt formatting ─────────────────────────────────────────────────────────

export function formatCollectiveIntelligenceForPrompt(patterns: CollectivePattern[]): string {
  if (patterns.length === 0) return '';
  const lines = patterns.map(
    p => `- ${p.pattern} (confidence: ${Math.round(p.confidence * 100)}%, n=${p.signalCount})`,
  );
  return (
    `\n\n---\n## COLLECTIVE INTELLIGENCE\n` +
    `Patterns learned from users across this domain:\n` +
    lines.join('\n') +
    `\n\nLet these patterns inform your response style — they reflect what resonates with this user base.`
  );
}

// ── Clustering utilities (used by Supabase implementations) ──────────────────

/** Cosine similarity between two equal-length vectors. */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}

/**
 * Greedy single-pass clustering by embedding similarity.
 * Returns array of clusters (each cluster = array of indices into `signals`).
 * Threshold 0.82 is tuned for 1024-dim Voyage embeddings.
 */
export function greedyCluster<T extends { embedding?: number[] | null }>(
  signals: T[],
  threshold = 0.82,
): number[][] {
  const clusters: number[][] = [];
  const assigned = new Set<number>();

  for (let i = 0; i < signals.length; i++) {
    if (assigned.has(i)) continue;
    const embA = signals[i].embedding;
    if (!embA) { assigned.add(i); continue; }

    const cluster = [i];
    assigned.add(i);

    for (let j = i + 1; j < signals.length; j++) {
      if (assigned.has(j)) continue;
      const embB = signals[j].embedding;
      if (!embB) continue;
      if (cosineSimilarity(embA, embB) >= threshold) {
        cluster.push(j);
        assigned.add(j);
      }
    }
    if (cluster.length >= 2) clusters.push(cluster);
  }
  return clusters;
}

/** Compute the centroid of a set of equal-length embedding vectors. */
export function centroid(embeddings: number[][]): number[] {
  const valid = embeddings.filter(e => e && e.length > 0);
  if (valid.length === 0) return [];
  const dims = valid[0].length;
  const sum = new Array<number>(dims).fill(0);
  for (const emb of valid) {
    for (let i = 0; i < dims; i++) sum[i] += emb[i];
  }
  return sum.map(v => v / valid.length);
}
