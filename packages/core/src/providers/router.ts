import type { ModelProvider, ProviderMessage, ProviderResponse, ProviderTool, ToolExecutor } from '../model.js';

export interface RouterConfig {
  /** Primary provider — serves all traffic unless overridden. */
  primary: ModelProvider;
  /**
   * Fallback provider — used when primary throws.
   * Lets you point primary at the Shift model and fallback at Anthropic.
   * Traffic silently falls back; no error reaches the user.
   */
  fallback?: ModelProvider;
  /**
   * Shadow provider — runs on every request alongside primary but its
   * response is discarded. Used to evaluate a new model before routing
   * real traffic to it. Failures are silently swallowed.
   */
  shadow?: ModelProvider;
  /**
   * Canary traffic split (0–100).
   * When set, this % of requests are routed to `canary` instead of `primary`.
   * Use this to ramp a fine-tuned Shift model from 5% → 25% → 100%.
   */
  canaryPercent?: number;
  canary?: ModelProvider;
  /** Called with routing decisions for observability. */
  onRoute?: (decision: RouteDecision) => void;
}

export interface RouteDecision {
  provider: string;
  reason: 'primary' | 'fallback' | 'canary' | 'shadow';
  shadowProvider?: string;
}

/**
 * RouterProvider — safely migrates Shift Brain from one model to another.
 *
 * Migration path to independence:
 *
 *   Phase 1 — Shadow: run Shift model silently alongside Anthropic.
 *     Collect output for eval without exposing users to it.
 *     new RouterProvider({ primary: anthropic, shadow: shiftModel })
 *
 *   Phase 2 — Canary: route 10% of real traffic to Shift model.
 *     Compare quality metrics. Increase as confidence grows.
 *     new RouterProvider({ primary: anthropic, canary: shiftModel, canaryPercent: 10 })
 *
 *   Phase 3 — Flip: Shift model is primary, Anthropic is fallback.
 *     Zero downtime, instant rollback if needed.
 *     new RouterProvider({ primary: shiftModel, fallback: anthropic })
 *
 *   Phase 4 — Independence: remove fallback. No external API. No per-token cost.
 *     new ShiftBrain({ provider: shiftModel })
 */
export class RouterProvider implements ModelProvider {
  readonly name: string;
  readonly modelId: string;

  constructor(private readonly config: RouterConfig) {
    this.name = `router(${config.primary.name})`;
    this.modelId = config.primary.modelId;
  }

  async complete(opts: {
    system: string;
    messages: ProviderMessage[];
    tools?: ProviderTool[];
    toolExecutor?: ToolExecutor;
    maxTokens?: number;
  }): Promise<ProviderResponse> {
    const { primary, fallback, shadow, canary, canaryPercent, onRoute } = this.config;

    // Determine which provider handles this request
    let activeProvider = primary;
    let reason: RouteDecision['reason'] = 'primary';

    if (canary && canaryPercent && canaryPercent > 0) {
      if (Math.random() * 100 < canaryPercent) {
        activeProvider = canary;
        reason = 'canary';
      }
    }

    onRoute?.({
      provider: activeProvider.name,
      reason,
      shadowProvider: shadow?.name,
    });

    // Run shadow provider in background (fire-and-forget)
    if (shadow && shadow !== activeProvider) {
      shadow.complete(opts).catch(() => {});
    }

    // Run primary (with fallback on error)
    try {
      return await activeProvider.complete(opts);
    } catch (err) {
      if (fallback && fallback !== activeProvider) {
        onRoute?.({ provider: fallback.name, reason: 'fallback' });
        return fallback.complete(opts);
      }
      throw err;
    }
  }

  async *stream(opts: {
    system: string;
    messages: ProviderMessage[];
    maxTokens?: number;
  }): AsyncIterable<string> {
    const { primary, fallback } = this.config;
    try {
      yield* primary.stream(opts);
    } catch {
      if (fallback) {
        yield* fallback.stream(opts);
      }
    }
  }
}
