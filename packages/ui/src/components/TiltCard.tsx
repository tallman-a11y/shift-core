"use client";

import React, { useRef } from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
  type MotionProps,
} from "framer-motion";

export interface TiltCardProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, keyof MotionProps>,
    MotionProps {
  /** Spring stiffness for the tilt. Default 300. */
  stiffness?: number;
  /** Spring damping. Default 28. */
  damping?: number;
  /** Max degrees of X rotation. Default 4. */
  maxRotateX?: number;
  /** Max degrees of Y rotation. Default 7. */
  maxRotateY?: number;
}

/**
 * Drop-in wrapper that adds physics-spring 3-D tilt on mouse move.
 * Renders a `motion.div`; all extra props forwarded.
 */
export function TiltCard({
  children,
  stiffness = 300,
  damping = 28,
  maxRotateX = 4,
  maxRotateY = 7,
  style,
  ...rest
}: TiltCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);

  const rotateY = useSpring(useTransform(rawX, [-1, 1], [-maxRotateY, maxRotateY]), {
    stiffness,
    damping,
  });
  const rotateX = useSpring(useTransform(rawY, [-1, 1], [maxRotateX, -maxRotateX]), {
    stiffness,
    damping,
  });

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
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

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ perspective: 900, rotateX, rotateY, ...style }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
