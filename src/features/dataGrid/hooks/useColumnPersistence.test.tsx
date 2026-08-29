import { configureStore } from "@reduxjs/toolkit";
import { renderHook, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createGridInstance } from "../store/createGridInstance";
import type { ColumnsAdapter, ColumnsState, GridDescriptor } from "../types";
import { useColumnPersistence } from "./useColumnPersistence";

interface Row {
  id: number;
}

const SAVE_DEBOUNCE_MS = 500;

function descriptorFor(
  name: string,
  columns: Partial<GridDescriptor<Row, number>["columns"]> = {},
): GridDescriptor<Row, number> {
  return {
    name,
    rowKey: (r) => r.id,
    columns: {
      defs: {
        id: { field: "id", title: "Id", defaultWidth: 80, editable: false, type: "dg:number" },
        name: { field: "name", title: "Name", defaultWidth: 120, editable: true, type: "dg:text" },
      },
      defaultOrder: ["id", "name"],
      ...columns,
    },
    api: {
      fetchRows: async () => [],
      fetchCount: async () => 0,
      fetchRow: async () => null,
      updateRow: async () => ({ ok: true }),
    },
  };
}

function mount(descriptor: GridDescriptor<Row, number>) {
  const instance = createGridInstance(descriptor);
  const store = configureStore({
    reducer: { [descriptor.name]: instance.reducer },
    middleware: (getDefault) => getDefault({ serializableCheck: false }),
  });

  const wrapper = ({ children }: { children: ReactNode }) => (
    <Provider store={store}>{children}</Provider>
  );

  const view = renderHook(() => useColumnPersistence(instance, instance.columnsAdapter), {
    wrapper,
  });

  const columns = () =>
    (store.getState() as Record<string, { columns: ColumnsState }>)[descriptor.name].columns;

  return { instance, store, view, columns };
}

function fakeAdapter(stored: ColumnsState | null = null) {
  const saveColumns = vi.fn(async () => {});
  const loadColumns = vi.fn(async () => stored);

  return {
    adapter: { loadColumns, saveColumns } satisfies ColumnsAdapter,
    loadColumns,
    saveColumns,
  };
}

describe("useColumnPersistence", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("restores a saved layout on mount", async () => {
    const { adapter } = fakeAdapter({ order: ["name", "id"], widths: { id: 200 }, hidden: ["id"] });
    const { columns } = mount(descriptorFor("restores", { adapter }));

    await waitFor(() => expect(columns().order).toEqual(["name", "id"]));
    expect(columns().widths).toEqual({ id: 200 });
    expect(columns().hidden).toEqual(["id"]);
  });

  it("writes the layout back when the user changes it", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const { adapter, saveColumns } = fakeAdapter();
    const { instance, store } = mount(descriptorFor("writesBack", { adapter }));

    await vi.waitFor(() => expect(adapter.loadColumns).toHaveBeenCalled());

    store.dispatch(instance.actions.resizeColumn({ field: "id", width: 321 }));
    await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS + 50);

    expect(saveColumns).toHaveBeenCalledWith(expect.objectContaining({ widths: { id: 321 } }));
  });

  it("does not bounce the layout it just loaded straight back out", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const stored = { order: ["name", "id"], widths: {}, hidden: [] };
    const { adapter, saveColumns } = fakeAdapter(stored);

    mount(descriptorFor("noEcho", { adapter }));

    await vi.waitFor(() => expect(adapter.loadColumns).toHaveBeenCalled());
    await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS + 50);

    expect(saveColumns).not.toHaveBeenCalled();
  });

  it("waits for the load before writing, so a save cannot overtake it", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    let release: (v: ColumnsState | null) => void = () => {};
    const saveColumns = vi.fn(async () => {});
    const adapter: ColumnsAdapter = {
      loadColumns: () => new Promise((r) => (release = r)),
      saveColumns,
    };

    const { instance, store } = mount(descriptorFor("ordered", { adapter }));

    store.dispatch(instance.actions.resizeColumn({ field: "id", width: 50 }));
    await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS + 50);

    expect(saveColumns).not.toHaveBeenCalled();

    release(null);
  });

  it("persists to Web Storage with no wiring at all", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const { instance, store } = mount(descriptorFor("byDefault"));

    store.dispatch(instance.actions.resizeColumn({ field: "id", width: 210 }));

    await vi.waitFor(async () => {
      await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS + 50);
      expect(localStorage.getItem("datagrid:byDefault:columns")).not.toBeNull();
    });

    const raw = localStorage.getItem("datagrid:byDefault:columns");
    expect(JSON.parse(raw!).widths).toEqual({ id: 210 });
  });

  it("writes nothing when the descriptor opts out", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const { instance, store } = mount(descriptorFor("optedOut", { persist: false }));

    store.dispatch(instance.actions.resizeColumn({ field: "id", width: 210 }));
    await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS + 50);
    await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS + 50);

    expect(localStorage.getItem("datagrid:optedOut:columns")).toBeNull();
  });

  it("debounces a drag into one write, not one per pixel", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const { adapter, saveColumns } = fakeAdapter();
    const { instance, store } = mount(descriptorFor("debounced", { adapter }));

    await vi.waitFor(() => expect(adapter.loadColumns).toHaveBeenCalled());

    for (const width of [100, 120, 140, 160]) {
      store.dispatch(instance.actions.resizeColumn({ field: "id", width }));
      await vi.advanceTimersByTimeAsync(50);
    }

    await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS + 50);

    expect(saveColumns).toHaveBeenCalledTimes(1);
    expect(saveColumns).toHaveBeenCalledWith(expect.objectContaining({ widths: { id: 160 } }));
  });
});
