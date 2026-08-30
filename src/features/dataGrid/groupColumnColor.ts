import { ENUM_CELL_TYPE } from "../../lib/grid/enumCell";
import { enumColorOf, type EnumCellOptions } from "../../lib/grid/enumChoices";
import type { RadixColor } from "../../lib/grid/radixBadgePalette";
import type { ColumnDef, GridGrouping } from "./types";

/**
 * How a group's name is coloured, resolved from the descriptor alone.
 *
 * Grouping by an enum column and colouring its header the same as the badges
 * under it is the ordinary case, and the engine already holds both halves: the
 * grouped field, and that column's choices. Making the host wire the two
 * together was busywork with one right answer, so the engine answers it.
 *
 * `grouping.color` still wins where it is set. Grouping by anything but a
 * `dg:enum` column answers undefined, which falls the header back to the
 * theme's header text colour — the right answer for a group with no colour of
 * its own, not an error.
 *
 * A group value that is not a number cannot index an enum's choices, so it
 * answers undefined too rather than guessing.
 */
export function groupColumnColor<TRow, TGroup>(
  grouping: GridGrouping<TRow, TGroup> | undefined,
  defs: Record<string, ColumnDef>,
): ((group: TGroup) => RadixColor | undefined) | undefined {
  if (grouping === undefined) {
    return undefined;
  }

  if (grouping.color !== undefined) {
    return grouping.color;
  }

  const def = defs[grouping.field];

  if (def === undefined || def.type !== ENUM_CELL_TYPE) {
    return undefined;
  }

  const choices = (def.options as EnumCellOptions | undefined)?.choices;

  if (choices === undefined) {
    return undefined;
  }

  return (group) => (typeof group === "number" ? enumColorOf(choices, group) : undefined);
}
