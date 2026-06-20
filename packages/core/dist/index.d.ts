type MemoryType = 'decision' | 'preference' | 'context' | 'correction' | 'general' | (string & {});
type MemorySource = 'conversation' | 'explicit' | 'correction' | 'onboarding' | 'system' | (string & {});
interface MemoryEntry {
    id?: string;
    type: MemoryType;
    content: string;
    confidence?: number;
    salience?: number;
    created_at?: string;
    similarity?: number;
    metadata?: Record<string, unknown>;
}
interface RecordMemoryOpts {
    userId: string;
    content: string;
    type?: MemoryType;
    source?: MemorySource;
    confidence?: number;
    salience?: number;
    dedupeThreshold?: number;
    metadata?: Record<string, unknown>;
}
interface RecordResult {
    id: string | null;
    reinforced: boolean;
}
interface RetrieveOpts {
    userId: string;
    query: string;
    limit?: number;
    threshold?: number;
}
type EmbedInputType = 'document' | 'query';
interface EmbeddingProvider {
    enabled(): boolean;
    embedOne(text: string, inputType?: EmbedInputType): Promise<number[] | null>;
    embedBatch(texts: string[], inputType?: EmbedInputType): Promise<number[][] | null>;
}
interface MemoryStore {
    record(opts: RecordMemoryOpts, embedding: number[] | null): Promise<RecordResult>;
    retrieve(opts: RetrieveOpts, queryEmbedding: number[] | null): Promise<MemoryEntry[]>;
}
interface KnowledgeChunk {
    source_type: string;
    source_id: string | null;
    title: string | null;
    content: string;
    similarity: number;
    metadata: Record<string, unknown>;
}
interface KnowledgeStore {
    retrieve(opts: RetrieveOpts, queryEmbedding: number[] | null): Promise<KnowledgeChunk[]>;
}
interface ToolInputSchema {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
    [key: string]: unknown;
}
interface ShiftTool {
    name: string;
    description: string;
    input_schema: ToolInputSchema;
    execute(input: Record<string, unknown>, context: ToolContext): Promise<unknown>;
}
interface ToolContext {
    userId: string;
    metadata?: Record<string, unknown>;
}
interface ShiftPersona {
    name: string;
    domain: string;
    systemPrompt: string;
    voice?: string;
    tone?: string;
}
interface ConversationTurn {
    role: 'user' | 'assistant';
    content: string;
}
interface BrainConfig {
    persona: ShiftPersona;
    anthropicApiKey: string;
    model?: string;
    maxTokens?: number;
    embedding?: EmbeddingProvider;
    memory?: MemoryStore;
    knowledge?: KnowledgeStore;
    tools?: ShiftTool[];
}
interface ThinkOpts {
    userId: string;
    message: string;
    history?: ConversationTurn[];
}
interface ThinkResult {
    text: string;
    toolsInvoked: string[];
    memoryRecorded: boolean;
}

declare const EMBED_DIM = 1024;
/**
 * Voyage AI embedding provider (Anthropic's recommended embeddings partner).
 * Degrades gracefully: returns null everywhere when no API key is set,
 * so callers fall back to non-semantic behaviour without throwing.
 */
declare class VoyageEmbeddingProvider implements EmbeddingProvider {
    private readonly apiKey;
    constructor(apiKey: string | undefined);
    enabled(): boolean;
    embedBatch(texts: string[], inputType?: EmbedInputType): Promise<number[][] | null>;
    embedOne(text: string, inputType?: EmbedInputType): Promise<number[] | null>;
    private _voyageBatch;
}

/**
 * recordMemory — embeds content, delegates storage to the provided MemoryStore.
 * Products pass their Supabase-backed store; the core logic is provider-agnostic.
 */
declare function recordMemory(store: MemoryStore, embedding: EmbeddingProvider | undefined, opts: RecordMemoryOpts): Promise<RecordResult>;
/**
 * retrieveRelevantMemories — embeds the query, delegates retrieval to the store.
 * Falls back to recency when embeddings are unavailable (store decides the fallback).
 */
declare function retrieveRelevantMemories(store: MemoryStore, embedding: EmbeddingProvider | undefined, opts: RetrieveOpts): Promise<MemoryEntry[]>;
/**
 * formatMemoriesForPrompt — builds the SHIFT MEMORY system-prompt block.
 * Pure function: no I/O, safe to use in any environment.
 */
declare function formatMemoriesForPrompt(memories: MemoryEntry[], domain?: string): string;

declare class ToolRegistry {
    private readonly _tools;
    register(tool: ShiftTool): this;
    get(name: string): ShiftTool | undefined;
    all(): ShiftTool[];
    /** Returns tool definitions in Anthropic tool-use format. */
    definitions(): Array<{
        name: string;
        description: string;
        input_schema: ToolInputSchema;
    }>;
    execute(name: string, input: Record<string, unknown>, context: ToolContext): Promise<unknown>;
}

/**
 * buildSystemPrompt — combines persona definition with optional memory and
 * knowledge context into a single system prompt string ready for Anthropic.
 */
declare function buildSystemPrompt(persona: ShiftPersona, memoryBlock?: string, knowledgeBlock?: string): string;
/**
 * definePersona — helper to create a typed ShiftPersona. Products call this
 * once at boot to define their domain identity.
 */
declare function definePersona(persona: ShiftPersona): ShiftPersona;

/**
 * ShiftBrain — the universal Shift intelligence orchestrator.
 *
 * Products instantiate one brain at module scope, wiring in their own
 * storage implementations (MemoryStore, KnowledgeStore) and domain tools.
 * The brain handles: memory recall → prompt assembly → tool loop → response.
 *
 * Example (LendShift):
 * ```ts
 * export const brain = new ShiftBrain({
 *   persona: lendShiftPersona,
 *   anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
 *   embedding: new VoyageEmbeddingProvider(process.env.VOYAGE_API_KEY),
 *   memory: new SupabaseMemoryStore(supabase),
 *   tools: [leadScoringTool, calendarTool],
 * });
 * ```
 */
declare class ShiftBrain {
    private readonly client;
    private readonly registry;
    private readonly config;
    constructor(config: BrainConfig);
    /** Main entry point: think through a user message and return a response. */
    think(opts: ThinkOpts): Promise<ThinkResult>;
    /** Explicitly save a memory (e.g. user says "remember that…"). */
    remember(userId: string, content: string, type?: string): Promise<void>;
    /** Retrieve memories relevant to a query. */
    recall(userId: string, query: string): Promise<MemoryEntry[]>;
    /** Stream a response. Returns an async iterable of text deltas. */
    stream(opts: ThinkOpts): AsyncIterable<string>;
    /** Register an additional tool at runtime. */
    addTool(tool: Parameters<ToolRegistry['register']>[0]): void;
}

export { type BrainConfig, type ConversationTurn, EMBED_DIM, type EmbedInputType, type EmbeddingProvider, type KnowledgeChunk, type KnowledgeStore, type MemoryEntry, type MemorySource, type MemoryStore, type MemoryType, type RecordMemoryOpts, type RecordResult, type RetrieveOpts, ShiftBrain, type ShiftPersona, type ShiftTool, type ThinkOpts, type ThinkResult, type ToolContext, type ToolInputSchema, ToolRegistry, VoyageEmbeddingProvider, buildSystemPrompt, definePersona, formatMemoriesForPrompt, recordMemory, retrieveRelevantMemories };
