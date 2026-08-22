/**
 * The package's whole public surface.
 *
 * `package.json` exposes only `.`, `./testing`, `./radix-styles`, and the
 * stylesheet, so nothing below this file is reachable from a consuming app.
 * That is deliberate: everything NOT re-exported here — the row store, the
 * display model, the slices, every hook but the ones named below — is free to
 * be renamed, moved, or rewritten in a patch release.
 *
 * Add an export here only when a consuming app genuinely cannot do its job
 * without it. Every symbol added is a promise.
 */

// ------------------------------------------------------------- the grid --

export { DataGrid } from "./features/dataGrid/DataGrid";
export { createGridInstance } from "./features/dataGrid/store/createGridInstance";
export { localStorageColumnsAdapter } from "./features/dataGrid/store/localStorageColumnsAdapter";

// -------------------------------------------------- describing one grid --

export type {
  ColumnDef,
  EditError,
  EditState,
  FetchRowsParams,
  GridDescriptor,
  GridGrouping,
  GridInstance,
  GridInstanceOptions,
  GridSliceState,
  GridSort,
  RowChange,
  StartListening,
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

export {
  createCellRegistry,
  type CellContext,
  type CellRegistry,
  type CellTypeDef,
} from "./lib/grid/cellRegistry";

export { createTextCell, type TextCell, type TextCellData } from "./lib/grid/createTextCell";
export {
  createNumberCell,
  type NumberCell,
  type NumberCellData,
} from "./lib/grid/createNumberCell";
export { createDateCell, type DateCell, type DateCellData } from "./lib/grid/createDateCell";
export {
  createEnumCell,
  type EnumCell,
  type EnumCellData,
  type EnumOption,
} from "./lib/grid/createEnumCell";
export { createPhoneCell, type PhoneCell, type PhoneCellData } from "./lib/grid/createPhoneCell";

/** For a cell kind this package does not ship. */
export {
  createCustomCell,
  drawEmptyDash,
  makeCustomCell,
  type CellDrawArgs,
  type CustomCellConfig,
  type EditorProps,
} from "./lib/grid/createCustomCell";

export { drawSoftBadge, type ResolvedBadgeColors } from "./lib/grid/softBadge";
export { BADGE_SEQUENCE, radixColorByIndex, type RadixColor } from "./lib/grid/radixBadgePalette";

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
