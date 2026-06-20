import * as React from 'react';
import React__default, { ReactNode, CSSProperties } from 'react';
import { MotionProps } from 'framer-motion';

interface ShiftCardProps extends MotionProps {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
    blur?: number;
}
declare function ShiftCard({ children, className, blur, style, ...props }: ShiftCardProps): React.JSX.Element;

interface TiltCardProps extends Omit<React__default.HTMLAttributes<HTMLDivElement>, keyof MotionProps>, MotionProps {
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
declare function TiltCard({ children, stiffness, damping, maxRotateX, maxRotateY, style, ...rest }: TiltCardProps): React__default.JSX.Element;

interface HolographicShineProps {
    /** RGB triplet for the shine tint, e.g. "0,229,240". Default neutral white. */
    rgb?: string;
    /** Intensity 0–1 of the shine overlay. Default 0.18. */
    intensity?: number;
    children?: React__default.ReactNode;
    className?: string;
    style?: React__default.CSSProperties;
}
/**
 * Wrapper that paints a cursor-tracked radial holographic shine over its
 * children. Combine with TiltCard for the full effect.
 */
declare function HolographicShine({ rgb, intensity, children, className, style, }: HolographicShineProps): React__default.JSX.Element;

type Phase = "idle" | "skeleton" | "live";
interface ScrollGenerateCardProps {
    /**
     * The real card content. Rendered in the "live" phase.
     * Passed the current phase so content can animate itself in.
     */
    children: (phase: Phase) => React__default.ReactNode;
    /**
     * Milliseconds of skeleton phase before switching to live. Default 360.
     */
    skeletonDuration?: number;
    /**
     * Stagger delay in ms before the skeleton phase starts (for grid staggering). Default 0.
     */
    delay?: number;
    /**
     * IntersectionObserver margin. Default "-60px 0px".
     */
    margin?: string;
    className?: string;
    /** Skeleton placeholder rows to show. Default 4. */
    skeletonRows?: number;
    /** Widths (in %) of each skeleton row. Deterministic to avoid hydration mismatch. */
    skeletonWidths?: number[];
}
/**
 * Scroll-triggered three-phase card:
 *   idle (off-screen invisible) → skeleton (shimmer placeholder) → live (real content)
 *
 * Usage:
 * ```tsx
 * <ScrollGenerateCard delay={index * 80}>
 *   {(phase) => <MyCard className={phase === "live" ? "opacity-100" : "opacity-0"} />}
 * </ScrollGenerateCard>
 * ```
 */
declare function ScrollGenerateCard({ children, skeletonDuration, delay, margin, className, skeletonRows, skeletonWidths, }: ScrollGenerateCardProps): React__default.JSX.Element;

export { HolographicShine, type HolographicShineProps, ScrollGenerateCard, type ScrollGenerateCardProps, ShiftCard, type ShiftCardProps, TiltCard, type TiltCardProps };
