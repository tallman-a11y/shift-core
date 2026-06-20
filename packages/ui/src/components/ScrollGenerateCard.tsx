"use client";

import React, { useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

type Phase = "idle" | "skeleton" | "live";

export interface ScrollGenerateCardProps {
  /**
   * The real card content. Rendered in the "live" phase.
   * Passed the current phase so content can animate itself in.
   */
  children: (phase: Phase) => React.ReactNode;
  /**
   * Milliseconds of skeleton phase before switching to live. Default 360.
   */
  skeletonDuration?: number;
  /**
   * Stagger delay in ms before the skeleton phase starts (for grid staggering). Default 0.
   */
  delay?: number;
  /**
   * IntersectionObserver margin. Default "-60px 0px".
   */
  margin?: string;
  className?: string;
  /** Skeleton placeholder rows to show. Default 4. */
  skeletonRows?: number;
  /** Widths (in %) of each skeleton row. Deterministic to avoid hydration mismatch. */
  skeletonWidths?: number[];
}

const DEFAULT_WIDTHS = [72, 85, 60, 80];

/**
 * Scroll-triggered three-phase card:
 *   idle (off-screen invisible) → skeleton (shimmer placeholder) → live (real content)
 *
 * Usage:
 * ```tsx
 * <ScrollGenerateCard delay={index * 80}>
 *   {(phase) => <MyCard className={phase === "live" ? "opacity-100" : "opacity-0"} />}
 * </ScrollGenerateCard>
 * ```
 */
export function ScrollGenerateCard({
  children,
  skeletonDuration = 360,
  delay = 0,
  margin = "-60px 0px",
  className,
  skeletonRows = 4,
  skeletonWidths = DEFAULT_WIDTHS,
}: ScrollGenerateCardProps) {
  const ref = React.useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const inView = useInView(ref, { once: true, margin } as any);
  const [phase, setPhase] = useState<Phase>("idle");

  useEffect(() => {
    if (!inView) return;
    const t1 = setTimeout(() => setPhase("skeleton"), delay);
    const t2 = setTimeout(() => setPhase("live"), delay + skeletonDuration);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [inView, delay, skeletonDuration]);

  const widths = skeletonWidths.slice(0, skeletonRows);

  return (
    <div ref={ref} className={className} style={{ position: "relative" }}>
      {/* Skeleton phase */}
      {phase === "skeleton" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: "inherit",
            padding: "1.5rem",
            display: "flex",
            flexDirection: "column",
            gap: "0.75rem",
            overflow: "hidden",
          }}
        >
          {/* Shimmer sweep */}
          <motion.div
            animate={{ x: ["-100%", "200%"] }}
            transition={{ duration: 1.1, repeat: Infinity, ease: "linear" }}
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)",
              pointerEvents: "none",
            }}
          />
          {widths.map((w, i) => (
            <div
              key={i}
              style={{
                height: "0.7rem",
                width: `${w}%`,
                borderRadius: "0.4rem",
                background: "rgba(255,255,255,0.08)",
                animation: "pulse 1.8s ease-in-out infinite",
                animationDelay: `${i * 120}ms`,
              }}
            />
          ))}
        </motion.div>
      )}

      {/* Live phase */}
      {phase === "live" && children(phase)}

      {/* Invisible size anchor in idle so layout doesn't shift */}
      {phase === "idle" && (
        <div style={{ visibility: "hidden" }}>{children("idle")}</div>
      )}
    </div>
  );
}
