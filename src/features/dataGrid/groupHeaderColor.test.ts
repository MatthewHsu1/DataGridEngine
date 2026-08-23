// @vitest-environment node
// The colour path reads CSS vars off the theme root, so this suite hand-stubs
// `document` and `getComputedStyle` the way softBadge.test.ts does, and needs
// the node environment those stubs were written against.
import { afterEach, describe, expect, it, vi } from "vitest";
import { invalidateBadgeColorCache } from "../../lib/grid/softBadge";
import { groupHeaderTextColor } from "./groupHeaderColor";

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

afterEach(() => {
  invalidateBadgeColorCache();
  vi.restoreAllMocks();
});

describe("groupHeaderTextColor", () => {
  it("falls back when the group names no colour of its own", () => {
    stubVars({});

    expect(groupHeaderTextColor(undefined, "#4A4A52")).toBe("#4A4A52");
  });

  it("takes the label step of the named scale — the same step the badge draws", () => {
    stubVars({ "--cyan-11": "#0d74ce" });

    expect(groupHeaderTextColor("cyan", "#4A4A52")).toBe("#0d74ce");
  });

  it("follows the appearance, because the scale resolves through the live vars", () => {
    stubVars({ "--cyan-11": "#0d74ce" });
    expect(groupHeaderTextColor("cyan", "#4A4A52")).toBe("#0d74ce");

    // What an appearance flip does: the vars change, and the cache is dropped.
    invalidateBadgeColorCache();
    stubVars({ "--cyan-11": "#3db9cf" });

    expect(groupHeaderTextColor("cyan", "#A0A5AD")).toBe("#3db9cf");
  });

  it("falls back rather than answering an empty colour for an unimported scale", () => {
    stubVars({});

    // `resolveRadixSoft` answers "" here and warns. An empty colour would draw
    // the label transparent, which is worse than an uncoloured header.
    vi.spyOn(console, "warn").mockImplementation(() => {});

    expect(groupHeaderTextColor("cyan", "#A0A5AD")).toBe("#A0A5AD");
  });
});
