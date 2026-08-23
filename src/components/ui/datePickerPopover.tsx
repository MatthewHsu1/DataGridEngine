import { Button, Popover } from "@radix-ui/themes";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { formatDateDisplay } from "../../lib/date/dateUtils";
import { DatePicker, type DateRange } from "./datePicker";

interface PopoverExtras {
  /** Trigger label when there is no value. Defaults to "Select date". */
  placeholder?: string;
  /** Whether an empty value may be confirmed. Defaults to false. */
  nullable?: boolean;
  disabled?: boolean;
}

export type DatePickerPopoverProps =
  | (PopoverExtras & {
      mode: "date" | "datetime";
      value: string | null;
      /** Called once with the confirmed value. Never called on Cancel. */
      onChange: (value: string | null) => void;
    })
  | (PopoverExtras & {
      mode: "range" | "range-datetime";
      value: DateRange | null;
      /** Called once with the confirmed value. Never called on Cancel. */
      onChange: (value: DateRange | null) => void;
    });

/** The range arms of the props union, as one type. */
type RangePopoverProps = Extract<DatePickerPopoverProps, { mode: "range" | "range-datetime" }>;

function isRangeProps(props: DatePickerPopoverProps): props is RangePopoverProps {
  return props.mode === "range" || props.mode === "range-datetime";
}

const EN_DASH = "–";

function triggerLabel(props: DatePickerPopoverProps, placeholder: string): string {
  const withTime = props.mode === "datetime" || props.mode === "range-datetime";

  if (isRangeProps(props)) {
    if (!props.value?.from || !props.value.to) return placeholder;

    const from = formatDateDisplay(props.value.from, withTime);
    const to = formatDateDisplay(props.value.to, withTime);

    return `${from} ${EN_DASH} ${to}`;
  }

  if (!props.value) return placeholder;

  return formatDateDisplay(props.value, withTime);
}

/**
 * The DOM-side adapter for `DatePicker`: a Radix `Popover` whose trigger shows
 * the current value and whose content is the picker itself.
 *
 * Grid cells do NOT use this — glide-data-grid already floats a cell's editor,
 * so those mount `DatePicker` bare. Everything outside the canvas uses this one.
 *
 * The popover closes on confirm AND on cancel; `onChange` fires only on confirm.
 */
export function DatePickerPopover(props: DatePickerPopoverProps) {
  const { placeholder = "Select date", nullable, disabled } = props;
  const [open, setOpen] = useState(false);

  const close = () => setOpen(false);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger>
        <Button size="1" variant="surface" color="gray" disabled={disabled}>
          <CalendarIcon size={14} aria-hidden />
          {triggerLabel(props, placeholder)}
        </Button>
      </Popover.Trigger>

      <Popover.Content size="1" align="start" width="auto">
        {isRangeProps(props) ? (
          <DatePicker
            mode={props.mode}
            value={props.value}
            nullable={nullable}
            onConfirm={(value) => {
              close();
              props.onChange(value);
            }}
            onCancel={close}
          />
        ) : (
          <DatePicker
            mode={props.mode}
            value={props.value}
            nullable={nullable}
            onConfirm={(value) => {
              close();
              props.onChange(value);
            }}
            onCancel={close}
          />
        )}
      </Popover.Content>
    </Popover.Root>
  );
}
