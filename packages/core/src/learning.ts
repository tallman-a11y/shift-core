import type { EmbeddingProvider } from './types.js';

export type FeedbackSignal = 'accept' | 'edit' | 'reject';

export interface FeedbackEntry {
  id?: string;
  userId: string;
  messageId?: string;
  signal: FeedbackSignal;
  originalText: string;
  editedText?: string;
  userMessage?: string;
  domain?: string;
  metadata?: Record<string, unknown>;
  createdAt?: string;
}

export interface OutcomeRecord {
  id?: string;
  userId: string;
  predictionType: string;
  predictionId: string;
  predictedValue: unknown;
  actualValue?: unknown;
  resolvedAt?: string;
  domain?: string;
}

export interface UserPreferences {
  responseStyle: 'concise' | 'detailed' | 'standard';
  acceptanceRate: number;
  topAcceptedDomains: string[];
  avoidNotes: string[];
  customInstructions: string;
}

export interface LearningStore {
  recordFeedback(entry: FeedbackEntry): Promise<string | null>;
  recordOutcome(record: OutcomeRecord): Promise<void>;
  getPreferences(userId: string, domain?: string): Promise<UserPreferences | null>;
}

export function formatPreferencesForPrompt(prefs: UserPreferences, domain?: string): string {
  const lines: string[] = [];
  if (prefs.responseStyle !== 'standard') {
    lines.push(`- Prefers ${prefs.responseStyle} responses (learned from edit history)`);
  }
  if (prefs.acceptanceRate < 0.4) {
    lines.push(`- Low acceptance rate (${Math.round(prefs.acceptanceRate * 100)}%) — be more specific and actionable`);
  }
  if (prefs.avoidNotes.length > 0) {
    lines.push(`- Avoid: ${prefs.avoidNotes.join('; ')}`);
  }
  if (prefs.customInstructions) {
    lines.push(`- ${prefs.customInstructions}`);
  }
  if (lines.length === 0) return '';
  return (
    `\n\n---\n## LEARNED PREFERENCES\n` +
    `Based on this user's feedback history${domain ? ` in ${domain}` : ''}:\n` +
    lines.join('\n')
  );
}
