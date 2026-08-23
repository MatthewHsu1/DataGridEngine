// @vitest-environment node
// The colour path reads CSS vars off the theme root, so this suite hand-stubs
// `document` and `getComputedStyle` the way softBadge.test.ts does, and needs
// the node environment those stubs were written against.
import { GridCellKind, type Theme } from "@glideapps/glide-data-grid";
import { afterEach, describe, expect, it, vi } from "vitest";
import { invalidateBadgeColorCache } from "../../lib/grid/softBadge";
import { groupHeaderCell } from "./groupHeaderCell";

/** Stands in for the Themes root, whose vars already carry the appearance. */
function stubVars(vars: Record<string, string>) {
  globalThis.document = {
    querySelector: () => null,
    documentElement: {},
  } as unknown as Document;

  globalThis.getComputedStyle = vi.fn(
    () =>
      ({ getPropertyValue: (prop: string) => vars[prop] ?? "" }) as unknown as CSSStyleDeclaration,
  ) as unknown as typeof getComputedStyle;
}

const LIGHT: Partial<Theme> = { bgHeader: "#F7F9FA", textHeader: "#4A4A52" };
const DARK: Partial<Theme> = { bgHeader: "#161719", textHeader: "#A0A5AD" };

afterEach(() => {
  invalidateBadgeColorCache();
  vi.restoreAllMocks();
});

describe("groupHeaderCell", () => {
  it("spans every column and never opens an overlay", () => {
    stubVars({});

    const cell = groupHeaderCell("APAC", 4, LIGHT);

    expect(cell.kind).toBe(GridCellKind.Text);
    expect(cell.span).toEqual([0, 3]);
    expect(cell.allowOverlay).toBe(false);
  });

  it("shows the label with the collapse chevron, and keeps the bare label as data", () => {
    stubVars({});

    const cell = groupHeaderCell("APAC", 4, LIGHT);

    expect(cell).toMatchObject({ data: "APAC", displayData: "▾ APAC" });
  });

  it("does not collapse the span below zero for a grid with no columns", () => {
    stubVars({});

    expect(groupHeaderCell("APAC", 0, LIGHT).span).toEqual([0, 0]);
  });

  it("fills from the theme's header background, not a fixed colour", () => {
    stubVars({});

    expect(groupHeaderCell("APAC", 4, LIGHT).themeOverride?.bgCell).toBe("#F7F9FA");
    expect(groupHeaderCell("APAC", 4, DARK).themeOverride?.bgCell).toBe("#161719");
  });

  it("falls back to the theme's header text when the group names no colour", () => {
    stubVars({});

    expect(groupHeaderCell("APAC", 4, LIGHT).themeOverride?.textDark).toBe("#4A4A52");
    expect(groupHeaderCell("APAC", 4, DARK).themeOverride?.textDark).toBe("#A0A5AD");
  });

  it("takes the label step of the named scale — the same step the badge draws", () => {
    stubVars({ "--cyan-11": "#0d74ce" });

    expect(groupHeaderCell("APAC", 4, LIGHT, "cyan").themeOverride?.textDark).toBe("#0d74ce");
  });

  it("follows the appearance, because the scale resolves through the live vars", () => {
    stubVars({ "--cyan-11": "#0d74ce" });
    expect(groupHeaderCell("APAC", 4, LIGHT, "cyan").themeOverride?.textDark).toBe("#0d74ce");

    // What an appearance flip does: the vars change, and the cache is dropped.
    invalidateBadgeColorCache();
    stubVars({ "--cyan-11": "#3db9cf" });

    expect(groupHeaderCell("APAC", 4, DARK, "cyan").themeOverride?.textDark).toBe("#3db9cf");
  });

  it("falls back rather than writing an empty colour for an unimported scale", () => {
    stubVars({});

    // `resolveRadixSoft` answers "" here and warns. An empty `textDark` would
    // draw the label transparent, which is worse than an uncoloured header.
    vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(groupHeaderCell("APAC", 4, DARK, "cyan").themeOverride?.textDark).toBe("#A0A5AD");
  });
});
