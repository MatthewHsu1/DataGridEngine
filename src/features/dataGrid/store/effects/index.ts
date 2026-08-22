import type { GridEffect, GridEffectContext } from "./types";
import type { StartListening } from "../../types";
import { columnsPersistenceEffect } from "./columnsPersistenceEffect";

/** All action-driven side-effects a grid runs. Add new effects here. */
export const gridEffects: GridEffect[] = [columnsPersistenceEffect];

/**
 * Register every gridEffect for one grid instance against the HOST app's
 * listener middleware. Keeps the effect-wiring concern owned by effects/, the
 * way each slice owns its reducer/actions.
 *
 * The listener arrives from the caller rather than from a module import: this
 * package cannot reach the app's store, and an app that already runs one shared
 * listener should not gain a second one just because it mounted a grid.
 *
 * Returns a function that removes this instance's listeners again. The store
 * never needs it — grids live as long as the app — but it keeps tests that
 * build throwaway instances from leaking listeners into later tests.
 */
export function registerEffects<TRow, TGroup, TKey extends string | number>(
  ctx: GridEffectContext<TRow, TGroup, TKey>,
  startAppListening: StartListening,
): () => void {
  const unsubscribers: Array<() => void> = [];

  // GridEffect returns void so one effect may register several listeners; wrap
  // startListening to collect every unsubscribe it hands back.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const startListening = (options: any) => {
    const unsubscribe = startAppListening(options);
    unsubscribers.push(unsubscribe);
    return unsubscribe;
  };

  for (const effect of gridEffects) effect(ctx, startListening);

  return () => {
    for (const unsubscribe of unsubscribers) unsubscribe();
    unsubscribers.length = 0;
  };
}
