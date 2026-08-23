import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ColumnPickerList } from "./ColumnPickerList";

const COLUMNS = [
  { field: "id", title: "ID", hidden: false },
  { field: "name", title: "Name", hidden: false },
  { field: "region", title: "Region", hidden: false, grouped: true },
  { field: "contact", title: "Contact", hidden: true },
];

function renderList(props: Partial<Parameters<typeof ColumnPickerList>[0]> = {}) {
  return render(
    <ColumnPickerList columns={COLUMNS} onToggle={() => {}} onReset={() => {}} {...props} />,
  );
}

describe("ColumnPickerList", () => {
  it("lists every column, hidden ones included", () => {
    renderList();

    expect(screen.getAllByRole("checkbox")).toHaveLength(4);
    expect(screen.getByRole("checkbox", { name: /contact/i })).toBeInTheDocument();
  });

  it("shows which columns the grid is currently drawing", () => {
    renderList();

    expect(screen.getByRole("checkbox", { name: /^name/i })).toBeChecked();
    expect(screen.getByRole("checkbox", { name: /contact/i })).not.toBeChecked();
  });

  it("names the field, not the position, when a column is toggled", async () => {
    const onToggle = vi.fn();
    renderList({ onToggle });

    await userEvent.click(screen.getByRole("checkbox", { name: /contact/i }));

    expect(onToggle).toHaveBeenCalledWith("contact");
  });

  it("lets the grouped column be hidden like any other", async () => {
    // The group banner names the value on its own, so the column it came from
    // is the one a user is most likely to want out of the way.
    const onToggle = vi.fn();
    renderList({ onToggle });

    const region = screen.getByRole("checkbox", { name: /region/i });
    expect(region).toBeEnabled();

    await userEvent.click(region);
    expect(onToggle).toHaveBeenCalledWith("region");
  });

  it("says which column the grid groups by", () => {
    renderList();

    expect(screen.getByRole("checkbox", { name: /grouped by/i })).toBeInTheDocument();
  });

  it("puts every column back the way the descriptor described it", async () => {
    const onReset = vi.fn();
    renderList({ onReset });

    await userEvent.click(screen.getByRole("button", { name: /reset/i }));

    expect(onReset).toHaveBeenCalledTimes(1);
  });

  it("toggles from the row's text, not just the box itself", async () => {
    const onToggle = vi.fn();
    renderList({ onToggle });

    await userEvent.click(screen.getByText("Name"));

    expect(onToggle).toHaveBeenCalledWith("name");
  });
});
