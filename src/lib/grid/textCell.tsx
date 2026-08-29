import type { CustomCell, CustomRenderer } from "@glideapps/glide-data-grid";
import { validateText, type TextValidationOptions } from "../text/textValidation";
import type { CellTypeDef } from "./cellRegistry";
import { createCustomCell, drawEmptyDash, makeCustomCell } from "./createCustomCell";
import { TextCellEditor } from "./textCellEditor";

/** The `ColumnDef.type` string that selects this cell. */
export const TEXT_CELL_TYPE = "dg:text";

/**
 * Per-column settings for a `dg:text` column, written on the column's `options`.
 *
 * They are the same declarative rules `<ValidatedInput>` takes, so a text column
 * and a text field in the host's own form validate identically.
 * `required` plays the role the number and phone cells call `nullable`.
 */
export type TextCellOptions = TextValidationOptions;

/**
 * Cell payload. `value` is the text string, or null for an unset cell.
 *
 * `options` travels WITH the cell rather than living in a factory closure. That
 * is what lets one module-scope renderer serve every text column in the app:
 * the draw, the editor, and the validator all read the column's settings off
 * the cell they were handed.
 */
export interface TextCellData {
  kind: string;
  value: string | null;
  readOnly?: boolean;
  options: TextCellOptions;
}

export const textCellRenderer: CustomRenderer<CustomCell<TextCellData>> =
  createCustomCell<TextCellData>({
    kind: TEXT_CELL_TYPE,
    draw: (args, data) => {
      if (data.value == null || data.value === "") {
        if (data.readOnly) drawEmptyDash(args);
        return;
      }

      const { ctx, rect, theme } = args;
      ctx.fillStyle = theme.textDark;
      ctx.font = theme.baseFontFull;
      ctx.textBaseline = "middle";
      ctx.fillText(data.value, rect.x + theme.cellHorizontalPadding, rect.y + rect.height / 2);
    },
    editor: TextCellEditor,
    onPaste: (val, data) => {
      const trimmed = val.trim();
      return { ...data, value: trimmed === "" ? null : trimmed };
    },
  });

export function makeTextCell(
  value: string | null,
  options: TextCellOptions,
  allowOverlay = true,
): CustomCell<TextCellData> {
  return makeCustomCell(
    { kind: TEXT_CELL_TYPE, value, options, ...(allowOverlay ? {} : { readOnly: true }) },
    value ?? "",
    allowOverlay,
  );
}

export const textCellDef: CellTypeDef = {
  type: TEXT_CELL_TYPE,
  kind: TEXT_CELL_TYPE,
  renderer: textCellRenderer as unknown as CustomRenderer,
  make: (raw, ctx) =>
    makeTextCell(raw == null ? null : String(raw), ctx.options as TextCellOptions, ctx.editable),
  validate: (cell) => {
    const data = cell.data as unknown as TextCellData;
    return validateText(data.value ?? "", data.options).valid;
  },
};
