# CLAUDE.md

Read `CONTEXT.md` for the vocabulary. Every term in it has one meaning.

## UI is Radix Themes

Build every DOM-rendered control out of `@radix-ui/themes` components —
`Button`, `Spinner`, `Popover`, `Checkbox`, `Text`, and the rest. Reach for the
Radix component first and check its API before writing markup; a hand-rolled
`<button>` or `<div role="dialog">` is a bug in this codebase, not a shortcut.

Radix Themes is a peer dependency, so the host app supplies it and we cost them
no extra bytes by using more of it.

### Where the escape hatches actually are

- **Canvas cells.** Cells inside `@glideapps/glide-data-grid` are painted on a
  `<canvas>`, so no DOM component reaches them. Draw those by hand. Their
  _editors_ are real DOM and stay Radix.
- **Third-party pickers.** `react-day-picker`, `react-number-format`, and
  `react-phone-number-input` fill gaps Radix has no component for. Wrap them in
  Radix layout and Radix tokens so they match.

### Layout and colour

Tailwind utilities carry layout only, and every one is `dg:`-prefixed
(`dg:flex`, `dg:gap-2`). Colour comes from Radix tokens written as arbitrary
values — `dg:text-[var(--gray-11,#60646c)]` — never from a Tailwind palette
colour.

Using a Radix colour scale for the first time means adding its token CSS to
`src/theme/radixStyles.ts`, and adding the scale to `RADIX_BADGE_SCALES` in
`src/lib/grid/radixBadgePalette.ts` when a badge uses it. The two lists stay in
sync; a missing import warns at runtime.

## Appearance

The engine reads light or dark. It never decides it.
