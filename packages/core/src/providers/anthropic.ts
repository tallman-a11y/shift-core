import Anthropic from '@anthropic-ai/sdk';
import type { ModelProvider, ProviderMessage, ProviderResponse, ProviderTool, ToolExecutor } from '../model.js';

const DEFAULT_MODEL = 'claude-sonnet-4-6';

/**
 * AnthropicProvider — wraps the Anthropic Messages API.
 *
 * This is the default provider while Shift Brain runs on Claude.
 * When the fine-tuned Shift model is ready, swap in OpenAICompatProvider
 * (or ShiftModelProvider) without touching any other code.
 *
 * Handles the full agentic tool loop internally in Anthropic's native format.
 */
export class AnthropicProvider implements ModelProvider {
  readonly name = 'anthropic';
  readonly modelId: string;

  private readonly client: Anthropic;

  constructor(apiKey: string, model: string = DEFAULT_MODEL) {
    this.client = new Anthropic({ apiKey });
    this.modelId = model;
  }

  async complete(opts: {
    system: string;
    messages: ProviderMessage[];
    tools?: ProviderTool[];
    toolExecutor?: ToolExecutor;
    maxTokens?: number;
  }): Promise<ProviderResponse> {
    const { system, messages, tools, toolExecutor, maxTokens = 1024 } = opts;

    // Translate to Anthropic format
    let currentMessages: Anthropic.Messages.MessageParam[] = messages.map((m) => ({
      role: m.role,
      content: m.content,
    }));

    const anthropicTools: Anthropic.Messages.Tool[] = (tools ?? []).map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters as Anthropic.Messages.Tool['input_schema'],
    }));

    let responseText = '';
    const toolsInvoked: string[] = [];

    // Agentic tool loop — runs entirely within the provider
    while (true) {
      const response = await this.client.messages.create({
        model: this.modelId,
        max_tokens: maxTokens,
        system,
        messages: currentMessages,
        ...(anthropicTools.length > 0 ? { tools: anthropicTools } : {}),
      });

      const textBlocks = response.content.filter(
        (b): b is Anthropic.Messages.TextBlock => b.type === 'text',
      );
      if (textBlocks.length) {
        responseText = textBlocks.map((b) => b.text).join('');
      }

      if (response.stop_reason !== 'tool_use' || !toolExecutor) break;

      const toolUseBlocks = response.content.filter(
        (b): b is Anthropic.Messages.ToolUseBlock => b.type === 'tool_use',
      );

      const toolResults: Anthropic.Messages.ToolResultBlockParam[] = [];
      for (const block of toolUseBlocks) {
        toolsInvoked.push(block.name);
        let result: unknown;
        try {
          result = await toolExecutor(block.name, block.input as Record<string, unknown>);
        } catch (err) {
          result = { error: String(err) };
        }
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: JSON.stringify(result),
        });
      }

      currentMessages = [
        ...currentMessages,
        { role: 'assistant', content: response.content },
        { role: 'user', content: toolResults },
      ];
    }

    return { text: responseText, toolsInvoked };
  }

  async *stream(opts: {
    system: string;
    messages: ProviderMessage[];
    maxTokens?: number;
  }): AsyncIterable<string> {
    const { system, messages, maxTokens = 1024 } = opts;

    const stream = this.client.messages.stream({
      model: this.modelId,
      max_tokens: maxTokens,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
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
}
