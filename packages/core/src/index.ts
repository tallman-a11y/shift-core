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
