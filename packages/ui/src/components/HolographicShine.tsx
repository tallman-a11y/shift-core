"use client";

import React, { useRef } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useSpring,
} from "framer-motion";

export interface HolographicShineProps {
  /** RGB triplet for the shine tint, e.g. "0,229,240". Default neutral white. */
  rgb?: string;
  /** Intensity 0–1 of the shine overlay. Default 0.18. */
  intensity?: number;
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * Wrapper that paints a cursor-tracked radial holographic shine over its
 * children. Combine with TiltCard for the full effect.
 */
export function HolographicShine({
  rgb = "255,255,255",
  intensity = 0.18,
  children,
  className,
  style,
}: HolographicShineProps) {
  const ref = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 260, damping: 26 });
  const springY = useSpring(mouseY, { stiffness: 260, damping: 26 });

  const background = useMotionTemplate`radial-gradient(260px circle at ${springX}px ${springY}px, rgba(${rgb},${intensity}), transparent 70%)`;

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  }

  return (
    <div
      ref={ref}
      onMouseMove={onMouseMove}
      className={className}
      style={{ position: "relative", ...style }}
    >
      {children}
      <motion.div
        style={{
          position: "absolute",
          inset: 0,
          borderRadius: "inherit",
          background,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
