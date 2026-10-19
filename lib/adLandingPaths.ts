/**
 * Pages Google Ads traffic lands on. Calls are the conversion that matters
 * most, so these pages show the Call action from the first screen.
 */
/** Paid-search funnel: no site navigation, its own Call/Text bar, slim footer. */
export const AD_FUNNEL_PATH = "/handyman";

export function isAdFunnelPath(pathname: string | null | undefined): boolean {
  return pathname === AD_FUNNEL_PATH;
}
