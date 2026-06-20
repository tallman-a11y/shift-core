'use client';
import { motion, useInView, type Variants } from 'framer-motion';
import { type ReactNode, useRef } from 'react';

export type RevealVariant = 'fade-up' | 'fade-in' | 'slide-left' | 'slide-right' | 'scale';

const VARIANTS: Record<RevealVariant, Variants> = {
  'fade-up':    { hidden: { opacity: 0, y: 28 },    visible: { opacity: 1, y: 0 } },
  'fade-in':    { hidden: { opacity: 0 },            visible: { opacity: 1 } },
  'slide-left': { hidden: { opacity: 0, x: -28 },   visible: { opacity: 1, x: 0 } },
  'slide-right':{ hidden: { opacity: 0, x: 28 },    visible: { opacity: 1, x: 0 } },
  'scale':      { hidden: { opacity: 0, scale: 0.92 }, visible: { opacity: 1, scale: 1 } },
};

const EASE = [0.22, 1, 0.36, 1] as const;

export interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  variant?: RevealVariant;
  delay?: number;
  duration?: number;
  once?: boolean;
}

export function ScrollReveal({
  children,
  className = '',
  variant = 'fade-up',
  delay = 0,
  duration = 0.5,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once, margin: '-8% 0px' });

  return (
    <motion.div
      ref={ref}
      className={className}
      variants={VARIANTS[variant]}
      initial="hidden"
      animate={inView ? 'visible' : 'hidden'}
      transition={{ duration, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}
