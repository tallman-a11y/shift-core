type FeedbackSignal = 'accept' | 'edit' | 'reject';
interface FeedbackEntry {
    id?: string;
    userId: string;
    messageId?: string;
    signal: FeedbackSignal;
    originalText: string;
    editedText?: string;
    userMessage?: string;
    domain?: string;
    metadata?: Record<string, unknown>;
    createdAt?: string;
}
interface OutcomeRecord {
    id?: string;
    userId: string;
    predictionType: string;
    predictionId: string;
    predictedValue: unknown;
    actualValue?: unknown;
    resolvedAt?: string;
    domain?: string;
}
interface UserPreferences {
    responseStyle: 'concise' | 'detailed' | 'standard';
    acceptanceRate: number;
    topAcceptedDomains: string[];
    avoidNotes: string[];
    customInstructions: string;
}
interface LearningStore {
    recordFeedback(entry: FeedbackEntry): Promise<string | null>;
    recordOutcome(record: OutcomeRecord): Promise<void>;
    getPreferences(userId: string, domain?: string): Promise<UserPreferences | null>;
}
declare function formatPreferencesForPrompt(prefs: UserPreferences, domain?: string): string;

type FineTuningFormat = 'openai' | 'anthropic' | 'hf';
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
declare function exportForFineTuning(pairs: FineTuningPair[], format: FineTuningFormat, systemPrompt?: string): string;
/**
 * Describes a fine-tuning job submitted to an external API.
 * Store via GenomeStore.recordTrainingJob() to track the journey to independence.
 */
interface TrainingJob {
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
interface ModelVersion {
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

/**
 * A pattern distilled from many users' accepted signals within a domain.
 * Represents what actually works — extracted by Shift itself from its own feedback.
 */
interface CollectivePattern {
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
interface FineTuningPair {
    messages: Array<{
        role: 'user' | 'assistant';
        content: string;
    }>;
    signal: FeedbackSignal;
    /** If signal='edit', the user's corrected version — the ground truth response. */
    editedResponse?: string;
    domain: string;
    product: string;
}
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
interface GenomeStore {
    /**
     * Attach response + query embedding vectors to a recorded feedback signal.
     * Call immediately after LearningStore.recordFeedback() returns a feedbackId.
     */
    recordSignalEmbeddings(feedbackId: string, responseEmbedding: number[], queryEmbedding: number[]): Promise<void>;
    /**
     * Semantic search over distilled collective patterns.
     * Pass queryEmbedding for relevance-ranked results; omit for confidence-ranked.
     */
    getCollectivePatterns(domain: string, queryEmbedding?: number[] | null, limit?: number): Promise<CollectivePattern[]>;
    /**
     * Nightly distillation job.
     * Pulls accepted signals with embeddings → clusters them → extracts patterns
     * via LLM → stores results in shift_collective_patterns.
     * Returns the number of patterns written.
     */
    distill(domain: string, anthropicApiKey: string, embeddingProvider: EmbeddingProvider): Promise<number>;
    /**
     * Export fine-tuning training pairs.
     * Returns (user_message, shift_response) pairs from accepted + edited signals.
     * When enough data accumulates, submit to fine-tuning API to evolve the base model.
     */
    exportFineTuningData(domain: string, since?: Date, limit?: number): Promise<FineTuningPair[]>;
    /**
     * Record that a fine-tuning job was submitted.
     * Returns the stored job ID for future status updates.
     */
    recordTrainingJob(job: TrainingJob): Promise<string | null>;
    /**
     * Update the status or result of a previously submitted training job.
     */
    updateTrainingJob(id: string, updates: Partial<TrainingJob>): Promise<void>;
    /**
     * Get the currently active (production or canary) model version for a domain.
     * Returns null when no fine-tuned model is deployed yet (brain uses base provider).
     */
    getActiveModelVersion(domain: string): Promise<ModelVersion | null>;
    /**
     * Record a new model version. Used when deploying a fine-tuned model.
     */
    recordModelVersion(version: ModelVersion): Promise<string | null>;
}
declare class NoOpGenomeStore implements GenomeStore {
    recordSignalEmbeddings(): Promise<void>;
    getCollectivePatterns(): Promise<CollectivePattern[]>;
    distill(): Promise<number>;
    exportFineTuningData(): Promise<FineTuningPair[]>;
    recordTrainingJob(): Promise<string | null>;
    updateTrainingJob(): Promise<void>;
    getActiveModelVersion(): Promise<ModelVersion | null>;
    recordModelVersion(): Promise<string | null>;
}
declare function formatCollectiveIntelligenceForPrompt(patterns: CollectivePattern[]): string;
/** Cosine similarity between two equal-length vectors. */
declare function cosineSimilarity(a: number[], b: number[]): number;
/**
 * Greedy single-pass clustering by embedding similarity.
 * Returns array of clusters (each cluster = array of indices into `signals`).
 * Threshold 0.82 is tuned for 1024-dim Voyage embeddings.
 */
declare function greedyCluster<T extends {
    embedding?: number[] | null;
}>(signals: T[], threshold?: number): number[][];
/** Compute the centroid of a set of equal-length embedding vectors. */
declare function centroid(embeddings: number[][]): number[];

interface CrossProductEvent {
    id: string;
    sourceProduct: string;
    eventType: string;
    userId: string;
    payload: Record<string, unknown>;
    consumed: boolean;
    createdAt: string;
}
interface CrossProductIdentity {
    globalUserId: string;
    productAccounts: Record<string, string>;
    consentedProducts: string[];
}
interface ContextGraph {
    publish(event: Omit<CrossProductEvent, 'id' | 'createdAt' | 'consumed'>): Promise<string>;
    getPendingEvents(targetProduct: string, userId: string): Promise<CrossProductEvent[]>;
    markConsumed(eventIds: string[]): Promise<void>;
    resolveIdentity(product: string, localUserId: string): Promise<CrossProductIdentity | null>;
    linkIdentity(globalUserId: string, product: string, localUserId: string, consentedProducts: string[]): Promise<void>;
}
declare class NoOpContextGraph implements ContextGraph {
    publish(): Promise<string>;
    getPendingEvents(): Promise<CrossProductEvent[]>;
    markConsumed(): Promise<void>;
    resolveIdentity(): Promise<null>;
    linkIdentity(): Promise<void>;
}
declare function formatCrossProductContextForPrompt(events: CrossProductEvent[]): string;

interface ProviderTool {
    name: string;
    description: string;
    parameters: ToolInputSchema;
}
/**
 * Called by the provider's tool loop with each tool invocation.
 * The brain passes a closure that captures userId and registry.
 */
type ToolExecutor = (name: string, input: Record<string, unknown>) => Promise<unknown>;
interface ProviderMessage {
    role: 'user' | 'assistant';
    content: string;
}
interface ProviderResponse {
    text: string;
    /** Names of every tool called during this completion, in order. */
    toolsInvoked: string[];
}
/**
 * ModelProvider — the inference abstraction that makes Shift Brain
 * independent of any particular AI vendor.
 *
 * Today: AnthropicProvider (default).
 * Tomorrow: OpenAICompatProvider pointed at a fine-tuned Shift model.
 * Eventually: ShiftModelProvider — no external API call, no per-token cost,
 *   weights trained entirely on the Genome's accumulated signal corpus.
 *
 * Swapping providers is a one-line config change in the brain.
 * No other code changes anywhere in any product.
 */
interface ModelProvider {
    /** Human-readable provider name for logging/telemetry. */
    readonly name: string;
    /** The model identifier being used (e.g. 'claude-sonnet-4-6', 'shift-v1'). */
    readonly modelId: string;
    /**
     * Run a full completion including the agentic tool loop.
     * The provider handles its own native tool protocol internally;
     * the brain only needs to supply a toolExecutor callback.
     */
    complete(opts: {
        system: string;
        messages: ProviderMessage[];
        tools?: ProviderTool[];
        toolExecutor?: ToolExecutor;
        maxTokens?: number;
    }): Promise<ProviderResponse>;
    /**
     * Stream text deltas. Tools are not supported in stream mode — use complete()
     * for agentic loops. Stream is for conversational responses where latency matters.
     */
    stream(opts: {
        system: string;
        messages: ProviderMessage[];
        maxTokens?: number;
    }): AsyncIterable<string>;
}

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
    /**
     * Explicit model provider. When set, anthropicApiKey and model are ignored.
     * Use AnthropicProvider (default), OpenAICompatProvider, OllamaProvider,
     * RouterProvider, or any custom ModelProvider implementation.
     *
     * The independence path:
     *   provider: new OpenAICompatProvider({ baseURL: 'http://your-gpu/v1', model: 'shift-v1', apiKey: '...' })
     */
    provider?: ModelProvider;
    /** Convenience: auto-creates AnthropicProvider when provider is not set. */
    anthropicApiKey?: string;
    /** Model override for the auto-created AnthropicProvider. Ignored when provider is set. */
    model?: string;
    maxTokens?: number;
    embedding?: EmbeddingProvider;
    memory?: MemoryStore;
    knowledge?: KnowledgeStore;
    tools?: ShiftTool[];
    learning?: LearningStore;
    contextGraph?: ContextGraph;
    genome?: GenomeStore;
    product?: string;
}
interface ThinkOpts {
    userId: string;
    message: string;
    history?: ConversationTurn[];
    messageId?: string;
}
interface ThinkResult {
    text: string;
    toolsInvoked: string[];
    memoryRecorded: boolean;
    preferencesApplied: boolean;
    crossProductEventsConsumed: number;
    /** Number of collective patterns from the Genome injected into this response. */
    collectivePatternsApplied: number;
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
    /** Returns tool definitions in the provider-agnostic ProviderTool format. */
    providerDefinitions(): ProviderTool[];
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
 * The brain handles: memory recall → preferences → cross-product context →
 * prompt assembly → tool loop → response.
 *
 * Example (LendShift):
 * ```ts
 * export const brain = new ShiftBrain({
 *   persona: lendShiftPersona,
 *   anthropicApiKey: process.env.ANTHROPIC_API_KEY!,
 *   embedding: new VoyageEmbeddingProvider(process.env.VOYAGE_API_KEY),
 *   memory: new SupabaseMemoryStore(supabase),
 *   tools: [leadScoringTool, calendarTool],
 *   learning: new SupabaseLearningStore(supabase),
 *   contextGraph: new SupabaseContextGraph(supabase),
 *   product: 'lendshift',
 * });
 * ```
 */
declare class ShiftBrain {
    private readonly provider;
    private readonly registry;
    private readonly config;
    constructor(config: BrainConfig);
    /** Main entry point: think through a user message and return a response. */
    think(opts: ThinkOpts): Promise<ThinkResult>;
    /** Explicitly save a memory (e.g. user says "remember that…"). */
    remember(userId: string, content: string, type?: string): Promise<void>;
    /** Retrieve memories relevant to a query. */
    recall(userId: string, query: string): Promise<MemoryEntry[]>;
    /**
     * Record user feedback on a Shift response.
     * Writes the signal to LearningStore and — if an embedding provider + GenomeStore
     * are wired in — also attaches semantic vectors to the record so it can be
     * clustered by the nightly distillation job.
     *
     * Every embedded signal is raw material for the Genome: the corpus that makes
     * Shift smarter for every user across every product over time.
     */
    feedback(userId: string, signal: FeedbackSignal, originalText: string, editedText?: string, userMessage?: string, messageId?: string): Promise<void>;
    /**
     * Track the outcome of a prediction.
     * Call with actualValue once the outcome is known; omit it when creating
     * the initial prediction record.
     */
    trackOutcome(userId: string, predictionType: string, predictionId: string, predictedValue: unknown, actualValue?: unknown): Promise<void>;
    /** Stream a response. Returns an async iterable of text deltas. */
    stream(opts: ThinkOpts): AsyncIterable<string>;
    /** Register an additional tool at runtime. */
    addTool(tool: Parameters<ToolRegistry['register']>[0]): void;
}

/**
 * AnthropicProvider — wraps the Anthropic Messages API.
 *
 * This is the default provider while Shift Brain runs on Claude.
 * When the fine-tuned Shift model is ready, swap in OpenAICompatProvider
 * (or ShiftModelProvider) without touching any other code.
 *
 * Handles the full agentic tool loop internally in Anthropic's native format.
 */
declare class AnthropicProvider implements ModelProvider {
    readonly name = "anthropic";
    readonly modelId: string;
    private readonly client;
    constructor(apiKey: string, model?: string);
    complete(opts: {
        system: string;
        messages: ProviderMessage[];
        tools?: ProviderTool[];
        toolExecutor?: ToolExecutor;
        maxTokens?: number;
    }): Promise<ProviderResponse>;
    stream(opts: {
        system: string;
        messages: ProviderMessage[];
        maxTokens?: number;
    }): AsyncIterable<string>;
}

interface OpenAICompatConfig {
    /** API base URL. OpenAI: 'https://api.openai.com/v1'. Ollama: 'http://localhost:11434/v1'. */
    baseURL: string;
    model: string;
    /** API key. Use 'ollama' for local Ollama (no real key needed). */
    apiKey: string;
    /** Override the provider name shown in logs. Default: derived from baseURL. */
    providerName?: string;
}
/**
 * OpenAICompatProvider — works with any OpenAI-compatible inference server.
 *
 * This is the path to Shift's independence from external AI vendors:
 *
 *   // Today — OpenAI fine-tuned model
 *   new OpenAICompatProvider({
 *     baseURL: 'https://api.openai.com/v1',
 *     model: 'ft:gpt-4o-mini:allshift:lendshift-v1:xxxxx',
 *     apiKey: process.env.OPENAI_API_KEY,
 *   });
 *
 *   // Tomorrow — self-hosted Shift model on a $50/mo GPU VM
 *   new OpenAICompatProvider({
 *     baseURL: 'http://your-server:11434/v1',
 *     model: 'shift-v1',
 *     apiKey: 'ollama',
 *   });
 *
 *   // Eventually — no external call, no per-token cost, 100% owned
 *   new OpenAICompatProvider({
 *     baseURL: 'http://internal-shift-inference/v1',
 *     model: 'shift-brain-1.0',
 *     apiKey: process.env.SHIFT_INTERNAL_KEY,
 *   });
 *
 * Uses native fetch — no SDK dependency. Runs in any environment.
 */
declare class OpenAICompatProvider implements ModelProvider {
    readonly name: string;
    readonly modelId: string;
    private readonly baseURL;
    private readonly apiKey;
    constructor(config: OpenAICompatConfig);
    complete(opts: {
        system: string;
        messages: ProviderMessage[];
        tools?: ProviderTool[];
        toolExecutor?: ToolExecutor;
        maxTokens?: number;
    }): Promise<ProviderResponse>;
    stream(opts: {
        system: string;
        messages: ProviderMessage[];
        maxTokens?: number;
    }): AsyncIterable<string>;
}
/**
 * Convenience factory for local Ollama inference.
 * Runs any Ollama model (including fine-tuned Shift models) with zero external calls.
 *
 * Usage:
 *   const provider = OllamaProvider('shift-lendshift-v1');
 *   const brain = new ShiftBrain({ provider, ... });
 */
declare function OllamaProvider(model: string, baseURL?: string): OpenAICompatProvider;

interface RouterConfig {
    /** Primary provider — serves all traffic unless overridden. */
    primary: ModelProvider;
    /**
     * Fallback provider — used when primary throws.
     * Lets you point primary at the Shift model and fallback at Anthropic.
     * Traffic silently falls back; no error reaches the user.
     */
    fallback?: ModelProvider;
    /**
     * Shadow provider — runs on every request alongside primary but its
     * response is discarded. Used to evaluate a new model before routing
     * real traffic to it. Failures are silently swallowed.
     */
    shadow?: ModelProvider;
    /**
     * Canary traffic split (0–100).
     * When set, this % of requests are routed to `canary` instead of `primary`.
     * Use this to ramp a fine-tuned Shift model from 5% → 25% → 100%.
     */
    canaryPercent?: number;
    canary?: ModelProvider;
    /** Called with routing decisions for observability. */
    onRoute?: (decision: RouteDecision) => void;
}
interface RouteDecision {
    provider: string;
    reason: 'primary' | 'fallback' | 'canary' | 'shadow';
    shadowProvider?: string;
}
/**
 * RouterProvider — safely migrates Shift Brain from one model to another.
 *
 * Migration path to independence:
 *
 *   Phase 1 — Shadow: run Shift model silently alongside Anthropic.
 *     Collect output for eval without exposing users to it.
 *     new RouterProvider({ primary: anthropic, shadow: shiftModel })
 *
 *   Phase 2 — Canary: route 10% of real traffic to Shift model.
 *     Compare quality metrics. Increase as confidence grows.
 *     new RouterProvider({ primary: anthropic, canary: shiftModel, canaryPercent: 10 })
 *
 *   Phase 3 — Flip: Shift model is primary, Anthropic is fallback.
 *     Zero downtime, instant rollback if needed.
 *     new RouterProvider({ primary: shiftModel, fallback: anthropic })
 *
 *   Phase 4 — Independence: remove fallback. No external API. No per-token cost.
 *     new ShiftBrain({ provider: shiftModel })
 */
declare class RouterProvider implements ModelProvider {
    private readonly config;
    readonly name: string;
    readonly modelId: string;
    constructor(config: RouterConfig);
    complete(opts: {
        system: string;
        messages: ProviderMessage[];
        tools?: ProviderTool[];
        toolExecutor?: ToolExecutor;
        maxTokens?: number;
    }): Promise<ProviderResponse>;
    stream(opts: {
        system: string;
        messages: ProviderMessage[];
        maxTokens?: number;
    }): AsyncIterable<string>;
}

export { AnthropicProvider, type BrainConfig, type CollectivePattern, type ContextGraph, type ConversationTurn, type CrossProductEvent, type CrossProductIdentity, EMBED_DIM, type EmbedInputType, type EmbeddingProvider, type FeedbackEntry, type FeedbackSignal, type FineTuningFormat, type FineTuningPair, type GenomeStore, type KnowledgeChunk, type KnowledgeStore, type LearningStore, type MemoryEntry, type MemorySource, type MemoryStore, type MemoryType, type ModelProvider, type ModelVersion, NoOpContextGraph, NoOpGenomeStore, OllamaProvider, type OpenAICompatConfig, OpenAICompatProvider, type OutcomeRecord, type ProviderMessage, type ProviderResponse, type ProviderTool, type RecordMemoryOpts, type RecordResult, type RetrieveOpts, type RouteDecision, type RouterConfig, RouterProvider, ShiftBrain, type ShiftPersona, type ShiftTool, type ThinkOpts, type ThinkResult, type ToolContext, type ToolExecutor, type ToolInputSchema, ToolRegistry, type TrainingJob, type UserPreferences, VoyageEmbeddingProvider, buildSystemPrompt, centroid, cosineSimilarity, definePersona, exportForFineTuning, formatCollectiveIntelligenceForPrompt, formatCrossProductContextForPrompt, formatMemoriesForPrompt, formatPreferencesForPrompt, greedyCluster, recordMemory, retrieveRelevantMemories };
