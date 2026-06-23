// ── Memory ────────────────────────────────────────────────────────────────────

export type MemoryType = 'decision' | 'preference' | 'context' | 'correction' | 'general' | (string & {});
export type MemorySource = 'conversation' | 'explicit' | 'correction' | 'onboarding' | 'system' | (string & {});

export interface MemoryEntry {
  id?: string;
  type: MemoryType;
  content: string;
  confidence?: number;
  salience?: number;
  created_at?: string;
  similarity?: number;
  metadata?: Record<string, unknown>;
}

export interface RecordMemoryOpts {
  userId: string;
  content: string;
  type?: MemoryType;
  source?: MemorySource;
  confidence?: number;
  salience?: number;
  dedupeThreshold?: number;
  metadata?: Record<string, unknown>;
}

export interface RecordResult {
  id: string | null;
  reinforced: boolean;
}

export interface RetrieveOpts {
  userId: string;
  query: string;
  limit?: number;
  threshold?: number;
}

// ── Embeddings ────────────────────────────────────────────────────────────────

export type EmbedInputType = 'document' | 'query';

export interface EmbeddingProvider {
  enabled(): boolean;
  embedOne(text: string, inputType?: EmbedInputType): Promise<number[] | null>;
  embedBatch(texts: string[], inputType?: EmbedInputType): Promise<number[][] | null>;
}

// ── Storage interfaces (products provide Supabase implementations) ─────────────

export interface MemoryStore {
  record(opts: RecordMemoryOpts, embedding: number[] | null): Promise<RecordResult>;
  retrieve(opts: RetrieveOpts, queryEmbedding: number[] | null): Promise<MemoryEntry[]>;
}

export interface KnowledgeChunk {
  source_type: string;
  source_id: string | null;
  title: string | null;
  content: string;
  similarity: number;
  metadata: Record<string, unknown>;
}

export interface KnowledgeStore {
  retrieve(opts: RetrieveOpts, queryEmbedding: number[] | null): Promise<KnowledgeChunk[]>;
}

// ── Tools ─────────────────────────────────────────────────────────────────────

export interface ToolInputSchema {
  type: 'object';
  properties: Record<string, unknown>;
  required?: string[];
  [key: string]: unknown;
}

export interface ShiftTool {
  name: string;
  description: string;
  input_schema: ToolInputSchema;
  execute(input: Record<string, unknown>, context: ToolContext): Promise<unknown>;
}

export interface ToolContext {
  userId: string;
  metadata?: Record<string, unknown>;
}

// ── Persona ───────────────────────────────────────────────────────────────────

export interface ShiftPersona {
  name: string;
  domain: string;
  systemPrompt: string;
  voice?: string;
  tone?: string;
}

// ── Conversation ──────────────────────────────────────────────────────────────

export interface ConversationTurn {
  role: 'user' | 'assistant';
  content: string;
}

// ── Brain config ──────────────────────────────────────────────────────────────

export interface BrainConfig {
  persona: ShiftPersona;
  /**
   * Explicit model provider. When set, anthropicApiKey and model are ignored.
   * Use AnthropicProvider (default), OpenAICompatProvider, OllamaProvider,
   * RouterProvider, or any custom ModelProvider implementation.
   *
   * The independence path:
   *   provider: new OpenAICompatProvider({ baseURL: 'http://your-gpu/v1', model: 'shift-v1', apiKey: '...' })
   */
  provider?: import('./model.js').ModelProvider;
  /** Convenience: auto-creates AnthropicProvider when provider is not set. */
  anthropicApiKey?: string;
  /** Model override for the auto-created AnthropicProvider. Ignored when provider is set. */
  model?: string;
  maxTokens?: number;
  embedding?: EmbeddingProvider;
  memory?: MemoryStore;
  knowledge?: KnowledgeStore;
  tools?: ShiftTool[];
  learning?: import('./learning.js').LearningStore;
  contextGraph?: import('./graph.js').ContextGraph;
  genome?: import('./genome.js').GenomeStore;
  product?: string; // e.g. 'lendshift', 'realshift'
}

export interface ThinkOpts {
  userId: string;
  message: string;
  history?: ConversationTurn[];
  messageId?: string;
}

export interface ThinkResult {
  text: string;
  toolsInvoked: string[];
  memoryRecorded: boolean;
  preferencesApplied: boolean;
  crossProductEventsConsumed: number;
  /** Number of collective patterns from the Genome injected into this response. */
  collectivePatternsApplied: number;
}
