import { describe, expect, it } from "vitest";
import { sortablePredicate } from "./sortable";
import type { ColumnDef } from "./types";

const DEFS: Record<string, ColumnDef> = {
  id: { field: "id", title: "ID", defaultWidth: 80, editable: false, type: "int" },
  name: { field: "name", title: "Name", defaultWidth: 200, editable: true, type: "text" },
  value: {
    field: "value",
    title: "Value",
    defaultWidth: 140,
    editable: false,
    type: "currency",
    sortable: false,
  },
};

describe("sortablePredicate", () => {
  it("offers every column that says nothing", () => {
    const sortable = sortablePredicate(DEFS);

    expect(sortable("name")).toBe(true);
    expect(sortable("id")).toBe(true);
  });

  it("does not tie the answer to whether the column can be edited", () => {
    expect(sortablePredicate(DEFS)("id")).toBe(true);
  });

  it("refuses the column that says the server cannot order by it", () => {
    expect(sortablePredicate(DEFS)("value")).toBe(false);
  });

  it("refuses a field the grid does not draw", () => {
    expect(sortablePredicate(DEFS)("gone")).toBe(false);
  });
});
