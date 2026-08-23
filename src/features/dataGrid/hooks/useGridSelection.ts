// src/features/dataGrid/hooks/useGridSelection.ts
import { CompactSelection, type GridSelection } from "@glideapps/glide-data-grid";
import { useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import type { RowStore } from "../data/rowStore";
import { displayToData, type DisplayModel } from "../displayModel";
import { selectedDisplayRows } from "../selectionRows";
import type { GridInstance } from "../types";
import { useGridDispatch } from "../useGridDispatch";

export function useGridSelection<
  TRow extends object,
  TGroup,
  TKey extends string | number = number,
>(
  instance: GridInstance<TRow, TGroup, TKey>,
  model: DisplayModel<TGroup>,
  rowAt: (dataIndex: number) => TRow | undefined,
  store: RowStore<TRow, TKey>,
): {
  gridSelection: GridSelection;
  onGridSelectionChange: (sel: GridSelection) => void;
} {
  const dispatch = useGridDispatch();
  const { rowKey } = instance.descriptor;

  const selectedIds = useSelector((s: unknown) => instance.selectRoot(s).selection.selectedIds);

  // Columns and the focused cell only. The selected ROWS are not kept here:
  // they are positions, and positions move.
  const [columnsAndCell, setColumnsAndCell] = useState<GridSelection>({
    columns: CompactSelection.empty(),
    rows: CompactSelection.empty(),
  });

  /**
   * The rows glide draws a marker on, worked out fresh from the selected KEYS.
   *
   * Holding them as display rows instead was a real bug: collapsing a group
   * above a selected row shifts every row below it up, and the remembered
   * position then rings a different record. The store stayed right the whole
   * time — `selectedIds` is by key — so only the screen lied, which is the
   * worst way for it to be wrong.
   */
  const rows = useMemo(
    () =>
      selectedDisplayRows(selectedIds as TKey[], (key) => store.indexOfKey(key), model).reduce(
        (acc, row) => acc.add(row),
        CompactSelection.empty(),
      ),
    [selectedIds, store, model],
  );

  const gridSelection = useMemo(() => ({ ...columnsAndCell, rows }), [columnsAndCell, rows]);

  const onGridSelectionChange = useCallback(
    (sel: GridSelection) => {
      setColumnsAndCell(sel);

      const ids: TKey[] = [];

      sel.rows.toArray().forEach((displayRow) => {
        const cell = displayToData(model, displayRow);

        if (cell.kind !== "data") return;

        const row = rowAt(cell.dataIndex);

        if (row) ids.push(rowKey(row));
      });

      dispatch(instance.actions.setSelectedIds(ids));
    },
    [model, rowAt, dispatch, instance, rowKey],
  );

  return { gridSelection, onGridSelectionChange };
}
