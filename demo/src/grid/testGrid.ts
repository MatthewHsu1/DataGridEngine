import { startAppListening } from "../listener";
import { createGridInstance } from "@matthewhsu1/datagrid";
import { localStorageColumnsAdapter } from "@matthewhsu1/datagrid";
import type { ColumnDef, GridDescriptor, GridSliceState } from "@matthewhsu1/datagrid";
import { SECTORS, type TestRow } from "./api/types";
import {
  fetchTestRow,
  fetchTestRowCount,
  fetchTestRows,
  updateTestRow,
} from "./api/testRowQueries";
import { testGridCells } from "./testGridCells";

export const GRID_NAME = "testGrid";

const COLUMN_DEFS: Record<string, ColumnDef> = {
  id: { field: "id", title: "ID", defaultWidth: 80, editable: false, type: "int" },
  name: { field: "name", title: "Name", defaultWidth: 220, editable: true, type: "text" },
  sector: { field: "sector", title: "Sector", defaultWidth: 130, editable: false, type: "text" },
  region: { field: "region", title: "Region", defaultWidth: 120, editable: true, type: "region" },
  quantity: {
    field: "quantity",
    title: "Quantity",
    defaultWidth: 110,
    editable: true,
    type: "int",
  },
  price: { field: "price", title: "Price", defaultWidth: 120, editable: true, type: "currency" },
  value: { field: "value", title: "Value", defaultWidth: 140, editable: false, type: "currency" },
  contact: { field: "contact", title: "Contact", defaultWidth: 160, editable: true, type: "phone" },
  updatedAt: {
    field: "updatedAt",
    title: "Updated",
    defaultWidth: 120,
    editable: true,
    type: "date",
  },
  active: { field: "active", title: "Active", defaultWidth: 110, editable: true, type: "active" },
};

const columnsAdapter = localStorageColumnsAdapter(`${GRID_NAME}:columns`);

/**
 * The development test grid: 100,000 synthetic rows, grouped by sector, with
 * every editable cell type the app has.
 *
 * Its rows come from MSW handlers, not from the API, and the worker that serves
 * them starts only in a development build — see src/mocks/browser.ts. In a
 * production build these requests reach the real API and 404, which is why the
 * route renders a notice instead of the grid there.
 */
export const testGridDescriptor: GridDescriptor<TestRow, string, number> = {
  name: GRID_NAME,
  rowKey: (row) => row.id,
  columns: {
    defs: COLUMN_DEFS,
    defaultOrder: [
      "id",
      "name",
      "sector",
      "region",
      "quantity",
      "price",
      "value",
      "contact",
      "updatedAt",
      "active",
    ],
    // The default is "editable columns only", which would leave `id`, `sector`,
    // and the derived `value` unsortable. Sorting a read-only column is a thing
    // this page exists to exercise.
    sortable: () => true,
  },
  grouping: {
    field: "sector",
    of: (row) => row.sector,
    // `SECTORS` is ascending, so this agrees with the ascending order of the
    // `sector` field — the contract on `GridGrouping.order`.
    order: (sector) => SECTORS.indexOf(sector as (typeof SECTORS)[number]),
    label: (sector) => sector,
  },
  api: {
    fetchRows: fetchTestRows,
    fetchCount: fetchTestRowCount,
    fetchRow: fetchTestRow,
    updateRow: updateTestRow,
    loadColumns: columnsAdapter.loadColumns,
    saveColumns: columnsAdapter.saveColumns,
  },
  cells: testGridCells,
};

export const testGrid = createGridInstance(testGridDescriptor, {
  // The engine ships no listener middleware of its own — column persistence
  // runs on the host app's. See `src/listener.ts`.
  startListening: startAppListening,
});

/** The shape this grid's slice adds to the demo store, mounted by `store.ts`. */
export type TestGridState = GridSliceState<string, number>;
