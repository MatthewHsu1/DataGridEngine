/**
 * Join class names, skipping anything falsy.
 *
 * Deliberately not `clsx` + `tailwind-merge`. This package DOES ship Tailwind
 * utilities, but every one of them is `dg:`-prefixed and the stylesheet is
 * generated at build time from `src/datagrid.src.css`, so a host app's own
 * Tailwind and ours cannot collide — and `tailwind-merge` would not recognise
 * the prefix anyway.
 *
 * De-conflicting inside this package is handled at the source instead: where
 * two states set the same property, the components pick ONE whole string rather
 * than layering an override on a base (see `components/ui/input.tsx`). Tailwind
 * orders its output by utility, not by the order class names appear on an
 * element, so an override written that way would be decided by the generated
 * stylesheet rather than by the component.
 *
 * A host app is still free to pass its own classes in through `className`.
 */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
