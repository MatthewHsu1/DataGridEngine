import { GridCellKind, type GridCell, type Theme } from "@glideapps/glide-data-grid";

/**
 * What the canvas draws where a group header goes: nothing, full width.
 *
 * The header itself is React, floating above this row — see
 * `GroupHeaderLayer`. A canvas cannot hold a component, so the canvas holds the
 * SPACE instead, and the display model keeps counting the row exactly as it did
 * when the label was painted here.
 *
 * It is still filled. The canvas paints first and React commits after, so an
 * unfilled hole would flash the ordinary cell fill on any frame the layer has
 * not caught up with. The span matters for the same reason: without it, column
 * borders would draw straight across the header.
 *
 * It takes the theme rather than reaching for one, because the appearance lives
 * in the host's store — that is what lets a test assert the dark fill without
 * mounting a grid.
 */
export function groupHeaderHole(columnCount: number, theme: Partial<Theme>): GridCell {
  return {
    kind: GridCellKind.Text,
    data: "",
    displayData: "",
    allowOverlay: false,
    span: [0, Math.max(0, columnCount - 1)],
    themeOverride: { bgCell: theme.bgHeader },
  };
}
