import { forwardRef, type InputHTMLAttributes } from "react";
import { cx } from "../../lib/utils";

/**
 * Everything the field looks like regardless of validity.
 *
 * The colours are Radix tokens with a literal fallback. The fallback matters:
 * a cell editor portals out of the host's tree, and if it landed somewhere with
 * no <Theme> above it the var would resolve to nothing and the input would
 * render borderless and transparent.
 */
const BASE =
  "dg:box-border dg:flex dg:h-9 dg:rounded-md dg:border dg:px-3 dg:py-1 dg:text-sm " +
  "dg:bg-[var(--color-panel-solid,#fff)] dg:text-[var(--gray-12,#18181b)] " +
  "dg:outline-none dg:disabled:cursor-not-allowed dg:disabled:opacity-50";

/*
 * The two states are written as WHOLE alternatives rather than a base plus an
 * override, because Tailwind orders its output by utility, not by the order
 * class names appear on the element. `border-gray-7` and `border-red-9` are the
 * same utility, so which one won would be decided by the generated stylesheet,
 * not by this file. Mutually exclusive strings take that decision back.
 */
const VALID =
  "dg:border-[var(--gray-7,#d4d4d8)] " +
  "dg:focus-visible:shadow-[0_0_0_2px_var(--accent-8,#6366f1)]";

const INVALID =
  "dg:border-[var(--red-9,#e5484d)] " + "dg:focus-visible:shadow-[0_0_0_2px_var(--red-8,#eb8e90)]";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  /** Draw the field in its error colours. */
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, invalid = false, ...props }, ref) => (
    <input
      ref={ref}
      type={type}
      className={cx(BASE, invalid ? INVALID : VALID, className)}
      {...props}
    />
  ),
);
Input.displayName = "Input";
