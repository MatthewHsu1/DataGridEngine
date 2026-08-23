// src/features/dataGrid/groupHeaderCell.ts
import { GridCellKind, type GridCell, type Theme } from "@glideapps/glide-data-grid";
import type { RadixColor } from "../../lib/grid/radixBadgePalette";
import { resolveRadixSoft } from "../../lib/grid/softBadge";

/**
 * Text color for a header whose group names no color of its own.
 *
 * `textHeader` and not `textDark`: the row is a header, and pairing it with the
 * `bgHeader` fill below is what keeps it reading as one when nothing else
 * distinguishes it.
 */
function fallbackText(theme: Partial<Theme>): string | undefined {
  return theme.textHeader;
}

/**
 * Text color for a header whose group names a Radix scale.
 *
 * Step 11 is the label step of a Radix scale — the SAME step `drawSoftBadge`
 * fills its text with, which is what makes the header and the badges under it
 * agree. The var is read off the live Themes root, so it already carries the
 * current appearance; nothing here has to know whether it is light or dark.
 *
 * An unresolved scale answers empty (its CSS was never imported — `softBadge`
 * has already warned). Falling back then is better than writing `""` into the
 * override, which glide would draw as transparent.
 */
function colorText(color: RadixColor, theme: Partial<Theme>): string | undefined {
  return resolveRadixSoft(color).text || fallbackText(theme);
}

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
      textDark: color === undefined ? fallbackText(theme) : colorText(color, theme),
    },
  };
}
