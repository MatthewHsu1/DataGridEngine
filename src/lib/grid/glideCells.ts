import { GridCellKind, type GridCell } from "@glideapps/glide-data-grid";
import type { CellTypeDef } from "./cellRegistry";

/**
 * Glide's own cell kinds, reachable from a `ColumnDef` by glide's own name.
 *
 * A column that writes `type: "text"` gets a plain glide `TextCell` — no
 * renderer of ours, no editor of ours, nothing to register. That is the point:
 * the engine's five `dg:` cells are additions to glide's set, never a
 * replacement for it, and a host that wants glide's boolean should not have to
 * rebuild it as a custom cell first.
 *
 * The names here are glide's, unprefixed, which is exactly why every cell this
 * package DRAWS is prefixed `dg:`. The two sets never collide, and glide may add
 * kinds to its own set without ever colliding with ours.
 *
 * Absent are glide's internal kinds — `custom`, `loading`, `protected`, and
 * `row-id`. They describe a cell's STATE rather than a column's data, and the
 * engine already answers `loading` itself for a row it has not fetched.
 */

/**
 * Read a value that may be one item or many as a list.
 *
 * `image`, `bubble`, and `drilldown` are the only cells whose row field is a
 * list, and a server field like `avatarUrl` is one string. Wrapping a lone
 * value here is what stops every such host mapping `[row.avatarUrl]` by hand on
 * every row.
 */
function asStringArray(raw: unknown): string[] {
  if (raw == null) return [];
  if (Array.isArray(raw)) return raw.filter((v) => v != null).map((v) => String(v));

  return [String(raw)];
}

function asText(raw: unknown): string {
  return raw == null ? "" : String(raw);
}

export const glideTextCellDef: CellTypeDef = {
  type: "text",
  make: (raw, ctx): GridCell => ({
    kind: GridCellKind.Text,
    data: asText(raw),
    displayData: asText(raw),
    allowOverlay: ctx.editable,
    readonly: !ctx.editable,
  }),
};

export const glideNumberCellDef: CellTypeDef = {
  type: "number",
  make: (raw, ctx): GridCell => {
    const value = raw == null || raw === "" ? undefined : Number(raw);

    return {
      kind: GridCellKind.Number,
      data: value,
      displayData: value === undefined || Number.isNaN(value) ? "" : String(value),
      allowOverlay: ctx.editable,
      readonly: !ctx.editable,
    };
  },
};

export const glideBooleanCellDef: CellTypeDef = {
  type: "boolean",
  make: (raw, ctx): GridCell => ({
    kind: GridCellKind.Boolean,
    data: raw == null ? null : Boolean(raw),

    // Glide's boolean is a checkbox drawn in the cell, toggled by a click on
    // the cell itself. It has no overlay editor at all, so `allowOverlay` is
    // false whether or not the column is editable; `readonly` is what decides
    // whether the click does anything.
    allowOverlay: false,
    readonly: !ctx.editable,
  }),
};

export const glideUriCellDef: CellTypeDef = {
  type: "uri",
  make: (raw, ctx): GridCell => ({
    kind: GridCellKind.Uri,
    data: asText(raw),
    allowOverlay: ctx.editable,
    readonly: !ctx.editable,
  }),
};

export const glideMarkdownCellDef: CellTypeDef = {
  type: "markdown",
  make: (raw, ctx): GridCell => ({
    kind: GridCellKind.Markdown,
    data: asText(raw),
    allowOverlay: ctx.editable,
    readonly: !ctx.editable,
  }),
};

export const glideImageCellDef: CellTypeDef = {
  type: "image",
  make: (raw): GridCell => ({
    kind: GridCellKind.Image,
    data: asStringArray(raw),
    allowOverlay: false,
    readonly: true,
  }),
};

export const glideBubbleCellDef: CellTypeDef = {
  type: "bubble",
  make: (raw): GridCell => ({
    kind: GridCellKind.Bubble,
    data: asStringArray(raw),
    allowOverlay: false,
  }),
};

export const glideDrilldownCellDef: CellTypeDef = {
  type: "drilldown",
  make: (raw): GridCell => ({
    kind: GridCellKind.Drilldown,
    data: asStringArray(raw).map((text) => ({ text })),
    allowOverlay: false,
  }),
};

/** Every glide kind a column may name, in one list. */
export const glideCellDefs: CellTypeDef[] = [
  glideTextCellDef,
  glideNumberCellDef,
  glideBooleanCellDef,
  glideUriCellDef,
  glideMarkdownCellDef,
  glideImageCellDef,
  glideBubbleCellDef,
  glideDrilldownCellDef,
];
