import { describe, expect, it, vi } from "vitest";
import { groupBanner } from "./groupBanner";
import type { GridGrouping } from "./types";

interface Row {
  region: number;
}

const GROUPING: GridGrouping<Row, number> = {
  field: "region",
  of: (row) => row.region,
  order: (g) => g,
  label: (g) => `Region ${g}`,
};

const ARGS = {
  grouping: GROUPING,
  collapsedGroups: [] as readonly number[],
  textColor: () => "#111",
  onToggle: () => {},
};

describe("groupBanner", () => {
  it("names the group the viewport is inside", () => {
    expect(groupBanner(0, ARGS).banner?.label).toBe("Region 0");
  });

  it("colours the name with the colour it is handed", () => {
    expect(groupBanner(0, { ...ARGS, textColor: () => "#c0ffee" }).banner?.textColor).toBe(
      "#c0ffee",
    );
  });

  it("reads collapsed from the store, not from the model", () => {
    // A collapse is answered by the server dropping the group's rows. The
    // model still reports the group as open until they go, so an arrow read
    // from it sits the wrong way round for the whole load.
    expect(groupBanner(1, { ...ARGS, collapsedGroups: [1] }).banner?.collapsed).toBe(true);
  });

  it("toggles the group it names, and nothing else", () => {
    const onToggle = vi.fn();

    groupBanner(2, { ...ARGS, onToggle }).banner?.onToggle();

    expect(onToggle).toHaveBeenCalledWith(2);
  });

  it("shows no banner for a grid that is not grouping", () => {
    expect(groupBanner(0, { ...ARGS, grouping: undefined })).toEqual({
      banner: null,
      slot: undefined,
    });
  });

  it("shows no banner while the group is unknown", () => {
    expect(groupBanner(null, ARGS).banner).toBeNull();
  });

  it("draws the host's components for the current group", () => {
    const grouping = { ...GROUPING, header: (g: number) => `slot ${g}` };

    expect(groupBanner(3, { ...ARGS, grouping }).slot).toBe("slot 3");
  });

  it("leaves no slot row at all when the host has no components", () => {
    expect(groupBanner(0, ARGS).slot).toBeUndefined();
  });

  it("keeps an EMPTY slot row while the group is unknown, so the bar cannot change height", () => {
    // Dropping the row on every scrollbar jump took its height with it and
    // shoved the grid up and down under the pointer. `null` holds the space.
    const grouping = { ...GROUPING, header: (g: number) => `slot ${g}` };

    expect(groupBanner(null, { ...ARGS, grouping }).slot).toBeNull();
  });
});
