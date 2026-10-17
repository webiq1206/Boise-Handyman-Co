/**
 * Google Ads conversion helpers shared by every lead path on this site.
 *
 * One Google Ads conversion action ("P5 Raw Form Submitted") receives every
 * accepted lead, with a per-lead value so Google Ads can report ROAS by
 * campaign. Values are the per-lead estimates agreed with P5 on 14 Sept 2026
 * (form fallback in Google Ads is $50). Never pass PII here: no names, phones,
 * emails or free text - only a service/project category and an opaque id.
 */
export const GOOGLE_ADS_ID = "AW-18354188204";
export const GOOGLE_ADS_LEAD_LABEL = "AW-18354188204/LE2vCPXstO8cEKzf-q9E";
/** "P5 Website Call (60s+)": swaps the visible number for a Google forwarding number. */
export const GOOGLE_ADS_WEBSITE_CALL_LABEL = "AW-18354188204/YHR0CIaPz_ccEKzf-q9E";
/** Click on a tel: link, including a Google forwarding number. Separate from the 60-second call action. */
export const GOOGLE_ADS_CALL_CLICK_LABEL = "AW-18354188204/ng9fCPiOhaAdEKzf-q9E";
/** Click on an sms: link. */
export const GOOGLE_ADS_TEXT_CLICK_LABEL = "AW-18354188204/lTxsCOqahaAdEKzf-q9E";
export const GOOGLE_ADS_PHONE_DISPLAY = "(208) 477-1169";
/** sessionStorage key written by GoogleAnalytics.tsx on the first page view. */
export const ENTRY_PATH_KEY = "p5_entry_path";

export interface LeadContext {
  /** Unified estimator service id (e.g. "re10", "cabinet-install"). */
  service?: string;
  /** Consultation form project type. */
  projectType?: string;
}

export type GoogleAdsLeadParams = {
  send_to: string;
  value: number;
  currency: "USD";
  transaction_id?: string;
};

/** The path the visitor landed on, which is what the ad campaign controls. */
export function readEntryPath(): string {
  if (typeof window === "undefined") return "";
  try {
    return window.sessionStorage.getItem(ENTRY_PATH_KEY) ?? window.location.pathname;
  } catch {
    return window.location.pathname;
  }
}

/** Per-lead value in USD for this site (brand: handyman). */
export function googleAdsLeadValue(ctx: LeadContext = {}): number {
  // RE-10 / inspection-repair leads (agent-driven, larger scopes) are worth
  // more than a single handyman task.
  const entry = readEntryPath();
  if (ctx.service === "re10" || entry.startsWith("/re-10")) return 75;
  return 50;
}

export function googleAdsLeadParams(
  ctx: LeadContext = {},
  transactionId?: string,
): GoogleAdsLeadParams {
  const params: GoogleAdsLeadParams = {
    send_to: GOOGLE_ADS_LEAD_LABEL,
    value: googleAdsLeadValue(ctx),
    currency: "USD",
  };
  if (transactionId) params.transaction_id = transactionId;
  return params;
}

const sentLeadKeys = new Set<string>();

/**
 * Fires the Google Ads lead conversion once per dedupe key (per page load and,
 * where storage allows, per browser session). Returns true when it was sent.
 */
export function trackGoogleAdsLeadConversion(ctx: LeadContext = {}, dedupeKey?: string): boolean {
  if (typeof window === "undefined") return false;
  const storageKey = dedupeKey ? `google_ads_lead:${dedupeKey}` : undefined;
  if (storageKey) {
    if (sentLeadKeys.has(storageKey)) return false;
    try {
      if (window.sessionStorage.getItem(storageKey) === "sent") return false;
    } catch {
      // Storage can be unavailable under strict privacy settings; the in-memory guard still applies.
    }
  }
  const gtag = (window as unknown as { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag !== "function") return false;
  if (storageKey) {
    sentLeadKeys.add(storageKey);
    try {
      window.sessionStorage.setItem(storageKey, "sent");
    } catch {
      // Ignore; in-memory guard is enough for this page load.
    }
  }
  gtag("event", "conversion", googleAdsLeadParams(ctx, dedupeKey));
  return true;
}

/** Same visitor gates as the tag bootstrap: no tag, a webdriver, or the QA disable flag. */
function adsClickAllowed(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof navigator !== "undefined" && navigator.webdriver === true) return false;
  try {
    if (window.sessionStorage.getItem("p5_analytics_disabled") === "1") return false;
  } catch {
    // The bootstrap still loads the tag when storage throws.
  }
  const gtag = (window as unknown as { gtag?: unknown }).gtag;
  return typeof gtag === "function";
}

/** Admin and portal screens dial customers, so those taps are not ad clicks. */
function staffContactPath(): boolean {
  if (typeof window === "undefined") return true;
  const path = window.location.pathname;
  return path === "/admin" || path.startsWith("/admin/") || path === "/portal" || path.startsWith("/portal/");
}

/**
 * Ads label for any tel: or sms: tap on a public page.
 * A Google forwarding number still counts: the href is not compared with the published number.
 */
export function googleAdsContactClickLabel(href: string): string | null {
  const bare = href.trim().split("?")[0].toLowerCase();
  const kind = bare.startsWith("tel:") ? "call" : bare.startsWith("sms:") ? "text" : null;
  if (!kind || staffContactPath()) return null;
  return kind === "call" ? GOOGLE_ADS_CALL_CLICK_LABEL : GOOGLE_ADS_TEXT_CLICK_LABEL;
}

/**
 * One conversion for this click. The next click fires again. No session dedupe.
 * The payload is only the send_to label: no name, phone, email, or form text.
 */
export function trackGoogleAdsContactClick(href: string): boolean {
  const sendTo = googleAdsContactClickLabel(href);
  if (!sendTo || !adsClickAllowed()) return false;
  const gtag = (window as unknown as { gtag: (...args: unknown[]) => void }).gtag;
  gtag("event", "conversion", { send_to: sendTo });
  return true;
}
