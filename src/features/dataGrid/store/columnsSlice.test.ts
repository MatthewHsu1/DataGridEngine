import { describe, expect, it } from "vitest";
import { createColumnsSlice } from "./columnsSlice";

const make = () => createColumnsSlice("test", { defaultOrder: ["a", "b", "c"] });

describe("createColumnsSlice", () => {
  it("toggleColumn hides then shows a field", () => {
    const { reducer, actions } = make();
    let s = reducer(undefined, { type: "@@init" });
    s = reducer(s, actions.toggleColumn("b"));
    expect(s.hidden).toContain("b");
    s = reducer(s, actions.toggleColumn("b"));
    expect(s.hidden).not.toContain("b");
  });

  it("moveColumn ignores an out-of-range source index", () => {
    const { reducer, actions } = make();
    const s0 = reducer(undefined, { type: "@@init" });
    const s1 = reducer(s0, actions.moveColumn({ from: 99, to: 0 }));
    expect(s1.order).toEqual(s0.order);
  });

  it("resizeColumn records a width", () => {
    const { reducer, actions } = make();
    const s = reducer(
      reducer(undefined, { type: "@@init" }),
      actions.resizeColumn({ field: "a", width: 321 }),
    );
    expect(s.widths.a).toBe(321);
  });

  describe("setColumns", () => {
    it("hydrates order/widths/hidden", () => {
      const { reducer, actions } = make();
      let s = reducer(undefined, { type: "@@init" });
      s = reducer(
        s,
        actions.setColumns({ order: ["c", "b", "a"], widths: { b: 50 }, hidden: ["a"] }),
      );
      expect(s.order).toEqual(["c", "b", "a"]);
      expect(s.widths.b).toBe(50);
      expect(s.hidden).toEqual(["a"]);
    });

    it("empty order: [] does NOT blank a populated default order (merge semantics)", () => {
      const { reducer, actions } = make();
      let s = reducer(undefined, { type: "@@init" });
      expect(s.order).toEqual(["a", "b", "c"]);
      s = reducer(s, actions.setColumns({ order: [], widths: { a: 10 }, hidden: [] }));
      expect(s.order).toEqual(["a", "b", "c"]);
    });
  });

  it("resetColumns puts every column back the way the descriptor described it", () => {
    const { reducer, actions } = make();
    let s = reducer(undefined, { type: "@@init" });
    s = reducer(s, actions.toggleColumn("b"));
    s = reducer(s, actions.resizeColumn({ field: "a", width: 321 }));
    s = reducer(s, actions.moveColumn({ from: 0, to: 2 }));

    s = reducer(s, actions.resetColumns());

    expect(s).toEqual({ order: ["a", "b", "c"], widths: {}, hidden: [] });
  });

  it("resetColumns does not hand back the same array the next reset would mutate", () => {
    const { reducer, actions } = make();
    let s = reducer(reducer(undefined, { type: "@@init" }), actions.resetColumns());
    s = reducer(s, actions.moveColumn({ from: 0, to: 2 }));

    expect(reducer(s, actions.resetColumns()).order).toEqual(["a", "b", "c"]);
  });
});
