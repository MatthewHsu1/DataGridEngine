import type { ThemeProps } from "@radix-ui/themes";
import type { Appearance } from "./appearanceSlice";

/**
 * The Radix Themes props the grid's own popups render with.
 *
 * A cell editor (date, enum, phone, text) portals out of the canvas and mounts
 * its own `<Theme>`, so it cannot inherit the host app's provider. Without a
 * matching config those popups would render in a different accent from the app
 * that hosts them.
 */
export type GridRadixTheme = Pick<ThemeProps, "accentColor" | "grayColor" | "radius" | "scaling">;

/**
 * Reads the light/dark signal out of the host app's Redux state.
 */
export type SelectAppearance = (state: unknown) => Appearance;

/**
 * `iris` is the nearest Radix accent to the grid's #4F46E5 selection highlight;
 * `slate` matches the grid's cool-gray tints. `as const` narrows each value to
 * the literal Radix prop union (no TS enums — keeps the erasable-syntax rule).
 */
export const DEFAULT_GRID_RADIX_THEME = {
  accentColor: "iris",
  grayColor: "slate",
  radius: "medium",
  scaling: "100%",
} as const satisfies GridRadixTheme;

/**
 * Where the appearance lives if the host says nothing: the `appearance` key,
 * which is where `appearanceSlice` mounts by convention.
 *
 * It falls back to "light" rather than throwing, because a host that has not
 * mounted the slice yet should get a plainly-wrong-looking grid, not a crash on
 * first render.
 */
const defaultSelectAppearance: SelectAppearance = (state) =>
  (state as { appearance?: { appearance?: Appearance } })?.appearance?.appearance ?? "light";

/**
 * How the host app wires the grid's look into its own theme.
 */
export interface GridThemeConfig extends Partial<GridRadixTheme> {
  /**
   * Reads light/dark out of the host's store.
   *
   * Defaults to `state.appearance.appearance`. Override it when the host keeps
   * its appearance somewhere else, or under a different slice name.
   */
  selectAppearance?: SelectAppearance;
}

let radixTheme: GridRadixTheme = DEFAULT_GRID_RADIX_THEME;
let selectAppearance: SelectAppearance = defaultSelectAppearance;

/**
 * Point the grid at the host app's accent and appearance signal. Call it once,
 * at app start, before the first grid renders.
 *
 * Module-level rather than a React context on purpose: the cell editors that
 * need it render inside glide's overlay, outside the React tree the grid is
 * mounted in, so a provider above `<DataGrid>` would not reach them.
 */
export function configureGridTheme(config: GridThemeConfig): void {
  const { selectAppearance: select, ...radix } = config;

  radixTheme = { ...radixTheme, ...radix };

  if (select) {
    selectAppearance = select;
  }
}

/**
 * The Radix props a grid popup mounts its `<Theme>` with. Read at render time,
 * so a `configureGridTheme` call is picked up without a rebuild.
 */
export function gridRadixTheme(): GridRadixTheme {
  return radixTheme;
}

/**
 * The configured appearance selector. `useGridTheme` passes the host's state
 * through this.
 */
export function selectGridAppearance(state: unknown): Appearance {
  return selectAppearance(state);
}

/**
 * Drops every configured value. Tests only — an app calls `configureGridTheme`
 * once and never unwinds it.
 */
export function resetGridTheme(): void {
  radixTheme = DEFAULT_GRID_RADIX_THEME;
  selectAppearance = defaultSelectAppearance;
}
