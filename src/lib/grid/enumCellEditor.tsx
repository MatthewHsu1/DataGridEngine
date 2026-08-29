import { Select, Text, Theme } from "@radix-ui/themes";
import { gridRadixTheme } from "../../theme/radixTheme";
import type { EditorProps } from "./createCustomCell";
import type { EnumCellData } from "./enumCell";
import { enumColorOf } from "./enumChoices";
import { SoftBadge } from "./softBadgeView";

/**
 * Sentinel item value for the "clear" option in a nullable Select. Radix
 * reserves the empty string for items, so a non-empty sentinel is required.
 */
const NONE_VALUE = "__none__";

/**
 * The overlay editor for a `dg:enum` cell.
 *
 * Its own file so `enumCell.tsx` exports no component. The choices come off
 * `value.options`, so one editor serves every enum column — where each enum
 * column used to need a `kind` of its own for glide's `isMatch` to route by.
 */
export const EnumCellEditor = ({ value, onFinishedEditing }: EditorProps<EnumCellData>) => {
  const { choices, nullable = false } = value.options;

  const handleValueChange = (next: string) => {
    onFinishedEditing({ ...value, value: next === NONE_VALUE ? null : Number(next) });
  };

  return (
    <Theme {...gridRadixTheme()}>
      <Select.Root
        // `undefined` (not "null") leaves the Select with nothing selected so
        // the placeholder shows for an unset cell.
        value={value.value == null ? undefined : String(value.value)}
        onValueChange={handleValueChange}
        defaultOpen
      >
        <Select.Trigger variant="soft" placeholder="—" />
        {/*
          The dropdown is PORTALLED out of the cell overlay, so glide sees a
          press on an option as a click outside the editor. Its outside-click
          handler runs on `pointerdown`, in the capture phase, which is before
          the Select decides anything on `pointerup` — so the overlay closed
          and the choice was thrown away. Only the keyboard worked, because it
          never presses a pointer.

          `click-outside-ignore` is glide's own escape hatch for exactly this:
          it walks up from whatever was pressed and stops if it finds the
          class. See `internal/click-outside-container`.
        */}
        <Select.Content position="popper" className="click-outside-ignore">
          {nullable && (
            <Select.Item value={NONE_VALUE}>
              <Text color="gray">None</Text>
            </Select.Item>
          )}
          {choices.map((choice) => (
            <Select.Item key={choice.value} value={String(choice.value)}>
              <SoftBadge color={enumColorOf(choices, choice.value)} label={choice.label} />
            </Select.Item>
          ))}
        </Select.Content>
      </Select.Root>
    </Theme>
  );
};
