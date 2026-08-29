/**
 * The package's whole public surface.
 *
 * `package.json` exposes only `.`, `./testing`, `./radix-styles`, and the
 * stylesheet, so nothing below this file is reachable from a consuming app.
 * That is deliberate: everything NOT re-exported here — the row store, the
 * display model, the slices, the cell registry, every hook but the ones named
 * below — is free to be renamed, moved, or rewritten in a patch release.
 *
 * Add an export here only when a consuming app genuinely cannot do its job
 * without it. Every symbol added is a promise.
 */

// ------------------------------------------------------------- the grid --

export {
  DataGrid,
  type DataGridProps,
  type GridDrawHeader,
  type GridDrawHeaderArgs,
} from "./features/dataGrid/DataGrid";

export { createGridInstance } from "./features/dataGrid/store/createGridInstance";

// -------------------------------------------------- describing one grid --

export type {
  ColumnDef,
  ColumnsAdapter,
  ColumnsState,
  EditError,
  EditState,
  FetchRowsParams,
  GridDescriptor,
  GridGrouping,
  GridInstance,
  GridSliceState,
  GridSort,
  GroupsState,
  RowChange,
  SelectionState,
  UpdateRowParams,
} from "./features/dataGrid/types";

// -------------------------------------------------------------- sorting --

export { compareBySpec, specFromGridSort, type SortSpec } from "./features/dataGrid/data/sortSpec";

/**
 * The TanStack Query key prefix every row page of one grid shares. A host that
 * pushes row changes in from outside the grid invalidates against this.
 */
export { rowsKeyPrefix } from "./features/dataGrid/hooks/useRowPages";

// ---------------------------------------------------------------- cells --

/**
 * A column names its cell by `type`, the way glide does.
 *
 * The five this package draws are prefixed `dg:` — `dg:text`, `dg:number`,
 * `dg:date`, `dg:enum`, `dg:phone` — and each takes its settings on the
 * column's own `options`. Glide's kinds are reachable under glide's own names,
 * unprefixed: `text`, `number`, `boolean`, `uri`, `markdown`, `image`,
 * `bubble`, `drilldown`.
 *
 * Nothing has to be registered for any of them. The options types below are
 * exported because a host writes them into a `ColumnDef`, not because a host
 * ever builds a cell.
 */
export type { TextCellOptions } from "./lib/grid/textCell";
export type { NumberCellOptions } from "./lib/grid/numberCell";
export type { DateCellOptions } from "./lib/grid/dateCell";
export type { EnumCellOptions, EnumOption } from "./lib/grid/enumChoices";
export type { PhoneCellOptions } from "./lib/grid/phoneCell";

export type { NumberFormat } from "./lib/number/numberUtils";
export type { TextValidationOptions } from "./lib/text/textValidation";

/** For a cell kind this package does not ship. Register it on `descriptor.cells`. */
export {
  createCustomCell,
  drawEmptyDash,
  makeCustomCell,
  type CellDrawArgs,
  type CustomCellConfig,
  type EditorProps,
} from "./lib/grid/createCustomCell";

export type { CellContext, CellTypeDef } from "./lib/grid/cellRegistry";

export { drawSoftBadge, type ResolvedBadgeColors } from "./lib/grid/softBadge";
export { BADGE_SEQUENCE, radixColorByIndex, type RadixColor } from "./lib/grid/radixBadgePalette";

// ------------------------------------------------------------ date picker --

/**
 * The date picker the date cell edits through, exported for the host's own
 * DOM: filters, toolbars, forms. `DatePicker` renders inline (a grid overlay
 * already floats it); `DatePickerPopover` adds a trigger for ordinary DOM.
 */
export {
  DatePicker,
  type DatePickerMode,
  type DatePickerProps,
  type DateRange,
} from "./components/ui/datePicker";

export { DatePickerPopover, type DatePickerPopoverProps } from "./components/ui/datePickerPopover";

// ---------------------------------------------------------------- theme --

export {
  configureGridTheme,
  DEFAULT_GRID_RADIX_THEME,
  type GridRadixTheme,
  type GridThemeConfig,
  type SelectAppearance,
} from "./theme/radixTheme";

export { useGridTheme } from "./theme/useGridTheme";
export { darkGridTheme, lightGridTheme, themeForAppearance } from "./theme/gridThemes";

/**
 * The light/dark slice the grid reads by default. Mount it at the `appearance`
 * key, or point `configureGridTheme({ selectAppearance })` at wherever the host
 * keeps its own.
 */
export {
  default as appearanceReducer,
  setAppearance,
  type Appearance,
  type AppearanceState,
} from "./theme/appearanceSlice";
