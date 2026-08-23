import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GroupHeaderRow } from "./GroupHeaderRow";

describe("GroupHeaderRow", () => {
  it("names the group", () => {
    render(<GroupHeaderRow label="EMEA" collapsed={false} onToggle={() => {}} />);

    expect(screen.getByText("EMEA")).toBeInTheDocument();
  });

  it("renders the host's components beside the name", () => {
    render(
      <GroupHeaderRow label="EMEA" collapsed={false} onToggle={() => {}}>
        <button type="button">Export EMEA</button>
      </GroupHeaderRow>,
    );

    expect(screen.getByRole("button", { name: "Export EMEA" })).toBeInTheDocument();
  });

  it("collapses the group when its control is clicked", async () => {
    const onToggle = vi.fn();
    render(<GroupHeaderRow label="EMEA" collapsed={false} onToggle={onToggle} />);

    await userEvent.click(screen.getByRole("button", { name: /collapse emea/i }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("offers to expand a group that is already collapsed", async () => {
    const onToggle = vi.fn();
    render(<GroupHeaderRow label="EMEA" collapsed onToggle={onToggle} />);

    await userEvent.click(screen.getByRole("button", { name: /expand emea/i }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("reports whether the group is open, so a screen reader can say so", () => {
    const { rerender } = render(
      <GroupHeaderRow label="EMEA" collapsed={false} onToggle={() => {}} />,
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "true");

    rerender(<GroupHeaderRow label="EMEA" collapsed onToggle={() => {}} />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-expanded", "false");
  });

  it("paints the name in the group's own colour", () => {
    render(
      <GroupHeaderRow label="EMEA" textColor="#AB6400" collapsed={false} onToggle={() => {}} />,
    );

    expect(screen.getByText("EMEA")).toHaveStyle({ color: "#AB6400" });
  });
});
