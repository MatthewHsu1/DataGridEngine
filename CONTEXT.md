# Context

The vocabulary of this codebase. Every term here has exactly one meaning; if
you find code using one of these words differently, that code is wrong, not
this file.

This is a glossary and nothing else. It carries no design decisions, no
implementation notes, and no roadmap.

## The parties

**Engine** — this package. It owns the windowing, the caching, the display
arithmetic, and the cell editors. It owns no server, no store, and no router.

**Host app** — the application that installs the engine. It owns the Redux
store, the listener middleware, the query client, the appearance signal, and
every server call.

## Describing a grid

**Descriptor** — the static description of one grid: its name, its columns, how
to read a row's key, how to group, which cells to draw, and the four server
functions. Written by the host, never by the engine.

**Grid instance** — the runtime built from one descriptor. It carries the
reducer, the selectors, the action creators, and the cells that hold the
mounted grid's row store. One instance drives at most one mounted grid at a
time.

**Row key** — the value that identifies a row for its whole life, independent of
where the row currently sits. Positions move; keys do not.

**Cell type** — the string in a column's `type` naming how that column draws
and edits. The ones this package draws are prefixed `dg:`; glide's own kinds are
named as glide names them. A **cell registry** maps every type to its maker, its
renderer, and its validator; the engine builds one per grid from the built-in
types plus the descriptor's own.

**Cell options** — one column's settings for its cell type, written on the
column and carried inside every cell that column makes. Only the cell type they
belong to reads them.

**Custom column** — a column whose `type` names a cell the host registered
rather than one this package ships. It says so with `custom: true`, which is
what lets every other column's `type` and options be checked.

## Rows and where they live

**Row store** — the engine's cache of server rows, held by page. It is the only
place a server row lives. No row is ever in Redux.

**Page** — one fixed-size run of rows, the unit the store loads and evicts.

**Window** — the run of rows the user can currently see, plus the overscan
around it. A window is a request for a slice of an order, never for a numbered
page.

**Span** — the CONTIGUOUS run of loaded rows the display reads, starting at a
given offset and stopping at the first row the store does not hold. Shorter
than the window whenever an eviction has left a hole.

**Edit overlay** — where a cell edit lives between the keystroke and the
server's answer. A row on screen is the stored row with the overlay applied on
top.

## Position arithmetic

**Data index** — a row's position in the server's order, counting rows only.

**Display row** — a row's position on screen, counting group headers as well as
rows. The two differ by every header above.

**Display model** — the mapping between data indexes and display rows for the
current group and collapse state. Rebuilt whenever either changes.

**Boundary** — a point in the span where the group key changes, i.e. where a
header belongs.

## Groups

**Group** — the value rows are bucketed by. Always a primitive: the engine
compares groups by identity.

**Group header** — the full-width row that names a group and sits above that
group's rows. It occupies a display row and holds no data index.

**Collapsed group** — a group whose rows the server is told to leave out. A
collapse changes the total, so it is part of the view's identity.

## Changing what is on screen

**View** — the full identity of what the grid is showing: the sort, the
collapsed set, and the data generation. A change to any of the three means a
different set of rows, and therefore a different row store.

**Hold** — the state where two row stores are live at once: the one the user is
reading, and the one loading the next view behind it. A hold is what stops a
sort or a collapse blanking the screen.

**Adoption** — the moment the held store replaces the displayed one.

**Data generation** — a counter naming which set of rows the grid is showing.
It is bumped when a change moves positions, which no page-indexed cache can
repair in place.

**Stale** — displaying the rows of the previous view while the next one loads.
An honest state, and a visible one.

## Changes from elsewhere

**Push** — a notification that a row changed somewhere other than this client.
It names the row; it never carries it.

**Repaint** — redrawing named rows through the canvas's damage API, without
re-rendering React. The only way a changed row reaches the screen without a
flash.

## Appearance

**Appearance** — light or dark. The engine reads it and never decides it.

**Appearance watcher** — the host-owned thing that decides: an OS media query,
a host page's class, a user toggle. Always outside this package.

## Column layout

**Columns state** — the user's own arrangement of the columns: their order,
the widths they dragged, and the ones they hid. Client-owned, and the only part
of the presentation the user changes directly.

**Columns adapter** — where that arrangement is read from and written to. The
engine's default writes to Web Storage; a descriptor may name its own.
