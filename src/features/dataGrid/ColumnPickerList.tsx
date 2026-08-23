import { Badge, Button, Checkbox, Flex, Text } from "@radix-ui/themes";
import { useId } from "react";

export interface PickerColumn {
  field: string;
  title: string;

  /** The grid is not drawing this column. */
  hidden: boolean;

  /**
   * The column cannot be hidden. Set for the column the grid groups by: the
   * banner would otherwise name a group with no column anywhere to point at.
   */
  locked?: boolean;
}

/**
 * The body of the column picker: one checkbox per column, plus a reset.
 *
 * Show and hide only. Reordering is already a drag on the column itself, and a
 * second way to do one thing is a second set of edge cases — a drag here and a
 * drag there disagreeing about where a column went.
 *
 * Split out of the popover it lives in so it can be tested without one; every
 * decision the picker makes is here, where a plain render reaches it.
 */
export function ColumnPickerList({
  columns,
  onToggle,
  onReset,
}: {
  columns: readonly PickerColumn[];
  onToggle: (field: string) => void;
  onReset: () => void;
}) {
  // Scoped per mount rather than per field. Field names are unique within a
  // grid but not across two grids on one page, and `aria-labelledby` resolves
  // against the whole document.
  const scope = useId();

  return (
    <Flex direction="column" minWidth="13rem">
      <Flex align="center" justify="between" gap="4" px="1" pb="1">
        <Text size="1" weight="bold">
          Columns
        </Text>

        <Button size="1" variant="ghost" onClick={onReset}>
          Reset
        </Button>
      </Flex>

      <Flex direction="column">
        {columns.map((c) => {
          const titleId = `${scope}-${c.field}-title`;
          const lockId = `${scope}-${c.field}-lock`;

          return (
            <Text key={c.field} as="label" size="2">
              <Flex align="center" gap="2" px="1" py="1">
                <Checkbox
                  size="1"
                  checked={!c.hidden}
                  disabled={c.locked === true}
                  onCheckedChange={() => onToggle(c.field)}
                  // The name has to carry the lock reason as well as the title,
                  // so the badge below is not the only place it is written.
                  aria-labelledby={c.locked === true ? `${titleId} ${lockId}` : titleId}
                />

                <span id={titleId}>{c.title}</span>

                {c.locked === true && (
                  <Badge id={lockId} size="1" color="gray" variant="soft" ml="auto">
                    Grouped by
                  </Badge>
                )}
              </Flex>
            </Text>
          );
        })}
      </Flex>
    </Flex>
  );
}
