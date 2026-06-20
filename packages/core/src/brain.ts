import Anthropic from '@anthropic-ai/sdk';
import { buildSystemPrompt } from './persona.js';
import { recordMemory, retrieveRelevantMemories, formatMemoriesForPrompt } from './memory.js';
import { ToolRegistry } from './tools.js';
import type {
  BrainConfig,
  ThinkOpts,
  ThinkResult,
  ConversationTurn,
  MemoryEntry,
} from './types.js';

const DEFAULT_MODEL = 'claude-sonnet-4-6';
const DEFAULT_MAX_TOKENS = 1024;

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
export class ShiftBrain {
  private readonly client: Anthropic;
  private readonly registry: ToolRegistry;
  private readonly config: BrainConfig;

  constructor(config: BrainConfig) {
    this.config = config;
    this.client = new Anthropic({ apiKey: config.anthropicApiKey });
    this.registry = new ToolRegistry();
    for (const tool of config.tools ?? []) {
      this.registry.register(tool);
    }
  }

  /** Main entry point: think through a user message and return a response. */
  async think(opts: ThinkOpts): Promise<ThinkResult> {
    const { userId, message, history = [] } = opts;
    const { persona, embedding, memory, knowledge, model, maxTokens } = this.config;

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

    // 2. Build system prompt with memory block.
    const memoryBlock = formatMemoriesForPrompt(memories, persona.domain);
    const systemPrompt = buildSystemPrompt(persona, memoryBlock);

    // 3. Build messages array.
    const messages: Anthropic.Messages.MessageParam[] = [
      ...history.map((t) => ({ role: t.role, content: t.content } as Anthropic.Messages.MessageParam)),
      { role: 'user', content: message },
    ];

    // 4. Agentic tool loop.
    const toolsInvoked: string[] = [];
    let responseText = '';

    const tools = this.registry.definitions();
    let currentMessages = messages;

    while (true) {
      const response = await this.client.messages.create({
        model: model ?? DEFAULT_MODEL,
        max_tokens: maxTokens ?? DEFAULT_MAX_TOKENS,
        system: systemPrompt,
        messages: currentMessages,
        ...(tools.length > 0 ? { tools } : {}),
      });

      // Collect text from this turn.
      const textBlocks = response.content.filter((b): b is Anthropic.Messages.TextBlock => b.type === 'text');
      if (textBlocks.length) {
        responseText = textBlocks.map((b) => b.text).join('');
      }

      // No tool calls — we're done.
      if (response.stop_reason !== 'tool_use') break;

      // Execute tool calls.
      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use',
      );

      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
      for (const block of toolUseBlocks) {
        toolsInvoked.push(block.name);
        let result: unknown;
        try {
          result = await this.registry.execute(
            block.name,
            block.input as Record<string, unknown>,
            { userId },
          );
        } catch (err) {
          result = { error: String(err) };
        }
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }

      // Feed tool results back for the next turn.
      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults },
      ];
    }

    // 5. Passively record assistant response as a context memory.
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

    return { text: responseText, toolsInvoked, memoryRecorded };
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

  /** Stream a response. Returns an async iterable of text deltas. */
  async *stream(opts: ThinkOpts): AsyncIterable<string> {
    const { userId, message, history = [] } = opts;
    const { persona, embedding, memory, model, maxTokens } = this.config;

    let memories: MemoryEntry[] = [];
    if (memory) {
      memories = await retrieveRelevantMemories(memory, embedding, {
        userId, query: message, limit: 14, threshold: 0.25,
      });
    }

    const systemPrompt = buildSystemPrompt(
      persona,
      formatMemoriesForPrompt(memories, persona.domain),
    );

    const messages: Anthropic.Messages.MessageParam[] = [
      ...history.map((t) => ({ role: t.role, content: t.content } as Anthropic.Messages.MessageParam)),
      { role: 'user', content: message },
    ];

    const stream = this.client.messages.stream({
      model: model ?? DEFAULT_MODEL,
      max_tokens: maxTokens ?? DEFAULT_MAX_TOKENS,
      system: systemPrompt,
      messages,
    });

    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
    }
  }

  /** Register an additional tool at runtime. */
  addTool(tool: Parameters<ToolRegistry['register']>[0]): void {
    this.registry.register(tool);
  }
}
