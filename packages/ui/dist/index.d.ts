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

declare const MAX_WINDOWS = 4;
declare const MAX_WINDOWS_PHONE = 2;
type CanvasMode = "wide" | "phone";
type CanvasLimits = {
    wide?: number;
    phone?: number;
};
declare const DUO_FOCUS_SHARE = 0.62;
declare function detectMode(innerWidth: number, innerHeight: number, coarsePointer: boolean): CanvasMode;
declare function maxWindowsFor(mode: CanvasMode, limits?: CanvasLimits): number;

declare const GAP = 20;
declare const DEFAULT_H = 420;
declare const MIN_W = 240;
declare const MIN_H = 200;
type BlockWidth = "sm" | "md" | "lg" | "xl";
declare const WIDTH_SPAN: Record<BlockWidth, number>;
type ResolveBlock = (key: string) => {
    defaultWidth?: BlockWidth;
} | null | undefined;
interface CanvasBlock {
    id: string;
    key: string;
    context?: unknown;
    locked?: boolean;
    x: number;
    y: number;
    w: number;
    h: number;
    z: number;
    placed?: boolean;
    width?: BlockWidth;
}
interface SavedBlock {
    key: string;
    width?: BlockWidth;
    x?: number;
    y?: number;
    w?: number;
    h?: number;
}
type SnapLayout = "full" | "left" | "right" | "top" | "bottom" | "tl" | "tr" | "bl" | "br";
type SnapBox = {
    left: number;
    top: number;
    width: number;
    height: number;
};
type SnapPreview = {
    rect: SnapBox;
    locked: SnapBox[];
    others: SnapBox[];
    blocked: boolean;
};
type SnapGhost = {
    target: {
        x: number;
        y: number;
        w: number;
        h: number;
    };
    others: {
        x: number;
        y: number;
        w: number;
        h: number;
    }[];
} | null;
interface CanvasApi {
    blocks: CanvasBlock[];
    addBlock: (key: string, context?: unknown, width?: BlockWidth, append?: boolean) => void;
    removeBlock: (id: string) => void;
    resizeBlock: (id: string, width: BlockWidth) => void;
    snapTo: (id: string, layout: SnapLayout) => void;
    snapPreview: (id: string, layout: SnapLayout) => SnapPreview;
    previewSnap: (id: string, layout: SnapLayout) => void;
    clearSnapPreview: () => void;
    snapGhost: SnapGhost;
    moveTo: (id: string, x: number, y: number) => void;
    sizeTo: (id: string, w: number, h: number) => void;
    setRect: (id: string, r: {
        x: number;
        y: number;
        w: number;
        h: number;
    }) => void;
    resizeRow: (id: string, x: number, w: number, h: number, origin: {
        id: string;
        x: number;
        y: number;
        w: number;
        h: number;
    }[]) => void;
    bringToFront: (id: string) => void;
    resolveCollisions: (id: string) => void;
    toggleLock: (id: string) => void;
    clear: (keepKey?: string) => void;
    interacting: boolean;
    setInteracting: (v: boolean) => void;
    activeId: string | null;
    setActiveId: (id: string | null) => void;
    boardWidth: number;
    mode: CanvasMode;
    maxBlocks: number;
}
declare function useCanvas(): CanvasApi;
declare function tallH(boardH: number): number;
declare function CanvasProvider({ children, resolveBlock, initialKeys, initialLayout, addKey, persist, savedSession, limits, }: {
    children: ReactNode;
    resolveBlock: ResolveBlock;
    initialKeys?: string[];
    initialLayout?: SavedBlock[];
    addKey?: string | null;
    persist?: boolean;
    limits?: CanvasLimits;
    savedSession?: {
        blocks?: SavedBlock[];
        savedDay?: string | null;
    };
}): react.JSX.Element;

type ShiftBarState = 'idle' | 'wake' | 'listening' | 'thinking' | 'speaking' | 'error';
interface HeyShiftConfig {
    wakeWord?: string;
    language?: string;
    silenceMs?: number;
    onCommand?: (text: string) => Promise<string | void>;
    onStateChange?: (state: ShiftBarState) => void;
}
interface HeyShiftReturn {
    state: ShiftBarState;
    transcript: string;
    startListening: () => void;
    stopListening: () => void;
    speak: (text: string) => Promise<void>;
    cancelSpeech: () => void;
    isSupported: boolean;
}
declare function useHeyShift(config?: HeyShiftConfig): HeyShiftReturn;

interface ShiftBarProps {
    state: ShiftBarState;
    /** Number of dots. Default 3 for wave effect. */
    dots?: number;
    /** Dot size in px. Default 7. */
    size?: number;
    className?: string;
}
declare function ShiftBar({ state, dots, size, className }: ShiftBarProps): react.JSX.Element;

type Moment = "landing" | "askName" | "meet" | "fill" | "done";
type MicChoice = "unset" | "voice" | "text" | "denied";
type FieldType = "text" | "number" | "money" | "tel" | "email" | "select" | "multi";
interface FieldOption {
    value: string;
    label: string;
    description?: string;
}
interface FieldSpec {
    id: string;
    label: string;
    type: FieldType;
    options?: FieldOption[];
    required?: boolean;
    /** One line Will can use to explain the field ("Rough number is fine"). */
    hint?: string;
}
interface FieldSnapshot extends FieldSpec {
    value: unknown;
}
interface FillRequest {
    id: string;
    value: unknown;
}
type FillResult = {
    id: string;
    ok: true;
    value: unknown;
} | {
    id: string;
    ok: false;
    reason: string;
};
interface Line {
    id: string;
    who: "will" | "user";
    text: string;
    at: number;
}
interface ConciergeState {
    moment: Moment;
    name: string | null;
    micChoice: MicChoice;
    muted: boolean;
    voiceUnlocked: boolean;
    lines: Line[];
    busy: boolean;
}
type ConciergeEvent = {
    type: "unlockVoice";
} | {
    type: "chooseMic";
    choice: MicChoice;
} | {
    type: "setName";
    name: string;
} | {
    type: "will";
    text: string;
    id?: string;
} | {
    type: "user";
    text: string;
    id?: string;
} | {
    type: "moment";
    moment: Moment;
} | {
    type: "mute";
    muted: boolean;
} | {
    type: "busy";
    busy: boolean;
};
declare const MAX_LINES = 40;
declare function initialConciergeState(moment?: Moment): ConciergeState;
declare function nextLineId(): string;
declare function conciergeReducer(state: ConciergeState, ev: ConciergeEvent): ConciergeState;
declare function greetingForHour(hour: number): "Good morning" | "Good afternoon" | "Good evening";
declare function cleanName(raw: string): string | null;
/** "$40,000" | "40k" | "about 40 thousand" | "1.2m" | "forty thousand" → 40000 … */
declare function parseMoney(input: unknown): number | null;
/**
 * Match a spoken/typed value to one option: exact value or label first, then
 * word-stem matches against label + value ("flipping" → Fix & Flip), then the
 * description ("airbnb" → Short-Term Rental). Ties are refused — Will asks.
 */
declare function matchOption(options: FieldOption[], value: unknown): FieldOption | null;
/** Coerce a value Will proposed into what the field accepts, or say why not. */
declare function coerceFill(spec: FieldSpec, value: unknown): FillResult;
/** Coerce a batch against the live snapshot; unknown ids fail instead of throwing. */
declare function coerceFills(fields: FieldSnapshot[], fills: FillRequest[]): FillResult[];
/** The field list as the model sees it: ids, labels, choices, current values. */
declare function snapshotForPrompt(fields: FieldSnapshot[]): string;
/** "I put Kansas City under markets and Fix & Flip under strategy." */
declare function summarizeFills(fields: FieldSnapshot[], results: FillResult[]): string;
/** Does this Will line expect an answer? (Opens the mic window after speaking.) */
declare function endsWithQuestion(text: string): boolean;

interface ConciergeNav {
    stepIndex: number;
    stepTitle: string;
    stepCount: number;
    canAdvance: boolean;
    next: () => void;
    prev: () => void;
}
interface Entry {
    spec: FieldSpec;
    get: () => unknown;
    set: (value: unknown) => void;
}
interface ConciergeFieldsValue {
    register: (entry: Entry) => void;
    unregister: (id: string) => void;
    snapshot: () => FieldSnapshot[];
    /** Coerce + write Will's fills into the registered fields. Returns what landed. */
    apply: (fills: FillRequest[]) => FillResult[];
    /** Ids Will filled in the last ~2 s (drives the fill highlight). */
    justFilled: ReadonlySet<string>;
    nav: ConciergeNav | null;
    setNav: (nav: ConciergeNav | null) => void;
    /** Bumps whenever a field registers/unregisters or the step changes. */
    version: number;
}
declare const FILL_HIGHLIGHT_MS = 2000;
declare function ConciergeFields({ children }: {
    children: ReactNode;
}): react.JSX.Element;
declare function useConciergeFields(): ConciergeFieldsValue | null;
interface ConciergeFieldProps {
    spec: FieldSpec;
    value: unknown;
    onChange: (value: unknown) => void;
    children: ReactNode;
    className?: string;
}
declare function ConciergeField({ spec, value, onChange, children, className }: ConciergeFieldProps): react.JSX.Element;
/** The wizard publishes its step state so Will can narrate and move it. */
declare function useConciergeNav(nav: ConciergeNav | null): void;

/** Every Shift native shell stamps "<Product>ShiftApp/<ver>" into the UA. */
declare function isShiftShell(ua?: string): boolean;
interface AudioGate {
    /** True once audio may play (a gesture happened, or we're in a shell). */
    unlocked: boolean;
    shell: boolean;
}
declare function useAudioGate(onUnlock?: () => void): AudioGate;

interface ListenerHandlers {
    onText: (text: string, final: boolean) => void;
    onEnd: () => void;
    onError: (code: string) => void;
}
interface Listener {
    start: (h: ListenerHandlers) => void;
    stop: () => void;
}
declare function webSpeechSupported(): boolean;
declare const SILENCE_MS = 1800;
declare const WINDOW_MS = 15000;
declare function webSpeechListener(lang?: string): Listener | null;
/** Ask for the microphone once, in response to the user's tap. Resolves granted/denied. */
declare function requestMicrophone(): Promise<boolean>;

interface StepContext {
    stepTitle: string;
    stepIndex: number;
    stepCount: number;
    name: string | null;
}
interface ConciergeScript {
    product: {
        name: string;
        noun: string;
    };
    lines: {
        landing: (ctx: {
            greeting: string;
        }) => string;
        askName: () => string;
        meet: (name: string) => string;
        /** Return null to say nothing on a step. */
        step: (ctx: StepContext) => string | null;
        done: (name: string | null) => string;
        micDenied: () => string;
        heardNothing: () => string;
    };
}
interface AskRequest {
    message: string;
    moment: Moment;
    name: string | null;
    history: Line[];
    fields: FieldSnapshot[];
    nav: {
        stepTitle: string;
        stepIndex: number;
        stepCount: number;
    } | null;
}
interface AskResult {
    text: string;
    fills?: FillRequest[];
    name?: string;
    nav?: "next" | "prev";
    explain?: string;
}
interface ConciergeAdapters {
    /** Speak a line as Will; resolve when done (or when speech is unavailable). */
    speak: (text: string) => Promise<void>;
    cancelSpeech: () => void;
    ask: (req: AskRequest) => Promise<AskResult>;
    /** Swap the speech-to-text engine (defaults to Web Speech). */
    listen?: () => Listener | null;
    /** Persist the name the moment it is captured (e.g. auth user metadata). */
    onName?: (name: string) => void | Promise<void>;
    requestMic?: () => Promise<boolean>;
}
interface UseConciergeOptions {
    script: ConciergeScript;
    adapters: ConciergeAdapters;
    /** Off = renders nothing, says nothing (feature flag). */
    enabled?: boolean;
    initialMoment?: Moment;
    /** The registered field that holds the user's name (filled when captured). */
    nameFieldId?: string;
    fields?: ConciergeFieldsValue | null;
    /** Start muted (voice off) — the per-device "quiet" preference. */
    initialMuted?: boolean;
    /** Already known (returning user, auth metadata) — skips the name moment. */
    initialName?: string | null;
    hour?: number;
}
interface UseConciergeReturn {
    state: ConciergeState;
    barState: ShiftBarState;
    input: string;
    setInput: (v: string) => void;
    /** Send the box (or the given text) to Will. */
    send: (text?: string) => Promise<void>;
    /** Tap the mic: start/stop listening (asks permission on first use). */
    onMic: () => void;
    chooseMic: (choice: MicChoice) => void;
    toggleMute: () => void;
    /** Show the two-choice permission card? */
    showPermission: boolean;
    unlocked: boolean;
    /** Move the conversation: askName (after signup), done (after save). */
    startMoment: (m: Moment) => void;
    /** Have Will say a line (scripted by the product) — text now, voice when allowed. */
    say: (text: string) => void;
    listening: boolean;
    speaking: boolean;
}
declare function useConcierge(opts: UseConciergeOptions): UseConciergeReturn;

interface ShiftConciergeProps {
    lines: Line[];
    barState: ShiftBarState;
    input: string;
    onInputChange: (v: string) => void;
    onSend: () => void;
    onMic: () => void;
    micChoice: MicChoice;
    onChooseMic: (c: MicChoice) => void;
    showPermission: boolean;
    muted: boolean;
    onToggleMute: () => void;
    busy?: boolean;
    /** auto: phone→dock, wide→column. auto-float: phone→dock, wide→floating card (landing pages). */
    layout?: "auto" | "auto-float" | "dock" | "column" | "float";
    speakerName?: string;
    placeholder?: string;
    /** The permission card copy (product supplies; keep it one short sentence). */
    permissionText?: string;
    /** Lines shown in the dock (phones). Column shows the whole transcript. */
    dockLines?: number;
    /** Live-type Will's latest line (off for reduced motion). */
    typewriter?: boolean;
    className?: string;
}
declare function ShiftConcierge(props: ShiftConciergeProps): react.JSX.Element;

export { ACCENT_RGB, type Accent, type AskRequest, type AskResult, type AudioGate, type BlockWidth, type CanvasBlock, CanvasLauncher, type CanvasLauncherProps, type CanvasLimits, type CanvasMode, CanvasProvider, CanvasTransition, type CanvasTransitionProps, type ConciergeAdapters, type ConciergeEvent, ConciergeField, type ConciergeFieldProps, ConciergeFields, type ConciergeFieldsValue, type ConciergeNav, type ConciergeScript, type ConciergeState, DEFAULT_H, DUO_FOCUS_SHARE, FILL_HIGHLIGHT_MS, type FieldOption, type FieldSnapshot, type FieldSpec, type FieldType, type FillRequest, type FillResult, GAP, type GenPhase, GenerativeView, type GenerativeViewProps, type HeyShiftConfig, type HeyShiftReturn, HolographicShine, type HolographicShineProps, type LauncherGroup, type LauncherItem, type Line, type Listener, type ListenerHandlers, LiveCard, type LiveCardProps, LiveStat, type LiveStatProps, MAX_LINES, MAX_WINDOWS, MAX_WINDOWS_PHONE, MIN_H, MIN_W, type MicChoice, type Moment, PageTransition, type PageTransitionProps, type ResolveBlock, SILENCE_MS, type SavedBlock, ScrollGenerateCard, type ScrollGenerateCardProps, ShiftBar, type ShiftBarProps, type ShiftBarState, ShiftCard, type ShiftCardProps, ShiftConcierge, type ShiftConciergeProps, type SnapBox, type SnapGhost, type SnapLayout, type SnapPreview, type StepContext, TiltCard, type TiltCardProps, type UseConciergeOptions, type UseConciergeReturn, type UseGenerateOptions, WIDTH_SPAN, WINDOW_MS, cleanName, coerceFill, coerceFills, conciergeReducer, detectMode, endsWithQuestion, greetingForHour, initialConciergeState, isShiftShell, matchOption, maxWindowsFor, nextLineId, parseMoney, requestMicrophone, snapshotForPrompt, summarizeFills, tallH, useAudioGate, useCanvas, useConcierge, useConciergeFields, useConciergeNav, useGenerate, useHeyShift, webSpeechListener, webSpeechSupported };
