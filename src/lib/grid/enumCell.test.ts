import { GridCellKind } from "@glideapps/glide-data-grid";
import { describe, expect, it } from "vitest";
import {
  enumCellDef,
  enumCellRenderer,
  enumColorOf,
  makeEnumCell,
  ENUM_CELL_TYPE,
} from "./enumCell";
import { radixColorByIndex } from "./radixBadgePalette";

const choices = [
  { value: 1, label: "One" },
  { value: 2, label: "Two", color: "red" as const },
];

const strict = { choices };
const nullable = { choices, nullable: true };

describe("dg:enum cell", () => {
  it("makeEnumCell builds a custom cell with kind, value, options, and label copyData", () => {
    const c = makeEnumCell(1, strict);
    expect(c.kind).toBe(GridCellKind.Custom);
    expect(c.data).toEqual({ kind: ENUM_CELL_TYPE, value: 1, options: strict });
    expect(c.copyData).toBe("One");
  });

  it("makeEnumCell(null) builds a cleared cell with null value and empty copyData", () => {
    const c = makeEnumCell(null, nullable);
    expect(c.data).toEqual({ kind: ENUM_CELL_TYPE, value: null, options: nullable });
    expect(c.copyData).toBe("");
  });

  it("one renderer serves every enum column, whatever its choices", () => {
    expect(enumCellRenderer.isMatch(makeEnumCell(1, strict))).toBe(true);
    expect(enumCellRenderer.isMatch(makeEnumCell(1, nullable))).toBe(true);
  });
});

describe("enumColorOf", () => {
  it("uses the index default when no override is given", () => {
    expect(enumColorOf(choices, 1)).toBe(radixColorByIndex(1));
  });

  it("prefers a per-choice override over the index default", () => {
    expect(enumColorOf(choices, 2)).toBe("red");
  });

  it("falls back to the index default for a value no choice names", () => {
    expect(enumColorOf(choices, 9)).toBe(radixColorByIndex(9));
  });
});

describe("dg:enum allowOverlay", () => {
  it("disables the overlay (no Select) when allowOverlay is false", () => {
    expect(makeEnumCell(1, strict, false).allowOverlay).toBe(false);
  });

  it("allows the overlay by default", () => {
    expect(makeEnumCell(1, strict).allowOverlay).toBe(true);
  });

  it("flags the cell read-only (draws — for empty) when the overlay is disabled", () => {
    expect(makeEnumCell(null, nullable, false).data.readOnly).toBe(true);
  });

  it("leaves an editable cell unflagged so an empty value stays blank", () => {
    expect(makeEnumCell(1, strict).data.readOnly).toBeUndefined();
  });
});

describe("dg:enum def", () => {
  it("make() coerces a raw row value and honours ctx.editable", () => {
    const cell = enumCellDef.make("2", { editable: false, options: strict });
    expect(cell.allowOverlay).toBe(false);
    expect((cell as unknown as { data: { value: number } }).data.value).toBe(2);
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
const rect = { x: 0, y: 0, width: 160, height: 34 };
const drawArgs = (ctx: CanvasRenderingContext2D) =>
  ({ ctx, rect, theme }) as unknown as Parameters<typeof enumCellRenderer.draw>[0];

describe("dg:enum draw", () => {
  it("draws an em dash for a read-only empty cell", () => {
    const { ctx, calls } = fakeCtx();
    enumCellRenderer.draw(drawArgs(ctx), makeEnumCell(null, nullable, false));
    expect(calls).toEqual(["—"]);
  });

  it("draws nothing for an editable empty cell", () => {
    const { ctx, calls } = fakeCtx();
    enumCellRenderer.draw(drawArgs(ctx), makeEnumCell(null, nullable));
    expect(calls).toEqual([]);
  });
});
