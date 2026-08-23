import type { ColumnDef } from "./types";

/**
 * Whether a column offers a sort, resolved once for the whole grid.
 *
 * Two readers must agree: `hooks/useGridColumns.ts`, which decides whether the
 * header draws a menu arrow at all, and `hooks/useColumnSortMenu.tsx`, which
 * decides whether a click on one opens anything. A header that draws an arrow
 * onto a menu that refuses to open is the failure this shared answer prevents.
 *
 * The default is yes. Sorting reads a column; editing writes one, and a column
 * being read-only says nothing about whether the server can order by it. A
 * column that the server genuinely cannot order by says so itself, on its own
 * `ColumnDef`.
 */
export function sortablePredicate(
  defs: Record<string, ColumnDef>,
): (field: string) => boolean {
  return (field: string) => defs[field] !== undefined && defs[field].sortable !== false;
}
