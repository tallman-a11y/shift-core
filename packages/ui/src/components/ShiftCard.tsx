'use client';
import { motion, type MotionProps } from 'framer-motion';
import { type CSSProperties, type ReactNode } from 'react';

export interface ShiftCardProps extends MotionProps {
  children: ReactNode;
  className?: string;
  style?: CSSProperties;
  blur?: number;
}

export function ShiftCard({ children, className = '', blur = 12, style, ...props }: ShiftCardProps) {
  return (
    <motion.div
      className={`shift-card ${className}`}
      style={{
        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        ...style,
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
