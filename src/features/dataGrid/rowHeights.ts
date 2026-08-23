import { displayToData, type DisplayModel } from "./displayModel";

/** The height a group header gets when the descriptor names none. */
export const DEFAULT_GROUP_HEADER_HEIGHT = 40;

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
