import { Badge, Button, Text } from "@radix-ui/themes";
import { REGIONS } from "./api/types";

/**
 * What the demo hangs off each group header, to exercise
 * `grouping.header`.
 *
 * Deliberately DIFFERENT per region rather than one component parameterised by
 * it. The point of the hook is that a host can decide per group, and a single
 * shape for every group would not prove that.
 */
export function RegionHeader({ region }: { region: number }) {
  const label = REGIONS[region]?.label ?? String(region);

  if (region === 0) {
    return (
      <>
        <Text size="1" color="gray">
          Invoiced
        </Text>
        <Badge size="1" color="cyan" variant="soft">
          62%
        </Badge>
      </>
    );
  }

  if (region === 1) {
    return (
      <>
        <Text size="1" color="gray">
          Region value
        </Text>
        <Text size="2" weight="medium">
          $4,218,900
        </Text>
        <Button size="1" variant="soft" color="amber">
          {`Export ${label}`}
        </Button>
      </>
    );
  }

  return (
    <>
      <Badge size="1" color="red" variant="soft">
        3 price breaks
      </Badge>
      <Button size="1" variant="soft" color="plum">
        Review
      </Button>
    </>
  );
}
