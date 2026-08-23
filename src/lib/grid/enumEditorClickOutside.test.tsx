import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";
import { createEnumCell } from "./createEnumCell";

const cell = createEnumCell({
  kind: "enum-click-outside-test",
  options: [
    { value: 1, label: "One" },
    { value: 2, label: "Two" },
  ],
});

/**
 * Glide's own outside-click test, copied from
 * `internal/click-outside-container/click-outside-container.js`.
 *
 * It listens for `pointerdown` on the document in the CAPTURE phase, and if the
 * target is not inside the overlay it walks up looking for this class. Finding
 * it is the only thing that stops the overlay closing.
 */
function glideWouldCloseTheEditor(target: Element | null): boolean {
  let node: Element | null = target;

  while (node !== null) {
    if (node.classList.contains("click-outside-ignore")) {
      return false;
    }

    node = node.parentElement;
  }

  return true;
}

function renderEditor() {
  const onFinishedEditing = vi.fn();
  const provided = cell.renderer.provideEditor?.(cell.makeCell(1));

  const Editor = (
    typeof provided === "function" ? provided : (provided as { editor: unknown })?.editor
  ) as ComponentType<Record<string, unknown>>;

  render(
    <Editor
      value={cell.makeCell(1)}
      onChange={() => {}}
      onFinishedEditing={onFinishedEditing}
      forceEditMode
      initialValue=""
      target={{ x: 0, y: 0, width: 100, height: 34 }}
      isHighlighted={false}
    />,
  );

  return { onFinishedEditing };
}

describe("the enum editor's dropdown, against glide's outside-click rule", () => {
  it("is not treated as a click outside the editor", () => {
    // The dropdown is PORTALLED out of the overlay, so a mouse press on an
    // option lands outside it. Glide closes the editor on `pointerdown`, which
    // runs before the Select's own selection on `pointerup` — so the choice was
    // thrown away and only the keyboard, which never presses a pointer, could
    // save an enum.
    renderEditor();

    const [option] = screen.getAllByRole("option");

    expect(glideWouldCloseTheEditor(option)).toBe(false);
  });

  it("keeps the whole dropdown safe, not just the option that was pressed", () => {
    // The padding around the items, the scroll buttons and the viewport are all
    // pressable, and every one of them would otherwise cancel the edit.
    renderEditor();

    const [option] = screen.getAllByRole("option");
    const around = option.parentElement;

    expect(glideWouldCloseTheEditor(around)).toBe(false);
  });
});
