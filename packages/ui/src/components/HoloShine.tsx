'use client';
import { motion, useMotionTemplate, useMotionValue, useTransform } from 'framer-motion';
import { type ReactNode, useRef, type MouseEvent } from 'react';

export interface HoloShineProps {
  children: ReactNode;
  className?: string;
  opacity?: number;
}

export function HoloShine({ children, className = '', opacity = 0.18 }: HoloShineProps) {
  const ref = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);

  const xPct = useTransform(x, [0, 1], [0, 100]);
  const yPct = useTransform(y, [0, 1], [0, 100]);
  const shine = useMotionTemplate`radial-gradient(circle at ${xPct}% ${yPct}%, var(--shift-accent) 0%, transparent 55%)`;

  function onMouseMove(e: MouseEvent<HTMLDivElement>) {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width);
    y.set((e.clientY - rect.top) / rect.height);
  }

  function onMouseLeave() {
    x.set(0.5);
    y.set(0.5);
  }

  return (
    <div ref={ref} className={`relative ${className}`} onMouseMove={onMouseMove} onMouseLeave={onMouseLeave}>
      {children}
      <motion.div
        aria-hidden
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          pointerEvents: 'none',
          background: shine,
          opacity,
          mixBlendMode: 'screen',
        }}
      />
    </div>
  );
}
