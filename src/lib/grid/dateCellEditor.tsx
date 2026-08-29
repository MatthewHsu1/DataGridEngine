import { Theme } from "@radix-ui/themes";
import { DatePicker } from "../../components/ui/datePicker";
import { gridRadixTheme } from "../../theme/radixTheme";
import type { EditorProps } from "./createCustomCell";
import type { DateCellData } from "./dateCell";

/**
 * The overlay editor for a `dg:date` cell.
 *
 * Its own file so `dateCell.tsx` exports no component.
 *
 * The editor HOLDS the edit: nothing reaches the cell until the user presses
 * OK, and Cancel or Escape discards it. A click on a day is not a commit.
 */
export const DateCellEditor = ({ value, onFinishedEditing }: EditorProps<DateCellData>) => (
  <Theme {...gridRadixTheme()}>
    <DatePicker
      mode={value.options.withTime ? "datetime" : "date"}
      value={value.value}
      nullable={value.options.nullable ?? false}
      onConfirm={(next: string | null) => onFinishedEditing({ ...value, value: next })}
      onCancel={() => onFinishedEditing(undefined)}
    />
  </Theme>
);
