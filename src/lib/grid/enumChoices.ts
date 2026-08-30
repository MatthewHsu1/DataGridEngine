import { radixColorByIndex, type RadixColor } from "./radixBadgePalette";

/**
 * What a `dg:enum` column can hold, and how each value is coloured.
 *
 * Its own module because three places need it and two of them draw: the cell,
 * its editor, and the group header. Keeping it here is what stops
 * `enumCell.tsx` and `enumCellEditor.tsx` importing each other's VALUES, which
 * is a cycle a bundler is free to order the wrong way round.
 */

/** One selectable enum value: numeric value, label, and an optional color override. */
export interface EnumOption {
  value: number;
  label: string;
  color?: RadixColor;
}

/** Per-column settings for a `dg:enum` column, written on the column's `options`. */
export interface EnumCellOptions {
  /**
   * Every value this column can hold. Colors default to
   * `radixColorByIndex(value)` and are overridable per choice.
   */
  choices: EnumOption[];

  /** Allow an empty cell, which the editor offers as a "None" item. */
  nullable?: boolean;
}

interface ResolvedOption {
  label: string;
  color: RadixColor;
}

/**
 * The label and colour one value draws with.
 *
 * A value no choice names is not an error: it draws as itself, in the colour
 * its number indexes, which is more use than a blank cell when a server adds a
 * value before the client hears about it.
 */
export function resolveEnumOption(choices: readonly EnumOption[], value: number): ResolvedOption {
  const found = choices.find((c) => c.value === value);

  if (found === undefined) {
    return { label: String(value), color: radixColorByIndex(value) };
  }

  return { label: found.label, color: found.color ?? radixColorByIndex(found.value) };
}

/**
 * The Radix scale one enum value draws in: the choice's own override, or the
 * palette entry its value indexes.
 *
 * The group header reads it too. Grouping by an enum column makes the header's
 * name take the colour of the badges under it, and both sides have to answer
 * from the same place — see `groupColumnColor`.
 */
export function enumColorOf(choices: readonly EnumOption[], value: number): RadixColor {
  return resolveEnumOption(choices, value).color;
}
