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
export {
  HolographicShine,
  ScrollGenerateCard,
  ShiftCard,
  TiltCard
};
