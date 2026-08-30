import { describe, expect, it } from "vitest";
import {
  dateCellDef,
  dateCellRenderer,
  makeDateCell,
  DATE_CELL_TYPE,
  type DateCellData,
} from "./dateCell";

const dateOnly = { nullable: true };
const withTime = { nullable: true, withTime: true };

const validate = dateCellDef.validate!;

describe("dg:date makeDateCell", () => {
  it("stores the ISO value, the column's options, and ISO copyData", () => {
    const cell = makeDateCell("2026-06-20T00:00:00Z", withTime);
    expect(cell.data.kind).toBe(DATE_CELL_TYPE);
    expect(cell.data.value).toBe("2026-06-20T00:00:00Z");
    expect(cell.data.options.withTime).toBe(true);
    expect(cell.copyData).toBe("2026-06-20T00:00:00Z");
  });

  it("renders a null value as empty copyData", () => {
    const cell = makeDateCell(null, dateOnly);
    expect(cell.data.value).toBeNull();
    expect(cell.data.options.withTime).toBeUndefined();
    expect(cell.copyData).toBe("");
  });

  it("disables the overlay when allowOverlay is false", () => {
    expect(makeDateCell("2026-06-20T00:00:00Z", dateOnly, false).allowOverlay).toBe(false);
  });

  it("allows the overlay by default", () => {
    expect(makeDateCell("2026-06-20T00:00:00Z", dateOnly).allowOverlay).toBe(true);
  });

  it("flags the cell read-only (draws — for empty) when the overlay is disabled", () => {
    expect(makeDateCell(null, dateOnly, false).data.readOnly).toBe(true);
  });

  it("leaves an editable cell unflagged so an empty value stays blank", () => {
    expect(makeDateCell(null, dateOnly).data.readOnly).toBeUndefined();
  });
});

describe("dg:date validate", () => {
  it("accepts a valid ISO value", () => {
    expect(validate(makeDateCell("2026-06-20T00:00:00Z", dateOnly) as never)).toBe(true);
  });

  it("accepts empty when the column is nullable", () => {
    expect(validate(makeDateCell(null, dateOnly) as never)).toBe(true);
  });

  it("rejects empty when the column is not nullable", () => {
    expect(validate(makeDateCell(null, {}) as never)).toBe(false);
  });

  it("rejects a malformed non-empty value", () => {
    expect(validate(makeDateCell("garbage", dateOnly) as never)).toBe(false);
  });
});

describe("dg:date renderer", () => {
  it("matches cells of its kind", () => {
    expect(dateCellRenderer.isMatch(makeDateCell("2026-06-20T00:00:00Z", dateOnly))).toBe(true);
  });
});

describe("dg:date onPaste", () => {
  const baseData: DateCellData = { kind: DATE_CELL_TYPE, value: null, options: dateOnly };

  it("pins a pasted ISO date to UTC midnight for a date-only cell", () => {
    expect(dateCellRenderer.onPaste?.("2026-06-20", baseData)).toEqual({
      ...baseData,
      value: "2026-06-20T00:00:00.000Z",
    });
  });

  it("rejects an unparseable paste (returns undefined)", () => {
    expect(dateCellRenderer.onPaste?.("garbage", baseData)).toBeUndefined();
  });

  it("accepts an empty paste as null because the column is nullable", () => {
    expect(dateCellRenderer.onPaste?.("   ", baseData)).toEqual({ ...baseData, value: null });
  });

  it("rejects an empty paste when the column is not nullable", () => {
    const strict: DateCellData = { kind: DATE_CELL_TYPE, value: null, options: {} };
    expect(dateCellRenderer.onPaste?.("   ", strict)).toBeUndefined();
  });

  it("preserves the time component when the column is withTime", () => {
    const timed: DateCellData = { kind: DATE_CELL_TYPE, value: null, options: withTime };
    expect(dateCellRenderer.onPaste?.("2026-06-20T14:30:00Z", timed)).toEqual({
      ...timed,
      value: "2026-06-20T14:30:00.000Z",
    });
  });
});

describe("dg:date def", () => {
  it("reads withTime off the column's options, not off a ctx field", () => {
    const cell = dateCellDef.make("2026-06-20T00:00:00Z", {
      editable: true,
      options: withTime,
    });
    expect((cell as unknown as { data: DateCellData }).data.options.withTime).toBe(true);
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
  ({ ctx, rect, theme }) as unknown as Parameters<typeof dateCellRenderer.draw>[0];

describe("dg:date draw", () => {
  it("draws an em dash for a read-only empty cell", () => {
    const { ctx, calls } = fakeCtx();
    dateCellRenderer.draw(drawArgs(ctx), makeDateCell(null, dateOnly, false));
    expect(calls).toEqual(["—"]);
  });

  it("draws nothing for an editable empty cell", () => {
    const { ctx, calls } = fakeCtx();
    dateCellRenderer.draw(drawArgs(ctx), makeDateCell(null, dateOnly));
    expect(calls).toEqual([]);
  });

  it("draws the localized date for a non-empty cell", () => {
    const { ctx, calls } = fakeCtx();
    dateCellRenderer.draw(drawArgs(ctx), makeDateCell("2026-06-20T00:00:00Z", dateOnly, false));
    expect(calls).toEqual(["6/20/2026"]);
  });
});
