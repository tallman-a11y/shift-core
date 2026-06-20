import type {
  EmbeddingProvider,
  MemoryEntry,
  MemoryStore,
  RecordMemoryOpts,
  RecordResult,
  RetrieveOpts,
} from './types.js';

/**
 * recordMemory — embeds content, delegates storage to the provided MemoryStore.
 * Products pass their Supabase-backed store; the core logic is provider-agnostic.
 */
export async function recordMemory(
  store: MemoryStore,
  embedding: EmbeddingProvider | undefined,
  opts: RecordMemoryOpts,
): Promise<RecordResult> {
  const content = opts.content?.trim();
  if (!content) return { id: null, reinforced: false };

  const vec = embedding?.enabled()
    ? await embedding.embedOne(content, 'document')
    : null;

  return store.record({ ...opts, content }, vec);
}

/**
 * retrieveRelevantMemories — embeds the query, delegates retrieval to the store.
 * Falls back to recency when embeddings are unavailable (store decides the fallback).
 */
export async function retrieveRelevantMemories(
  store: MemoryStore,
  embedding: EmbeddingProvider | undefined,
  opts: RetrieveOpts,
): Promise<MemoryEntry[]> {
  const qEmb =
    embedding?.enabled() && opts.query?.trim()
      ? await embedding.embedOne(opts.query, 'query')
      : null;

  return store.retrieve(opts, qEmb);
}

/**
 * formatMemoriesForPrompt — builds the SHIFT MEMORY system-prompt block.
 * Pure function: no I/O, safe to use in any environment.
 */
export function formatMemoriesForPrompt(memories: MemoryEntry[], domain?: string): string {
  if (!memories.length) return '';

  const domainPrefs = memories.filter((m) => m.type.includes('preference') || m.type.includes('deal'));
  const other = memories.filter((m) => !domainPrefs.includes(m));

  return (
    `\n\n---\n## SHIFT MEMORY\n` +
    `You have persistent, semantically-retrieved memory of this user — ` +
    `real decisions, preferences, and context they've revealed or saved. ` +
    `Treat them as ground truth${domain ? ` within ${domain}` : ''}.\n\n` +
    [...other, ...domainPrefs].map((m) => `- [${m.type}] ${m.content}`).join('\n') +
    `\n\nPROACTIVE MEMORY RULE: If any memory is directly relevant to the user's ` +
    `current question, surface it naturally at the start of your response. ` +
    `Never recite all memories — only what's genuinely relevant. ` +
    `If the user shares a new decision or preference worth keeping, offer to save it.`
  );
}
