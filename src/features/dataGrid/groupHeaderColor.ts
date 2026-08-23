import type { RadixColor } from "../../lib/grid/radixBadgePalette";
import { resolveRadixSoft } from "../../lib/grid/softBadge";

/**
 * The colour a group's name is written in.
 *
 * Step 11 is the label step of a Radix scale — the SAME step `drawSoftBadge`
 * fills its text with, which is what makes a group's header and the badges
 * under it agree. The var is read off the live Themes root, so it already
 * carries the current appearance; nothing here has to know whether it is light
 * or dark.
 *
 * `fallback` is used for a group that names no scale, and again for a scale
 * that resolves to nothing because its CSS was never imported (`softBadge` has
 * already warned by then). Falling back beats answering `""`, which a canvas
 * draws transparent and a stylesheet ignores.
 */
export function groupHeaderTextColor(
  color: RadixColor | undefined,
  fallback: string | undefined,
): string | undefined {
  if (color === undefined) {
    return fallback;
  }

  return resolveRadixSoft(color).text || fallback;
}
