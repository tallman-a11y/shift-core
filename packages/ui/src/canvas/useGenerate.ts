"use client";

import { useEffect, useRef, useState } from "react";
import { useInView } from "framer-motion";

export type GenPhase = "idle" | "skeleton" | "live";

export interface UseGenerateOptions {
  /** Delay before the skeleton appears (ms). Lets earlier cards generate first. */
  enterDelay?: number;
  /** How long the skeleton shimmer holds before content materializes (ms). */
  skeletonMs?: number;
  /** Trigger on scroll-into-view (default) or immediately on mount. */
  trigger?: "view" | "mount";
  /** IntersectionObserver margin when trigger = "view". */
  margin?: string;
  /** Re-run every time it enters view, instead of once. */
  repeat?: boolean;
}

/**
 * The core "generate-in" lifecycle every living card/section shares:
 *   idle (reserves layout) → skeleton (shimmer) → live (real content).
 *
 * This is what makes the whole product feel like it is building itself in
 * real time — the same heartbeat on the landing page and inside the app.
 */
export function useGenerate<T extends HTMLElement = HTMLDivElement>(opts: UseGenerateOptions = {}) {
  const {
    enterDelay = 0,
    skeletonMs = 420,
    trigger = "view",
    margin = "-60px 0px",
    repeat = false,
  } = opts;

  const ref = useRef<T>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inView = useInView(ref, { once: !repeat, margin } as any);
  const [phase, setPhase] = useState<GenPhase>("idle");

  useEffect(() => {
    const shouldRun = trigger === "mount" || inView;
    if (!shouldRun) return;
    if (!repeat && phase !== "idle") return;

    let live: ReturnType<typeof setTimeout>;
    const enter = setTimeout(() => {
      setPhase("skeleton");
      live = setTimeout(() => setPhase("live"), skeletonMs);
    }, enterDelay);

    return () => {
      clearTimeout(enter);
      clearTimeout(live);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView, trigger]);

  return { ref, phase, isLive: phase === "live" };
}
