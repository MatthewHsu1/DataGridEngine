import { startAppListening } from "../listener";
import { createGridInstance } from "@matthewhsu1/datagrid";
import { localStorageColumnsAdapter } from "@matthewhsu1/datagrid";
import type { ColumnDef, GridDescriptor, GridSliceState } from "@matthewhsu1/datagrid";
import { REGIONS, type TestRow } from "./api/types";
import {
  fetchTestRow,
  fetchTestRowCount,
  fetchTestRows,
  updateTestRow,
} from "./api/testRowQueries";
import { regionCell, testGridCells } from "./testGridCells";
import { RegionHeader } from "./RegionHeader";

export const GRID_NAME = "testGrid";

const COLUMN_DEFS: Record<string, ColumnDef> = {
  id: { field: "id", title: "ID", defaultWidth: 80, editable: false, type: "int" },
  name: { field: "name", title: "Name", defaultWidth: 220, editable: true, type: "text" },
  sector: { field: "sector", title: "Sector", defaultWidth: 130, editable: false, type: "text" },
  // Read-only because it is the GROUP field. An edit that changed a row's group
  // would have to move the row, and only a server-side move bumps the data
  // generation — the edit path patches a row in place. `active` is the editable
  // enum this page exercises instead.
  region: { field: "region", title: "Region", defaultWidth: 120, editable: false, type: "region" },
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
 * The development test grid: 100,000 synthetic rows, grouped by region, with
 * every editable cell type the app has.
 *
 * Its rows come from MSW handlers, not from the API, and the worker that serves
 * them starts only in a development build — see src/mocks/browser.ts. In a
 * production build these requests reach the real API and 404, which is why the
 * route renders a notice instead of the grid there.
 */
export const testGridDescriptor: GridDescriptor<TestRow, number, number> = {
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
    // `region`, and the derived `value` unsortable. Sorting a read-only column
    // is a thing this page exists to exercise.
    sortable: () => true,
  },
  grouping: {
    field: "region",
    of: (row) => row.region,
    // The region code IS its own rank: `REGIONS` runs 0, 1, 2. So this agrees
    // with the ascending order of the `region` field — the contract on
    // `GridGrouping.order`.
    order: (region) => region,
    label: (region) => REGIONS[region]?.label ?? String(region),
    // The header reads its colour from the very cell that draws the column, so
    // a group's header text and that group's badges cannot drift apart.
    color: (region) => regionCell.colorOf(region),

    // The whole reason group headers left the canvas. Each region gets a
    // DIFFERENT set of components, which is what the hook is for.
    header: (region) => <RegionHeader region={region} />,
    headerHeight: 44,
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
export type TestGridState = GridSliceState<number, number>;
