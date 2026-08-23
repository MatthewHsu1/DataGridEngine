import { describe, expect, it } from "vitest";
import {
  buildDisplayModel,
  buildFlatModel,
  dataRangeInDisplayRange,
  detectBoundaries,
  displayRowsOfData,
  displayToData,
  firstAffectedDataIndex,
  groupAtDisplayRow,
  headersInDisplayRange,
  sameHeaders,
  type Boundary,
} from "./displayModel";

const order = (g: number) => g;

describe("detectBoundaries", () => {
  it("emits a boundary at index 0 and at each group change", () => {
    const rows = [{ g: 0 }, { g: 0 }, { g: 1 }];
    const b = detectBoundaries(rows, null, 0, (r) => r.g);
    expect(b).toEqual([
      { dataIndex: 0, group: 0 },
      { dataIndex: 2, group: 1 },
    ]);
  });

  it("emits nothing for a window that sits wholly inside one group", () => {
    const rows = [{ g: 4 }, { g: 4 }, { g: 4 }];
    const b = detectBoundaries(rows, 4, 200, (r) => r.g);
    expect(b).toEqual([]);
  });
});

describe("buildDisplayModel (grouped)", () => {
  it("inserts one header per group; header at segment start, data after", () => {
    const boundaries: Boundary<number>[] = [
      { dataIndex: 0, group: 0 },
      { dataIndex: 2, group: 1 },
    ];
    const m = buildDisplayModel(
      { boundaries, leadingGroup: null, total: 3, collapsedGroups: [], discoveredGroups: [0, 1] },
      order,
    );
    // header(0) d d header(1) d  => 5 display rows
    expect(m.rowCount).toBe(5);
    expect(displayToData(m, 0)).toEqual({ kind: "header", group: 0 });
    expect(displayToData(m, 1)).toEqual({ kind: "data", dataIndex: 0 });
    expect(displayToData(m, 3)).toEqual({ kind: "header", group: 1 });
    expect(displayToData(m, 4)).toEqual({ kind: "data", dataIndex: 2 });
  });
});

describe("buildFlatModel (ungrouped)", () => {
  it("has no headers; display index === data index", () => {
    const m = buildFlatModel(3);
    expect(m.rowCount).toBe(3);
    expect(displayToData(m, 0)).toEqual({ kind: "data", dataIndex: 0 });
    expect(displayToData(m, 2)).toEqual({ kind: "data", dataIndex: 2 });
  });
});

describe("buildDisplayModel (cold start fallback)", () => {
  it("falls back to a flat, headerless span when it knows a total but no boundaries or groups", () => {
    const m = buildDisplayModel(
      { boundaries: [], leadingGroup: null, total: 100, collapsedGroups: [], discoveredGroups: [] },
      order,
    );
    expect(m.rowCount).toBe(100);
    expect(m.segments).toHaveLength(1);
    expect(m.segments[0].hasHeader).toBe(false);
  });

  it("still reports zero rows when the total itself is zero", () => {
    const m = buildDisplayModel(
      { boundaries: [], leadingGroup: null, total: 0, collapsedGroups: [], discoveredGroups: [] },
      order,
    );
    expect(m.rowCount).toBe(0);
  });

  it("does not apply the fallback when collapsed groups must still draw their headers", () => {
    const m = buildDisplayModel(
      {
        boundaries: [],
        leadingGroup: null,
        total: 0,
        collapsedGroups: ["a", "b"],
        discoveredGroups: ["a", "b"],
      },
      (g: string) => (g === "a" ? 0 : 1),
    );
    const headerSegments = m.segments.filter((segment) => segment.hasHeader);
    expect(headerSegments).toHaveLength(2);
  });

  it("is unchanged for the normal grouped case where boundaries are present", () => {
    const boundaries: Boundary<number>[] = [
      { dataIndex: 0, group: 0 },
      { dataIndex: 2, group: 1 },
    ];
    const m = buildDisplayModel(
      { boundaries, leadingGroup: null, total: 3, collapsedGroups: [], discoveredGroups: [0, 1] },
      order,
    );
    expect(m.rowCount).toBe(5);
  });
});

describe("buildDisplayModel (window scrolled past the first group)", () => {
  it("keeps every row when the window sits wholly inside one group", () => {
    const m = buildDisplayModel(
      {
        boundaries: [],
        leadingGroup: 0,
        total: 100_000,
        collapsedGroups: [],
        discoveredGroups: [0],
      },
      order,
    );

    expect(m.rowCount).toBe(100_000);
    expect(displayToData(m, 0)).toEqual({ kind: "data", dataIndex: 0 });
    expect(displayToData(m, 500)).toEqual({ kind: "data", dataIndex: 500 });
  });

  it("keeps a viewport commit alive, so the window can move again", () => {
    const m = buildDisplayModel(
      {
        boundaries: [],
        leadingGroup: 0,
        total: 100_000,
        collapsedGroups: [],
        discoveredGroups: [0],
      },
      order,
    );

    expect(dataRangeInDisplayRange(m, 200, 260)).toEqual({ min: 200, max: 260 });
  });

  it("covers the rows before the first boundary it can see", () => {
    const boundaries: Boundary<number>[] = [{ dataIndex: 10, group: 1 }];
    const m = buildDisplayModel(
      { boundaries, leadingGroup: 0, total: 20, collapsedGroups: [], discoveredGroups: [0, 1] },
      order,
    );

    // 10 leading rows, then the group-1 header, then its 10 rows.
    expect(m.rowCount).toBe(21);
    expect(displayToData(m, 0)).toEqual({ kind: "data", dataIndex: 0 });
    expect(displayToData(m, 10)).toEqual({ kind: "header", group: 1 });
    expect(displayToData(m, 11)).toEqual({ kind: "data", dataIndex: 10 });
  });

  it("draws no header on the leading run, because it does not know where that group starts", () => {
    const m = buildDisplayModel(
      { boundaries: [], leadingGroup: 0, total: 50, collapsedGroups: [], discoveredGroups: [0] },
      order,
    );

    expect(m.segments[0].hasHeader).toBe(false);
    expect(m.segments[0].group).toBe(0);
  });

  it("still draws the header of a collapsed group the leading run precedes", () => {
    const m = buildDisplayModel(
      {
        boundaries: [],
        leadingGroup: 1,
        total: 50,
        collapsedGroups: [2],
        discoveredGroups: [1, 2],
      },
      order,
    );

    expect(m.rowCount).toBe(51);
    expect(displayToData(m, 50)).toEqual({ kind: "header", group: 2 });
  });
});

describe("displayRowsOfData", () => {
  /** Groups 0 and 1, 60 rows each, both with a header. */
  const grouped = () =>
    buildDisplayModel(
      {
        boundaries: [
          { dataIndex: 0, group: 0 },
          { dataIndex: 60, group: 1 },
        ],
        leadingGroup: null,
        total: 120,
        collapsedGroups: [],
        discoveredGroups: [0, 1],
      },
      order,
    );

  it("is the identity for an ungrouped grid, where a display row IS a data index", () => {
    expect(displayRowsOfData(buildFlatModel(1_000), [0, 5, 999])).toEqual([0, 5, 999]);
  });

  it("shifts a data index by the headers above it", () => {
    const m = grouped();

    // Group 0's header takes display row 0, so data 0 draws at 1 and data 59 at
    // 60. Group 1's header then takes 61, so data 60 draws at 62.
    expect(displayRowsOfData(m, [0])).toEqual([1]);
    expect(displayRowsOfData(m, [59])).toEqual([60]);
    expect(displayRowsOfData(m, [60])).toEqual([62]);
    expect(displayRowsOfData(m, [119])).toEqual([121]);
  });

  it("agrees with displayToData in both directions", () => {
    const m = grouped();

    for (const dataIndex of [0, 1, 59, 60, 61, 119]) {
      const display = displayRowsOfData(m, [dataIndex])[0];

      expect(displayToData(m, display)).toEqual({ kind: "data", dataIndex });
    }
  });

  it("converts a whole page in one pass, in ascending order", () => {
    const m = grouped();
    const page = Array.from({ length: 120 }, (_, i) => i);

    const rows = displayRowsOfData(m, page);

    expect(rows).toHaveLength(120);
    expect(rows[0]).toBe(1);
    expect(rows.at(-1)).toBe(121);
    expect([...rows].sort((a, b) => a - b)).toEqual(rows);
  });

  it("drops a data index the model does not place, rather than guessing a row", () => {
    const m = grouped();

    // Past the end of every segment. Damaging a guessed row would repaint some
    // other row instead.
    expect(displayRowsOfData(m, [120, 5_000])).toEqual([]);
    expect(displayRowsOfData(m, [119, 120])).toEqual([121]);
  });

  it("places nothing when the model holds no data rows", () => {
    expect(displayRowsOfData(buildFlatModel(0), [0, 1])).toEqual([]);
    expect(displayRowsOfData(grouped(), [])).toEqual([]);
  });

  it("skips a collapsed group's rows", () => {
    const m = buildDisplayModel(
      {
        boundaries: [{ dataIndex: 0, group: 1 }],
        leadingGroup: null,
        total: 60,
        collapsedGroups: [2],
        discoveredGroups: [1, 2],
      },
      order,
    );

    // Group 2 is header-only, so it holds no data row anything can map into.
    expect(displayRowsOfData(m, [0])).toEqual([1]);
    expect(displayRowsOfData(m, [60])).toEqual([]);
  });

  it("leaves the model's own segment order untouched", () => {
    const m = grouped();
    const before = m.segments.map((segment) => segment.dataStart);

    displayRowsOfData(m, [119, 0, 60]);

    expect(m.segments.map((segment) => segment.dataStart)).toEqual(before);
  });
});

describe("firstAffectedDataIndex", () => {
  it("answers with the group's own first row when the group holds rows", () => {
    const model = buildDisplayModel(
      {
        boundaries: [
          { dataIndex: 0, group: 0 },
          { dataIndex: 60, group: 1 },
        ],
        leadingGroup: null,
        total: 120,
        collapsedGroups: [],
        discoveredGroups: [0, 1],
      },
      order,
    );

    expect(firstAffectedDataIndex(model, 1)).toBe(60);
  });

  it("answers with the end of the group above when a group is placed below too", () => {
    const model = buildDisplayModel(
      {
        boundaries: [
          { dataIndex: 0, group: 0 },
          { dataIndex: 60, group: 2 },
        ],
        leadingGroup: null,
        total: 120,
        collapsedGroups: [1],
        discoveredGroups: [0, 1, 2],
      },
      order,
    );

    // Group 1 holds no rows while it is collapsed, so its own `dataStart` says
    // nothing. Group 2 sits below it and holds rows, which proves group 0 ends
    // at a real boundary rather than at `total`. Expanding group 1 therefore
    // moves rows from 60 down, and rows 0 to 59 keep the index they have.
    expect(firstAffectedDataIndex(model, 1)).toBe(60);
  });

  it("answers with 0 when the group above runs to the end of the table", () => {
    const model = buildDisplayModel(
      {
        boundaries: [{ dataIndex: 0, group: 0 }],
        leadingGroup: null,
        total: 60,
        collapsedGroups: [1],
        discoveredGroups: [0, 1],
      },
      order,
    );

    // Nothing is placed below group 1, so group 0's segment runs to `total`
    // because that is where the model stops, not because group 0 stops there.
    // Reading 60 as a boundary would carry every loaded page across the expand.
    expect(firstAffectedDataIndex(model, 1)).toBe(0);
  });

  it("answers with 0 when the group above is the leading run of unplaced rows", () => {
    const model = buildDisplayModel(
      {
        boundaries: [],
        leadingGroup: null,
        total: 1_000,
        collapsedGroups: [1],
        discoveredGroups: [0, 1, 2],
      },
      order,
    );

    // The shape a moved window still loading leaves behind: one leading segment
    // covering every row, and the collapsed headers drawn below all of them —
    // which is exactly where the user clicks to expand. Group 1's rows return
    // somewhere INSIDE 0 to 999, so a boundary of 1,000 would carry every page.
    expect(firstAffectedDataIndex(model, 1)).toBe(0);
  });

  it("answers with 0 for a group the model does not hold", () => {
    const model = buildDisplayModel(
      {
        boundaries: [{ dataIndex: 0, group: 0 }],
        leadingGroup: null,
        total: 60,
        collapsedGroups: [],
        discoveredGroups: [0],
      },
      order,
    );

    expect(firstAffectedDataIndex(model, 9)).toBe(0);
  });

  it("answers with 0 when no group above it holds rows", () => {
    const model = buildDisplayModel(
      {
        boundaries: [],
        leadingGroup: null,
        total: 0,
        collapsedGroups: [0],
        discoveredGroups: [0],
      },
      order,
    );

    expect(firstAffectedDataIndex(model, 0)).toBe(0);
  });

  it("answers with 0 for the first group, so a collapse of it carries nothing", () => {
    const model = buildDisplayModel(
      {
        boundaries: [
          { dataIndex: 0, group: 0 },
          { dataIndex: 60, group: 1 },
        ],
        leadingGroup: null,
        total: 120,
        collapsedGroups: [],
        discoveredGroups: [0, 1],
      },
      order,
    );

    expect(firstAffectedDataIndex(model, 0)).toBe(0);
  });
});

/** header(0) d d header(1) d d header(2) d d  =>  9 display rows. */
const THREE_GROUPS = buildDisplayModel(
  {
    boundaries: [
      { dataIndex: 0, group: 0 },
      { dataIndex: 2, group: 1 },
      { dataIndex: 4, group: 2 },
    ],
    leadingGroup: null,
    total: 6,
    collapsedGroups: [],
    discoveredGroups: [0, 1, 2],
  },
  order,
);

describe("headersInDisplayRange", () => {
  it("reports each header on screen, and where it sits", () => {
    expect(headersInDisplayRange(THREE_GROUPS, 0, 8)).toEqual([
      { displayRow: 0, group: 0, collapsed: false },
      { displayRow: 3, group: 1, collapsed: false },
      { displayRow: 6, group: 2, collapsed: false },
    ]);
  });

  it("leaves out the headers the viewport has scrolled past", () => {
    expect(headersInDisplayRange(THREE_GROUPS, 4, 8).map((h) => h.group)).toEqual([2]);
  });

  it("includes a header the range only just reaches", () => {
    expect(headersInDisplayRange(THREE_GROUPS, 3, 3).map((h) => h.group)).toEqual([1]);
  });

  it("reads the range whichever way round it is given", () => {
    expect(headersInDisplayRange(THREE_GROUPS, 8, 4).map((h) => h.group)).toEqual([2]);
  });

  it("finds nothing in a flat grid, which draws no headers at all", () => {
    expect(headersInDisplayRange(buildFlatModel(50), 0, 20)).toEqual([]);
  });

  it("reports a collapsed group's header, because it is the only way back", () => {
    const m = buildDisplayModel(
      {
        boundaries: [{ dataIndex: 0, group: 0 }],
        leadingGroup: null,
        total: 2,
        collapsedGroups: [1],
        discoveredGroups: [0, 1],
      },
      order,
    );

    expect(headersInDisplayRange(m, 0, m.rowCount - 1)).toContainEqual(
      expect.objectContaining({ group: 1, collapsed: true }),
    );
  });
});

describe("groupAtDisplayRow", () => {
  it("names the group a header row belongs to", () => {
    expect(groupAtDisplayRow(THREE_GROUPS, 3)).toBe(1);
  });

  it("names the group a data row belongs to", () => {
    expect(groupAtDisplayRow(THREE_GROUPS, 5)).toBe(1);
  });

  it("keeps naming the group above while the viewport sits deep inside it", () => {
    expect(groupAtDisplayRow(THREE_GROUPS, 8)).toBe(2);
  });

  it("answers null for a flat grid, which is inside no group", () => {
    expect(groupAtDisplayRow(buildFlatModel(50), 10)).toBeNull();
  });

  it("answers null past the last row, rather than a group that is not there", () => {
    expect(groupAtDisplayRow(THREE_GROUPS, 99)).toBeNull();
  });
});

describe("sameHeaders", () => {
  const a = { displayRow: 0, group: 0, collapsed: false };
  const b = { displayRow: 5, group: 1, collapsed: false };

  it("says a scroll inside one group changed nothing", () => {
    // The whole point: this runs on every visible-region change, and answering
    // "changed" re-renders the header layer. Inside a tall group that is every
    // frame of a scroll, for a set that never moved.
    expect(sameHeaders([a, b], [a, b])).toBe(true);
  });

  it("compares by value, not by array identity", () => {
    expect(sameHeaders([{ ...a }], [{ ...a }])).toBe(true);
  });

  it("notices a header scrolling into view", () => {
    expect(sameHeaders([a], [a, b])).toBe(false);
  });

  it("notices a header scrolling out of view", () => {
    expect(sameHeaders([a, b], [b])).toBe(false);
  });

  it("notices a header that moved, because the rows above it changed height", () => {
    expect(sameHeaders([a], [{ ...a, displayRow: 3 }])).toBe(false);
  });

  it("notices a group folding shut, so its arrow turns round", () => {
    expect(sameHeaders([a], [{ ...a, collapsed: true }])).toBe(false);
  });
});
