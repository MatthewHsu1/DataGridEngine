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
  collapsed,
  onToggle,
  children,
}: {
  label: string;

  /** Resolved CSS colour for the name. Omit to inherit. */
  textColor?: string;

  collapsed: boolean;
  onToggle: () => void;

  /** The host's components for this group. */
  children?: ReactNode;
}) {
  const Icon = collapsed ? ChevronRight : ChevronDown;

  return (
    <div className="dg:flex dg:h-full dg:w-full dg:items-center dg:gap-2 dg:px-3">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={!collapsed}
        aria-label={`${collapsed ? "Expand" : "Collapse"} ${label}`}
        className="dg:flex dg:size-6 dg:shrink-0 dg:cursor-pointer dg:items-center dg:justify-center dg:rounded dg:border-none dg:bg-transparent dg:p-0 dg:hover:bg-[var(--gray-a3,rgba(0,0,0,0.06))]"
      >
        <Icon size={15} color={textColor} aria-hidden />
      </button>

      <span
        style={textColor === undefined ? undefined : { color: textColor }}
        className="dg:shrink-0 dg:text-sm dg:font-semibold dg:whitespace-nowrap"
      >
        {label}
      </span>

      {children !== undefined && (
        <div className="dg:ml-auto dg:flex dg:min-w-0 dg:items-center dg:gap-2">{children}</div>
      )}
    </div>
  );
}
