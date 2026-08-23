import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, act } from "react";
import { describe, expect, it, vi } from "vitest";
import {
  GroupHeaderLayer,
  type GroupHeaderLayerHandle,
  type GroupHeaderLayerProps,
} from "./GroupHeaderLayer";
import type { VisibleHeader } from "./displayModel";

const HEADERS: VisibleHeader<string>[] = [
  { displayRow: 0, group: "EMEA", collapsed: false },
  { displayRow: 5, group: "Americas", collapsed: true },
];

function renderLayer(props: Partial<GroupHeaderLayerProps<string>> = {}) {
  const ref = createRef<GroupHeaderLayerHandle>();

  const view = render(
    <GroupHeaderLayer
      ref={ref}
      headers={HEADERS}
      label={(g) => g}
      onToggle={() => {}}
      {...props}
    />,
  );

  return { ...view, ref };
}

/** What `DataGrid` calls on every visible-region change. */
function place(
  ref: { current: GroupHeaderLayerHandle | null },
  at: Record<number, { top: number; height: number }>,
) {
  act(() => ref.current?.place(new Map(Object.entries(at).map(([k, v]) => [Number(k), v]))));
}

/** Both headers on their holes, which is the state a mounted grid is in. */
function placeAll(ref: { current: GroupHeaderLayerHandle | null }) {
  place(ref, { 0: { top: 36, height: 40 }, 5: { top: 206, height: 40 } });
}

function headerFor(name: string): HTMLElement {
  return screen.getByText(name).closest("[data-dg-group-header]") as HTMLElement;
}

describe("GroupHeaderLayer", () => {
  it("draws one header per group the viewport can see", () => {
    const { container } = renderLayer();

    expect(container.querySelectorAll("[data-dg-group-header]")).toHaveLength(2);
  });

  it("names each group", () => {
    renderLayer();

    expect(screen.getByText("EMEA")).toBeInTheDocument();
    expect(screen.getByText("Americas")).toBeInTheDocument();
  });

  it("gives each group the components its host asked for", () => {
    const { ref } = renderLayer({
      slot: (g) => <button type="button">{`Export ${g}`}</button>,
    });
    placeAll(ref);

    expect(screen.getByRole("button", { name: "Export EMEA" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Export Americas" })).toBeInTheDocument();
  });

  it("names the group, not the row, when a header is collapsed", async () => {
    const onToggle = vi.fn();
    const { ref } = renderLayer({ onToggle });
    placeAll(ref);

    await userEvent.click(screen.getByRole("button", { name: /collapse emea/i }));

    expect(onToggle).toHaveBeenCalledWith("EMEA");
  });

  it("shows a collapsed group as collapsed, so its rows can be found again", () => {
    const { ref } = renderLayer();
    placeAll(ref);

    expect(screen.getByRole("button", { name: /expand americas/i })).toBeInTheDocument();
  });

  it("moves a header to where the canvas put its hole", () => {
    const { ref } = renderLayer();

    place(ref, { 0: { top: 36, height: 40 }, 5: { top: 206, height: 40 } });

    expect(headerFor("EMEA").style.transform).toBe("translateY(36px)");
    expect(headerFor("Americas").style.transform).toBe("translateY(206px)");
  });

  it("takes the hole's height, so the header covers it exactly", () => {
    const { ref } = renderLayer();

    place(ref, { 0: { top: 36, height: 64 } });

    expect(headerFor("EMEA").style.height).toBe("64px");
  });

  it("hides a header the canvas has not placed yet, rather than stacking it at the top", () => {
    // React commits the new header first and the placement arrives on the next
    // frame. Drawn at zero in between, every unplaced header would pile up over
    // the first row.
    const { ref } = renderLayer();

    place(ref, { 0: { top: 36, height: 40 } });

    expect(headerFor("EMEA")).toBeVisible();
    expect(headerFor("Americas")).not.toBeVisible();
  });

  it("places without re-rendering, because a scroll frame cannot wait for React", () => {
    const label = vi.fn((g: string) => g);
    const { ref } = renderLayer({ label });
    const before = label.mock.calls.length;

    place(ref, { 0: { top: 36, height: 40 }, 5: { top: 206, height: 40 } });

    expect(label.mock.calls.length).toBe(before);
  });
});
