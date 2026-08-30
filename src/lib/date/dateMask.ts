/**
 * The MM/DD/YYYY input mask, expressed as the eight bare digits the mask holds.
 * Pure and grid-agnostic: the calendar side of the picker speaks local-midnight
 * `Date`s (see `isoToCalendarDate` / `composeIso` in `dateUtils`), so these two
 * translate the typed digits to and from exactly that.
 */

/** How many digits a complete MM/DD/YYYY mask holds. */
export const MASK_LENGTH = 8;

/**
 * Digits typed into an MM/DD/YYYY mask → a local-midnight Date, or undefined
 * when the mask is incomplete or names a day that does not exist. A partially
 * typed date is deliberately `undefined` rather than a guess: the picker leaves
 * the calendar alone until the user has typed a real day.
 */
export function maskToDate(digits: string): Date | undefined {
  if (digits.length !== MASK_LENGTH || !/^\d{8}$/.test(digits)) {
    return undefined;
  }

  const month = Number(digits.slice(0, 2));
  const day = Number(digits.slice(2, 4));
  const year = Number(digits.slice(4, 8));

  const date = new Date(year, month - 1, day);

  // Rejects both out-of-range parts and overflow days (Feb 30 → Mar 2), since
  // the Date constructor silently rolls those forward.
  if (date.getFullYear() !== year || date.getMonth() !== month - 1 || date.getDate() !== day) {
    return undefined;
  }

  return date;
}

/** A local-midnight calendar Date → the eight mask digits, or "" for no date. */
export function dateToMask(date: Date | undefined): string {
  if (!date || isNaN(date.getTime())) {
    return "";
  }

  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const year = String(date.getFullYear()).padStart(4, "0");

  return `${month}${day}${year}`;
}
