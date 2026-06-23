import type { ToolInputSchema } from './types.js';

// ── Provider-agnostic tool types ──────────────────────────────────────────────

export interface ProviderTool {
  name: string;
  description: string;
  parameters: ToolInputSchema;
}

/**
 * Called by the provider's tool loop with each tool invocation.
 * The brain passes a closure that captures userId and registry.
 */
export type ToolExecutor = (
  name: string,
  input: Record<string, unknown>,
) => Promise<unknown>;

// ── Provider message (conversation history) ───────────────────────────────────

export interface ProviderMessage {
  role: 'user' | 'assistant';
  content: string;
}

// ── Provider response ─────────────────────────────────────────────────────────

export interface ProviderResponse {
  text: string;
  /** Names of every tool called during this completion, in order. */
  toolsInvoked: string[];
}

// ── Core interface ────────────────────────────────────────────────────────────

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
export interface ModelProvider {
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
