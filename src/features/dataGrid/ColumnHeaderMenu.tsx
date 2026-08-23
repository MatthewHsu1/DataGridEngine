import { DropdownMenu } from "@radix-ui/themes";
import { ArrowDownAZ, ArrowUpAZ, X } from "lucide-react";
import type { GridSort } from "./types";

/** The header menu arrow the user pressed, and where it sits. */
export interface ColumnMenuTarget {
  field: string;

  /**
   * The arrow's box, in VIEWPORT coordinates: the grid measures it against the
   * canvas's client rect, so the anchor below is `position: fixed` to match.
   */
  bounds: { x: number; y: number; width: number; height: number };
}

/**
 * The menu behind a column header's arrow.
 *
 * Sorting asks for a column and a direction outright, rather than cycling one
 * through them. A cycle only says what it will do by being pressed, and on a
 * grid the press costs a reload of every row on screen.
 *
 * The arrow itself is painted by the grid, on the canvas, so there is no DOM
 * element to hang a menu on. The trigger below is therefore an empty span
 * parked over the arrow's box: it is the anchor Radix positions against, never
 * a control — the thing the user aims at is the painted arrow.
 */
export function ColumnHeaderMenu({
  target,
  sort,
  onSort,
  onClose,
}: {
  target: ColumnMenuTarget | null;
  sort: GridSort | null;
  onSort: (next: GridSort | null) => void;
  onClose: () => void;
}) {
  if (target === null) return null;

  const { field, bounds } = target;
  const sorted = sort?.field === field ? sort.dir : null;

  return (
    <DropdownMenu.Root
      open
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DropdownMenu.Trigger>
        <span
          data-dg-column-menu-anchor
          aria-hidden
          style={{
            position: "fixed",
            left: bounds.x,
            top: bounds.y,
            width: bounds.width,
            height: bounds.height,
            pointerEvents: "none",
          }}
        />
      </DropdownMenu.Trigger>

      <DropdownMenu.Content size="1" align="start">
        <DropdownMenu.Item
          onSelect={() => onSort({ field, dir: "asc" })}
          data-active={sorted === "asc"}
        >
          <ArrowUpAZ size={14} aria-hidden />
          Sort ascending
        </DropdownMenu.Item>

        <DropdownMenu.Item
          onSelect={() => onSort({ field, dir: "desc" })}
          data-active={sorted === "desc"}
        >
          <ArrowDownAZ size={14} aria-hidden />
          Sort descending
        </DropdownMenu.Item>

        {sorted !== null && (
          <>
            <DropdownMenu.Separator />
            <DropdownMenu.Item onSelect={() => onSort(null)}>
              <X size={14} aria-hidden />
              Clear sort
            </DropdownMenu.Item>
          </>
        )}
      </DropdownMenu.Content>
    </DropdownMenu.Root>
  );
}
