import type { ClassNames } from "react-day-picker";

/**
 * The shadcn calendar's shape, painted in Radix tokens.
 *
 * We do NOT import `react-day-picker/style.css`. That sheet is the library's own
 * look, and layering our classes on top of it would leave which rule wins up to
 * stylesheet order. Every slot below is the whole look for that slot instead.
 *
 * Two consequences of the package's own rules are load-bearing here:
 *
 * 1. NO PREFLIGHT. `datagrid.src.css` omits Tailwind's reset on purpose, so a
 *    bare `<button>` keeps the browser's default border and background. Nothing
 *    else strips them once the library's sheet is gone, which is why every
 *    button slot below says `border-0` and `bg-transparent` out loud.
 *
 * 2. Colours are Radix tokens with a literal fallback, for the reason
 *    `components/ui/input.tsx` gives: a cell editor portals out of the host's
 *    tree, and a var with nothing above it would resolve to nothing.
 */

/** Every button slot starts here — see note 1 above. */
const BUTTON_RESET =
  "dg:cursor-pointer dg:appearance-none dg:border-0 dg:bg-transparent dg:p-0 " +
  "dg:[font-family:inherit] dg:focus-visible:outline-none";

const NAV_BUTTON =
  `${BUTTON_RESET} ` +
  "dg:inline-flex dg:size-7 dg:items-center dg:justify-center dg:rounded-md " +
  "dg:text-[var(--gray-11,#60646c)] dg:transition-colors " +
  "dg:hover:bg-[var(--gray-3,#f0f0f3)] dg:hover:text-[var(--gray-12,#18181b)] " +
  "dg:disabled:opacity-30";

const DAY_BUTTON =
  `${BUTTON_RESET} ` +
  "dg:flex dg:size-8 dg:items-center dg:justify-center dg:rounded-md " +
  "dg:text-sm dg:font-normal dg:transition-colors " +
  "dg:hover:bg-[var(--gray-4,#e8e8ec)] " +
  "dg:focus-visible:ring-2 dg:focus-visible:ring-[var(--accent-8,#8da4ef)]";

/** Solid accent fill, used for a single selection and for both range ends. */
const FILLED =
  "dg:[&>button]:bg-[var(--accent-9,#3e63dd)] " +
  "dg:[&>button]:text-[var(--accent-contrast,#fff)] " +
  "dg:[&>button]:hover:bg-[var(--accent-10,#3358d4)]";

/**
 * Shared by both modes. Deliberately holds NO selection styling: the two modes
 * paint selection through different slots, and merging them here would put two
 * background rules on one cell.
 */
const BASE: Partial<ClassNames> = {
  root: "dg:w-fit",

  /*
   * `relative` belongs HERE and not on `month`. With the default nav layout
   * react-day-picker renders `Nav` as a SIBLING of the months, inside this
   * element — so this is the box the absolutely positioned nav resolves
   * against. On `month` the arrows escape to the nearest positioned ancestor,
   * which is the popover, and land in its far corners.
   */
  months: "dg:relative dg:flex dg:w-fit dg:flex-col dg:gap-4 dg:sm:flex-row",
  month: "dg:flex dg:flex-col dg:gap-2",

  month_caption: "dg:flex dg:h-7 dg:items-center dg:justify-center dg:px-8",
  caption_label:
    "dg:flex dg:items-center dg:gap-0.5 dg:text-sm dg:font-medium " +
    "dg:text-[var(--gray-12,#18181b)]",

  nav: "dg:absolute dg:inset-x-0 dg:top-0 dg:flex dg:items-center dg:justify-between",
  button_previous: NAV_BUTTON,
  button_next: NAV_BUTTON,
  chevron: "dg:size-4 dg:shrink-0",

  dropdowns: "dg:flex dg:items-center dg:gap-1",
  dropdown_root:
    "dg:relative dg:rounded-md dg:px-1.5 dg:py-0.5 " + "dg:hover:bg-[var(--gray-3,#f0f0f3)]",
  dropdown: "dg:absolute dg:inset-0 dg:cursor-pointer dg:opacity-0",

  month_grid: "dg:border-collapse",
  weekdays: "dg:flex",
  weekday:
    "dg:flex dg:size-8 dg:items-center dg:justify-center dg:text-[0.75rem] " +
    "dg:font-normal dg:text-[var(--gray-10,#8b8d98)] dg:select-none",
  week: "dg:flex dg:w-full",
  day: "dg:size-8 dg:p-0 dg:text-center dg:text-[var(--gray-12,#18181b)]",
  day_button: DAY_BUTTON,

  // Property-disjoint from selection: a ring, never a fill or a colour.
  today: "dg:[&>button]:ring-1 dg:[&>button]:ring-inset dg:[&>button]:ring-[var(--gray-8,#c7cbd1)]",
  outside: "dg:[&>button]:text-[var(--gray-8,#c7cbd1)]",
  disabled: "dg:opacity-30",
  hidden: "dg:invisible",
};

/**
 * The slot map for one mode.
 *
 * `range` is passed separately rather than merged in, because react-day-picker
 * marks EVERY day of a range as `selected` as well as `range_middle`. Styling
 * both would put two competing backgrounds on the middle days; returning one
 * map or the other keeps them mutually exclusive by construction.
 */
export function dayPickerClassNames(isRange: boolean): Partial<ClassNames> {
  if (!isRange) {
    return { ...BASE, selected: FILLED };
  }

  return {
    ...BASE,
    range_start: `dg:rounded-l-md dg:bg-[var(--accent-3,#edf2fe)] ${FILLED}`,
    range_end: `dg:rounded-r-md dg:bg-[var(--accent-3,#edf2fe)] ${FILLED}`,
    range_middle:
      "dg:bg-[var(--accent-3,#edf2fe)] dg:[&>button]:text-[var(--accent-11,#3a5ccc)] " +
      "dg:[&>button]:hover:bg-[var(--accent-4,#e1e9ff)]",
  };
}
