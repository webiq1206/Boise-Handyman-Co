/**
 * Google Ads conversion helpers shared by every lead path on this site.
 *
 * "P5 Raw Form Submitted" receives real accepted leads only, with a per-lead
 * value so Google Ads can report ROAS by campaign. Values are the per-lead
 * estimates agreed with P5 on 14 Sept 2026 (form fallback in Google Ads is
 * $50). "P5 Estimator Completed" is a separate action for finishing the
 * estimator. Never pass PII here: no names, phones, emails or free text -
 * only a service/project category and an opaque id.
 */
export const GOOGLE_ADS_ID = "AW-18354188204";
export const GOOGLE_ADS_LEAD_LABEL = "AW-18354188204/LE2vCPXstO8cEKzf-q9E";
/** "P5 Estimator Completed" (7851740531). Sent with the form label when an estimator finish also submits a lead. */
export const GOOGLE_ADS_ESTIMATOR_LABEL = "AW-18354188204/cEzmCPOagKAdEKzf-q9E";
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
const waitingLeadKeys = new Set<string>();

type GtagFn = (...args: unknown[]) => void;

/** Twenty half-second checks: ten seconds for lazy gtag, then give up. */
export const GTAG_READY_WAIT_MS = 500;
export const GTAG_READY_ATTEMPTS = 20;

function readGtag(): GtagFn | undefined {
  if (typeof window === "undefined") return undefined;
  const gtag = (window as unknown as { gtag?: GtagFn }).gtag;
  return typeof gtag === "function" ? gtag : undefined;
}

/**
 * Calls fire once gtag exists. A missing library retries for ten seconds
 * and then drops the call. The marker is not written by this waiter.
 */
export function whenGtagReady(fire: (gtag: GtagFn) => void, attempt = 0): void {
  if (typeof window === "undefined") return;
  const gtag = readGtag();
  if (gtag) {
    fire(gtag);
    return;
  }
  if (attempt >= GTAG_READY_ATTEMPTS) return;
  window.setTimeout(() => whenGtagReady(fire, attempt + 1), GTAG_READY_WAIT_MS);
}

function leadAlreadySent(storageKey?: string): boolean {
  if (!storageKey) return false;
  if (sentLeadKeys.has(storageKey)) return true;
  try {
    return window.sessionStorage.getItem(storageKey) === "sent";
  } catch {
    return false;
  }
}

function sendConversion(storageKey: string | undefined, payload: () => Record<string, unknown>): boolean {
  if (leadAlreadySent(storageKey)) return false;
  const gtag = readGtag();
  if (!gtag) return false;
  if (storageKey) {
    sentLeadKeys.add(storageKey);
    try {
      window.sessionStorage.setItem(storageKey, "sent");
    } catch {
      // Ignore; in-memory guard is enough for this page load.
    }
  }
  try {
    gtag("event", "conversion", payload());
  } catch {
    // A tracking failure must not break the form or the estimator.
  }
  return true;
}

/**
 * Fires one conversion once per storage key. A missing gtag retries for ten
 * seconds and still fires at most once. The sent marker is written only
 * when gtag is ready. gtag itself is called inside try/catch.
 */
function queueConversion(storageKey: string | undefined, payload: () => Record<string, unknown>): boolean {
  if (typeof window === "undefined") return false;
  if (leadAlreadySent(storageKey) || (storageKey && waitingLeadKeys.has(storageKey))) return false;
  if (readGtag()) return sendConversion(storageKey, payload);
  if (storageKey) waitingLeadKeys.add(storageKey);
  let fired = false;
  whenGtagReady(() => {
    if (storageKey) waitingLeadKeys.delete(storageKey);
    if (fired) return;
    fired = true;
    sendConversion(storageKey, payload);
  });
  return false;
}

/** Intake confirm and estimate submit both use these key prefixes. */
export function isEstimatorCompletionKey(dedupeKey?: string): boolean {
  return !!dedupeKey && (dedupeKey.startsWith("estimator:") || dedupeKey.startsWith("intake:"));
}

export type LeadConversionOptions = {
  /**
   * True only when the finish endpoint JSON has accepted===true.
   * Omitted is not an accepted lead: the estimator engine does not pass this.
   */
  accepted?: boolean;
  /** HTTP status from the finish endpoint. 409 fires nothing. */
  status?: number;
};

export type EstimatorEndpointResult = {
  status?: number;
  accepted?: boolean;
  duplicate?: boolean;
};

/**
 * Routes one estimator finish from the endpoint result.
 * HTTP 409 fires nothing. `{accepted:true}` fires the estimator label and the
 * form label once for that raw key. `{accepted:false, duplicate:true}` fires
 * only the estimator label.
 */
export function trackEstimatorEndpointResult(
  ctx: LeadContext,
  key: string,
  result: EstimatorEndpointResult,
): boolean {
  return trackGoogleAdsLeadConversion(ctx, key, {
    accepted: result.accepted === true,
    status: result.status,
  });
}

/**
 * Fires one Google Ads conversion once per raw dedupe key (per page load and,
 * where storage allows, per browser session). An `estimator:` or `intake:`
 * key sends P5 Estimator Completed once for that key. The form label fires
 * for that same raw key only when options.accepted === true, with
 * transaction_id equal to the key. HTTP 409 sends nothing. Any other key is
 * a consultation lead and sends only the form label. If gtag is not loaded
 * yet, the retry waits ten seconds and still fires at most once. The sent
 * marker is written only when gtag is ready, and the gtag call is inside
 * try/catch.
 */
export function trackGoogleAdsLeadConversion(
  ctx: LeadContext = {},
  dedupeKey?: string,
  options?: LeadConversionOptions,
): boolean {
  if (options?.status === 409) return false;
  if (isEstimatorCompletionKey(dedupeKey) && dedupeKey) {
    const estimatorSent = queueConversion(`google_ads_estimator:${dedupeKey}`, () => ({
      send_to: GOOGLE_ADS_ESTIMATOR_LABEL,
      transaction_id: dedupeKey,
    }));
    if (options?.accepted === true) {
      queueConversion(`google_ads_lead:${dedupeKey}`, () => googleAdsLeadParams(ctx, dedupeKey));
    }
    return estimatorSent;
  }
  const storageKey = dedupeKey ? `google_ads_lead:${dedupeKey}` : undefined;
  return queueConversion(storageKey, () => googleAdsLeadParams(ctx, dedupeKey));
}
