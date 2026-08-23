// src/features/dataGrid/groupHeaderCell.ts
import { GridCellKind, type GridCell, type Theme } from "@glideapps/glide-data-grid";
import type { RadixColor } from "../../lib/grid/radixBadgePalette";
import { groupHeaderTextColor } from "./groupHeaderColor";

/**
 * The full-width row that names a group and spans every column.
 *
 * It takes the theme rather than reaching for one, because the appearance lives
 * in the host's store and this has to stay a pure function of its arguments —
 * that is what lets a test assert the dark colors without mounting a grid.
 *
 * `bgCell` is set from `bgHeader` on every call, override included. Leaving it
 * off would let the group row inherit the ordinary cell fill and vanish into
 * the rows it separates.
 */
export function groupHeaderCell(
  label: string,
  columnCount: number,
  theme: Partial<Theme>,
  color?: RadixColor,
): GridCell {
  return {
    kind: GridCellKind.Text,
    data: label,
    displayData: `▾ ${label}`,
    allowOverlay: false,
    span: [0, Math.max(0, columnCount - 1)],
    themeOverride: {
      bgCell: theme.bgHeader,
      textDark: groupHeaderTextColor(color, theme.textHeader),
    },
  };
}
