import { configureStore } from "@reduxjs/toolkit";
import { appearanceReducer } from "@matthewhsu1/datagrid";
import { appListener } from "./listener";
import { GRID_NAME, testGrid } from "./grid/testGrid";

/**
 * The demo store, wired the way a host app wires one.
 *
 * `appearance` is the slice the grid theme reads by default. A grid's own
 * reducer mounts under its descriptor name — here, statically; a real app with
 * many grids would inject them lazily instead.
 *
 * serializableCheck is off because grid state is not serializable: row windows
 * hold arbitrary row objects and group keys are caller-defined.
 */
export const store = configureStore({
  reducer: {
    appearance: appearanceReducer,
    // The literal, not `testGrid.descriptor.name`: a computed key widens the
    // reducer map to a string index, which unions every slice's state together.
    [GRID_NAME]: testGrid.reducer,
  },
  middleware: (getDefault) =>
    getDefault({ serializableCheck: false }).concat(appListener.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
