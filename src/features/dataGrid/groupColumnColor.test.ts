import { describe, expect, it } from "vitest";
import { radixColorByIndex } from "../../lib/grid/radixBadgePalette";
import { groupColumnColor } from "./groupColumnColor";
import type { ColumnDef, GridGrouping } from "./types";

interface Row {
  region: number;
}

const enumColumn: ColumnDef = {
  field: "region",
  title: "Region",
  defaultWidth: 100,
  editable: false,
  type: "dg:enum",
  options: {
    choices: [
      { value: 0, label: "APAC", color: "cyan" },
      { value: 1, label: "EMEA" },
    ],
  },
};

const textColumn: ColumnDef = {
  field: "sector",
  title: "Sector",
  defaultWidth: 100,
  editable: false,
  type: "dg:text",
};

const grouping = (over: Partial<GridGrouping<Row, number>> = {}): GridGrouping<Row, number> => ({
  field: "region",
  of: (r) => r.region,
  order: (g) => g,
  label: String,
  ...over,
});

describe("groupColumnColor", () => {
  it("colours a group from the enum column it groups by", () => {
    const color = groupColumnColor(grouping(), { region: enumColumn });

    expect(color?.(0)).toBe("cyan");
  });

  it("falls back to the palette for a choice with no colour of its own", () => {
    const color = groupColumnColor(grouping(), { region: enumColumn });

    expect(color?.(1)).toBe(radixColorByIndex(1));
  });

  it("lets the descriptor's own color win", () => {
    const color = groupColumnColor(grouping({ color: () => "red" }), { region: enumColumn });

    expect(color?.(0)).toBe("red");
  });

  it("answers nothing when the grouped column is not an enum", () => {
    expect(groupColumnColor(grouping({ field: "sector" }), { sector: textColumn })).toBeUndefined();
  });

  it("answers nothing when the grouped field is not a column at all", () => {
    expect(groupColumnColor(grouping({ field: "ghost" }), { region: enumColumn })).toBeUndefined();
  });

  it("answers nothing for a flat grid", () => {
    expect(groupColumnColor(undefined, { region: enumColumn })).toBeUndefined();
  });

  it("answers nothing for a group value that cannot index the choices", () => {
    const color = groupColumnColor(grouping() as unknown as GridGrouping<Row, string>, {
      region: enumColumn,
    });

    expect(color?.("APAC")).toBeUndefined();
  });
});
