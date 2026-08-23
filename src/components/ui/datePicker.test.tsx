import { Theme } from "@radix-ui/themes";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactElement } from "react";
import { describe, expect, it, vi } from "vitest";
import { DatePicker } from "./datePicker";

/** The picker paints with Radix tokens, so every case mounts it inside a Theme. */
function mount(ui: ReactElement) {
  return render(<Theme>{ui}</Theme>);
}

const dateInput = () => screen.getByLabelText("Date");
const okButton = () => screen.getByRole("button", { name: "OK" });

/** Local midnight, matching how the picker reads a calendar day. */
const localIso = (y: number, m: number, d: number, hh = 0, mm = 0) =>
  new Date(y, m - 1, d, hh, mm).toISOString();

const utcIso = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d)).toISOString();

describe("DatePicker: date mode", () => {
  it("shows the incoming value in the masked input", () => {
    mount(
      <DatePicker mode="date" value={utcIso(2000, 1, 1)} onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );

    expect(dateInput()).toHaveValue("01/01/2000");
  });

  it("types the slashes for the user", async () => {
    const user = userEvent.setup();

    mount(<DatePicker mode="date" value={null} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    await user.type(dateInput(), "06202026");

    expect(dateInput()).toHaveValue("06/20/2026");
  });

  it("holds the edit until OK is pressed", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    mount(<DatePicker mode="date" value={null} onConfirm={onConfirm} onCancel={vi.fn()} />);
    await user.type(dateInput(), "06202026");

    expect(onConfirm).not.toHaveBeenCalled();

    await user.click(okButton());

    expect(onConfirm).toHaveBeenCalledExactlyOnceWith(utcIso(2026, 6, 20));
  });

  it("confirms a day picked on the calendar", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    mount(
      <DatePicker
        mode="date"
        value={utcIso(2026, 6, 1)}
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );
    await user.click(screen.getByRole("button", { name: /June 20th, 2026/ }));
    await user.click(okButton());

    expect(onConfirm).toHaveBeenCalledExactlyOnceWith(utcIso(2026, 6, 20));
  });

  it("mirrors a calendar click back into the masked input", async () => {
    const user = userEvent.setup();

    mount(
      <DatePicker mode="date" value={utcIso(2026, 6, 1)} onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );
    await user.click(screen.getByRole("button", { name: /June 20th, 2026/ }));

    expect(dateInput()).toHaveValue("06/20/2026");
  });

  it("throws the edit away on Cancel", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();
    const onCancel = vi.fn();

    mount(<DatePicker mode="date" value={null} onConfirm={onConfirm} onCancel={onCancel} />);
    await user.type(dateInput(), "06202026");
    await user.click(screen.getByRole("button", { name: "Cancel" }));

    expect(onCancel).toHaveBeenCalledOnce();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("cancels on Escape", async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    mount(<DatePicker mode="date" value={null} onConfirm={vi.fn()} onCancel={onCancel} />);
    await user.type(dateInput(), "{Escape}");

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it("confirms on Enter in the masked input", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    mount(<DatePicker mode="date" value={null} onConfirm={onConfirm} onCancel={vi.fn()} />);
    await user.type(dateInput(), "06202026{Enter}");

    expect(onConfirm).toHaveBeenCalledExactlyOnceWith(utcIso(2026, 6, 20));
  });

  it("blocks OK while the typed date is incomplete", async () => {
    const user = userEvent.setup();

    mount(<DatePicker mode="date" value={null} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    await user.type(dateInput(), "0620");

    expect(okButton()).toBeDisabled();
  });

  it("blocks OK on an empty date when the field is not nullable", () => {
    mount(<DatePicker mode="date" value={null} onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(okButton()).toBeDisabled();
  });

  it("confirms null from an empty date when nullable", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    mount(
      <DatePicker mode="date" value={null} nullable onConfirm={onConfirm} onCancel={vi.fn()} />,
    );
    await user.click(okButton());

    expect(onConfirm).toHaveBeenCalledExactlyOnceWith(null);
  });

  it("clears a set value back to null when nullable", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    mount(
      <DatePicker
        mode="date"
        value={utcIso(2000, 1, 1)}
        nullable
        onConfirm={onConfirm}
        onCancel={vi.fn()}
      />,
    );
    await user.clear(dateInput());
    await user.click(okButton());

    expect(onConfirm).toHaveBeenCalledExactlyOnceWith(null);
  });

  it("shows no time input", () => {
    mount(<DatePicker mode="date" value={null} onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.queryByLabelText("Time")).not.toBeInTheDocument();
  });
});

describe("DatePicker: datetime mode", () => {
  it("shows the instant's local time", () => {
    mount(
      <DatePicker
        mode="datetime"
        value={localIso(2026, 6, 20, 13, 30)}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Time")).toHaveValue("13:30");
  });

  it("confirms the typed date at the typed time", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    mount(<DatePicker mode="datetime" value={null} onConfirm={onConfirm} onCancel={vi.fn()} />);
    await user.type(dateInput(), "06202026");
    await user.clear(screen.getByLabelText("Time"));
    await user.type(screen.getByLabelText("Time"), "09:15");
    await user.click(okButton());

    expect(onConfirm).toHaveBeenCalledExactlyOnceWith(localIso(2026, 6, 20, 9, 15));
  });
});

describe("DatePicker: range mode", () => {
  it("shows a start and an end input", () => {
    mount(<DatePicker mode="range" value={null} onConfirm={vi.fn()} onCancel={vi.fn()} />);

    expect(screen.getByLabelText("Start date")).toBeInTheDocument();
    expect(screen.getByLabelText("End date")).toBeInTheDocument();
  });

  it("confirms both ends of the range", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    mount(<DatePicker mode="range" value={null} onConfirm={onConfirm} onCancel={vi.fn()} />);
    await user.type(screen.getByLabelText("Start date"), "06012026");
    await user.type(screen.getByLabelText("End date"), "06202026");
    await user.click(okButton());

    expect(onConfirm).toHaveBeenCalledExactlyOnceWith({
      from: utcIso(2026, 6, 1),
      to: utcIso(2026, 6, 20),
    });
  });

  it("shows the incoming range in both inputs", () => {
    mount(
      <DatePicker
        mode="range"
        value={{ from: utcIso(2026, 6, 1), to: utcIso(2026, 6, 20) }}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Start date")).toHaveValue("06/01/2026");
    expect(screen.getByLabelText("End date")).toHaveValue("06/20/2026");
  });

  it("blocks OK until both ends are complete", async () => {
    const user = userEvent.setup();

    mount(<DatePicker mode="range" value={null} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    await user.type(screen.getByLabelText("Start date"), "06012026");

    expect(okButton()).toBeDisabled();
  });

  it("blocks OK when the end falls before the start", async () => {
    const user = userEvent.setup();

    mount(<DatePicker mode="range" value={null} onConfirm={vi.fn()} onCancel={vi.fn()} />);
    await user.type(screen.getByLabelText("Start date"), "06202026");
    await user.type(screen.getByLabelText("End date"), "06012026");

    expect(okButton()).toBeDisabled();
  });
});

describe("DatePicker: range-datetime mode", () => {
  it("shows a time input for each end", () => {
    mount(
      <DatePicker mode="range-datetime" value={null} onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );

    expect(screen.getByLabelText("Start time")).toBeInTheDocument();
    expect(screen.getByLabelText("End time")).toBeInTheDocument();
  });

  it("confirms both ends at their own times", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    mount(
      <DatePicker mode="range-datetime" value={null} onConfirm={onConfirm} onCancel={vi.fn()} />,
    );
    await user.type(screen.getByLabelText("Start date"), "06012026");
    await user.type(screen.getByLabelText("Start time"), "09:00");
    await user.type(screen.getByLabelText("End date"), "06202026");
    await user.type(screen.getByLabelText("End time"), "17:30");
    await user.click(okButton());

    expect(onConfirm).toHaveBeenCalledExactlyOnceWith({
      from: localIso(2026, 6, 1, 9, 0),
      to: localIso(2026, 6, 20, 17, 30),
    });
  });
});

describe("DatePicker: calendar follows the typed date", () => {
  it("jumps the calendar to the month the user types", async () => {
    const user = userEvent.setup();

    mount(
      <DatePicker mode="date" value={utcIso(2026, 6, 1)} onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: /June 20th, 2026/ })).toBeInTheDocument();

    await user.clear(dateInput());
    await user.type(dateInput(), "11092001");

    expect(screen.getByRole("button", { name: /November 9th, 2001/ })).toBeInTheDocument();
  });

  it("leaves the calendar alone while the date is half typed", async () => {
    const user = userEvent.setup();

    mount(
      <DatePicker mode="date" value={utcIso(2026, 6, 1)} onConfirm={vi.fn()} onCancel={vi.fn()} />,
    );
    await user.clear(dateInput());
    await user.type(dateInput(), "1109");

    expect(screen.getByRole("button", { name: /June 20th, 2026/ })).toBeInTheDocument();
  });
});
