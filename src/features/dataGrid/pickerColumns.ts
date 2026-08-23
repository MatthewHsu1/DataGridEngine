import type { PickerColumn } from "./ColumnPickerList";
import type { ColumnDef } from "./types";

/**
 * What the column picker shows, in the order the grid draws.
 *
 * A field in `order` with no `ColumnDef` is skipped rather than rendered blank.
 * The order outlives the descriptor that wrote it — it is persisted by the
 * host, through `api.saveColumns` — so a field dropped from the code comes back
 * from storage long after there is anything to draw for it.
 */
export function pickerColumns(
  defs: Record<string, ColumnDef>,
  order: readonly string[],
  hidden: readonly string[],
  groupField: string | undefined,
): PickerColumn[] {
  return order
    .filter((field) => defs[field] !== undefined)
    .map((field) => ({
      field,
      title: defs[field].title,
      hidden: hidden.includes(field),
      grouped: field === groupField,
    }));
}
