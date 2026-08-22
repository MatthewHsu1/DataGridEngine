import { afterEach, describe, expect, it } from "vitest";
import {
  configureGridTheme,
  DEFAULT_GRID_RADIX_THEME,
  gridRadixTheme,
  resetGridTheme,
  selectGridAppearance,
} from "./radixTheme";

afterEach(() => resetGridTheme());

describe("the grid's default Radix theme", () => {
  it("uses the iris accent (nearest hue to the grid accent #4F46E5)", () => {
    expect(gridRadixTheme().accentColor).toBe("iris");
  });

  it("uses the slate gray (matches the grid cool-gray tints)", () => {
    expect(gridRadixTheme().grayColor).toBe("slate");
  });

  it("pins radius and scaling so the look is stable", () => {
    expect(gridRadixTheme().radius).toBe("medium");
    expect(gridRadixTheme().scaling).toBe("100%");
  });
});

describe("configureGridTheme", () => {
  it("takes the host app's accent, so a cell popup matches the app around it", () => {
    configureGridTheme({ accentColor: "grass" });

    expect(gridRadixTheme().accentColor).toBe("grass");
  });

  it("leaves every prop the host did not name alone", () => {
    configureGridTheme({ accentColor: "grass" });

    expect(gridRadixTheme().grayColor).toBe(DEFAULT_GRID_RADIX_THEME.grayColor);
    expect(gridRadixTheme().radius).toBe(DEFAULT_GRID_RADIX_THEME.radius);
  });

  it("merges successive calls rather than replacing the whole config", () => {
    configureGridTheme({ accentColor: "grass" });
    configureGridTheme({ radius: "full" });

    expect(gridRadixTheme()).toMatchObject({ accentColor: "grass", radius: "full" });
  });
});

describe("the appearance selector", () => {
  it("reads state.appearance.appearance by default", () => {
    expect(selectGridAppearance({ appearance: { appearance: "dark" } })).toBe("dark");
  });

  it("falls back to light when the host has not mounted the slice", () => {
    // A crash on first render would be a far worse failure than a grid that
    // renders in the wrong scheme until the host wires its store up.
    expect(selectGridAppearance({})).toBe("light");
    expect(selectGridAppearance(undefined)).toBe("light");
  });

  it("uses the host's own selector once configured, so any store shape works", () => {
    configureGridTheme({
      selectAppearance: (s) => (s as { ui: { mode: "light" | "dark" } }).ui.mode,
    });

    expect(selectGridAppearance({ ui: { mode: "dark" } })).toBe("dark");
  });
});
