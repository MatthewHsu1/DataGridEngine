/**
 * The row type and the fake server calls every block in `docs/configuration.md`
 * imports.
 *
 * It exists so a code block can stay short and still typecheck: without it,
 * every block that touches a descriptor would have to redeclare `OrderRow` and
 * four server functions. `scripts/check-docs.mjs` extracts each block into its
 * own temporary module, and each one resolves this import for real.
 *
 * Nothing here ships. `package.json`'s `files` field publishes `dist` only.
 */
import type {
  ColumnsState,
  FetchRowsParams,
  RowChange,
  UpdateRowParams,
} from "@matthewhsu1/datagrid";

/** The row the documentation's example grid draws. */
export interface OrderRow {
  id: number;
  reference: string;
  customer: string;
  total: number;
  placedAt: string | null;
  status: number;
  phone: string | null;
  region: string;
}

/** Stand-in for the host app's real endpoint. */
export async function fetchRows(_p: FetchRowsParams<string>): Promise<OrderRow[]> {
  return [];
}

export async function fetchCount(_p: {
  collapsedGroups: string[];
  filter?: unknown;
  signal?: AbortSignal;
}): Promise<number> {
  return 0;
}

export async function fetchRow(_id: number, _signal?: AbortSignal): Promise<OrderRow | null> {
  return null;
}

export async function updateRow(
  _p: UpdateRowParams<OrderRow, number>,
): Promise<{ ok: boolean; row?: OrderRow }> {
  return { ok: true };
}

export function subscribe(_handler: (change: RowChange<number>) => void): () => void {
  return () => {};
}

export async function loadColumns(): Promise<ColumnsState | null> {
  return null;
}

export async function saveColumns(_state: ColumnsState): Promise<void> {}

// ─── What the later blocks import ────────────────────────────────────────────
//
// A block in section 7 needs the columns and cells that sections 5 and 6 built;
// a block in section 10 needs the instance from section 9. Rather than make
// every block redeclare its predecessors, each earlier section's result is
// assembled once here. The blocks below are the SAME code as the doc's, so a
// change to either side that breaks the other fails `npm run check:docs`.

import { QueryClient } from "@tanstack/react-query";
import { configureStore, createListenerMiddleware } from "@reduxjs/toolkit";
import type { CustomRenderer } from "@glideapps/glide-data-grid";
import {
  appearanceReducer,
  createCellRegistry,
  createDateCell,
  createEnumCell,
  createGridInstance,
  createNumberCell,
  createPhoneCell,
  createTextCell,
  localStorageColumnsAdapter,
  type CellContext,
  type CellTypeDef,
  type ColumnDef,
  type GridDescriptor,
} from "@matthewhsu1/datagrid";

export const referenceCell = createTextCell({ kind: "reference", validation: { required: true } });
export const totalCell = createNumberCell({ kind: "total", format: "currency", currency: "USD" });
export const placedAtCell = createDateCell({ kind: "placedAt", nullable: true });
export const statusCell = createEnumCell({
  kind: "status",
  options: [
    { value: 0, label: "Draft" },
    { value: 1, label: "Paid", color: "green" },
    { value: 2, label: "Void", color: "red" },
  ],
});
export const phoneCell = createPhoneCell({ kind: "phone", nullable: true });

export const orderCells = createCellRegistry(
  [
    {
      type: "text",
      kind: "reference",
      make: (raw: unknown, ctx: CellContext) =>
        referenceCell.makeCell(raw == null ? null : String(raw), ctx.editable),
      renderer: referenceCell.renderer,
      validate: referenceCell.validate,
    },
    {
      type: "currency",
      kind: "total",
      make: (raw: unknown, ctx: CellContext) =>
        totalCell.makeCell(raw == null ? null : Number(raw), ctx.editable),
      renderer: totalCell.renderer,
      validate: totalCell.validate,
    },
    {
      type: "date",
      kind: "placedAt",
      make: (raw: unknown, ctx: CellContext) =>
        placedAtCell.makeCell(raw == null ? null : String(raw), ctx.withTime, ctx.editable),
      renderer: placedAtCell.renderer,
      validate: placedAtCell.validate,
    },
    {
      type: "status",
      make: (raw: unknown, ctx: CellContext) =>
        statusCell.makeCell(raw == null ? null : Number(raw), ctx.editable),
      renderer: statusCell.renderer,
    },
  ].map((d): CellTypeDef => ({
    ...d,
    renderer: d.renderer as unknown as CustomRenderer,
    validate: d.validate as unknown as CellTypeDef["validate"],
  })),
);

export const COLUMN_DEFS: Record<string, ColumnDef> = {
  reference: {
    field: "reference",
    title: "Reference",
    defaultWidth: 160,
    editable: false,
    type: "text",
  },
  total: { field: "total", title: "Total", defaultWidth: 120, editable: true, type: "currency" },
  placedAt: {
    field: "placedAt",
    title: "Placed",
    defaultWidth: 180,
    editable: true,
    type: "date",
    withTime: true,
  },
};

export const DEFAULT_ORDER = ["reference", "total", "placedAt"];

const columnsAdapter = localStorageColumnsAdapter("orders:columns");

export const orderDescriptor: GridDescriptor<OrderRow, never, number> = {
  name: "orders",
  rowKey: (row) => row.id,
  columns: { defs: COLUMN_DEFS, defaultOrder: DEFAULT_ORDER },
  cells: orderCells,
  api: {
    fetchRows,
    fetchCount,
    fetchRow,
    updateRow,
    subscribe,
    loadColumns: columnsAdapter.loadColumns,
    saveColumns: columnsAdapter.saveColumns,
  },
};

export const listenerMiddleware = createListenerMiddleware();

export const orderGrid = createGridInstance(orderDescriptor, {
  startListening: listenerMiddleware.startListening,
});

export const store = configureStore({
  reducer: { appearance: appearanceReducer, orders: orderGrid.reducer },
  middleware: (getDefault) => getDefault().prepend(listenerMiddleware.middleware),
});

export const queryClient = new QueryClient();
