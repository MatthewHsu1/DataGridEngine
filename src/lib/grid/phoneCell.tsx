import type { CustomCell, CustomRenderer } from "@glideapps/glide-data-grid";
import type { Country } from "react-phone-number-input";
import {
  DEFAULT_PHONE_COUNTRY,
  formatPhoneDisplay,
  isValidPhoneValue,
  parsePhonePaste,
} from "../phone/phoneUtils";
import type { CellTypeDef } from "./cellRegistry";
import { createCustomCell, drawEmptyDash, makeCustomCell } from "./createCustomCell";
import { PhoneCellEditor } from "./phoneCellEditor";

/** The `ColumnDef.type` string that selects this cell. */
export const PHONE_CELL_TYPE = "dg:phone";

export { DEFAULT_PHONE_COUNTRY } from "../phone/phoneUtils";

/** Per-column settings for a `dg:phone` column, written on the column's `options`. */
export interface PhoneCellOptions {
  /** Allow an empty cell. Any non-empty value must still be a valid number. */
  nullable?: boolean;

  /** Country assumed for a number typed or pasted without a `+` prefix. */
  defaultCountry?: Country;
}

/** Cell payload. `value` is a canonical E.164 string, or null for an unset cell. */
export interface PhoneCellData {
  kind: string;
  value: string | null;
  readOnly?: boolean;
  options: PhoneCellOptions;
}

export const phoneCellRenderer: CustomRenderer<CustomCell<PhoneCellData>> =
  createCustomCell<PhoneCellData>({
    kind: PHONE_CELL_TYPE,
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
        formatPhoneDisplay(data.value, data.options.defaultCountry ?? DEFAULT_PHONE_COUNTRY),
        rect.x + theme.cellHorizontalPadding,
        rect.y + rect.height / 2,
      );
    },
    editor: PhoneCellEditor,
    onPaste: (val, data) => {
      const parsed = parsePhonePaste(val, data.options.defaultCountry ?? DEFAULT_PHONE_COUNTRY);

      if (parsed === undefined) return undefined;
      if (parsed === null && data.options.nullable !== true) return undefined;

      return { ...data, value: parsed };
    },
  });

export function makePhoneCell(
  value: string | null,
  options: PhoneCellOptions,
  allowOverlay = true,
): CustomCell<PhoneCellData> {
  return makeCustomCell(
    { kind: PHONE_CELL_TYPE, value, options, ...(allowOverlay ? {} : { readOnly: true }) },
    value ?? "",
    allowOverlay,
  );
}

export const phoneCellDef: CellTypeDef = {
  type: PHONE_CELL_TYPE,
  kind: PHONE_CELL_TYPE,
  renderer: phoneCellRenderer as unknown as CustomRenderer,
  make: (raw, ctx) =>
    makePhoneCell(raw == null ? null : String(raw), ctx.options as PhoneCellOptions, ctx.editable),
  validate: (cell) => {
    const data = cell.data as unknown as PhoneCellData;
    return isValidPhoneValue(data.value, data.options.nullable ?? false);
  },
};
