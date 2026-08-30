// src/features/dataGrid/DataGrid.tsx
import {
  DataEditor,
  type DataEditorRef,
  type Rectangle,
  type SpriteMap,
} from "@glideapps/glide-data-grid";
import "@glideapps/glide-data-grid/dist/index.css";
import { useCallback, useLayoutEffect, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { useGridTheme } from "../../theme/useGridTheme";
import { specFromGridSort } from "./data/sortSpec";
import { ensureGridPortal } from "./ensurePortal";
import { useRowSync } from "./data/sync/useRowSync";
import type { DisplayModel } from "./displayModel";
import { GroupHeaderLayer } from "./GroupHeaderLayer";
import { COLUMN_HEADER_HEIGHT } from "./rowHeights";
import { ColumnPicker } from "./ColumnPicker";
import { groupColumnColor } from "./groupColumnColor";
import {
  mergeHeaderIcons,
  withSortArgs,
  type GridDrawHeader,
  type GridDrawHeaderArgs,
} from "./headerDoors";
import { sortablePredicate } from "./sortable";
import { useColumnPersistence } from "./hooks/useColumnPersistence";
import { useColumnSortMenu } from "./hooks/useColumnSortMenu";
import { GridHeaderBar } from "./GridHeaderBar";
import { useCellRenderer } from "./hooks/useCellRenderer";
import { useDisplayModel } from "./hooks/useDisplayModel";
import { useGridColumns } from "./hooks/useGridColumns";
import { useGridData } from "./hooks/useGridData";
import { useGridSelection } from "./hooks/useGridSelection";
import { useGroupBanner } from "./hooks/useGroupBanner";
import { useGroupHeaders } from "./hooks/useGroupHeaders";
import { useRepaintRows } from "./hooks/useRepaintRows";
import { useWindowRange, type RangeLoaded } from "./hooks/useWindowRange";
import type { GridInstance } from "./types";
import { useGridDispatch } from "./useGridDispatch";

/**
 * Width of the row-marker column, pinned rather than left to glide.
 *
 * Glide sizes it from the row count (32 up to 48), and the header layer has to
 * start clear of it. Two places deriving the same number from a count that
 * changes as pages load is a drift waiting to happen; one number both sides
 * read is not.
 */
const ROW_MARKER_WIDTH = 40;

/**
 * Room left at the right edge of a group header for the vertical scrollbar.
 *
 * A header spans the full width of the canvas, and the scrollbar sits on top of
 * the last few pixels of it. Without this the last thing a host puts in a
 * header is half hidden under it.
 */
const SCROLLBAR_GUTTER = 18;

export type { GridDrawHeader, GridDrawHeaderArgs };

export interface DataGridProps<TRow extends object, TGroup, TKey extends string | number = number> {
  /** The grid to draw, from `createGridInstance`. */
  instance: GridInstance<TRow, TGroup, TKey>;

  /**
   * Draws the column header instead of the engine. See `GridDrawHeader`.
   */
  drawHeader?: GridDrawHeader;

  /**
   * Named header sprites, MERGED over the engine's own.
   *
   * A dictionary, unlike `drawHeader`: naming one icon replaces that entry and
   * leaves the rest — including the engine's `sortAsc` and `sortDesc` chevrons,
   * which the sort indicator refers to by name.
   */
  headerIcons?: SpriteMap;

  /**
   * Height of the column-header row, in pixels. Defaults to glide's 36.
   *
   * It reaches the group-header layer as well as the canvas: every group header
   * is placed by measuring down from this line.
   */
  headerHeight?: number;
}

export function DataGrid<TRow extends object, TGroup, TKey extends string | number = number>({
  instance,
  drawHeader,
  headerIcons: hostHeaderIcons,
  headerHeight = COLUMN_HEADER_HEIGHT,
}: DataGridProps<TRow, TGroup, TKey>) {
  // Before glide can paint, and therefore long before the first editor opens.
  // A missing portal is silent: the grid renders, and editing simply does
  // nothing. See `ensurePortal.ts`.
  useLayoutEffect(() => ensureGridPortal(), []);

  const gridRef = useRef<DataEditorRef>(null);

  // `repaintRows` translates a data index into the display row glide draws it
  // at, and it is created before the model exists in this render. It reads the
  // model back out of this cell, which the publish below keeps current.
  const modelRef = useRef<DisplayModel<TGroup> | null>(null);

  // The same arrangement for the columns. A repaint damages every VISIBLE
  // column of a changed row, and the column set is built after `repaintRows` in
  // this render — and rebuilt whenever the user hides or shows a column.
  const columnCountRef = useRef<number | null>(null);

  // And once more, for the one question `useWindowRange` cannot answer itself:
  // has the store already got this window. The predicate comes out of
  // `useGridData`, which needs the range this hook produces, so the two can
  // only meet over time — in the callback glide fires after both have run.
  const rangeLoadedRef = useRef<RangeLoaded | null>(null);

  const gridTheme = useGridTheme();

  const dispatch = useGridDispatch();

  const pageSize = instance.descriptor.pageSize ?? 100;

  const grouping = instance.descriptor.grouping;

  const { sort, collapsedGroups } = useSelector((s: unknown) => instance.selectRoot(s).groups);

  const lastError = useSelector((s: unknown) => instance.selectRoot(s).edits.lastError);

  const spec = specFromGridSort(sort);

  // Rows repaint through glide's damage API, not through React. This callback
  // is the whole no-flash mechanism: rows already on screen are never
  // re-rendered, and the rows that just changed are the only ones redrawn.
  // All three writers share it — a page load, a settled save, and a pushed
  // update. See `hooks/useRepaintRows.ts`.
  const repaintRows = useRepaintRows(gridRef, modelRef, columnCountRef);

  // The range first, then the rows it loads, then the model they shape. Acyclic
  // per render: only the callback handed to glide closes the loop, over time.
  const { range, onRectChanged } = useWindowRange(pageSize, rangeLoadedRef);

  const { rowAt, isPending, isRangeLoaded, total, span, status, retry, isStale, overlay, store } =
    useGridData(instance, range, spec, collapsedGroups, repaintRows);

  // Published during render, like the model and the column count below it. The
  // predicate closes over the store the grid is reading NOW, and a window that
  // tested itself against the store of an earlier render would skip the settle
  // wait on pages a hold has since replaced.
  rangeLoadedRef.current = isRangeLoaded;

  // Restores the saved layout on mount and writes it back on every change.
  // Here rather than on the host's listener middleware: a grid instance is
  // built at module scope and has no store to subscribe to, and this is also
  // the only place that knows the grid is on screen.
  useColumnPersistence(instance, instance.columnsAdapter);

  const { visibleFields, columns, onColumnResize, onColumnMoved } = useGridColumns(instance);

  // Published during render, for the same reason the model is: a repaint that
  // ran against a stale count would either miss a column the user has just
  // shown or name one the grid no longer draws.
  columnCountRef.current = columns.length;

  const { model, toggleGroup } = useDisplayModel(instance, { total, span });

  // A group collapse or a grown span rebuilds the model, and every rebuild moves
  // which display row a data index sits at. Publishing it here, during render,
  // is what stops a repaint translating against a mapping the grid has already
  // stopped drawing.
  modelRef.current = model;

  const { layerRef, visibleHeaders, bannerGroup, rowHeight, trackRegion, revealAfterCollapse } =
    useGroupHeaders({
      model,
      collapsedGroups,
      grouping,
      gridRef,
      columnHeaderHeight: headerHeight,
    });

  // Resolved from the descriptor: `grouping.color` where the host set one,
  // otherwise the grouped enum column's own choices. See `groupColumnColor`.
  const groupColorOf = useMemo(
    () => groupColumnColor(grouping, instance.descriptor.columns.defs),
    [grouping, instance],
  );

  const {
    banner,
    slot: groupSlot,
    groupColor,
  } = useGroupBanner({
    grouping,
    group: bannerGroup,
    collapsedGroups,
    fallbackColor: gridTheme.textHeader,
    colorOf: groupColorOf,
    toggleGroup,
    revealAfterCollapse,
  });

  const { gridSelection, onGridSelectionChange } = useGridSelection(instance, model, rowAt, store);

  const { onHeaderMenuClick, menu: sortMenu } = useColumnSortMenu(instance, visibleFields);

  const { getCellContent, onCellEdited } = useCellRenderer(instance, {
    model,
    visibleFields,
    columnCount: columns.length,
    theme: gridTheme,
    rowAt,
    isPending,
    overlay,
    store,
    repaint: repaintRows,
  });

  // The third writer of a row. A pushed update patches the store in place and
  // moves nothing React watches, so it reaches the screen through the same
  // damage callback the page loader and the save path use.
  useRowSync(instance, collapsedGroups, repaintRows);

  const headerIcons = useMemo(() => mergeHeaderIcons(hostHeaderIcons), [hostHeaderIcons]);

  const isSortable = useMemo(() => sortablePredicate(instance.descriptor.columns.defs), [instance]);

  const onDrawHeader = useMemo(
    () => withSortArgs(drawHeader, sort, isSortable),
    [drawHeader, sort, isSortable],
  );

  const dismissError = useCallback(
    () => dispatch(instance.actions.editErrorCleared()),
    [dispatch, instance],
  );

  const onVisibleRegionChanged = useCallback(
    (rect: Rectangle, _tx: number, ty: number) => {
      onRectChanged(model, rect);

      // `ty` is the sub-row scroll offset for THIS region, and it is the only
      // way to place a header on the frame being drawn. Asking glide where the
      // row is answers about the frame before it — see `headerPlacements`.
      trackRegion(rect, ty);
    },
    [onRectChanged, trackRegion, model],
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", width: "100%" }}>
      <GridHeaderBar
        status={status}
        error={lastError?.message ?? null}
        rowCount={model.rowCount}
        stale={isStale}
        onRetry={retry}
        onDismissError={dismissError}
        group={banner}
        groupSlot={groupSlot}
        picker={<ColumnPicker instance={instance} />}
      />

      {/*
        Old rows with no signal read as a working grid. The dim, plus the line
        in the bar above, is what tells the truth about the rows below while the
        next sort or collapse state loads.
      */}
      <div
        style={{
          position: "relative",
          flex: 1,
          minHeight: 0,
          opacity: isStale ? 0.6 : 1,
          transition: "opacity 120ms ease-out",
        }}
      >
        <DataEditor
          ref={gridRef}
          theme={gridTheme}
          customRenderers={instance.cells.customRenderers}
          headerIcons={headerIcons}
          drawHeader={onDrawHeader}
          validateCell={(_cell, newValue) => instance.cells.validateCell(newValue)}
          columns={columns}
          rows={model.rowCount}
          rowHeight={rowHeight}
          headerHeight={headerHeight}
          getCellContent={getCellContent}
          getCellsForSelection={true}
          onCellEdited={onCellEdited}
          onVisibleRegionChanged={onVisibleRegionChanged}
          onColumnResize={onColumnResize}
          onColumnMoved={onColumnMoved}
          rowMarkers={{ kind: "checkbox-visible", width: ROW_MARKER_WIDTH }}
          gridSelection={gridSelection}
          onGridSelectionChange={onGridSelectionChange}
          onHeaderMenuClick={onHeaderMenuClick}
          width="100%"
          height="100%"
          smoothScrollX
          smoothScrollY
        />

        {/*
          The group headers, in React, over the canvas holes reserved for them.
          A canvas cannot hold a component, so this is the only place a host's
          per-group components can live. See `GroupHeaderLayer`.
        */}
        {grouping !== undefined && (
          <GroupHeaderLayer
            ref={layerRef}
            headers={visibleHeaders}
            label={grouping.label}
            textColor={groupColor}
            slot={grouping.header}
            background={gridTheme.bgHeader}
            markerWidth={ROW_MARKER_WIDTH}
            gutterRight={SCROLLBAR_GUTTER}
            onToggle={toggleGroup}
          />
        )}

        {/*
          The sort menu, parked over the header arrow the user pressed. It
          anchors in viewport coordinates, so it does not care that it is
          rendered here rather than beside the canvas. See `ColumnHeaderMenu`.
        */}
        {sortMenu}
      </div>
    </div>
  );
}
