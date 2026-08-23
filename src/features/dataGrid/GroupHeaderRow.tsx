import { IconButton, Text } from "@radix-ui/themes";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { ReactNode } from "react";

/**
 * One group's header: the collapse control, the group's name, and whatever the
 * host wants to show for that group.
 *
 * It takes a resolved CSS colour rather than a Radix scale on purpose. The
 * scale-to-colour step reads CSS vars off the live Themes root, which is a
 * document lookup; keeping it outside leaves this a pure function of its props,
 * and that is what lets it be rendered in two very different places — a hole in
 * the grid canvas, and the bar above it — without either caring.
 */
export function GroupHeaderRow({
  label,
  textColor,
  background,
  markerWidth = 0,
  gutterRight = 0,
  collapsed,
  onToggle,
  children,
}: {
  label: string;

  /** Resolved CSS colour for the name. Omit to inherit. */
  textColor?: string;

  /**
   * Resolved CSS colour for the row's fill.
   *
   * Not decoration. The canvas goes on drawing a row marker on the header's
   * row, and this row floats over it, so without an opaque fill the checkbox
   * shows through the group's name.
   */
  background?: string;

  /** Width of the row marker the canvas draws, so the name starts clear of it. */
  markerWidth?: number;

  /** Room to leave at the right edge, for the grid's vertical scrollbar. */
  gutterRight?: number;

  collapsed: boolean;
  onToggle: () => void;

  /** The host's components for this group. */
  children?: ReactNode;
}) {
  const Icon = collapsed ? ChevronRight : ChevronDown;

  return (
    <div
      style={{
        // Inline, and not a utility class, because it is load-bearing rather
        // than styling: this package ships no CSS reset, so `box-sizing` is
        // the browser's `content-box`, and a full-width row would then be as
        // wide as the grid PLUS its padding — pushing whatever the host put on
        // the right off the edge.
        boxSizing: "border-box",
        backgroundColor: background,
        paddingLeft: markerWidth === 0 ? undefined : markerWidth,
        paddingRight: gutterRight === 0 ? undefined : gutterRight,
      }}
      className="dg:flex dg:h-full dg:w-full dg:items-center dg:gap-2 dg:px-3"
    >
      <IconButton
        type="button"
        size="1"
        variant="ghost"
        // Gray rather than the theme's accent. The chevron is furniture, not a
        // call to action, and its hover must not colour a header whose name is
        // already carrying the group's own colour.
        color="gray"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-label={`${collapsed ? "Expand" : "Collapse"} ${label}`}
        className="dg:shrink-0"
      >
        <Icon size={15} color={textColor} aria-hidden />
      </IconButton>

      <Text
        size="2"
        weight="bold"
        // The colour stays inline. It is a resolved CSS colour the host chose
        // per group, so no Radix `color` prop can name it.
        style={textColor === undefined ? undefined : { color: textColor }}
        className="dg:shrink-0 dg:whitespace-nowrap"
      >
        {label}
      </Text>

      {children !== undefined && (
        <div className="dg:ml-auto dg:flex dg:min-w-0 dg:items-center dg:gap-2">{children}</div>
      )}
    </div>
  );
}
