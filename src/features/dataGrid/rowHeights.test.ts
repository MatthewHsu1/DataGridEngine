import { describe, expect, it } from "vitest";
import { buildDisplayModel, buildFlatModel } from "./displayModel";
import { DEFAULT_GROUP_HEADER_HEIGHT, DEFAULT_ROW_HEIGHT, rowHeightFor } from "./rowHeights";

const order = (g: number) => g;

/** header(0) d d header(1) d d  =>  6 display rows. */
const GROUPED = buildDisplayModel(
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

describe("rowHeightFor", () => {
  it("gives a group header the room its components need", () => {
    expect(rowHeightFor(GROUPED, 34, 64)(0)).toBe(64);
  });

  it("leaves a data row at the grid's own row height", () => {
    expect(rowHeightFor(GROUPED, 34, 64)(1)).toBe(34);
  });

  it("finds the header of a group further down the grid", () => {
    expect(rowHeightFor(GROUPED, 34, 64)(3)).toBe(64);
  });

  it("makes every row the same in a flat grid, which draws no headers", () => {
    const height = rowHeightFor(buildFlatModel(50), 34, 64);

    expect([0, 1, 20].map(height)).toEqual([34, 34, 34]);
  });

  it("answers a row past the end without throwing, because glide prefetches one", () => {
    expect(rowHeightFor(GROUPED, 34, 64)(GROUPED.rowCount)).toBe(34);
  });

  it("names a default height, so a descriptor need not care until it does", () => {
    expect(DEFAULT_GROUP_HEADER_HEIGHT).toBeGreaterThan(0);
  });

  it("keeps glide's own default row height, so passing a function changes nothing else", () => {
    // Handing glide a rowHeight FUNCTION replaces its default for every row,
    // headers and data alike. Data rows have to be told the height they already
    // had, or the whole grid silently changes density.
    expect(DEFAULT_ROW_HEIGHT).toBe(34);
  });
});
