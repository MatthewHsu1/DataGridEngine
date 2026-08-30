import type { CustomCell } from "@glideapps/glide-data-grid";
import { Theme } from "@radix-ui/themes";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentType } from "react";
import { describe, expect, it, vi } from "vitest";
import { dateCellRenderer, makeDateCell, DATE_CELL_TYPE, type DateCellData } from "./dateCell";

const nullable = { nullable: true };
const nullableWithTime = { nullable: true, withTime: true };

interface EditorHandlers {
  value: CustomCell<DateCellData>;
  onChange: (updated: CustomCell<DateCellData>) => void;
  onFinishedEditing: (updated?: CustomCell<DateCellData>) => void;
  isValid?: boolean;
}

/** Mount the cell's overlay editor the way glide-data-grid does. */
function mountEditor(cell: CustomCell<DateCellData>, handlers: Partial<EditorHandlers> = {}) {
  const Editor = dateCellRenderer.provideEditor?.(cell) as unknown as ComponentType<EditorHandlers>;

  const props: EditorHandlers = {
    value: cell,
    onChange: handlers.onChange ?? vi.fn(),
    onFinishedEditing: handlers.onFinishedEditing ?? vi.fn(),
    isValid: true,
  };

  render(
    <Theme>
      <Editor {...props} />
    </Theme>,
  );
}

const utcIso = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d)).toISOString();

describe("date cell editor", () => {
  it("shows the cell's value in the masked input", () => {
    mountEditor(makeDateCell(utcIso(2000, 1, 1), nullable));

    expect(screen.getByLabelText("Date")).toHaveValue("01/01/2000");
  });

  it("commits the new value only when OK is pressed", async () => {
    const user = userEvent.setup();
    const onFinishedEditing = vi.fn();
    const onChange = vi.fn();

    mountEditor(makeDateCell(null, nullable), { onFinishedEditing, onChange });
    await user.type(screen.getByLabelText("Date"), "06202026");

    expect(onFinishedEditing).not.toHaveBeenCalled();
    expect(onChange).not.toHaveBeenCalled();

    await user.click(screen.getByRole("button", { name: "OK" }));

    expect(onFinishedEditing).toHaveBeenCalledOnce();
    expect(onFinishedEditing.mock.calls[0][0].data).toEqual({
      kind: DATE_CELL_TYPE,
      value: utcIso(2026, 6, 20),
      options: nullable,
    });
  });

  it("cancels the edit with no value on Cancel", async () => {
    const user = userEvent.setup();
    const onFinishedEditing = vi.fn();

    mountEditor(makeDateCell(null, nullable), { onFinishedEditing });
    await user.type(screen.getByLabelText("Date"), "06202026");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onFinishedEditing).toHaveBeenCalledExactlyOnceWith(undefined);
  });

  it("offers a time input when the column's options say withTime", () => {
    mountEditor(makeDateCell(new Date(2026, 5, 20, 13, 30).toISOString(), nullableWithTime));

    expect(screen.getByLabelText("Time")).toHaveValue("13:30");
  });

  it("commits null from an empty value because the column is nullable", async () => {
    const user = userEvent.setup();
    const onFinishedEditing = vi.fn();

    mountEditor(makeDateCell(utcIso(2000, 1, 1), nullable), { onFinishedEditing });
    await user.clear(screen.getByLabelText("Date"));
    await user.click(screen.getByRole("button", { name: "OK" }));

    expect(onFinishedEditing.mock.calls[0][0].data.value).toBeNull();
  });

  it("blocks OK on an empty value when the column is not nullable", () => {
    const cell = makeDateCell(null, {});
    const Editor = dateCellRenderer.provideEditor?.(cell) as unknown as ComponentType<
      Record<string, unknown>
    >;

    render(
      <Theme>
        <Editor value={cell} onChange={vi.fn()} onFinishedEditing={vi.fn()} isValid />
      </Theme>,
    );

    expect(screen.getByRole("button", { name: "OK" })).toBeDisabled();
  });
});
