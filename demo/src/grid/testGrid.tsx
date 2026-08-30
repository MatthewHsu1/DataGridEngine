import { createGridInstance } from "@matthewhsu1/datagrid";
import type { ColumnDef, GridDescriptor, GridSliceState } from "@matthewhsu1/datagrid";
import { REGIONS, type TestRow } from "./api/types";
import {
  fetchTestRow,
  fetchTestRowCount,
  fetchTestRows,
  updateTestRow,
} from "./api/testRowQueries";
import { RegionHeader } from "./RegionHeader";

export const GRID_NAME = "testGrid";

/**
 * Every column names its cell by `type` and carries that cell's settings on
 * `options`. Nothing is registered and nothing is built: `dg:` names the cells
 * the engine draws, and glide's own names are available beside them.
 *
 * Colors come from RADIX_BADGE_SCALES in lib/grid/radixBadgePalette.ts. That
 * list is the whole `RadixColor` union — "blue", "purple", and "gray" are NOT
 * in it, and each scale must also be imported in theme/radixStyles.ts.
 */
const COLUMN_DEFS: Record<string, ColumnDef> = {
  id: {
    field: "id",
    title: "ID",
    defaultWidth: 80,
    editable: false,
    type: "dg:number",
    options: { format: "integer", thousandSeparator: true, min: 0 },
  },
  name: { field: "name", title: "Name", defaultWidth: 220, editable: true, type: "dg:text" },
  sector: { field: "sector", title: "Sector", defaultWidth: 130, editable: false, type: "dg:text" },
  // Read-only because it is the GROUP field. An edit that changed a row's group
  // would have to move the row, and only a server-side move bumps the data
  // generation — the edit path patches a row in place. `active` is the editable
  // enum this page exercises instead.
  region: {
    field: "region",
    title: "Region",
    defaultWidth: 120,
    editable: false,
    type: "dg:enum",
    options: {
      choices: [
        { value: REGIONS[0].value, label: REGIONS[0].label, color: "cyan" },
        { value: REGIONS[1].value, label: REGIONS[1].label, color: "amber" },
        { value: REGIONS[2].value, label: REGIONS[2].label, color: "plum" },
      ],
    },
  },
  quantity: {
    field: "quantity",
    title: "Quantity",
    defaultWidth: 110,
    editable: true,
    type: "dg:number",
    options: { format: "integer", thousandSeparator: true, min: 0 },
  },
  price: {
    field: "price",
    title: "Price",
    defaultWidth: 120,
    editable: true,
    type: "dg:number",
    options: { format: "currency", currency: "USD", decimalScale: 2, min: 0 },
  },
  value: {
    field: "value",
    title: "Value",
    defaultWidth: 140,
    editable: false,
    type: "dg:number",
    options: { format: "currency", currency: "USD", decimalScale: 2, min: 0 },
  },
  contact: {
    field: "contact",
    title: "Contact",
    defaultWidth: 160,
    editable: true,
    type: "dg:phone",
    options: { nullable: true, defaultCountry: "US" },
  },
  updatedAt: {
    field: "updatedAt",
    title: "Updated",
    defaultWidth: 120,
    editable: true,
    type: "dg:date",
    options: { nullable: true },
  },
  active: {
    field: "active",
    title: "Active",
    defaultWidth: 110,
    editable: true,
    type: "dg:enum",
    options: {
      nullable: true,
      choices: [
        { value: 0, label: "Inactive", color: "tomato" },
        { value: 1, label: "Active", color: "green" },
      ],
    },
  },
};

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
    // `persist` and `adapter` are both left out: the layout is remembered in
    // Web Storage under `datagrid:testGrid:columns` with no wiring at all.
  },
  grouping: {
    field: "region",
    of: (row) => row.region,
    // The region code IS its own rank: `REGIONS` runs 0, 1, 2. So this agrees
    // with the ascending order of the `region` field — the contract on
    // `GridGrouping.order`.
    order: (region) => region,
    label: (region) => REGIONS[region]?.label ?? String(region),

    // No `color` here. The grid groups by a `dg:enum` column, so the engine
    // takes the header's colour from that column's own choices and a group's
    // header text cannot drift from its badges.

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
  },
};

export const testGrid = createGridInstance(testGridDescriptor);

/** The shape this grid's slice adds to the demo store, mounted by `store.ts`. */
export type TestGridState = GridSliceState<number, number>;
