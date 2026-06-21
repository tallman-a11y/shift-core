"use client";

import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  useMotionTemplate,
} from "framer-motion";
import { useGenerate, type GenPhase } from "./useGenerate";
import { ACCENT_RGB, type Accent } from "./accents";

export interface LiveCardProps {
  children: React.ReactNode;
  /** Accent color driving shine + top line + glow. Default "neutral" (uses --shift-accent if "brand"). */
  accent?: Accent | "brand";
  /** Enable 3D tilt-on-hover physics. Default true. */
  tilt?: boolean;
  /** Enable holographic cursor shine. Default true. */
  shine?: boolean;
  /** Generate-in lifecycle: skeleton → live. Default true. */
  generate?: boolean;
  /** Stagger order for generate-in (multiplied into enterDelay). */
  index?: number;
  /** Trigger generation on scroll-into-view or immediately. */
  trigger?: "view" | "mount";
  /** Number of shimmer rows in the skeleton phase. */
  skeletonRows?: number;
  /** Lit top accent line when card completes. Default true. */
  topLine?: boolean;
  /** Extra classes on the card surface. */
  className?: string;
  /** Min height to reserve while idle (prevents layout shift). */
  minHeight?: number;
  onClick?: () => void;
}

// "brand" resolves to the product's --shift-accent via CSS; everything else is
// a fixed decorative rgb. We keep a CSS-var fallback path for "brand".
function resolveRgb(accent: Accent | "brand"): { rgb: string; isBrand: boolean } {
  if (accent === "brand") return { rgb: "var(--shift-accent-rgb, 91,140,255)", isBrand: true };
  return { rgb: ACCENT_RGB[accent], isBrand: false };
}

// Deterministic skeleton widths — no Math.random (avoids hydration mismatch)
const SKEL_WIDTHS = [72, 88, 60, 80, 66, 78, 54, 84];

function Skeleton({ rows, minHeight }: { rows: number; minHeight: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="ash-surface relative rounded-2xl border border-white/[0.07] p-5 overflow-hidden"
      style={{ minHeight }}
    >
      <div className="h-5 w-28 rounded-full bg-white/[0.07] animate-pulse mb-5" />
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 mb-3">
          <div className="w-7 h-7 rounded-xl bg-white/5 animate-pulse shrink-0" />
          <div
            className="h-2.5 rounded-full bg-white/5 animate-pulse"
            style={{ width: `${SKEL_WIDTHS[i % SKEL_WIDTHS.length]}%` }}
          />
        </div>
      ))}
      {/* Shimmer sweep */}
      <motion.div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)" }}
        animate={{ x: ["-100%", "200%"] }}
        transition={{ duration: 1.25, ease: "easeInOut", repeat: Infinity }}
      />
    </motion.div>
  );
}

/**
 * LiveCard — the universal living surface.
 *
 * Combines: glass depth, 3D tilt physics, holographic cursor shine, and the
 * generate-in lifecycle (skeleton → live). Wrap any content in this and it
 * becomes part of the breathing, self-assembling UI. Surface is brand-neutral
 * (`.ash-surface`, driven by --shift-* tokens); accent is decorative or "brand".
 */
export function LiveCard({
  children,
  accent = "neutral",
  tilt = true,
  shine = true,
  generate = true,
  index = 0,
  trigger = "view",
  skeletonRows = 4,
  topLine = true,
  className = "",
  minHeight = 180,
  onClick,
}: LiveCardProps) {
  const { rgb } = resolveRgb(accent);

  const { ref, phase } = useGenerate<HTMLDivElement>({
    enterDelay: generate ? index * 75 : 0,
    trigger,
  });

  const effectivePhase: GenPhase = generate ? phase : "live";

  // ── tilt + shine physics ──────────────────────────────────────────────────
  const mx = useMotionValue(0.5);
  const my = useMotionValue(0.5);
  const rawRY = useTransform(mx, [0, 1], [-7, 7]);
  const rawRX = useTransform(my, [0, 1], [4, -4]);
  const rotateY = useSpring(rawRY, { stiffness: 300, damping: 28 });
  const rotateX = useSpring(rawRX, { stiffness: 300, damping: 28 });
  const shineX = useMotionValue(50);
  const shineY = useMotionValue(50);
  const shineBg = useMotionTemplate`radial-gradient(circle at ${shineX}% ${shineY}%, rgba(${rgb},0.10) 0%, rgba(${rgb},0.035) 42%, transparent 66%)`;

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    if (!tilt && !shine) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    mx.set(nx); my.set(ny);
    shineX.set(nx * 100); shineY.set(ny * 100);
  }
  function onMouseLeave() {
    mx.set(0.5); my.set(0.5); shineX.set(50); shineY.set(50);
  }

  // ── idle: reserve layout silently ─────────────────────────────────────────
  if (effectivePhase === "idle") {
    return <div ref={ref} className={`rounded-2xl border border-white/[0.04] ${className}`} style={{ minHeight }} />;
  }

  // ── skeleton ──────────────────────────────────────────────────────────────
  if (effectivePhase === "skeleton") {
    return <div ref={ref} className={className}><Skeleton rows={skeletonRows} minHeight={minHeight} /></div>;
  }

  // ── live ──────────────────────────────────────────────────────────────────
  return (
    <div
      ref={ref}
      style={{ perspective: tilt ? "1000px" : undefined }}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      className={className}
    >
      <motion.div
        style={{
          rotateX: tilt ? rotateX : undefined,
          rotateY: tilt ? rotateY : undefined,
          background: shine ? shineBg : undefined,
          transformStyle: tilt ? "preserve-3d" : undefined,
        }}
        initial={generate ? { opacity: 0, y: 12 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        whileHover={tilt ? { scale: 1.012, y: -3 } : undefined}
        onClick={onClick}
        className={`ash-surface group relative rounded-2xl border border-white/[0.08] p-5 overflow-hidden transition-colors duration-300 ${onClick ? "cursor-pointer" : ""}`}
      >
        {/* Top accent line — lights up as the card "completes" */}
        {topLine && (
          <motion.div
            className="absolute top-0 left-0 right-0 h-px"
            style={{ background: `linear-gradient(90deg, transparent, rgba(${rgb},0.9), transparent)`, transformOrigin: "left" }}
            initial={{ scaleX: 0, opacity: 0 }}
            animate={{ scaleX: 1, opacity: 0.7 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        )}

        {children}

        {/* Corner glow on hover */}
        <div
          className="absolute bottom-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
          style={{ background: `rgba(${rgb},0.18)` }}
        />
      </motion.div>
    </div>
  );
}

export default LiveCard;
