"use client";

// src/components/ShiftCard.tsx
import { motion } from "framer-motion";
import { jsx } from "react/jsx-runtime";
function ShiftCard({ children, className = "", blur = 12, style, ...props }) {
  return /* @__PURE__ */ jsx(
    motion.div,
    {
      className: `shift-card ${className}`,
      style: {
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        ...style
      },
      ...props,
      children
    }
  );
}

// src/components/TiltCard.tsx
import { useRef } from "react";
import {
  motion as motion2,
  useMotionValue,
  useTransform,
  useSpring
} from "framer-motion";
import { jsx as jsx2 } from "react/jsx-runtime";
function TiltCard({
  children,
  stiffness = 300,
  damping = 28,
  maxRotateX = 4,
  maxRotateY = 7,
  style,
  ...rest
}) {
  const ref = useRef(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const rotateY = useSpring(useTransform(rawX, [-1, 1], [-maxRotateY, maxRotateY]), {
    stiffness,
    damping
  });
  const rotateX = useSpring(useTransform(rawY, [-1, 1], [maxRotateX, -maxRotateX]), {
    stiffness,
    damping
  });
  function onMouseMove(e) {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    rawX.set(((e.clientX - rect.left) / rect.width - 0.5) * 2);
    rawY.set(((e.clientY - rect.top) / rect.height - 0.5) * 2);
  }
  function onMouseLeave() {
    rawX.set(0);
    rawY.set(0);
  }
  return /* @__PURE__ */ jsx2(
    motion2.div,
    {
      ref,
      onMouseMove,
      onMouseLeave,
      style: { perspective: 900, rotateX, rotateY, ...style },
      ...rest,
      children
    }
  );
}

// src/components/HolographicShine.tsx
import { useRef as useRef2 } from "react";
import {
  motion as motion3,
  useMotionTemplate,
  useMotionValue as useMotionValue2,
  useSpring as useSpring2
} from "framer-motion";
import { jsx as jsx3, jsxs } from "react/jsx-runtime";
function HolographicShine({
  rgb = "255,255,255",
  intensity = 0.18,
  children,
  className,
  style
}) {
  const ref = useRef2(null);
  const mouseX = useMotionValue2(0);
  const mouseY = useMotionValue2(0);
  const springX = useSpring2(mouseX, { stiffness: 260, damping: 26 });
  const springY = useSpring2(mouseY, { stiffness: 260, damping: 26 });
  const background = useMotionTemplate`radial-gradient(260px circle at ${springX}px ${springY}px, rgba(${rgb},${intensity}), transparent 70%)`;
  function onMouseMove(e) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }
  return /* @__PURE__ */ jsxs(
    "div",
    {
      ref,
      onMouseMove,
      className,
      style: { position: "relative", ...style },
      children: [
        children,
        /* @__PURE__ */ jsx3(
          motion3.div,
          {
            style: {
              position: "absolute",
              inset: 0,
              borderRadius: "inherit",
              background,
              pointerEvents: "none"
            }
          }
        )
      ]
    }
  );
}

// src/components/ScrollGenerateCard.tsx
import React3, { useEffect, useState } from "react";
import { motion as motion4, useInView } from "framer-motion";
import { jsx as jsx4, jsxs as jsxs2 } from "react/jsx-runtime";
var DEFAULT_WIDTHS = [72, 85, 60, 80];
function ScrollGenerateCard({
  children,
  skeletonDuration = 360,
  delay = 0,
  margin = "-60px 0px",
  className,
  skeletonRows = 4,
  skeletonWidths = DEFAULT_WIDTHS
}) {
  const ref = React3.useRef(null);
  const inView = useInView(ref, { once: true, margin });
  const [phase, setPhase] = useState("idle");
  useEffect(() => {
    if (!inView) return;
    const t1 = setTimeout(() => setPhase("skeleton"), delay);
    const t2 = setTimeout(() => setPhase("live"), delay + skeletonDuration);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [inView, delay, skeletonDuration]);
  const widths = skeletonWidths.slice(0, skeletonRows);
  return /* @__PURE__ */ jsxs2("div", { ref, className, style: { position: "relative" }, children: [
    phase === "skeleton" && /* @__PURE__ */ jsxs2(
      motion4.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        style: {
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          padding: "1.5rem",
          display: "flex",
          flexDirection: "column",
          gap: "0.75rem",
          overflow: "hidden"
        },
        children: [
          /* @__PURE__ */ jsx4(
            motion4.div,
            {
              animate: { x: ["-100%", "200%"] },
              transition: { duration: 1.1, repeat: Infinity, ease: "linear" },
              style: {
                position: "absolute",
                inset: 0,
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 50%, transparent 100%)",
                pointerEvents: "none"
              }
            }
          ),
          widths.map((w, i) => /* @__PURE__ */ jsx4(
            "div",
            {
              style: {
                height: "0.7rem",
                width: `${w}%`,
                borderRadius: "0.4rem",
                background: "rgba(255,255,255,0.08)",
                animation: "pulse 1.8s ease-in-out infinite",
                animationDelay: `${i * 120}ms`
              }
            },
            i
          ))
        ]
      }
    ),
    phase === "live" && children(phase),
    phase === "idle" && /* @__PURE__ */ jsx4("div", { style: { visibility: "hidden" }, children: children("idle") })
  ] });
}

// src/canvas/LiveCard.tsx
import {
  motion as motion5,
  useMotionValue as useMotionValue3,
  useTransform as useTransform2,
  useSpring as useSpring3,
  useMotionTemplate as useMotionTemplate2
} from "framer-motion";

// src/canvas/useGenerate.ts
import { useEffect as useEffect2, useRef as useRef3, useState as useState2 } from "react";
import { useInView as useInView2 } from "framer-motion";
function useGenerate(opts = {}) {
  const {
    enterDelay = 0,
    skeletonMs = 420,
    trigger = "view",
    margin = "-60px 0px",
    repeat = false
  } = opts;
  const ref = useRef3(null);
  const inView = useInView2(ref, { once: !repeat, margin });
  const [phase, setPhase] = useState2("idle");
  useEffect2(() => {
    const shouldRun = trigger === "mount" || inView;
    if (!shouldRun) return;
    if (!repeat && phase !== "idle") return;
    let live;
    const enter = setTimeout(() => {
      setPhase("skeleton");
      live = setTimeout(() => setPhase("live"), skeletonMs);
    }, enterDelay);
    return () => {
      clearTimeout(enter);
      clearTimeout(live);
    };
  }, [inView, trigger]);
  return { ref, phase, isLive: phase === "live" };
}

// src/canvas/accents.ts
var ACCENT_RGB = {
  teal: "0,229,240",
  blue: "59,139,255",
  purple: "168,124,255",
  magenta: "232,48,248",
  green: "0,224,128",
  orange: "255,110,48",
  neutral: "255,255,255"
};

// src/canvas/LiveCard.tsx
import { jsx as jsx5, jsxs as jsxs3 } from "react/jsx-runtime";
function resolveRgb(accent) {
  if (accent === "brand") return { rgb: "var(--shift-accent-rgb, 91,140,255)", isBrand: true };
  return { rgb: ACCENT_RGB[accent], isBrand: false };
}
var SKEL_WIDTHS = [72, 88, 60, 80, 66, 78, 54, 84];
function Skeleton({ rows, minHeight }) {
  return /* @__PURE__ */ jsxs3(
    motion5.div,
    {
      initial: { opacity: 0, y: 16 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 },
      className: "ash-surface relative rounded-2xl border border-white/[0.07] p-5 overflow-hidden",
      style: { minHeight },
      children: [
        /* @__PURE__ */ jsx5("div", { className: "h-5 w-28 rounded-full bg-white/[0.07] animate-pulse mb-5" }),
        Array.from({ length: rows }).map((_, i) => /* @__PURE__ */ jsxs3("div", { className: "flex items-center gap-3 mb-3", children: [
          /* @__PURE__ */ jsx5("div", { className: "w-7 h-7 rounded-xl bg-white/5 animate-pulse shrink-0" }),
          /* @__PURE__ */ jsx5(
            "div",
            {
              className: "h-2.5 rounded-full bg-white/5 animate-pulse",
              style: { width: `${SKEL_WIDTHS[i % SKEL_WIDTHS.length]}%` }
            }
          )
        ] }, i)),
        /* @__PURE__ */ jsx5(
          motion5.div,
          {
            className: "absolute inset-0 pointer-events-none",
            style: { background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.05) 50%, transparent 100%)" },
            animate: { x: ["-100%", "200%"] },
            transition: { duration: 1.25, ease: "easeInOut", repeat: Infinity }
          }
        )
      ]
    }
  );
}
function LiveCard({
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
  onClick
}) {
  const { rgb } = resolveRgb(accent);
  const { ref, phase } = useGenerate({
    enterDelay: generate ? index * 75 : 0,
    trigger
  });
  const effectivePhase = generate ? phase : "live";
  const mx = useMotionValue3(0.5);
  const my = useMotionValue3(0.5);
  const rawRY = useTransform2(mx, [0, 1], [-7, 7]);
  const rawRX = useTransform2(my, [0, 1], [4, -4]);
  const rotateY = useSpring3(rawRY, { stiffness: 300, damping: 28 });
  const rotateX = useSpring3(rawRX, { stiffness: 300, damping: 28 });
  const shineX = useMotionValue3(50);
  const shineY = useMotionValue3(50);
  const shineBg = useMotionTemplate2`radial-gradient(circle at ${shineX}% ${shineY}%, rgba(${rgb},0.10) 0%, rgba(${rgb},0.035) 42%, transparent 66%)`;
  function onMouseMove(e) {
    if (!tilt && !shine) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = (e.clientX - rect.left) / rect.width;
    const ny = (e.clientY - rect.top) / rect.height;
    mx.set(nx);
    my.set(ny);
    shineX.set(nx * 100);
    shineY.set(ny * 100);
  }
  function onMouseLeave() {
    mx.set(0.5);
    my.set(0.5);
    shineX.set(50);
    shineY.set(50);
  }
  if (effectivePhase === "idle") {
    return /* @__PURE__ */ jsx5("div", { ref, className: `rounded-2xl border border-white/[0.04] ${className}`, style: { minHeight } });
  }
  if (effectivePhase === "skeleton") {
    return /* @__PURE__ */ jsx5("div", { ref, className, children: /* @__PURE__ */ jsx5(Skeleton, { rows: skeletonRows, minHeight }) });
  }
  return /* @__PURE__ */ jsx5(
    "div",
    {
      ref,
      style: { perspective: tilt ? "1000px" : void 0 },
      onMouseMove,
      onMouseLeave,
      className,
      children: /* @__PURE__ */ jsxs3(
        motion5.div,
        {
          style: {
            rotateX: tilt ? rotateX : void 0,
            rotateY: tilt ? rotateY : void 0,
            background: shine ? shineBg : void 0,
            transformStyle: tilt ? "preserve-3d" : void 0
          },
          initial: generate ? { opacity: 0, y: 12 } : false,
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.3 },
          whileHover: tilt ? { scale: 1.012, y: -3 } : void 0,
          onClick,
          className: `ash-surface group relative rounded-2xl border border-white/[0.08] p-5 overflow-hidden transition-colors duration-300 ${onClick ? "cursor-pointer" : ""}`,
          children: [
            topLine && /* @__PURE__ */ jsx5(
              motion5.div,
              {
                className: "absolute top-0 left-0 right-0 h-px",
                style: { background: `linear-gradient(90deg, transparent, rgba(${rgb},0.9), transparent)`, transformOrigin: "left" },
                initial: { scaleX: 0, opacity: 0 },
                animate: { scaleX: 1, opacity: 0.7 },
                transition: { duration: 0.5, ease: "easeOut" }
              }
            ),
            children,
            /* @__PURE__ */ jsx5(
              "div",
              {
                className: "absolute bottom-0 right-0 w-32 h-32 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none",
                style: { background: `rgba(${rgb},0.18)` }
              }
            )
          ]
        }
      )
    }
  );
}

// src/canvas/GenerativeView.tsx
import { Children, isValidElement } from "react";
import { motion as motion6 } from "framer-motion";
import { jsx as jsx6 } from "react/jsx-runtime";
function GenerativeView({
  children,
  stagger = 0.08,
  delay = 0,
  className = ""
}) {
  const items = Children.toArray(children);
  return /* @__PURE__ */ jsx6(
    motion6.div,
    {
      className,
      initial: "hidden",
      animate: "show",
      variants: {
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } }
      },
      children: items.map(
        (child, i) => isValidElement(child) ? /* @__PURE__ */ jsx6(
          motion6.div,
          {
            variants: {
              hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
              show: {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                transition: { type: "spring", stiffness: 260, damping: 28 }
              }
            },
            children: child
          },
          child.key ?? i
        ) : child
      )
    }
  );
}

// src/canvas/LiveStat.tsx
import { useEffect as useEffect3, useRef as useRef4, useState as useState3 } from "react";
import { motion as motion7 } from "framer-motion";
import { jsx as jsx7, jsxs as jsxs4 } from "react/jsx-runtime";
function rgbFor(accent) {
  if (accent === "brand") return "var(--shift-accent-rgb, 91,140,255)";
  return ACCENT_RGB[accent];
}
function formatCompact(n, prefix, suffix) {
  let body;
  if (Math.abs(n) >= 1e6) body = `${(n / 1e6).toFixed(1)}M`;
  else if (Math.abs(n) >= 1e3) body = `${(n / 1e3).toFixed(0)}K`;
  else body = n.toLocaleString();
  return `${prefix}${body}${suffix}`;
}
function LiveStat({
  label,
  value,
  display,
  prefix = "",
  suffix = "",
  sub,
  icon: Icon,
  accent = "neutral",
  duration = 1200,
  index = 0
}) {
  const rgb = rgbFor(accent);
  const [n, setN] = useState3(0);
  const raf = useRef4(0);
  useEffect3(() => {
    if (value == null || display != null) return;
    const start = performance.now();
    const step = (now) => {
      const pct = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - pct, 3);
      setN(value * eased);
      if (pct < 1) raf.current = requestAnimationFrame(step);
    };
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value, display, duration]);
  const shown = display ?? (value != null ? formatCompact(n, prefix, suffix) : "\u2014");
  return /* @__PURE__ */ jsxs4(
    motion7.div,
    {
      initial: { opacity: 0, y: 16, scale: 0.96 },
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: { type: "spring", stiffness: 280, damping: 26, delay: index * 0.06 },
      className: "ash-surface relative rounded-2xl border border-white/[0.08] p-4 overflow-hidden",
      children: [
        /* @__PURE__ */ jsx7("div", { className: "absolute top-0 left-0 right-0 h-px", style: { background: `rgba(${rgb},0.6)` } }),
        Icon && /* @__PURE__ */ jsx7("div", { className: "w-8 h-8 rounded-xl flex items-center justify-center mb-3", style: { background: `rgba(${rgb},0.15)` }, children: /* @__PURE__ */ jsx7(Icon, { size: 14, style: { color: `rgb(${rgb})` } }) }),
        /* @__PURE__ */ jsx7("div", { className: "text-2xl font-black mb-1", style: { color: `rgb(${rgb})`, filter: `drop-shadow(0 0 10px rgba(${rgb},0.45))` }, children: shown }),
        /* @__PURE__ */ jsx7("div", { className: "text-[11px] font-bold text-white/70", children: label }),
        sub && /* @__PURE__ */ jsx7("div", { className: "text-[10px] text-white/30 mt-0.5", children: sub })
      ]
    }
  );
}

// src/canvas/CanvasTransition.tsx
import { usePathname } from "next/navigation";
import { useEffect as useEffect4, useState as useState4 } from "react";
import { motion as motion8, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import { Fragment, jsx as jsx8, jsxs as jsxs5 } from "react/jsx-runtime";
function CanvasTransition({
  children,
  labels = {},
  seenKey = "ash-seen-views",
  assemblerName = "Shift",
  alwaysGenerate = false
}) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState4(false);
  const [showSheen, setShowSheen] = useState4(false);
  const [seen] = useState4(() => /* @__PURE__ */ new Set());
  function viewLabel(path) {
    const seg = path.split("/").filter(Boolean);
    const key = seg.find((s) => labels[s]) ?? seg[0] ?? "dashboard";
    return labels[key] ?? key.replace(/-/g, " ");
  }
  useEffect4(() => {
    try {
      const raw = sessionStorage.getItem(seenKey);
      if (raw) JSON.parse(raw).forEach((p) => seen.add(p));
    } catch {
    }
    setMounted(true);
  }, []);
  const firstVisit = mounted && (alwaysGenerate || !seen.has(pathname));
  useEffect4(() => {
    if (!mounted) return;
    const wasFirst = alwaysGenerate || !seen.has(pathname);
    seen.add(pathname);
    try {
      sessionStorage.setItem(seenKey, JSON.stringify([...seen]));
    } catch {
    }
    if (wasFirst) {
      setShowSheen(true);
      const t = setTimeout(() => setShowSheen(false), 900);
      return () => clearTimeout(t);
    }
    setShowSheen(false);
  }, [pathname, mounted]);
  return /* @__PURE__ */ jsx8(AnimatePresence, { mode: "wait", children: /* @__PURE__ */ jsxs5(
    motion8.div,
    {
      initial: firstVisit ? { opacity: 0, y: 14, filter: "blur(7px)" } : { opacity: 0 },
      animate: { opacity: 1, y: 0, filter: "blur(0px)" },
      exit: { opacity: 0, filter: "blur(4px)", transition: { duration: 0.16 } },
      transition: firstVisit ? { type: "spring", stiffness: 240, damping: 28 } : { duration: 0.16, ease: "easeOut" },
      className: "relative min-h-full",
      children: [
        /* @__PURE__ */ jsx8(AnimatePresence, { children: showSheen && /* @__PURE__ */ jsxs5(Fragment, { children: [
          /* @__PURE__ */ jsx8(
            motion8.div,
            {
              initial: { scaleX: 0, opacity: 0.8 },
              animate: { scaleX: 1, opacity: 0 },
              exit: { opacity: 0 },
              transition: { duration: 0.9, ease: "easeOut" },
              style: {
                transformOrigin: "left",
                background: "linear-gradient(90deg, transparent, var(--shift-accent), transparent)"
              },
              className: "pointer-events-none fixed top-0 left-0 right-0 h-0.5 z-[60]"
            }
          ),
          /* @__PURE__ */ jsxs5(
            motion8.div,
            {
              initial: { opacity: 0, y: -6 },
              animate: { opacity: 1, y: 0 },
              exit: { opacity: 0, y: -6 },
              transition: { duration: 0.25 },
              style: {
                borderColor: "color-mix(in srgb, var(--shift-accent) 25%, transparent)",
                boxShadow: "0 0 24px color-mix(in srgb, var(--shift-accent) 18%, transparent)"
              },
              className: "ash-surface pointer-events-none fixed top-3 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-1.5 rounded-full border px-3 py-1",
              children: [
                /* @__PURE__ */ jsx8(Sparkles, { size: 10, style: { color: "var(--shift-accent)" }, className: "animate-pulse" }),
                /* @__PURE__ */ jsxs5("span", { className: "text-[10px] font-bold", style: { color: "var(--shift-accent)" }, children: [
                  assemblerName,
                  " is assembling ",
                  viewLabel(pathname),
                  "\u2026"
                ] })
              ]
            }
          )
        ] }) }),
        children
      ]
    },
    pathname
  ) });
}

// src/canvas/CanvasLauncher.tsx
import { useEffect as useEffect5, useMemo, useState as useState5 } from "react";
import { useRouter, usePathname as usePathname2 } from "next/navigation";
import { motion as motion9, AnimatePresence as AnimatePresence2 } from "framer-motion";
import { LayoutGrid, X, Search, Sparkles as Sparkles2 } from "lucide-react";
import { Fragment as Fragment2, jsx as jsx9, jsxs as jsxs6 } from "react/jsx-runtime";
function CanvasLauncher({
  groups,
  title = "Everything Shift can build",
  subtitle = "Pick a resource \u2014 I'll bring it to the canvas",
  buttonLabel = "Everything",
  hotkey = "j",
  openEvent = "shift:open-launcher",
  onNavigate
}) {
  const router = useRouter();
  const pathname = usePathname2();
  const [open, setOpen] = useState5(false);
  const [query, setQuery] = useState5("");
  useEffect5(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === hotkey) {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [hotkey]);
  useEffect5(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener(openEvent, onOpen);
    return () => window.removeEventListener(openEvent, onOpen);
  }, [openEvent]);
  const filtered = useMemo(() => {
    if (!query.trim()) return groups;
    const q = query.toLowerCase();
    return groups.map((g) => ({
      ...g,
      items: g.items.filter((i) => i.label.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q))
    })).filter((g) => g.items.length > 0);
  }, [query, groups]);
  function go(href) {
    setOpen(false);
    setQuery("");
    if (href === pathname) return;
    if (onNavigate) onNavigate(href);
    else router.push(href);
  }
  let flatIndex = 0;
  return /* @__PURE__ */ jsxs6(Fragment2, { children: [
    /* @__PURE__ */ jsxs6(
      "button",
      {
        type: "button",
        onClick: () => setOpen(true),
        "aria-label": "Open menu",
        title: `Everything (\u2318${hotkey.toUpperCase()})`,
        style: { borderColor: "color-mix(in srgb, var(--shift-accent) 20%, transparent)", color: "var(--shift-accent)" },
        className: "ash-surface flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all hover:brightness-110",
        children: [
          /* @__PURE__ */ jsx9(LayoutGrid, { size: 15 }),
          /* @__PURE__ */ jsx9("span", { className: "hidden lg:inline text-xs font-bold", children: buttonLabel })
        ]
      }
    ),
    /* @__PURE__ */ jsx9(AnimatePresence2, { children: open && /* @__PURE__ */ jsxs6(
      motion9.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 },
        className: "fixed inset-0 z-[8000] flex flex-col",
        style: { background: "rgba(2,4,10,0.86)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" },
        onClick: () => setOpen(false),
        children: [
          /* @__PURE__ */ jsx9("div", { className: "shrink-0 px-6 pt-6 pb-4", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsxs6("div", { className: "max-w-6xl mx-auto", children: [
            /* @__PURE__ */ jsxs6("div", { className: "flex items-center justify-between mb-4", children: [
              /* @__PURE__ */ jsxs6("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ jsx9(
                  "div",
                  {
                    className: "w-7 h-7 rounded-full flex items-center justify-center",
                    style: { background: "linear-gradient(135deg, var(--shift-accent), var(--shift-accent-2))", boxShadow: "0 0 14px color-mix(in srgb, var(--shift-accent) 50%, transparent)" },
                    children: /* @__PURE__ */ jsx9(Sparkles2, { size: 13, className: "text-white" })
                  }
                ),
                /* @__PURE__ */ jsxs6("div", { children: [
                  /* @__PURE__ */ jsx9("div", { className: "text-sm font-black text-white leading-none", children: title }),
                  /* @__PURE__ */ jsx9("div", { className: "text-[11px] text-white/40 mt-1", children: subtitle })
                ] })
              ] }),
              /* @__PURE__ */ jsx9("button", { type: "button", onClick: () => setOpen(false), className: "w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] transition-all", children: /* @__PURE__ */ jsx9(X, { size: 16 }) })
            ] }),
            /* @__PURE__ */ jsxs6("div", { className: "ash-surface flex items-center gap-2.5 rounded-2xl border border-white/10 px-4 py-3", children: [
              /* @__PURE__ */ jsx9(Search, { size: 15, className: "text-white/30" }),
              /* @__PURE__ */ jsx9(
                "input",
                {
                  autoFocus: true,
                  value: query,
                  onChange: (e) => setQuery(e.target.value),
                  placeholder: "Search resources\u2026",
                  className: "flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
                }
              ),
              /* @__PURE__ */ jsx9("kbd", { className: "text-[10px] text-white/25 border border-white/10 rounded px-1.5 py-0.5", children: "esc" })
            ] })
          ] }) }),
          /* @__PURE__ */ jsx9("div", { className: "flex-1 overflow-y-auto px-6 pb-10", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ jsxs6("div", { className: "max-w-6xl mx-auto flex flex-col gap-7", children: [
            filtered.map((group) => {
              const rgb = ACCENT_RGB[group.accent];
              return /* @__PURE__ */ jsxs6("div", { children: [
                /* @__PURE__ */ jsxs6("div", { className: "flex items-center gap-1.5 mb-3", style: { color: `rgb(${rgb})` }, children: [
                  /* @__PURE__ */ jsx9("div", { className: "w-1.5 h-1.5 rounded-full", style: { background: `rgb(${rgb})` } }),
                  /* @__PURE__ */ jsx9("span", { className: "text-[11px] font-black uppercase tracking-widest", children: group.label })
                ] }),
                /* @__PURE__ */ jsx9("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3", children: group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  const idx = flatIndex++;
                  return /* @__PURE__ */ jsxs6(
                    motion9.button,
                    {
                      type: "button",
                      onClick: () => go(item.href),
                      initial: { opacity: 0, y: 14, filter: "blur(5px)" },
                      animate: { opacity: 1, y: 0, filter: "blur(0px)" },
                      transition: { duration: 0.28, delay: Math.min(idx * 0.018, 0.5), ease: "easeOut" },
                      whileHover: { y: -3, scale: 1.015 },
                      style: isActive ? { borderColor: `rgba(${rgb},0.4)` } : void 0,
                      className: `ash-surface group relative text-left rounded-2xl border p-4 overflow-hidden transition-colors ${isActive ? "" : "border-white/[0.08] hover:border-white/[0.15]"}`,
                      children: [
                        /* @__PURE__ */ jsx9("div", { className: "absolute top-0 left-0 right-0 h-px opacity-60", style: { background: `rgba(${rgb},0.7)` } }),
                        /* @__PURE__ */ jsx9("div", { className: "w-9 h-9 rounded-xl flex items-center justify-center mb-3", style: { background: `rgba(${rgb},0.12)` }, children: /* @__PURE__ */ jsx9(Icon, { size: 16, style: { color: `rgb(${rgb})` } }) }),
                        /* @__PURE__ */ jsx9("div", { className: "text-sm font-bold text-white mb-0.5", children: item.label }),
                        /* @__PURE__ */ jsx9("div", { className: "text-[11px] text-white/40 leading-snug", children: item.desc }),
                        isActive && /* @__PURE__ */ jsx9("span", { className: "absolute top-3 right-3 text-[9px] font-bold", style: { color: `rgb(${rgb})` }, children: "on canvas" }),
                        /* @__PURE__ */ jsx9("div", { className: "absolute bottom-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none", style: { background: `rgba(${rgb},0.18)` } })
                      ]
                    },
                    item.href
                  );
                }) })
              ] }, group.label);
            }),
            filtered.length === 0 && /* @__PURE__ */ jsxs6("div", { className: "text-center text-white/30 text-sm py-20", children: [
              "No resources match \u201C",
              query,
              "\u201D"
            ] })
          ] }) })
        ]
      }
    ) })
  ] });
}

// src/canvas/PageTransition.tsx
import { motion as motion10 } from "framer-motion";
import { usePathname as usePathname3 } from "next/navigation";
import { useRef as useRef5 } from "react";
import { jsx as jsx10 } from "react/jsx-runtime";
function PageTransition({ children, className }) {
  const pathname = usePathname3();
  const depthRef = useRef5(0);
  const dirRef = useRef5(0);
  const depth = pathname.split("/").filter(Boolean).length;
  if (depth !== depthRef.current) {
    dirRef.current = dirRef.current === 0 ? 0 : depth >= depthRef.current ? 1 : -1;
    depthRef.current = depth;
  }
  const dir = dirRef.current;
  return /* @__PURE__ */ jsx10(
    motion10.div,
    {
      initial: { opacity: 0, x: dir * 22, filter: "blur(3px)" },
      animate: { opacity: 1, x: 0, filter: "blur(0px)", transitionEnd: { filter: "none" } },
      transition: { type: "spring", stiffness: 400, damping: 34 },
      className: className ?? "flex flex-col flex-1 min-h-0",
      children
    },
    pathname
  );
}

// src/canvas/CanvasProvider.tsx
import { createContext, useCallback, useContext, useEffect as useEffect6, useMemo as useMemo2, useRef as useRef6, useState as useState6 } from "react";

// src/canvas/duo.ts
var MAX_WINDOWS = 4;
var MAX_WINDOWS_PHONE = 2;
var DUO_FOCUS_SHARE = 0.62;
var PHONE_CHROME = 220;
var DUO_GAP = 12;
var DUO_MIN_H = 160;
function detectMode(innerWidth, innerHeight, coarsePointer) {
  if (innerWidth < 720) return "phone";
  if (coarsePointer && Math.min(innerWidth, innerHeight) < 600) return "phone";
  return "wide";
}
function maxWindowsFor(mode, limits) {
  const n = mode === "phone" ? limits?.phone ?? MAX_WINDOWS_PHONE : limits?.wide ?? MAX_WINDOWS;
  return Math.max(1, Math.floor(n));
}
function capList(list, max, keepId) {
  let out = list;
  while (out.length > max) {
    const victim = out.filter((b) => !b.locked && b.id !== keepId).sort((a, b) => a.z - b.z)[0];
    if (!victim) break;
    out = out.filter((b) => b.id !== victim.id);
  }
  return out;
}
function tileDuo(items, boardW, boardH) {
  const n = items.length;
  if (n === 0) return items;
  const sorted = [...items].sort((a, b) => b.z - a.z);
  const availH = Math.max(DUO_MIN_H * 2 + DUO_GAP, boardH - PHONE_CHROME);
  if (n === 1) return [{ ...sorted[0], x: 0, y: 0, w: boardW, h: availH, placed: false }];
  const minRest = (DUO_MIN_H + DUO_GAP) * (n - 1);
  const focusH = Math.max(DUO_MIN_H, Math.min(Math.round(availH * DUO_FOCUS_SHARE), availH - minRest));
  const restH = Math.max(DUO_MIN_H, Math.round((availH - focusH - DUO_GAP * (n - 1)) / (n - 1)));
  let y = 0;
  return sorted.map((it, i) => {
    const h = i === 0 ? focusH : restH;
    const out = { ...it, x: 0, y, w: boardW, h, placed: false };
    y += h + DUO_GAP;
    return out;
  });
}
function sameGeometry(a, b) {
  if (a.length !== b.length) return false;
  const byId = new Map(b.map((x) => [x.id, x]));
  return a.every((x) => {
    const y = byId.get(x.id);
    return !!y && x.x === y.x && x.y === y.y && x.w === y.w && x.h === y.h;
  });
}

// src/canvas/CanvasProvider.tsx
import { jsx as jsx11 } from "react/jsx-runtime";
var GAP = 20;
var DEFAULT_H = 420;
var MIN_W = 240;
var MIN_H = 200;
var WIDTH_SPAN = {
  sm: 4,
  // 1/3
  md: 6,
  // 1/2
  lg: 8,
  // 2/3
  xl: 12
  // full
};
var CanvasContext = createContext(null);
function useCanvas() {
  const ctx = useContext(CanvasContext);
  if (!ctx) throw new Error("useCanvas must be used inside <CanvasProvider>");
  return ctx;
}
var _seq = 0;
function nextId() {
  return `blk-${Date.now()}-${_seq++}`;
}
function blockFromSaved(s, z) {
  const sb = typeof s === "string" ? { key: s } : s;
  const hasCoords = typeof sb.x === "number" && typeof sb.y === "number" && typeof sb.w === "number";
  return {
    id: nextId(),
    key: sb.key,
    width: sb.width,
    z,
    placed: hasCoords,
    x: sb.x ?? 0,
    y: sb.y ?? 0,
    w: sb.w ?? 0,
    h: sb.h ?? DEFAULT_H
  };
}
function colWidth(boardW) {
  return (boardW - GAP * 11) / 12;
}
function pxWidth(weight, boardW) {
  return Math.max(MIN_W, weight * colWidth(boardW) + (weight - 1) * GAP);
}
function tallH(boardH) {
  return Math.max(460, boardH - 150);
}
function carveAround(zone, locked) {
  const hit = (a, b) => a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
  let r = { ...zone };
  for (let i = 0; i < locked.length + 2; i++) {
    const L = locked.find((l) => hit(r, l));
    if (!L) break;
    const ix = Math.max(r.x, L.x), iy = Math.max(r.y, L.y);
    const ir = Math.min(r.x + r.w, L.x + L.w), ib = Math.min(r.y + r.h, L.y + L.h);
    const slabs = [
      { x: r.x, y: r.y, w: ix - r.x, h: r.h },
      // left of the locked block
      { x: ir, y: r.y, w: r.x + r.w - ir, h: r.h },
      // right of it
      { x: r.x, y: r.y, w: r.w, h: iy - r.y },
      // above it
      { x: r.x, y: ib, w: r.w, h: r.y + r.h - ib }
      // below it
    ].filter((s) => s.w > 1 && s.h > 1);
    if (slabs.length === 0) break;
    r = slabs.reduce((a, b) => a.w * a.h >= b.w * b.h ? a : b);
  }
  return r;
}
function zoneBlocked(c, locked) {
  if (c.w < MIN_W || c.h < MIN_H) return true;
  return locked.some((L) => c.x < L.x + L.w && c.x + c.w > L.x && c.y < L.y + L.h && c.y + c.h > L.y);
}
function snapZones(boardW, H) {
  const halfW = Math.round((boardW - GAP) / 2);
  const halfH = Math.round((H - GAP) / 2);
  const rightX = boardW - halfW;
  const bottomY = H - halfH;
  return {
    full: { x: 0, y: 0, w: boardW, h: H },
    left: { x: 0, y: 0, w: halfW, h: H },
    right: { x: rightX, y: 0, w: halfW, h: H },
    top: { x: 0, y: 0, w: boardW, h: halfH },
    bottom: { x: 0, y: bottomY, w: boardW, h: halfH },
    tl: { x: 0, y: 0, w: halfW, h: halfH },
    tr: { x: rightX, y: 0, w: halfW, h: halfH },
    bl: { x: 0, y: bottomY, w: halfW, h: halfH },
    br: { x: rightX, y: bottomY, w: halfW, h: halfH }
  };
}
function tileRect(items, region) {
  const n = items.length;
  if (n === 0) return items;
  const rows = Math.ceil(n / 2);
  const rowH = Math.max(MIN_H, Math.round((region.h - GAP * (rows - 1)) / rows));
  const halfW = Math.round((region.w - GAP) / 2);
  const single = region.w < MIN_W * 2 + GAP;
  return items.map((it, i) => {
    if (single) {
      const h = Math.max(MIN_H, Math.round((region.h - GAP * (n - 1)) / n));
      return { ...it, x: region.x, y: region.y + i * (h + GAP), w: Math.max(MIN_W, region.w), h, placed: true };
    }
    const row = Math.floor(i / 2);
    const lastOdd = row === rows - 1 && n % 2 === 1;
    const y = region.y + row * (rowH + GAP);
    const w = lastOdd ? region.w : halfW;
    const x = lastOdd ? region.x : region.x + i % 2 * (halfW + GAP);
    return { ...it, x, y, w: Math.max(MIN_W, w), h: rowH, placed: true };
  });
}
function bestComplement(z, boardW, H) {
  const cands = [
    { x: z.x + z.w + GAP, y: 0, w: boardW - (z.x + z.w + GAP), h: H },
    // right of zone
    { x: 0, y: 0, w: z.x - GAP, h: H },
    // left of zone
    { x: 0, y: z.y + z.h + GAP, w: boardW, h: H - (z.y + z.h + GAP) },
    // below zone
    { x: 0, y: 0, w: boardW, h: z.y - GAP }
    // above zone
  ].filter((c) => c.w >= MIN_W && c.h >= MIN_H);
  if (cands.length === 0) return null;
  return cands.reduce((a, b) => a.w * a.h >= b.w * b.h ? a : b);
}
function computeSnap(blocks, id, layout, boardW, H) {
  const target = blocks.find((b) => b.id === id);
  if (!target || target.locked) return null;
  const zone = snapZones(boardW, H)[layout];
  const locked = blocks.filter((b) => b.id !== id && b.locked);
  const tRect = carveAround(zone, locked);
  if (zoneBlocked(tRect, locked)) return null;
  const placements = /* @__PURE__ */ new Map();
  placements.set(id, { x: Math.round(tRect.x), y: Math.round(tRect.y), w: Math.max(MIN_W, Math.round(tRect.w)), h: Math.max(MIN_H, Math.round(tRect.h)) });
  const others = blocks.filter((b) => b.id !== id && !b.locked);
  if (others.length > 0) {
    const comp = bestComplement(zone, boardW, H);
    if (comp) {
      const region = carveAround(comp, locked);
      if (region.w >= MIN_W && region.h >= MIN_H) {
        tileRect(others, region).forEach((o) => placements.set(o.id, { x: Math.round(o.x), y: Math.round(o.y), w: Math.round(o.w), h: Math.round(o.h) }));
      }
    }
  }
  return placements;
}
function tileItems(items, boardW, boardH, mode = "wide") {
  const n = items.length;
  if (n === 0) return items;
  if (mode === "phone") return tileDuo(items, boardW, boardH);
  const availH = Math.max(MIN_H * 2 + GAP, boardH - 150);
  const rows = Math.ceil(n / 2);
  const rowH = Math.max(300, Math.round((availH - GAP * (rows - 1)) / rows));
  const halfW = Math.round((boardW - GAP) / 2);
  const single = boardW < 720;
  return items.map((it, i) => {
    if (single) {
      const h = Math.max(MIN_H, Math.round(tallH(boardH) * 0.72));
      return { ...it, x: 0, y: i * (h + GAP), w: boardW, h };
    }
    const row = Math.floor(i / 2);
    const lastOdd = row === rows - 1 && n % 2 === 1;
    const y = row * (rowH + GAP);
    const w = lastOdd ? boardW : halfW;
    const x = lastOdd ? 0 : i % 2 * (halfW + GAP);
    return { ...it, x, y, w, h: rowH };
  });
}
function fitToBoard(list, boardW, boardH) {
  if (list.length === 0) return list;
  const extent = Math.max(...list.map((b) => b.x + b.w));
  if (extent > boardW * 1.5) return tileItems(list, boardW, boardH);
  let changed = false;
  const next = list.map((b) => {
    const w = Math.min(b.w, boardW);
    const x = Math.max(0, Math.min(b.x, boardW - w));
    if (w === b.w && x === b.x) return b;
    changed = true;
    return { ...b, w, x };
  });
  return changed ? next : list;
}
function overlaps(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
function pushOut(b, m) {
  const cands = [
    { x: m.x - b.w - GAP, y: b.y, d: Math.abs(m.x - b.w - GAP - b.x), ok: m.x - b.w - GAP >= 0 },
    { x: m.x + m.w + GAP, y: b.y, d: Math.abs(m.x + m.w + GAP - b.x), ok: true },
    { x: b.x, y: m.y - b.h - GAP, d: Math.abs(m.y - b.h - GAP - b.y), ok: m.y - b.h - GAP >= 0 },
    { x: b.x, y: m.y + m.h + GAP, d: Math.abs(m.y + m.h + GAP - b.y), ok: true }
  ].filter((c) => c.ok).sort((p, q) => p.d - q.d);
  const best = cands[0];
  return { x: Math.max(0, best.x), y: Math.max(0, best.y) };
}
function CanvasProvider({
  children,
  resolveBlock,
  initialKeys = [],
  initialLayout,
  addKey = null,
  persist = false,
  savedSession,
  limits
}) {
  const resolveRef = useRef6(resolveBlock);
  useEffect6(() => {
    resolveRef.current = resolveBlock;
  }, [resolveBlock]);
  const resolve = (key) => resolveRef.current(key);
  const initial = useMemo2(() => {
    const max = maxWindowsFor("wide", limits);
    const entries = initialLayout ? initialLayout.filter((b) => b && typeof b.key === "string" && resolveRef.current(b.key)) : initialKeys.filter((k) => resolveRef.current(k));
    if (addKey && resolveRef.current(addKey) && !entries.some((b) => (typeof b === "string" ? b : b.key) === addKey)) {
      entries.unshift(addKey);
    }
    const kept = entries.slice(0, max);
    let z = 1;
    const base = kept.map(() => null);
    for (let i = kept.length - 1; i >= 0; i--) base[i] = blockFromSaved(kept[i], z++);
    return { base, nextZ: z };
  }, []);
  const zRef = useRef6(initial.nextZ);
  const limitsRef = useRef6(limits);
  useEffect6(() => {
    limitsRef.current = limits;
  }, [limits]);
  const [blocks, setBlocks] = useState6(initial.base);
  const [interacting, setInteracting] = useState6(false);
  const [activeId, setActiveId] = useState6(null);
  const [snapGhost, setSnapGhost] = useState6(null);
  const [boardWidth, setBoardWidth] = useState6(1280);
  const boardRef = useRef6(1280);
  const boardHRef = useRef6(820);
  const [mode, setMode] = useState6("wide");
  const modeRef = useRef6("wide");
  const maxFor = (m) => maxWindowsFor(m, limitsRef.current);
  const persistRef = useRef6(persist);
  useEffect6(() => {
    persistRef.current = persist;
  }, [persist]);
  const fitAdjustRef = useRef6(false);
  const hadUserChangeRef = useRef6(false);
  useEffect6(() => {
    const measure = () => {
      const vw = Math.min(window.innerWidth, window.visualViewport?.width || Infinity);
      const w = Math.max(320, vw - 40);
      boardRef.current = w;
      boardHRef.current = Math.max(480, window.innerHeight);
      setBoardWidth(w);
      const coarse = !!window.matchMedia?.("(pointer: coarse)").matches;
      const m = detectMode(vw, window.innerHeight, coarse);
      const modeChanged = m !== modeRef.current;
      modeRef.current = m;
      setMode(m);
      setBlocks((prev) => {
        let next;
        if (m === "phone") {
          next = tileDuo(capList(prev, maxFor("phone")), w, boardHRef.current);
          if (sameGeometry(prev, next)) return prev;
        } else if (modeChanged) {
          next = tileItems(capList(prev, maxFor("wide")), w, boardHRef.current);
        } else {
          next = fitToBoard(prev, w, boardHRef.current);
        }
        if (next !== prev) fitAdjustRef.current = true;
        return next;
      });
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const layoutDefault = useCallback(
    (list) => tileItems(list, boardRef.current, boardHRef.current, modeRef.current),
    []
  );
  const customizedIn = (list) => modeRef.current !== "phone" && list.some((b) => b.placed);
  const tiledOnce = useRef6(false);
  useEffect6(() => {
    if (tiledOnce.current) return;
    tiledOnce.current = true;
    setBlocks((prev) => prev.length === 0 || customizedIn(prev) ? prev : layoutDefault(prev));
  }, [boardWidth]);
  const addBlock = useCallback((key, context, width, append = false) => {
    if (!resolve(key)) return;
    const w = width ?? resolve(key)?.defaultWidth;
    setBlocks((prev) => {
      const existing = prev.find((b) => b.key === key);
      const customized = customizedIn(prev);
      const without = capList(prev.filter((b) => b.key !== key), maxFor(modeRef.current) - 1);
      if (customized) {
        if (append) {
          const startY = without.length ? Math.max(...without.map((b) => b.y + b.h)) + GAP : 0;
          const nb3 = { id: nextId(), key, context, width: w, locked: existing?.locked, z: zRef.current++, placed: true, x: 0, y: startY, w: boardRef.current, h: tallH(boardHRef.current) };
          return [...without, nb3];
        }
        if (existing?.locked) {
          return prev.map((b) => b.id === existing.id ? { ...b, z: zRef.current++ } : b);
        }
        const boardW = boardRef.current;
        const H = tallH(boardHRef.current);
        const nb2 = existing ? { ...existing, z: zRef.current++, placed: true } : { id: nextId(), key, context, width: w, z: zRef.current++, placed: true, x: 0, y: 0, w: 0, h: 0 };
        if (without.length === 0) return [{ ...nb2, x: 0, y: 0, w: boardW, h: H }];
        const zone = without.length === 1 ? "left" : "tl";
        const list2 = [nb2, ...without];
        const placements = computeSnap(list2, nb2.id, zone, boardW, H);
        if (placements) {
          return list2.map((b) => {
            const p = placements.get(b.id);
            return p ? { ...b, ...p, placed: true } : b;
          });
        }
        const lockedTop = without.filter((b) => b.locked && b.y < H + GAP);
        const newY = lockedTop.length ? Math.max(...lockedTop.map((b) => b.y + b.h)) + GAP : 0;
        const shift = newY + H + GAP;
        const moved = without.map((b) => b.locked ? b : { ...b, y: b.y + shift });
        return [{ ...nb2, x: 0, y: newY, w: boardW, h: H }, ...moved];
      }
      const nb = existing ? { ...existing, z: zRef.current++ } : { id: nextId(), key, context, width: w, z: zRef.current++, placed: false, x: 0, y: 0, w: 0, h: 0 };
      const list = append ? [...without, nb] : [nb, ...without];
      return layoutDefault(list);
    });
    if (!append && typeof window !== "undefined") {
      requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
    }
  }, [layoutDefault]);
  const removeBlock = useCallback((id) => {
    setBlocks((prev) => {
      const remaining = prev.filter((b) => b.id !== id);
      return remaining.length > 0 && !customizedIn(remaining) ? layoutDefault(remaining) : remaining;
    });
  }, [layoutDefault]);
  const resizeBlock = useCallback((id, width) => {
    if (modeRef.current === "phone") return;
    setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, width, w: pxWidth(WIDTH_SPAN[width], boardRef.current), placed: true, z: zRef.current++ } : b));
  }, []);
  const moveTo = useCallback((id, x, y) => {
    if (modeRef.current === "phone") return;
    const boardW = boardRef.current;
    setBlocks((prev) => prev.map((b) => {
      if (b.id !== id || b.locked) return b;
      const nx = Math.max(0, Math.min(Math.round(x), Math.max(0, boardW - b.w)));
      const ny = Math.max(0, Math.round(y));
      return { ...b, x: nx, y: ny, placed: true };
    }));
  }, []);
  const sizeTo = useCallback((id, w, h) => {
    if (modeRef.current === "phone") return;
    const boardW = boardRef.current;
    setBlocks((prev) => prev.map((b) => {
      if (b.id !== id || b.locked) return b;
      const nw = Math.max(MIN_W, Math.min(Math.round(w), Math.max(MIN_W, boardW - b.x)));
      const nh = Math.max(MIN_H, Math.round(h));
      return { ...b, w: nw, h: nh, placed: true };
    }));
  }, []);
  const setRect = useCallback((id, r) => {
    if (modeRef.current === "phone") return;
    const boardW = boardRef.current;
    setBlocks((prev) => prev.map((b) => {
      if (b.id !== id || b.locked) return b;
      const nx = Math.max(0, Math.round(r.x));
      const ny = Math.max(0, Math.round(r.y));
      let nw = Math.max(MIN_W, Math.round(r.w));
      const nh = Math.max(MIN_H, Math.round(r.h));
      if (nx + nw > boardW) nw = Math.max(MIN_W, boardW - nx);
      return { ...b, x: nx, y: ny, w: nw, h: nh, placed: true };
    }));
  }, []);
  const snapTo = useCallback((id, layout) => {
    if (modeRef.current === "phone") return;
    const boardW = boardRef.current;
    const H = tallH(boardHRef.current);
    setSnapGhost(null);
    setBlocks((prev) => {
      const placements = computeSnap(prev, id, layout, boardW, H);
      if (!placements) return prev;
      return prev.map((b) => {
        const p = placements.get(b.id);
        if (!p) return b;
        return { ...b, ...p, placed: true, z: b.id === id ? zRef.current++ : b.z };
      });
    });
  }, []);
  const snapPreview = useCallback((id, layout) => {
    const boardW = boardRef.current;
    const H = tallH(boardHRef.current);
    const zone = snapZones(boardW, H)[layout];
    const locked = blocks.filter((b) => b.id !== id && b.locked);
    const c = carveAround(zone, locked);
    const box = (r) => ({
      left: r.x / boardW * 100,
      top: r.y / H * 100,
      width: r.w / boardW * 100,
      height: r.h / H * 100
    });
    const placements = computeSnap(blocks, id, layout, boardW, H);
    const others = placements ? [...placements.entries()].filter(([bid]) => bid !== id).map(([, r]) => box(r)) : [];
    return { rect: box(c), locked: locked.map((L) => box(L)), others, blocked: zoneBlocked(c, locked) };
  }, [blocks]);
  const previewSnap = useCallback((id, layout) => {
    const boardW = boardRef.current;
    const H = tallH(boardHRef.current);
    const placements = computeSnap(blocks, id, layout, boardW, H);
    if (!placements) {
      setSnapGhost(null);
      return;
    }
    const target = placements.get(id);
    if (!target) {
      setSnapGhost(null);
      return;
    }
    const others = [...placements.entries()].filter(([bid]) => bid !== id).map(([, r]) => r);
    setSnapGhost({ target, others });
  }, [blocks]);
  const clearSnapPreview = useCallback(() => setSnapGhost(null), []);
  const resizeRow = useCallback((id, x, w, h, origin) => {
    if (modeRef.current === "phone") return;
    const boardW = boardRef.current;
    const M0 = origin.find((b) => b.id === id);
    if (!M0 || M0.locked) return;
    const vov = (a, b) => a.y < b.y + b.h && a.y + a.h > b.y;
    const nh = Math.max(MIN_H, Math.round(h));
    const packed = /* @__PURE__ */ new Map();
    let mx = M0.x;
    let mw;
    if (Math.round(x) === Math.round(M0.x)) {
      const rights = origin.filter((b) => b.id !== id && b.x >= M0.x && vov(b, M0)).sort((a, b) => a.x - b.x);
      const wallIdx = rights.findIndex((b) => b.locked);
      const wallX = wallIdx >= 0 ? rights[wallIdx].x : boardW + GAP;
      const pushable = wallIdx >= 0 ? rights.slice(0, wallIdx) : rights;
      const reserved = pushable.length * (MIN_W + GAP);
      const mRight = Math.max(M0.x + MIN_W, Math.min(M0.x + Math.round(w), wallX - GAP - reserved));
      mw = mRight - M0.x;
      let cursor = mRight + GAP;
      pushable.forEach((N, i) => {
        const after = (pushable.length - 1 - i) * (MIN_W + GAP);
        const nw = Math.max(MIN_W, Math.min(N.w, Math.round(wallX - GAP - cursor - after)));
        packed.set(N.id, { x: Math.round(cursor), w: nw });
        cursor += nw + GAP;
      });
    } else {
      const fixedRight = M0.x + M0.w;
      const lefts = origin.filter((b) => b.id !== id && b.x < M0.x && vov(b, M0)).sort((a, b) => b.x - a.x);
      const wallIdx = lefts.findIndex((b) => b.locked);
      const wallRight = wallIdx >= 0 ? lefts[wallIdx].x + lefts[wallIdx].w : -GAP;
      const pushable = wallIdx >= 0 ? lefts.slice(0, wallIdx) : lefts;
      const reserved = pushable.length * (MIN_W + GAP);
      const mLeft = Math.min(fixedRight - MIN_W, Math.max(Math.round(x), wallRight + GAP + reserved));
      mx = mLeft;
      mw = fixedRight - mLeft;
      let cursor = mLeft - GAP;
      pushable.forEach((N, i) => {
        const after = (pushable.length - 1 - i) * (MIN_W + GAP);
        const nw = Math.max(MIN_W, Math.min(N.w, Math.round(cursor - (wallRight + GAP) - after)));
        const nx = Math.max(wallRight + GAP, Math.round(cursor - nw));
        packed.set(N.id, { x: nx, w: nw });
        cursor = nx - GAP;
      });
    }
    setBlocks((prev) => prev.map((b) => {
      if (b.id === id) return { ...b, x: mx, w: Math.max(MIN_W, mw), h: nh, placed: true };
      const p = packed.get(b.id);
      return p ? { ...b, x: p.x, w: p.w, placed: true } : b;
    }));
  }, []);
  const bringToFront = useCallback((id) => {
    setBlocks((prev) => {
      if (prev.find((b) => b.id === id)?.z === zRef.current - 1) return prev;
      const next = prev.map((b) => b.id === id ? { ...b, z: zRef.current++ } : b);
      return modeRef.current === "phone" ? layoutDefault(next) : next;
    });
  }, [layoutDefault]);
  const resolveCollisions = useCallback((id) => {
    if (modeRef.current === "phone") return;
    setBlocks((prev) => {
      const moved = prev.find((b) => b.id === id);
      if (!moved) return prev;
      const hits = prev.filter((b) => b.id !== id && !b.locked && overlaps(b, moved));
      if (hits.length === 0) return prev;
      const cx = moved.x + moved.w / 2;
      const leftN = hits.filter((b) => b.x + b.w / 2 < cx);
      const rightN = hits.filter((b) => b.x + b.w / 2 >= cx);
      if (leftN.length && rightN.length) {
        const leftEdge = Math.max(...leftN.map((b) => b.x + b.w)) + GAP;
        const rightEdge = Math.min(...rightN.map((b) => b.x)) - GAP;
        const gapW = rightEdge - leftEdge;
        if (gapW >= MIN_W) {
          return prev.map((b) => b.id === id ? { ...b, x: Math.round(leftEdge), w: Math.round(gapW) } : b);
        }
      }
      const boardW = boardRef.current;
      let changed = false;
      const next = prev.map((b) => {
        if (b.id === id || b.locked || !overlaps(b, moved)) return b;
        const p = pushOut(b, moved);
        let nx = p.x;
        let nw = b.w;
        if (nx + nw > boardW) nw = Math.max(MIN_W, boardW - nx);
        if (nx + nw > boardW) nx = Math.max(0, boardW - nw);
        if (nx === b.x && p.y === b.y && nw === b.w) return b;
        changed = true;
        return { ...b, x: nx, y: p.y, w: nw };
      });
      return changed ? next : prev;
    });
  }, []);
  const toggleLock = useCallback((id) => {
    setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, locked: !b.locked } : b));
  }, []);
  const restoredRef = useRef6(false);
  const [canRestore, setCanRestore] = useState6(false);
  const restoreSession = useCallback(() => {
    const saved = savedSession?.blocks;
    if (!saved || saved.length === 0) return;
    restoredRef.current = true;
    setCanRestore(false);
    const kept = saved.filter((b) => b && typeof b.key === "string" && resolve(b.key)).slice(0, maxFor(modeRef.current));
    const built = kept.map(() => null);
    for (let i = kept.length - 1; i >= 0; i--) built[i] = blockFromSaved(kept[i], zRef.current++);
    const arranged = customizedIn(built) ? built : layoutDefault(built);
    const fitted = fitToBoard(arranged, boardRef.current, boardHRef.current);
    if (fitted !== arranged) fitAdjustRef.current = true;
    setBlocks(fitted);
  }, [savedSession, layoutDefault]);
  const clear = useCallback((keepKey) => {
    setBlocks((prev) => keepKey ? prev.filter((b) => b.key === keepKey) : []);
  }, []);
  useEffect6(() => {
    function onAdd(e) {
      const d = e.detail;
      if (d?.key) addBlock(d.key, d.context, d.width, d.append);
    }
    function onClear(e) {
      const d = e.detail;
      clear(d?.keepKey);
    }
    function onResize(e) {
      const d = e.detail;
      if (!d?.key || !d?.width) return;
      const width = d.width;
      setBlocks((prev) => {
        const list = prev.map((b) => b.key === d.key ? { ...b, width } : b);
        return customizedIn(prev) ? list : layoutDefault(list);
      });
    }
    function onPlace(e) {
      const d = e.detail;
      if (!d?.key || !d?.afterKey) return;
      setBlocks((prev) => {
        const srcIdx = prev.findIndex((b) => b.key === d.key);
        const tgtIdx = prev.findIndex((b) => b.key === d.afterKey);
        if (srcIdx === -1 || tgtIdx === -1) return prev;
        const next = [...prev];
        const [moved] = next.splice(srcIdx, 1);
        const insertAt = next.findIndex((b) => b.key === d.afterKey) + 1;
        next.splice(insertAt, 0, moved);
        return customizedIn(prev) ? next : layoutDefault(next);
      });
    }
    function onSwap(e) {
      const d = e.detail;
      const keys = d?.keys ?? [];
      const contexts = d?.contexts ?? [];
      const widths = d?.widths ?? [];
      const built = keys.filter((k) => resolve(k)).slice(0, maxFor(modeRef.current)).map((key, i) => ({
        id: nextId(),
        key,
        context: contexts[i],
        width: widths[i] ?? resolve(key)?.defaultWidth,
        z: zRef.current++,
        placed: false,
        x: 0,
        y: 0,
        w: 0,
        h: DEFAULT_H
      }));
      setBlocks(layoutDefault(built));
    }
    function onRestore() {
      restoreSession();
    }
    window.addEventListener("shift:canvas:add", onAdd);
    window.addEventListener("shift:canvas:clear", onClear);
    window.addEventListener("shift:canvas:resize", onResize);
    window.addEventListener("shift:canvas:place", onPlace);
    window.addEventListener("shift:canvas:swap", onSwap);
    window.addEventListener("shift:canvas:restore-session", onRestore);
    return () => {
      window.removeEventListener("shift:canvas:add", onAdd);
      window.removeEventListener("shift:canvas:clear", onClear);
      window.removeEventListener("shift:canvas:resize", onResize);
      window.removeEventListener("shift:canvas:place", onPlace);
      window.removeEventListener("shift:canvas:swap", onSwap);
      window.removeEventListener("shift:canvas:restore-session", onRestore);
    };
  }, [addBlock, clear, layoutDefault, restoreSession]);
  const localDay = () => {
    try {
      return (/* @__PURE__ */ new Date()).toLocaleDateString("en-CA");
    } catch {
      return "";
    }
  };
  useEffect6(() => {
    if (!persist || restoredRef.current) return;
    const saved = savedSession?.blocks;
    if (!saved || saved.length === 0) return;
    if (savedSession?.savedDay && savedSession.savedDay === localDay()) {
      restoreSession();
    } else {
      setCanRestore(true);
    }
  }, []);
  useEffect6(() => {
    window.dispatchEvent(new CustomEvent("shift:canvas:state", { detail: { count: blocks.length, canRestore } }));
    return () => {
      window.dispatchEvent(new CustomEvent("shift:canvas:state", { detail: { count: 0, canRestore: false } }));
    };
  }, [blocks.length, canRestore]);
  const firstRun = useRef6(true);
  const saveTimer = useRef6(null);
  const layoutSignature = blocks.map((b) => mode === "phone" ? `${b.key}:${b.width ?? ""}` : `${b.key}:${b.width ?? ""}:${Math.round(b.x)}:${Math.round(b.y)}:${Math.round(b.w)}:${Math.round(b.h)}`).join("|");
  const payload = useMemo2(() => layoutSignature ? {
    savedDay: localDay(),
    blocks: layoutSignature.split("|").map((seg) => {
      const [key, width, x, y, w, h] = seg.split(":");
      const base = { key, ...width ? { width } : {} };
      return x === void 0 ? base : { ...base, x: Number(x), y: Number(y), w: Number(w), h: Number(h) };
    })
  } : null, [layoutSignature]);
  const payloadRef = useRef6(payload);
  useEffect6(() => {
    payloadRef.current = payload;
  }, [payload]);
  useEffect6(() => {
    if (!persist) return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
    }
    if (fitAdjustRef.current) {
      fitAdjustRef.current = false;
      if (!hadUserChangeRef.current) return;
    } else {
      hadUserChangeRef.current = true;
    }
    if (!payloadRef.current) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    const body = JSON.stringify(payloadRef.current);
    saveTimer.current = setTimeout(() => {
      void fetch("/api/canvas-layout", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body
      }).catch(() => {
      });
    }, 700);
    return () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
    };
  }, [persist, layoutSignature]);
  useEffect6(() => {
    if (!persist) return;
    const flush = () => {
      if (!hadUserChangeRef.current) return;
      if (!payloadRef.current) return;
      try {
        void fetch("/api/canvas-layout", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payloadRef.current),
          keepalive: true
        }).catch(() => {
        });
      } catch {
      }
    };
    const onHide = () => {
      if (document.visibilityState === "hidden") flush();
    };
    window.addEventListener("pagehide", flush);
    document.addEventListener("visibilitychange", onHide);
    return () => {
      window.removeEventListener("pagehide", flush);
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [persist]);
  const api = useMemo2(() => ({
    blocks,
    addBlock,
    removeBlock,
    resizeBlock,
    snapTo,
    snapPreview,
    previewSnap,
    clearSnapPreview,
    snapGhost,
    moveTo,
    sizeTo,
    setRect,
    resizeRow,
    bringToFront,
    resolveCollisions,
    toggleLock,
    clear,
    interacting,
    setInteracting,
    activeId,
    setActiveId,
    boardWidth,
    mode,
    maxBlocks: maxWindowsFor(mode, limits)
  }), [blocks, addBlock, removeBlock, resizeBlock, snapTo, snapPreview, previewSnap, clearSnapPreview, snapGhost, moveTo, sizeTo, setRect, resizeRow, bringToFront, resolveCollisions, toggleLock, clear, interacting, activeId, boardWidth, mode, limits]);
  return /* @__PURE__ */ jsx11(CanvasContext.Provider, { value: api, children });
}

// src/voice/useHeyShift.ts
import { useCallback as useCallback2, useEffect as useEffect7, useRef as useRef7, useState as useState7 } from "react";
function getSpeechRecognitionCtor() {
  const w = window;
  return w.SpeechRecognition ?? w.webkitSpeechRecognition;
}
function useHeyShift(config = {}) {
  const {
    wakeWord = "hey shift",
    language = "en-US",
    silenceMs = 1500,
    onCommand,
    onStateChange
  } = config;
  const [state, setState] = useState7("idle");
  const [transcript, setTranscript] = useState7("");
  const [isSupported, setIsSupported] = useState7(false);
  const recRef = useRef7(null);
  const silenceTimerRef = useRef7(null);
  const activeRef = useRef7(false);
  const accumulatedRef = useRef7("");
  const stateRef = useRef7("idle");
  const updateState = useCallback2((s) => {
    stateRef.current = s;
    setState(s);
    onStateChange?.(s);
  }, [onStateChange]);
  useEffect7(() => {
    const SR = getSpeechRecognitionCtor();
    setIsSupported(!!(SR && window.speechSynthesis));
  }, []);
  const getVoice = useCallback2(() => {
    const voices = window.speechSynthesis?.getVoices() ?? [];
    return voices.find((v) => v.name.toLowerCase().includes("will")) ?? voices.find((v) => v.name.toLowerCase().includes("daniel")) ?? voices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("male")) ?? voices.find((v) => v.lang.startsWith("en")) ?? voices[0] ?? null;
  }, []);
  const speak = useCallback2(async (text) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    return new Promise((resolve) => {
      const utter = new SpeechSynthesisUtterance(text);
      const setVoiceAndSpeak = () => {
        const voice = getVoice();
        if (voice) utter.voice = voice;
        utter.rate = 1.05;
        utter.pitch = 0.95;
        updateState("speaking");
        utter.onend = () => {
          updateState("idle");
          resolve();
        };
        utter.onerror = () => {
          updateState("idle");
          resolve();
        };
        window.speechSynthesis.speak(utter);
      };
      if (window.speechSynthesis.getVoices().length > 0) {
        setVoiceAndSpeak();
      } else {
        window.speechSynthesis.onvoiceschanged = () => {
          setVoiceAndSpeak();
        };
      }
    });
  }, [getVoice, updateState]);
  const cancelSpeech = useCallback2(() => {
    window.speechSynthesis?.cancel();
    if (stateRef.current === "speaking") updateState("idle");
  }, [updateState]);
  const resetSilenceTimer = useCallback2((text) => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    silenceTimerRef.current = setTimeout(async () => {
      if (!activeRef.current || !text.trim()) return;
      activeRef.current = false;
      accumulatedRef.current = "";
      setTranscript("");
      updateState("thinking");
      try {
        const response = await onCommand?.(text.trim());
        if (response) {
          await speak(response);
        } else {
          updateState("idle");
        }
      } catch {
        updateState("error");
        setTimeout(() => updateState("idle"), 2e3);
      }
    }, silenceMs);
  }, [silenceMs, onCommand, speak, updateState]);
  const startListening = useCallback2(() => {
    const SR = getSpeechRecognitionCtor();
    if (!SR || recRef.current) return;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = language;
    rec.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const t = event.results[i][0].transcript.trim().toLowerCase();
        const isFinal = event.results[i].isFinal;
        if (!activeRef.current) {
          if (t.includes(wakeWord.toLowerCase())) {
            activeRef.current = true;
            accumulatedRef.current = "";
            setTranscript("");
            updateState("wake");
            setTimeout(() => {
              if (activeRef.current) updateState("listening");
            }, 300);
          }
        } else {
          const raw = event.results[i][0].transcript;
          if (isFinal) {
            accumulatedRef.current += " " + raw;
          }
          const display = (accumulatedRef.current + " " + (isFinal ? "" : raw)).trim();
          setTranscript(display);
          resetSilenceTimer(display);
        }
      }
    };
    rec.onend = () => {
      if (recRef.current) {
        setTimeout(() => {
          recRef.current?.start();
        }, 150);
      }
    };
    rec.onerror = (event) => {
      if (event.error === "no-speech") return;
      if (event.error === "not-allowed") updateState("error");
    };
    rec.start();
    recRef.current = rec;
  }, [language, wakeWord, resetSilenceTimer, updateState]);
  const stopListening = useCallback2(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    const rec = recRef.current;
    recRef.current = null;
    rec?.stop();
    activeRef.current = false;
    accumulatedRef.current = "";
    setTranscript("");
    updateState("idle");
  }, [updateState]);
  useEffect7(() => {
    return () => {
      const rec = recRef.current;
      recRef.current = null;
      rec?.stop();
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
      window.speechSynthesis?.cancel();
    };
  }, []);
  return { state, transcript, startListening, stopListening, speak, cancelSpeech, isSupported };
}

// src/voice/ShiftBar.tsx
import { Fragment as Fragment3, jsx as jsx12, jsxs as jsxs7 } from "react/jsx-runtime";
var COLORS = {
  idle: "rgba(255,255,255,0.15)",
  wake: "#0ed882",
  listening: "#0ed882",
  thinking: "#22d3ee",
  speaking: "#a78bfa",
  error: "#f87171"
};
function ShiftBar({ state, dots = 3, size = 7, className = "" }) {
  const color = COLORS[state];
  const isAnimated = state !== "idle" && state !== "error";
  return /* @__PURE__ */ jsxs7(Fragment3, { children: [
    /* @__PURE__ */ jsx12("style", { children: `
        @keyframes _sb_pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(1.45)} }
        @keyframes _sb_wave  { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(1.9)} }
        @keyframes _sb_spin  { to{transform:rotate(360deg)} }
      ` }),
    /* @__PURE__ */ jsx12(
      "span",
      {
        className,
        role: "status",
        "aria-label": `Shift: ${state}`,
        style: { display: "inline-flex", alignItems: "center", gap: Math.round(size * 0.6) },
        children: Array.from({ length: dots }).map((_, i) => {
          let animation;
          if (isAnimated) {
            if (state === "thinking") {
              animation = `_sb_spin 1s linear infinite`;
            } else if (state === "speaking") {
              animation = `_sb_wave .7s ease-in-out ${i * 0.12}s infinite`;
            } else {
              animation = `_sb_pulse 1.2s ease-in-out ${i * 0.18}s infinite`;
            }
          }
          return /* @__PURE__ */ jsx12(
            "span",
            {
              style: {
                display: "inline-block",
                width: state === "thinking" ? size * 1.6 : size,
                height: size,
                borderRadius: state === "thinking" ? "50%" : "50%",
                background: state === "thinking" ? "transparent" : color,
                border: state === "thinking" ? `2px solid ${color}` : "none",
                borderTopColor: state === "thinking" ? "transparent" : void 0,
                transition: "background .3s ease, border-color .3s ease",
                animation,
                transformOrigin: "50% 50%"
              }
            },
            i
          );
        })
      }
    )
  ] });
}

// src/concierge/concierge.ts
var MAX_LINES = 40;
function initialConciergeState(moment = "landing") {
  return { moment, name: null, micChoice: "unset", muted: false, voiceUnlocked: false, lines: [], busy: false };
}
var lineSeq = 0;
function nextLineId() {
  lineSeq += 1;
  return `l${Date.now().toString(36)}${lineSeq}`;
}
function conciergeReducer(state, ev) {
  switch (ev.type) {
    case "unlockVoice":
      return state.voiceUnlocked ? state : { ...state, voiceUnlocked: true };
    case "chooseMic":
      if (state.micChoice === "denied" && ev.choice === "voice") return state;
      return { ...state, micChoice: ev.choice };
    case "setName":
      return { ...state, name: ev.name };
    case "will":
    case "user": {
      const line = { id: ev.id ?? nextLineId(), who: ev.type, text: ev.text, at: Date.now() };
      const lines = [...state.lines, line];
      return { ...state, lines: lines.length > MAX_LINES ? lines.slice(lines.length - MAX_LINES) : lines };
    }
    case "moment":
      return state.moment === ev.moment ? state : { ...state, moment: ev.moment };
    case "mute":
      return { ...state, muted: ev.muted };
    case "busy":
      return { ...state, busy: ev.busy };
    default:
      return state;
  }
}
function greetingForHour(hour) {
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}
var NAME_PREFIX = /^(?:hi|hello|hey|yo|um+|uh+|well|so|ok(?:ay)?)[,.!\s]+/i;
var NAME_LEAD = /^(?:my name(?:'s| is)|i am|i'm|im|it's|its|this is|call me|name's|name is|they call me)\s+/i;
function cleanName(raw) {
  let s = raw.trim().replace(/\s+/g, " ");
  if (!s) return null;
  s = s.replace(NAME_PREFIX, "");
  s = s.replace(NAME_LEAD, "");
  s = s.replace(/[.!?,;:"']+$/g, "").trim();
  s = s.split(/[,.!?;]/)[0].trim();
  if (!s) return null;
  const words = s.split(" ");
  if (words.length > 4) return null;
  if (!/^[\p{L}\p{M}'’\-\s]+$/u.test(s)) return null;
  const titled = words.map((w) => w.length <= 1 ? w.toUpperCase() : w[0].toUpperCase() + w.slice(1)).join(" ");
  return titled.slice(0, 60);
}
var WORD_NUMBERS = {
  zero: 0,
  one: 1,
  two: 2,
  three: 3,
  four: 4,
  five: 5,
  six: 6,
  seven: 7,
  eight: 8,
  nine: 9,
  ten: 10,
  eleven: 11,
  twelve: 12,
  thirteen: 13,
  fourteen: 14,
  fifteen: 15,
  sixteen: 16,
  seventeen: 17,
  eighteen: 18,
  nineteen: 19,
  twenty: 20,
  thirty: 30,
  forty: 40,
  fifty: 50,
  sixty: 60,
  seventy: 70,
  eighty: 80,
  ninety: 90,
  hundred: 100
};
function parseMoney(input) {
  if (typeof input === "number") return Number.isFinite(input) ? input : null;
  if (typeof input !== "string") return null;
  let s = input.toLowerCase().replace(/[$,]/g, "").replace(/\b(about|around|roughly|approximately|maybe|like)\b/g, "").trim();
  if (!s) return null;
  let mult = 1;
  if (/\b(million|mil|mm)\b|m$/.test(s)) mult = 1e6;
  else if (/\b(thousand|grand)\b|k$/.test(s)) mult = 1e3;
  s = s.replace(/\b(million|mil|mm|thousand|grand)\b/g, "").replace(/[km]$/, "").trim();
  const num = Number(s);
  if (Number.isFinite(num) && s !== "") return Math.round(num * mult);
  const words = s.split(/[\s-]+/).filter(Boolean);
  let total = 0;
  let current = 0;
  let sawWord = false;
  for (const w of words) {
    const n = WORD_NUMBERS[w];
    if (n === void 0) {
      if (w === "and") continue;
      return null;
    }
    sawWord = true;
    if (n === 100) current = Math.max(current, 1) * 100;
    else current += n;
  }
  total += current;
  return sawWord ? Math.round(total * mult) : null;
}
function norm(s) {
  return s.toLowerCase().replace(/&/g, " and ").replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
function tokens(s) {
  return norm(s).split(" ").filter(Boolean);
}
function stemEq(a, b) {
  if (a === b) return true;
  if (Math.min(a.length, b.length) < 4) return false;
  return a.startsWith(b) || b.startsWith(a);
}
function uniqueBest(options, score) {
  const scored = options.map((o) => ({ o, s: score(o) })).filter((x) => x.s > 0);
  if (!scored.length) return void 0;
  const best = Math.max(...scored.map((x) => x.s));
  const top = scored.filter((x) => x.s === best);
  return top.length === 1 ? top[0].o : null;
}
function matchOption(options, value) {
  if (value === null || value === void 0) return null;
  const v = String(value).trim();
  if (!v) return null;
  const exact = options.find((o) => o.value === v) ?? options.find((o) => o.label === v);
  if (exact) return exact;
  const nv = norm(v);
  const ci = options.find((o) => norm(o.value) === nv) ?? options.find((o) => norm(o.label) === nv);
  if (ci) return ci;
  const inTok = tokens(v);
  if (!inTok.length) return null;
  const byWords = uniqueBest(options, (o) => {
    const ot = Array.from(/* @__PURE__ */ new Set([...tokens(o.label), ...tokens(o.value)]));
    return inTok.filter((t) => ot.some((x) => stemEq(t, x))).length;
  });
  if (byWords !== void 0) return byWords;
  const byDesc = uniqueBest(options, (o) => {
    if (!o.description) return 0;
    const dt = tokens(o.description);
    return inTok.filter((t) => dt.some((x) => stemEq(t, x))).length;
  });
  return byDesc ?? null;
}
function splitList(value) {
  if (Array.isArray(value)) return value.map((v) => String(v).trim()).filter(Boolean);
  if (typeof value !== "string") return value === null || value === void 0 ? [] : [String(value)];
  return value.split(/\s*(?:,|;|\band\b|\bplus\b|\n)\s*/i).map((s) => s.trim()).filter(Boolean);
}
function coerceFill(spec, value) {
  const { id } = spec;
  switch (spec.type) {
    case "select": {
      const opt = matchOption(spec.options ?? [], value);
      return opt ? { id, ok: true, value: opt.value } : { id, ok: false, reason: `"${String(value)}" is not one of the choices` };
    }
    case "multi": {
      const parts = splitList(value);
      if (parts.length === 0) return { id, ok: false, reason: "nothing to add" };
      if (spec.options?.length) {
        const vals = parts.map((p) => matchOption(spec.options, p)?.value).filter((v) => !!v);
        if (!vals.length) return { id, ok: false, reason: "none of those matched the choices" };
        return { id, ok: true, value: Array.from(new Set(vals)) };
      }
      return { id, ok: true, value: Array.from(new Set(parts)) };
    }
    case "number":
    case "money": {
      const n = parseMoney(value);
      return n === null ? { id, ok: false, reason: `"${String(value)}" is not a number` } : { id, ok: true, value: n };
    }
    case "tel": {
      const digits = String(value ?? "").replace(/[^\d+]/g, "");
      return digits.replace(/\D/g, "").length >= 7 ? { id, ok: true, value: String(value).trim() } : { id, ok: false, reason: "that doesn't look like a phone number" };
    }
    case "email": {
      const s = String(value ?? "").trim();
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? { id, ok: true, value: s } : { id, ok: false, reason: "that doesn't look like an email" };
    }
    case "text":
    default: {
      const s = Array.isArray(value) ? value.join(", ") : String(value ?? "").trim();
      return s ? { id, ok: true, value: s } : { id, ok: false, reason: "empty" };
    }
  }
}
function coerceFills(fields, fills) {
  const byId = new Map(fields.map((f) => [f.id, f]));
  return fills.map((f) => {
    const spec = byId.get(f.id);
    return spec ? coerceFill(spec, f.value) : { id: f.id, ok: false, reason: "no such field on this step" };
  });
}
function snapshotForPrompt(fields) {
  if (!fields.length) return "(no fields on this step)";
  return fields.map((f) => {
    const cur = f.value === null || f.value === void 0 || f.value === "" || Array.isArray(f.value) && !f.value.length ? "empty" : `"${Array.isArray(f.value) ? f.value.join(", ") : String(f.value)}"`;
    const opts = f.options?.length ? ` choices: ${f.options.map((o) => `${o.value}=${o.label}`).join(" | ")}` : "";
    return `- ${f.id} \u2014 ${f.label} [${f.type}${f.required ? ", required" : ""}] currently ${cur}.${opts}${f.hint ? ` (${f.hint})` : ""}`;
  }).join("\n");
}
function summarizeFills(fields, results) {
  const byId = new Map(fields.map((f) => [f.id, f]));
  const ok = results.filter((r) => r.ok);
  if (!ok.length) return "";
  const parts = ok.map((r) => {
    const spec = byId.get(r.id);
    const label = spec?.label ?? r.id;
    const shown = spec?.type === "select" && spec.options ? spec.options.find((o) => o.value === r.value)?.label ?? String(r.value) : Array.isArray(r.value) ? r.value.join(", ") : spec?.type === "money" ? `$${Number(r.value).toLocaleString()}` : String(r.value);
    return `${shown} under ${label}`;
  });
  return parts.length === 1 ? `I put ${parts[0]}.` : `I put ${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}.`;
}
function endsWithQuestion(text) {
  return /\?\s*$/.test(text.trim());
}

// src/concierge/FieldRegistry.tsx
import {
  createContext as createContext2,
  useCallback as useCallback3,
  useContext as useContext2,
  useEffect as useEffect8,
  useMemo as useMemo3,
  useRef as useRef8,
  useState as useState8
} from "react";
import { jsx as jsx13 } from "react/jsx-runtime";
var Ctx = createContext2(null);
var FILL_HIGHLIGHT_MS = 2e3;
function ConciergeFields({ children }) {
  const entries = useRef8(/* @__PURE__ */ new Map());
  const [justFilled, setJustFilled] = useState8(/* @__PURE__ */ new Set());
  const [nav, setNavState] = useState8(null);
  const [version, setVersion] = useState8(0);
  const timers = useRef8(/* @__PURE__ */ new Map());
  const register = useCallback3((entry) => {
    const had = entries.current.has(entry.spec.id);
    entries.current.set(entry.spec.id, entry);
    if (!had) setVersion((v) => v + 1);
  }, []);
  const unregister = useCallback3((id) => {
    if (entries.current.delete(id)) setVersion((v) => v + 1);
  }, []);
  const snapshot = useCallback3(() => {
    return [...entries.current.values()].map((e) => ({ ...e.spec, value: e.get() }));
  }, []);
  const apply = useCallback3((fills) => {
    const results = coerceFills(snapshot(), fills);
    const landed = [];
    for (const r of results) {
      if (!r.ok) continue;
      const e = entries.current.get(r.id);
      if (!e) continue;
      e.set(r.value);
      landed.push(r.id);
    }
    if (landed.length) {
      setJustFilled((prev) => /* @__PURE__ */ new Set([...prev, ...landed]));
      for (const id of landed) {
        const t = timers.current.get(id);
        if (t) clearTimeout(t);
        timers.current.set(
          id,
          setTimeout(() => {
            timers.current.delete(id);
            setJustFilled((prev) => {
              if (!prev.has(id)) return prev;
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
          }, FILL_HIGHLIGHT_MS)
        );
      }
    }
    return results;
  }, [snapshot]);
  const setNav = useCallback3((n) => {
    setNavState((prev) => {
      if (prev === n) return prev;
      if (prev && n && prev.stepIndex === n.stepIndex && prev.stepTitle === n.stepTitle && prev.stepCount === n.stepCount && prev.canAdvance === n.canAdvance && prev.next === n.next && prev.prev === n.prev) return prev;
      return n;
    });
  }, []);
  useEffect8(() => () => {
    for (const t of timers.current.values()) clearTimeout(t);
  }, []);
  const value = useMemo3(
    () => ({ register, unregister, snapshot, apply, justFilled, nav, setNav, version }),
    [register, unregister, snapshot, apply, justFilled, nav, setNav, version]
  );
  return /* @__PURE__ */ jsx13(Ctx.Provider, { value, children });
}
function useConciergeFields() {
  return useContext2(Ctx);
}
function ConciergeField({ spec, value, onChange, children, className = "" }) {
  const ctx = useContext2(Ctx);
  const valueRef = useRef8(value);
  const onChangeRef = useRef8(onChange);
  const specRef = useRef8(spec);
  valueRef.current = value;
  onChangeRef.current = onChange;
  specRef.current = spec;
  const id = spec.id;
  useEffect8(() => {
    if (!ctx) return;
    ctx.register({
      spec: specRef.current,
      get: () => valueRef.current,
      set: (v) => onChangeRef.current(v)
    });
    return () => ctx.unregister(id);
  }, [id, ctx?.register, ctx?.unregister]);
  const filled = ctx?.justFilled.has(id) ?? false;
  return /* @__PURE__ */ jsx13("div", { "data-concierge-field": id, className: `ash-cg-field${filled ? " ash-cg-filled" : ""}${className ? ` ${className}` : ""}`, children });
}
function useConciergeNav(nav) {
  const ctx = useContext2(Ctx);
  const setNav = ctx?.setNav;
  useEffect8(() => {
    if (!setNav) return;
    setNav(nav);
    return () => setNav(null);
  }, [setNav, nav]);
}

// src/concierge/useAudioGate.ts
import { useEffect as useEffect9, useRef as useRef9, useState as useState9 } from "react";
function isShiftShell(ua) {
  const s = ua ?? (typeof navigator !== "undefined" ? navigator.userAgent : "");
  return /ShiftApp\//i.test(s);
}
function useAudioGate(onUnlock) {
  const [shell] = useState9(() => isShiftShell());
  const [unlocked, setUnlocked] = useState9(() => isShiftShell());
  const cb = useRef9(onUnlock);
  cb.current = onUnlock;
  const fired = useRef9(false);
  useEffect9(() => {
    if (unlocked) {
      if (!fired.current) {
        fired.current = true;
        cb.current?.();
      }
      return;
    }
    const unlock = () => {
      if (fired.current) return;
      fired.current = true;
      setUnlocked(true);
      cb.current?.();
      remove();
    };
    const opts = { capture: true, passive: true };
    const remove = () => {
      window.removeEventListener("pointerdown", unlock, opts);
      window.removeEventListener("keydown", unlock, opts);
      window.removeEventListener("touchend", unlock, opts);
    };
    window.addEventListener("pointerdown", unlock, opts);
    window.addEventListener("keydown", unlock, opts);
    window.addEventListener("touchend", unlock, opts);
    return remove;
  }, [unlocked]);
  return { unlocked, shell };
}

// src/concierge/listeners.ts
function webSpeechSupported() {
  if (typeof window === "undefined") return false;
  const w = window;
  return !!(w.SpeechRecognition ?? w.webkitSpeechRecognition);
}
var SILENCE_MS = 1800;
var WINDOW_MS = 15e3;
function webSpeechListener(lang = "en-US") {
  if (!webSpeechSupported()) return null;
  const w = window;
  const Ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition;
  let rec = null;
  let silence = null;
  let window_ = null;
  let finalText = "";
  let ended = false;
  const clear = () => {
    if (silence) clearTimeout(silence);
    if (window_) clearTimeout(window_);
    silence = null;
    window_ = null;
  };
  return {
    start(h) {
      if (rec) return;
      finalText = "";
      ended = false;
      const r = new Ctor();
      rec = r;
      r.continuous = true;
      r.interimResults = true;
      r.lang = lang;
      r.onresult = (e) => {
        let interim = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const res = e.results[i];
          if (res.isFinal) finalText = `${finalText} ${res[0].transcript}`.trim();
          else interim = `${interim} ${res[0].transcript}`.trim();
        }
        h.onText(`${finalText} ${interim}`.trim(), false);
        if (window_) {
          clearTimeout(window_);
          window_ = null;
        }
        if (finalText) {
          if (silence) clearTimeout(silence);
          silence = setTimeout(() => {
            silence = null;
            try {
              r.stop();
            } catch {
            }
          }, SILENCE_MS);
        }
      };
      r.onend = () => {
        clear();
        rec = null;
        if (ended) return;
        ended = true;
        if (finalText) h.onText(finalText, true);
        h.onEnd();
      };
      r.onerror = (e) => {
        const code = e?.error ?? "error";
        if (code !== "no-speech" && code !== "aborted") h.onError(code);
      };
      try {
        r.start();
      } catch {
        rec = null;
        h.onError("start-failed");
        return;
      }
      window_ = setTimeout(() => {
        try {
          r.stop();
        } catch {
        }
      }, WINDOW_MS);
    },
    stop() {
      clear();
      const r = rec;
      if (!r) return;
      try {
        r.stop();
      } catch {
      }
    }
  };
}
async function requestMicrophone() {
  if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) return false;
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    return false;
  }
}

// src/concierge/useConcierge.ts
import { useCallback as useCallback4, useEffect as useEffect10, useMemo as useMemo4, useReducer, useRef as useRef10, useState as useState10 } from "react";
function useConcierge(opts) {
  const { script, adapters, enabled = true, initialMoment = "landing", nameFieldId, fields = null, initialMuted = false, initialName = null } = opts;
  const [state, dispatch] = useReducer(conciergeReducer, void 0, () => ({ ...initialConciergeState(initialMoment), muted: initialMuted, name: initialName }));
  const [input, setInput] = useState10("");
  const [speaking, setSpeaking] = useState10(false);
  const [listening, setListening] = useState10(false);
  const [thinking, setThinking] = useState10(false);
  const S = useRef10(state);
  S.current = state;
  const A = useRef10(adapters);
  A.current = adapters;
  const F = useRef10(fields);
  F.current = fields;
  const listenerRef = useRef10(null);
  const pendingSpeech = useRef10(null);
  const announced = useRef10(/* @__PURE__ */ new Set());
  const speakGen = useRef10(0);
  const speakNow = useCallback4(async (text) => {
    const gen = ++speakGen.current;
    setSpeaking(true);
    try {
      await A.current.speak(text);
    } finally {
      if (gen === speakGen.current) {
        setSpeaking(false);
        if (S.current.micChoice === "voice" && endsWithQuestion(text) && !S.current.muted) startListeningRef.current();
      }
    }
  }, []);
  const { unlocked } = useAudioGate(() => {
    dispatch({ type: "unlockVoice" });
    const p = pendingSpeech.current;
    pendingSpeech.current = null;
    if (p && !S.current.muted) void speakNow(p);
  });
  const say = useCallback4((text) => {
    if (!text) return;
    dispatch({ type: "will", text, id: nextLineId() });
    if (S.current.muted) return;
    if (unlocked || S.current.voiceUnlocked) {
      pendingSpeech.current = null;
      void speakNow(text);
    } else {
      pendingSpeech.current = text;
    }
  }, [unlocked, speakNow]);
  const stopListening = useCallback4(() => {
    listenerRef.current?.stop();
    listenerRef.current = null;
    setListening(false);
  }, []);
  const startListeningRef = useRef10(() => void 0);
  const startListening = useCallback4(() => {
    if (listenerRef.current || S.current.muted || S.current.micChoice !== "voice") return;
    const make = A.current.listen ?? (() => webSpeechListener());
    const l = make();
    if (!l) return;
    listenerRef.current = l;
    setListening(true);
    let heard = false;
    l.start({
      onText: (text, final) => {
        heard = heard || !!text;
        setInput(text);
        if (final && text.trim()) {
          listenerRef.current = null;
          setListening(false);
          void sendRef.current(text);
        }
      },
      onEnd: () => {
        listenerRef.current = null;
        setListening(false);
        if (!heard && S.current.moment === "askName") say(script.lines.heardNothing());
      },
      onError: (code) => {
        listenerRef.current = null;
        setListening(false);
        if (code === "not-allowed" || code === "service-not-allowed") {
          dispatch({ type: "chooseMic", choice: "denied" });
          say(script.lines.micDenied());
        }
      }
    });
  }, [say, script]);
  startListeningRef.current = startListening;
  const chooseMic = useCallback4((choice) => {
    if (choice === "voice") {
      const req = A.current.requestMic ?? requestMicrophone;
      void req().then((ok) => {
        if (ok) {
          dispatch({ type: "chooseMic", choice: "voice" });
          dispatch({ type: "unlockVoice" });
          const p = pendingSpeech.current;
          pendingSpeech.current = null;
          if (p && !S.current.muted) void speakNow(p);
          else startListeningRef.current();
        } else {
          dispatch({ type: "chooseMic", choice: "denied" });
          say(script.lines.micDenied());
        }
      });
      return;
    }
    dispatch({ type: "chooseMic", choice });
  }, [say, script, speakNow]);
  const onMic = useCallback4(() => {
    if (listenerRef.current) {
      stopListening();
      return;
    }
    if (S.current.micChoice === "voice") {
      A.current.cancelSpeech();
      setSpeaking(false);
      startListening();
      return;
    }
    if (S.current.micChoice === "denied") {
      say(script.lines.micDenied());
      return;
    }
    chooseMic("voice");
  }, [chooseMic, say, script, startListening, stopListening]);
  const toggleMute = useCallback4(() => {
    const next = !S.current.muted;
    dispatch({ type: "mute", muted: next });
    if (next) {
      A.current.cancelSpeech();
      setSpeaking(false);
      stopListening();
      pendingSpeech.current = null;
    }
  }, [stopListening]);
  const handleName = useCallback4(async (name) => {
    dispatch({ type: "setName", name });
    try {
      await A.current.onName?.(name);
    } catch {
    }
    if (nameFieldId) F.current?.apply([{ id: nameFieldId, value: name }]);
    dispatch({ type: "moment", moment: "meet" });
    say(script.lines.meet(name));
  }, [nameFieldId, say, script]);
  const sendRef = useRef10(async () => void 0);
  const send = useCallback4(async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || S.current.busy) return;
    stopListening();
    A.current.cancelSpeech();
    setSpeaking(false);
    setInput("");
    dispatch({ type: "user", text: msg });
    if (S.current.moment === "askName") {
      const n = cleanName(msg);
      if (n && n.split(" ").length <= 3) {
        await handleName(n);
        return;
      }
    }
    dispatch({ type: "busy", busy: true });
    setThinking(true);
    try {
      const f = F.current;
      const snapshot = f?.snapshot() ?? [];
      const nav = f?.nav ? { stepTitle: f.nav.stepTitle, stepIndex: f.nav.stepIndex, stepCount: f.nav.stepCount } : null;
      const res = await A.current.ask({ message: msg, moment: S.current.moment, name: S.current.name, history: S.current.lines.slice(-12), fields: snapshot, nav });
      let reply = res.text?.trim() ?? "";
      if (res.name && !S.current.name) {
        dispatch({ type: "setName", name: res.name });
        try {
          await A.current.onName?.(res.name);
        } catch {
        }
        if (nameFieldId) f?.apply([{ id: nameFieldId, value: res.name }]);
        if (S.current.moment === "askName") {
          dispatch({ type: "moment", moment: "meet" });
          if (!reply) reply = script.lines.meet(res.name);
        }
      }
      if (res.fills?.length && f) {
        const results = f.apply(res.fills);
        if (!reply) reply = summarizeFills(snapshot, results);
      }
      if (res.nav === "next" && f?.nav?.canAdvance) f.nav.next();
      else if (res.nav === "prev") f?.nav?.prev();
      if (reply) say(reply);
    } catch {
      say("I lost the thread for a second. Say that again, or just keep typing in the form.");
    } finally {
      dispatch({ type: "busy", busy: false });
      setThinking(false);
    }
  }, [handleName, input, nameFieldId, say, script, stopListening]);
  sendRef.current = send;
  const startMoment = useCallback4((m) => {
    dispatch({ type: "moment", moment: m });
  }, []);
  const hour = opts.hour ?? (/* @__PURE__ */ new Date()).getHours();
  const navKey = fields?.nav ? `${fields.nav.stepIndex}:${fields.nav.stepTitle}` : "";
  useEffect10(() => {
    if (!enabled) return;
    const { moment, name } = state;
    if (moment === "landing") {
      const k = "landing";
      if (!announced.current.has(k)) {
        announced.current.add(k);
        say(script.lines.landing({ greeting: greetingForHour(hour) }));
      }
    } else if (moment === "askName") {
      const k = "askName";
      if (!announced.current.has(k)) {
        announced.current.add(k);
        say(script.lines.askName());
      }
    } else if (moment === "meet") {
      if (!speaking) {
        const t = setTimeout(() => dispatch({ type: "moment", moment: "fill" }), state.muted || !state.voiceUnlocked ? 900 : 150);
        return () => clearTimeout(t);
      }
    } else if (moment === "fill") {
      if (!fields?.nav) return;
      const k = `step:${navKey}`;
      if (!announced.current.has(k)) {
        announced.current.add(k);
        const line = script.lines.step({ stepTitle: fields.nav.stepTitle, stepIndex: fields.nav.stepIndex, stepCount: fields.nav.stepCount, name });
        if (line) say(line);
      }
    } else if (moment === "done") {
      const k = "done";
      if (!announced.current.has(k)) {
        announced.current.add(k);
        stopListening();
        say(script.lines.done(name));
      }
    }
  }, [enabled, state.moment, state.name, state.muted, state.voiceUnlocked, speaking, navKey, fields?.nav, hour, say, script, stopListening, state]);
  useEffect10(() => () => {
    listenerRef.current?.stop();
    A.current.cancelSpeech();
  }, []);
  const barState = listening ? "listening" : thinking ? "thinking" : speaking ? "speaking" : "idle";
  const showPermission = enabled && state.micChoice === "unset" && (state.moment === "askName" || state.moment === "meet" || state.moment === "fill");
  return useMemo4(() => ({
    state,
    barState,
    input,
    setInput,
    send,
    onMic,
    chooseMic,
    toggleMute,
    showPermission,
    unlocked: unlocked || state.voiceUnlocked,
    startMoment,
    say,
    listening,
    speaking
  }), [state, barState, input, send, onMic, chooseMic, toggleMute, showPermission, unlocked, startMoment, say, listening, speaking]);
}

// src/concierge/ShiftConcierge.tsx
import { useEffect as useEffect11, useLayoutEffect, useRef as useRef11, useState as useState11 } from "react";
import { jsx as jsx14, jsxs as jsxs8 } from "react/jsx-runtime";
var CPS = 48;
function useLayout(layout) {
  const wide = layout === "auto-float" ? "float" : "column";
  const [mode, setMode] = useState11(layout === "auto" || layout === "auto-float" ? wide : layout);
  useEffect11(() => {
    if (layout !== "auto" && layout !== "auto-float") {
      setMode(layout);
      return;
    }
    const compute = () => {
      const coarse = typeof window.matchMedia === "function" && window.matchMedia("(pointer: coarse)").matches;
      const w = Math.min(window.innerWidth, window.visualViewport?.width ?? window.innerWidth);
      setMode(detectMode(w, window.innerHeight, coarse) === "phone" ? "dock" : wide);
    };
    compute();
    window.addEventListener("resize", compute);
    return () => window.removeEventListener("resize", compute);
  }, [layout, wide]);
  return mode;
}
function useKeyboardOffset(active) {
  const [offset, setOffset] = useState11(0);
  useEffect11(() => {
    if (!active || typeof window === "undefined" || !window.visualViewport) return;
    const vv = window.visualViewport;
    const update = () => setOffset(Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop)));
    update();
    vv.addEventListener("resize", update);
    vv.addEventListener("scroll", update);
    return () => {
      vv.removeEventListener("resize", update);
      vv.removeEventListener("scroll", update);
    };
  }, [active]);
  return offset;
}
function useTyped(text, enabled) {
  const [n, setN] = useState11(enabled ? 0 : text.length);
  useEffect11(() => {
    if (!enabled) {
      setN(text.length);
      return;
    }
    setN(0);
    const start = performance.now();
    let raf = 0;
    const tick = (now) => {
      const next = Math.min(text.length, Math.floor((now - start) / 1e3 * CPS));
      setN(next);
      if (next < text.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [text, enabled]);
  return text.slice(0, n);
}
function ShiftConcierge(props) {
  const {
    lines,
    barState,
    input,
    onInputChange,
    onSend,
    onMic,
    micChoice,
    onChooseMic,
    showPermission,
    muted,
    onToggleMute,
    busy = false,
    layout = "auto",
    speakerName = "Will",
    placeholder = "Type here, or tap the mic",
    permissionText,
    dockLines = 3,
    typewriter = true,
    className = ""
  } = props;
  const mode = useLayout(layout);
  const kb = useKeyboardOffset(mode === "dock");
  const reduced = typeof window !== "undefined" && typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const last = lines[lines.length - 1];
  const lastWill = last?.who === "will" ? last : null;
  const typed = useTyped(lastWill?.text ?? "", typewriter && !reduced && !!lastWill);
  const shown = mode === "dock" ? lines.slice(-dockLines) : lines;
  const scroller = useRef11(null);
  const inputRef = useRef11(null);
  useLayoutEffect(() => {
    const el = scroller.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [shown.length, typed]);
  useEffect11(() => {
    if (micChoice === "text") inputRef.current?.focus();
  }, [micChoice]);
  const onKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };
  const listening = barState === "listening";
  return /* @__PURE__ */ jsxs8(
    "aside",
    {
      className: `ash-cg ash-cg--${mode} ash-surface${className ? ` ${className}` : ""}`,
      style: mode === "dock" ? { bottom: kb } : void 0,
      "aria-label": `${speakerName}, your assistant`,
      children: [
        /* @__PURE__ */ jsxs8("div", { className: "ash-cg-head", children: [
          /* @__PURE__ */ jsx14(ShiftBar, { state: barState, size: 6 }),
          /* @__PURE__ */ jsx14("span", { className: "ash-cg-name", children: speakerName }),
          /* @__PURE__ */ jsx14("button", { type: "button", className: "ash-cg-mute", onClick: onToggleMute, "aria-pressed": muted, "aria-label": muted ? `Unmute ${speakerName}` : `Mute ${speakerName}`, children: muted ? "Voice off" : "Voice on" })
        ] }),
        /* @__PURE__ */ jsx14("div", { ref: scroller, className: "ash-cg-lines", "aria-live": "polite", "aria-relevant": "additions text", children: shown.map((l) => /* @__PURE__ */ jsxs8("p", { className: `ash-cg-line ash-cg-line--${l.who}`, children: [
          l === lastWill ? typed : l.text,
          l === lastWill && typed.length < l.text.length && /* @__PURE__ */ jsx14("span", { className: "ash-cg-caret", "aria-hidden": true })
        ] }, l.id)) }),
        showPermission && /* @__PURE__ */ jsxs8("div", { className: "ash-cg-perm", role: "group", "aria-label": "How do you want to answer?", children: [
          /* @__PURE__ */ jsx14("p", { className: "ash-cg-perm-text", children: permissionText ?? `Answer out loud, or type below. Your choice.` }),
          /* @__PURE__ */ jsxs8("div", { className: "ash-cg-perm-row", children: [
            /* @__PURE__ */ jsx14("button", { type: "button", className: "ash-cg-perm-btn ash-cg-perm-btn--voice", onClick: () => onChooseMic("voice"), children: "Use my voice" }),
            /* @__PURE__ */ jsx14("button", { type: "button", className: "ash-cg-perm-btn", onClick: () => onChooseMic("text"), children: "I'll type" })
          ] })
        ] }),
        /* @__PURE__ */ jsxs8("div", { className: "ash-cg-row", children: [
          /* @__PURE__ */ jsx14(
            "button",
            {
              type: "button",
              className: `ash-cg-mic${listening ? " ash-cg-mic--on" : ""}${micChoice === "denied" ? " ash-cg-mic--off" : ""}`,
              onClick: onMic,
              "aria-pressed": listening,
              "aria-label": listening ? "Stop listening" : micChoice === "denied" ? "Microphone blocked" : "Talk to " + speakerName,
              children: /* @__PURE__ */ jsxs8("svg", { viewBox: "0 0 24 24", width: "18", height: "18", "aria-hidden": true, fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
                /* @__PURE__ */ jsx14("rect", { x: "9", y: "3", width: "6", height: "11", rx: "3" }),
                /* @__PURE__ */ jsx14("path", { d: "M5 11a7 7 0 0 0 14 0" }),
                /* @__PURE__ */ jsx14("path", { d: "M12 18v3" }),
                micChoice === "denied" && /* @__PURE__ */ jsx14("path", { d: "M4 4l16 16" })
              ] })
            }
          ),
          /* @__PURE__ */ jsx14(
            "textarea",
            {
              ref: inputRef,
              className: "ash-cg-input",
              rows: 1,
              value: input,
              placeholder: listening ? "Listening\u2026" : placeholder,
              onChange: (e) => onInputChange(e.target.value),
              onKeyDown: onKey,
              disabled: busy,
              "aria-label": "Shift box"
            }
          ),
          /* @__PURE__ */ jsx14("button", { type: "button", className: "ash-cg-send", onClick: onSend, disabled: busy || !input.trim(), "aria-label": "Send", children: /* @__PURE__ */ jsxs8("svg", { viewBox: "0 0 24 24", width: "18", height: "18", "aria-hidden": true, fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round", children: [
            /* @__PURE__ */ jsx14("path", { d: "M5 12h14" }),
            /* @__PURE__ */ jsx14("path", { d: "M13 6l6 6-6 6" })
          ] }) })
        ] })
      ]
    }
  );
}
export {
  ACCENT_RGB,
  CanvasLauncher,
  CanvasProvider,
  CanvasTransition,
  ConciergeField,
  ConciergeFields,
  DEFAULT_H,
  DUO_FOCUS_SHARE,
  FILL_HIGHLIGHT_MS,
  GAP,
  GenerativeView,
  HolographicShine,
  LiveCard,
  LiveStat,
  MAX_LINES,
  MAX_WINDOWS,
  MAX_WINDOWS_PHONE,
  MIN_H,
  MIN_W,
  PageTransition,
  SILENCE_MS,
  ScrollGenerateCard,
  ShiftBar,
  ShiftCard,
  ShiftConcierge,
  TiltCard,
  WIDTH_SPAN,
  WINDOW_MS,
  cleanName,
  coerceFill,
  coerceFills,
  conciergeReducer,
  detectMode,
  endsWithQuestion,
  greetingForHour,
  initialConciergeState,
  isShiftShell,
  matchOption,
  maxWindowsFor,
  nextLineId,
  parseMoney,
  requestMicrophone,
  snapshotForPrompt,
  summarizeFills,
  tallH,
  useAudioGate,
  useCanvas,
  useConcierge,
  useConciergeFields,
  useConciergeNav,
  useGenerate,
  useHeyShift,
  webSpeechListener,
  webSpeechSupported
};
