import type { CustomCell, CustomRenderer } from "@glideapps/glide-data-grid";
import type { CellTypeDef } from "./cellRegistry";
import { createCustomCell, drawEmptyDash, makeCustomCell } from "./createCustomCell";
import { resolveEnumOption, type EnumCellOptions } from "./enumChoices";
import { EnumCellEditor } from "./enumCellEditor";
import { drawSoftBadge } from "./softBadge";

/** The `ColumnDef.type` string that selects this cell. */
export const ENUM_CELL_TYPE = "dg:enum";

export { enumColorOf, resolveEnumOption } from "./enumChoices";
export type { EnumCellOptions, EnumOption } from "./enumChoices";

/** Cell payload. `value` is the enum, or null for an unset cell. */
export interface EnumCellData {
  kind: string;
  value: number | null;
  readOnly?: boolean;
  options: EnumCellOptions;
}

export const enumCellRenderer: CustomRenderer<CustomCell<EnumCellData>> =
  createCustomCell<EnumCellData>({
    kind: ENUM_CELL_TYPE,
    draw: (args, data) => {
      if (data.value == null) {
        if (data.readOnly) drawEmptyDash(args);
        return;
      }

      const { label, color } = resolveEnumOption(data.options.choices, data.value);

      // Pass the grid's base font so drawSoftBadge measures with the same font it
      // renders (glide's FullTheme exposes the composed font as `baseFontFull`).
      drawSoftBadge(args.ctx, args.rect, color, label, args.theme.baseFontFull);
    },
    editor: EnumCellEditor,
  });

export function makeEnumCell(
  value: number | null,
  options: EnumCellOptions,
  allowOverlay = true,
): CustomCell<EnumCellData> {
  return makeCustomCell(
    { kind: ENUM_CELL_TYPE, value, options, ...(allowOverlay ? {} : { readOnly: true }) },
    value == null ? "" : resolveEnumOption(options.choices, value).label,
    allowOverlay,
  );
}

export const enumCellDef: CellTypeDef = {
  type: ENUM_CELL_TYPE,
  kind: ENUM_CELL_TYPE,
  renderer: enumCellRenderer as unknown as CustomRenderer,
  make: (raw, ctx) =>
    makeEnumCell(raw == null ? null : Number(raw), ctx.options as EnumCellOptions, ctx.editable),
};
