// src/features/dataGrid/hooks/useGroupHeaders.ts
import type { DataEditorRef, Rectangle } from "@glideapps/glide-data-grid";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  groupAtDisplayRow,
  headersInDisplayRange,
  sameHeaders,
  type DisplayModel,
  type VisibleHeader,
} from "../displayModel";
import { headerPlacements } from "../headerPlacements";
import type { GroupHeaderLayerHandle, HeaderPlacement } from "../GroupHeaderLayer";
import { DEFAULT_GROUP_HEADER_HEIGHT, DEFAULT_ROW_HEIGHT, rowHeightFor } from "../rowHeights";
import type { GridGrouping } from "../types";

interface Args<TRow, TGroup> {
  model: DisplayModel<TGroup>;

  /**
   * The groups the user has collapsed, straight from the store.
   *
   * The chevrons read from HERE and not from the model. A collapse is answered
   * by the server dropping the group's rows, which takes a round trip; until it
   * lands the model still holds them and still reports the group as open. An
   * arrow that waited for that would sit the wrong way round for the whole
   * load, which reads as a click that did nothing.
   */
  collapsedGroups: readonly TGroup[];

  /** Absent → the grid is flat, and this hook does nothing. */
  grouping: GridGrouping<TRow, TGroup> | undefined;

  /** The grid itself, for putting a folded group's header back under the eye. */
  gridRef: React.RefObject<DataEditorRef | null>;

  /**
   * The height of the grid's own column-header row.
   *
   * Every hole is measured DOWN from this line, so it has to be the same number
   * `<DataEditor headerHeight>` was given. A host raising the header through
   * `<DataGrid headerHeight>` therefore has to move this too, which is why it
   * arrives as an argument rather than being read from the constant.
   */
  columnHeaderHeight: number;
}

interface Result<TGroup> {
  /** Hand to `<GroupHeaderLayer ref>`. */
  layerRef: React.RefObject<GroupHeaderLayerHandle | null>;

  /** Hand to `<GroupHeaderLayer headers>`. */
  visibleHeaders: VisibleHeader<TGroup>[];

  /** The group the top of the viewport sits in, for the banner. Null when flat. */
  bannerGroup: TGroup | null;

  /**
   * Hand to `<DataEditor rowHeight>`.
   *
   * It comes out of THIS hook because it is the same number twice: the height
   * the canvas reserves a header's hole by, and the height this hook measures
   * every placement down from. Two owners deriving it separately is the drift
   * that leaves a header floating off its own hole.
   */
  rowHeight: (displayRow: number) => number;

  /** Call from `onVisibleRegionChanged`, passing its region and its `ty`. */
  trackRegion: (rect: Rectangle, translateY: number) => void;

  /**
   * Ask to be put on a group's header once that group has actually folded.
   *
   * Call it alongside the collapse, not after it. A collapse is answered by
   * the server dropping the group's rows, and moving the view before they go
   * scrolls the grid that is about to be replaced — the rows slide out from
   * under the offset and the user lands in the middle of the next group.
   */
  revealAfterCollapse: (group: TGroup) => void;
}

/**
 * Keeps the header layer and the banner following the viewport.
 *
 * TWO CLOCKS, and reading only one of them was the shape of every bug this hook
 * has had. Glide reports a region when the user SCROLLS. The model changes for
 * reasons that produce no region at all — a collapse, a page landing, a sort —
 * and each of those moves the holes or changes which headers exist. So the last
 * region is remembered and the answer is recomputed after EVERY commit, against
 * that commit's model. The scroll path still short-circuits on `sameHeaders`,
 * so scrolling inside one tall group costs no render.
 *
 * The split that buys the smoothness: React state carries WHICH headers exist,
 * a direct DOM write carries WHERE they are.
 */
export function useGroupHeaders<TRow, TGroup>({
  model,
  collapsedGroups,
  grouping,
  gridRef,
  columnHeaderHeight,
}: Args<TRow, TGroup>): Result<TGroup> {
  const layerRef = useRef<GroupHeaderLayerHandle>(null);

  const grouped = grouping !== undefined;

  // A group header's row is taller than a data row, and glide asks per row.
  // Passing a function replaces glide's default for EVERY row, so data rows
  // have to be told the height they already had.
  const rowHeight = useMemo(
    () =>
      rowHeightFor(
        model,
        DEFAULT_ROW_HEIGHT,
        grouping?.headerHeight ?? DEFAULT_GROUP_HEADER_HEIGHT,
      ),
    [model, grouping],
  );

  const [visibleHeaders, setVisibleHeaders] = useState<VisibleHeader<TGroup>[]>([]);
  const [bannerGroup, setBannerGroup] = useState<TGroup | null>(null);

  // The last region glide reported, with the sub-row offset that came with it.
  // A ref rather than state: both change on every scroll frame, and holding
  // them in state would re-render the grid on each one — the exact cost this
  // design exists to avoid.
  const lastRect = useRef<Rectangle | null>(null);
  const lastTranslateY = useRef(0);

  const placements = useRef<Map<number, HeaderPlacement>>(new Map());

  // A group whose header the view owes a visit, once its rows are gone.
  const pendingReveal = useRef<TGroup | null>(null);

  const revealAfterCollapse = useCallback((group: TGroup) => {
    pendingReveal.current = group;
  }, []);

  const scrollToRow = useCallback(
    (displayRow: number) => {
      gridRef.current?.scrollTo(0, displayRow, "vertical", 0, 0, { vAlign: "start" });
    },
    [gridRef],
  );

  const sync = useCallback(
    (
      against: DisplayModel<TGroup>,
      collapsed: readonly TGroup[],
      rect: Rectangle,
      translateY: number,
    ) => {
      const next = headersInDisplayRange(against, rect.y, rect.y + rect.height).map((header) => ({
        ...header,
        collapsed: collapsed.includes(header.group),
      }));

      setVisibleHeaders((prev) => (sameHeaders(prev, next) ? prev : next));

      // The group of the FIRST VISIBLE ROW, not of the last header scrolled
      // past. The two differ for every group taller than the viewport, which is
      // the only case a banner is needed for at all.
      //
      // A null answer is HELD rather than shown. Every jump of the scrollbar
      // lands on rows that have not arrived, and the model cannot name a group
      // it has no rows for. Clearing the banner there made it blink out and
      // back on every jump, taking the bar's height with it and shoving the
      // grid up and down under the pointer. The last name is the better answer
      // for that gap: it is where the user was, it is one scroll old at most,
      // and the loading cells below already say the rows are not there yet.
      const group = groupAtDisplayRow(against, rect.y);

      if (group !== null) {
        setBannerGroup((prev) => (Object.is(prev, group) ? prev : group));
      }

      placements.current = headerPlacements(next, {
        firstRow: rect.y,
        translateY,
        headerHeight: columnHeaderHeight,
        heightOf: rowHeight,
      });

      layerRef.current?.place(placements.current);
    },
    [rowHeight, columnHeaderHeight],
  );

  const trackRegion = useCallback(
    (rect: Rectangle, translateY: number) => {
      if (!grouped) {
        return;
      }

      lastRect.current = rect;
      lastTranslateY.current = translateY;

      sync(model, collapsedGroups, rect, translateY);
    },
    [collapsedGroups, grouped, model, sync],
  );

  // No dependency array, deliberately. Anything that re-renders the grid can
  // have moved a hole or changed which headers exist, and none of it reaches
  // `trackRegion`. Both setters short-circuit on an unchanged answer, so this
  // settles in one extra pass rather than looping.
  useLayoutEffect(() => {
    const rect = lastRect.current;

    if (grouped && rect !== null) {
      sync(model, collapsedGroups, rect, lastTranslateY.current);
    }
  });

  // The other half of `revealAfterCollapse`. The MODEL is what says the collapse
  // has landed: `collapsedGroups` flips on the click, but the group keeps its
  // rows until the server answers without them, and only then is the geometry
  // the one the view should scroll into.
  useLayoutEffect(() => {
    const group = pendingReveal.current;

    if (group === null) {
      return;
    }

    // Opened again while we waited. There is nothing to land on any more.
    if (!collapsedGroups.includes(group)) {
      pendingReveal.current = null;
      return;
    }

    const folded = model.segments.find(
      (segment) => segment.group === group && segment.collapsed && segment.hasHeader,
    );

    if (folded === undefined) {
      return;
    }

    pendingReveal.current = null;
    scrollToRow(folded.displayStart);
  }, [collapsedGroups, model, scrollToRow]);

  return { layerRef, visibleHeaders, bannerGroup, rowHeight, trackRegion, revealAfterCollapse };
}
