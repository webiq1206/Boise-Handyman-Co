/**
 * Unproven founding year for Boise Handyman Co. Idaho SOS shows P5 Home Co. LLC
 * filed 09/25/2025, so nothing documents 2020. The year stays in this file.
 * SHOW_FOUNDING_YEAR defaults to hidden, and every public phrase is empty
 * until that flag is turned on.
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

/** Phrases that must not render while SHOW_FOUNDING_YEAR is false. */
export function publicFoundingClaims(now: Date = new Date()): string[] {
  if (!SHOW_FOUNDING_YEAR) return [];
  const year = UNPROVEN_FOUNDING_YEAR;
  const years = yearsInBusiness(now);
  return [
    `Est. ${year}`,
    `founded in ${year}`,
    `since ${year}`,
    ...(years === null ? [] : [`${years} years in business`]),
  ];
}
