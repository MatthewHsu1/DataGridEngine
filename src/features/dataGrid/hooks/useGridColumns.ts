// src/features/dataGrid/hooks/useGridColumns.ts
import { type GridColumn, GridColumnMenuIcon } from "@glideapps/glide-data-grid";
import { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import { SORT_ASC_ICON, SORT_DESC_ICON } from "../headerIcons";
import { sortablePredicate } from "../sortable";
import type { GridInstance } from "../types";
import { useGridDispatch } from "../useGridDispatch";

export function useGridColumns<TRow extends object, TGroup, TKey extends string | number = number>(
  instance: GridInstance<TRow, TGroup, TKey>,
): {
  visibleFields: string[];
  columns: GridColumn[];
  onColumnResize: (col: GridColumn, newSize: number, colIndex: number) => void;
  onColumnMoved: (from: number, to: number) => void;
} {
  const dispatch = useGridDispatch();

  const defs = instance.descriptor.columns.defs;

  const { order, widths, hidden } = useSelector((s: unknown) => instance.selectRoot(s).columns);

  const sort = useSelector((s: unknown) => instance.selectRoot(s).groups.sort);

  const visibleFields = useMemo(() => order.filter((f) => !hidden.includes(f)), [order, hidden]);

  const sortable = useMemo(() => sortablePredicate(defs), [defs]);

  const columns: GridColumn[] = useMemo(
    () =>
      visibleFields.map((f) => ({
        id: f,
        title: defs[f].title,
        width: widths[f] ?? defs[f].defaultWidth,
        indicatorIcon:
          sort?.field === f ? (sort.dir === "asc" ? SORT_ASC_ICON : SORT_DESC_ICON) : undefined,

        // The arrow that opens the sort menu. Only sortable columns draw one,
        // so an arrow never opens onto a menu with nothing to offer — see
        // `sortable.ts` and `hooks/useColumnSortMenu.tsx`.
        hasMenu: sortable(f),
        menuIcon: GridColumnMenuIcon.Triangle,
      })),
    [visibleFields, widths, defs, sort, sortable],
  );

  const onColumnResize = useCallback(
    (_col: GridColumn, newSize: number, colIndex: number) => {
      dispatch(instance.actions.resizeColumn({ field: visibleFields[colIndex], width: newSize }));
    },
    [dispatch, instance, visibleFields],
  );

  const onColumnMoved = useCallback(
    (from: number, to: number) => {
      dispatch(
        instance.actions.moveColumn({
          from: order.indexOf(visibleFields[from]),
          to: order.indexOf(visibleFields[to]),
        }),
      );
    },
    [dispatch, instance, order, visibleFields],
  );

  return { visibleFields, columns, onColumnResize, onColumnMoved };
}
