import { Theme } from "@radix-ui/themes";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ColumnHeaderMenu, type ColumnMenuTarget } from "./ColumnHeaderMenu";

const TARGET: ColumnMenuTarget = {
  field: "name",
  bounds: { x: 120, y: 8, width: 16, height: 32 },
};

function renderMenu(props: Partial<Parameters<typeof ColumnHeaderMenu>[0]> = {}) {
  return render(
    <Theme>
      <ColumnHeaderMenu
      target={TARGET}
      sort={null}
      onSort={() => {}}
      onClose={() => {}}
        {...props}
      />
    </Theme>,
  );
}

describe("ColumnHeaderMenu", () => {
  it("draws nothing until an arrow is pressed", () => {
    renderMenu({ target: null });

    expect(screen.queryByRole("menu")).not.toBeInTheDocument();
  });

  it("offers both directions", async () => {
    renderMenu();

    expect(await screen.findByRole("menuitem", { name: /sort ascending/i })).toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: /sort descending/i })).toBeInTheDocument();
  });

  it("names the field and the direction, not the position", async () => {
    const onSort = vi.fn();
    renderMenu({ onSort });

    await userEvent.click(await screen.findByRole("menuitem", { name: /sort descending/i }));

    expect(onSort).toHaveBeenCalledWith({ field: "name", dir: "desc" });
  });

  it("offers a clear only on the column that is sorted", async () => {
    renderMenu({ sort: { field: "id", dir: "asc" } });

    await screen.findByRole("menuitem", { name: /sort ascending/i });
    expect(screen.queryByRole("menuitem", { name: /clear sort/i })).not.toBeInTheDocument();
  });

  it("clears the sort to nothing", async () => {
    const onSort = vi.fn();
    renderMenu({ sort: { field: "name", dir: "asc" }, onSort });

    await userEvent.click(await screen.findByRole("menuitem", { name: /clear sort/i }));

    expect(onSort).toHaveBeenCalledWith(null);
  });

  it("anchors itself to the arrow the user pressed", async () => {
    renderMenu();
    await screen.findByRole("menuitem", { name: /sort ascending/i });

    const anchor = document.querySelector("[data-dg-column-menu-anchor]");

    expect(anchor).toHaveStyle({ left: "120px", top: "8px" });
  });
});
