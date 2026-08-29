import type { DrawHeaderCallback } from "@glideapps/glide-data-grid";
import { describe, expect, it, vi } from "vitest";
import { mergeHeaderIcons, withSortArgs, type GridDrawHeaderArgs } from "./headerDoors";
import { SORT_ASC_ICON, SORT_DESC_ICON } from "./headerIcons";
import type { GridSort } from "./types";

const glideArgs = (id: string) =>
  ({ column: { id, title: id } }) as unknown as Parameters<DrawHeaderCallback>[0];

describe("mergeHeaderIcons", () => {
  it("keeps the engine's sort chevrons when the host names none", () => {
    const merged = mergeHeaderIcons(undefined);

    expect(Object.keys(merged)).toEqual([SORT_ASC_ICON, SORT_DESC_ICON]);
  });

  it("adds the host's icon without taking the chevrons with it", () => {
    const mine = () => "<svg/>";
    const merged = mergeHeaderIcons({ mine });

    expect(merged.mine).toBe(mine);
    expect(merged[SORT_ASC_ICON]).toBeDefined();
    expect(merged[SORT_DESC_ICON]).toBeDefined();
  });

  it("lets the host replace one entry by name", () => {
    const mine = () => "<svg/>";
    const merged = mergeHeaderIcons({ [SORT_ASC_ICON]: mine });

    expect(merged[SORT_ASC_ICON]).toBe(mine);
    expect(merged[SORT_DESC_ICON]).not.toBe(mine);
  });
});

describe("withSortArgs", () => {
  const sort: GridSort = { field: "price", dir: "asc" };
  const always = () => true;

  it("hands back nothing when the host draws no header, so glide keeps its own", () => {
    expect(withSortArgs(undefined, sort, always)).toBeUndefined();
  });

  it("puts the grid's sort on the args", () => {
    const seen: GridDrawHeaderArgs[] = [];
    const wrapped = withSortArgs((args) => void seen.push(args), sort, always)!;

    wrapped(glideArgs("price"), () => {});

    expect(seen[0].sort).toEqual(sort);
  });

  it("reports the sort even on a column it is not about, so the host can compare", () => {
    const seen: GridDrawHeaderArgs[] = [];
    const wrapped = withSortArgs((args) => void seen.push(args), sort, always)!;

    wrapped(glideArgs("name"), () => {});

    expect(seen[0].sort).toEqual(sort);
    expect(seen[0].column.id).toBe("name");
  });

  it("reports natural order as null", () => {
    const seen: GridDrawHeaderArgs[] = [];
    const wrapped = withSortArgs((args) => void seen.push(args), null, always)!;

    wrapped(glideArgs("price"), () => {});

    expect(seen[0].sort).toBeNull();
  });

  it("says per column whether a sort menu is offered", () => {
    const seen: GridDrawHeaderArgs[] = [];
    const wrapped = withSortArgs(
      (args) => void seen.push(args),
      null,
      (f) => f === "price",
    )!;

    wrapped(glideArgs("price"), () => {});
    wrapped(glideArgs("value"), () => {});

    expect(seen.map((a) => a.sortable)).toEqual([true, false]);
  });

  it("keeps every arg glide passed, so a glide drawHeader works unchanged", () => {
    const seen: GridDrawHeaderArgs[] = [];
    const wrapped = withSortArgs((args) => void seen.push(args), null, always)!;

    wrapped(glideArgs("price"), () => {});

    expect(seen[0].column.title).toBe("price");
  });

  it("passes glide's own drawDefault straight through", () => {
    const drawDefault = vi.fn();
    const wrapped = withSortArgs((_args, d) => d(), null, always)!;

    wrapped(glideArgs("price"), drawDefault);

    expect(drawDefault).toHaveBeenCalledOnce();
  });
});
