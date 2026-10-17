/**
 * Google Ads conversion helpers shared by every lead path on this site.
 *
 * The contact form sends "P5 Raw Form Submitted" only. An estimator finish
 * sends "P5 Estimator Completed" once for that key, and also sends the form
 * label once for the same key when the finish created a lead. Values are the
 * per-lead estimates agreed with P5 on 14 Sept 2026 (form fallback in Google
 * Ads is $50). Enhanced user_data is a field on those Ads conversion events
 * only, and only when the finish created a lead that is not suppressed.
 * There is no global gtag('set','user_data'), so the GA4 tag cannot collect it.
 */
import { SITE_CONFIG } from "@/shared/siteConfig";

export const GOOGLE_ADS_ID = "AW-18354188204";
export const GOOGLE_ADS_LEAD_LABEL = "AW-18354188204/LE2vCPXstO8cEKzf-q9E";
/** Estimator submit and intake completion. */
export const GOOGLE_ADS_ESTIMATOR_LABEL = "AW-18354188204/cEzmCPOagKAdEKzf-q9E";
/** "P5 Website Call (60s+)": swaps the visible number for a Google forwarding number. */
export const GOOGLE_ADS_WEBSITE_CALL_LABEL = "AW-18354188204/YHR0CIaPz_ccEKzf-q9E";
/** Click on a tel: link to the published number. One conversion per click. */
export const GOOGLE_ADS_CALL_CLICK_LABEL = "AW-18354188204/ng9fCPiOhaAdEKzf-q9E";
/** Click on an sms: link to the published number. One conversion per click. */
export const GOOGLE_ADS_TEXT_CLICK_LABEL = "AW-18354188204/lTxsCOqahaAdEKzf-q9E";
export const GOOGLE_ADS_PHONE_DISPLAY = "(208) 477-1169";
/** sessionStorage key written by GoogleAnalytics.tsx on the first page view. */
export const ENTRY_PATH_KEY = "p5_entry_path";

export interface LeadContext {
  /** Unified estimator service id (e.g. "re10", "cabinet-install"). */
  service?: string;
  /** Consultation form project type. */
  projectType?: string;
  /** Collected contact fields. Street address and free text are never accepted. */
  email?: string;
  phone?: string;
  name?: string;
  postalCode?: string;
  /** Server decision from the submit response. False skips user_data only. */
  allowEnhancedConversions?: boolean;
  /**
   * Estimator finishes only. False is a finish that did not create a lead, so
   * only the estimator label is sent and user_data is omitted. Omitted still
   * sends the form label: the shared estimator does not pass this flag.
   */
  acceptedLead?: boolean;
}

export interface EnhancedConversionUserData {
  email?: string;
  phone_number?: string;
  address?: {
    first_name?: string;
    last_name?: string;
    postal_code?: string;
    country: "US";
  };
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
const pendingGtagRetries = new Set<string>();
const DRAFT_STORAGE_PREFIX = "p5-project-draft-v2";

/** Twenty attempts, 500ms apart: 10 seconds. */
export const GTAG_RETRY_LIMIT = 20;
export const GTAG_RETRY_MS = 500;

type GtagFn = (...args: unknown[]) => void;

export function readGtag(): GtagFn | null {
  if (typeof window === "undefined") return null;
  const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
  return typeof gtag === "function" ? gtag : null;
}

/**
 * Returns gtag when it is already loaded. Otherwise schedules one retry chain
 * for this key and returns null. The sent marker must not be written by the caller
 * until this returns a function. A second call with the same key does not start
 * another timer. Storage and timer failures are ignored.
 */
export function gtagOrRetry(key: string, retryCount: number, again: (nextRetry: number) => void): GtagFn | null {
  try {
    const gtag = readGtag();
    if (gtag) {
      pendingGtagRetries.delete(key);
      return gtag;
    }
    if (retryCount >= GTAG_RETRY_LIMIT) {
      pendingGtagRetries.delete(key);
      return null;
    }
    if (retryCount === 0 && pendingGtagRetries.has(key)) return null;
    pendingGtagRetries.add(key);
    window.setTimeout(() => {
      try {
        pendingGtagRetries.delete(key);
        again(retryCount + 1);
      } catch {
        pendingGtagRetries.delete(key);
      }
    }, GTAG_RETRY_MS);
    return null;
  } catch {
    return null;
  }
}

function isEstimatorFinishKey(dedupeKey: string | undefined): dedupeKey is string {
  return !!dedupeKey && (dedupeKey.startsWith("intake:") || dedupeKey.startsWith("estimator:"));
}

function alreadySent(storageKey: string): boolean {
  if (sentLeadKeys.has(storageKey)) return true;
  try {
    return window.sessionStorage.getItem(storageKey) === "sent";
  } catch {
    return false;
  }
}

function markSent(storageKey: string) {
  sentLeadKeys.add(storageKey);
  try {
    window.sessionStorage.setItem(storageKey, "sent");
  } catch {
    // Ignore; the in-memory guard covers this page load.
  }
}

/** US phone as E.164. Anything that is not 10 digits is omitted. */
export function enhancedPhoneNumber(phone?: string): string | undefined {
  const digits = (phone ?? "").replace(/\D/g, "");
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (national.length !== 10) return undefined;
  return `+1${national}`;
}

/** Trim and lowercase. Empty mail is omitted. */
export function enhancedEmail(email?: string): string | undefined {
  const normalized = email?.trim().toLowerCase() ?? "";
  return normalized || undefined;
}

function postalCode(value?: string): string | undefined {
  const match = (value ?? "").trim().match(/^(\d{5})(?:-\d{4})?$/);
  return match?.[1];
}

function splitName(name?: string): { first_name?: string; last_name?: string } {
  const cleaned = (name ?? "").trim().replace(/\s+/g, " ");
  if (!cleaned) return {};
  const [first, ...rest] = cleaned.split(" ");
  return rest.length ? { first_name: first, last_name: rest.join(" ") } : { first_name: first };
}

/** Fields the lead actually collected. No street, city, description, or message. */
export function enhancedConversionUserData(input: Pick<LeadContext, "email" | "phone" | "name" | "postalCode"> = {}): EnhancedConversionUserData | null {
  const data: EnhancedConversionUserData = {};
  const email = enhancedEmail(input.email);
  const phone = enhancedPhoneNumber(input.phone);
  if (email) data.email = email;
  if (phone) data.phone_number = phone;
  const address: NonNullable<EnhancedConversionUserData["address"]> = { country: "US" };
  const name = splitName(input.name);
  if (name.first_name) address.first_name = name.first_name;
  if (name.last_name) address.last_name = name.last_name;
  const zip = postalCode(input.postalCode);
  if (zip) address.postal_code = zip;
  if (address.first_name || address.last_name || address.postal_code) data.address = address;
  return data.email || data.phone_number || data.address ? data : null;
}

function draftIdFromTransaction(transactionId?: string): string | undefined {
  return transactionId?.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i)?.[0];
}

/** Estimator submits do not pass contact fields. Read the saved draft contact only. */
function contactFromStoredDraft(transactionId?: string): Pick<LeadContext, "email" | "phone" | "name"> {
  const id = draftIdFromTransaction(transactionId);
  const storage = typeof window === "undefined" ? undefined : window.localStorage;
  if (!id || !storage) return {};
  try {
    for (let index = 0; index < storage.length; index += 1) {
      const key = storage.key(index);
      if (!key?.startsWith(DRAFT_STORAGE_PREFIX)) continue;
      const draft = JSON.parse(storage.getItem(key) || "null") as { id?: string; contact?: { name?: unknown; email?: unknown; phone?: unknown } } | null;
      if (!draft || draft.id !== id || !draft.contact) continue;
      const { name, email, phone } = draft.contact;
      return {
        name: typeof name === "string" ? name : undefined,
        email: typeof email === "string" ? email : undefined,
        phone: typeof phone === "string" ? phone : undefined,
      };
    }
  } catch {
    // A bad draft must not block the conversion.
  }
  return {};
}

function resolveEnhancedContact(ctx: LeadContext, transactionId?: string): Pick<LeadContext, "email" | "phone" | "name" | "postalCode"> {
  const stored = contactFromStoredDraft(transactionId);
  return {
    email: ctx.email ?? stored.email,
    phone: ctx.phone ?? stored.phone,
    name: ctx.name ?? stored.name,
    postalCode: ctx.postalCode,
  };
}

/** user_data rides on the AW conversion event. It is never a global gtag set. */
function scopedAdsConversion<T extends Record<string, unknown>>(params: T, userData: EnhancedConversionUserData | null): T & { user_data?: EnhancedConversionUserData } {
  return userData ? { ...params, user_data: userData } : params;
}

/** The submit response cookie is how the shared estimator learns the server decision. */
export function allowEnhancedConversionsFromCookie(): boolean {
  const header = typeof document === "undefined" ? "" : document.cookie;
  const match = header.match(/(?:^|; )p5_allow_enhanced=([^;]*)/);
  if (!match) return true;
  return decodeURIComponent(match[1]) !== "0";
}

function userDataAllowed(ctx: LeadContext): boolean {
  if (ctx.allowEnhancedConversions === false) return false;
  if (ctx.allowEnhancedConversions === true) return true;
  return allowEnhancedConversionsFromCookie();
}

/** Webdriver and the QA disable flag block tracking. A missing gtag does not: that path waits. */
function adsTrackingBlocked(): boolean {
  if (typeof navigator !== "undefined" && navigator.webdriver === true) return true;
  try {
    if (window.sessionStorage.getItem("p5_analytics_disabled") === "1") return true;
  } catch {
    // The bootstrap still loads the tag when storage throws.
  }
  return false;
}

/**
 * Fires the Google Ads conversion for this key. Estimator finish keys
 * ("intake:" or "estimator:") send the estimator label once per key. They also
 * send the form label once per key, with transaction_id equal to the key,
 * unless acceptedLead is false. Every other key sends the form label only.
 * user_data is copied onto each of those Ads events only when the finish
 * created a lead and the server allows it. If gtag is not ready, waits up to
 * 10 seconds. Returns true when at least one label was sent.
 */
export function trackGoogleAdsLeadConversion(
  ctx: LeadContext = {},
  dedupeKey?: string,
  retryCount = 0,
): boolean {
  if (typeof window === "undefined" || adsTrackingBlocked()) return false;
  try {
    const retryKey = dedupeKey ?? "google_ads_lead:conversion";
    const pending: { storageKey: string; params: Record<string, unknown> }[] = [];
    if (isEstimatorFinishKey(dedupeKey)) {
      const estimatorStorage = `google_ads_estimator:${dedupeKey}`;
      if (!alreadySent(estimatorStorage)) {
        pending.push({
          storageKey: estimatorStorage,
          params: { send_to: GOOGLE_ADS_ESTIMATOR_LABEL, transaction_id: dedupeKey },
        });
      }
      if (ctx.acceptedLead !== false) {
        const leadStorage = `google_ads_lead:${dedupeKey}`;
        if (!alreadySent(leadStorage)) {
          pending.push({ storageKey: leadStorage, params: googleAdsLeadParams(ctx, dedupeKey) });
        }
      }
    } else {
      const leadStorage = dedupeKey ? `google_ads_lead:${dedupeKey}` : "google_ads_lead:conversion";
      if (!alreadySent(leadStorage)) {
        pending.push({ storageKey: leadStorage, params: googleAdsLeadParams(ctx, dedupeKey) });
      }
    }
    if (!pending.length) return false;
    const gtag = gtagOrRetry(retryKey, retryCount, (next) => {
      trackGoogleAdsLeadConversion(ctx, dedupeKey, next);
    });
    if (!gtag) return false;
    const accepted = !isEstimatorFinishKey(dedupeKey) || ctx.acceptedLead !== false;
    const userData = accepted && userDataAllowed(ctx) ? enhancedConversionUserData(resolveEnhancedContact(ctx, dedupeKey)) : null;
    for (const label of pending) {
      gtag("event", "conversion", scopedAdsConversion(label.params, userData));
      markSent(label.storageKey);
    }
    return true;
  } catch {
    return false;
  }
}

function nationalDigits(value: string): string {
  const digits = value.replace(/\D/g, "");
  return digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
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

/**
 * Ads label for a tel: or sms: href to this site's published number.
 * A customer's number on an admin screen is not an ad click.
 */
export function googleAdsContactClickLabel(href: string): string | null {
  const bare = href.trim().split("?")[0].toLowerCase();
  const kind = bare.startsWith("tel:") ? "call" : bare.startsWith("sms:") ? "text" : null;
  if (!kind) return null;
  if (nationalDigits(bare) !== nationalDigits(SITE_CONFIG.phoneTel)) return null;
  return kind === "call" ? GOOGLE_ADS_CALL_CLICK_LABEL : GOOGLE_ADS_TEXT_CLICK_LABEL;
}

/**
 * One conversion for this click. The next click fires again. No session dedupe.
 * No-op when the tag bootstrap would not have loaded gtag.
 */
export function trackGoogleAdsContactClick(href: string): boolean {
  const sendTo = googleAdsContactClickLabel(href);
  if (!sendTo || !adsClickAllowed()) return false;
  const gtag = (window as unknown as { gtag: (...args: unknown[]) => void }).gtag;
  gtag("event", "conversion", { send_to: sendTo });
  return true;
}
