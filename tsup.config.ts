import { defineConfig } from "tsup";

/**
 * Three entry points, matching the three subpaths in package.json's `exports`.
 *
 * `dependencies` and `peerDependencies` are external by default, which is what
 * keeps the CSS side-effect imports inside the bundle (glide's stylesheet,
 * react-day-picker's, react-phone-number-input's) as plain re-exported imports
 * for the host's bundler to resolve — rather than inlining them here, where a
 * consumer could never override them.
 */
export default defineConfig({
  entry: {
    index: "src/index.ts",
    testing: "src/testing.ts",
    "radix-styles": "src/theme/radixStyles.ts",
  },
  format: ["esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  treeshake: true,
  target: "es2023",
});
