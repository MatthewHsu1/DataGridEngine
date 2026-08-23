import type { VisibleHeader } from "./displayModel";
import type { HeaderPlacement } from "./GroupHeaderLayer";

/** Everything needed to say where a display row is drawn, as of one region report. */
export interface CanvasGeometry {
  /** First display row in the viewport — `rect.y`. */
  firstRow: number;

  /** The sub-row pixel offset glide reports alongside the region — its `ty`. */
  translateY: number;

  /** Height of the grid's own column-header row. */
  headerHeight: number;

  /** Height of any display row. */
  heightOf: (displayRow: number) => number;
}

/**
 * Where one display row is drawn, measured from the top of the canvas.
 *
 * This is glide's own arithmetic, repeated. That is a real cost and it was not
 * the first choice: the obvious move is to ask `getBounds` and let glide answer
 * about itself.
 *
 * It cannot. `getBounds` reads glide's visible-region STATE, and glide reports
 * a region change before React has committed that state — the ref is updated,
 * the state is not. So the answer describes the frame BEFORE the one being
 * scrolled into. At reading speed the next report corrects it and nothing shows;
 * on a fast scroll back and forth the header sits visibly off its band.
 *
 * `firstRow` and `translateY` both arrive in the same callback, so this answers
 * about the frame actually being drawn.
 */
function topOfRow(displayRow: number, geometry: CanvasGeometry): number {
  const { firstRow, translateY, headerHeight, heightOf } = geometry;

  let top = headerHeight + translateY;

  const direction = firstRow > displayRow ? -1 : 1;

  for (let row = firstRow; row !== displayRow; row += direction) {
    top += heightOf(direction === 1 ? row : row - 1) * direction;
  }

  return top;
}

/**
 * Where each visible header goes, keyed by display row.
 *
 * The height is the row's own, exactly — not the row plus the border pixel
 * glide reports in a cell's bounds. Taking that pixel too covers the first line
 * of the row BELOW, which is where a selected cell draws the top edge of its
 * ring: a cell directly under a group header then looked like it had no top
 * border at all.
 */
export function headerPlacements<TGroup>(
  headers: readonly VisibleHeader<TGroup>[],
  geometry: CanvasGeometry,
): Map<number, HeaderPlacement> {
  const placements = new Map<number, HeaderPlacement>();

  for (const header of headers) {
    placements.set(header.displayRow, {
      top: topOfRow(header.displayRow, geometry),
      height: geometry.heightOf(header.displayRow),
    });
  }

  return placements;
}
