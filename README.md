# shift-core — the Shift family shared foundation

One Brain, many specialized bodies. This monorepo publishes the versioned packages every Shift
product runs off of, so the whole family is a single intelligent entity at one quality floor —
while each product stays its own most-advanced, domain-specialized self.

See the canonical plan in memory: **project_shift_family_brain** (architecture + Universe/Forge)
and **project_shift_core_spec** (technical blueprint, adoption order, sacred-signatures rule).

## Packages

- **`@shift/ui`** — the shared *FEEL* layer (motion, elevation, spacing/breathing-room, interaction
  patterns). THEMED, not a uniform skin: brand-neutral, driven by per-product `--shift-*` tokens.
  Each product maps its own signature tokens in (WeldShift `--arc`, RealShift `--card-bg`, etc.).
- **`@shift/infra`** *(next)* — reliability: schema-drift guard, error observability, PWA never-cache-HTML
  service worker, Tailwind-v4 spacing-bug guardrails baked in.
- **`@shift/core`** *(Wave 2)* — the Brain: reasoning loop, tool registry + universal tools, memory
  spine (now incl. semantic memory + RAG via embeddings), proactive engine shell, persona/voice.
- **`create-shift-app`** *(later)* — the scaffold = Genome v1 / the Forge seed.

## The two laws

1. **Shared feel, sacred face.** The base is the *smoothness/flow/quality* — never the appearance.
   A product's signature visuals (WeldShift's sparks canvas + steel borders, etc.) are untouchable.
2. **Additive, never a reskin.** Adopting a package raises the floor; it never flattens identity.
   A correct migration leaves the product looking the same (or better), only feeling smoother.

## Adoption order

RealShift (seed) → **LendShift (1st)** → **ShapeShift (2nd)** → SurgeShift → GSO → SugarShift →
FinShift → **WeldShift (last — live, fully rehearsed)**.

## Topology (proposed)

Publish `@shift/*` to a private registry (GitHub Packages); each product `npm install`s and pins a
version, staying an independent repo. A small Shift Core *service* (cross-product identity + graph +
learning-model hosting) comes in Wave 3.
