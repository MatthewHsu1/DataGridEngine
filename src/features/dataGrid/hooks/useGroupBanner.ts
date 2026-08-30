// src/features/dataGrid/hooks/useGroupBanner.ts
import { useCallback, useMemo } from "react";
import { groupBanner, type GroupBanner } from "../groupBanner";
import { groupHeaderTextColor } from "../groupHeaderColor";
import type { RadixColor } from "../../../lib/grid/radixBadgePalette";
import type { GridGrouping } from "../types";

interface Args<TRow, TGroup> {
  grouping: GridGrouping<TRow, TGroup> | undefined;

  /** The group the top of the viewport sits in, from `useGroupHeaders`. */
  group: TGroup | null;

  /** The groups the user has collapsed, straight from the store. */
  collapsedGroups: readonly TGroup[];

  /** Colour for a group that names no scale of its own — the theme's header text. */
  fallbackColor: string | undefined;

  /**
   * The Radix scale a group's name is written in, already resolved from the
   * descriptor — `grouping.color` where the host set one, otherwise the grouped
   * enum column's own choices. See `groupColumnColor`.
   */
  colorOf: ((group: TGroup) => RadixColor | undefined) | undefined;

  /** From `useDisplayModel`. THE ONLY dispatcher of a collapse. */
  toggleGroup: (group: TGroup) => void;

  /** From `useGroupHeaders`. */
  revealAfterCollapse: (group: TGroup) => void;
}

interface Result<TGroup> extends GroupBanner {
  /**
   * Resolved CSS colour for any group's name.
   *
   * Returned as well as used, because the in-grid header layer paints the same
   * names and the two must not answer differently.
   */
  groupColor: (group: TGroup) => string | undefined;
}

/**
 * The header bar's group zone: which group the user is inside, and how folding
 * it from up there behaves.
 *
 * Collapsing from the banner is how a user skips a group too tall to scroll
 * past, and it is not the same act as clicking the in-grid chevron: the header
 * being clicked is pinned, so the view has to be MOVED onto the real one
 * afterwards. Collapsing a group removes the rows BELOW its header, so that
 * header does not move, and the user lands on the group they just folded with
 * the next one directly under it.
 */
export function useGroupBanner<TRow, TGroup>({
  grouping,
  group,
  collapsedGroups,
  fallbackColor,
  colorOf,
  toggleGroup,
  revealAfterCollapse,
}: Args<TRow, TGroup>): Result<TGroup> {
  const groupColor = useCallback(
    (of: TGroup) => groupHeaderTextColor(colorOf?.(of), fallbackColor),
    [colorOf, fallbackColor],
  );

  const collapseFromBanner = useCallback(
    (of: TGroup) => {
      toggleGroup(of);

      // Not scrolled here. The rows are dropped by the SERVER, so the grid this
      // click would scroll is the one about to be replaced — see
      // `useGroupHeaders.revealAfterCollapse`.
      revealAfterCollapse(of);
    },
    [toggleGroup, revealAfterCollapse],
  );

  const { banner, slot } = useMemo(
    () =>
      groupBanner(group, {
        grouping,
        collapsedGroups,
        textColor: groupColor,
        onToggle: collapseFromBanner,
      }),
    [group, grouping, collapsedGroups, groupColor, collapseFromBanner],
  );

  return { banner, slot, groupColor };
}
