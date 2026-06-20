import Anthropic from '@anthropic-ai/sdk';

// src/embeddings.ts
var VOYAGE_URL = "https://api.voyageai.com/v1/embeddings";
var VOYAGE_MODEL = "voyage-3-large";
var EMBED_DIM = 1024;
var MAX_BATCH = 128;
var VoyageEmbeddingProvider = class {
  constructor(apiKey) {
    this.apiKey = apiKey;
  }
  enabled() {
    return !!this.apiKey;
  }
  async embedBatch(texts, inputType = "document") {
    if (!this.enabled() || texts.length === 0) return null;
    const clean = texts.map((t) => (t ?? "").slice(0, 32e3));
    const out = [];
    for (let i = 0; i < clean.length; i += MAX_BATCH) {
      const batch = await this._voyageBatch(clean.slice(i, i + MAX_BATCH), inputType);
      if (!batch) return null;
      out.push(...batch);
    }
    return out;
  }
  async embedOne(text, inputType = "document") {
    const r = await this.embedBatch([text], inputType);
    return r ? r[0] : null;
  }
  async _voyageBatch(texts, inputType) {
    try {
      const res = await fetch(VOYAGE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          input: texts,
          model: VOYAGE_MODEL,
          input_type: inputType,
          output_dimension: EMBED_DIM,
          truncation: true
        })
      });
      if (!res.ok) {
        console.error("[shift/core embeddings] voyage error", res.status, await res.text().catch(() => ""));
        return null;
      }
      const json = await res.json();
      if (!json.data) return null;
      return json.data.sort((a, b) => a.index - b.index).map((d) => d.embedding);
    } catch (err) {
      console.error("[shift/core embeddings] fetch failed", err);
      return null;
    }
  }
};

// src/memory.ts
async function recordMemory(store, embedding, opts) {
  const content = opts.content?.trim();
  if (!content) return { id: null, reinforced: false };
  const vec = embedding?.enabled() ? await embedding.embedOne(content, "document") : null;
  return store.record({ ...opts, content }, vec);
}
async function retrieveRelevantMemories(store, embedding, opts) {
  const qEmb = embedding?.enabled() && opts.query?.trim() ? await embedding.embedOne(opts.query, "query") : null;
  return store.retrieve(opts, qEmb);
}
function formatMemoriesForPrompt(memories, domain) {
  if (!memories.length) return "";
  const domainPrefs = memories.filter((m) => m.type.includes("preference") || m.type.includes("deal"));
  const other = memories.filter((m) => !domainPrefs.includes(m));
  return `

---
## SHIFT MEMORY
You have persistent, semantically-retrieved memory of this user \u2014 real decisions, preferences, and context they've revealed or saved. Treat them as ground truth${domain ? ` within ${domain}` : ""}.

` + [...other, ...domainPrefs].map((m) => `- [${m.type}] ${m.content}`).join("\n") + `

PROACTIVE MEMORY RULE: If any memory is directly relevant to the user's current question, surface it naturally at the start of your response. Never recite all memories \u2014 only what's genuinely relevant. If the user shares a new decision or preference worth keeping, offer to save it.`;
}

// src/tools.ts
var ToolRegistry = class {
  constructor() {
    this._tools = /* @__PURE__ */ new Map();
  }
  register(tool) {
    this._tools.set(tool.name, tool);
    return this;
  }
  get(name) {
    return this._tools.get(name);
  }
  all() {
    return [...this._tools.values()];
  }
  /** Returns tool definitions in Anthropic tool-use format. */
  definitions() {
    return this.all().map(({ name, description, input_schema }) => ({
      name,
      description,
      input_schema
    }));
  }
  async execute(name, input, context) {
    const tool = this._tools.get(name);
    if (!tool) throw new Error(`[shift/core] unknown tool: ${name}`);
    return tool.execute(input, context);
  }
};

// src/persona.ts
function buildSystemPrompt(persona, memoryBlock = "", knowledgeBlock = "") {
  return [persona.systemPrompt, memoryBlock, knowledgeBlock].filter(Boolean).join("\n\n");
}
function definePersona(persona) {
  return persona;
}
var DEFAULT_MODEL = "claude-sonnet-4-6";
var DEFAULT_MAX_TOKENS = 1024;
var ShiftBrain = class {
  constructor(config) {
    this.config = config;
    this.client = new Anthropic({ apiKey: config.anthropicApiKey });
    this.registry = new ToolRegistry();
    for (const tool of config.tools ?? []) {
      this.registry.register(tool);
    }
  }
  /** Main entry point: think through a user message and return a response. */
  async think(opts) {
    const { userId, message, history = [] } = opts;
    const { persona, embedding, memory, knowledge, model, maxTokens } = this.config;
    let memories = [];
    if (memory) {
      memories = await retrieveRelevantMemories(memory, embedding, {
        userId,
        query: message,
        limit: 14,
        threshold: 0.25
      });
    }
    const memoryBlock = formatMemoriesForPrompt(memories, persona.domain);
    const systemPrompt = buildSystemPrompt(persona, memoryBlock);
    const messages = [
      ...history.map((t) => ({ role: t.role, content: t.content })),
      { role: "user", content: message }
    ];
    const toolsInvoked = [];
    let responseText = "";
    const tools = this.registry.definitions();
    let currentMessages = messages;
    while (true) {
      const response = await this.client.messages.create({
        model: model ?? DEFAULT_MODEL,
        max_tokens: maxTokens ?? DEFAULT_MAX_TOKENS,
        system: systemPrompt,
        messages: currentMessages,
        ...tools.length > 0 ? { tools } : {}
      });
      const textBlocks = response.content.filter((b) => b.type === "text");
      if (textBlocks.length) {
        responseText = textBlocks.map((b) => b.text).join("");
      }
      if (response.stop_reason !== "tool_use") break;
      const toolUseBlocks = response.content.filter(
        (b) => b.type === "tool_use"
      );
      const toolResults = [];
      for (const block of toolUseBlocks) {
        toolsInvoked.push(block.name);
        let result;
        try {
          result = await this.registry.execute(
            block.name,
            block.input,
            { userId }
          );
        } catch (err) {
          result = { error: String(err) };
        }
        toolResults.push({
          type: "tool_result",
          tool_use_id: block.id,
          content: JSON.stringify(result)
        });
      }
      currentMessages = [
        ...currentMessages,
        { role: "assistant", content: response.content },
        { role: "user", content: toolResults }
      ];
    }
    let memoryRecorded = false;
    if (memory && responseText) {
      const { id } = await recordMemory(memory, embedding, {
        userId,
        content: `User: ${message}
Shift: ${responseText.slice(0, 500)}`,
        type: "context",
        source: "conversation",
        confidence: 0.6,
        salience: 0.4
      });
      memoryRecorded = !!id;
    }
    return { text: responseText, toolsInvoked, memoryRecorded };
  }
  /** Explicitly save a memory (e.g. user says "remember that…"). */
  async remember(userId, content, type = "preference") {
    if (!this.config.memory) return;
    await recordMemory(this.config.memory, this.config.embedding, {
      userId,
      content,
      type,
      source: "explicit",
      confidence: 0.9,
      salience: 0.8
    });
  }
  /** Retrieve memories relevant to a query. */
  async recall(userId, query) {
    if (!this.config.memory) return [];
    return retrieveRelevantMemories(this.config.memory, this.config.embedding, {
      userId,
      query,
      limit: 14
    });
  }
  /** Stream a response. Returns an async iterable of text deltas. */
  async *stream(opts) {
    const { userId, message, history = [] } = opts;
    const { persona, embedding, memory, model, maxTokens } = this.config;
    let memories = [];
    if (memory) {
      memories = await retrieveRelevantMemories(memory, embedding, {
        userId,
        query: message,
        limit: 14,
        threshold: 0.25
      });
    }
    const systemPrompt = buildSystemPrompt(
      persona,
      formatMemoriesForPrompt(memories, persona.domain)
    );
    const messages = [
      ...history.map((t) => ({ role: t.role, content: t.content })),
      { role: "user", content: message }
    ];
    const stream = this.client.messages.stream({
      model: model ?? DEFAULT_MODEL,
      max_tokens: maxTokens ?? DEFAULT_MAX_TOKENS,
      system: systemPrompt,
      messages
    });
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
      }
    }
  }
  /** Register an additional tool at runtime. */
  addTool(tool) {
    this.registry.register(tool);
  }
};

export { EMBED_DIM, ShiftBrain, ToolRegistry, VoyageEmbeddingProvider, buildSystemPrompt, definePersona, formatMemoriesForPrompt, recordMemory, retrieveRelevantMemories };
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map