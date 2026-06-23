import { buildSystemPrompt } from './persona.js';
import { recordMemory, retrieveRelevantMemories, formatMemoriesForPrompt } from './memory.js';
import { ToolRegistry } from './tools.js';
import { formatPreferencesForPrompt } from './learning.js';
import type { FeedbackSignal, FeedbackEntry, OutcomeRecord } from './learning.js';
import { formatCrossProductContextForPrompt } from './graph.js';
import { formatCollectiveIntelligenceForPrompt } from './genome.js';
import type { CollectivePattern } from './genome.js';
import { AnthropicProvider } from './providers/anthropic.js';
import type { ModelProvider } from './model.js';
import type {
  BrainConfig,
  ThinkOpts,
  ThinkResult,
  ConversationTurn,
  MemoryEntry,
} from './types.js';

const DEFAULT_MAX_TOKENS = 1024;

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
export class ShiftBrain {
  private readonly provider: ModelProvider;
  private readonly registry: ToolRegistry;
  private readonly config: BrainConfig;

  constructor(config: BrainConfig) {
    this.config = config;
    // Use explicitly provided provider, or auto-create AnthropicProvider for
    // backward compatibility when only anthropicApiKey is set.
    this.provider =
      config.provider ??
      new AnthropicProvider(config.anthropicApiKey!, config.model);
    this.registry = new ToolRegistry();
    for (const tool of config.tools ?? []) {
      this.registry.register(tool);
    }
  }

  /** Main entry point: think through a user message and return a response. */
  async think(opts: ThinkOpts): Promise<ThinkResult> {
    const { userId, message, history = [], messageId } = opts;
    const { persona, embedding, memory, maxTokens, learning, contextGraph, genome, product } = this.config;

    // 1. Recall relevant memories.
    let memories: MemoryEntry[] = [];
    if (memory) {
      memories = await retrieveRelevantMemories(memory, embedding, {
        userId,
        query: message,
        limit: 14,
        threshold: 0.25,
      });
    }

    // 2. Fetch cross-product events.
    let pendingEvents: import('./graph.js').CrossProductEvent[] = [];
    if (contextGraph) {
      pendingEvents = await contextGraph.getPendingEvents(product ?? 'unknown', userId);
    }

    // 3. Fetch learned preferences (individual).
    let prefs: import('./learning.js').UserPreferences | null = null;
    if (learning) {
      prefs = await learning.getPreferences(userId, product);
    }

    // 3b. Fetch collective patterns from the Genome (cross-user intelligence).
    let collectivePatterns: CollectivePattern[] = [];
    if (genome) {
      let queryEmb: number[] | null = null;
      if (embedding?.enabled()) {
        queryEmb = await embedding.embedOne(message, 'query');
      }
      collectivePatterns = await genome.getCollectivePatterns(product ?? 'unknown', queryEmb, 3);
    }

    // 4. Build system prompt with all context blocks.
    const memoryBlock = formatMemoriesForPrompt(memories, persona.domain);
    const prefsBlock = prefs ? formatPreferencesForPrompt(prefs, product) : '';
    const crossProductBlock = formatCrossProductContextForPrompt(pendingEvents);
    const collectiveBlock = formatCollectiveIntelligenceForPrompt(collectivePatterns);
    const combinedContextBlock = memoryBlock + prefsBlock + crossProductBlock + collectiveBlock;
    const systemPrompt = buildSystemPrompt(persona, combinedContextBlock);

    // 5. Build provider-agnostic messages.
    const providerMessages = [
      ...history.map((t) => ({ role: t.role, content: t.content })),
      { role: 'user' as const, content: message },
    ];

    // 6. Delegate to provider — it handles the agentic tool loop internally.
    const toolsInvoked: string[] = [];
    const providerResponse = await this.provider.complete({
      system: systemPrompt,
      messages: providerMessages,
      tools: this.registry.providerDefinitions(),
      toolExecutor: async (name, input) => {
        toolsInvoked.push(name);
        return this.registry.execute(name, input, { userId });
      },
      maxTokens: maxTokens ?? DEFAULT_MAX_TOKENS,
    });
    const responseText = providerResponse.text;
    toolsInvoked.push(...providerResponse.toolsInvoked.filter(n => !toolsInvoked.includes(n)));

    // 7. Mark cross-product events as consumed.
    if (contextGraph && pendingEvents.length > 0) {
      await contextGraph.markConsumed(pendingEvents.map(e => e.id));
    }

    // 8. Passively record assistant response as a context memory.
    let memoryRecorded = false;
    if (memory && responseText) {
      const { id } = await recordMemory(memory, embedding, {
        userId,
        content: `User: ${message}\nShift: ${responseText.slice(0, 500)}`,
        type: 'context',
        source: 'conversation',
        confidence: 0.6,
        salience: 0.4,
      });
      memoryRecorded = !!id;
    }

    return {
      text: responseText,
      toolsInvoked,
      memoryRecorded,
      preferencesApplied: !!prefs,
      crossProductEventsConsumed: pendingEvents.length,
      collectivePatternsApplied: collectivePatterns.length,
    };
  }

  /** Explicitly save a memory (e.g. user says "remember that…"). */
  async remember(userId: string, content: string, type = 'preference'): Promise<void> {
    if (!this.config.memory) return;
    await recordMemory(this.config.memory, this.config.embedding, {
      userId,
      content,
      type,
      source: 'explicit',
      confidence: 0.9,
      salience: 0.8,
    });
  }

  /** Retrieve memories relevant to a query. */
  async recall(userId: string, query: string): Promise<MemoryEntry[]> {
    if (!this.config.memory) return [];
    return retrieveRelevantMemories(this.config.memory, this.config.embedding, {
      userId,
      query,
      limit: 14,
    });
  }

  /**
   * Record user feedback on a Shift response.
   * Writes the signal to LearningStore and — if an embedding provider + GenomeStore
   * are wired in — also attaches semantic vectors to the record so it can be
   * clustered by the nightly distillation job.
   *
   * Every embedded signal is raw material for the Genome: the corpus that makes
   * Shift smarter for every user across every product over time.
   */
  async feedback(
    userId: string,
    signal: FeedbackSignal,
    originalText: string,
    editedText?: string,
    userMessage?: string,
    messageId?: string,
  ): Promise<void> {
    const { learning, genome, embedding, product } = this.config;
    if (!learning) return;

    const entry: FeedbackEntry = {
      userId,
      signal,
      originalText,
      editedText,
      userMessage,
      messageId,
      domain: product,
    };
    const feedbackId = await learning.recordFeedback(entry);

    // Embed the signal for semantic clustering — only for positive signals that
    // are worth feeding into the Genome (accept = gold, edit = silver).
    if (feedbackId && genome && embedding?.enabled() && signal !== 'reject') {
      const [responseEmb, queryEmb] = await Promise.all([
        embedding.embedOne(originalText, 'document'),
        embedding.embedOne(userMessage ?? originalText, 'query'),
      ]);
      if (responseEmb && queryEmb) {
        await genome.recordSignalEmbeddings(feedbackId, responseEmb, queryEmb);
      }
    }
  }

  /**
   * Track the outcome of a prediction.
   * Call with actualValue once the outcome is known; omit it when creating
   * the initial prediction record.
   */
  async trackOutcome(
    userId: string,
    predictionType: string,
    predictionId: string,
    predictedValue: unknown,
    actualValue?: unknown,
  ): Promise<void> {
    if (!this.config.learning) return;
    const record: OutcomeRecord = {
      userId,
      predictionType,
      predictionId,
      predictedValue,
      actualValue,
      domain: this.config.product,
      resolvedAt: actualValue !== undefined ? new Date().toISOString() : undefined,
    };
    await this.config.learning.recordOutcome(record);
  }

  /** Stream a response. Returns an async iterable of text deltas. */
  async *stream(opts: ThinkOpts): AsyncIterable<string> {
    const { userId, message, history = [] } = opts;
    const { persona, embedding, memory, maxTokens, learning, contextGraph, genome, product } = this.config;

    // 1. Recall relevant memories.
    let memories: MemoryEntry[] = [];
    if (memory) {
      memories = await retrieveRelevantMemories(memory, embedding, {
        userId, query: message, limit: 14, threshold: 0.25,
      });
    }

    // 2. Fetch cross-product events.
    let pendingEvents: import('./graph.js').CrossProductEvent[] = [];
    if (contextGraph) {
      pendingEvents = await contextGraph.getPendingEvents(product ?? 'unknown', userId);
    }

    // 3. Fetch learned preferences (individual).
    let prefs: import('./learning.js').UserPreferences | null = null;
    if (learning) {
      prefs = await learning.getPreferences(userId, product);
    }

    // 3b. Fetch collective patterns from the Genome.
    let collectivePatterns: CollectivePattern[] = [];
    if (genome) {
      let queryEmb: number[] | null = null;
      if (embedding?.enabled()) {
        queryEmb = await embedding.embedOne(message, 'query');
      }
      collectivePatterns = await genome.getCollectivePatterns(product ?? 'unknown', queryEmb, 3);
    }

    // 4. Build system prompt with all context blocks.
    const memoryBlock = formatMemoriesForPrompt(memories, persona.domain);
    const prefsBlock = prefs ? formatPreferencesForPrompt(prefs, product) : '';
    const crossProductBlock = formatCrossProductContextForPrompt(pendingEvents);
    const collectiveBlock = formatCollectiveIntelligenceForPrompt(collectivePatterns);
    const combinedContextBlock = memoryBlock + prefsBlock + crossProductBlock + collectiveBlock;

    const systemPrompt = buildSystemPrompt(persona, combinedContextBlock);

    // 5. Mark cross-product events as consumed before streaming starts.
    if (contextGraph && pendingEvents.length > 0) {
      await contextGraph.markConsumed(pendingEvents.map(e => e.id));
    }

    const providerMessages = [
      ...history.map((t) => ({ role: t.role, content: t.content })),
      { role: 'user' as const, content: message },
    ];

    yield* this.provider.stream({
      system: systemPrompt,
      messages: providerMessages,
      maxTokens: maxTokens ?? DEFAULT_MAX_TOKENS,
    });
  }

  /** Register an additional tool at runtime. */
  addTool(tool: Parameters<ToolRegistry['register']>[0]): void {
    this.registry.register(tool);
  }
}
