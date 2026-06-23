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
      animate: { opacity: 1, x: 0, filter: "blur(0px)" },
      transition: { type: "spring", stiffness: 400, damping: 34 },
      className: className ?? "flex flex-col flex-1 min-h-0",
      children
    },
    pathname
  );
}

// src/voice/useHeyShift.ts
import { useCallback, useEffect as useEffect6, useRef as useRef6, useState as useState6 } from "react";
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
  const [state, setState] = useState6("idle");
  const [transcript, setTranscript] = useState6("");
  const [isSupported, setIsSupported] = useState6(false);
  const recRef = useRef6(null);
  const silenceTimerRef = useRef6(null);
  const activeRef = useRef6(false);
  const accumulatedRef = useRef6("");
  const stateRef = useRef6("idle");
  const updateState = useCallback((s) => {
    stateRef.current = s;
    setState(s);
    onStateChange?.(s);
  }, [onStateChange]);
  useEffect6(() => {
    const SR = getSpeechRecognitionCtor();
    setIsSupported(!!(SR && window.speechSynthesis));
  }, []);
  const getVoice = useCallback(() => {
    const voices = window.speechSynthesis?.getVoices() ?? [];
    return voices.find((v) => v.name.toLowerCase().includes("will")) ?? voices.find((v) => v.name.toLowerCase().includes("daniel")) ?? voices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("male")) ?? voices.find((v) => v.lang.startsWith("en")) ?? voices[0] ?? null;
  }, []);
  const speak = useCallback(async (text) => {
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
  const cancelSpeech = useCallback(() => {
    window.speechSynthesis?.cancel();
    if (stateRef.current === "speaking") updateState("idle");
  }, [updateState]);
  const resetSilenceTimer = useCallback((text) => {
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
  const startListening = useCallback(() => {
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
  const stopListening = useCallback(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    const rec = recRef.current;
    recRef.current = null;
    rec?.stop();
    activeRef.current = false;
    accumulatedRef.current = "";
    setTranscript("");
    updateState("idle");
  }, [updateState]);
  useEffect6(() => {
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
import { Fragment as Fragment3, jsx as jsx11, jsxs as jsxs7 } from "react/jsx-runtime";
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
    /* @__PURE__ */ jsx11("style", { children: `
        @keyframes _sb_pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(1.45)} }
        @keyframes _sb_wave  { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(1.9)} }
        @keyframes _sb_spin  { to{transform:rotate(360deg)} }
      ` }),
    /* @__PURE__ */ jsx11(
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
          return /* @__PURE__ */ jsx11(
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
export {
  ACCENT_RGB,
  CanvasLauncher,
  CanvasTransition,
  GenerativeView,
  HolographicShine,
  LiveCard,
  LiveStat,
  PageTransition,
  ScrollGenerateCard,
  ShiftBar,
  ShiftCard,
  TiltCard,
  useGenerate,
  useHeyShift
};
