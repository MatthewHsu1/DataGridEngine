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
import type { FetchRowsParams, RowChange, UpdateRowParams } from "@matthewhsu1/datagrid";

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

// ─── What the later blocks import ────────────────────────────────────────────
//
// A block in section 7 needs the columns that section 5 built; a block in
// section 10 needs the instance from section 9. Rather than make every block
// redeclare its predecessors, each earlier section's result is assembled once
// here. The blocks below are the SAME code as the doc's, so a change to either
// side that breaks the other fails `npm run check:docs`.

import { QueryClient } from "@tanstack/react-query";
import { configureStore } from "@reduxjs/toolkit";
import {
  appearanceReducer,
  createGridInstance,
  type ColumnDef,
  type GridDescriptor,
} from "@matthewhsu1/datagrid";

export const COLUMN_DEFS: Record<string, ColumnDef> = {
  reference: {
    field: "reference",
    title: "Reference",
    defaultWidth: 160,
    editable: false,
    type: "dg:text",
    options: { required: true },
  },
  total: {
    field: "total",
    title: "Total",
    defaultWidth: 120,
    editable: true,
    type: "dg:number",
    options: { format: "currency", currency: "USD" },
  },
  placedAt: {
    field: "placedAt",
    title: "Placed",
    defaultWidth: 180,
    editable: true,
    type: "dg:date",
    options: { nullable: true, withTime: true },
  },
  status: {
    field: "status",
    title: "Status",
    defaultWidth: 120,
    editable: true,
    type: "dg:enum",
    options: {
      choices: [
        { value: 0, label: "Draft" },
        { value: 1, label: "Paid", color: "green" },
        { value: 2, label: "Void", color: "red" },
      ],
    },
  },
  phone: {
    field: "phone",
    title: "Phone",
    defaultWidth: 160,
    editable: true,
    type: "dg:phone",
    options: { nullable: true },
  },
};

export const DEFAULT_ORDER = ["reference", "total", "placedAt", "status", "phone"];

export const orderDescriptor: GridDescriptor<OrderRow, never, number> = {
  name: "orders",
  rowKey: (row) => row.id,
  columns: { defs: COLUMN_DEFS, defaultOrder: DEFAULT_ORDER },
  api: { fetchRows, fetchCount, fetchRow, updateRow, subscribe },
};

export const orderGrid = createGridInstance(orderDescriptor);

export const store = configureStore({
  reducer: { appearance: appearanceReducer, orders: orderGrid.reducer },
});

export const queryClient = new QueryClient();
