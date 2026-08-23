import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ColumnPickerList } from "./ColumnPickerList";

const COLUMNS = [
  { field: "id", title: "ID", hidden: false },
  { field: "name", title: "Name", hidden: false },
  { field: "region", title: "Region", hidden: false, locked: true },
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

  it("will not let the grouped column be hidden", async () => {
    // The banner would then name a group with no column anywhere to point at.
    const onToggle = vi.fn();
    renderList({ onToggle });

    const region = screen.getByRole("checkbox", { name: /region/i });
    expect(region).toBeDisabled();

    await userEvent.click(region);
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("says why the grouped column cannot be hidden", () => {
    renderList();

    expect(screen.getByRole("checkbox", { name: /grouped by/i })).toBeInTheDocument();
  });

  it("puts every column back the way the descriptor described it", async () => {
    const onReset = vi.fn();
    renderList({ onReset });

    await userEvent.click(screen.getByRole("button", { name: /reset/i }));

    expect(onReset).toHaveBeenCalledTimes(1);
  });
});
