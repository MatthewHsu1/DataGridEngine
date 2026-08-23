import { forwardRef, useCallback, useImperativeHandle, useRef, type ReactNode } from "react";
import type { VisibleHeader } from "./displayModel";
import { GroupHeaderRow } from "./GroupHeaderRow";

/** Where the canvas put one header's hole, in pixels inside the layer. */
export interface HeaderPlacement {
  top: number;
  height: number;
}

export interface GroupHeaderLayerHandle {
  /**
   * Move every header onto its hole. Keyed by display row.
   *
   * A header with no entry is hidden rather than left where it was: it means
   * the canvas no longer draws that hole.
   */
  place: (placements: ReadonlyMap<number, HeaderPlacement>) => void;
}

export interface GroupHeaderLayerProps<TGroup> {
  /** The headers the viewport can see, from `headersInDisplayRange`. */
  headers: readonly VisibleHeader<TGroup>[];

  label: (group: TGroup) => string;

  /** Resolved CSS colour for each group's name. */
  textColor?: (group: TGroup) => string | undefined;

  /** The host's components for a group. */
  slot?: (group: TGroup) => ReactNode;

  /** Resolved CSS fill for a header row. See `GroupHeaderRow.background`. */
  background?: string;

  /** Width of the row marker the canvas draws under every header. */
  markerWidth?: number;

  /** Room to leave at the right edge, for the grid's vertical scrollbar. */
  gutterRight?: number;

  onToggle: (group: TGroup) => void;
}

/**
 * The group headers, in React, floating over the canvas.
 *
 * Two owners, deliberately split. React owns WHICH headers exist — a set that
 * changes only when the viewport crosses a group boundary, a few times a
 * scroll. The DOM owns WHERE they are, through `place`, which runs on every
 * visible-region change glide reports.
 *
 * Routing the positions through React state instead would re-render the whole
 * layer on every scroll frame, and the headers would trail the rows they name
 * by a frame each time. This is the same bargain `useRepaintRows` strikes for
 * changed rows: React for what exists, direct writes for what moves.
 *
 * The layer takes no pointer events; each header takes them back. A header
 * covers only the hole the canvas reserved for it, but the layer spans the
 * whole grid, and a layer that swallowed clicks would make every row under it
 * unselectable.
 */
function GroupHeaderLayerInner<TGroup>(
  {
    headers,
    label,
    textColor,
    slot,
    background,
    markerWidth,
    gutterRight,
    onToggle,
  }: GroupHeaderLayerProps<TGroup>,
  ref: React.ForwardedRef<GroupHeaderLayerHandle>,
) {
  const nodes = useRef(new Map<number, HTMLDivElement>());

  const place = useCallback((placements: ReadonlyMap<number, HeaderPlacement>) => {
    for (const [displayRow, node] of nodes.current) {
      const at = placements.get(displayRow);

      if (at === undefined) {
        node.style.visibility = "hidden";
        continue;
      }

      node.style.visibility = "visible";
      node.style.transform = `translateY(${at.top}px)`;
      node.style.height = `${at.height}px`;
    }
  }, []);

  useImperativeHandle(ref, () => ({ place }), [place]);

  return (
    <div className="dg:pointer-events-none dg:absolute dg:inset-0 dg:overflow-hidden">
      {headers.map((h) => (
        <div
          key={h.displayRow}
          data-dg-group-header
          ref={(node) => {
            if (node === null) {
              nodes.current.delete(h.displayRow);
              return;
            }

            nodes.current.set(h.displayRow, node);
          }}
          // Hidden until the first `place`. React commits a new header before
          // the placement arrives, and a header drawn at zero in between would
          // pile up over the grid's first row.
          style={{ visibility: "hidden" }}
          className="dg:pointer-events-auto dg:absolute dg:top-0 dg:right-0 dg:left-0"
        >
          <GroupHeaderRow
            label={label(h.group)}
            textColor={textColor?.(h.group)}
            background={background}
            markerWidth={markerWidth}
            gutterRight={gutterRight}
            collapsed={h.collapsed}
            onToggle={() => onToggle(h.group)}
          >
            {slot?.(h.group)}
          </GroupHeaderRow>
        </div>
      ))}
    </div>
  );
}

export const GroupHeaderLayer = forwardRef(GroupHeaderLayerInner) as <TGroup>(
  props: GroupHeaderLayerProps<TGroup> & { ref?: React.ForwardedRef<GroupHeaderLayerHandle> },
) => ReturnType<typeof GroupHeaderLayerInner>;
