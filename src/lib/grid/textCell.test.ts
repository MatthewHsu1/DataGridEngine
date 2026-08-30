import { GridCellKind } from "@glideapps/glide-data-grid";
import { describe, expect, it } from "vitest";
import { makeNumberCell } from "./numberCell";
import { makeTextCell, textCellDef, textCellRenderer, TEXT_CELL_TYPE } from "./textCell";

const strict = { required: true, maxLength: 5 };
const optional = { email: true };

const validate = textCellDef.validate!;

describe("dg:text cell", () => {
  it("makeTextCell builds a custom cell with kind, value, options, and string copyData", () => {
    const c = makeTextCell("hi", strict);
    expect(c.kind).toBe(GridCellKind.Custom);
    expect(c.data).toEqual({ kind: TEXT_CELL_TYPE, value: "hi", options: strict });
    expect(c.copyData).toBe("hi");
  });

  it("makeTextCell(null) builds a cleared cell with null value and empty copyData", () => {
    const c = makeTextCell(null, strict);
    expect(c.data).toEqual({ kind: TEXT_CELL_TYPE, value: null, options: strict });
    expect(c.copyData).toBe("");
  });

  it("one renderer serves every text column, whatever its options", () => {
    expect(textCellRenderer.isMatch(makeTextCell("a", strict))).toBe(true);
    expect(textCellRenderer.isMatch(makeTextCell("a", optional))).toBe(true);
  });

  it("the renderer does not match another cell type", () => {
    expect(textCellRenderer.isMatch(makeNumberCell(1, {}) as never)).toBe(false);
  });

  it("validate reads the rules off the cell, not off a factory closure", () => {
    expect(validate(makeTextCell(null, strict) as never)).toBe(false);
    expect(validate(makeTextCell(null, optional) as never)).toBe(true);
  });

  it("validate enforces the configured rules (maxLength / email)", () => {
    expect(validate(makeTextCell("hello", strict) as never)).toBe(true);
    expect(validate(makeTextCell("toolong", strict) as never)).toBe(false);
    expect(validate(makeTextCell("a@b.co", optional) as never)).toBe(true);
    expect(validate(makeTextCell("nope", optional) as never)).toBe(false);
  });

  it("onPaste trims and stores the value, clearing to null when empty", () => {
    const onPaste = textCellRenderer.onPaste!;
    const data = makeTextCell(null, strict).data;
    expect(onPaste("  hey  ", data)).toEqual({ ...data, value: "hey" });
    expect(onPaste("   ", data)).toEqual({ ...data, value: null });
  });
});

describe("dg:text allowOverlay", () => {
  it("disables the overlay when allowOverlay is false", () => {
    expect(makeTextCell("a", strict, false).allowOverlay).toBe(false);
  });

  it("allows the overlay by default", () => {
    expect(makeTextCell("a", strict).allowOverlay).toBe(true);
  });

  it("flags the cell read-only (draws — for empty) when the overlay is disabled", () => {
    expect(makeTextCell(null, strict, false).data.readOnly).toBe(true);
  });

  it("leaves an editable cell unflagged so an empty value stays blank", () => {
    expect(makeTextCell("a", strict).data.readOnly).toBeUndefined();
  });
});

describe("dg:text def", () => {
  it("make() coerces a raw row value and honours ctx.editable", () => {
    const cell = textCellDef.make(42, { editable: false, options: strict });
    expect(cell.allowOverlay).toBe(false);
    expect((cell as unknown as { data: { value: string } }).data.value).toBe("42");
  });

  it("make() reads a null row value as an empty cell", () => {
    const cell = textCellDef.make(null, { editable: true, options: strict });
    expect((cell as unknown as { data: { value: null } }).data.value).toBeNull();
  });
});

function fakeCtx() {
  const calls: string[] = [];
  const ctx = {
    font: "",
    fillStyle: "" as string,
    textBaseline: "alphabetic" as CanvasTextBaseline,
    fillText: (t: string) => {
      calls.push(t);
    },
  };
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls };
}

const theme = {
  textDark: "#111",
  textLight: "#999",
  baseFontFull: "13px sans-serif",
  cellHorizontalPadding: 8,
};
const rect = { x: 0, y: 0, width: 120, height: 34 };
const drawArgs = (ctx: CanvasRenderingContext2D) =>
  ({ ctx, rect, theme }) as unknown as Parameters<typeof textCellRenderer.draw>[0];

describe("dg:text draw", () => {
  it("draws an em dash for a read-only empty cell", () => {
    const { ctx, calls } = fakeCtx();
    textCellRenderer.draw(drawArgs(ctx), makeTextCell(null, strict, false));
    expect(calls).toEqual(["—"]);
  });

  it("draws nothing for an editable empty cell", () => {
    const { ctx, calls } = fakeCtx();
    textCellRenderer.draw(drawArgs(ctx), makeTextCell(null, strict));
    expect(calls).toEqual([]);
  });

  it("draws the text for a non-empty cell", () => {
    const { ctx, calls } = fakeCtx();
    textCellRenderer.draw(drawArgs(ctx), makeTextCell("hi", strict, false));
    expect(calls).toEqual(["hi"]);
  });
});
