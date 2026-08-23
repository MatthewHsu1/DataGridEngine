import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { GridHeaderBar } from "./GridHeaderBar";

const EMEA = { label: "EMEA", collapsed: false, onToggle: () => {} };

/** The quiet case: nothing loading, nothing wrong, nothing grouped. */
function renderQuiet(props: Partial<Parameters<typeof GridHeaderBar>[0]> = {}) {
  return render(
    <GridHeaderBar
      status="ready"
      error={null}
      rowCount={500}
      onRetry={() => {}}
      group={null}
      {...props}
    />,
  );
}

describe("GridHeaderBar", () => {
  it("stays on screen when there is nothing to report", () => {
    // The whole point of folding the status bar into this one. A bar that came
    // and went would move the grid under the pointer every time a load settled.
    const { container } = renderQuiet();

    expect(container).not.toBeEmptyDOMElement();
  });

  it("names the group the grid is currently inside", () => {
    renderQuiet({ group: EMEA });

    expect(screen.getByText("EMEA")).toBeInTheDocument();
  });

  it("leaves the group zone out of a grid that is not grouping", () => {
    renderQuiet({ group: null });

    expect(screen.queryByRole("button", { name: /collapse|expand/i })).not.toBeInTheDocument();
  });

  it("keeps the column picker reachable even with no grouping", () => {
    renderQuiet({ group: null, picker: <button type="button">Columns</button> });

    expect(screen.getByRole("button", { name: "Columns" })).toBeInTheDocument();
  });

  it("shows the host's components for the current group", () => {
    renderQuiet({ group: EMEA, groupSlot: <button type="button">Export EMEA</button> });

    expect(screen.getByRole("button", { name: "Export EMEA" })).toBeInTheDocument();
  });

  it("spends no row on a group whose host supplied nothing", () => {
    const { container } = renderQuiet({ group: EMEA });

    expect(container.querySelector("[data-dg-group-slot]")).toBeNull();
  });

  it("collapses the current group from the bar", async () => {
    const onToggle = vi.fn();
    renderQuiet({ group: { ...EMEA, onToggle } });

    await userEvent.click(screen.getByRole("button", { name: /collapse emea/i }));

    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("says a first load is loading, because a grid with no rows has no cells to say it", () => {
    renderQuiet({ status: "loading", rowCount: 0 });

    expect(screen.getByRole("status")).toHaveTextContent(/loading rows/i);
  });

  it("stays quiet while rows load into a grid that already has rows", () => {
    renderQuiet({ status: "loading", rowCount: 500 });

    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("says so while the grid is showing the rows of the state the user just left", () => {
    renderQuiet({ stale: true });

    expect(screen.getByRole("status")).toHaveTextContent(/loading/i);
  });

  it("offers a retry when a load fails", async () => {
    const onRetry = vi.fn();
    renderQuiet({ status: "error", onRetry });

    expect(screen.getByRole("alert")).toHaveTextContent(/could not load/i);
    await userEvent.click(screen.getByRole("button", { name: /retry/i }));

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("keeps the column picker reachable while a load has failed", () => {
    // The old status bar replaced everything above the grid with the alert.
    // Here the alert is a ZONE, so losing rows never costs the user the one
    // control that decides what the grid shows.
    renderQuiet({ status: "error", picker: <button type="button">Columns</button> });

    expect(screen.getByRole("button", { name: "Columns" })).toBeInTheDocument();
  });

  it("shows an edit error on top of a ready grid", () => {
    renderQuiet({ error: "Failed to save price" });

    expect(screen.getByRole("alert")).toHaveTextContent("Failed to save price");
  });

  it("offers a dismiss for an edit error, so a user who stops editing is not stuck with it", async () => {
    const onDismissError = vi.fn();
    renderQuiet({ error: "Failed to save price", onDismissError });

    await userEvent.click(screen.getByRole("button", { name: /dismiss/i }));

    expect(onDismissError).toHaveBeenCalledTimes(1);
  });

  it("lets a failed load outrank an edit error, because it speaks for every row", () => {
    renderQuiet({ status: "error", error: "Failed to save price" });

    expect(screen.getByRole("alert")).toHaveTextContent(/could not load/i);
  });

  it("holds the slot row's space open while the group is not known yet", () => {
    // Null means "there will be components here". A row that came and went as
    // the grid worked out which group it was in changed the bar's height, and
    // the grid below jumped with it on every scrollbar drag.
    const { container } = renderQuiet({ group: null, groupSlot: null });

    expect(container.querySelector("[data-dg-group-slot]")).not.toBeNull();
  });
});
