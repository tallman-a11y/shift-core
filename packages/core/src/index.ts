// Types
export type {
  MemoryType,
  MemorySource,
  MemoryEntry,
  RecordMemoryOpts,
  RecordResult,
  RetrieveOpts,
  EmbedInputType,
  EmbeddingProvider,
  MemoryStore,
  KnowledgeChunk,
  KnowledgeStore,
  ToolInputSchema,
  ShiftTool,
  ToolContext,
  ShiftPersona,
  ConversationTurn,
  BrainConfig,
  ThinkOpts,
  ThinkResult,
} from './types.js';

// Embeddings
export { VoyageEmbeddingProvider, EMBED_DIM } from './embeddings.js';

// Memory
export { recordMemory, retrieveRelevantMemories, formatMemoriesForPrompt } from './memory.js';

// Tools
export { ToolRegistry } from './tools.js';

// Persona
export { definePersona, buildSystemPrompt } from './persona.js';

// Brain
export { ShiftBrain } from './brain.js';

// Learning Engine
export type { FeedbackSignal, FeedbackEntry, OutcomeRecord, UserPreferences, LearningStore } from './learning.js';
export { formatPreferencesForPrompt } from './learning.js';

// Context Graph
export type { CrossProductEvent, CrossProductIdentity, ContextGraph } from './graph.js';
export { NoOpContextGraph, formatCrossProductContextForPrompt } from './graph.js';

// Genome — collective intelligence + fine-tuning pipeline
export type { CollectivePattern, FineTuningPair, GenomeStore } from './genome.js';
export {
  NoOpGenomeStore,
  formatCollectiveIntelligenceForPrompt,
  cosineSimilarity,
  greedyCluster,
  centroid,
} from './genome.js';

// Model provider abstraction — the independence layer
export type { ModelProvider, ProviderMessage, ProviderResponse, ProviderTool, ToolExecutor } from './model.js';
export { AnthropicProvider } from './providers/anthropic.js';
export { OpenAICompatProvider, OllamaProvider } from './providers/openai-compat.js';
export type { OpenAICompatConfig } from './providers/openai-compat.js';
export { RouterProvider } from './providers/router.js';
export type { RouterConfig, RouteDecision } from './providers/router.js';

// Training pipeline — fine-tuning export + model version tracking
export type { TrainingJob, ModelVersion, FineTuningFormat } from './training.js';
export { exportForFineTuning } from './training.js';
