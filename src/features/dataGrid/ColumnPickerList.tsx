export interface PickerColumn {
  field: string;
  title: string;

  /** The grid is not drawing this column. */
  hidden: boolean;

  /**
   * The column cannot be hidden. Set for the column the grid groups by: the
   * banner would otherwise name a group with no column anywhere to point at.
   */
  locked?: boolean;
}

/**
 * The body of the column picker: one checkbox per column, plus a reset.
 *
 * Show and hide only. Reordering is already a drag on the column itself, and a
 * second way to do one thing is a second set of edge cases — a drag here and a
 * drag there disagreeing about where a column went.
 *
 * Split out of the popover it lives in so it can be tested without one. A
 * popover needs `ResizeObserver`, which this project's jsdom does not carry;
 * every decision the picker makes lives here instead, where a plain render
 * reaches it.
 */
export function ColumnPickerList({
  columns,
  onToggle,
  onReset,
}: {
  columns: readonly PickerColumn[];
  onToggle: (field: string) => void;
  onReset: () => void;
}) {
  return (
    <div className="dg:flex dg:min-w-56 dg:flex-col">
      <div className="dg:flex dg:items-center dg:justify-between dg:gap-4 dg:px-2 dg:pb-1">
        <span className="dg:text-xs dg:font-bold dg:text-[var(--gray-12,#1c2024)]">Columns</span>

        <button
          type="button"
          onClick={onReset}
          className="dg:cursor-pointer dg:rounded dg:border-none dg:bg-transparent dg:px-2 dg:py-1 dg:text-xs dg:font-medium dg:text-[var(--accent-11,#5753c6)] dg:hover:bg-[var(--gray-a3,rgba(0,0,0,0.06))]"
        >
          Reset
        </button>
      </div>

      <div className="dg:flex dg:flex-col">
        {columns.map((c) => (
          <label
            key={c.field}
            className="dg:flex dg:cursor-pointer dg:items-center dg:gap-2 dg:rounded dg:px-2 dg:py-1.5 dg:hover:bg-[var(--gray-a3,rgba(0,0,0,0.06))]"
          >
            <input
              type="checkbox"
              checked={!c.hidden}
              disabled={c.locked === true}
              onChange={() => onToggle(c.field)}
            />

            <span className="dg:text-sm dg:text-[var(--gray-12,#1c2024)]">{c.title}</span>

            {c.locked === true && (
              <span className="dg:ml-auto dg:rounded-full dg:bg-[var(--gray-3,#f0f0f3)] dg:px-1.5 dg:text-[10px] dg:font-semibold dg:text-[var(--gray-11,#8b8d98)]">
                Grouped by
              </span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}
