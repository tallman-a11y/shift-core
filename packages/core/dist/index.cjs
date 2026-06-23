'use strict';

var Anthropic = require('@anthropic-ai/sdk');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var Anthropic__default = /*#__PURE__*/_interopDefault(Anthropic);

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
  /** Returns tool definitions in the provider-agnostic ProviderTool format. */
  providerDefinitions() {
    return this.all().map(({ name, description, input_schema }) => ({
      name,
      description,
      parameters: input_schema
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

// src/learning.ts
function formatPreferencesForPrompt(prefs, domain) {
  const lines = [];
  if (prefs.responseStyle !== "standard") {
    lines.push(`- Prefers ${prefs.responseStyle} responses (learned from edit history)`);
  }
  if (prefs.acceptanceRate < 0.4) {
    lines.push(`- Low acceptance rate (${Math.round(prefs.acceptanceRate * 100)}%) \u2014 be more specific and actionable`);
  }
  if (prefs.avoidNotes.length > 0) {
    lines.push(`- Avoid: ${prefs.avoidNotes.join("; ")}`);
  }
  if (prefs.customInstructions) {
    lines.push(`- ${prefs.customInstructions}`);
  }
  if (lines.length === 0) return "";
  return `

---
## LEARNED PREFERENCES
Based on this user's feedback history${domain ? ` in ${domain}` : ""}:
` + lines.join("\n");
}

// src/graph.ts
var NoOpContextGraph = class {
  async publish() {
    return "";
  }
  async getPendingEvents() {
    return [];
  }
  async markConsumed() {
  }
  async resolveIdentity() {
    return null;
  }
  async linkIdentity() {
  }
};
function formatCrossProductContextForPrompt(events) {
  if (events.length === 0) return "";
  return `

---
## CROSS-PRODUCT CONTEXT
Intelligence from other Shift products this user is connected to:
` + events.map((e) => `- [${e.sourceProduct}/${e.eventType}] ${JSON.stringify(e.payload)}`).join("\n") + `

Use this context naturally where relevant \u2014 don't announce its source unless asked.`;
}

// src/genome.ts
var NoOpGenomeStore = class {
  async recordSignalEmbeddings() {
  }
  async getCollectivePatterns() {
    return [];
  }
  async distill() {
    return 0;
  }
  async exportFineTuningData() {
    return [];
  }
  async recordTrainingJob() {
    return null;
  }
  async updateTrainingJob() {
  }
  async getActiveModelVersion() {
    return null;
  }
  async recordModelVersion() {
    return null;
  }
};
function formatCollectiveIntelligenceForPrompt(patterns) {
  if (patterns.length === 0) return "";
  const lines = patterns.map(
    (p) => `- ${p.pattern} (confidence: ${Math.round(p.confidence * 100)}%, n=${p.signalCount})`
  );
  return `

---
## COLLECTIVE INTELLIGENCE
Patterns learned from users across this domain:
` + lines.join("\n") + `

Let these patterns inform your response style \u2014 they reflect what resonates with this user base.`;
}
function cosineSimilarity(a, b) {
  if (a.length !== b.length || a.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  const denom = Math.sqrt(normA) * Math.sqrt(normB);
  return denom === 0 ? 0 : dot / denom;
}
function greedyCluster(signals, threshold = 0.82) {
  const clusters = [];
  const assigned = /* @__PURE__ */ new Set();
  for (let i = 0; i < signals.length; i++) {
    if (assigned.has(i)) continue;
    const embA = signals[i].embedding;
    if (!embA) {
      assigned.add(i);
      continue;
    }
    const cluster = [i];
    assigned.add(i);
    for (let j = i + 1; j < signals.length; j++) {
      if (assigned.has(j)) continue;
      const embB = signals[j].embedding;
      if (!embB) continue;
      if (cosineSimilarity(embA, embB) >= threshold) {
        cluster.push(j);
        assigned.add(j);
      }
    }
    if (cluster.length >= 2) clusters.push(cluster);
  }
  return clusters;
}
function centroid(embeddings) {
  const valid = embeddings.filter((e) => e && e.length > 0);
  if (valid.length === 0) return [];
  const dims = valid[0].length;
  const sum = new Array(dims).fill(0);
  for (const emb of valid) {
    for (let i = 0; i < dims; i++) sum[i] += emb[i];
  }
  return sum.map((v) => v / valid.length);
}
var DEFAULT_MODEL = "claude-sonnet-4-6";
var AnthropicProvider = class {
  constructor(apiKey, model = DEFAULT_MODEL) {
    this.name = "anthropic";
    this.client = new Anthropic__default.default({ apiKey });
    this.modelId = model;
  }
  async complete(opts) {
    const { system, messages, tools, toolExecutor, maxTokens = 1024 } = opts;
    let currentMessages = messages.map((m) => ({
      role: m.role,
      content: m.content
    }));
    const anthropicTools = (tools ?? []).map((t) => ({
      name: t.name,
      description: t.description,
      input_schema: t.parameters
    }));
    let responseText = "";
    const toolsInvoked = [];
    while (true) {
      const response = await this.client.messages.create({
        model: this.modelId,
        max_tokens: maxTokens,
        system,
        messages: currentMessages,
        ...anthropicTools.length > 0 ? { tools: anthropicTools } : {}
      });
      const textBlocks = response.content.filter(
        (b) => b.type === "text"
      );
      if (textBlocks.length) {
        responseText = textBlocks.map((b) => b.text).join("");
      }
      if (response.stop_reason !== "tool_use" || !toolExecutor) break;
      const toolUseBlocks = response.content.filter(
        (b) => b.type === "tool_use"
      );
      const toolResults = [];
      for (const block of toolUseBlocks) {
        toolsInvoked.push(block.name);
        let result;
        try {
          result = await toolExecutor(block.name, block.input);
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
    return { text: responseText, toolsInvoked };
  }
  async *stream(opts) {
    const { system, messages, maxTokens = 1024 } = opts;
    const stream = this.client.messages.stream({
      model: this.modelId,
      max_tokens: maxTokens,
      system,
      messages: messages.map((m) => ({ role: m.role, content: m.content }))
    });
    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        yield event.delta.text;
      }
    }
  }
};

// src/brain.ts
var DEFAULT_MAX_TOKENS = 1024;
var ShiftBrain = class {
  constructor(config) {
    this.config = config;
    this.provider = config.provider ?? new AnthropicProvider(config.anthropicApiKey, config.model);
    this.registry = new ToolRegistry();
    for (const tool of config.tools ?? []) {
      this.registry.register(tool);
    }
  }
  /** Main entry point: think through a user message and return a response. */
  async think(opts) {
    const { userId, message, history = [], messageId } = opts;
    const { persona, embedding, memory, maxTokens, learning, contextGraph, genome, product } = this.config;
    let memories = [];
    if (memory) {
      memories = await retrieveRelevantMemories(memory, embedding, {
        userId,
        query: message,
        limit: 14,
        threshold: 0.25
      });
    }
    let pendingEvents = [];
    if (contextGraph) {
      pendingEvents = await contextGraph.getPendingEvents(product ?? "unknown", userId);
    }
    let prefs = null;
    if (learning) {
      prefs = await learning.getPreferences(userId, product);
    }
    let collectivePatterns = [];
    if (genome) {
      let queryEmb = null;
      if (embedding?.enabled()) {
        queryEmb = await embedding.embedOne(message, "query");
      }
      collectivePatterns = await genome.getCollectivePatterns(product ?? "unknown", queryEmb, 3);
    }
    const memoryBlock = formatMemoriesForPrompt(memories, persona.domain);
    const prefsBlock = prefs ? formatPreferencesForPrompt(prefs, product) : "";
    const crossProductBlock = formatCrossProductContextForPrompt(pendingEvents);
    const collectiveBlock = formatCollectiveIntelligenceForPrompt(collectivePatterns);
    const combinedContextBlock = memoryBlock + prefsBlock + crossProductBlock + collectiveBlock;
    const systemPrompt = buildSystemPrompt(persona, combinedContextBlock);
    const providerMessages = [
      ...history.map((t) => ({ role: t.role, content: t.content })),
      { role: "user", content: message }
    ];
    const toolsInvoked = [];
    const providerResponse = await this.provider.complete({
      system: systemPrompt,
      messages: providerMessages,
      tools: this.registry.providerDefinitions(),
      toolExecutor: async (name, input) => {
        toolsInvoked.push(name);
        return this.registry.execute(name, input, { userId });
      },
      maxTokens: maxTokens ?? DEFAULT_MAX_TOKENS
    });
    const responseText = providerResponse.text;
    toolsInvoked.push(...providerResponse.toolsInvoked.filter((n) => !toolsInvoked.includes(n)));
    if (contextGraph && pendingEvents.length > 0) {
      await contextGraph.markConsumed(pendingEvents.map((e) => e.id));
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
    return {
      text: responseText,
      toolsInvoked,
      memoryRecorded,
      preferencesApplied: !!prefs,
      crossProductEventsConsumed: pendingEvents.length,
      collectivePatternsApplied: collectivePatterns.length
    };
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
  /**
   * Record user feedback on a Shift response.
   * Writes the signal to LearningStore and — if an embedding provider + GenomeStore
   * are wired in — also attaches semantic vectors to the record so it can be
   * clustered by the nightly distillation job.
   *
   * Every embedded signal is raw material for the Genome: the corpus that makes
   * Shift smarter for every user across every product over time.
   */
  async feedback(userId, signal, originalText, editedText, userMessage, messageId) {
    const { learning, genome, embedding, product } = this.config;
    if (!learning) return;
    const entry = {
      userId,
      signal,
      originalText,
      editedText,
      userMessage,
      messageId,
      domain: product
    };
    const feedbackId = await learning.recordFeedback(entry);
    if (feedbackId && genome && embedding?.enabled() && signal !== "reject") {
      const [responseEmb, queryEmb] = await Promise.all([
        embedding.embedOne(originalText, "document"),
        embedding.embedOne(userMessage ?? originalText, "query")
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
  async trackOutcome(userId, predictionType, predictionId, predictedValue, actualValue) {
    if (!this.config.learning) return;
    const record = {
      userId,
      predictionType,
      predictionId,
      predictedValue,
      actualValue,
      domain: this.config.product,
      resolvedAt: actualValue !== void 0 ? (/* @__PURE__ */ new Date()).toISOString() : void 0
    };
    await this.config.learning.recordOutcome(record);
  }
  /** Stream a response. Returns an async iterable of text deltas. */
  async *stream(opts) {
    const { userId, message, history = [] } = opts;
    const { persona, embedding, memory, maxTokens, learning, contextGraph, genome, product } = this.config;
    let memories = [];
    if (memory) {
      memories = await retrieveRelevantMemories(memory, embedding, {
        userId,
        query: message,
        limit: 14,
        threshold: 0.25
      });
    }
    let pendingEvents = [];
    if (contextGraph) {
      pendingEvents = await contextGraph.getPendingEvents(product ?? "unknown", userId);
    }
    let prefs = null;
    if (learning) {
      prefs = await learning.getPreferences(userId, product);
    }
    let collectivePatterns = [];
    if (genome) {
      let queryEmb = null;
      if (embedding?.enabled()) {
        queryEmb = await embedding.embedOne(message, "query");
      }
      collectivePatterns = await genome.getCollectivePatterns(product ?? "unknown", queryEmb, 3);
    }
    const memoryBlock = formatMemoriesForPrompt(memories, persona.domain);
    const prefsBlock = prefs ? formatPreferencesForPrompt(prefs, product) : "";
    const crossProductBlock = formatCrossProductContextForPrompt(pendingEvents);
    const collectiveBlock = formatCollectiveIntelligenceForPrompt(collectivePatterns);
    const combinedContextBlock = memoryBlock + prefsBlock + crossProductBlock + collectiveBlock;
    const systemPrompt = buildSystemPrompt(persona, combinedContextBlock);
    if (contextGraph && pendingEvents.length > 0) {
      await contextGraph.markConsumed(pendingEvents.map((e) => e.id));
    }
    const providerMessages = [
      ...history.map((t) => ({ role: t.role, content: t.content })),
      { role: "user", content: message }
    ];
    yield* this.provider.stream({
      system: systemPrompt,
      messages: providerMessages,
      maxTokens: maxTokens ?? DEFAULT_MAX_TOKENS
    });
  }
  /** Register an additional tool at runtime. */
  addTool(tool) {
    this.registry.register(tool);
  }
};

// src/providers/openai-compat.ts
var OpenAICompatProvider = class {
  constructor(config) {
    this.baseURL = config.baseURL.replace(/\/$/, "");
    this.modelId = config.model;
    this.apiKey = config.apiKey;
    this.name = config.providerName ?? new URL(config.baseURL).hostname;
  }
  async complete(opts) {
    const { system, messages, tools, toolExecutor, maxTokens = 1024 } = opts;
    let currentMessages = [
      { role: "system", content: system },
      ...messages.map((m) => ({ role: m.role, content: m.content }))
    ];
    const oaiTools = (tools ?? []).map((t) => ({
      type: "function",
      function: {
        name: t.name,
        description: t.description,
        parameters: t.parameters
      }
    }));
    let responseText = "";
    const toolsInvoked = [];
    while (true) {
      const body = {
        model: this.modelId,
        max_tokens: maxTokens,
        messages: currentMessages
      };
      if (oaiTools.length > 0) {
        body.tools = oaiTools;
        body.tool_choice = "auto";
      }
      const resp = await fetch(`${this.baseURL}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(body)
      });
      if (!resp.ok) {
        const text = await resp.text().catch(() => "");
        throw new Error(`[shift/openai-compat] ${resp.status}: ${text.slice(0, 200)}`);
      }
      const data = await resp.json();
      const choice = data.choices[0];
      if (!choice) break;
      const { message, finish_reason } = choice;
      if (message.content) responseText = message.content;
      if (finish_reason !== "tool_calls" || !message.tool_calls || !toolExecutor) break;
      const assistantMsg = {
        role: "assistant",
        content: message.content,
        tool_calls: message.tool_calls
      };
      currentMessages = [...currentMessages, assistantMsg];
      for (const call of message.tool_calls) {
        toolsInvoked.push(call.function.name);
        let result;
        try {
          const input = JSON.parse(call.function.arguments);
          result = await toolExecutor(call.function.name, input);
        } catch (err) {
          result = { error: String(err) };
        }
        currentMessages = [
          ...currentMessages,
          {
            role: "tool",
            content: JSON.stringify(result),
            tool_call_id: call.id
          }
        ];
      }
    }
    return { text: responseText, toolsInvoked };
  }
  async *stream(opts) {
    const { system, messages, maxTokens = 1024 } = opts;
    const resp = await fetch(`${this.baseURL}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: this.modelId,
        max_tokens: maxTokens,
        stream: true,
        messages: [
          { role: "system", content: system },
          ...messages.map((m) => ({ role: m.role, content: m.content }))
        ]
      })
    });
    if (!resp.ok || !resp.body) {
      throw new Error(`[shift/openai-compat] stream ${resp.status}`);
    }
    const reader = resp.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        const trimmed = line.replace(/^data: /, "").trim();
        if (!trimmed || trimmed === "[DONE]") continue;
        try {
          const chunk = JSON.parse(trimmed);
          const delta = chunk.choices[0]?.delta?.content;
          if (delta) yield delta;
        } catch {
        }
      }
    }
  }
};
function OllamaProvider(model, baseURL = "http://localhost:11434/v1") {
  return new OpenAICompatProvider({
    baseURL,
    model,
    apiKey: "ollama",
    providerName: `ollama/${model}`
  });
}

// src/providers/router.ts
var RouterProvider = class {
  constructor(config) {
    this.config = config;
    this.name = `router(${config.primary.name})`;
    this.modelId = config.primary.modelId;
  }
  async complete(opts) {
    const { primary, fallback, shadow, canary, canaryPercent, onRoute } = this.config;
    let activeProvider = primary;
    let reason = "primary";
    if (canary && canaryPercent && canaryPercent > 0) {
      if (Math.random() * 100 < canaryPercent) {
        activeProvider = canary;
        reason = "canary";
      }
    }
    onRoute?.({
      provider: activeProvider.name,
      reason,
      shadowProvider: shadow?.name
    });
    if (shadow && shadow !== activeProvider) {
      shadow.complete(opts).catch(() => {
      });
    }
    try {
      return await activeProvider.complete(opts);
    } catch (err) {
      if (fallback && fallback !== activeProvider) {
        onRoute?.({ provider: fallback.name, reason: "fallback" });
        return fallback.complete(opts);
      }
      throw err;
    }
  }
  async *stream(opts) {
    const { primary, fallback } = this.config;
    try {
      yield* primary.stream(opts);
    } catch {
      if (fallback) {
        yield* fallback.stream(opts);
      }
    }
  }
};

// src/training.ts
function exportForFineTuning(pairs, format, systemPrompt) {
  switch (format) {
    case "openai":
      return exportOpenAI(pairs, systemPrompt);
    case "anthropic":
      return exportAnthropic(pairs, systemPrompt);
    case "hf":
      return exportHuggingFace(pairs, systemPrompt);
  }
}
function toJSONL(records) {
  return records.map((r) => JSON.stringify(r)).join("\n");
}
function exportOpenAI(pairs, system) {
  return toJSONL(
    pairs.map((p) => ({
      messages: [
        ...system ? [{ role: "system", content: system }] : [],
        ...p.messages,
        // If the user edited the response, the edited version is the ground truth
        ...p.editedResponse ? [{ role: "assistant", content: p.editedResponse }] : []
      ].filter((_, i, arr) => {
        if (p.editedResponse && arr[i].role === "assistant" && i < arr.length - 1) return false;
        return true;
      })
    }))
  );
}
function exportAnthropic(pairs, system) {
  return toJSONL(
    pairs.map((p) => ({
      system: system ?? "",
      messages: p.messages.map((m) => ({
        role: m.role,
        content: m.content
      }))
    }))
  );
}
function exportHuggingFace(pairs, system) {
  return toJSONL(
    pairs.map((p) => {
      const systemPart = system ? `<|system|>
${system}
` : "";
      const userPart = `<|user|>
${p.messages.find((m) => m.role === "user")?.content ?? ""}
`;
      const assistantContent = p.editedResponse ?? p.messages.find((m) => m.role === "assistant")?.content ?? "";
      const assistantPart = `<|assistant|>
${assistantContent}`;
      return { text: systemPart + userPart + assistantPart };
    })
  );
}

exports.AnthropicProvider = AnthropicProvider;
exports.EMBED_DIM = EMBED_DIM;
exports.NoOpContextGraph = NoOpContextGraph;
exports.NoOpGenomeStore = NoOpGenomeStore;
exports.OllamaProvider = OllamaProvider;
exports.OpenAICompatProvider = OpenAICompatProvider;
exports.RouterProvider = RouterProvider;
exports.ShiftBrain = ShiftBrain;
exports.ToolRegistry = ToolRegistry;
exports.VoyageEmbeddingProvider = VoyageEmbeddingProvider;
exports.buildSystemPrompt = buildSystemPrompt;
exports.centroid = centroid;
exports.cosineSimilarity = cosineSimilarity;
exports.definePersona = definePersona;
exports.exportForFineTuning = exportForFineTuning;
exports.formatCollectiveIntelligenceForPrompt = formatCollectiveIntelligenceForPrompt;
exports.formatCrossProductContextForPrompt = formatCrossProductContextForPrompt;
exports.formatMemoriesForPrompt = formatMemoriesForPrompt;
exports.formatPreferencesForPrompt = formatPreferencesForPrompt;
exports.greedyCluster = greedyCluster;
exports.recordMemory = recordMemory;
exports.retrieveRelevantMemories = retrieveRelevantMemories;
//# sourceMappingURL=index.cjs.map
//# sourceMappingURL=index.cjs.map