import { GridCellKind } from "@glideapps/glide-data-grid";
import { describe, expect, it } from "vitest";
import { makePhoneCell, phoneCellDef, phoneCellRenderer, PHONE_CELL_TYPE } from "./phoneCell";

const strict = {};
const nullable = { nullable: true };

const validate = phoneCellDef.validate!;

describe("dg:phone cell", () => {
  it("makePhoneCell builds a custom cell with kind, E.164 value, and E.164 copyData", () => {
    const c = makePhoneCell("+14155552671", strict);
    expect(c.kind).toBe(GridCellKind.Custom);
    expect(c.data).toEqual({ kind: PHONE_CELL_TYPE, value: "+14155552671", options: strict });
    expect(c.copyData).toBe("+14155552671");
  });

  it("makePhoneCell(null) builds a cleared cell with null value and empty copyData", () => {
    const c = makePhoneCell(null, strict);
    expect(c.data).toEqual({ kind: PHONE_CELL_TYPE, value: null, options: strict });
    expect(c.copyData).toBe("");
  });

  it("one renderer serves every phone column, whatever its options", () => {
    expect(phoneCellRenderer.isMatch(makePhoneCell("+14155552671", strict))).toBe(true);
    expect(phoneCellRenderer.isMatch(makePhoneCell("+14155552671", nullable))).toBe(true);
  });

  it("validate blocks empty when not nullable, allows it when nullable", () => {
    expect(validate(makePhoneCell(null, strict) as never)).toBe(false);
    expect(validate(makePhoneCell(null, nullable) as never)).toBe(true);
  });

  it("validate accepts a valid number and rejects a malformed one", () => {
    expect(validate(makePhoneCell("+14155552671", strict) as never)).toBe(true);
    expect(validate(makePhoneCell("+1234", strict) as never)).toBe(false);
  });

  it("onPaste parses a national string to E.164 and rejects junk", () => {
    const onPaste = phoneCellRenderer.onPaste!;
    const data = makePhoneCell(null, strict).data;
    expect(onPaste("(415) 555-2671", data)).toEqual({ ...data, value: "+14155552671" });
    expect(onPaste("garbage", data)).toBeUndefined();
  });

  it("onPaste rejects an empty paste when not nullable but clears when nullable", () => {
    const onPaste = phoneCellRenderer.onPaste!;
    expect(onPaste("   ", makePhoneCell("+14155552671", strict).data)).toBeUndefined();

    const nullableData = makePhoneCell("+14155552671", nullable).data;
    expect(onPaste("   ", nullableData)).toEqual({ ...nullableData, value: null });
  });

  it("parses a national string against the column's own defaultCountry", () => {
    const onPaste = phoneCellRenderer.onPaste!;
    const gb = makePhoneCell(null, { defaultCountry: "GB" as const }).data;
    expect(onPaste("020 7946 0958", gb)).toEqual({ ...gb, value: "+442079460958" });
  });
});

describe("dg:phone allowOverlay", () => {
  it("disables the overlay when allowOverlay is false", () => {
    expect(makePhoneCell("+14155552671", strict, false).allowOverlay).toBe(false);
  });

  it("allows the overlay by default", () => {
    expect(makePhoneCell("+14155552671", strict).allowOverlay).toBe(true);
  });

  it("flags the cell read-only (draws — for empty) when the overlay is disabled", () => {
    expect(makePhoneCell(null, strict, false).data.readOnly).toBe(true);
  });

  it("leaves an editable cell unflagged so an empty value stays blank", () => {
    expect(makePhoneCell("+14155552671", strict).data.readOnly).toBeUndefined();
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
  ({ ctx, rect, theme }) as unknown as Parameters<typeof phoneCellRenderer.draw>[0];

describe("dg:phone draw", () => {
  it("draws an em dash for a read-only empty cell", () => {
    const { ctx, calls } = fakeCtx();
    phoneCellRenderer.draw(drawArgs(ctx), makePhoneCell(null, strict, false));
    expect(calls).toEqual(["—"]);
  });

  it("draws nothing for an editable empty cell", () => {
    const { ctx, calls } = fakeCtx();
    phoneCellRenderer.draw(drawArgs(ctx), makePhoneCell(null, strict));
    expect(calls).toEqual([]);
  });
});
