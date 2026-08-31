import { Button, Spinner } from "@radix-ui/themes";
import { CircleAlert } from "lucide-react";
import type { ReactNode } from "react";
import { GroupHeaderRow } from "./GroupHeaderRow";

/** The group the grid is currently inside, or null when it is not grouping. */
export interface BannerGroup {
  label: string;

  /** Resolved CSS colour for the name. Omit to inherit. */
  textColor?: string;

  collapsed: boolean;
  onToggle: () => void;
}

export interface GridHeaderBarProps {
  status: "loading" | "ready" | "error";

  /**
   * Whether at least one page failed to load.
   */
  partialFailure?: boolean;

  error: string | null;

  /** Rows the grid is currently drawing. Zero means there are no cells to speak for a load. */
  rowCount: number;

  /** The grid is drawing the previous state while the next one loads. */
  stale?: boolean;

  onRetry: () => void;

  /** Omit to render the edit error without a dismiss. */
  onDismissError?: () => void;

  group: BannerGroup | null;

  /** The host's components for the current group. */
  groupSlot?: ReactNode;

  /** The column picker. */
  picker?: ReactNode;
}

function Working({ children }: { children: ReactNode }) {
  return (
    <span
      role="status"
      className="dg:flex dg:min-w-0 dg:items-center dg:gap-2 dg:text-xs dg:text-[var(--gray-11,#60646c)]"
    >
      <Spinner size="1" />
      <span className="dg:truncate">{children}</span>
    </span>
  );
}

function Wrong({ children }: { children: ReactNode }) {
  return (
    <span
      role="alert"
      className="dg:flex dg:min-w-0 dg:items-center dg:gap-2 dg:text-xs dg:text-[var(--red-11,#ce2c31)]"
    >
      <CircleAlert size={14} aria-hidden />
      {children}
    </span>
  );
}

/**
 * The middle zone: what the grid is doing, or what went wrong.
 *
 * The order is a ranking, not a sequence. A load speaks for every row on
 * screen, so it outranks an edit error, which speaks for one cell. The wait
 * costs the user nothing: the edit error names its cell by ROW KEY — see
 * `hooks/useCellRenderer.ts` — and not by position, so a state change cannot
 * make it point at the wrong row. It stays in the slice and comes back the
 * moment the load settles.
 *
 * A load stays silent while the grid HAS rows, because the loading cells
 * already say it. `rowCount` is what tells the two apart: on a first load the
 * total is not known yet, so there are no cells and no loading cells either.
 *
 * `stale` gets a line for the opposite reason. The grid then holds a full set
 * of rows and draws no loading cell at all, because every one of those rows
 * belongs to the state the user has just left. Nothing on the canvas says so.
 */
function StatusZone({
  status,
  partialFailure,
  error,
  rowCount,
  stale,
  onRetry,
  onDismissError,
}: Pick<
  GridHeaderBarProps,
  "status" | "partialFailure" | "error" | "rowCount" | "stale" | "onRetry" | "onDismissError"
>) {
  if (status === "error") {
    return (
      <Wrong>
        Could not load rows.
        <Button size="1" variant="soft" color="red" onClick={onRetry}>
          Retry
        </Button>
      </Wrong>
    );
  }

  if (partialFailure === true) {
    return (
      <Wrong>
        Some rows could not load.
        <Button size="1" variant="soft" color="red" onClick={onRetry}>
          Retry
        </Button>
      </Wrong>
    );
  }

  if (stale === true) {
    return <Working>Loading…</Working>;
  }

  if (error !== null) {
    return (
      <Wrong>
        <span className="dg:truncate">{error}</span>
        {onDismissError !== undefined && (
          <Button size="1" variant="soft" color="red" onClick={onDismissError}>
            Dismiss
          </Button>
        )}
      </Wrong>
    );
  }

  if (status === "loading" && rowCount === 0) {
    return <Working>Loading rows…</Working>;
  }

  return null;
}

/**
 * The one permanent bar above the grid.
 *
 * It never renders as nothing, which is the whole reason the old status bar was
 * folded into it: a bar that came and went moved the grid under the pointer
 * every time a load settled.
 *
 * The group zone shows the group the user is currently inside. It carries the
 * SAME `GroupHeaderRow` the in-grid headers use, minus the host's components —
 * those need a row of their own here, because the status and the picker have
 * already spent the first one.
 */
export function GridHeaderBar({ group, groupSlot, picker, ...status }: GridHeaderBarProps) {
  return (
    <div className="dg:flex dg:flex-col dg:border-b dg:border-[var(--gray-6,#e1e6eb)] dg:bg-[var(--gray-1,#fcfcfd)]">
      <div className="dg:flex dg:h-10 dg:items-center dg:gap-3 dg:px-2">
        {group !== null && (
          <div className="dg:flex dg:shrink-0 dg:items-center">
            <GroupHeaderRow
              label={group.label}
              textColor={group.textColor}
              collapsed={group.collapsed}
              onToggle={group.onToggle}
            />
          </div>
        )}

        <div className="dg:flex dg:min-w-0 dg:grow dg:items-center dg:gap-2">
          <StatusZone {...status} />
        </div>

        {picker !== undefined && <div className="dg:shrink-0">{picker}</div>}
      </div>

      {groupSlot !== undefined && (
        <div
          data-dg-group-slot
          className="dg:flex dg:items-center dg:gap-2 dg:border-t dg:border-[var(--gray-4,#eef0f3)] dg:px-3 dg:py-2"
        >
          {groupSlot}
        </div>
      )}
    </div>
  );
}
