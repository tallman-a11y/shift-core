import type { ShiftTool, ToolContext, ToolInputSchema } from './types.js';
import type { ProviderTool } from './model.js';

export class ToolRegistry {
  private readonly _tools = new Map<string, ShiftTool>();

  register(tool: ShiftTool): this {
    this._tools.set(tool.name, tool);
    return this;
  }

  get(name: string): ShiftTool | undefined {
    return this._tools.get(name);
  }

  all(): ShiftTool[] {
    return [...this._tools.values()];
  }

  /** Returns tool definitions in Anthropic tool-use format. */
  definitions(): Array<{ name: string; description: string; input_schema: ToolInputSchema }> {
    return this.all().map(({ name, description, input_schema }) => ({
      name,
      description,
      input_schema,
    }));
  }

  /** Returns tool definitions in the provider-agnostic ProviderTool format. */
  providerDefinitions(): ProviderTool[] {
    return this.all().map(({ name, description, input_schema }) => ({
      name,
      description,
      parameters: input_schema,
    }));
  }

  async execute(
    name: string,
    input: Record<string, unknown>,
    context: ToolContext,
  ): Promise<unknown> {
    const tool = this._tools.get(name);
    if (!tool) throw new Error(`[shift/core] unknown tool: ${name}`);
    return tool.execute(input, context);
  }
}
