# Configuration

Everything the host app supplies to stand a grid up, in the order you do it.

Read [`CONTEXT.md`](../CONTEXT.md) first if a word here is unfamiliar —
_descriptor_, _host app_, _row key_, _group_, and _appearance_ all have exactly
one meaning in this codebase.

Every code block on this page is extracted and typechecked by
`npm run check:docs`. Blocks import `./shared` for the example's row type and
server calls; in your app that import is your own types file. Its contents are
in [`docs/examples/shared.ts`](./examples/shared.ts).

## Contents

1. [Stylesheets](#1-stylesheets)
2. [The overlay portal](#2-the-overlay-portal)
3. [Theme](#3-theme)
4. [Appearance](#4-appearance)
5. [Cells](#5-cells)
6. [Columns](#6-columns)
7. [The descriptor](#7-the-descriptor)
8. [Grouping](#8-grouping)
9. [The grid instance](#9-the-grid-instance)
10. [The store](#10-the-store)
11. [The query client](#11-the-query-client)
12. [Rendering](#12-rendering)
13. [Also exported](#13-also-exported)

---

## 1. Stylesheets

Two imports, once, at your app's entry point. Order does not matter.

```ts
import "@matthewhsu1/datagrid/radix-styles"; // Radix token CSS the badges read
import "@matthewhsu1/datagrid/datagrid.css"; // the grid's own styles
```

`radix-styles` is a side-effect module: it imports the Radix Themes component
CSS plus the twelve colour scales an enum badge can land on. Skip it and badges
draw with unresolved CSS variables, which logs a warning and renders no colour.

`datagrid.css` carries layout only, on `dg:`-prefixed classes. It contains no
Tailwind preflight, so it will not reset your app's margins or form controls.

---

## 2. The overlay portal

`<DataGrid>` creates `<div id="portal">` on mount if your page has none, so
normally you do nothing. Declare it yourself only to control its stacking.

```html
<body>
  <div id="root"></div>
  <div id="portal" style="position: fixed; left: 0; top: 0; z-index: 9999"></div>
</body>
```

An element you provide is left exactly as it is. Without a portal, every cell
editor silently fails to open while the grid otherwise looks healthy.

---

## 3. Theme

Call once at app start, before the first grid renders. A cell editor portals out
of the canvas and mounts its own `<Theme>`, so it cannot inherit your provider —
this call is how it learns your accent.

```ts
import { configureGridTheme } from "@matthewhsu1/datagrid";

configureGridTheme({
  accentColor: "grass", // default "iris". Any Radix accent; match your app.
  grayColor: "slate",   // default "slate". Any Radix gray.
  radius: "medium",     // default "medium". Radix radius scale.
  scaling: "100%",      // default "100%". Radix scaling scale.
  selectAppearance: (state) => (state as { ui: { mode: "light" | "dark" } }).ui.mode,
  // ^ default reads state.appearance.appearance. See section 4.
});
```

`accentColor` and `grayColor` accept any Radix scale, but an **enum badge**
colour must also appear in `RADIX_BADGE_SCALES`, or it resolves to nothing and
warns at runtime. The badge scales are listed in section 5.

---

## 4. Appearance

The engine reads light or dark. It never decides it. What writes it — an OS
media query, a page class, a user toggle — is always yours.

Mount the slice the package ships at the `appearance` key:

```ts
import { appearanceReducer, setAppearance } from "@matthewhsu1/datagrid";
import { configureStore } from "@reduxjs/toolkit";

export const store = configureStore({
  reducer: { appearance: appearanceReducer },
});

// Your watcher writes it. The engine only ever reads it.
window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", (e) => {
  store.dispatch(setAppearance(e.matches ? "dark" : "light"));
});
```

Keeping appearance somewhere else is fine — point
`configureGridTheme({ selectAppearance })` at it instead. A host that mounts
neither gets a permanently light grid rather than a crash.

---

## 5. Cells

A **cell kind** names how one column draws and edits. Build each maker **once at
module scope**, never inside a render: the editor component's identity is tied
to the call, so rebuilding it per render remounts the editor on every keystroke.

Every `kind` must be unique across the grid. The registry routes drawing and
validation by `cell.data.kind`, so two makers sharing a kind behave as one.

### Text

```ts
import { createTextCell } from "@matthewhsu1/datagrid";

export const referenceCell = createTextCell({
  kind: "reference", // REQUIRED. Unique across the grid.
  validation: {
    required: true, // default false. Empty fails. This cell's "nullable".
    minLength: 3,   // default undefined. Shortest accepted string.
    maxLength: 32,  // default undefined. Longest accepted string.
    email: false,   // default false. Pragmatic check, not full RFC 5322.
    pattern: { value: /^ORD-/, message: "Must start with ORD-" },
    // ^ default undefined. A bare RegExp works too; then the message is generic.
    validate: (value) => (value.endsWith("!") ? "No exclamation marks" : null),
    // ^ default undefined. Escape hatch. Return a message, or null when valid.
  },
});
```

Rules run in one fixed order and the editor shows the **first** failure:
`required` → `minLength` → `maxLength` → `email` → `pattern` → `validate`. An
empty string is valid unless `required`, and when empty-and-optional the
remaining rules are skipped entirely.

### Number

```ts
import { createNumberCell } from "@matthewhsu1/datagrid";

export const totalCell = createNumberCell({
  kind: "total",           // REQUIRED. Unique across the grid.
  nullable: false,         // default false. true lets the user clear the cell.
  format: "currency",      // default undefined. "integer" | "decimal" | "currency".
  decimalScale: 2,         // default undefined. Digits after the point.
  currency: "USD",         // default undefined. ISO code; used by format "currency".
  min: 0,                  // default undefined. Editor blocks entry below this.
  max: 1_000_000,          // default undefined. Editor blocks entry above this.
  thousandSeparator: true, // default undefined. Group digits by locale.
  prefix: undefined,       // default undefined. Text drawn before the number.
  suffix: undefined,       // default undefined. Text drawn after the number.
});
```

`min` and `max` guard **entry**, not the stored data. A row that already holds
an out-of-range value still draws it; the range only stops the user typing a new
one.

### Date

```ts
import { createDateCell } from "@matthewhsu1/datagrid";

export const placedAtCell = createDateCell({
  kind: "placedAt", // REQUIRED. Unique across the grid.
  nullable: true,   // default false. true lets the user confirm an empty date.
});
```

Values are stored as canonical UTC ISO strings. Whether a column keeps the time
part is **not** set here — it is `withTime` on the column (section 6), because
one date cell can serve both a date column and a datetime column.

The editor holds the edit: a click on a day changes nothing until the user
presses OK. Cancel and Escape discard.

### Enum

```ts
import { createEnumCell } from "@matthewhsu1/datagrid";

export const statusCell = createEnumCell({
  kind: "status",  // REQUIRED. Unique across the grid.
  nullable: false, // default false. true adds a "clear" item to the Select.
  options: [
    // REQUIRED. The full set of selectable values.
    { value: 0, label: "Draft" },                // color defaults by value.
    { value: 1, label: "Paid", color: "green" }, // color: any RADIX_BADGE_SCALES entry.
    { value: 2, label: "Void", color: "red" },
  ],
});
```

`value` must be a **number**. An unlisted value draws as an empty cell.

An omitted `color` falls back to `BADGE_SEQUENCE[value % 10]`, so colours stay
stable as you add options at the end. A `color` outside `RADIX_BADGE_SCALES`
resolves to nothing and warns; adding a new scale means adding its token CSS to
`src/theme/radixStyles.ts` **and** the scale to `RADIX_BADGE_SCALES`.

The usable scales are: `iris`, `tomato`, `amber`, `grass`, `cyan`, `plum`,
`orange`, `jade`, `crimson`, `indigo`, `red`, `green`.

### Phone

```ts
import { createPhoneCell } from "@matthewhsu1/datagrid";

export const phoneCell = createPhoneCell({
  kind: "phone",        // REQUIRED. Unique across the grid.
  nullable: true,       // default false. true lets the user clear the cell.
  defaultCountry: "US", // default "US". ISO 3166-1 alpha-2, for un-prefixed input.
});
```

Values are stored canonically as E.164 (`+14155552671`). Any non-empty value
must parse as a valid number; `nullable` decides only whether empty is allowed.

### A cell kind the package does not ship

```tsx
import { createCustomCell, drawEmptyDash, makeCustomCell } from "@matthewhsu1/datagrid";

interface RatingData {
  kind: "rating"; // REQUIRED. Literal type; routes glide's isMatch.
  value: number | null;
  readOnly?: boolean;
}

export const ratingRenderer = createCustomCell<RatingData>({
  kind: "rating", // REQUIRED. Must equal cell.data.kind at runtime.
  draw: (args, data) => {
    // REQUIRED. Canvas only — no DOM reaches a cell.
    if (data.value == null) return drawEmptyDash(args);
    const { ctx, rect, theme } = args;
    ctx.fillStyle = theme.textDark;
    ctx.fillText("★".repeat(data.value), rect.x + 8, rect.y + rect.height / 2);
  },
  editor: ({ value, onChange }) => (
    // REQUIRED. Real DOM — use Radix here.
    <input
      type="number"
      defaultValue={value.value ?? 0}
      onChange={(e) => onChange({ ...value, value: Number(e.target.value) })}
    />
  ),
  onPaste: (text, data) => {
    // default undefined. Omit and the cell is not pasteable.
    const n = Number(text);
    return Number.isFinite(n) ? { ...data, value: n } : undefined;
  },
});

export const makeRatingCell = (value: number | null, allowOverlay = true) =>
  makeCustomCell<RatingData>({ kind: "rating", value }, String(value ?? ""), allowOverlay);
//                          ^ data          ^ copyData (what Ctrl+C yields)  ^ default true
```

Cells are painted on a `<canvas>`, so `draw` gets no DOM components. The
**editor** is real DOM, and it should be built from `@radix-ui/themes` like the
built-in ones.

### The registry

One place maps a column's `type` to its maker. Build it once.

```ts
import { createCellRegistry, type CellContext, type CellTypeDef } from "@matthewhsu1/datagrid";
import type { CustomRenderer } from "@glideapps/glide-data-grid";
import { placedAtCell, referenceCell, statusCell, totalCell } from "./shared";

export const orderCells = createCellRegistry(
  [
    {
      type: "text",      // REQUIRED. Matches ColumnDef.type.
      kind: "reference", // default undefined. Needed only to route `validate`.
      make: (raw: unknown, ctx: CellContext) =>
        referenceCell.makeCell(raw == null ? null : String(raw), ctx.editable),
      // ^ REQUIRED. ctx is { editable, withTime } for the column being drawn.
      renderer: referenceCell.renderer, // default undefined. Custom cells need it.
      validate: referenceCell.validate, // default undefined. Gates commit and paste.
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
      // `withTime` comes from the COLUMN, which is why make receives ctx.
      make: (raw: unknown, ctx: CellContext) =>
        placedAtCell.makeCell(raw == null ? null : String(raw), ctx.withTime, ctx.editable),
      renderer: placedAtCell.renderer,
      validate: placedAtCell.validate,
    },
    {
      type: "status",
      make: (raw: unknown, ctx: CellContext) =>
        statusCell.makeCell(raw == null ? null : Number(raw), ctx.editable),
      renderer: statusCell.renderer, // enum cells expose no `validate`.
    },
  ].map(
    // The two casts below are load-bearing. See the note under this block.
    (d): CellTypeDef => ({
      ...d,
      renderer: d.renderer as unknown as CustomRenderer,
      validate: d.validate as unknown as CellTypeDef["validate"],
    }),
  ),
);
```

`type` is what a column names; `kind` is what a rendered cell carries. They are
allowed to differ, and often should: two columns can share the `date` type while
each holds its own cell kind.

**The two casts are required, and they are safe.** `CellTypeDef.renderer` and
`CellTypeDef.validate` are unparameterized, while a maker's `renderer` and
`validate` are typed to that cell's own payload. Under `strictFunctionTypes` the
two are incomparable in **either** direction, so no annotation removes the cast.
Casting those two fields only — rather than the whole def through `unknown` —
keeps the structural check on `type`, `kind`, and `make`. Runtime routing is by
`cell.data.kind` through each renderer's `isMatch`, which the cast does not
touch.

Omit `validate` and nothing is gated: the value commits as typed. `kind` is only
read to route `validate`, so an entry with neither needs neither.

---

## 6. Columns

One definition per column, keyed by the row property it reads.

```ts
import type { ColumnDef } from "@matthewhsu1/datagrid";

export const COLUMN_DEFS: Record<string, ColumnDef> = {
  reference: {
    field: "reference", // REQUIRED. Row property, and the column's id everywhere.
    title: "Reference", // REQUIRED. Header text.
    defaultWidth: 160,  // REQUIRED. Pixels, before the user resizes.
    editable: false,    // REQUIRED. Whether a cell here accepts an edit.
    type: "text",       // REQUIRED. Must match a cell registry entry.
    sortable: true,     // default true. false hides this column's sort menu.
  },
  total: { field: "total", title: "Total", defaultWidth: 120, editable: true, type: "currency" },
  placedAt: {
    field: "placedAt",
    title: "Placed",
    defaultWidth: 180,
    editable: true,
    type: "date",
    withTime: true, // default false. Date cells only: keep the time part.
  },
};

export const DEFAULT_ORDER = ["reference", "total", "placedAt"];
```

Set `sortable: false` for any column the **server** cannot order by — one your
client derives, or one with no index behind it. The sort is sent to the server,
so an arrow on such a column is an arrow onto an error.

---

## 7. The descriptor

The static description of one grid. Written by the host, never by the engine.

```ts
import type { GridDescriptor } from "@matthewhsu1/datagrid";
import { localStorageColumnsAdapter } from "@matthewhsu1/datagrid";
import { COLUMN_DEFS, DEFAULT_ORDER, orderCells } from "./shared";
import { fetchCount, fetchRow, fetchRows, subscribe, updateRow, type OrderRow } from "./shared";

const columns = localStorageColumnsAdapter("orders:columns");
// ^ (storageKey, storage = localStorage). Swap in a REST adapter of the same shape.

export const orderDescriptor: GridDescriptor<OrderRow, never, number> = {
  name: "orders",          // REQUIRED. Store namespace + storage-key prefix. Unique, stable.
  rowKey: (row) => row.id, // REQUIRED. Row identity. NEVER derive it from array position.
  columns: {
    defs: COLUMN_DEFS,           // REQUIRED. All columns, keyed by field.
    defaultOrder: DEFAULT_ORDER, // REQUIRED. Left-to-right order before the user reorders.
  },
  cells: orderCells, // REQUIRED. Looked up by ColumnDef.type.
  pageSize: 100,     // default 100. Rows per loaded page.
  api: {
    fetchRows,                        // REQUIRED. One ordered slice. See the note below.
    fetchCount,                       // REQUIRED. Total under the current view.
    fetchRow,                         // REQUIRED. One row by id, for an id-only push.
    updateRow,                        // REQUIRED. Persist one cell edit. { ok: false } rolls back.
    subscribe,                        // default undefined. Live feed; returns an unsubscribe.
    loadColumns: columns.loadColumns, // default undefined. Omit to always start from defaults.
    saveColumns: columns.saveColumns, // default undefined. Needs startListening — section 9.
  },
  // grouping: omitted here. See section 8.
};
```

`fetchRows` asks for a **slice of an order**, never for a numbered page. The
`sort` it receives is a `SortSpec` (`{ field, direction, nulls }`) or `null`.

`updateRow` may return the server's authoritative `row`, and the engine writes
it over the optimistic value — that is how a derived column updates after an
edit. Returning `{ ok: false }` rolls the edit back and shows the banner.

`fetchCount` receives an opaque `filter`. The engine only carries it; put it in
your count's query key, because a stale total sizes the scrollbar for rows the
grid will never receive.

---

## 8. Grouping

Omit `grouping` and the grid renders flat. Supply it and rows are bucketed under
full-width header rows.

```tsx
import type { GridGrouping } from "@matthewhsu1/datagrid";
import type { OrderRow } from "./shared";

const REGIONS = ["APAC", "EMEA", "NA"]; // sorted, so indexOf gives the order

export const byRegion: GridGrouping<OrderRow, string> = {
  field: "region",                  // REQUIRED. Row property the grouping reads.
  of: (row) => row.region,          // REQUIRED. MUST return a primitive — see below.
  order: (g) => REGIONS.indexOf(g), // REQUIRED. MUST agree with `field` ascending.
  label: (g) => `${g} orders`,      // REQUIRED. Header text for a group.
  color: () => "iris",              // default undefined. Header colour, a Radix scale.
  header: (g) => <span>{g}</span>,  // default undefined. Your nodes, right of the name.
  headerHeight: 40,                 // default 40. Pixels. Nothing measures what you drew.
};
```

**`of` must return a primitive.** The engine tracks groups with `===`, `Set`,
and `Array.includes`. Return a fresh object per call — `{ year, month }` — and
every row reads as a new group, so collapse and dedup both silently do nothing
and no error is raised. Derive a string instead: `` `${year}-${month}` ``.

**`order` must agree with `field` ascending.** Group X sorts before group Y here
exactly when `X.field < Y.field`. The rows are ordered by `field`; the headers
are placed by this function. Disagree and the headers describe a different order
from the rows beneath them. Keeping the values in a sorted array and returning
`indexOf` satisfies this by construction.

**Your server must order by `grouping.field` ascending FIRST, then by `sort`.**
The group prefix never appears in the `fetchRows` request — `sort` carries only
the user's column. A server that ignores this returns the wrong rows for the
window, and the client cannot repair it.

**`headerHeight` is a number, not a measurement.** The canvas reserves the space
before React draws into it. A taller header is clipped; a shorter one leaves a
gap. Set it to fit the tallest thing `header` can return.

`header` is called during render, once per visible group. Keep it pure and
cheap; it is not the place to start a fetch. The same node is used twice: in the
header above the group, and in the banner naming the group you are scrolled
inside.

---

## 9. The grid instance

The runtime built from one descriptor. Create it **once, at module scope**.

```ts
import { createGridInstance } from "@matthewhsu1/datagrid";
import { createListenerMiddleware } from "@reduxjs/toolkit";
import { orderDescriptor } from "./shared";

export const listenerMiddleware = createListenerMiddleware();

export const orderGrid = createGridInstance(orderDescriptor, {
  startListening: listenerMiddleware.startListening,
  // ^ default undefined. REQUIRED whenever descriptor.api.saveColumns is set.
});
```

Column persistence runs as a listener effect. The engine ships no middleware of
its own, so it registers on yours. Set `saveColumns` without passing
`startListening` and `createGridInstance` **throws** at wiring time, rather than
silently never saving.

**One mounted grid per instance.** The instance holds single slots for the row
store, the pending store of a hold, and the collapse carry point. Two grids
mounted on the same instance at once overwrite each other's. A second view of
the same rows needs a second `createGridInstance`.

---

## 10. The store

Mount the instance's reducer under the descriptor's `name`, and concat your
listener middleware.

```ts
import { appearanceReducer } from "@matthewhsu1/datagrid";
import { configureStore } from "@reduxjs/toolkit";
import { listenerMiddleware, orderGrid } from "./shared";

export const store = configureStore({
  reducer: {
    appearance: appearanceReducer,
    orders: orderGrid.reducer, // the key MUST equal descriptor.name
  },
  middleware: (getDefault) => getDefault().prepend(listenerMiddleware.middleware),
});
```

The reducer holds only client-owned state: group collapse, sort, column order
and widths, hidden columns, row selection, and the last rejected edit. **No
server row is ever in Redux** — those live in the engine's own row store.

---

## 11. The query client

Row pages are fetched through TanStack Query. The grid needs a provider above
it; the client itself is yours.

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Provider } from "react-redux";
import { store } from "./shared";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // recommended: a refetch fights the held window
      retry: false,                // recommended: the row store already handles gaps
    },
  },
});

export function AppRoot({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </Provider>
  );
}
```

---

## 12. Rendering

`<DataGrid>` takes exactly one prop.

```tsx
import { DataGrid } from "@matthewhsu1/datagrid";
import { orderGrid } from "./shared";

export function OrdersPage() {
  return <DataGrid instance={orderGrid} />;
}
```

Everything else — sort menus, the column picker, group headers, the edit banner
— is drawn by the grid from the descriptor. Give it a sized parent; it fills the
space it is given.

---

## 13. Also exported

These are not knobs you configure. They are pieces you may need beside the grid.

### `DatePicker` and `DatePickerPopover`

The picker the date cell edits through, exported for your own DOM — filters,
toolbars, forms. `DatePicker` renders inline, because a grid overlay already
floats it. `DatePickerPopover` adds a Radix trigger button for ordinary DOM.

```tsx
import { DatePickerPopover } from "@matthewhsu1/datagrid";
import { useState } from "react";

export function DueDateFilter() {
  const [value, setValue] = useState<string | null>(null);

  return (
    <DatePickerPopover
      mode="date"            // REQUIRED. "date" | "datetime" | "range" | "range-datetime".
      value={value}          // REQUIRED. ISO string, or a { from, to } pair in range modes.
      onChange={setValue}    // REQUIRED. Fires once on confirm. Never on Cancel.
      placeholder="Any date" // default "Select date". Trigger label when unset.
      nullable               // default false. Allow confirming an empty value.
      disabled={false}       // default false.
    />
  );
}
```

`DatePicker` takes the same `mode`/`value` union plus `onConfirm`, `onCancel`,
`nullable`, and `autoFocus` (default `true`). The `mode` narrows the value type:
`date` and `datetime` use a string, `range` and `range-datetime` use
`{ from, to }`.

### Sorting

The comparator the engine itself uses. Reach for it when you sort rows outside
the grid and need the two orders to agree exactly.

```ts
import { compareBySpec, specFromGridSort, type SortSpec } from "@matthewhsu1/datagrid";
import type { OrderRow } from "./shared";

const spec: SortSpec | null = specFromGridSort({ field: "total", dir: "desc" });
// -> { field: "total", direction: "desc", nulls: "last" }

export function sortRows(rows: OrderRow[], by: SortSpec): OrderRow[] {
  return [...rows].sort((a, b) => compareBySpec(a, b, by, (row) => row.id));
}

export { spec };
```

The order is **total**: equal values fall back to the row key, so no two
distinct rows ever compare equal and nothing jumps under a still viewport.
Nulls always sort last, in both directions.

### `rowsKeyPrefix`

The TanStack Query key prefix every row page of one grid shares. Use it when
something outside the grid changes rows and you need to drop the cache.

```ts
import { rowsKeyPrefix } from "@matthewhsu1/datagrid";
import { queryClient } from "./shared";

export function dropOrderRows(): void {
  queryClient.invalidateQueries({ queryKey: rowsKeyPrefix("orders") });
}
```

Pass the descriptor's `name`. For a change that **moves** rows — a create or a
delete — invalidating is not enough on its own; the engine bumps its own data
generation when a push arrives through `api.subscribe`.

### Badge colours

```ts
import { BADGE_SEQUENCE, radixColorByIndex, type RadixColor } from "@matthewhsu1/datagrid";

export const third: RadixColor = radixColorByIndex(2); // "amber"
export const cycleLength = BADGE_SEQUENCE.length;      // 10
```

`radixColorByIndex` is the rule an enum option follows when it names no colour:
`BADGE_SEQUENCE[value % 10]`. Call it yourself to colour something outside the
grid — a legend, a chart, a filter chip — to match the badges exactly.

`drawSoftBadge(ctx, rect, color, label, font)` paints the same pill on a canvas.
It is for a **custom cell** that wants to look like the built-in enum cell.

### Grid themes

```ts
import { darkGridTheme, lightGridTheme, themeForAppearance } from "@matthewhsu1/datagrid";

export const current = themeForAppearance("dark"); // === darkGridTheme
export const pair = [lightGridTheme, darkGridTheme];
```

These are glide-data-grid theme objects, not Radix ones. `useGridTheme()` is the
hook `<DataGrid>` uses internally; it reads your appearance and returns the
right one. You rarely need any of them — reach for them to style a second glide
surface so it matches the grid.

### Testing

Published from a separate subpath so it never reaches an app bundle.

```ts
import { createFakeRowServer } from "@matthewhsu1/datagrid/testing";
import type { OrderRow } from "./shared";

const server = createFakeRowServer<OrderRow, string, number>({
  rows: [],                     // REQUIRED. The starting rows.
  rowKey: (row) => row.id,      // REQUIRED. Same function the descriptor uses.
  groupOf: (row) => row.region, // default undefined. Omit and collapse is ignored.
});

// server.api is a drop-in descriptor.api: fetchRows, fetchCount, fetchRow,
// updateRow, subscribe.
export const testDescriptorApi = server.api;

// Arrange and act on the server itself.
server.setRows([]);                     // replace the rows outright
server.push({ kind: "update", id: 1 }); // emit a push; sequence is stamped for you
export const currentRows = server.rows; // read them back
```

It sorts with `compareBySpec` — the same function the live query uses. If the
two ever disagree, a test fails instead of a user watching rows jump.
