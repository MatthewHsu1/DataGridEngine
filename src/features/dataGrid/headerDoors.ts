import type { DrawHeaderCallback, SpriteMap } from "@glideapps/glide-data-grid";
import { sortHeaderIcons } from "./headerIcons";
import type { GridSort } from "./types";

/**
 * Glide's own header draw args, plus the two things only this engine knows.
 *
 * The shape is glide's, deliberately: a `drawHeader` copied out of glide's own
 * docs works here unchanged. The engine's extras ride ON the args object rather
 * than arriving as a third parameter, which would have broken that on sight.
 */
export type GridDrawHeaderArgs = Parameters<DrawHeaderCallback>[0] & {
  /**
   * The grid's current ordering, or null for natural order. Grid-wide, not
   * per-column: compare `sort.field` with `args.column.id` to find out whether
   * it is THIS header's.
   */
  sort: GridSort | null;

  /** Whether this column offers a sort menu at all. */
  sortable: boolean;
};

/**
 * A replacement for the engine's column header.
 *
 * The override is TOTAL: nothing the engine draws survives it, sort chevron and
 * menu arrow included. Call `drawDefault()` to paint the engine's header first
 * and add to it, or ignore it and draw the whole thing.
 */
export type GridDrawHeader = (args: GridDrawHeaderArgs, drawDefault: () => void) => void;

/**
 * The engine's header sprites with the host's laid over them.
 *
 * MERGED, not replaced. `headerIcons` is a dictionary and the sort indicator
 * refers to `sortAsc`/`sortDesc` by NAME, so a host adding one icon of their own
 * must not take those with it. `drawHeader` is total for the opposite reason:
 * there is only one header, and half of one is not a header.
 */
export function mergeHeaderIcons(host: SpriteMap | undefined): SpriteMap {
  return { ...sortHeaderIcons, ...host };
}

/**
 * Glide's callback, wrapped only to put the sort state the engine owns onto the
 * args it hands over.
 *
 * Without it a total override could never redraw the chevron it just replaced:
 * glide knows nothing about sorting, and the engine's indicator is drawn through
 * the header it was handed.
 */
export function withSortArgs(
  drawHeader: GridDrawHeader | undefined,
  sort: GridSort | null,
  isSortable: (field: string) => boolean,
): DrawHeaderCallback | undefined {
  if (drawHeader === undefined) {
    return undefined;
  }

  return (args, drawDefault) =>
    drawHeader({ ...args, sort, sortable: isSortable(args.column.id ?? "") }, drawDefault);
}
