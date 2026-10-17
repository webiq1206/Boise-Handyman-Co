/**
 * Google Ads conversion helpers shared by every lead path on this site.
 *
 * One Google Ads conversion action ("P5 Raw Form Submitted") receives every
 * accepted lead, with a per-lead value so Google Ads can report ROAS by
 * campaign. Values are the per-lead estimates agreed with P5 on 14 Sept 2026
 * (form fallback in Google Ads is $50). The conversion parameters stay limited
 * to a service category and an opaque transaction id. Enhanced conversions
 * attach user_data to that Ads conversion event only. There is no global
 * gtag('set','user_data'), so the GA4 tag cannot collect it.
 */
export const GOOGLE_ADS_ID = "AW-18354188204";
export const GOOGLE_ADS_LEAD_LABEL = "AW-18354188204/LE2vCPXstO8cEKzf-q9E";
/** "P5 Website Call (60s+)": swaps the visible number for a Google forwarding number. */
export const GOOGLE_ADS_WEBSITE_CALL_LABEL = "AW-18354188204/YHR0CIaPz_ccEKzf-q9E";
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
const DRAFT_STORAGE_PREFIX = "p5-project-draft-v2";

/** Same gates as the tag bootstrap: no tag, a webdriver, or an explicit QA disable. */
export function googleTagAllowed(): boolean {
  if (typeof window === "undefined") return false;
  const gtag = (window as unknown as { gtag?: unknown }).gtag;
  if (typeof gtag !== "function") return false;
  if (typeof navigator !== "undefined" && navigator.webdriver === true) return false;
  try {
    if (window.sessionStorage.getItem("p5_analytics_disabled") === "1") return false;
  } catch {
    // The bootstrap still loads the tag when storage throws.
  }
  return true;
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
function scopedAdsConversion(params: GoogleAdsLeadParams, userData: EnhancedConversionUserData | null): GoogleAdsLeadParams & { user_data?: EnhancedConversionUserData } {
  return userData ? { ...params, user_data: userData } : params;
}

function fireEnhancedLead(ctx: LeadContext, transactionId?: string): void {
  const gtag = (window as unknown as { gtag: (...args: unknown[]) => void }).gtag;
  const userData = enhancedConversionUserData(resolveEnhancedContact(ctx, transactionId));
  gtag("event", "conversion", scopedAdsConversion(googleAdsLeadParams(ctx, transactionId), userData));
}

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
  if (!googleTagAllowed()) return false;
  if (storageKey) {
    sentLeadKeys.add(storageKey);
    try {
      window.sessionStorage.setItem(storageKey, "sent");
    } catch {
      // Ignore; in-memory guard is enough for this page load.
    }
  }
  fireEnhancedLead(ctx, dedupeKey);
  return true;
}
