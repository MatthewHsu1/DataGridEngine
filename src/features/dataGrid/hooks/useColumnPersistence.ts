// src/features/dataGrid/hooks/useColumnPersistence.ts
import { useEffect, useRef, useState } from "react";
import { useSelector } from "react-redux";
import type { ColumnsAdapter, ColumnsState, GridInstance } from "../types";
import { useGridDispatch } from "../useGridDispatch";

/**
 * How long the layout must sit still before it is written.
 *
 * A column drag fires a resize per frame. Without this, a custom adapter
 * backed by a server call would send one request per pixel.
 */
const SAVE_DEBOUNCE_MS = 500;

/**
 * Restores the user's column layout on mount, then writes it back whenever they
 * change it.
 *
 * This runs in the COMPONENT rather than on the host's listener middleware,
 * which is what lets `createGridInstance` take a descriptor and nothing else. A
 * grid instance is built at module scope and has no store to subscribe to;
 * a mounted grid has one through React-Redux's context, and it is also the only
 * thing that knows the grid is on screen at all.
 *
 * A null adapter means the grid persists nothing (`columns.persist: false`), and
 * every branch below then no-ops rather than being skipped by the caller.
 */
export function useColumnPersistence<TRow extends object, TGroup, TKey extends string | number>(
  instance: GridInstance<TRow, TGroup, TKey>,
  adapter: ColumnsAdapter | null,
): void {
  const dispatch = useGridDispatch();

  const columns = useSelector((s: unknown) => instance.selectRoot(s).columns);

  /**
   * The layout as it currently stands in storage, as far as this mount knows.
   *
   * Seeded from the load so the hydrate itself does not bounce straight back
   * out as a save — which for a server-backed adapter would be a write on every
   * single mount, of the bytes it had just read.
   */
  const lastWritten = useRef<string | null>(null);

  /**
   * Whether the load has answered. Nothing may be written before it does: a
   * save that overtook the load would persist the DEFAULT layout over the
   * user's saved one, and the load would then restore what the save had just
   * destroyed.
   *
   * STATE, not a ref. A user who drags a column before the load lands changes
   * the layout once and never again, so a ref would skip that save and no later
   * render would come back for it. As state it re-runs the save effect the
   * moment hydration finishes, and the waiting change is written then.
   */
  const [hydrated, setHydrated] = useState(false);

  const adapterRef = useRef(adapter);
  adapterRef.current = adapter;

  useEffect(() => {
    const current = adapterRef.current;

    if (current === null) {
      setHydrated(true);
      return;
    }

    let cancelled = false;

    void (async () => {
      const loaded = await current.loadColumns();

      if (cancelled) return;

      if (loaded) {
        lastWritten.current = JSON.stringify(loaded);
        dispatch(instance.actions.setColumns(loaded as unknown as ColumnsState));
      }

      setHydrated(true);
    })();

    return () => {
      cancelled = true;
    };
  }, [dispatch, instance]);

  useEffect(() => {
    if (!hydrated) return;

    const current = adapterRef.current;

    if (current === null) return;

    const next = JSON.stringify(columns);

    if (next === lastWritten.current) return;

    const timer = setTimeout(() => {
      lastWritten.current = next;
      void current.saveColumns(columns);
    }, SAVE_DEBOUNCE_MS);

    return () => clearTimeout(timer);
  }, [columns, hydrated]);
}
