// React components
export { ShiftCard } from "./components/ShiftCard";
export type { ShiftCardProps } from "./components/ShiftCard";

export { TiltCard } from "./components/TiltCard";
export type { TiltCardProps } from "./components/TiltCard";

export { HolographicShine } from "./components/HolographicShine";
export type { HolographicShineProps } from "./components/HolographicShine";

export { ScrollGenerateCard } from "./components/ScrollGenerateCard";
export type { ScrollGenerateCardProps } from "./components/ScrollGenerateCard";

// Living-canvas engine — the "one living canvas" model.
// Styles: import "@allshift/ui/canvas.css" once in your global CSS.
export * from "./canvas";

// Voice / Hey Shift pipeline
export { useHeyShift, ShiftBar } from './voice/index.js';
export type { ShiftBarState, HeyShiftConfig, HeyShiftReturn, ShiftBarProps } from './voice/index.js';

// Shift Concierge — Will-first onboarding (greets, guides, fills the form).
// Styles live in canvas.css (.ash-cg-*). See shift-core/docs/WILL_FIRST_UI.md.
export * from "./concierge";
