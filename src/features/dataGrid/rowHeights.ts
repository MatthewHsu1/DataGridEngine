import { displayToData, type DisplayModel } from "./displayModel";

/** The height a group header gets when the descriptor names none. */
export const DEFAULT_GROUP_HEADER_HEIGHT = 40;

/**
 * Glide's own default row height.
 *
 * Handing glide a rowHeight FUNCTION replaces that default for every row,
 * headers and data alike, so data rows have to be told the height they
 * already had — otherwise adding group headers silently changes the density
 * of the whole grid.
 */
export const DEFAULT_ROW_HEIGHT = 34;

/**
 * Height of the grid's own column-header row, pinned rather than left to glide.
 *
 * `useGroupHeaders` measures every hole down from this line, so the number it
 * measures with and the number handed to `<DataEditor headerHeight>` have to be
 * the same one. 36 is glide's default; naming it is what stops a change to one
 * silently un-aligning the other.
 */
export const COLUMN_HEADER_HEIGHT = 36;

/**
 * The height of every display row, which glide asks for one row at a time.
 *
 * The canvas reserves a group header's hole by THIS number, and the React that
 * fills the hole is measured by nothing. That is why `grouping.headerHeight` is
 * a number the host sets rather than something the engine measures: measuring
 * would mean draw, measure, resize, draw — on every scroll, and untestable.
 *
 * A row past the end answers the ordinary row height rather than throwing.
 * Glide asks about one row beyond the last as a prefetch hint.
 */
export function rowHeightFor<TGroup>(
  model: DisplayModel<TGroup>,
  rowHeight: number,
  headerHeight: number,
): (displayRow: number) => number {
  return (displayRow) =>
    displayToData(model, displayRow).kind === "header" ? headerHeight : rowHeight;
}
