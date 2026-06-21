import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  splitting: false,
  sourcemap: false,
  clean: true,
  external: ["react", "react-dom", "framer-motion", "lucide-react", "next", "next/navigation"],
  // This is a client-only UI library (framer-motion, hooks, next/navigation). tsup
  // strips per-file "use client" directives when bundling, so re-assert it on the
  // bundle — otherwise consumers' SERVER components crash with
  // "createMotionComponent() from the server".
  banner: { js: '"use client";' },
});
