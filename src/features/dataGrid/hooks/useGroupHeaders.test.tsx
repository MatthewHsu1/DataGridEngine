import type { DataEditorRef, Rectangle } from "@glideapps/glide-data-grid";
import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { buildDisplayModel, buildFlatModel, type DisplayModel } from "../displayModel";
import { DEFAULT_GROUP_HEADER_HEIGHT, DEFAULT_ROW_HEIGHT } from "../rowHeights";
import type { GridGrouping } from "../types";
import { useGroupHeaders } from "./useGroupHeaders";

const order = (g: number) => g;

interface Row {
  g: number;
}

const GROUPING: GridGrouping<Row, number> = {
  field: "g",
  of: (row) => row.g,
  order,
  label: String,
};

/** Two groups of two rows: header(0) d d header(3) d d. */
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

/**
 * The same grid once the server has answered a collapse of group 0: its rows
 * are simply not sent, so only its header remains.
 */
const RELOADED: DisplayModel<number> = buildDisplayModel(
  {
    boundaries: [{ dataIndex: 0, group: 1 }],
    leadingGroup: null,
    total: 2,
    collapsedGroups: [0],
    discoveredGroups: [0, 1],
  },
  order,
);

const VIEWPORT: Rectangle = { x: 0, y: 0, width: 5, height: 20 };

/**
 * A grid whose rows have not arrived: no boundary, no preceding group. Every
 * jump of the scrollbar passes through this state.
 */
const UNKNOWN: DisplayModel<number> = buildDisplayModel(
  {
    boundaries: [],
    leadingGroup: null,
    total: 4,
    collapsedGroups: [],
    discoveredGroups: [0, 1],
  },
  order,
);

interface Props {
  m: DisplayModel<number>;
  collapsed: number[];
}

/** A grid ref that records what the hook asks glide to do. */
function fakeGrid() {
  const scrollTo = vi.fn();

  return {
    scrollTo,
    gridRef: { current: { scrollTo } } as unknown as React.RefObject<DataEditorRef | null>,
  };
}

function mount(initialProps: Props, grouping: GridGrouping<Row, number> | undefined = GROUPING) {
  const { scrollTo, gridRef } = fakeGrid();

  const view = renderHook(
    ({ m, collapsed }: Props) =>
      useGroupHeaders({
        model: m,
        collapsedGroups: collapsed,
        grouping,
        gridRef,
        columnHeaderHeight: 36,
      }),
    { initialProps },
  );

  // One region report, as glide makes on mount.
  act(() => view.result.current.trackRegion(VIEWPORT, 0));

  return { ...view, scrollTo };
}

/**
 * The same, for a grid with no grouping at all.
 *
 * A helper of its own rather than `mount(props, undefined)`, because passing
 * `undefined` to a parameter with a default gets the DEFAULT — so that call
 * would quietly test a grouped grid instead of a flat one.
 */
function mountFlat(model: DisplayModel<number>) {
  const { scrollTo, gridRef } = fakeGrid();

  const view = renderHook(() =>
    useGroupHeaders<Row, number>({
      model,
      collapsedGroups: [],
      grouping: undefined,
      gridRef,
      columnHeaderHeight: 36,
    }),
  );

  act(() => view.result.current.trackRegion(VIEWPORT, 0));

  return { ...view, scrollTo };
}

describe("useGroupHeaders", () => {
  it("finds the headers the viewport can see", () => {
    const { result } = mount({ m: OPEN, collapsed: [] });

    expect(result.current.visibleHeaders.map((h) => h.group)).toEqual([0, 1]);
  });

  it("names the group the top of the viewport sits in", () => {
    const { result } = mount({ m: OPEN, collapsed: [] });

    expect(result.current.bannerGroup).toBe(0);
  });

  it("turns a chevron round the moment its group is collapsed, not when the server agrees", () => {
    // A collapse is answered by the SERVER dropping the group's rows, which
    // takes a round trip. Until then the model still holds them and reports the
    // group as open. Reading the arrow from the model left it pointing the old
    // way for the whole load, which reads as a click that did nothing.
    const { result, rerender } = mount({ m: OPEN, collapsed: [] });

    rerender({ m: OPEN, collapsed: [0] });

    expect(result.current.visibleHeaders.find((h) => h.group === 0)?.collapsed).toBe(true);
  });

  it("brings the next group's header up when the one above it folds away", () => {
    // No scroll happens here. The rows arrive, the model changes, and the
    // headers have to follow it on their own.
    const { result, rerender } = mount({ m: OPEN, collapsed: [] });
    const before = result.current.visibleHeaders.find((h) => h.group === 1)?.displayRow;

    rerender({ m: RELOADED, collapsed: [0] });

    expect(before).toBe(3);
    expect(result.current.visibleHeaders.find((h) => h.group === 1)?.displayRow).toBe(1);
  });

  it("keeps a collapsed group's header, because it is the only way back", () => {
    const { result, rerender } = mount({ m: OPEN, collapsed: [] });

    rerender({ m: RELOADED, collapsed: [0] });

    expect(result.current.visibleHeaders.map((h) => h.group)).toEqual([0, 1]);
  });

  it("leaves a grid that is not grouping alone", () => {
    const { result } = mountFlat(OPEN);

    expect(result.current.visibleHeaders).toEqual([]);
    expect(result.current.bannerGroup).toBeNull();
  });

  it("reserves a hole as tall as the header the host asked for", () => {
    // The canvas reserves the hole by THIS number and nothing measures the
    // React drawn into it, so the hole and the placement must be one number.
    const { result } = mount({ m: OPEN, collapsed: [] }, { ...GROUPING, headerHeight: 64 });

    expect(result.current.rowHeight(0)).toBe(64);
    expect(result.current.rowHeight(1)).toBe(DEFAULT_ROW_HEIGHT);
  });

  it("falls a header back to the default height when the descriptor names none", () => {
    const { result } = mount({ m: OPEN, collapsed: [] });

    expect(result.current.rowHeight(0)).toBe(DEFAULT_GROUP_HEADER_HEIGHT);
  });

  it("leaves every row the grid's own height in a flat grid, which draws no headers", () => {
    // The height is read off the MODEL, not off the grouping config: a flat
    // grid is one whose model has no header rows to be tall.
    const { result } = mountFlat(buildFlatModel(50));

    expect([0, 1, 20].map(result.current.rowHeight)).toEqual([
      DEFAULT_ROW_HEIGHT,
      DEFAULT_ROW_HEIGHT,
      DEFAULT_ROW_HEIGHT,
    ]);
  });

  it("keeps naming the last group it knew while the rows for a jump are loading", () => {
    // Dropping the name the moment the model cannot answer made the banner
    // blink out and back on every scrollbar jump, and the bar changed height
    // with it, which shoved the grid up and down under the pointer.
    const { result, rerender } = mount({ m: OPEN, collapsed: [] });

    rerender({ m: UNKNOWN, collapsed: [] });

    expect(result.current.bannerGroup).toBe(0);
  });

  it("takes the new group the moment the rows say what it is", () => {
    // Holding the last name is for the gap, not past it. The instant the model
    // can answer, the banner has to agree with the rows under it.
    const { result, rerender } = mount({ m: OPEN, collapsed: [] });

    rerender({ m: UNKNOWN, collapsed: [] });
    expect(result.current.bannerGroup).toBe(0);

    rerender({ m: OPEN, collapsed: [] });
    act(() => result.current.trackRegion({ ...VIEWPORT, y: 3 }, 0));

    expect(result.current.bannerGroup).toBe(1);
  });

  it("waits for the collapse to land before moving the view", () => {
    // The collapse is answered by the server. Scrolling straight after the
    // click moves the view using the geometry of the grid that is about to be
    // replaced, and the rows slide out from under it — the user ends up
    // somewhere in the middle of the next group instead of on top of it.
    const { result, scrollTo } = mount({ m: OPEN, collapsed: [] });

    act(() => result.current.revealAfterCollapse(0));

    expect(scrollTo).not.toHaveBeenCalled();
  });

  it("lands on the folded header once the rows without it arrive", () => {
    const { result, rerender, scrollTo } = mount({ m: OPEN, collapsed: [] });

    act(() => result.current.revealAfterCollapse(0));
    rerender({ m: RELOADED, collapsed: [0] });

    expect(scrollTo).toHaveBeenCalledWith(0, 0, "vertical", 0, 0, { vAlign: "start" });
  });

  it("moves the view once, and then leaves the user's scrolling alone", () => {
    const { result, rerender, scrollTo } = mount({ m: OPEN, collapsed: [] });

    act(() => result.current.revealAfterCollapse(0));
    rerender({ m: RELOADED, collapsed: [0] });
    rerender({ m: RELOADED, collapsed: [0] });

    expect(scrollTo).toHaveBeenCalledTimes(1);
  });

  it("gives up if the group is opened again before its rows have gone", () => {
    const { result, rerender, scrollTo } = mount({ m: OPEN, collapsed: [] });

    act(() => result.current.revealAfterCollapse(0));
    rerender({ m: OPEN, collapsed: [] });
    rerender({ m: RELOADED, collapsed: [0] });

    expect(scrollTo).not.toHaveBeenCalled();
  });
});
