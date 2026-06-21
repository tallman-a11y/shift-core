"use client";

import { motion } from "framer-motion";
import { usePathname } from "next/navigation";
import { useRef, type ReactNode } from "react";

export interface PageTransitionProps {
  children: ReactNode;
  className?: string;
}

/**
 * PageTransition — directional slide based on navigation depth. Animates
 * left-to-right (deeper) or right-to-left (back). Lighter-weight alternative
 * to CanvasTransition for apps that keep real page navigation.
 */
export function PageTransition({ children, className }: PageTransitionProps) {
  const pathname = usePathname();
  const depthRef = useRef(0);
  const dirRef = useRef(0); // 0 = initial load (fade only), 1 = deeper, -1 = back

  const depth = pathname.split("/").filter(Boolean).length;
  if (depth !== depthRef.current) {
    dirRef.current = dirRef.current === 0 ? 0 : depth >= depthRef.current ? 1 : -1;
    depthRef.current = depth;
  }

  const dir = dirRef.current;

  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, x: dir * 22, filter: "blur(3px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 400, damping: 34 }}
      className={className ?? "flex flex-col flex-1 min-h-0"}
    >
      {children}
    </motion.div>
  );
}

export default PageTransition;
