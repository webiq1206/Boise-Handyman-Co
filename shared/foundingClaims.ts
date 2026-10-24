import { SHOW_FOUNDING_YEAR } from "@/shared/foundingYear";

export {
  SHOW_FOUNDING_YEAR,
  UNPROVEN_FOUNDING_YEAR,
  publishedFoundingYear,
  yearsInBusiness,
} from "@/shared/foundingYear";

const HIDDEN_FOUNDING_PHRASES = [
  "since 2020",
  "founded in 2020",
  "EST 2020",
  "Est. 2020",
] as const;

/** Phrases that must not render while SHOW_FOUNDING_YEAR is false. */
export function publicFoundingClaims(): string[] {
  if (!SHOW_FOUNDING_YEAR) return [];
  return ["since 2020", "founded in 2020", "EST 2020"];
}

/** Trust strip plus any founding phrases the flag currently allows. */
export function visibleTrustItems(items: readonly string[]): string[] {
  return [...publicFoundingClaims(), ...items];
}

/** Drop hidden founding phrases from a string. The source text stays put. */
export function omitHiddenFoundingClaims(text: string): string {
  if (SHOW_FOUNDING_YEAR) return text;
  let next = text;
  for (const phrase of HIDDEN_FOUNDING_PHRASES) {
    next = next.split(phrase).join("");
  }
  return next;
}
