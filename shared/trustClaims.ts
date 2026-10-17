/**
 * Public trust wording for Boise Handyman Co.
 *
 * Idaho Registered Contractor #8381215 is proven: Sam verified an Active
 * General Contractor Registration on DOPL, issued 27-May-2026.
 * Unproven superlatives stay in source and do not render while
 * SHOW_TRUST_CLAIMS is false.
 */
export const CONTRACTOR_REGISTRATION = "Idaho Registered Contractor #8381215";

/**
 * Public search DOPL publishes on https://dopl.idaho.gov/ as
 * "Search for a License or Registration". GET returned HTTP 200.
 */
export const CONTRACTOR_REGISTRATION_SEARCH_URL =
  "https://edopl.idaho.gov/OnlineServices/?link=PubSearch";

/** Flip only after a documented source exists for the phrases below. */
export const SHOW_TRUST_CLAIMS = false;

/** Kept so the old self-claims are not deleted. They are not rendered. */
export const RETIRED_LICENSE_QUESTION = "Are you licensed and insured?";
export const RETIRED_REGISTRATION_ON_REQUEST =
  "Idaho contractor registration information is available upon request";
export const RETIRED_REGISTRATION_DETAILS =
  "Business registration and insurance details are available on request";
export const RETIRED_LICENSE_DETAILS = "Registration details available upon request";
export const RETIRED_ASSISTANT_LICENSE =
  "Licensing and insurance details available on request.";
export const RETIRED_OVERHEAD_NOTE =
  "Insurance, warranty, licensing, and the cost of running a licensed contractor.";

export const REGISTERED_CONTRACTOR_QUESTION = "Are you a registered contractor and insured?";
export const OVERHEAD_NOTE =
  "Insurance, warranty, contractor registration, and the cost of running a registered contractor.";

export const UNPROVEN_TRUST_COPY = [
  "top-rated",
  "top rated",
  "satisfaction guaranteed",
  "satisfaction guarantee",
] as const;

const HIDDEN_TRUST = [
  /\btop-rated\b/gi,
  /\btop rated\b/gi,
  /\bsatisfaction guaranteed\b/gi,
  /\bsatisfaction guarantee\b/gi,
];

/** Strip unproven trust phrases. The caller's source string stays in its file. */
export function publishedTrustCopy(text: string): string {
  if (SHOW_TRUST_CLAIMS) return text;
  let out = text;
  for (const pattern of HIDDEN_TRUST) out = out.replace(pattern, "");
  return out.replace(/[ \t]{2,}/g, " ").replace(/\s+([.,!;])/g, "$1").replace(/\.\s*\./g, ".").trim();
}
