export interface CrossProductEvent {
  id: string;
  sourceProduct: string;
  eventType: string;
  userId: string;
  payload: Record<string, unknown>;
  consumed: boolean;
  createdAt: string;
}

export interface CrossProductIdentity {
  globalUserId: string;
  productAccounts: Record<string, string>;
  consentedProducts: string[];
}

export interface ContextGraph {
  publish(event: Omit<CrossProductEvent, 'id' | 'createdAt' | 'consumed'>): Promise<string>;
  getPendingEvents(targetProduct: string, userId: string): Promise<CrossProductEvent[]>;
  markConsumed(eventIds: string[]): Promise<void>;
  resolveIdentity(product: string, localUserId: string): Promise<CrossProductIdentity | null>;
  linkIdentity(globalUserId: string, product: string, localUserId: string, consentedProducts: string[]): Promise<void>;
}

export class NoOpContextGraph implements ContextGraph {
  async publish(): Promise<string> { return ''; }
  async getPendingEvents(): Promise<CrossProductEvent[]> { return []; }
  async markConsumed(): Promise<void> {}
  async resolveIdentity(): Promise<null> { return null; }
  async linkIdentity(): Promise<void> {}
}

export function formatCrossProductContextForPrompt(events: CrossProductEvent[]): string {
  if (events.length === 0) return '';
  return (
    `\n\n---\n## CROSS-PRODUCT CONTEXT\n` +
    `Intelligence from other Shift products this user is connected to:\n` +
    events.map(e => `- [${e.sourceProduct}/${e.eventType}] ${JSON.stringify(e.payload)}`).join('\n') +
    `\n\nUse this context naturally where relevant — don't announce its source unless asked.`
  );
}
