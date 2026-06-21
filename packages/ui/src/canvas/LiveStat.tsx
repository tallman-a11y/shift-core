"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { ACCENT_RGB, type Accent } from "./accents";

export interface LiveStatProps {
  label: string;
  /** Numeric value to count up to. Omit for string-only display. */
  value?: number;
  /** Pre-formatted string (overrides count-up). */
  display?: string;
  prefix?: string;
  suffix?: string;
  sub?: string;
  icon?: LucideIcon;
  /** Decorative accent, or "brand" to use --shift-accent-rgb. */
  accent?: Accent | "brand";
  /** Count-up duration ms. */
  duration?: number;
  index?: number;
}

function rgbFor(accent: Accent | "brand"): string {
  if (accent === "brand") return "var(--shift-accent-rgb, 91,140,255)";
  return ACCENT_RGB[accent];
}

function formatCompact(n: number, prefix: string, suffix: string) {
  let body: string;
  if (Math.abs(n) >= 1_000_000) body = `${(n / 1_000_000).toFixed(1)}M`;
  else if (Math.abs(n) >= 1_000) body = `${(n / 1_000).toFixed(0)}K`;
  else body = n.toLocaleString();
  return `${prefix}${body}${suffix}`;
}

/**
 * LiveStat — a metric tile that counts up on mount with a glass surface and
 * accent top line. The atomic unit of every dashboard / overview header.
 */
export function LiveStat({
  label, value, display, prefix = "", suffix = "", sub, icon: Icon,
  accent = "neutral", duration = 1200, index = 0,
}: LiveStatProps) {
  const rgb = rgbFor(accent);
  const [n, setN] = useState(0);
  const raf = useRef<number>(0);

  useEffect(() => {
    if (value == null || display != null) return;
    const start = performance.now();
    const step = (now: number) => {
      const pct = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - pct, 3);
      setN(value * eased);
      if (pct < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value, display, duration]);

  const shown = display ?? (value != null ? formatCompact(n, prefix, suffix) : "—");

  return (
    <motion.div
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: "spring", stiffness: 280, damping: 26, delay: index * 0.06 }}
      className="ash-surface relative rounded-2xl border border-white/[0.08] p-4 overflow-hidden"
    >
      <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `rgba(${rgb},0.6)` }} />
      {Icon && (
        <div className="w-8 h-8 rounded-xl flex items-center justify-center mb-3" style={{ background: `rgba(${rgb},0.15)` }}>
          <Icon size={14} style={{ color: `rgb(${rgb})` }} />
        </div>
      )}
      <div className="text-2xl font-black mb-1" style={{ color: `rgb(${rgb})`, filter: `drop-shadow(0 0 10px rgba(${rgb},0.45))` }}>
        {shown}
      </div>
      <div className="text-[11px] font-bold text-white/70">{label}</div>
      {sub && <div className="text-[10px] text-white/30 mt-0.5">{sub}</div>}
    </motion.div>
  );
}

export default LiveStat;
