import type { CustomCell, CustomRenderer } from "@glideapps/glide-data-grid";
import { formatDateDisplay, isValidDateValue, parseDatePaste } from "../date/dateUtils";
import type { CellTypeDef } from "./cellRegistry";
import { createCustomCell, drawEmptyDash, makeCustomCell } from "./createCustomCell";
import { DateCellEditor } from "./dateCellEditor";

/** The `ColumnDef.type` string that selects this cell. */
export const DATE_CELL_TYPE = "dg:date";

/**
 * Per-column settings for a `dg:date` column, written on the column's `options`.
 *
 * `withTime` used to sit on `ColumnDef` itself, which made one cell type's
 * setting a field every other column carried and ignored.
 */
export interface DateCellOptions {
  /** Allow an empty cell. */
  nullable?: boolean;

  /** Keep the time part instead of a floating calendar date. */
  withTime?: boolean;
}

/** Cell payload. `value` is a canonical UTC ISO string, or null for an unset cell. */
export interface DateCellData {
  kind: string;
  value: string | null;
  readOnly?: boolean;
  options: DateCellOptions;
}

export const dateCellRenderer: CustomRenderer<CustomCell<DateCellData>> =
  createCustomCell<DateCellData>({
    kind: DATE_CELL_TYPE,
    draw: (args, data) => {
      if (data.value == null || data.value === "") {
        if (data.readOnly) drawEmptyDash(args);
        return;
      }

      const { ctx, rect, theme } = args;
      ctx.fillStyle = theme.textDark;
      ctx.font = theme.baseFontFull;
      ctx.textBaseline = "middle";
      ctx.fillText(
        formatDateDisplay(data.value, data.options.withTime ?? false),
        rect.x + theme.cellHorizontalPadding,
        rect.y + rect.height / 2,
      );
    },
    editor: DateCellEditor,
    onPaste: (val, data) => {
      const parsed = parseDatePaste(val, data.options.withTime ?? false);

      if (parsed === undefined) return undefined;
      if (parsed === null && data.options.nullable !== true) return undefined;

      return { ...data, value: parsed };
    },
  });

export function makeDateCell(
  value: string | null,
  options: DateCellOptions,
  allowOverlay = true,
): CustomCell<DateCellData> {
  return makeCustomCell(
    { kind: DATE_CELL_TYPE, value, options, ...(allowOverlay ? {} : { readOnly: true }) },
    value ?? "",
    allowOverlay,
  );
}

export const dateCellDef: CellTypeDef = {
  type: DATE_CELL_TYPE,
  kind: DATE_CELL_TYPE,
  renderer: dateCellRenderer as unknown as CustomRenderer,
  make: (raw, ctx) =>
    makeDateCell(raw == null ? null : String(raw), ctx.options as DateCellOptions, ctx.editable),
  validate: (cell) => {
    const data = cell.data as unknown as DateCellData;
    return isValidDateValue(data.value, data.options.nullable ?? false);
  },
};
