// src/features/dataGrid/hooks/useColumnSortMenu.test.tsx
import { Theme } from "@radix-ui/themes";
import { configureStore } from "@reduxjs/toolkit";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { createGridInstance } from "../store/createGridInstance";
import type { GridDescriptor, GridSliceState } from "../types";
import { useColumnSortMenu } from "./useColumnSortMenu";

interface Row {
  id: number;
  name: string;
}

const FIELDS = ["id", "name"];

const BOUNDS = { x: 40, y: 4, width: 16, height: 32 };

function harness() {
  const descriptor = {
    name: "demo",
    rowKey: (r: Row) => r.id,
    columns: {
      defs: {
        id: {
          field: "id",
          title: "Id",
          defaultWidth: 80,
          editable: false,
          type: "number",
          sortable: false,
        },
        name: { field: "name", title: "Name", defaultWidth: 120, editable: true, type: "text" },
      },
      defaultOrder: FIELDS,
    },
    api: { updateRow: async () => ({ ok: true }) },
    cells: { makeCell: () => ({}) as never, customRenderers: [], validateCell: () => true },
  } as unknown as GridDescriptor<Row, never, number>;

  const instance = createGridInstance(descriptor);
  const store = configureStore({
    reducer: { demo: instance.reducer },
    middleware: (getDefault) => getDefault({ serializableCheck: false }),
  });

  function Probe() {
    const { onHeaderMenuClick, menu } = useColumnSortMenu(instance, FIELDS);

    return (
      <>
        {FIELDS.map((f, i) => (
          <button key={f} type="button" onClick={() => onHeaderMenuClick(i, BOUNDS)}>
            arrow {f}
          </button>
        ))}
        {menu}
      </>
    );
  }

  render(
    <Provider store={store}>
      <Theme>
        <Probe />
      </Theme>
    </Provider>,
  );

  const sort = () => (store.getState() as Record<string, GridSliceState<number>>).demo.groups.sort;

  return { store, sort };
}

const openArrow = (field: string) =>
  userEvent.click(screen.getByRole("button", { name: `arrow ${field}` }));

const pick = async (name: RegExp) =>
  userEvent.click(await screen.findByRole("menuitem", { name }));

describe("useColumnSortMenu", () => {
  it("opens the menu on the column whose arrow was pressed", async () => {
    harness();

    await openArrow("name");

    expect(await screen.findByRole("menu")).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /sort ascending/i })).toBeInTheDocument();
  });

  it("opens nothing on a column the server cannot order by", async () => {
    harness();

    await openArrow("id");

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("stores the order the user picked", async () => {
    const h = harness();

    await openArrow("name");
    await pick(/sort descending/i);

    expect(h.sort()).toEqual({ field: "name", dir: "desc" });
  });

  it("shuts the menu once an order is picked", async () => {
    harness();

    await openArrow("name");
    await pick(/sort ascending/i);

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("does not reload the grid when the order already in force is picked again", async () => {
    const h = harness();

    await openArrow("name");
    await pick(/sort ascending/i);
    const first = h.sort();

    await openArrow("name");
    await pick(/sort ascending/i);

    expect(h.sort()).toBe(first);
  });

  it("clears the sort", async () => {
    const h = harness();

    await openArrow("name");
    await pick(/sort ascending/i);

    await openArrow("name");
    await pick(/clear sort/i);

    expect(h.sort()).toBeNull();
  });
});
