import type { ReactNode } from "react";
import type { BannerGroup } from "./GridHeaderBar";
import type { GridGrouping } from "./types";

/** What the header bar shows for the group the viewport is currently inside. */
export interface GroupBanner {
  /** Hand to `<GridHeaderBar group>`. Null when there is no group to name. */
  banner: BannerGroup | null;

  /**
   * Hand to `<GridHeaderBar groupSlot>`.
   *
   * `undefined` and `null` mean different things here, deliberately. `undefined`
   * is "this host has no components for a group", and draws no slot row at all.
   * `null` is "it has some, but the group is not known yet", and draws the row
   * EMPTY — keeping its height, so the bar does not grow and shrink, and shove
   * the grid up and down, every time a scrollbar jump lands on rows that have
   * not arrived.
   */
  slot: ReactNode | undefined;
}

/** A grid that is not grouping: no name to show, and no row to keep space for. */
const NO_BANNER: GroupBanner = { banner: null, slot: undefined };

export interface GroupBannerArgs<TRow, TGroup> {
  grouping: GridGrouping<TRow, TGroup> | undefined;

  /** The groups the user has collapsed, straight from the store. */
  collapsedGroups: readonly TGroup[];

  /** Resolved CSS colour for the group's name. See `groupHeaderColor`. */
  textColor: (group: TGroup) => string | undefined;

  onToggle: (group: TGroup) => void;
}

function slotFor<TRow, TGroup>(
  grouping: GridGrouping<TRow, TGroup>,
  group: TGroup | null,
): ReactNode | undefined {
  if (grouping.header === undefined) {
    return undefined;
  }

  return group === null ? null : grouping.header(group);
}

/**
 * The banner and its slot, from ONE reading of the current group.
 *
 * One derivation with two answers, rather than two derivations. The two
 * disagree on purpose about a group that is not known yet — see
 * `GroupBanner.slot` — and a rule that subtle, written out twice, is a rule
 * that drifts.
 *
 * `collapsed` comes from the STORE's collapsed set and not from the display
 * model, for the same reason the in-grid chevrons do: a collapse is answered by
 * the server dropping the group's rows, and the model still reports the group
 * as open until they go. See `useGroupHeaders`.
 */
export function groupBanner<TRow, TGroup>(
  group: TGroup | null,
  { grouping, collapsedGroups, textColor, onToggle }: GroupBannerArgs<TRow, TGroup>,
): GroupBanner {
  if (grouping === undefined) {
    return NO_BANNER;
  }

  const slot = slotFor(grouping, group);

  if (group === null) {
    return { banner: null, slot };
  }

  return {
    banner: {
      label: grouping.label(group),
      textColor: textColor(group),
      collapsed: collapsedGroups.includes(group),
      onToggle: () => onToggle(group),
    },
    slot,
  };
}
