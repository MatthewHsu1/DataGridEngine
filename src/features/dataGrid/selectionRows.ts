import { displayRowsOfData, type DisplayModel } from "./displayModel";

/**
 * The display rows a set of selected KEYS is currently drawn at.
 *
 * Selection is stored by key and drawn by position, and this is the translation
 * between the two. Keeping the drawn set as positions instead is a bug with a
 * name in this codebase's glossary: "positions move; keys do not". Fold a group
 * above a selected row and every row below it shifts up, so a remembered
 * display row ends up ringing a different record — one the host was never told
 * about, because `selectedIds` had been right the whole time.
 *
 * A key the store cannot place is left out. That is a row evicted from the
 * cache or excluded by a collapse: still selected, still in `selectedIds`, just
 * not on screen to draw a ring around. It comes back when its rows do.
 */
export function selectedDisplayRows<TGroup, TKey extends string | number>(
  selectedIds: readonly TKey[],
  indexOfKey: (key: TKey) => number | undefined,
  model: DisplayModel<TGroup>,
): number[] {
  const dataIndexes: number[] = [];

  for (const key of selectedIds) {
    const index = indexOfKey(key);

    if (index !== undefined) {
      dataIndexes.push(index);
    }
  }

  return displayRowsOfData(model, dataIndexes);
}
