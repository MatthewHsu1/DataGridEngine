/**
 * Join class names, skipping anything falsy.
 *
 * Deliberately not `clsx` + `tailwind-merge`: this package ships plain CSS
 * classes rather than Tailwind utilities (Tailwind builds its stylesheet by
 * scanning source, and never scans `node_modules`, so a utility class inside a
 * published package produces no CSS at all). With no utilities to de-conflict,
 * there is nothing for `tailwind-merge` to do — and a host app is still free to
 * pass its own Tailwind classes in through `className`.
 */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
