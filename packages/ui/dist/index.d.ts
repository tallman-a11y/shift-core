import * as react from 'react';
import react__default, { ReactNode, CSSProperties } from 'react';
import { MotionProps } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface ShiftCardProps extends MotionProps {
    children: ReactNode;
    className?: string;
    style?: CSSProperties;
    blur?: number;
}
declare function ShiftCard({ children, className, blur, style, ...props }: ShiftCardProps): react.JSX.Element;

interface TiltCardProps extends Omit<react__default.HTMLAttributes<HTMLDivElement>, keyof MotionProps>, MotionProps {
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
declare function TiltCard({ children, stiffness, damping, maxRotateX, maxRotateY, style, ...rest }: TiltCardProps): react__default.JSX.Element;

interface HolographicShineProps {
    /** RGB triplet for the shine tint, e.g. "0,229,240". Default neutral white. */
    rgb?: string;
    /** Intensity 0–1 of the shine overlay. Default 0.18. */
    intensity?: number;
    children?: react__default.ReactNode;
    className?: string;
    style?: react__default.CSSProperties;
}
/**
 * Wrapper that paints a cursor-tracked radial holographic shine over its
 * children. Combine with TiltCard for the full effect.
 */
declare function HolographicShine({ rgb, intensity, children, className, style, }: HolographicShineProps): react__default.JSX.Element;

type Phase = "idle" | "skeleton" | "live";
interface ScrollGenerateCardProps {
    /**
     * The real card content. Rendered in the "live" phase.
     * Passed the current phase so content can animate itself in.
     */
    children: (phase: Phase) => react__default.ReactNode;
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
declare function ScrollGenerateCard({ children, skeletonDuration, delay, margin, className, skeletonRows, skeletonWidths, }: ScrollGenerateCardProps): react__default.JSX.Element;

type Accent = "teal" | "blue" | "purple" | "magenta" | "green" | "orange" | "neutral";
declare const ACCENT_RGB: Record<Accent, string>;

interface LiveCardProps {
    children: React.ReactNode;
    /** Accent color driving shine + top line + glow. Default "neutral" (uses --shift-accent if "brand"). */
    accent?: Accent | "brand";
    /** Enable 3D tilt-on-hover physics. Default true. */
    tilt?: boolean;
    /** Enable holographic cursor shine. Default true. */
    shine?: boolean;
    /** Generate-in lifecycle: skeleton → live. Default true. */
    generate?: boolean;
    /** Stagger order for generate-in (multiplied into enterDelay). */
    index?: number;
    /** Trigger generation on scroll-into-view or immediately. */
    trigger?: "view" | "mount";
    /** Number of shimmer rows in the skeleton phase. */
    skeletonRows?: number;
    /** Lit top accent line when card completes. Default true. */
    topLine?: boolean;
    /** Extra classes on the card surface. */
    className?: string;
    /** Min height to reserve while idle (prevents layout shift). */
    minHeight?: number;
    onClick?: () => void;
}
/**
 * LiveCard — the universal living surface.
 *
 * Combines: glass depth, 3D tilt physics, holographic cursor shine, and the
 * generate-in lifecycle (skeleton → live). Wrap any content in this and it
 * becomes part of the breathing, self-assembling UI. Surface is brand-neutral
 * (`.ash-surface`, driven by --shift-* tokens); accent is decorative or "brand".
 */
declare function LiveCard({ children, accent, tilt, shine, generate, index, trigger, skeletonRows, topLine, className, minHeight, onClick, }: LiveCardProps): react.JSX.Element;

interface GenerativeViewProps {
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
declare function GenerativeView({ children, stagger, delay, className, }: GenerativeViewProps): react.JSX.Element;

interface LiveStatProps {
    label: string;
    /** Numeric value to count up to. Omit for string-only display. */
    value?: number;
    /** Pre-formatted string (overrides count-up). */
    display?: string;
    prefix?: string;
    suffix?: string;
    sub?: string;
    icon?: LucideIcon;
    /** Decorative accent, or "brand" to use --shift-accent-rgb. */
    accent?: Accent | "brand";
    /** Count-up duration ms. */
    duration?: number;
    index?: number;
}
/**
 * LiveStat — a metric tile that counts up on mount with a glass surface and
 * accent top line. The atomic unit of every dashboard / overview header.
 */
declare function LiveStat({ label, value, display, prefix, suffix, sub, icon: Icon, accent, duration, index, }: LiveStatProps): react.JSX.Element;

type GenPhase = "idle" | "skeleton" | "live";
interface UseGenerateOptions {
    /** Delay before the skeleton appears (ms). Lets earlier cards generate first. */
    enterDelay?: number;
    /** How long the skeleton shimmer holds before content materializes (ms). */
    skeletonMs?: number;
    /** Trigger on scroll-into-view (default) or immediately on mount. */
    trigger?: "view" | "mount";
    /** IntersectionObserver margin when trigger = "view". */
    margin?: string;
    /** Re-run every time it enters view, instead of once. */
    repeat?: boolean;
}
/**
 * The core "generate-in" lifecycle every living card/section shares:
 *   idle (reserves layout) → skeleton (shimmer) → live (real content).
 *
 * This is what makes the whole product feel like it is building itself in
 * real time — the same heartbeat on the landing page and inside the app.
 */
declare function useGenerate<T extends HTMLElement = HTMLDivElement>(opts?: UseGenerateOptions): {
    ref: react.RefObject<T | null>;
    phase: GenPhase;
    isLive: boolean;
};

/**
 * CanvasTransition — the heart of the "one living canvas" model.
 *
 * The app is not N pages you travel between. It is a single stage. Every
 * route's content is *generated onto the canvas* — the previous view fades
 * out and the requested view assembles itself in real time. The underlying
 * Next.js routes remain as the behind-the-scenes resources the canvas draws
 * from; this wrapper turns each navigation into a generation event.
 *
 * First visit to a view per login session = full generate-in (blur→lift,
 * "Shift is assembling" sheen). Revisits in the same session are instant, so
 * power users aren't slowed down. The seen-set resets on each login, so every
 * session opens with that real-time-building feel.
 *
 * Brand-neutral: the assembling indicator uses the product's --shift-accent.
 */
interface CanvasTransitionProps {
    children: React.ReactNode;
    /** Map of first-path-segment → friendly label for the assembling pill. */
    labels?: Record<string, string>;
    /** sessionStorage key for the per-login seen-set. Default "ash-seen-views". */
    seenKey?: string;
    /** Product name shown in the pill, e.g. "Shift is assembling …". Default "Shift". */
    assemblerName?: string;
    /** Treat every navigation as a first visit — always play the full generate-in
     *  (blur→lift + assembling sheen). Use for demos/tours so each view visibly
     *  assembles onto the canvas every time. Default false. */
    alwaysGenerate?: boolean;
}
declare function CanvasTransition({ children, labels, seenKey, assemblerName, alwaysGenerate, }: CanvasTransitionProps): react.JSX.Element;

interface LauncherItem {
    href: string;
    label: string;
    icon: LucideIcon;
    desc: string;
}
interface LauncherGroup {
    label: string;
    accent: Accent;
    items: LauncherItem[];
}
interface CanvasLauncherProps {
    /** Every resource the canvas can draw from, grouped + color-coded. */
    groups: LauncherGroup[];
    /** Header title. */
    title?: string;
    /** Header subtitle. */
    subtitle?: string;
    /** Trigger button label (hidden under lg). */
    buttonLabel?: string;
    /** Keyboard shortcut letter (with ⌘/Ctrl). Default "j". */
    hotkey?: string;
    /** Window event name that also opens the launcher. Default "shift:open-launcher". */
    openEvent?: string;
    /** Override navigation. Default router.push. */
    onNavigate?: (href: string) => void;
}
/**
 * CanvasLauncher — the single menu button for the whole OS.
 *
 * Opens a full-screen generative grid of every resource the canvas can draw
 * from. Selecting one doesn't take you to a page — it routes, and
 * CanvasTransition brings that view to the canvas, assembling it live. The
 * launcher is how you "see all the background pages" without ever leaving the
 * one stage.
 */
declare function CanvasLauncher({ groups, title, subtitle, buttonLabel, hotkey, openEvent, onNavigate, }: CanvasLauncherProps): react.JSX.Element;

interface PageTransitionProps {
    children: ReactNode;
    className?: string;
}
/**
 * PageTransition — directional slide based on navigation depth. Animates
 * left-to-right (deeper) or right-to-left (back). Lighter-weight alternative
 * to CanvasTransition for apps that keep real page navigation.
 */
declare function PageTransition({ children, className }: PageTransitionProps): react.JSX.Element;

export { ACCENT_RGB, type Accent, CanvasLauncher, type CanvasLauncherProps, CanvasTransition, type CanvasTransitionProps, type GenPhase, GenerativeView, type GenerativeViewProps, HolographicShine, type HolographicShineProps, type LauncherGroup, type LauncherItem, LiveCard, type LiveCardProps, LiveStat, type LiveStatProps, PageTransition, type PageTransitionProps, ScrollGenerateCard, type ScrollGenerateCardProps, ShiftCard, type ShiftCardProps, TiltCard, type TiltCardProps, type UseGenerateOptions, useGenerate };
