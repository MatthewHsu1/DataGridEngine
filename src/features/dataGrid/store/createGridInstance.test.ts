import { describe, expect, it } from "vitest";
import { createGridInstance } from "./createGridInstance";
import { defaultColumnsStorageKey } from "./columnsAdapter";
import type { ColumnsAdapter, GridDescriptor } from "../types";

interface Row {
  id: number;
}

function makeDescriptor(
  name: string,
  columns: Partial<GridDescriptor<Row, number>["columns"]> = {},
): GridDescriptor<Row, number> {
  return {
    name,
    rowKey: (r) => r.id,
    columns: {
      defs: {
        id: { field: "id", title: "Id", defaultWidth: 80, editable: false, type: "dg:number" },
      },
      defaultOrder: ["id"],
      ...columns,
    },
    api: {
      fetchRows: async () => [],
      fetchCount: async () => 0,
      fetchRow: async () => null,
      updateRow: async () => ({ ok: true }),
    },
  };
}

describe("createGridInstance", () => {
  it("takes the descriptor and nothing else", () => {
    const inst = createGridInstance(makeDescriptor("plain"));

    expect(typeof inst.reducer).toBe("function");
    expect(typeof inst.selectRoot).toBe("function");
  });

  it("mounts its state under the descriptor name", () => {
    const inst = createGridInstance(makeDescriptor("mounted"));
    const state = inst.reducer(undefined, { type: "@@init" });

    expect(inst.selectRoot({ mounted: state })).toBe(state);
    expect(state.columns.order).toEqual(["id"]);
  });

  it("persists columns by default, with no wiring at all", () => {
    const inst = createGridInstance(makeDescriptor("byDefault"));

    expect(inst.columnsAdapter).not.toBeNull();
  });

  it("persists nothing when the descriptor says so", () => {
    const inst = createGridInstance(makeDescriptor("optedOut", { persist: false }));

    expect(inst.columnsAdapter).toBeNull();
  });

  it("uses the host's adapter over its own", () => {
    const adapter: ColumnsAdapter = {
      loadColumns: async () => null,
      saveColumns: async () => {},
    };
    const inst = createGridInstance(makeDescriptor("hostOwned", { adapter }));

    expect(inst.columnsAdapter).toBe(adapter);
  });

  it("ignores an adapter on a grid that persists nothing", () => {
    const adapter: ColumnsAdapter = {
      loadColumns: async () => null,
      saveColumns: async () => {},
    };
    const inst = createGridInstance(makeDescriptor("off", { persist: false, adapter }));

    expect(inst.columnsAdapter).toBeNull();
  });

  it("keys its default storage off the grid's name", () => {
    expect(defaultColumnsStorageKey("orders")).toBe("datagrid:orders:columns");
  });

  it("knows every built-in cell without being handed one", () => {
    const inst = createGridInstance(makeDescriptor("cells"));

    expect(inst.cells.makeCell("dg:number", 1, { editable: true, options: {} })).toBeDefined();
    expect(inst.cells.makeCell("text", "hi", { editable: true, options: undefined })).toBeDefined();
  });
});
