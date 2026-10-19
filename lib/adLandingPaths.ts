/**
 * Pages Google Ads traffic lands on. Calls are the conversion that matters
 * most, so these pages show the Call action from the first screen.
 */
/** Paid-search funnel: no site navigation, its own Call/Text bar, slim footer. */
export const AD_FUNNEL_PATH = "/handyman";

/** Indexed pages ads also point at: the sticky Call bar shows on load, not after the hero. */
export const AD_LANDING_PATHS: readonly string[] = [
  "/",
  "/services/drywall-repair",
  "/services/home-maintenance",
  "/services/carpentry-trim-repair",
];

export function isAdFunnelPath(pathname: string | null | undefined): boolean {
  return pathname === AD_FUNNEL_PATH;
}

export function isAdLandingPath(pathname: string | null | undefined): boolean {
  return !!pathname && AD_LANDING_PATHS.includes(pathname);
}
