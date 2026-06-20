import type { ShiftPersona } from './types.js';

/**
 * buildSystemPrompt — combines persona definition with optional memory and
 * knowledge context into a single system prompt string ready for Anthropic.
 */
export function buildSystemPrompt(
  persona: ShiftPersona,
  memoryBlock: string = '',
  knowledgeBlock: string = '',
): string {
  return [persona.systemPrompt, memoryBlock, knowledgeBlock].filter(Boolean).join('\n\n');
}

/**
 * definePersona — helper to create a typed ShiftPersona. Products call this
 * once at boot to define their domain identity.
 */
export function definePersona(persona: ShiftPersona): ShiftPersona {
  return persona;
}
