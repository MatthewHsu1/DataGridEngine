import { Theme } from "@radix-ui/themes";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { DatePickerPopover } from "./datePickerPopover";

function mount(ui: ReactElement) {
  return render(<Theme>{ui}</Theme>);
}

const utcIso = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d)).toISOString();

const trigger = () => screen.getByRole("button", { name: /date|1\/1\/2000|6\/1\/2026/i });

describe("DatePickerPopover", () => {
  it("labels the trigger with the placeholder when there is no value", () => {
    mount(
      <DatePickerPopover mode="date" value={null} onChange={vi.fn()} placeholder="Pick a date" />,
    );

    expect(screen.getByRole("button", { name: "Pick a date" })).toBeInTheDocument();
  });

  it("labels the trigger with the formatted value", () => {
    mount(<DatePickerPopover mode="date" value={utcIso(2000, 1, 1)} onChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "1/1/2000" })).toBeInTheDocument();
  });

  it("labels the trigger with both ends of a range", () => {
    mount(
      <DatePickerPopover
        mode="range"
        value={{ from: utcIso(2026, 6, 1), to: utcIso(2026, 6, 20) }}
        onChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "6/1/2026 – 6/20/2026" })).toBeInTheDocument();
  });

  it("keeps the picker closed until the trigger is clicked", () => {
    mount(<DatePickerPopover mode="date" value={null} onChange={vi.fn()} />);

    expect(screen.queryByLabelText("Date")).not.toBeInTheDocument();
  });

  it("opens the picker on the trigger", async () => {
    const user = userEvent.setup();

    mount(<DatePickerPopover mode="date" value={null} onChange={vi.fn()} />);
    await user.click(trigger());

    expect(screen.getByLabelText("Date")).toBeInTheDocument();
  });

  it("reports the confirmed value and closes", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    mount(<DatePickerPopover mode="date" value={null} onChange={onChange} />);
    await user.click(trigger());
    await user.type(screen.getByLabelText("Date"), "06202026");
    await user.click(screen.getByRole("button", { name: "OK" }));

    expect(onChange).toHaveBeenCalledExactlyOnceWith(utcIso(2026, 6, 20));
    expect(screen.queryByLabelText("Date")).not.toBeInTheDocument();
  });

  it("reports nothing and closes on Cancel", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();

    mount(<DatePickerPopover mode="date" value={null} onChange={onChange} />);
    await user.click(trigger());
    await user.type(screen.getByLabelText("Date"), "06202026");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onChange).not.toHaveBeenCalled();
    expect(screen.queryByLabelText("Date")).not.toBeInTheDocument();
  });
});
