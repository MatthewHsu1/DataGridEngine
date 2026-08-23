import { describe, expect, it } from "vitest";
import { buildDisplayModel, buildFlatModel, type DisplayModel } from "./displayModel";
import { selectedDisplayRows } from "./selectionRows";

const order = (g: number) => g;

/** Two groups of two rows: header(0) d0 d1 header(3) d2 d3. */
const OPEN: DisplayModel<number> = buildDisplayModel(
  {
    boundaries: [
      { dataIndex: 0, group: 0 },
      { dataIndex: 2, group: 1 },
    ],
    leadingGroup: null,
    total: 4,
    collapsedGroups: [],
    discoveredGroups: [0, 1],
  },
  order,
);

/** The same grid once group 0 is collapsed: its rows are gone. header(0) header(1) d0 d1. */
const COLLAPSED: DisplayModel<number> = buildDisplayModel(
  {
    boundaries: [{ dataIndex: 0, group: 1 }],
    leadingGroup: null,
    total: 2,
    collapsedGroups: [0],
    discoveredGroups: [0, 1],
  },
  order,
);

/** Row keys 10..13 sit at data indexes 0..3 while nothing is collapsed. */
const openIndex = (key: number) => ({ 10: 0, 11: 1, 12: 2, 13: 3 })[key];

/** Once group 0 folds, its two rows are not sent, and 12/13 move to the front. */
const collapsedIndex = (key: number) => ({ 12: 0, 13: 1 })[key];

describe("selectedDisplayRows", () => {
  it("finds the row a selected key is currently drawn at", () => {
    // Data 2 sits at display 4: header, two rows, header.
    expect(selectedDisplayRows([12], openIndex, OPEN)).toEqual([4]);
  });

  it("follows a key when a collapse moves it", () => {
    // The bug this exists for: the highlight was remembered as a display ROW,
    // so folding a group above it left the ring sitting on whichever row had
    // moved into that position — a different record entirely.
    expect(selectedDisplayRows([12], collapsedIndex, COLLAPSED)).toEqual([2]);
  });

  it("keeps several selected rows in the order they are drawn", () => {
    expect(selectedDisplayRows([13, 10], openIndex, OPEN)).toEqual([1, 5]);
  });

  it("drops a key whose row is no longer loaded, rather than guessing at one", () => {
    // A selected row scrolled far out of the window is evicted from the store.
    // It stays selected — `selectedIds` is what the host reads — but there is
    // no row on screen to draw a ring around.
    expect(selectedDisplayRows([10], collapsedIndex, COLLAPSED)).toEqual([]);
  });

  it("answers nothing when nothing is selected", () => {
    expect(selectedDisplayRows([], openIndex, OPEN)).toEqual([]);
  });

  it("works on a flat grid, where a data row is its own display row", () => {
    expect(selectedDisplayRows([13], openIndex, buildFlatModel(4))).toEqual([3]);
  });
});
