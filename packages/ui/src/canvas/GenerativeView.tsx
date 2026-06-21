"use client";

import { Children, isValidElement } from "react";
import { motion } from "framer-motion";

export interface GenerativeViewProps {
  children: React.ReactNode;
  /** Per-child stagger in seconds. Default 0.08. */
  stagger?: number;
  /** Delay before the first child appears (s). */
  delay?: number;
  className?: string;
}

/**
 * GenerativeView — wrap a page's top-level sections and they assemble
 * themselves in sequence on load: each child blurs + lifts into place,
 * giving the "the page is building itself for you" feel everywhere.
 *
 * Use at the page root around section blocks. For data cards that should
 * shimmer→live, use <LiveCard generate /> inside.
 */
export function GenerativeView({
  children,
  stagger = 0.08,
  delay = 0,
  className = "",
}: GenerativeViewProps) {
  const items = Children.toArray(children);
  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="show"
      variants={{
        hidden: {},
        show: { transition: { staggerChildren: stagger, delayChildren: delay } },
      }}
    >
      {items.map((child, i) =>
        isValidElement(child) ? (
          <motion.div
            key={child.key ?? i}
            variants={{
              hidden: { opacity: 0, y: 16, filter: "blur(6px)" },
              show: {
                opacity: 1,
                y: 0,
                filter: "blur(0px)",
                transition: { type: "spring", stiffness: 260, damping: 28 },
              },
            }}
          >
            {child}
          </motion.div>
        ) : (
          child
        ),
      )}
    </motion.div>
  );
}

export default GenerativeView;
