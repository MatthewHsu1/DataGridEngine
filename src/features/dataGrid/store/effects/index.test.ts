import { configureStore, createListenerMiddleware, type Reducer } from "@reduxjs/toolkit";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGridInstance } from "../createGridInstance";
import type { GridDescriptor, GridSliceState } from "../../types";

// Stands in for the host app's listener middleware. The engine ships none of
// its own, so every test that exercises an effect has to supply one — exactly
// as a consuming app does.
const appListener = createListenerMiddleware();

interface Row {
  id: number;
}

function makeDescriptor(name: string, saveColumns: (columns: unknown) => Promise<void>) {
  return {
    name,
    rowKey: (r: Row) => r.id,
    columns: {
      defs: { id: { field: "id", title: "Id", defaultWidth: 80, editable: false, type: "number" } },
      defaultOrder: ["id"],
    },
    api: {
      updateRow: async () => ({ ok: true }),
      saveColumns,
    },
    cells: { makeCell: () => ({}) as never, customRenderers: [], validateCell: () => true },
  } as unknown as GridDescriptor<Row, number>;
}

function makeStore(name: string, reducer: Reducer<GridSliceState<number, number>>) {
  return configureStore({
    reducer: { [name]: reducer },
    middleware: (getDefault) =>
      getDefault({ serializableCheck: false }).concat(appListener.middleware),
  });
}

describe("grid effects on the host app's listener", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("runs a grid's effects through the app listener, with no per-grid middleware", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const inst = createGridInstance(makeDescriptor("sharedDemo", save), {
      startListening: appListener.startListening,
    });
    const store = makeStore("sharedDemo", inst.reducer);

    store.dispatch(inst.actions.resizeColumn({ field: "id", width: 200 }));
    await vi.advanceTimersByTimeAsync(600);

    expect(save).toHaveBeenCalledWith(expect.objectContaining({ widths: { id: 200 } }));

    inst.stopEffects();
  });

  it("stopEffects removes the grid's listeners from the app listener", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const inst = createGridInstance(makeDescriptor("stoppedDemo", save), {
      startListening: appListener.startListening,
    });
    const store = makeStore("stoppedDemo", inst.reducer);

    inst.stopEffects();
    store.dispatch(inst.actions.resizeColumn({ field: "id", width: 200 }));
    await vi.advanceTimersByTimeAsync(600);

    expect(save).not.toHaveBeenCalled();
  });

  it("refuses to build a persisting grid without a listener, instead of never saving", () => {
    const save = vi.fn().mockResolvedValue(undefined);

    expect(() => createGridInstance(makeDescriptor("unwiredDemo", save))).toThrow(
      /needs the host app's listener middleware/,
    );
  });

  it("builds a grid that persists nothing without needing a listener at all", () => {
    const descriptor = makeDescriptor("readOnlyDemo", undefined as never);
    delete (descriptor as { api: { saveColumns?: unknown } }).api.saveColumns;

    const inst = createGridInstance(descriptor);

    expect(typeof inst.stopEffects).toBe("function");
    inst.stopEffects();
  });

  it("persists a reset, so a layout the user threw away does not come back on reload", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const inst = createGridInstance(makeDescriptor("resetDemo", save), {
      startListening: appListener.startListening,
    });
    const store = makeStore("resetDemo", inst.reducer);

    store.dispatch(inst.actions.resizeColumn({ field: "id", width: 200 }));
    await vi.advanceTimersByTimeAsync(600);
    save.mockClear();

    store.dispatch(inst.actions.resetColumns());
    await vi.advanceTimersByTimeAsync(600);

    expect(save).toHaveBeenCalledWith({ order: ["id"], widths: {}, hidden: [] });

    inst.stopEffects();
  });
});
