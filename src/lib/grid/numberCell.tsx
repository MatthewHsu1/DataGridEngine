import type { CustomCell, CustomRenderer } from "@glideapps/glide-data-grid";
import {
  formatNumberDisplay,
  isValueInRange,
  parseNumberPaste,
  type NumberFormatOptions,
} from "../number/numberUtils";
import type { CellTypeDef } from "./cellRegistry";
import { createCustomCell, drawEmptyDash, makeCustomCell } from "./createCustomCell";
import { NumberCellEditor } from "./numberCellEditor";

/** The `ColumnDef.type` string that selects this cell. */
export const NUMBER_CELL_TYPE = "dg:number";

/**
 * Per-column settings for a `dg:number` column, written on the column's
 * `options`. Everything the display formatter takes, plus whether an empty cell
 * is allowed.
 */
export interface NumberCellOptions extends NumberFormatOptions {
  nullable?: boolean;
}

/** Cell payload. `value` is a JS number, or null for an unset cell. */
export interface NumberCellData {
  kind: string;
  value: number | null;
  readOnly?: boolean;
  options: NumberCellOptions;
}

export const numberCellRenderer: CustomRenderer<CustomCell<NumberCellData>> =
  createCustomCell<NumberCellData>({
    kind: NUMBER_CELL_TYPE,
    draw: (args, data) => {
      if (data.value == null) {
        if (data.readOnly) drawEmptyDash(args);
        return;
      }

      const { ctx, rect, theme } = args;
      ctx.fillStyle = theme.textDark;
      ctx.font = theme.baseFontFull;
      ctx.textBaseline = "middle";
      ctx.fillText(
        formatNumberDisplay(data.value, data.options),
        rect.x + theme.cellHorizontalPadding,
        rect.y + rect.height / 2,
      );
    },
    editor: NumberCellEditor,
    onPaste: (val, data) => {
      const { min, max, nullable = false } = data.options;
      const parsed = parseNumberPaste(val, { min, max, nullable });

      if (parsed === undefined) return undefined;

      return { ...data, value: parsed };
    },
  });

export function makeNumberCell(
  value: number | null,
  options: NumberCellOptions,
  allowOverlay = true,
): CustomCell<NumberCellData> {
  return makeCustomCell(
    { kind: NUMBER_CELL_TYPE, value, options, ...(allowOverlay ? {} : { readOnly: true }) },
    value == null ? "" : String(value),
    allowOverlay,
  );
}

export const numberCellDef: CellTypeDef = {
  type: NUMBER_CELL_TYPE,
  kind: NUMBER_CELL_TYPE,
  renderer: numberCellRenderer as unknown as CustomRenderer,
  make: (raw, ctx) =>
    makeNumberCell(
      raw == null ? null : Number(raw),
      ctx.options as NumberCellOptions,
      ctx.editable,
    ),
  validate: (cell) => {
    const data = cell.data as unknown as NumberCellData;

    if (data.value == null) return data.options.nullable === true;

    return isValueInRange(data.value, data.options.min, data.options.max);
  },
};
