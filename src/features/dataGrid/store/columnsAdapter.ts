import type { ColumnsAdapter, ColumnsState } from "../types";

/**
 * Where a grid's layout is kept when the descriptor names nowhere else.
 *
 * `descriptor.name` is already documented as stable and unique — it is the
 * grid's Redux mount point — so it is the one string that can key the storage
 * without the host having to invent a second one.
 */
export function defaultColumnsStorageKey(name: string): string {
  return `datagrid:${name}:columns`;
}

/**
 * Builds a `ColumnsAdapter` backed by Web Storage. This is the home of
 * localStorage knowledge — the slice, the persistence hook, and the engine
 * never touch it directly.
 *
 * It is the engine's default rather than something a host wires up: a column
 * layout the user rearranged and then lost on reload is a bug in every app, so
 * remembering it is the behaviour a grid should have before anyone asks.
 * `descriptor.columns.adapter` replaces it; `persist: false` turns it off.
 *
 * Both calls are async to match `ColumnsAdapter`, though Web Storage is not:
 * one shape means the save path has one thing to await.
 */
export function localStorageColumnsAdapter(
  storageKey: string,
  storage: Pick<Storage, "getItem" | "setItem"> | undefined = globalThis.localStorage,
): ColumnsAdapter {
  return {
    async loadColumns() {
      try {
        const raw = storage?.getItem(storageKey);
        if (!raw) return null;
        const parsed = JSON.parse(raw) as Partial<ColumnsState>;
        // Only hydrate fields that are present & well-formed; missing → caller keeps defaults.
        if (!parsed || typeof parsed !== "object") return null;
        return {
          order: Array.isArray(parsed.order) && parsed.order.length ? parsed.order : [],
          widths: parsed.widths ?? {},
          hidden: parsed.hidden ?? [],
        };
      } catch {
        return null;
      }
    },
    async saveColumns(state) {
      try {
        storage?.setItem(storageKey, JSON.stringify(state));
      } catch {
        /* ignore quota/unavailable */
      }
    },
  };
}

/**
 * The adapter one grid actually runs on, or null when it persists nothing.
 *
 * Reading the descriptor in ONE place is what keeps "on by default" honest:
 * every caller — the load on mount and the save after a change — asks here, so
 * neither can end up persisting to somewhere the other does not.
 *
 * A `storage` of undefined (server-side rendering, a browser with site data
 * blocked) yields an adapter that quietly loads nothing and saves nothing,
 * rather than throwing on a grid that only wanted to draw.
 */
export function resolveColumnsAdapter(
  name: string,
  columns: { persist?: boolean; adapter?: ColumnsAdapter },
): ColumnsAdapter | null {
  if (columns.persist === false) {
    return null;
  }

  return columns.adapter ?? localStorageColumnsAdapter(defaultColumnsStorageKey(name));
}
