# @matthewhsu1/datagrid

A virtualised, server-paged data grid engine for React, built over
[glide-data-grid](https://github.com/glideapps/glide-data-grid).

It is the parts a spreadsheet-shaped page needs and a renderer does not give
you: a windowed page loader, a row cache that evicts, optimistic edits with
rollback, cross-client row sync, grouping with collapse, sorting, persisted
column layout, and typed cell editors — all against a server that holds far
more rows than the browser ever will.

> **Status: 0.x.** The API will break between minor versions. It is pinned to a
> **pre-release** build of glide-data-grid (`6.0.4-alpha24`); that pin loosens
> when glide 6 ships stable.

## Install

```bash
npm i @matthewhsu1/datagrid
```

It expects these to already be in your app:

```bash
npm i react react-dom react-redux @reduxjs/toolkit @tanstack/react-query \
      @radix-ui/themes @glideapps/glide-data-grid@6.0.4-alpha24
```

## Wire it up

### 1. Styles, once

```ts
import "@matthewhsu1/datagrid/radix-styles"; // Radix token CSS the badges need
import "@matthewhsu1/datagrid/datagrid.css"; // the grid's own styles
```

There is no Tailwind here. The package ships plain CSS on `dg-`-prefixed
classes, so it styles itself whatever your app uses.

### 2. Tell it about your theme, once

```ts
import { configureGridTheme } from "@matthewhsu1/datagrid";

configureGridTheme({
  accentColor: "grass", // match your app's Radix accent
  grayColor: "slate",
  selectAppearance: (state) => state.myTheme.mode, // optional, see below
});
```

A cell editor portals out of the canvas and mounts its own `<Theme>`, so it
cannot inherit your provider — this is how it learns your accent.

### 3. Give it light/dark

The grid reads `state.appearance.appearance` by default. Either mount the
slice the package ships:

```ts
import { appearanceReducer, setAppearance } from "@matthewhsu1/datagrid";

configureStore({ reducer: { appearance: appearanceReducer /* ... */ } });
```

…or point `configureGridTheme({ selectAppearance })` at wherever you already
keep it. What _writes_ it — an OS media query, a host page class, a toggle — is
always yours.

### 4. Describe a grid

```ts
import {
  createGridInstance,
  localStorageColumnsAdapter,
  type GridDescriptor,
} from "@matthewhsu1/datagrid";

const columns = localStorageColumnsAdapter("orders:columns");

export const orderGrid = createGridInstance(
  {
    name: "orders",
    rowKey: (row) => row.id,
    columns: { defs: COLUMN_DEFS, defaultOrder: [...] },
    api: {
      fetchRows,       // one ordered slice
      fetchCount,      // the total under the current view
      fetchRow,        // one row, for an id-only push
      updateRow,       // persist one cell edit
      loadColumns: columns.loadColumns,
      saveColumns: columns.saveColumns,
    },
    cells: orderCells,
  } satisfies GridDescriptor<OrderRow, never, string>,
  // Column persistence runs as a listener effect. The engine ships no
  // middleware of its own, so hand it yours.
  { startListening: listenerMiddleware.startListening },
);
```

Mount `orderGrid.reducer` under `"orders"` in your store, and render:

```tsx
<DataGrid instance={orderGrid} />
```

## Run the demo

```bash
npm install
npm run dev
```

100,000 synthetic rows served by a Mock Service Worker, with every cell type,
grouping, sorting, editing, and a control bar for latency and failure rates.
The demo consumes the package **by name**, aliased to source — so if the public
surface is not enough to build an app, the demo stops building.

## What is public

Only what `src/index.ts` re-exports, plus `@matthewhsu1/datagrid/testing`.
Deep imports are blocked by `exports`, deliberately: everything else is free to
move in a patch release.

## Vocabulary

[`CONTEXT.md`](./CONTEXT.md) defines every term this codebase uses — _hold_,
_span_, _display model_, _data generation_, and the rest. Read it before
changing anything in `src/features/dataGrid/`.

## Develop

```bash
npm test          # 425 tests
npm run typecheck
npm run lint
npm run build     # dist/ — JS, .d.ts, and datagrid.css
```

## Licence

MIT
