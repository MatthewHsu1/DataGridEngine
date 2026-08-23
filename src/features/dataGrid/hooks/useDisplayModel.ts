// src/features/dataGrid/hooks/useDisplayModel.ts
import { useCallback, useEffect, useMemo } from "react";
import { useSelector } from "react-redux";
import {
  buildDisplayModel,
  buildFlatModel,
  detectBoundaries,
  firstAffectedDataIndex,
  type Boundary,
  type DisplayModel,
} from "../displayModel";
import { useGridDispatch } from "../useGridDispatch";
import type { GridGrouping, GridInstance } from "../types";
import type { LoadedSpan } from "../data/spanFromStore";

interface Args<TRow, TGroup> {
  total: number;
  span: LoadedSpan<TRow, TGroup>;
}

interface Result<TGroup> {
  model: DisplayModel<TGroup>;

  /**
   * Collapse a group, or expand it again.
   *
   * THE ONLY dispatcher of `toggleCollapse`, and it has to stay that way.
   * Every collapse must first record where it starts, and only this hook
   * holds the display model that knows. A second dispatcher that skipped
   * that step would carry pages measured against the old positions, and the
   * rows would come back under the wrong indexes with nothing to say so.
   *
   * The in-grid header, the banner, and anything added later all come
   * through here.
   */
  toggleGroup: (group: TGroup) => void;
}

/** What the current span says about groups: where they start, and which ones it holds. */
interface SpanGroups<TGroup> {
  boundaries: Boundary<TGroup>[];
  groupsInSpan: TGroup[];
}

const NO_GROUPS: SpanGroups<never> = { boundaries: [], groupsInSpan: [] };

/**
 * Reads groups out of the loaded span.
 *
 * Both results are derived, not stored. The span is the one loaded run of rows,
 * so no boundary is found twice; and a span that reloads takes its boundaries
 * with it instead of leaving stale ones behind.
 */
function useSpanGroups<TRow, TGroup>(
  span: LoadedSpan<TRow, TGroup>,
  grouping: GridGrouping<TRow, TGroup> | undefined,
): SpanGroups<TGroup> {
  return useMemo(() => {
    if (!grouping) {
      return NO_GROUPS;
    }

    return {
      boundaries: detectBoundaries(span.rows, span.precedingGroupKey, span.offset, grouping.of),
      groupsInSpan: [...new Set(span.rows.map(grouping.of))],
    };
  }, [grouping, span]);
}

/**
 * Remembers every group the grid has ever seen.
 *
 * The server excludes a collapsed group's rows, so the model can only keep
 * drawing its header — the sole way to expand it again — from this monotonic
 * memory. Without this dispatch a collapse is one-way.
 *
 * Discovery lives here because this is the hook that already turns rows into
 * groups. `useGridData` sees the same rows first, but it takes a
 * `GridDataSource` rather than a `GridInstance` and touches no Redux — giving
 * it a dispatch would trade that boundary away for nothing.
 */
function useGroupDiscovery<TRow extends object, TGroup, TKey extends string | number>(
  instance: GridInstance<TRow, TGroup, TKey>,
  groupsInSpan: TGroup[],
): void {
  const dispatch = useGridDispatch();

  useEffect(() => {
    if (groupsInSpan.length > 0) {
      dispatch(instance.actions.groupsDiscovered(groupsInSpan));
    }
  }, [groupsInSpan, dispatch, instance]);
}

export function useDisplayModel<TRow extends object, TGroup, TKey extends string | number = number>(
  instance: GridInstance<TRow, TGroup, TKey>,
  { total, span }: Args<TRow, TGroup>,
): Result<TGroup> {
  const dispatch = useGridDispatch();
  const { grouping } = instance.descriptor;
  const { collapsedGroups, discoveredGroups } = useSelector(
    (s: unknown) => instance.selectRoot(s).groups,
  );

  const { boundaries, groupsInSpan } = useSpanGroups(span, grouping);

  useGroupDiscovery(instance, groupsInSpan);

  const model = useMemo(() => {
    if (!grouping) {
      return buildFlatModel(total) as DisplayModel<TGroup>;
    }

    // `span.precedingGroupKey` is the group of the row directly above the
    // window, and it is the only thing that identifies the rows before the
    // first boundary. A window inside one group reports no boundary at all, so
    // without it those rows get no segment and the grid draws nothing — see
    // `BuildArgs.leadingGroup`.
    return buildDisplayModel(
      {
        boundaries,
        leadingGroup: span.precedingGroupKey,
        total,
        collapsedGroups,
        discoveredGroups,
      },
      grouping.order,
    );
  }, [grouping, boundaries, span.precedingGroupKey, total, collapsedGroups, discoveredGroups]);

  const toggleGroup = useCallback(
    (group: TGroup) => {
      // Where the collapse starts, in the coordinates of the store the screen
      // is reading right now. Only the model knows it, and the model is in
      // scope here alone. `useGridData` takes it on the next render and uses it
      // to keep the pages ABOVE the group instead of asking for them again.
      instance.carryFromRef.current = firstAffectedDataIndex(model, group);

      dispatch(instance.actions.toggleCollapse(group));
    },
    [model, dispatch, instance],
  );

  return { model, toggleGroup };
}
