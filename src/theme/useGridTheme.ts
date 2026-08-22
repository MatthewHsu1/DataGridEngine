import type { Theme } from "@glideapps/glide-data-grid";
import { useEffect } from "react";
import { useSelector } from "react-redux";
import { invalidateBadgeColorCache } from "../lib/grid/softBadge";
import { themeForAppearance } from "./gridThemes";
import { selectGridAppearance } from "./radixTheme";

/**
 * Current grid theme, driven by the host app's appearance signal (see
 * `configureGridTheme`). Grids pass the result straight to
 * <DataEditor theme={...} />.
 *
 * `useSelector` is untyped here because the state shape belongs to the host,
 * not to this package; `selectGridAppearance` is the seam that knows where to
 * look.
 *
 * Badge colors are read from CSS vars and cached; the cache is dropped whenever
 * appearance changes so canvas pills re-resolve for the new light/dark theme.
 */
export function useGridTheme(): Partial<Theme> {
  const appearance = useSelector(selectGridAppearance);

  useEffect(() => {
    invalidateBadgeColorCache();
  }, [appearance]);

  return themeForAppearance(appearance);
}
