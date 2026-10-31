/**
 * Pages Google Ads traffic lands on. Calls are the conversion that matters
 * most, so these pages show the Call action from the first screen.
 */
/** Paid-search funnel: no site navigation, its own Call/Text bar, slim footer. */
export const AD_FUNNEL_PATH = "/handyman";

/**
 * Indexed pages Google Ads traffic lands on (owner, 19 and 27 October 2026).
 * Their hero stays call-first: the filled Call button (or Call Us / Text Us on
 * the two paid service landings) comes before the request actions. Every other
 * service, city and area page leads with the site primary, "Send your list and
 * photos", and carries the phone as a text link. tests/ad-landing-hero.test.ts
 * pins both behaviours.
 */
export const AD_CALL_FIRST_PATHS: readonly string[] = [
  "/services/drywall-repair",
  "/services/home-maintenance",
  "/services/carpentry-trim-repair",
];

export function isAdCallFirstPath(pathname: string | null | undefined): boolean {
  return !!pathname && AD_CALL_FIRST_PATHS.includes(pathname.replace(/\/$/, "") || "/");
}

export function isAdFunnelPath(pathname: string | null | undefined): boolean {
  return pathname === AD_FUNNEL_PATH;
}
