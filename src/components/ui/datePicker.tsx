import { Button, Flex, Text } from "@radix-ui/themes";
import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp } from "lucide-react";
import { useId, useState, type KeyboardEvent } from "react";
import { DayPicker, type ChevronProps, type DateRange as CalendarRange } from "react-day-picker";
import { PatternFormat } from "react-number-format";
import { dateToMask, maskToDate } from "../../lib/date/dateMask";
import { composeIso, isoToCalendarDate, isoToTimeInput } from "../../lib/date/dateUtils";
import { dayPickerClassNames } from "./dayPickerTheme";
import { Input } from "./input";

/*
 * How many years the year dropdown spans. It is a NATIVE select, so its length
 * is a scroll the user pays for: a thousand entries is unusable. These cover a
 * lifetime back and scheduling forward, and the masked input takes any date
 * outside them without touching the dropdown at all.
 */
const YEARS_BACK = 120;
const YEARS_FORWARD = 10;

/** A pair of canonical ISO strings. `null` on an end means that end is unset. */
export interface DateRange {
  from: string | null;
  to: string | null;
}

export type DatePickerMode = "date" | "datetime" | "range" | "range-datetime";

interface CommonProps {
  /** Called when the user abandons the edit (Cancel, or Escape). */
  onCancel: () => void;
  /** Whether an empty value may be confirmed. Defaults to false. */
  nullable?: boolean;
  /** Focus the first field on mount. Defaults to true. */
  autoFocus?: boolean;
}

export type DatePickerProps =
  | (CommonProps & {
      mode: "date" | "datetime";
      value: string | null;
      onConfirm: (value: string | null) => void;
    })
  | (CommonProps & {
      mode: "range" | "range-datetime";
      value: DateRange | null;
      onConfirm: (value: DateRange | null) => void;
    });

/** The range arms of the props union, as one type. */
type RangeProps = Extract<DatePickerProps, { mode: "range" | "range-datetime" }>;

/**
 * Narrows the props to their range arms. A plain boolean would answer the same
 * question, but only a guard carries the answer into `props.value` and
 * `props.onConfirm`, which change shape with the mode.
 */
function isRangeProps(props: DatePickerProps): props is RangeProps {
  return props.mode === "range" || props.mode === "range-datetime";
}

/** One end of the picker's draft: the digits in its mask, and its time-of-day. */
interface Endpoint {
  digits: string;
  time: string;
}

function toEndpoint(iso: string | null, withTime: boolean): Endpoint {
  return {
    digits: dateToMask(isoToCalendarDate(iso, withTime)),
    time: isoToTimeInput(iso),
  };
}

/**
 * A date, date+time, date range, or date-range+time picker.
 *
 * The edit is HELD until the user confirms: `onConfirm` fires once, on OK or on
 * Enter in a text field, and never on an intermediate click. `onCancel` fires on
 * Cancel or Escape. `mode` decides the shape of `value` and of `onConfirm`.
 *
 * Values are the canonical ISO strings the rest of the engine speaks (see
 * `lib/date/dateUtils`): a date-only value is pinned to UTC midnight; a value
 * with a time is a real instant read from the viewer's local wall clock.
 *
 * Renders inline, with no popover of its own — a grid cell editor already floats
 * it. Wrap it in `DatePickerPopover` for a trigger in ordinary DOM.
 */
export function DatePicker(props: DatePickerProps) {
  const { mode, nullable = false, onCancel, autoFocus = true } = props;

  const isRange = isRangeProps(props);
  const withTime = mode === "datetime" || mode === "range-datetime";

  const incoming: DateRange = isRangeProps(props)
    ? (props.value ?? { from: null, to: null })
    : { from: props.value, to: null };

  const [start, setStart] = useState(() => toEndpoint(incoming.from, withTime));
  const [end, setEnd] = useState(() => toEndpoint(incoming.to, withTime));

  // The displayed month follows a COMPLETE date, typed or clicked. A half-typed
  // mask leaves it where it is, so the calendar doesn't lurch on every keystroke.
  const [month, setMonth] = useState(() => isoToCalendarDate(incoming.from, withTime));

  const changeStart = (next: Endpoint) => {
    setStart(next);

    const day = maskToDate(next.digits);

    if (day) setMonth(day);
  };

  const changeEnd = (next: Endpoint) => {
    setEnd(next);

    const day = maskToDate(next.digits);

    if (day) setMonth(day);
  };

  const startDate = maskToDate(start.digits);
  const endDate = maskToDate(end.digits);

  const canConfirm = (() => {
    if (isRange) {
      if (start.digits === "" && end.digits === "") return nullable;
      if (!startDate || !endDate) return false;

      return startDate.getTime() <= endDate.getTime();
    }

    if (start.digits === "") return nullable;

    return Boolean(startDate);
  })();

  const confirm = () => {
    if (!canConfirm) return;

    if (isRangeProps(props)) {
      if (!startDate || !endDate) {
        props.onConfirm(null);
        return;
      }

      props.onConfirm({
        from: composeIso(startDate, start.time, withTime),
        to: composeIso(endDate, end.time, withTime),
      });
      return;
    }

    props.onConfirm(startDate ? composeIso(startDate, start.time, withTime) : null);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      onCancel();
      return;
    }

    // Enter only confirms from a text field. On a day button it belongs to the
    // calendar, and on OK/Cancel the click handler already fires.
    if (event.key === "Enter" && event.target instanceof HTMLInputElement) {
      event.preventDefault();
      confirm();
    }
  };

  const handleSelectSingle = (day?: Date) => {
    setStart((prev) => ({ ...prev, digits: dateToMask(day) }));
  };

  const handleSelectRange = (range?: CalendarRange) => {
    setStart((prev) => ({ ...prev, digits: dateToMask(range?.from) }));
    setEnd((prev) => ({ ...prev, digits: dateToMask(range?.to) }));
  };

  const currentYear = new Date().getFullYear();
  const classNames = dayPickerClassNames(isRange);
  const components = { Chevron };

  return (
    <div className="dg:flex dg:min-w-[280px] dg:flex-col dg:gap-3 dg:p-3" onKeyDown={handleKeyDown}>
      <div className="dg:flex dg:flex-wrap dg:gap-2">
        <MaskedDateField
          label={isRange ? "Start date" : "Date"}
          endpoint={start}
          onChange={changeStart}
          autoFocus={autoFocus}
        />
        {withTime && (
          <TimeField
            label={isRange ? "Start time" : "Time"}
            endpoint={start}
            onChange={changeStart}
          />
        )}
        {isRange && (
          <>
            <MaskedDateField label="End date" endpoint={end} onChange={changeEnd} />
            {withTime && <TimeField label="End time" endpoint={end} onChange={changeEnd} />}
          </>
        )}
      </div>

      {isRange ? (
        <DayPicker
          mode="range"
          selected={{ from: startDate, to: endDate }}
          onSelect={handleSelectRange}
          month={month}
          onMonthChange={setMonth}
          numberOfMonths={2}
          showOutsideDays
          classNames={classNames}
          components={components}
        />
      ) : (
        <DayPicker
          mode="single"
          selected={startDate}
          onSelect={handleSelectSingle}
          month={month}
          onMonthChange={setMonth}
          captionLayout="dropdown"
          startMonth={new Date(currentYear - YEARS_BACK, 0)}
          endMonth={new Date(currentYear + YEARS_FORWARD, 11)}
          showOutsideDays
          classNames={classNames}
          components={components}
        />
      )}

      <Flex gap="2" justify="end">
        <Button type="button" variant="soft" color="gray" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="button" onClick={confirm} disabled={!canConfirm}>
          OK
        </Button>
      </Flex>
    </div>
  );
}

function Chevron({ orientation }: ChevronProps) {
  const Icon =
    orientation === "left"
      ? ChevronLeft
      : orientation === "right"
        ? ChevronRight
        : orientation === "up"
          ? ChevronUp
          : ChevronDown;

  return <Icon className="dg:size-4" />;
}

interface FieldProps {
  label: string;
  endpoint: Endpoint;
  onChange: (next: Endpoint) => void;
  autoFocus?: boolean;
}

function MaskedDateField({ label, endpoint, onChange, autoFocus = false }: FieldProps) {
  const id = useId();
  const incomplete = endpoint.digits.length > 0 && !maskToDate(endpoint.digits);

  return (
    <FieldShell id={id} label={label}>
      <PatternFormat
        id={id}
        format="##/##/####"
        placeholder="MM/DD/YYYY"
        value={endpoint.digits}
        valueIsNumericString
        onValueChange={(values) => onChange({ ...endpoint, digits: values.value })}
        customInput={Input}
        invalid={incomplete}
        autoFocus={autoFocus}
        className="dg:w-[7.5rem]"
      />
    </FieldShell>
  );
}

function TimeField({ label, endpoint, onChange }: FieldProps) {
  const id = useId();

  return (
    <FieldShell id={id} label={label}>
      <Input
        id={id}
        type="time"
        value={endpoint.time}
        onChange={(event) => onChange({ ...endpoint, time: event.target.value })}
        className="dg:w-[6.5rem]"
      />
    </FieldShell>
  );
}

function FieldShell({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="dg:flex dg:flex-col dg:gap-1">
      <Text as="label" htmlFor={id} size="1" weight="medium" color="gray">
        {label}
      </Text>
      {children}
    </div>
  );
}
