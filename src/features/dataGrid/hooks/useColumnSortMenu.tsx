// src/features/dataGrid/hooks/useColumnSortMenu.tsx
import type { Rectangle } from "@glideapps/glide-data-grid";
import { type ReactNode, useCallback, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import { ColumnHeaderMenu, type ColumnMenuTarget } from "../ColumnHeaderMenu";
import { sortablePredicate } from "../sortable";
import type { GridInstance, GridSort } from "../types";
import { useGridDispatch } from "../useGridDispatch";

/**
 * The column header's sort menu, from the press on the arrow to the reload.
 *
 * The caller learns two things: the handler to hand the grid, and the node to
 * render beside it. Where the menu is, what it offers, and which press is worth
 * a reload are all behind that.
 *
 * The menu is what sorts; a click on the header itself does not. A header click
 * is also how a user selects a column, and one gesture answering to two
 * intentions puts a full reload of the grid behind a mis-click.
 */
export function useColumnSortMenu<
  TRow extends object,
  TGroup,
  TKey extends string | number = number,
>(
  instance: GridInstance<TRow, TGroup, TKey>,
  visibleFields: string[],
): { onHeaderMenuClick: (colIndex: number, bounds: Rectangle) => void; menu: ReactNode } {
  const dispatch = useGridDispatch();

  const defs = instance.descriptor.columns.defs;

  const sort = useSelector((s: unknown) => instance.selectRoot(s).groups.sort) ?? null;

  const [target, setTarget] = useState<ColumnMenuTarget | null>(null);

  const sortable = useMemo(() => sortablePredicate(defs), [defs]);

  const onHeaderMenuClick = useCallback(
    (colIndex: number, bounds: Rectangle) => {
      const field = visibleFields[colIndex];

      // The grid only draws an arrow on a sortable column, so this is a guard
      // against the two disagreeing, not an expected path.
      if (field === undefined || !sortable(field)) return;

      setTarget({ field, bounds });
    },
    [visibleFields, sortable],
  );

  const close = useCallback(() => setTarget(null), []);

  const onSort = useCallback(
    (next: GridSort | null) => {
      setTarget(null);

      // The sort is part of every window's cache key, so changing it is the
      // whole refetch: the mounted windows re-request themselves on the new
      // key. Re-picking the order already in force must therefore change
      // nothing, or the menu reloads the grid to arrive where it started.
      if (next?.field === sort?.field && next?.dir === sort?.dir) return;

      dispatch(instance.actions.setSort(next));
    },
    [dispatch, instance, sort],
  );

  const menu = <ColumnHeaderMenu target={target} sort={sort} onSort={onSort} onClose={close} />;

  return { onHeaderMenuClick, menu };
}
