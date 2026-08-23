import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const here = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * The demo consumes the package by NAME, aliased to source.
 *
 * That is the point of it: if the demo needs a symbol the barrel does not
 * export, the demo stops building. It is the only check that
 * `package.json`'s locked `exports` are actually sufficient to build an app.
 */
export default defineConfig({
  root: here("."),
  // The package's stylesheet is GENERATED from `src/datagrid.src.css`, and the
  // alias below points the demo at that source rather than at a built file.
  // Tailwind therefore has to run here too — which is the point: the demo
  // fails to style itself if the source stylesheet stops compiling.
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: "@matthewhsu1/datagrid/datagrid.css", replacement: here("../src/datagrid.src.css") },
      {
        find: "@matthewhsu1/datagrid/radix-styles",
        replacement: here("../src/theme/radixStyles.ts"),
      },
      { find: "@matthewhsu1/datagrid", replacement: here("../src/index.ts") },
    ],
  },
  build: {
    outDir: here("dist"),
    emptyOutDir: true,
  },
});
