import { setAppearance } from "@matthewhsu1/datagrid";
import { store } from "./store";

/** The demo's Radix accent. `theme.tsx` and `main.tsx` must agree on it. */
export const DEMO_ACCENT = "iris";

/**
 * Follows the OS colour scheme and pushes it into the `appearance` slice.
 *
 * This watcher is the one piece a host app always owns: what drives light/dark
 * differs per host (an OS query here, a host-page class elsewhere), so the
 * engine ships the slice and reads it, but never decides what writes it.
 */
export function startColorSchemeWatcher(): () => void {
  const query = window.matchMedia("(prefers-color-scheme: dark)");

  const apply = (dark: boolean) => store.dispatch(setAppearance(dark ? "dark" : "light"));

  apply(query.matches);

  const onChange = (e: MediaQueryListEvent) => apply(e.matches);

  query.addEventListener("change", onChange);

  return () => query.removeEventListener("change", onChange);
}
