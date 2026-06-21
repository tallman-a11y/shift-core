// Decorative accent palette for the canvas engine. These are brand-neutral
// group/category colors (not a product's signature accent) — they give the
// living grid its color-coded variety and render fine on any dark theme.

export type Accent =
  | "teal"
  | "blue"
  | "purple"
  | "magenta"
  | "green"
  | "orange"
  | "neutral";

export const ACCENT_RGB: Record<Accent, string> = {
  teal: "0,229,240",
  blue: "59,139,255",
  purple: "168,124,255",
  magenta: "232,48,248",
  green: "0,224,128",
  orange: "255,110,48",
  neutral: "255,255,255",
};
