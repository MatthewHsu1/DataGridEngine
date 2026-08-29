import { describe, expect, it } from "vitest";
import { GridCellKind, type CustomCell, type GridCell } from "@glideapps/glide-data-grid";
import { createCellRegistry, resolveCellRegistry, type CellTypeDef } from "./cellRegistry";
import { ENUM_CELL_TYPE } from "./enumCell";
import { TEXT_CELL_TYPE } from "./textCell";

const plainText = (s: string): GridCell => ({
  kind: GridCellKind.Text,
  data: s,
  displayData: s,
  allowOverlay: false,
});

const defs: CellTypeDef[] = [
  { type: "plain", make: (raw) => plainText(String(raw ?? "")) },
  {
    type: "phone",
    kind: "phone",
    make: (raw) => ({
      kind: GridCellKind.Custom,
      allowOverlay: true,
      copyData: String(raw ?? ""),
      data: { kind: "phone", value: raw ?? null },
    }),
    renderer: {
      kind: GridCellKind.Custom,
      isMatch: () => true,
      draw: () => {},
      provideEditor: () => undefined,
    } as never,
    validate: (cell) => (cell.data as unknown as { value: unknown }).value !== "bad",
  },
];

const ctx = { editable: false, options: undefined };

describe("createCellRegistry", () => {
  it("makeCell dispatches by column type", () => {
    const r = createCellRegistry(defs);
    expect(r.makeCell("plain", "hi", ctx)).toMatchObject({ data: "hi" });
  });

  it("collects only defined renderers", () => {
    const r = createCellRegistry(defs);
    expect(r.customRenderers).toHaveLength(1);
  });

  it("validateCell routes custom cells by kind and passes everything else", () => {
    const r = createCellRegistry(defs);
    const custom = (value: unknown, kind = "phone") =>
      ({
        kind: GridCellKind.Custom,
        data: { kind, value },
        copyData: "",
        allowOverlay: true,
      }) as unknown as CustomCell<{ kind: string }>;

    expect(r.validateCell(custom("ok"))).toBe(true);
    expect(r.validateCell(custom("bad"))).toBe(false);
    expect(r.validateCell(custom("x", "mystery"))).toBe(true); // no validator → valid
    expect(r.validateCell(plainText("x"))).toBe(true); // non-custom → valid
  });

  it("throws on an unknown column type (fail fast, not a blank cell)", () => {
    const r = createCellRegistry(defs);
    expect(() => r.makeCell("nope", 1, ctx)).toThrow(/unknown cell type/i);
  });
});

describe("resolveCellRegistry", () => {
  it("knows every dg: cell without being handed one", () => {
    const r = resolveCellRegistry();
    const cell = r.makeCell(TEXT_CELL_TYPE, "hi", { editable: true, options: {} });
    expect((cell as unknown as { data: { value: string } }).data.value).toBe("hi");
  });

  it("knows glide's own kinds under glide's own names", () => {
    const r = resolveCellRegistry();
    expect(r.makeCell("text", "hi", ctx).kind).toBe(GridCellKind.Text);
    expect(r.makeCell("boolean", true, ctx).kind).toBe(GridCellKind.Boolean);
  });

  it("registers one renderer per dg: cell and none for glide's kinds", () => {
    // Five drawn by this package; glide draws its own, so they add nothing here.
    expect(resolveCellRegistry().customRenderers).toHaveLength(5);
  });

  it("lets a host's def of the same type win over the built-in", () => {
    const mine: CellTypeDef = { type: ENUM_CELL_TYPE, make: () => plainText("mine") };
    const r = resolveCellRegistry([mine]);

    expect(r.makeCell(ENUM_CELL_TYPE, 1, ctx)).toMatchObject({ data: "mine" });
  });

  it("adds a host's own type alongside the built-ins", () => {
    const mine: CellTypeDef = { type: "invoice-status", make: () => plainText("custom") };
    const r = resolveCellRegistry([mine]);

    expect(r.makeCell("invoice-status", 1, ctx)).toMatchObject({ data: "custom" });
    expect(r.makeCell("text", "still here", ctx).kind).toBe(GridCellKind.Text);
  });

  it("hands the column's options to the maker", () => {
    const seen: unknown[] = [];
    const mine: CellTypeDef = {
      type: "spy",
      make: (_raw, c) => {
        seen.push(c.options);
        return plainText("");
      },
    };

    resolveCellRegistry([mine]).makeCell("spy", 1, { editable: true, options: { a: 1 } });

    expect(seen).toEqual([{ a: 1 }]);
  });
});
