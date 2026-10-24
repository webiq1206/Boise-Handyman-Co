/**
 * Unproven founding year for Boise Handyman Co. The year stays in this file.
 * SHOW_FOUNDING_YEAR defaults to hidden, so published fields stay empty until
 * the flag is turned on.
 */
export const UNPROVEN_FOUNDING_YEAR = "2020";

/** Flip only after a documented founding year exists for this company. */
export const SHOW_FOUNDING_YEAR = false;

export function publishedFoundingYear(): string {
  return SHOW_FOUNDING_YEAR ? UNPROVEN_FOUNDING_YEAR : "";
}

/** Whole years since the unproven year. Null while the claim is hidden. */
export function yearsInBusiness(now: Date = new Date()): number | null {
  if (!SHOW_FOUNDING_YEAR) return null;
  return now.getFullYear() - Number(UNPROVEN_FOUNDING_YEAR);
}
