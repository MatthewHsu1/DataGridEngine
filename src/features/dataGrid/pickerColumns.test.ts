import { describe, expect, it } from "vitest";
import { pickerColumns } from "./pickerColumns";
import type { ColumnDef } from "./types";

const DEFS: Record<string, ColumnDef> = {
  id: { field: "id", title: "ID", defaultWidth: 80, editable: false, type: "int" },
  name: { field: "name", title: "Name", defaultWidth: 200, editable: true, type: "text" },
  region: { field: "region", title: "Region", defaultWidth: 120, editable: false, type: "region" },
};

const ORDER = ["id", "name", "region"];

describe("pickerColumns", () => {
  it("lists the columns in the order the grid draws them", () => {
    const rows = pickerColumns(DEFS, ["region", "id", "name"], [], undefined);

    expect(rows.map((r) => r.field)).toEqual(["region", "id", "name"]);
  });

  it("takes each column's name from the descriptor", () => {
    expect(pickerColumns(DEFS, ORDER, [], undefined)[0].title).toBe("ID");
  });

  it("marks the columns the grid is not drawing", () => {
    const rows = pickerColumns(DEFS, ORDER, ["name"], undefined);

    expect(rows.find((r) => r.field === "name")?.hidden).toBe(true);
    expect(rows.find((r) => r.field === "id")?.hidden).toBe(false);
  });

  it("marks the column the grid groups by", () => {
    const rows = pickerColumns(DEFS, ORDER, [], "region");

    expect(rows.find((r) => r.field === "region")?.grouped).toBe(true);
    expect(rows.find((r) => r.field === "id")?.grouped).toBe(false);
  });

  it("marks nothing in a grid that is not grouping", () => {
    const rows = pickerColumns(DEFS, ORDER, [], undefined);

    expect(rows.some((r) => r.grouped)).toBe(false);
  });

  it("skips an ordered field the descriptor never defined", () => {
    // A stored column order outlives the descriptor that wrote it. A field
    // dropped from the code would otherwise crash the picker on a title read.
    const rows = pickerColumns(DEFS, [...ORDER, "ghost"], [], undefined);

    expect(rows.map((r) => r.field)).toEqual(ORDER);
  });
});
