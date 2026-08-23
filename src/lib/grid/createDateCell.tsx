import type { CustomCell, CustomRenderer } from "@glideapps/glide-data-grid";
import { Theme } from "@radix-ui/themes";
import { DatePicker } from "../../components/ui/datePicker";
import { gridRadixTheme } from "../../theme/radixTheme";
import { formatDateDisplay, isValidDateValue, parseDatePaste } from "../date/dateUtils";
import {
  createCustomCell,
  drawEmptyDash,
  makeCustomCell,
  type EditorProps,
} from "./createCustomCell";

/** Cell payload. `value` is a canonical UTC ISO string, or null for an unset cell. */
export interface DateCellData {
  kind: string;
  value: string | null;
  withTime: boolean;
  readOnly?: boolean;
}

export interface DateCell {
  renderer: CustomRenderer<CustomCell<DateCellData>>;
  makeCell: (
    value: string | null,
    withTime: boolean,
    allowOverlay?: boolean,
  ) => CustomCell<DateCellData>;
  validate: (cell: CustomCell<DateCellData>) => boolean;
}

/**
 * Build a reusable date cell: a canvas text `draw` (localized date, or date+time
 * when the cell's `withTime` is set) plus a `DatePicker` overlay editor. Stores
 * canonical UTC ISO strings.
 *
 * The editor HOLDS the edit: nothing reaches the cell until the user presses OK,
 * and Cancel or Escape discards it. A click on a day is no longer a commit.
 *
 * Call once at module scope (not inside a React render): the editor component
 * identity is tied to this call, so re-creating it per render would remount it.
 */
export function createDateCell({
  kind,
  nullable = false,
}: {
  kind: string;
  nullable?: boolean;
}): DateCell {
  const Editor = ({ value, onFinishedEditing }: EditorProps<DateCellData>) => (
    <Theme {...gridRadixTheme()}>
      <DatePicker
        mode={value.withTime ? "datetime" : "date"}
        value={value.value}
        nullable={nullable}
        onConfirm={(next: string | null) => onFinishedEditing({ ...value, value: next })}
        onCancel={() => onFinishedEditing(undefined)}
      />
    </Theme>
  );

  const renderer = createCustomCell<DateCellData>({
    kind,
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
        formatDateDisplay(data.value, data.withTime),
        rect.x + theme.cellHorizontalPadding,
        rect.y + rect.height / 2,
      );
    },
    editor: Editor,
    onPaste: (val, data) => {
      const parsed = parseDatePaste(val, data.withTime);

      if (parsed === undefined) return undefined;
      if (parsed === null && !nullable) return undefined;

      return { ...data, value: parsed };
    },
  });

  const makeCell = (
    value: string | null,
    withTime: boolean,
    allowOverlay = true,
  ): CustomCell<DateCellData> =>
    makeCustomCell(
      { kind, value, withTime, ...(allowOverlay ? {} : { readOnly: true }) },
      value ?? "",
      allowOverlay,
    );

  const validate = (cell: CustomCell<DateCellData>): boolean =>
    isValidDateValue(cell.data.value, nullable);

  return { renderer, makeCell, validate };
}
