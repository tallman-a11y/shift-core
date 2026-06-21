"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, X, Search, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ACCENT_RGB, type Accent } from "./accents";

export interface LauncherItem {
  href: string;
  label: string;
  icon: LucideIcon;
  desc: string;
}
export interface LauncherGroup {
  label: string;
  accent: Accent;
  items: LauncherItem[];
}

export interface CanvasLauncherProps {
  /** Every resource the canvas can draw from, grouped + color-coded. */
  groups: LauncherGroup[];
  /** Header title. */
  title?: string;
  /** Header subtitle. */
  subtitle?: string;
  /** Trigger button label (hidden under lg). */
  buttonLabel?: string;
  /** Keyboard shortcut letter (with ⌘/Ctrl). Default "j". */
  hotkey?: string;
  /** Window event name that also opens the launcher. Default "shift:open-launcher". */
  openEvent?: string;
  /** Override navigation. Default router.push. */
  onNavigate?: (href: string) => void;
}

/**
 * CanvasLauncher — the single menu button for the whole OS.
 *
 * Opens a full-screen generative grid of every resource the canvas can draw
 * from. Selecting one doesn't take you to a page — it routes, and
 * CanvasTransition brings that view to the canvas, assembling it live. The
 * launcher is how you "see all the background pages" without ever leaving the
 * one stage.
 */
export function CanvasLauncher({
  groups,
  title = "Everything Shift can build",
  subtitle = "Pick a resource — I'll bring it to the canvas",
  buttonLabel = "Everything",
  hotkey = "j",
  openEvent = "shift:open-launcher",
  onNavigate,
}: CanvasLauncherProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === hotkey) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hotkey]);

  useEffect(() => {
    function onOpen() { setOpen(true); }
    window.addEventListener(openEvent, onOpen);
    return () => window.removeEventListener(openEvent, onOpen);
  }, [openEvent]);

  const filtered = useMemo(() => {
    if (!query.trim()) return groups;
    const q = query.toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        items: g.items.filter((i) => i.label.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q)),
      }))
      .filter((g) => g.items.length > 0);
  }, [query, groups]);

  function go(href: string) {
    setOpen(false);
    setQuery("");
    if (href === pathname) return;
    if (onNavigate) onNavigate(href);
    else router.push(href);
  }

  let flatIndex = 0;

  return (
    <>
      {/* The one menu button */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open menu"
        title={`Everything (⌘${hotkey.toUpperCase()})`}
        style={{ borderColor: "color-mix(in srgb, var(--shift-accent) 20%, transparent)", color: "var(--shift-accent)" }}
        className="ash-surface flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all hover:brightness-110"
      >
        <LayoutGrid size={15} />
        <span className="hidden lg:inline text-xs font-bold">{buttonLabel}</span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[8000] flex flex-col"
            style={{ background: "rgba(2,4,10,0.86)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
            onClick={() => setOpen(false)}
          >
            {/* Header */}
            <div className="shrink-0 px-6 pt-6 pb-4" onClick={(e) => e.stopPropagation()}>
              <div className="max-w-6xl mx-auto">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center"
                      style={{ background: "linear-gradient(135deg, var(--shift-accent), var(--shift-accent-2))", boxShadow: "0 0 14px color-mix(in srgb, var(--shift-accent) 50%, transparent)" }}
                    >
                      <Sparkles size={13} className="text-white" />
                    </div>
                    <div>
                      <div className="text-sm font-black text-white leading-none">{title}</div>
                      <div className="text-[11px] text-white/40 mt-1">{subtitle}</div>
                    </div>
                  </div>
                  <button type="button" onClick={() => setOpen(false)} className="w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] transition-all">
                    <X size={16} />
                  </button>
                </div>
                {/* Search */}
                <div className="ash-surface flex items-center gap-2.5 rounded-2xl border border-white/10 px-4 py-3">
                  <Search size={15} className="text-white/30" />
                  <input
                    autoFocus
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search resources…"
                    className="flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
                  />
                  <kbd className="text-[10px] text-white/25 border border-white/10 rounded px-1.5 py-0.5">esc</kbd>
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-6 pb-10" onClick={(e) => e.stopPropagation()}>
              <div className="max-w-6xl mx-auto flex flex-col gap-7">
                {filtered.map((group) => {
                  const rgb = ACCENT_RGB[group.accent];
                  return (
                    <div key={group.label}>
                      <div className="flex items-center gap-1.5 mb-3" style={{ color: `rgb(${rgb})` }}>
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: `rgb(${rgb})` }} />
                        <span className="text-[11px] font-black uppercase tracking-widest">{group.label}</span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                        {group.items.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href;
                          const idx = flatIndex++;
                          return (
                            <motion.button
                              key={item.href}
                              type="button"
                              onClick={() => go(item.href)}
                              initial={{ opacity: 0, y: 14, filter: "blur(5px)" }}
                              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                              transition={{ duration: 0.28, delay: Math.min(idx * 0.018, 0.5), ease: "easeOut" }}
                              whileHover={{ y: -3, scale: 1.015 }}
                              style={isActive ? { borderColor: `rgba(${rgb},0.4)` } : undefined}
                              className={`ash-surface group relative text-left rounded-2xl border p-4 overflow-hidden transition-colors ${
                                isActive ? "" : "border-white/[0.08] hover:border-white/[0.15]"
                              }`}
                            >
                              <div className="absolute top-0 left-0 right-0 h-px opacity-60" style={{ background: `rgba(${rgb},0.7)` }} />
                              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-3" style={{ background: `rgba(${rgb},0.12)` }}>
                                <Icon size={16} style={{ color: `rgb(${rgb})` }} />
                              </div>
                              <div className="text-sm font-bold text-white mb-0.5">{item.label}</div>
                              <div className="text-[11px] text-white/40 leading-snug">{item.desc}</div>
                              {isActive && (
                                <span className="absolute top-3 right-3 text-[9px] font-bold" style={{ color: `rgb(${rgb})` }}>on canvas</span>
                              )}
                              <div className="absolute bottom-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" style={{ background: `rgba(${rgb},0.18)` }} />
                            </motion.button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                {filtered.length === 0 && (
                  <div className="text-center text-white/30 text-sm py-20">No resources match &ldquo;{query}&rdquo;</div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default CanvasLauncher;
