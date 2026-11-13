/**
 * Sitewide conversion copy.
 *
 * Owner decision, 13 November 2026: the family's central estimator, framed at
 * /instant-estimate, is the primary pricing call to action on this site. It
 * shows a preliminary price range on screen, so "instant estimate" wording is
 * accurate; it is never a quote, a bid or a final price.
 *
 * The request form ("Send your list and photos", #consult) stays as the second
 * path: a written quote from a person.
 */
/** Header, mobile menu and sticky bar: short, it has to fit the header. */
export const CTA_ESTIMATE_SHORT = "Instant estimate";
/** Primary buttons in page content. */
export const CTA_ESTIMATE = "Get an instant estimate";
/** The page that frames the central estimator. */
export const ESTIMATE_HREF = "/instant-estimate";
/**
 * Service page slug to estimator project id. Every current service is priced
 * by the estimator's "handyman" project, the pick-your-jobs list. A service
 * that is not listed here keeps the request form as its primary: never send a
 * visitor to an estimator that cannot price their project.
 */
const SERVICE_ESTIMATOR_PROJECT: Record<string, string> = {
  "drywall-repair": "handyman",
  "painting-touch-ups": "handyman",
  "plumbing-repairs": "handyman",
  "electrical-repairs": "handyman",
  "carpentry-trim-repair": "handyman",
  "mounting-assembly": "handyman",
  "fence-deck-gutter-repair": "handyman",
  "home-maintenance": "handyman",
};
export function estimatorProjectForService(slug: string | null | undefined): string | null {
  return (slug && SERVICE_ESTIMATOR_PROJECT[slug]) || null;
}
/** The estimator page, opened on one project when the page maps to one. */
export function instantEstimateHref(project?: string | null): string {
  return project && /^[a-z0-9-]{1,40}$/.test(project) ? `${ESTIMATE_HREF}?project=${project}` : ESTIMATE_HREF;
}
/** The request form on the homepage; the contact page has its own (#consult). */
export const QUOTE_FORM_HREF = "/#consult";

/** The request form's label. It was the site primary until 13 November 2026. */
export const CTA_PRIMARY = "Send your list and photos";
export const CTA_PRIMARY_SHORT = "Send your list";
export const CTA_SECONDARY = "Request a quote";
export const CTA_SECONDARY_ALT = "Request a quote";
export const CTA_QUOTE = "Send your list and photos";

/** Request form: one short screen, one explicit send. */
export const CTA_FORM_SEND = "Send my list";
/** The same form in "Have us call you" mode. */
export const CTA_FORM_CALLBACK = "Request a call";
/** @deprecated Superseded by the single-step CTA_FORM_SEND. */
export const CTA_FORM_REVIEW = "Review my request";
/** @deprecated Superseded by the single-step CTA_FORM_SEND. */
export const CTA_FORM_CONFIRM = "Confirm and send";
