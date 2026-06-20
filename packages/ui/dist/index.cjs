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
  HolographicShine: () => HolographicShine,
  ScrollGenerateCard: () => ScrollGenerateCard,
  ShiftCard: () => ShiftCard,
  TiltCard: () => TiltCard
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  HolographicShine,
  ScrollGenerateCard,
  ShiftCard,
  TiltCard
});
