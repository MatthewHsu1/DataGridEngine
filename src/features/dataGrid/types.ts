import type { ReactNode } from "react";
import type { Reducer } from "@reduxjs/toolkit";
import type { CellRegistry, CellTypeDef } from "../../lib/grid/cellRegistry";
import type { DateCellOptions } from "../../lib/grid/dateCell";
import type { EnumCellOptions } from "../../lib/grid/enumChoices";
import type { NumberCellOptions } from "../../lib/grid/numberCell";
import type { PhoneCellOptions } from "../../lib/grid/phoneCell";
import type { RadixColor } from "../../lib/grid/radixBadgePalette";
import type { TextCellOptions } from "../../lib/grid/textCell";
import type { RowStore } from "./data/rowStore";
import type { SortSpec } from "./data/sortSpec";

/**
 * What every column says, whatever it draws.
 *
 * Everything here is read by the GRID itself — the header, the layout, the sort
 * menu, the edit path. A setting only one cell type understands does not belong
 * here; it belongs on that column's `options`.
 */
interface ColumnDefBase {
  /**
   * Row property this column reads. Also the column's id in every state slice.
   */
  field: string;

  /**
   * Header text.
   */
  title: string;

  /**
   * Width in pixels before the user resizes the column.
   */
  defaultWidth: number;

  /**
   * Whether a cell in this column accepts an edit.
   *
   * Read by the grid, not just by the cell: it gates the edit overlay and the
   * save path as well as whether an editor opens.
   */
  editable: boolean;

  /**
   * Whether this column's header offers a sort menu. Defaults to true.
   *
   * Set it false for a column the SERVER cannot order by: a column the row
   * carries but the query has no index for, or one the client derives and the
   * server has never heard of. The sort is sent to the server, so an arrow on
   * such a column is an arrow onto an error.
   */
  sortable?: boolean;
}

/**
 * A column definition: what the column is, and how its cells behave.
 *
 * `type` names the cell, exactly the way glide names its own. The five this
 * package draws are prefixed `dg:`; glide's own kinds are reachable under
 * glide's own names, unprefixed. The prefix is what keeps the two sets apart
 * forever, so glide may add kinds without ever colliding with ours.
 *
 * `options` is that cell type's own settings, and each branch below types its
 * own. Anything else is a cell the HOST registered through `descriptor.cells`;
 * its `options` is `unknown` here, because only that cell knows its shape.
 *
 * Note the cost of that open branch: because any string is a legal `type`, a
 * mistyped key inside a built-in column's `options` still satisfies the open
 * branch and so does not raise an error. Autocomplete on `type` is unaffected.
 */
export type ColumnDef =
  | (ColumnDefBase & { type: "dg:text"; options?: TextCellOptions })
  | (ColumnDefBase & { type: "dg:number"; options?: NumberCellOptions })
  | (ColumnDefBase & { type: "dg:date"; options?: DateCellOptions })
  | (ColumnDefBase & { type: "dg:enum"; options: EnumCellOptions })
  | (ColumnDefBase & { type: "dg:phone"; options?: PhoneCellOptions })
  | (ColumnDefBase & {
      /** One of glide's own cell kinds, drawn by glide. These take no options. */
      type: "text" | "number" | "boolean" | "uri" | "markdown" | "image" | "bubble" | "drilldown";
      options?: undefined;
    })
  | (ColumnDefBase & {
      /** A cell type the host registered through `descriptor.cells`. */
      // eslint-disable-next-line @typescript-eslint/ban-types
      type: string & {};
      options?: unknown;
    });

/**
 * Reads and writes the user's column layout.
 *
 * Both calls are async, whatever the storage behind them: the engine's own
 * default writes to Web Storage and resolves immediately, and a host that keeps
 * layouts on a server returns a real request. One shape, so the engine's save
 * path has one thing to await.
 */
export interface ColumnsAdapter {
  /**
   * Reads the saved layout, or null when there is none to restore.
   */
  loadColumns: () => Promise<ColumnsState | null>;

  /**
   * Persists the layout. Called debounced, after the user stops changing it.
   */
  saveColumns: (state: ColumnsState) => Promise<void>;
}

/**
 * A single-column ordering. `null` anywhere this appears means natural order.
 */
export interface GridSort {
  /**
   * Field to order by.
   */
  field: string;

  /**
   * Direction of the ordering.
   */
  dir: "asc" | "desc";
}

/**
 * A subset request. The loader asks for a slice of an order, not for a numbered
 * page.
 */
export interface FetchRowsParams<TGroup> {
  /**
   * Index of the first row in the slice.
   */
  offset: number;

  /**
   * Number of rows in the slice.
   */
  limit: number;

  /**
   * Order the server applies before it cuts the slice.
   */
  sort: SortSpec | null;

  /**
   * Groups the server must exclude, because the user collapsed them.
   */
  collapsedGroups: TGroup[];

  /**
   * Cancels the request when the grid drops the slice.
   */
  signal?: AbortSignal;
}

/**
 * A cross-client change notification. It names the row, never carries it.
 */
export interface RowChange<TKey extends string | number = number> {
  /**
   * What happened to the row.
   */
  kind: "create" | "update" | "delete";

  /**
   * Stable key of the changed row.
   */
  id: TKey;

  /**
   * Monotonic per connection. A gap means the client missed a message and must
   * resync.
   */
  sequence: number;
}

/**
 * A single cell edit, addressed by row key.
 */
export interface UpdateRowParams<TRow, TKey extends string | number = number> {
  /**
   * Stable key of the row to edit.
   */
  id: TKey;

  /**
   * Changed fields only.
   */
  changes: Partial<TRow>;
}

/**
 * Optional grouping config. Absent → the grid renders flat (no header rows).
 */
export interface GridGrouping<TRow, TGroup> {
  /**
   * Field the grouping reads. Header rows report it.
   */
  field: string;

  /**
   * Extracts a row's group key.
   *
   * `TGroup` MUST be a primitive (string, number, or boolean) or an otherwise
   * stably-interned value. The engine tracks discovered/collapsed groups with
   * `===`, `Array.includes`, and `Set`, i.e. it compares groups by identity — so
   * if `of` returns a fresh object per call (e.g. `{ year, month }`), every row
   * reads as a new group and collapse + dedup both silently no-op. Derive a
   * primitive key instead (e.g. `` `${year}-${month}` ``).
   */
  of: (row: TRow) => TGroup;

  /**
   * Sort weight of a group. The grid orders header rows by this number.
   *
   * It MUST agree with the ascending order of `field`: group X sorts before
   * group Y here exactly when `X.field < Y.field`. The client live query orders
   * rows by `field` as a plain property reference — the only expression the
   * query builder accepts — while the header rows are placed by this function.
   * If the two disagree, the headers and the rows under them describe different
   * orders.
   *
   * The simple way to satisfy this is to keep the group values in a sorted
   * array and return `SORTED.indexOf(g)`.
   */
  order: (g: TGroup) => number;

  /**
   * Header text for a group.
   */
  label: (g: TGroup) => string;

  /**
   * Text color of a group's header row, named as a Radix scale.
   *
   * OMIT IT when grouping by a `dg:enum` column: the engine already holds that
   * column's choices, so it colours the header from them and the name lands on
   * the same scale as the badge in the cell and the badge in the editor's
   * dropdown. Setting this overrides that.
   *
   * The engine resolves the scale to a concrete color through the same CSS vars
   * the badges read, so it follows the appearance without being told about it.
   *
   * Answering `undefined` — for one group by returning it, or for a grid that
   * groups by a column with no colours of its own — falls the header back to
   * the theme's header text color. That is the right answer for a group with no
   * color of its own; it is not an error.
   */
  color?: (g: TGroup) => RadixColor | undefined;

  /**
   * The host's components for a group, drawn to the RIGHT of the group's name.
   *
   * The engine always draws the collapse control and the name itself, so a host
   * cannot accidentally ship a group that can never be folded. What comes back
   * from here fills the rest of the row.
   *
   * The SAME node is used in two places: the header above the group's rows, and
   * the banner in the grid's header bar naming the group the user is currently
   * inside. That is deliberate — one rule, so the pinned copy and the in-grid
   * copy cannot drift apart.
   *
   * It is called during render, once per visible group. Keep it cheap, and keep
   * it a pure function of the group: it is not the place to start a fetch.
   */
  header?: (group: TGroup) => ReactNode;

  /**
   * How tall a group header row is, in pixels. Defaults to 40.
   *
   * The canvas reserves the header's space by this number BEFORE React draws
   * into it, and nothing measures what React drew. A header taller than this
   * is clipped; a shorter one leaves a gap. Set it to fit the tallest thing
   * `header` can return.
   *
   * It is a number rather than a measurement on purpose: measuring would mean
   * draw, measure, resize, draw, on every scroll.
   */
  headerHeight?: number;
}

/**
 * The static description of one grid: its identity, columns, grouping, server
 * calls, and cell renderers.
 */
export interface GridDescriptor<TRow, TGroup, TKey extends string | number = number> {
  /**
   * Store namespace + storage-key prefix. Must be a stable, unique string.
   */
  name: string;

  /**
   * Stable identity of a row. Must not be derived from array position.
   */
  rowKey: (row: TRow) => TKey;

  /**
   * Column set, its default presentation, and how the user's changes to it are
   * remembered.
   */
  columns: {
    /**
     * All columns, keyed by field.
     */
    defs: Record<string, ColumnDef>;

    /**
     * Left-to-right field order before the user reorders the columns.
     */
    defaultOrder: string[];

    /**
     * Whether the user's layout survives a reload. Defaults to true.
     *
     * On, the engine writes to Web Storage under `datagrid:${name}:columns`.
     * Set it false for a grid whose layout should always start from the
     * descriptor — a report that is meant to look the same for everyone.
     */
    persist?: boolean;

    /**
     * Where the layout is kept instead of Web Storage.
     *
     * Point it at the host's own storage — a settings endpoint, a user profile
     * row — and the engine calls this instead of its default. Ignored when
     * `persist` is false.
     */
    adapter?: ColumnsAdapter;
  };

  /**
   * Group config. Omit it to render a flat list.
   */
  grouping?: GridGrouping<TRow, TGroup>;

  /**
   * Every server call the grid makes.
   */
  api: {
    /**
     * Loads one ordered slice. `hooks/useRowPages.ts` calls this, never a
     * component.
     *
     * A descriptor with `grouping` MUST have its server order every request by
     * `grouping.field` ascending FIRST, then by `sort` second. The group order
     * never appears in this request: `p.sort` carries only the user's column,
     * so the server applies the group prefix itself, on every call, whether or
     * not it is named here (see `GridGrouping.order` for the matching
     * client-side rule). A server that ignores this returns the wrong rows for
     * the window, and the client cannot repair that: it can only re-order the
     * rows the window already holds, not fetch the rows it should have held.
     */
    fetchRows: (p: FetchRowsParams<TGroup>) => Promise<TRow[]>;

    /**
     * Total rows under the current view. A live query returns no total.
     *
     * `filter` is opaque here: the descriptor's own implementation knows its
     * shape, and the grid only carries it. It belongs in the count's query key,
     * because a filter change changes the total, and a stale total sizes the
     * scroll bar for rows the grid never receives.
     */
    fetchCount: (p: {
      collapsedGroups: TGroup[];
      filter?: unknown;
      signal?: AbortSignal;
    }) => Promise<number>;

    /**
     * One row by id, for an id-only push notification.
     */
    fetchRow: (id: TKey, signal?: AbortSignal) => Promise<TRow | null>;

    /**
     * Optional live change feed. Returns an unsubscribe function. The grid
     * owns no transport: SignalR, WebSocket, or polling all fit here.
     */
    subscribe?: (handler: (change: RowChange<TKey>) => void) => () => void;

    /**
     * Persist a single cell edit. On success may return the server's
     * authoritative `row` (including derived columns), which
     * `hooks/useCellRenderer.ts` writes into the row store over the optimistic
     * value. `{ ok: false }` signals a rejected/read-only edit and triggers a
     * rollback.
     */
    updateRow: (p: UpdateRowParams<TRow, TKey>) => Promise<{ ok: boolean; row?: TRow }>;
  };

  /**
   * Cell types this grid understands ON TOP of the built-in ones.
   *
   * Omit it entirely for a grid built from `dg:` cells and glide's own kinds —
   * which is most grids. A def whose `type` matches a built-in replaces that
   * built-in for this grid, which is how a host changes a cell we draw without
   * forking the package.
   */
  cells?: CellTypeDef[];

  /**
   * Row-window page size. Defaults to 100.
   */
  pageSize?: number;
}

/**
 * Client-owned grouping state.
 *
 * Boundaries are NOT here: they are a pure function of the currently loaded
 * windows and are derived in `useDisplayModel`. Storing them meant they could
 * outlive the rows they described.
 */
export interface GroupsState<TGroup> {
  /**
   * Monotonic memory of groups the user has seen. It stays here because a
   * collapsed group's rows are excluded by the server, so this list cannot be
   * re-derived from the loaded rows.
   */
  discoveredGroups: TGroup[];

  /**
   * Groups the user collapsed. The grid sends them to every server call.
   */
  collapsedGroups: TGroup[];

  /**
   * Current header-click ordering.
   */
  sort: GridSort | null;
}

/**
 * Client-owned column layout. It is the only part of the presentation the user
 * changes directly.
 */
export interface ColumnsState {
  /**
   * Left-to-right field order.
   */
  order: string[];

  /**
   * Pixel width per field, for fields the user resized.
   */
  widths: Record<string, number>;

  /**
   * Fields the user hid.
   */
  hidden: string[];
}

/**
 * Client-owned row selection.
 */
export interface SelectionState<TKey extends string | number = number> {
  /**
   * Stable keys of the selected rows.
   */
  selectedIds: TKey[];
}

/**
 * A rejected save: the message shown, and the cell it belongs to.
 */
export interface EditError {
  /**
   * `${rowKey}:${field}` — the row's stable key, never its position, so it
   * still names the same cell after a reload moves the row. It exists so a
   * success can clear an error only when the success is about the SAME cell; a
   * save that landed on one cell says nothing about a save that failed on
   * another.
   */
  cell: string;

  /**
   * Text the banner shows.
   */
  message: string;
}

/**
 * The edit slice holds only what the UI cannot derive from the rows themselves.
 * "This cell is not saved yet" is NOT here: `data/editOverlay.ts` holds the
 * in-flight value and `useCellRenderer` reads its `isPending`. What survives is
 * the last rejection, which no row carries.
 */
export interface EditState {
  /**
   * One error, not a map. The banner shows one message, so the state holds one;
   * the cell on it is the minimum needed to decide whether a later success
   * retracts that message, and is deliberately not a per-cell `pending` map —
   * the overlay already answers that question.
   */
  lastError: EditError | null;
}

/**
 * All client-owned state of one grid, mounted under `descriptor.name`.
 */
export interface GridSliceState<TGroup, TKey extends string | number = number> {
  /**
   * Discovered groups, collapse state, and sort.
   */
  groups: GroupsState<TGroup>;

  /**
   * Column order, widths, and hidden fields.
   */
  columns: ColumnsState;

  /**
   * Selected row keys.
   */
  selection: SelectionState<TKey>;

  /**
   * Last rejected save.
   */
  edits: EditState;
}

/**
 * Everything a grid needs at runtime, created once at module scope per grid:
 * the combined reducer (mount under `descriptor.name`) for client-owned state,
 * a root selector, all slice action creators, the columns adapter, and the cell
 * that holds the mounted grid's row store. Hooks and <DataGrid> take this.
 */
export interface GridInstance<TRow extends object, TGroup, TKey extends string | number = number> {
  /**
   * The descriptor this instance was built from.
   */
  descriptor: GridDescriptor<TRow, TGroup, TKey>;

  /**
   * Combined reducer for the client-owned state. Mount it under
   * `descriptor.name`.
   */
  reducer: Reducer<GridSliceState<TGroup, TKey>>;

  /**
   * Reads this grid's state out of the app store.
   */
  selectRoot: (state: unknown) => GridSliceState<TGroup, TKey>;

  /**
   * Action creators of every slice, keyed by name.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  actions: Record<string, (...args: any[]) => { type: string; payload?: unknown }>;

  /**
   * A stable cell holding the row store the grid is DRAWING, republished by
   * `useGridData` on every render and again the moment a hold adopts.
   *
   * It is a cell rather than a value because `data/sync/useRowSync.ts`
   * subscribes once, for the life of the grid, and must reach whichever store
   * the mounted grid owns without re-subscribing. It is null until a grid
   * mounts; a push that arrives before then has nothing to write to and is
   * correctly dropped.
   *
   * It does NOT go back to null on unmount. Nothing clears it, so it keeps the
   * store of the grid that mounted last, and that store is then reachable with
   * no grid drawing it. Nothing writes through it in that state — `useRowSync`
   * unsubscribes with the grid, and it is the only writer — and the next mount
   * overwrites the cell on its first render.
   *
   * ONE MOUNTED GRID PER INSTANCE. This cell, `pendingStoreRef`, and
   * `carryFromRef` are single slots on one module-scope object, so two grids
   * mounted on the same instance at the same time overwrite each other: a push
   * would land on whichever store rendered last, and a collapse boundary
   * measured by one grid would be consumed by the other. A second view of the
   * same rows needs a second `createGridInstance`.
   */
  storeRef: { current: RowStore<TRow, TKey> | null };

  /**
   * The store of the view loading BEHIND the screen during a hold, or null when
   * no hold is open.
   *
   * A hold runs two stores at once, and adoption puts this one on screen. A
   * push that maintained `storeRef` alone would therefore write the row the
   * user is about to stop reading and miss the row the user is about to start
   * reading, so `data/sync/useRowSync.ts` patches both. It is a second cell
   * rather than a list because the two have different jobs, and the hook must
   * be able to tell them apart: only the DISPLAYED store's indexes may reach
   * the grid's damage callback.
   *
   * `useGridData` writes it on every render and clears it at adoption, so it
   * reads null whenever no hold is open. Unmount is the exception, exactly as
   * it is for `storeRef`: nothing clears it there, so a grid unmounted mid-hold
   * leaves the pending store here until the next mount's first render replaces
   * it. The one-mounted-grid rule above covers this cell too.
   */
  pendingStoreRef: { current: RowStore<TRow, TKey> | null };

  /**
   * The first data index the next collapse change moves, written by the header
   * click and read once by `useGridData`. Null means "everything moves", which
   * is the state a sort leaves it in.
   *
   * A cell rather than an action payload because only the display model knows
   * where a group starts, and only the click handler holds that model. The rows
   * ABOVE this index keep the index they already have, so the new view starts
   * with those pages already loaded instead of asking for them again.
   */
  carryFromRef: { current: number | null };

  /**
   * Subscribes to invalidations of every loaded row. A push that creates or
   * deletes a row moves every position after it, which no page-indexed cache
   * can repair in place.
   */
  subscribeDataGeneration: (listener: () => void) => () => void;

  /**
   * The current invalidation count. Part of the row store's identity, beside
   * the sort and the collapse set.
   */
  getDataGeneration: () => number;

  /**
   * Invalidates every loaded row. Called by the push subscriber
   * (`data/sync/useRowSync.ts`) and by the mock reset bar.
   */
  bumpDataGeneration: () => void;

  /**
   * Where this grid's column layout is read from and written to, or null when
   * it persists nothing.
   *
   * Resolved once, from `descriptor.columns`, so the load on mount and every
   * save afterwards cannot disagree about where the layout lives.
   */
  columnsAdapter: ColumnsAdapter | null;

  /**
   * Every cell type this grid can draw: the built-ins with the descriptor's own
   * laid over them, resolved once.
   *
   * Built here rather than in the component because glide re-creates every
   * editor whenever the `customRenderers` array it was handed changes identity.
   */
  cells: CellRegistry;
}
