import { describe, expect, it } from "vitest";
import type { ColumnDef } from "./types";

/**
 * What `ColumnDef` accepts and refuses, checked by the COMPILER.
 *
 * Every `@ts-expect-error` below IS the assertion: `tsc` fails the build if the
 * declaration under it stops being an error, so a branch that quietly goes
 * slack shows up here and nowhere else. `npm run typecheck` runs these; the
 * `it` block exists so the file reports alongside the rest of the suite.
 *
 * The directive sits above the whole declaration rather than above the offending
 * key, because a union mismatch is reported where the object is assigned.
 */

const base = { field: "x", title: "X", defaultWidth: 100, editable: true } as const;

// ─── built-in types are accepted, with their own options ─────────────────────

export const text: ColumnDef = { ...base, type: "dg:text", options: { maxLength: 5 } };
export const number: ColumnDef = { ...base, type: "dg:number", options: { currency: "USD" } };
export const date: ColumnDef = { ...base, type: "dg:date", options: { withTime: true } };
export const phone: ColumnDef = { ...base, type: "dg:phone", options: { nullable: true } };
export const enumCol: ColumnDef = {
  ...base,
  type: "dg:enum",
  options: { choices: [{ value: 0, label: "Draft" }] },
};

/** Options are optional on every built-in but `dg:enum`. */
export const bare: ColumnDef = { ...base, type: "dg:text" };

/** Glide's own kinds need no options at all. */
export const glide: ColumnDef = { ...base, type: "boolean" };

/** A host's own cell type is accepted once it says it is one. */
export const customColumn: ColumnDef = {
  ...base,
  type: "invoice-status",
  custom: true,
  options: { anything: "the host's cell knows" },
};

// ─── a mistyped key INSIDE options is an error ───────────────────────────────

// @ts-expect-error `currncy` is not a NumberCellOptions key
export const typoInOptions: ColumnDef = { ...base, type: "dg:number", options: { currncy: "USD" } };

// ─── a mistyped `type` is an error ───────────────────────────────────────────

// @ts-expect-error "dg:numbr" is not a cell type, and is not marked custom
export const typoInType: ColumnDef = { ...base, type: "dg:numbr" };

// ─── a required option cannot be left out ────────────────────────────────────

// @ts-expect-error `dg:enum` must say what it can hold
export const enumWithoutChoices: ColumnDef = { ...base, type: "dg:enum" };

// ─── a setting belonging to another cell type is an error ────────────────────

// @ts-expect-error `withTime` belongs to dg:date, not dg:text
export const wrongCellsOption: ColumnDef = {
  ...base,
  type: "dg:text",
  options: { withTime: true },
};

// ─── a key that belongs to no branch at all is an error ──────────────────────

// @ts-expect-error `withTime` moved into options; it is not a column field
export const strayKey: ColumnDef = { ...base, type: "dg:date", withTime: true };

// ─── glide's kinds take no options ───────────────────────────────────────────

// @ts-expect-error glide draws these; there is nothing of ours to configure
export const glideWithOptions: ColumnDef = { ...base, type: "text", options: { maxLength: 5 } };

// ─── a host type must declare itself ─────────────────────────────────────────

// @ts-expect-error without `custom: true` the type must be one this package knows
export const customWithoutMarker: ColumnDef = { ...base, type: "invoice-status" };

describe("ColumnDef", () => {
  it("is checked by tsc, not by assertions here", () => {
    // The file compiling at all IS the test. This keeps it in the suite report.
    expect(text.type).toBe("dg:text");
    expect(customColumn.custom).toBe(true);
  });
});
