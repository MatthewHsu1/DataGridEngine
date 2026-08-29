import { GridCellKind } from "@glideapps/glide-data-grid";
import { describe, expect, it } from "vitest";
import { makeNumberCell, numberCellDef, numberCellRenderer, NUMBER_CELL_TYPE } from "./numberCell";

const bounded = { min: 0, max: 100 };
const nullable = { min: 0, max: 100, nullable: true };

const validate = numberCellDef.validate!;

describe("dg:number cell", () => {
  it("makeNumberCell builds a custom cell with kind, value, options, and string copyData", () => {
    const c = makeNumberCell(42.5, bounded);
    expect(c.kind).toBe(GridCellKind.Custom);
    expect(c.data).toEqual({ kind: NUMBER_CELL_TYPE, value: 42.5, options: bounded });
    expect(c.copyData).toBe("42.5");
  });

  it("makeNumberCell(null) builds a cleared cell with null value and empty copyData", () => {
    const c = makeNumberCell(null, bounded);
    expect(c.data).toEqual({ kind: NUMBER_CELL_TYPE, value: null, options: bounded });
    expect(c.copyData).toBe("");
  });

  it("one renderer serves every number column, whatever its options", () => {
    expect(numberCellRenderer.isMatch(makeNumberCell(1, bounded))).toBe(true);
    expect(numberCellRenderer.isMatch(makeNumberCell(1, nullable))).toBe(true);
  });

  it("validate blocks empty when not nullable, allows it when nullable", () => {
    expect(validate(makeNumberCell(null, bounded) as never)).toBe(false);
    expect(validate(makeNumberCell(null, nullable) as never)).toBe(true);
  });

  it("validate accepts in-range and rejects out-of-range values", () => {
    expect(validate(makeNumberCell(50, bounded) as never)).toBe(true);
    expect(validate(makeNumberCell(500, bounded) as never)).toBe(false);
  });

  it("onPaste parses a separated string and rejects junk / out-of-range", () => {
    const onPaste = numberCellRenderer.onPaste!;
    const data = makeNumberCell(null, bounded).data;
    expect(onPaste("50", data)).toEqual({ ...data, value: 50 });
    expect(onPaste("garbage", data)).toBeUndefined();
    expect(onPaste("500", data)).toBeUndefined();
  });

  it("onPaste rejects empty when not nullable but clears when nullable", () => {
    const onPaste = numberCellRenderer.onPaste!;
    expect(onPaste("   ", makeNumberCell(1, bounded).data)).toBeUndefined();

    const nullableData = makeNumberCell(1, nullable).data;
    expect(onPaste("   ", nullableData)).toEqual({ ...nullableData, value: null });
  });
});

describe("dg:number allowOverlay", () => {
  it("disables the overlay when allowOverlay is false", () => {
    expect(makeNumberCell(1, bounded, false).allowOverlay).toBe(false);
  });

  it("allows the overlay by default", () => {
    expect(makeNumberCell(1, bounded).allowOverlay).toBe(true);
  });

  it("flags the cell read-only (draws — for empty) when the overlay is disabled", () => {
    expect(makeNumberCell(1, bounded, false).data.readOnly).toBe(true);
  });

  it("leaves an editable cell unflagged so an empty value stays blank", () => {
    expect(makeNumberCell(1, bounded).data.readOnly).toBeUndefined();
  });
});

describe("dg:number def", () => {
  it("make() coerces a raw row value and honours ctx.editable", () => {
    const cell = numberCellDef.make("42.5", { editable: false, options: bounded });
    expect(cell.allowOverlay).toBe(false);
    expect((cell as unknown as { data: { value: number } }).data.value).toBe(42.5);
  });

  it("make() reads a null row value as an empty cell", () => {
    const cell = numberCellDef.make(null, { editable: true, options: bounded });
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
  return { ctx: ctx as unknown as CanvasRenderingContext2D, calls, raw: ctx };
}

const theme = {
  textDark: "#111",
  textLight: "#999",
  baseFontFull: "13px sans-serif",
  cellHorizontalPadding: 8,
};
const rect = { x: 0, y: 0, width: 120, height: 34 };
const drawArgs = (ctx: CanvasRenderingContext2D) =>
  ({ ctx, rect, theme }) as unknown as Parameters<typeof numberCellRenderer.draw>[0];

describe("dg:number draw", () => {
  it("draws an em dash for a read-only empty cell", () => {
    const { ctx, calls, raw } = fakeCtx();
    numberCellRenderer.draw(drawArgs(ctx), makeNumberCell(null, bounded, false));
    expect(calls).toEqual(["—"]);
    expect(raw.fillStyle).toBe("#999");
  });

  it("draws nothing for an editable empty cell", () => {
    const { ctx, calls } = fakeCtx();
    numberCellRenderer.draw(drawArgs(ctx), makeNumberCell(null, bounded));
    expect(calls).toEqual([]);
  });

  it("draws the formatted value for a non-empty cell", () => {
    const { ctx, calls, raw } = fakeCtx();
    numberCellRenderer.draw(drawArgs(ctx), makeNumberCell(42.5, bounded, false));
    expect(calls).toEqual(["42.5"]);
    expect(raw.fillStyle).toBe("#111");
  });

  it("draws each column's own format, from the cell's own options", () => {
    const { ctx, calls } = fakeCtx();
    const currency = { format: "currency" as const, currency: "USD", decimalScale: 2 };
    numberCellRenderer.draw(drawArgs(ctx), makeNumberCell(1234.5, currency, false));
    expect(calls[0]).toContain("1,234.50");
  });
});
