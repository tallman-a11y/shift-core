"use client";
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/index.ts
var index_exports = {};
__export(index_exports, {
  ACCENT_RGB: () => ACCENT_RGB,
  CanvasLauncher: () => CanvasLauncher,
  CanvasProvider: () => CanvasProvider,
  CanvasTransition: () => CanvasTransition,
  DEFAULT_H: () => DEFAULT_H,
  GAP: () => GAP,
  GenerativeView: () => GenerativeView,
  HolographicShine: () => HolographicShine,
  LiveCard: () => LiveCard,
  LiveStat: () => LiveStat,
  MIN_H: () => MIN_H,
  MIN_W: () => MIN_W,
  PageTransition: () => PageTransition,
  ScrollGenerateCard: () => ScrollGenerateCard,
  ShiftBar: () => ShiftBar,
  ShiftCard: () => ShiftCard,
  TiltCard: () => TiltCard,
  WIDTH_SPAN: () => WIDTH_SPAN,
  tallH: () => tallH,
  useCanvas: () => useCanvas,
  useGenerate: () => useGenerate,
  useHeyShift: () => useHeyShift
});
module.exports = __toCommonJS(index_exports);

// src/components/ShiftCard.tsx
var import_framer_motion = require("framer-motion");
var import_jsx_runtime = require("react/jsx-runtime");
function ShiftCard({ children, className = "", blur = 12, style, ...props }) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    import_framer_motion.motion.div,
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
var import_react = require("react");
var import_framer_motion2 = require("framer-motion");
var import_jsx_runtime2 = require("react/jsx-runtime");
function TiltCard({
  children,
  stiffness = 300,
  damping = 28,
  maxRotateX = 4,
  maxRotateY = 7,
  style,
  ...rest
}) {
  const ref = (0, import_react.useRef)(null);
  const rawX = (0, import_framer_motion2.useMotionValue)(0);
  const rawY = (0, import_framer_motion2.useMotionValue)(0);
  const rotateY = (0, import_framer_motion2.useSpring)((0, import_framer_motion2.useTransform)(rawX, [-1, 1], [-maxRotateY, maxRotateY]), {
    stiffness,
    damping
  });
  const rotateX = (0, import_framer_motion2.useSpring)((0, import_framer_motion2.useTransform)(rawY, [-1, 1], [maxRotateX, -maxRotateX]), {
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
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(
    import_framer_motion2.motion.div,
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
var import_react2 = require("react");
var import_framer_motion3 = require("framer-motion");
var import_jsx_runtime3 = require("react/jsx-runtime");
function HolographicShine({
  rgb = "255,255,255",
  intensity = 0.18,
  children,
  className,
  style
}) {
  const ref = (0, import_react2.useRef)(null);
  const mouseX = (0, import_framer_motion3.useMotionValue)(0);
  const mouseY = (0, import_framer_motion3.useMotionValue)(0);
  const springX = (0, import_framer_motion3.useSpring)(mouseX, { stiffness: 260, damping: 26 });
  const springY = (0, import_framer_motion3.useSpring)(mouseY, { stiffness: 260, damping: 26 });
  const background = import_framer_motion3.useMotionTemplate`radial-gradient(260px circle at ${springX}px ${springY}px, rgba(${rgb},${intensity}), transparent 70%)`;
  function onMouseMove(e) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(
    "div",
    {
      ref,
      onMouseMove,
      className,
      style: { position: "relative", ...style },
      children: [
        children,
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
          import_framer_motion3.motion.div,
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
var import_react3 = __toESM(require("react"), 1);
var import_framer_motion4 = require("framer-motion");
var import_jsx_runtime4 = require("react/jsx-runtime");
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
  const ref = import_react3.default.useRef(null);
  const inView = (0, import_framer_motion4.useInView)(ref, { once: true, margin });
  const [phase, setPhase] = (0, import_react3.useState)("idle");
  (0, import_react3.useEffect)(() => {
    if (!inView) return;
    const t1 = setTimeout(() => setPhase("skeleton"), delay);
    const t2 = setTimeout(() => setPhase("live"), delay + skeletonDuration);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [inView, delay, skeletonDuration]);
  const widths = skeletonWidths.slice(0, skeletonRows);
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("div", { ref, className, style: { position: "relative" }, children: [
    phase === "skeleton" && /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)(
      import_framer_motion4.motion.div,
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
          /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
            import_framer_motion4.motion.div,
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
          widths.map((w, i) => /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
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
    phase === "idle" && /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("div", { style: { visibility: "hidden" }, children: children("idle") })
  ] });
}

// src/canvas/LiveCard.tsx
var import_framer_motion6 = require("framer-motion");

// src/canvas/useGenerate.ts
var import_react4 = require("react");
var import_framer_motion5 = require("framer-motion");
function useGenerate(opts = {}) {
  const {
    enterDelay = 0,
    skeletonMs = 420,
    trigger = "view",
    margin = "-60px 0px",
    repeat = false
  } = opts;
  const ref = (0, import_react4.useRef)(null);
  const inView = (0, import_framer_motion5.useInView)(ref, { once: !repeat, margin });
  const [phase, setPhase] = (0, import_react4.useState)("idle");
  (0, import_react4.useEffect)(() => {
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
var import_jsx_runtime5 = require("react/jsx-runtime");
function resolveRgb(accent) {
  if (accent === "brand") return { rgb: "var(--shift-accent-rgb, 91,140,255)", isBrand: true };
  return { rgb: ACCENT_RGB[accent], isBrand: false };
}
var SKEL_WIDTHS = [72, 88, 60, 80, 66, 78, 54, 84];
function Skeleton({ rows, minHeight }) {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
    import_framer_motion6.motion.div,
    {
      initial: { opacity: 0, y: 16 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 },
      className: "ash-surface relative rounded-2xl border border-white/[0.07] p-5 overflow-hidden",
      style: { minHeight },
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "h-5 w-28 rounded-full bg-white/[0.07] animate-pulse mb-5" }),
        Array.from({ length: rows }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { className: "flex items-center gap-3 mb-3", children: [
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { className: "w-7 h-7 rounded-xl bg-white/5 animate-pulse shrink-0" }),
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
            "div",
            {
              className: "h-2.5 rounded-full bg-white/5 animate-pulse",
              style: { width: `${SKEL_WIDTHS[i % SKEL_WIDTHS.length]}%` }
            }
          )
        ] }, i)),
        /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
          import_framer_motion6.motion.div,
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
  const mx = (0, import_framer_motion6.useMotionValue)(0.5);
  const my = (0, import_framer_motion6.useMotionValue)(0.5);
  const rawRY = (0, import_framer_motion6.useTransform)(mx, [0, 1], [-7, 7]);
  const rawRX = (0, import_framer_motion6.useTransform)(my, [0, 1], [4, -4]);
  const rotateY = (0, import_framer_motion6.useSpring)(rawRY, { stiffness: 300, damping: 28 });
  const rotateX = (0, import_framer_motion6.useSpring)(rawRX, { stiffness: 300, damping: 28 });
  const shineX = (0, import_framer_motion6.useMotionValue)(50);
  const shineY = (0, import_framer_motion6.useMotionValue)(50);
  const shineBg = import_framer_motion6.useMotionTemplate`radial-gradient(circle at ${shineX}% ${shineY}%, rgba(${rgb},0.10) 0%, rgba(${rgb},0.035) 42%, transparent 66%)`;
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
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { ref, className: `rounded-2xl border border-white/[0.04] ${className}`, style: { minHeight } });
  }
  if (effectivePhase === "skeleton") {
    return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("div", { ref, className, children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(Skeleton, { rows: skeletonRows, minHeight }) });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
    "div",
    {
      ref,
      style: { perspective: tilt ? "1000px" : void 0 },
      onMouseMove,
      onMouseLeave,
      className,
      children: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(
        import_framer_motion6.motion.div,
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
            topLine && /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
              import_framer_motion6.motion.div,
              {
                className: "absolute top-0 left-0 right-0 h-px",
                style: { background: `linear-gradient(90deg, transparent, rgba(${rgb},0.9), transparent)`, transformOrigin: "left" },
                initial: { scaleX: 0, opacity: 0 },
                animate: { scaleX: 1, opacity: 0.7 },
                transition: { duration: 0.5, ease: "easeOut" }
              }
            ),
            children,
            /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(
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
var import_react5 = require("react");
var import_framer_motion7 = require("framer-motion");
var import_jsx_runtime6 = require("react/jsx-runtime");
function GenerativeView({
  children,
  stagger = 0.08,
  delay = 0,
  className = ""
}) {
  const items = import_react5.Children.toArray(children);
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
    import_framer_motion7.motion.div,
    {
      className,
      initial: "hidden",
      animate: "show",
      variants: {
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } }
      },
      children: items.map(
        (child, i) => (0, import_react5.isValidElement)(child) ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
          import_framer_motion7.motion.div,
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
var import_react6 = require("react");
var import_framer_motion8 = require("framer-motion");
var import_jsx_runtime7 = require("react/jsx-runtime");
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
  const [n, setN] = (0, import_react6.useState)(0);
  const raf = (0, import_react6.useRef)(0);
  (0, import_react6.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(
    import_framer_motion8.motion.div,
    {
      initial: { opacity: 0, y: 16, scale: 0.96 },
      animate: { opacity: 1, y: 0, scale: 1 },
      transition: { type: "spring", stiffness: 280, damping: 26, delay: index * 0.06 },
      className: "ash-surface relative rounded-2xl border border-white/[0.08] p-4 overflow-hidden",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "absolute top-0 left-0 right-0 h-px", style: { background: `rgba(${rgb},0.6)` } }),
        Icon && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "w-8 h-8 rounded-xl flex items-center justify-center mb-3", style: { background: `rgba(${rgb},0.15)` }, children: /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Icon, { size: 14, style: { color: `rgb(${rgb})` } }) }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "text-2xl font-black mb-1", style: { color: `rgb(${rgb})`, filter: `drop-shadow(0 0 10px rgba(${rgb},0.45))` }, children: shown }),
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "text-[11px] font-bold text-white/70", children: label }),
        sub && /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "text-[10px] text-white/30 mt-0.5", children: sub })
      ]
    }
  );
}

// src/canvas/CanvasTransition.tsx
var import_navigation = require("next/navigation");
var import_react7 = require("react");
var import_framer_motion9 = require("framer-motion");
var import_lucide_react = require("lucide-react");
var import_jsx_runtime8 = require("react/jsx-runtime");
function CanvasTransition({
  children,
  labels = {},
  seenKey = "ash-seen-views",
  assemblerName = "Shift",
  alwaysGenerate = false
}) {
  const pathname = (0, import_navigation.usePathname)();
  const [mounted, setMounted] = (0, import_react7.useState)(false);
  const [showSheen, setShowSheen] = (0, import_react7.useState)(false);
  const [seen] = (0, import_react7.useState)(() => /* @__PURE__ */ new Set());
  function viewLabel(path) {
    const seg = path.split("/").filter(Boolean);
    const key = seg.find((s) => labels[s]) ?? seg[0] ?? "dashboard";
    return labels[key] ?? key.replace(/-/g, " ");
  }
  (0, import_react7.useEffect)(() => {
    try {
      const raw = sessionStorage.getItem(seenKey);
      if (raw) JSON.parse(raw).forEach((p) => seen.add(p));
    } catch {
    }
    setMounted(true);
  }, []);
  const firstVisit = mounted && (alwaysGenerate || !seen.has(pathname));
  (0, import_react7.useEffect)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_framer_motion9.AnimatePresence, { mode: "wait", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
    import_framer_motion9.motion.div,
    {
      initial: firstVisit ? { opacity: 0, y: 14, filter: "blur(7px)" } : { opacity: 0 },
      animate: { opacity: 1, y: 0, filter: "blur(0px)" },
      exit: { opacity: 0, filter: "blur(4px)", transition: { duration: 0.16 } },
      transition: firstVisit ? { type: "spring", stiffness: 240, damping: 28 } : { duration: 0.16, ease: "easeOut" },
      className: "relative min-h-full",
      children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_framer_motion9.AnimatePresence, { children: showSheen && /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(import_jsx_runtime8.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(
            import_framer_motion9.motion.div,
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
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(
            import_framer_motion9.motion.div,
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
                /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(import_lucide_react.Sparkles, { size: 10, style: { color: "var(--shift-accent)" }, className: "animate-pulse" }),
                /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("span", { className: "text-[10px] font-bold", style: { color: "var(--shift-accent)" }, children: [
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
var import_react8 = require("react");
var import_navigation2 = require("next/navigation");
var import_framer_motion10 = require("framer-motion");
var import_lucide_react2 = require("lucide-react");
var import_jsx_runtime9 = require("react/jsx-runtime");
function CanvasLauncher({
  groups,
  title = "Everything Shift can build",
  subtitle = "Pick a resource \u2014 I'll bring it to the canvas",
  buttonLabel = "Everything",
  hotkey = "j",
  openEvent = "shift:open-launcher",
  onNavigate
}) {
  const router = (0, import_navigation2.useRouter)();
  const pathname = (0, import_navigation2.usePathname)();
  const [open, setOpen] = (0, import_react8.useState)(false);
  const [query, setQuery] = (0, import_react8.useState)("");
  (0, import_react8.useEffect)(() => {
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
  (0, import_react8.useEffect)(() => {
    function onOpen() {
      setOpen(true);
    }
    window.addEventListener(openEvent, onOpen);
    return () => window.removeEventListener(openEvent, onOpen);
  }, [openEvent]);
  const filtered = (0, import_react8.useMemo)(() => {
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
  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(import_jsx_runtime9.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
      "button",
      {
        type: "button",
        onClick: () => setOpen(true),
        "aria-label": "Open menu",
        title: `Everything (\u2318${hotkey.toUpperCase()})`,
        style: { borderColor: "color-mix(in srgb, var(--shift-accent) 20%, transparent)", color: "var(--shift-accent)" },
        className: "ash-surface flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all hover:brightness-110",
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_lucide_react2.LayoutGrid, { size: 15 }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "hidden lg:inline text-xs font-bold", children: buttonLabel })
        ]
      }
    ),
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_framer_motion10.AnimatePresence, { children: open && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
      import_framer_motion10.motion.div,
      {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
        transition: { duration: 0.2 },
        className: "fixed inset-0 z-[8000] flex flex-col",
        style: { background: "rgba(2,4,10,0.86)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" },
        onClick: () => setOpen(false),
        children: [
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "shrink-0 px-6 pt-6 pb-4", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "max-w-6xl mx-auto", children: [
            /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center justify-between mb-4", children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center gap-2", children: [
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                  "div",
                  {
                    className: "w-7 h-7 rounded-full flex items-center justify-center",
                    style: { background: "linear-gradient(135deg, var(--shift-accent), var(--shift-accent-2))", boxShadow: "0 0 14px color-mix(in srgb, var(--shift-accent) 50%, transparent)" },
                    children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_lucide_react2.Sparkles, { size: 13, className: "text-white" })
                  }
                ),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { children: [
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "text-sm font-black text-white leading-none", children: title }),
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "text-[11px] text-white/40 mt-1", children: subtitle })
                ] })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("button", { type: "button", onClick: () => setOpen(false), className: "w-8 h-8 rounded-xl flex items-center justify-center text-white/40 hover:text-white hover:bg-white/[0.08] transition-all", children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_lucide_react2.X, { size: 16 }) })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "ash-surface flex items-center gap-2.5 rounded-2xl border border-white/10 px-4 py-3", children: [
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(import_lucide_react2.Search, { size: 15, className: "text-white/30" }),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
                "input",
                {
                  autoFocus: true,
                  value: query,
                  onChange: (e) => setQuery(e.target.value),
                  placeholder: "Search resources\u2026",
                  className: "flex-1 bg-transparent text-sm text-white placeholder:text-white/25 outline-none"
                }
              ),
              /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("kbd", { className: "text-[10px] text-white/25 border border-white/10 rounded px-1.5 py-0.5", children: "esc" })
            ] })
          ] }) }),
          /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "flex-1 overflow-y-auto px-6 pb-10", onClick: (e) => e.stopPropagation(), children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "max-w-6xl mx-auto flex flex-col gap-7", children: [
            filtered.map((group) => {
              const rgb = ACCENT_RGB[group.accent];
              return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "flex items-center gap-1.5 mb-3", style: { color: `rgb(${rgb})` }, children: [
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "w-1.5 h-1.5 rounded-full", style: { background: `rgb(${rgb})` } }),
                  /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "text-[11px] font-black uppercase tracking-widest", children: group.label })
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3", children: group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  const idx = flatIndex++;
                  return /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)(
                    import_framer_motion10.motion.button,
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
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "absolute top-0 left-0 right-0 h-px opacity-60", style: { background: `rgba(${rgb},0.7)` } }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "w-9 h-9 rounded-xl flex items-center justify-center mb-3", style: { background: `rgba(${rgb},0.12)` }, children: /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(Icon, { size: 16, style: { color: `rgb(${rgb})` } }) }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "text-sm font-bold text-white mb-0.5", children: item.label }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "text-[11px] text-white/40 leading-snug", children: item.desc }),
                        isActive && /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { className: "absolute top-3 right-3 text-[9px] font-bold", style: { color: `rgb(${rgb})` }, children: "on canvas" }),
                        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("div", { className: "absolute bottom-0 right-0 w-24 h-24 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none", style: { background: `rgba(${rgb},0.18)` } })
                      ]
                    },
                    item.href
                  );
                }) })
              ] }, group.label);
            }),
            filtered.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("div", { className: "text-center text-white/30 text-sm py-20", children: [
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
var import_framer_motion11 = require("framer-motion");
var import_navigation3 = require("next/navigation");
var import_react9 = require("react");
var import_jsx_runtime10 = require("react/jsx-runtime");
function PageTransition({ children, className }) {
  const pathname = (0, import_navigation3.usePathname)();
  const depthRef = (0, import_react9.useRef)(0);
  const dirRef = (0, import_react9.useRef)(0);
  const depth = pathname.split("/").filter(Boolean).length;
  if (depth !== depthRef.current) {
    dirRef.current = dirRef.current === 0 ? 0 : depth >= depthRef.current ? 1 : -1;
    depthRef.current = depth;
  }
  const dir = dirRef.current;
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(
    import_framer_motion11.motion.div,
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

// src/canvas/CanvasProvider.tsx
var import_react10 = require("react");
var import_jsx_runtime11 = require("react/jsx-runtime");
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
var CanvasContext = (0, import_react10.createContext)(null);
function useCanvas() {
  const ctx = (0, import_react10.useContext)(CanvasContext);
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
function tileItems(items, boardW, boardH) {
  const n = items.length;
  if (n === 0) return items;
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
  savedSession
}) {
  const resolveRef = (0, import_react10.useRef)(resolveBlock);
  (0, import_react10.useEffect)(() => {
    resolveRef.current = resolveBlock;
  }, [resolveBlock]);
  const resolve = (key) => resolveRef.current(key);
  const initial = (0, import_react10.useMemo)(() => {
    let z = 1;
    const base = initialLayout ? initialLayout.filter((b) => b && typeof b.key === "string" && resolveRef.current(b.key)).map((b) => blockFromSaved(b, z++)) : initialKeys.filter((k) => resolveRef.current(k)).map((k) => blockFromSaved(k, z++));
    if (addKey && resolveRef.current(addKey) && !base.some((b) => b.key === addKey)) {
      base.unshift(blockFromSaved(addKey, z++));
    }
    return { base, nextZ: z };
  }, []);
  const zRef = (0, import_react10.useRef)(initial.nextZ);
  const [blocks, setBlocks] = (0, import_react10.useState)(initial.base);
  const [interacting, setInteracting] = (0, import_react10.useState)(false);
  const [activeId, setActiveId] = (0, import_react10.useState)(null);
  const [snapGhost, setSnapGhost] = (0, import_react10.useState)(null);
  const [boardWidth, setBoardWidth] = (0, import_react10.useState)(1280);
  const boardRef = (0, import_react10.useRef)(1280);
  const boardHRef = (0, import_react10.useRef)(820);
  const persistRef = (0, import_react10.useRef)(persist);
  (0, import_react10.useEffect)(() => {
    persistRef.current = persist;
  }, [persist]);
  (0, import_react10.useEffect)(() => {
    const measure = () => {
      const w = Math.max(360, window.innerWidth - 40);
      boardRef.current = w;
      boardHRef.current = Math.max(480, window.innerHeight);
      setBoardWidth(w);
    };
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);
  const layoutDefault = (0, import_react10.useCallback)(
    (list) => tileItems(list, boardRef.current, boardHRef.current),
    []
  );
  const tiledOnce = (0, import_react10.useRef)(false);
  (0, import_react10.useEffect)(() => {
    if (tiledOnce.current) return;
    tiledOnce.current = true;
    setBlocks((prev) => prev.length === 0 || prev.some((b) => b.placed) ? prev : layoutDefault(prev));
  }, [boardWidth]);
  const addBlock = (0, import_react10.useCallback)((key, context, width, append = false) => {
    if (!resolve(key)) return;
    const w = width ?? resolve(key)?.defaultWidth;
    setBlocks((prev) => {
      const existing = prev.find((b) => b.key === key);
      const customized = prev.some((b) => b.placed);
      const without = prev.filter((b) => b.key !== key);
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
  const removeBlock = (0, import_react10.useCallback)((id) => {
    setBlocks((prev) => {
      const remaining = prev.filter((b) => b.id !== id);
      return remaining.length > 0 && !remaining.some((b) => b.placed) ? layoutDefault(remaining) : remaining;
    });
  }, [layoutDefault]);
  const resizeBlock = (0, import_react10.useCallback)((id, width) => {
    setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, width, w: pxWidth(WIDTH_SPAN[width], boardRef.current), placed: true, z: zRef.current++ } : b));
  }, []);
  const moveTo = (0, import_react10.useCallback)((id, x, y) => {
    const boardW = boardRef.current;
    setBlocks((prev) => prev.map((b) => {
      if (b.id !== id || b.locked) return b;
      const nx = Math.max(0, Math.min(Math.round(x), Math.max(0, boardW - b.w)));
      const ny = Math.max(0, Math.round(y));
      return { ...b, x: nx, y: ny, placed: true };
    }));
  }, []);
  const sizeTo = (0, import_react10.useCallback)((id, w, h) => {
    const boardW = boardRef.current;
    setBlocks((prev) => prev.map((b) => {
      if (b.id !== id || b.locked) return b;
      const nw = Math.max(MIN_W, Math.min(Math.round(w), Math.max(MIN_W, boardW - b.x)));
      const nh = Math.max(MIN_H, Math.round(h));
      return { ...b, w: nw, h: nh, placed: true };
    }));
  }, []);
  const setRect = (0, import_react10.useCallback)((id, r) => {
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
  const snapTo = (0, import_react10.useCallback)((id, layout) => {
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
  const snapPreview = (0, import_react10.useCallback)((id, layout) => {
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
  const previewSnap = (0, import_react10.useCallback)((id, layout) => {
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
  const clearSnapPreview = (0, import_react10.useCallback)(() => setSnapGhost(null), []);
  const resizeRow = (0, import_react10.useCallback)((id, x, w, h, origin) => {
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
  const bringToFront = (0, import_react10.useCallback)((id) => {
    setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, z: zRef.current++ } : b));
  }, []);
  const resolveCollisions = (0, import_react10.useCallback)((id) => {
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
  const toggleLock = (0, import_react10.useCallback)((id) => {
    setBlocks((prev) => prev.map((b) => b.id === id ? { ...b, locked: !b.locked } : b));
  }, []);
  const restoredRef = (0, import_react10.useRef)(false);
  const [canRestore, setCanRestore] = (0, import_react10.useState)(false);
  const restoreSession = (0, import_react10.useCallback)(() => {
    const saved = savedSession?.blocks;
    if (!saved || saved.length === 0) return;
    restoredRef.current = true;
    setCanRestore(false);
    const built = saved.filter((b) => b && typeof b.key === "string" && resolve(b.key)).map((b) => blockFromSaved(b, zRef.current++));
    setBlocks(built.some((b) => b.placed) ? built : layoutDefault(built));
  }, [savedSession, layoutDefault]);
  const clear = (0, import_react10.useCallback)((keepKey) => {
    setBlocks((prev) => keepKey ? prev.filter((b) => b.key === keepKey) : []);
  }, []);
  (0, import_react10.useEffect)(() => {
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
        return prev.some((b) => b.placed) ? list : layoutDefault(list);
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
        return prev.some((b) => b.placed) ? next : layoutDefault(next);
      });
    }
    function onSwap(e) {
      const d = e.detail;
      const keys = d?.keys ?? [];
      const contexts = d?.contexts ?? [];
      const widths = d?.widths ?? [];
      const built = keys.filter((k) => resolve(k)).map((key, i) => ({
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
  (0, import_react10.useEffect)(() => {
    if (!persist || restoredRef.current) return;
    const saved = savedSession?.blocks;
    if (!saved || saved.length === 0) return;
    if (savedSession?.savedDay && savedSession.savedDay === localDay()) {
      restoreSession();
    } else {
      setCanRestore(true);
    }
  }, []);
  (0, import_react10.useEffect)(() => {
    window.dispatchEvent(new CustomEvent("shift:canvas:state", { detail: { count: blocks.length, canRestore } }));
    return () => {
      window.dispatchEvent(new CustomEvent("shift:canvas:state", { detail: { count: 0, canRestore: false } }));
    };
  }, [blocks.length, canRestore]);
  const firstRun = (0, import_react10.useRef)(true);
  const saveTimer = (0, import_react10.useRef)(null);
  const layoutSignature = blocks.map((b) => `${b.key}:${b.width ?? ""}:${Math.round(b.x)}:${Math.round(b.y)}:${Math.round(b.w)}:${Math.round(b.h)}`).join("|");
  const payload = (0, import_react10.useMemo)(() => layoutSignature ? {
    savedDay: localDay(),
    blocks: layoutSignature.split("|").map((seg) => {
      const [key, width, x, y, w, h] = seg.split(":");
      return { key, ...width ? { width } : {}, x: Number(x), y: Number(y), w: Number(w), h: Number(h) };
    })
  } : null, [layoutSignature]);
  const payloadRef = (0, import_react10.useRef)(payload);
  (0, import_react10.useEffect)(() => {
    payloadRef.current = payload;
  }, [payload]);
  (0, import_react10.useEffect)(() => {
    if (!persist) return;
    if (firstRun.current) {
      firstRun.current = false;
      return;
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
  (0, import_react10.useEffect)(() => {
    if (!persist) return;
    const flush = () => {
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
  const api = (0, import_react10.useMemo)(() => ({
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
    boardWidth
  }), [blocks, addBlock, removeBlock, resizeBlock, snapTo, snapPreview, previewSnap, clearSnapPreview, snapGhost, moveTo, sizeTo, setRect, resizeRow, bringToFront, resolveCollisions, toggleLock, clear, interacting, activeId, boardWidth]);
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(CanvasContext.Provider, { value: api, children });
}

// src/voice/useHeyShift.ts
var import_react11 = require("react");
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
  const [state, setState] = (0, import_react11.useState)("idle");
  const [transcript, setTranscript] = (0, import_react11.useState)("");
  const [isSupported, setIsSupported] = (0, import_react11.useState)(false);
  const recRef = (0, import_react11.useRef)(null);
  const silenceTimerRef = (0, import_react11.useRef)(null);
  const activeRef = (0, import_react11.useRef)(false);
  const accumulatedRef = (0, import_react11.useRef)("");
  const stateRef = (0, import_react11.useRef)("idle");
  const updateState = (0, import_react11.useCallback)((s) => {
    stateRef.current = s;
    setState(s);
    onStateChange?.(s);
  }, [onStateChange]);
  (0, import_react11.useEffect)(() => {
    const SR = getSpeechRecognitionCtor();
    setIsSupported(!!(SR && window.speechSynthesis));
  }, []);
  const getVoice = (0, import_react11.useCallback)(() => {
    const voices = window.speechSynthesis?.getVoices() ?? [];
    return voices.find((v) => v.name.toLowerCase().includes("will")) ?? voices.find((v) => v.name.toLowerCase().includes("daniel")) ?? voices.find((v) => v.lang.startsWith("en") && v.name.toLowerCase().includes("male")) ?? voices.find((v) => v.lang.startsWith("en")) ?? voices[0] ?? null;
  }, []);
  const speak = (0, import_react11.useCallback)(async (text) => {
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
  const cancelSpeech = (0, import_react11.useCallback)(() => {
    window.speechSynthesis?.cancel();
    if (stateRef.current === "speaking") updateState("idle");
  }, [updateState]);
  const resetSilenceTimer = (0, import_react11.useCallback)((text) => {
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
  const startListening = (0, import_react11.useCallback)(() => {
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
  const stopListening = (0, import_react11.useCallback)(() => {
    if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    const rec = recRef.current;
    recRef.current = null;
    rec?.stop();
    activeRef.current = false;
    accumulatedRef.current = "";
    setTranscript("");
    updateState("idle");
  }, [updateState]);
  (0, import_react11.useEffect)(() => {
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
var import_jsx_runtime12 = require("react/jsx-runtime");
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
  return /* @__PURE__ */ (0, import_jsx_runtime12.jsxs)(import_jsx_runtime12.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)("style", { children: `
        @keyframes _sb_pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.35;transform:scale(1.45)} }
        @keyframes _sb_wave  { 0%,100%{transform:scaleY(1)} 50%{transform:scaleY(1.9)} }
        @keyframes _sb_spin  { to{transform:rotate(360deg)} }
      ` }),
    /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
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
          return /* @__PURE__ */ (0, import_jsx_runtime12.jsx)(
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ACCENT_RGB,
  CanvasLauncher,
  CanvasProvider,
  CanvasTransition,
  DEFAULT_H,
  GAP,
  GenerativeView,
  HolographicShine,
  LiveCard,
  LiveStat,
  MIN_H,
  MIN_W,
  PageTransition,
  ScrollGenerateCard,
  ShiftBar,
  ShiftCard,
  TiltCard,
  WIDTH_SPAN,
  tallH,
  useCanvas,
  useGenerate,
  useHeyShift
});
