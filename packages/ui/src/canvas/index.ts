// Shift living-canvas engine — the "one living canvas" model.
// Wrap routes in <CanvasTransition>, the menu in <CanvasLauncher>, page sections
// in <GenerativeView>, data surfaces in <LiveCard>, metrics in <LiveStat>.
//
// Surface is brand-neutral (`.ash-surface`, driven by --shift-* tokens). Import
// the stylesheet once: `import "@allshift/ui/canvas.css"`.

export { LiveCard } from "./LiveCard";
export type { LiveCardProps } from "./LiveCard";

export { GenerativeView } from "./GenerativeView";
export type { GenerativeViewProps } from "./GenerativeView";

export { LiveStat } from "./LiveStat";
export type { LiveStatProps } from "./LiveStat";

export { useGenerate } from "./useGenerate";
export type { GenPhase, UseGenerateOptions } from "./useGenerate";

export { CanvasTransition } from "./CanvasTransition";
export type { CanvasTransitionProps } from "./CanvasTransition";

export { CanvasLauncher } from "./CanvasLauncher";
export type { CanvasLauncherProps, LauncherGroup, LauncherItem } from "./CanvasLauncher";

export { PageTransition } from "./PageTransition";
export type { PageTransitionProps } from "./PageTransition";

export { ACCENT_RGB } from "./accents";
export type { Accent } from "./accents";
