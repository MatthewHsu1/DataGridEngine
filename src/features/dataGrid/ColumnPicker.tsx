import { Badge, Button, Popover } from "@radix-ui/themes";
import { Columns3 } from "lucide-react";
import { useMemo } from "react";
import { useSelector } from "react-redux";
import { ColumnPickerList } from "./ColumnPickerList";
import { pickerColumns } from "./pickerColumns";
import type { GridInstance } from "./types";
import { useGridDispatch } from "./useGridDispatch";

/**
 * The control that decides which columns the grid draws.
 *
 * It lives in the header bar rather than in a context menu on the header row,
 * because a hidden column leaves no header to right-click: the only way back
 * would be a control the user cannot see.
 */
export function ColumnPicker<TRow extends object, TGroup, TKey extends string | number = number>({
  instance,
}: {
  instance: GridInstance<TRow, TGroup, TKey>;
}) {
  const dispatch = useGridDispatch();

  const { order, hidden } = useSelector((s: unknown) => instance.selectRoot(s).columns);

  const defs = instance.descriptor.columns.defs;
  const groupField = instance.descriptor.grouping?.field;

  const columns = useMemo(
    () => pickerColumns(defs, order, hidden, groupField),
    [defs, order, hidden, groupField],
  );

  const shown = columns.filter((c) => !c.hidden).length;

  return (
    <Popover.Root>
      <Popover.Trigger>
        <Button size="1" variant="surface" color="gray">
          <Columns3 size={14} aria-hidden />
          Columns
          <Badge size="1" variant="soft" radius="full">
            {shown} / {columns.length}
          </Badge>
        </Button>
      </Popover.Trigger>

      <Popover.Content size="1" align="end" maxHeight="70vh">
        <ColumnPickerList
          columns={columns}
          onToggle={(field) => dispatch(instance.actions.toggleColumn(field))}
          onReset={() => dispatch(instance.actions.resetColumns())}
        />
      </Popover.Content>
    </Popover.Root>
  );
}
