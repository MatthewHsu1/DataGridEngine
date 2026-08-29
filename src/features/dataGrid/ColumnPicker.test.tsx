import { configureStore } from "@reduxjs/toolkit";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { Provider } from "react-redux";
import { describe, expect, it } from "vitest";
import { ColumnPicker } from "./ColumnPicker";
import { createGridInstance } from "./store/createGridInstance";
import { createFakeRowServer } from "./testing/fakeRowServer";
import type { ColumnDef, GridDescriptor, GridSliceState } from "./types";

interface Row {
  id: number;
  name: string;
  region: number;
}

const DEFS: Record<string, ColumnDef> = {
  id: { field: "id", title: "ID", defaultWidth: 80, editable: false, type: "int" },
  name: { field: "name", title: "Name", defaultWidth: 200, editable: true, type: "text" },
  region: { field: "region", title: "Region", defaultWidth: 120, editable: false, type: "region" },
};

function harness({ grouped }: { grouped: boolean }) {
  const server = createFakeRowServer<Row, number, number>({
    rows: [{ id: 1, name: "Halden Freight", region: 1 }],
    rowKey: (r) => r.id,
  });

  const descriptor: GridDescriptor<Row, number, number> = {
    name: "picker",
    rowKey: (r: Row) => r.id,
    columns: { defs: DEFS, defaultOrder: ["id", "name", "region"] },
    grouping: grouped
      ? {
          field: "region",
          of: (r: Row) => r.region,
          order: (g: number) => g,
          label: (g: number) => `R${g}`,
        }
      : undefined,
    api: server.api,
  } as unknown as GridDescriptor<Row, number, number>;

  const instance = createGridInstance(descriptor);
  const store = configureStore({ reducer: { [instance.descriptor.name]: instance.reducer } });

  const wrap = (ui: ReactNode) => render(<Provider store={store}>{ui}</Provider>);

  const columns = () => (store.getState() as Record<string, GridSliceState<number>>).picker.columns;

  return { instance, store, wrap, columns };
}

async function open() {
  await userEvent.click(screen.getByRole("button", { name: /columns/i }));
}

describe("ColumnPicker", () => {
  it("says how many of the grid's columns are showing", () => {
    const h = harness({ grouped: false });
    h.wrap(<ColumnPicker instance={h.instance} />);

    expect(screen.getByRole("button", { name: /columns/i })).toHaveTextContent("3 / 3");
  });

  it("hides a column in the store when its box is cleared", async () => {
    const h = harness({ grouped: false });
    h.wrap(<ColumnPicker instance={h.instance} />);

    await open();
    await userEvent.click(screen.getByRole("checkbox", { name: /^name/i }));

    expect(h.columns().hidden).toEqual(["name"]);
  });

  it("counts down as columns are hidden", async () => {
    const h = harness({ grouped: false });
    h.wrap(<ColumnPicker instance={h.instance} />);

    await open();
    await userEvent.click(screen.getByRole("checkbox", { name: /^name/i }));

    expect(screen.getByRole("button", { name: /columns/i })).toHaveTextContent("2 / 3");
  });

  it("hides the grouped column like any other, since the banner names the group itself", async () => {
    const h = harness({ grouped: true });
    h.wrap(<ColumnPicker instance={h.instance} />);

    await open();

    const region = screen.getByRole("checkbox", { name: /region/i });

    expect(region).toBeEnabled();

    await userEvent.click(region);

    expect(h.columns().hidden).toEqual(["region"]);
  });

  it("puts every column back when reset", async () => {
    const h = harness({ grouped: false });
    h.wrap(<ColumnPicker instance={h.instance} />);

    await open();
    await userEvent.click(screen.getByRole("checkbox", { name: /^name/i }));
    await userEvent.click(screen.getByRole("button", { name: /reset/i }));

    expect(h.columns()).toEqual({ order: ["id", "name", "region"], widths: {}, hidden: [] });
  });
});
