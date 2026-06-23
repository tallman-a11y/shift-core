import type { ModelProvider, ProviderMessage, ProviderResponse, ProviderTool, ToolExecutor } from '../model.js';

export interface OpenAICompatConfig {
  /** API base URL. OpenAI: 'https://api.openai.com/v1'. Ollama: 'http://localhost:11434/v1'. */
  baseURL: string;
  model: string;
  /** API key. Use 'ollama' for local Ollama (no real key needed). */
  apiKey: string;
  /** Override the provider name shown in logs. Default: derived from baseURL. */
  providerName?: string;
}

interface OAIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool';
  content: string | null;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
  tool_call_id?: string;
}

interface OAIResponse {
  choices: Array<{
    message: {
      content: string | null;
      tool_calls?: Array<{
        id: string;
        type: 'function';
        function: { name: string; arguments: string };
      }>;
    };
    finish_reason: string;
  }>;
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
export class OpenAICompatProvider implements ModelProvider {
  readonly name: string;
  readonly modelId: string;

  private readonly baseURL: string;
  private readonly apiKey: string;

  constructor(config: OpenAICompatConfig) {
    this.baseURL = config.baseURL.replace(/\/$/, '');
    this.modelId = config.model;
    this.apiKey = config.apiKey;
    this.name = config.providerName ?? new URL(config.baseURL).hostname;
  }

  async complete(opts: {
    system: string;
    messages: ProviderMessage[];
    tools?: ProviderTool[];
    toolExecutor?: ToolExecutor;
    maxTokens?: number;
  }): Promise<ProviderResponse> {
    const { system, messages, tools, toolExecutor, maxTokens = 1024 } = opts;

    let currentMessages: OAIMessage[] = [
      { role: 'system', content: system },
      ...messages.map((m) => ({ role: m.role, content: m.content } as OAIMessage)),
    ];

    const oaiTools = (tools ?? []).map((t) => ({
      type: 'function' as const,
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters,
      },
    }));

    let responseText = '';
    const toolsInvoked: string[] = [];

    while (true) {
      const body: Record<string, unknown> = {
        model: this.modelId,
        max_tokens: maxTokens,
        messages: currentMessages,
      };
      if (oaiTools.length > 0) {
        body.tools = oaiTools;
        body.tool_choice = 'auto';
      }

      const resp = await fetch(`${this.baseURL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify(body),
      });

      if (!resp.ok) {
        const text = await resp.text().catch(() => '');
        throw new Error(`[shift/openai-compat] ${resp.status}: ${text.slice(0, 200)}`);
      }

      const data = (await resp.json()) as OAIResponse;
      const choice = data.choices[0];
      if (!choice) break;

      const { message, finish_reason } = choice;
      if (message.content) responseText = message.content;

      if (finish_reason !== 'tool_calls' || !message.tool_calls || !toolExecutor) break;

      // Execute tool calls
      const assistantMsg: OAIMessage = {
        role: 'assistant',
        content: message.content,
        tool_calls: message.tool_calls,
      };
      currentMessages = [...currentMessages, assistantMsg];

      for (const call of message.tool_calls) {
        toolsInvoked.push(call.function.name);
        let result: unknown;
        try {
          const input = JSON.parse(call.function.arguments) as Record<string, unknown>;
          result = await toolExecutor(call.function.name, input);
        } catch (err) {
          result = { error: String(err) };
        }
        currentMessages = [
          ...currentMessages,
          {
            role: 'tool',
            content: JSON.stringify(result),
            tool_call_id: call.id,
          },
        ];
      }
    }

    return { text: responseText, toolsInvoked };
  }

  async *stream(opts: {
    system: string;
    messages: ProviderMessage[];
    maxTokens?: number;
  }): AsyncIterable<string> {
    const { system, messages, maxTokens = 1024 } = opts;

    const resp = await fetch(`${this.baseURL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: this.modelId,
        max_tokens: maxTokens,
        stream: true,
        messages: [
          { role: 'system', content: system },
          ...messages.map((m) => ({ role: m.role, content: m.content })),
        ],
      }),
    });

    if (!resp.ok || !resp.body) {
      throw new Error(`[shift/openai-compat] stream ${resp.status}`);
    }

    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';

      for (const line of lines) {
        const trimmed = line.replace(/^data: /, '').trim();
        if (!trimmed || trimmed === '[DONE]') continue;
        try {
          const chunk = JSON.parse(trimmed) as {
            choices: Array<{ delta: { content?: string } }>;
          };
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
          // malformed SSE chunk — skip
        }
      }
    }
  }
}

/**
 * Convenience factory for local Ollama inference.
 * Runs any Ollama model (including fine-tuned Shift models) with zero external calls.
 *
 * Usage:
 *   const provider = OllamaProvider('shift-lendshift-v1');
 *   const brain = new ShiftBrain({ provider, ... });
 */
export function OllamaProvider(
  model: string,
  baseURL = 'http://localhost:11434/v1',
): OpenAICompatProvider {
  return new OpenAICompatProvider({
    baseURL,
    model,
    apiKey: 'ollama',
    providerName: `ollama/${model}`,
  });
}
