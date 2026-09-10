import type { LeadEstimateRecord, LeadPropertyRecord } from "@/server/services/leadRecord";

/**
 * Forward to the Boise Handyman lead dashboard without throwing. Callers may
 * await the result when their success response depends on a confirmed receipt.
 *
 * FIELD NAMES ARE A CONTRACT. The dashboard validates with a plain zod object,
 * which strips unknown keys, so a field named even slightly differently is
 * silently discarded rather than rejected. These names match
 * `externalLeadSchema` in the BRC-Lead-Dashboard repo exactly. Verified against
 * that source: fullName and email are required, everything else optional.
 */

/* Limits taken from the dashboard's externalLeadSchema. Exceeding any of them
   fails validation and loses the whole lead, so every string is clamped before
   it is sent rather than trusted to be short enough. */
const FINAL_NOTES_LIMIT = 1990;      // schema max 2000
const PROJECT_SCOPE_LIMIT = 1990;    // schema max 2000
const ESTIMATE_SUMMARY_LIMIT = 19_900; // schema max 20000
const ESTIMATE_RANGE_LIMIT = 95;     // schema max 100

function clamp(value: string, limit: number): string {
  if (value.length <= limit) return value;
  return `${value.slice(0, limit - 20)}\n...[truncated]`;
}

interface ForwardPayload {
  /* Required by the dashboard */
  fullName: string;
  email: string;

  /* Contact + property, named exactly as the dashboard expects */
  phone?: string;
  propertyAddress?: string;
  city?: string;
  state?: string;
  zip?: string;

  /* Project fields */
  projectTypes?: string[];
  budgetRange?: string;
  projectScope?: string;
  projectGoals?: string;
  /** The homeowner's own message. Short by nature; the estimate record does not
   *  belong here, it belongs in estimateSummary. */
  finalNotes?: string;

  source?: string;

  /* ── Estimator output ────────────────────────────────────────────────────
     The dashboard accepts `estimate` as a passthrough object specifically so
     this side can add fields without them being silently stripped, and stores
     the whole group as JSON on the lead's sourcePayload column. */

  /** Complete structured record: selections, scope, assumptions, disclaimers. */
  estimate?: LeadEstimateRecord;
  /**
   * County parcel record: zoning, lot size, assessed value, owner and
   * occupancy. Passthrough on the dashboard side for the same reason as
   * `estimate`, so fields added here are not silently stripped.
   */
  property?: LeadPropertyRecord;

  /* Structured intake fields the estimator can answer honestly. */
  /** "yes" or "no". Only set for ADU, the one project that asks. */
  additionAttached?: string;
  /** New-construction size, e.g. "600 sq ft". Addition and ADU only. */
  targetHomeSizeRange?: string;
  /** Readable rendering of the same record. 20k limit, not 2k like finalNotes. */
  estimateSummary?: string;
  estimateLow?: number;
  estimateHigh?: number;
  estimateRange?: string;
}

export async function forwardToLeadDashboard(payload: ForwardPayload): Promise<boolean> {
  const key = process.env.LEAD_DASHBOARD_KEY;
  if (!key) {
    console.warn(
      "[lead-dashboard] LEAD_DASHBOARD_KEY is not set; lead was NOT forwarded to the CRM."
    );
    return false;
  }

  const body: ForwardPayload = {
    ...payload,
    finalNotes: payload.finalNotes ? clamp(payload.finalNotes, FINAL_NOTES_LIMIT) : undefined,
    projectScope: payload.projectScope ? clamp(payload.projectScope, PROJECT_SCOPE_LIMIT) : undefined,
    estimateSummary: payload.estimateSummary
      ? clamp(payload.estimateSummary, ESTIMATE_SUMMARY_LIMIT)
      : undefined,
    estimateRange: payload.estimateRange
      ? clamp(payload.estimateRange, ESTIMATE_RANGE_LIMIT)
      : undefined,
  };

  return fetch("https://leads.boisehandyman.co/api/external/leads", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10_000),
  })
    .then(async (res) => {
      // A rejected forward means the lead reached the inbox but not the CRM.
      // 409 is the dashboard's 60-second duplicate guard and is expected when a
      // visitor submits twice, so it is noted rather than flagged as an error.
      if (res.status === 409) {
        console.info("[lead-dashboard] Duplicate within 60s; CRM kept the existing lead.");
        return true;
      }
      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        console.error(
          `[lead-dashboard] Forward rejected: ${res.status} ${res.statusText} ${detail.slice(0, 300)}`
        );
        return false;
      }
      return true;
    })
    .catch((err) => {
      console.error("[lead-dashboard] Forward failed:", err);
      return false;
    });
}
