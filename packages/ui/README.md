# @shift/ui — shared feel, sacred face

The Shift-grade *smoothness, depth, flow, and breathing room* — shared by every product.
It is **brand-neutral**. Your product keeps its exact look, colors, and signature visuals; it
only gains the consistent Shift feel underneath.

## Adopt (per product)

1. Import the layer once (in your root CSS / globals):
   ```css
   @import "@shift/ui/styles.css";
   ```
2. **Map your signature tokens into the `--shift-*` contract** so the shared primitives render in
   *your* identity. Put this in your own globals (NOT in @shift/ui):
   ```css
   :root {
     --shift-accent:    var(--arc);        /* WeldShift's amber welding-arc  */
     --shift-accent-2:  var(--arc-dim);
     --shift-surface:   var(--bg-card);    /* WeldShift steel #0d1520        */
     --shift-surface-2: var(--bg-card);
     --shift-border:    var(--bg-border);  /* WeldShift steel border #1e2d3d */
   }
   ```
   Now `.shift-card` has WeldShift's steel surface + border, lifting with the shared motion.
3. Use the primitives where you want the shared feel: `shift-card`, `shift-lift`,
   `shift-accent-card` (per-card `--accent`), `shift-btn-lift`, `shift-body`/`shift-body-loose`,
   `shift-float`, `shift-stagger`.

## The two laws

1. **Shared feel, sacred face.** This package never carries brand color and never replaces a
   product's signature visuals (sparks canvas, custom borders, ambient backgrounds). Those stay
   100% the product's own.
2. **Additive, never a reskin.** A correct adoption leaves the product looking the same (or better)
   and only *feeling* smoother/more consistent. If anything looks flattened to a generic look,
   it's wrong — revert.

## What's shared vs yours

| Shared (here) | Yours (per-product theme + signature components) |
|---|---|
| easing curves, hover-lift/press timing, float, stagger | color scheme & accents |
| elevation/cushion shadow structure, radius scale | typeface, logo/emblem, iconography |
| spacing rhythm + breathing-room line-heights | ambient bg, glow, particles, signature borders |
| reduced-motion handling, box-sizing reset | density tuning, domain motifs |
