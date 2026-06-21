"use client";

import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";

/**
 * CanvasTransition — the heart of the "one living canvas" model.
 *
 * The app is not N pages you travel between. It is a single stage. Every
 * route's content is *generated onto the canvas* — the previous view fades
 * out and the requested view assembles itself in real time. The underlying
 * Next.js routes remain as the behind-the-scenes resources the canvas draws
 * from; this wrapper turns each navigation into a generation event.
 *
 * First visit to a view per login session = full generate-in (blur→lift,
 * "Shift is assembling" sheen). Revisits in the same session are instant, so
 * power users aren't slowed down. The seen-set resets on each login, so every
 * session opens with that real-time-building feel.
 *
 * Brand-neutral: the assembling indicator uses the product's --shift-accent.
 */

export interface CanvasTransitionProps {
  children: React.ReactNode;
  /** Map of first-path-segment → friendly label for the assembling pill. */
  labels?: Record<string, string>;
  /** sessionStorage key for the per-login seen-set. Default "ash-seen-views". */
  seenKey?: string;
  /** Product name shown in the pill, e.g. "Shift is assembling …". Default "Shift". */
  assemblerName?: string;
}

export function CanvasTransition({
  children,
  labels = {},
  seenKey = "ash-seen-views",
  assemblerName = "Shift",
}: CanvasTransitionProps) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [showSheen, setShowSheen] = useState(false);

  // Module-scoped seen-set kept in component state refs via sessionStorage.
  const [seen] = useState<Set<string>>(() => new Set<string>());

  function viewLabel(path: string): string {
    const seg = path.split("/").filter(Boolean);
    // Prefer the deepest known segment, else the first, else "dashboard".
    const key = seg.find((s) => labels[s]) ?? seg[0] ?? "dashboard";
    return labels[key] ?? key.replace(/-/g, " ");
  }

  // Client-only flag so the very first paint matches SSR (no hydration diff).
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(seenKey);
      if (raw) (JSON.parse(raw) as string[]).forEach((p) => seen.add(p));
    } catch {
      /* ignore */
    }
    setMounted(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const firstVisit = mounted && !seen.has(pathname);

  useEffect(() => {
    if (!mounted) return;
    const wasFirst = !seen.has(pathname);
    seen.add(pathname);
    try {
      sessionStorage.setItem(seenKey, JSON.stringify([...seen]));
    } catch {
      /* ignore */
    }
    if (wasFirst) {
      setShowSheen(true);
      const t = setTimeout(() => setShowSheen(false), 900);
      return () => clearTimeout(t);
    }
    setShowSheen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, mounted]);

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={firstVisit ? { opacity: 0, y: 14, filter: "blur(7px)" } : { opacity: 0 }}
        animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, filter: "blur(4px)", transition: { duration: 0.16 } }}
        transition={
          firstVisit
            ? { type: "spring", stiffness: 240, damping: 28 }
            : { duration: 0.16, ease: "easeOut" }
        }
        className="relative min-h-full"
      >
        {/* Assembling indicator — only on first generation of a view this session */}
        <AnimatePresence>
          {showSheen && (
            <>
              {/* Top sweep */}
              <motion.div
                initial={{ scaleX: 0, opacity: 0.8 }}
                animate={{ scaleX: 1, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                style={{
                  transformOrigin: "left",
                  background: "linear-gradient(90deg, transparent, var(--shift-accent), transparent)",
                }}
                className="pointer-events-none fixed top-0 left-0 right-0 h-0.5 z-[60]"
              />
              {/* Assembling pill */}
              <motion.div
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.25 }}
                style={{
                  borderColor: "color-mix(in srgb, var(--shift-accent) 25%, transparent)",
                  boxShadow: "0 0 24px color-mix(in srgb, var(--shift-accent) 18%, transparent)",
                }}
                className="ash-surface pointer-events-none fixed top-3 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-1.5 rounded-full border px-3 py-1"
              >
                <Sparkles size={10} style={{ color: "var(--shift-accent)" }} className="animate-pulse" />
                <span className="text-[10px] font-bold" style={{ color: "var(--shift-accent)" }}>
                  {assemblerName} is assembling {viewLabel(pathname)}…
                </span>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {children}
      </motion.div>
    </AnimatePresence>
  );
}

export default CanvasTransition;
