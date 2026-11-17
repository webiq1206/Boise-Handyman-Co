import { consultationAttribution, consultationSource } from "../../lib/consultationAttribution";
/**
 * Bridge from an accepted Handyman consultation to the multi-brand intake on
 * p5homeco.com.
 *
 * That route already creates the HubSpot contact, the mapped deal, and the
 * team's "New lead" email. This repo must not take a HubSpot dependency or a
 * portal token. A bridge failure is logged and never thrown, so the visitor
 * response, the local save, the customer's confirmation email, and the BRC
 * dashboard forward stay independent of it.
 *
 * One team email per request (owner, 17 November 2026). The bridge asks p5 to
 * confirm its team email (`team_alert: "confirm"`) and returns what p5
 * answered. Only this site's own TEAM email waits for that answer, inside
 * after(): see server/services/teamEmailGate.ts.
 *
 * Project strings are rewritten only when p5 already accepts them: either as
 * a HUBSPOT_PROJECT_TYPES value or as a PROJECT_TYPE_ALIASES key. Unknown
 * visitor labels are forwarded unchanged so p5 can omit p5_project_type
 * instead of rejecting the deal.
 */

export const P5_INTAKE_URL = "https://p5homeco.com/api/leads/intake";

/** Exact BRANDS entry on the p5 intake. */
export const P5_HANDYMAN_BRAND = "Boise Handyman Co";

export const P5_CONSULTATION_FORM = "Handyman consultation";

/**
 * Visitor project text that does not match a p5 alias or HubSpot option at
 * tip 8a33b28c. hubspotProjectType omits these, so the deal can be created
 * with a blank p5_project_type. Prove should watch for that omission.
 */
export const UNMAPPED_P5_PROJECT_TYPES = [
  "other",
  "Other / Not sure yet",
  "something-else",
  "Something else",
  "General inquiry (assistant chat)",
  "looking-for-land",
  "shop-home",
  "Shop Home",
] as const;

/**
 * Consultation values (form slugs, on-screen labels, and the few legacy
 * labels that still post to /api/consultation) to a string p5 will keep.
 */
export const P5_PROJECT_TYPE_BY_VISITOR_LABEL: Readonly<Record<string, string>> = {
  handyman: "handyman",
  "Home repairs or handyman work": "Home repairs or handyman work",
  re10: "re10",
  "re-10": "re10",
  "RE-10 repairs": "re10",

  "drywall-repair": "Drywall or trim repair",
  "Drywall Repair & Patching": "Drywall or trim repair",
  "carpentry-trim-repair": "Drywall or trim repair",
  "Carpentry, Doors & Trim": "Drywall or trim repair",
  "Carpentry & Trim Repair": "Drywall or trim repair",
  "Drywall or trim repair": "Drywall or trim repair",

  "mounting-assembly": "Mounting or installation",
  "Mounting & Assembly": "Mounting or installation",
  "Mounting or installation": "Mounting or installation",

  "fence-deck-gutter-repair": "Deck or exterior repair",
  "Fence, Deck & Gutter Repair": "Deck or exterior repair",
  "Deck or exterior repair": "Deck or exterior repair",

  "task-list": "A multi-item home list",
  "A List of Small Jobs": "A multi-item home list",
  "A multi-item home list": "A multi-item home list",

  "painting-touch-ups": "handyman",
  "Interior / Exterior Painting": "handyman",
  "Interior & Exterior Painting": "handyman",
  "plumbing-repairs": "handyman",
  "Minor Plumbing Repair": "handyman",
  "Minor Plumbing Repairs": "handyman",
  "electrical-repairs": "handyman",
  "Minor Electrical Repair": "handyman",
  "Minor Electrical Repairs": "handyman",
  "home-maintenance": "handyman",
  "Caulking & Home Maintenance": "handyman",

  "custom-home": "Custom home",
  "Custom Home": "Custom home",
  "Custom home": "Custom home",
  "semi-custom-home": "Semi-custom home",
  "Semi-Custom Home": "Semi-custom home",
  "Semi-custom home": "Semi-custom home",
  "build-on-your-lot": "Build on land I own",
  "Build on My Lot": "Build on land I own",
  "Build on land I own": "Build on land I own",
  kitchen: "kitchen",
  Kitchen: "kitchen",
  bathroom: "bathroom",
  Bathroom: "bathroom",
  "whole-home": "whole-home",
  "Whole-Home": "whole-home",
  addition: "addition",
  "Room Addition": "Home addition",
  "Home addition": "Home addition",
  adu: "adu",
  "ADU / Guest House": "Accessory dwelling unit (ADU)",
  "Accessory dwelling unit (ADU)": "Accessory dwelling unit (ADU)",
  basement: "Basement finishing",
  "Basement Finishing": "Basement finishing",
  "Basement finishing": "Basement finishing",
  "new-construction": "new-construction",
};

export type ConsultationBridgeInput = {
  attribution?: Record<string, unknown>;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  city?: string | null;
  zip?: string | null;
  projectType?: string | null;
  message?: string | null;
  inquiryId?: string | null;
  /**
   * The quote form release contract (owner, 1 November 2026). p5 accepts these
   * as extra optional fields; today's intake ignores them, and a "details"
   * post with the same externalLeadId is filed there as a duplicate rather
   * than a second deal. Once p5 merges details, the same post updates the deal
   * and its HubSpot record.
   */
  requestKind?: "quote" | "callback";
  preferredContact?: "email" | "phone" | "text";
  bestTime?: string | null;
  files?: P5IntakeFile[];
  submissionKind?: "initial" | "details";
  /** Step 2 timing ("Soon", "1 to 3 months", ...). */
  timeline?: string | null;
  /**
   * Lines for the team only, each `Label: value`. p5 prints them in its team
   * email under "From the website" and nowhere else. See teamNoteLines().
   */
  teamNotes?: readonly string[];
};

/** p5 intake limits for team_notes (app/lib/leads/intakeContract.ts there). */
export const MAX_TEAM_NOTES = 40;
export const MAX_TEAM_NOTE_LENGTH = 300;

/** Fields the bridge already sends. A note that repeats one is dropped. */
const TEAM_NOTE_RESERVED_LABELS = new Set(["name", "email", "phone"]);

/**
 * Makes team notes safe to send: plain single lines of `Label: value`, at
 * most 40 lines of at most 300 characters. A line with no label, an empty
 * value, or a label the bridge already sends (name, email, phone) is dropped.
 * When there are more than 40, the last line says how many were left out.
 */
export function teamNoteLines(raw: readonly unknown[] | null | undefined): string[] {
  if (!Array.isArray(raw)) return [];
  const lines: string[] = [];
  for (const item of raw) {
    if (typeof item !== "string") continue;
    const line = item.replace(/[\u0000-\u001f\u007f]+/g, " ").replace(/\s+/g, " ").trim();
    const at = line.indexOf(": ");
    if (at <= 0 || at > 40) continue;
    if (!line.slice(at + 2).trim()) continue;
    if (TEAM_NOTE_RESERVED_LABELS.has(line.slice(0, at).toLowerCase())) continue;
    lines.push(line.length > MAX_TEAM_NOTE_LENGTH ? `${line.slice(0, MAX_TEAM_NOTE_LENGTH - 3).trimEnd()}...` : line);
  }
  if (lines.length <= MAX_TEAM_NOTES) return lines;
  const left = lines.length - (MAX_TEAM_NOTES - 1);
  return [...lines.slice(0, MAX_TEAM_NOTES - 1), `More: ${left} further lines are on this site's lead record`];
}

export type P5IntakeFile = { name: string; url: string; contentType: string; size: number };

/** p5 contact_preference values. The form's "phone" is a call. */
const P5_CONTACT_PREFERENCE = { phone: "call", text: "text", email: "email" } as const;

/** The brand's own request id, stable across the request and its details. */
export function p5ExternalId(inquiryId: string | null | undefined): string | null {
  const id = inquiryId?.trim();
  return id ? `boisehandyman-consultation:${id}` : null;
}

/** p5 normalizeEmail, kept local so a bad optional phone cannot 422 a good email. */
function reachableEmail(raw: string | null | undefined): string | null {
  const email = raw?.trim() ?? "";
  if (!email) return null;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : null;
}

/** p5 normalizePhone. Returns the visitor's original text when it would be stored. */
function reachablePhone(raw: string | null | undefined): string | null {
  const trimmed = raw?.trim() ?? "";
  if (!trimmed) return null;
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return null;
  if (trimmed.startsWith("+") && !trimmed.startsWith("+1")) {
    return digits.length >= 8 && digits.length <= 15 ? trimmed : null;
  }
  const national = digits.length === 11 && digits.startsWith("1") ? digits.slice(1) : digits;
  if (national.length !== 10) return null;
  if (!/^[2-9]\d{2}[2-9]\d{6}$/.test(national)) return null;
  return trimmed;
}

export function p5ProjectType(visitorType: string | null | undefined): string | null {
  const trimmed = visitorType?.trim() ?? "";
  if (!trimmed) return null;
  return P5_PROJECT_TYPE_BY_VISITOR_LABEL[trimmed] ?? trimmed;
}

function composeAddress(address?: string | null, zip?: string | null): string | null {
  const street = address?.trim() ?? "";
  const postal = zip?.trim() ?? "";
  if (!street) return postal || null;
  if (!postal || street.includes(postal)) return street;
  return `${street}, ${postal}`;
}

export function buildP5IntakeBody(input: ConsultationBridgeInput): Record<string, unknown> {
  const visitorType = input.projectType?.trim() ?? "";
  const projectType = p5ProjectType(visitorType);
  const note = input.message?.trim() ?? "";
  const summaryParts: string[] = [];
  // A details post leads with its "DETAILS ADDED" block, which p5 appends to the deal.
  if (input.submissionKind !== "details" && visitorType && projectType && projectType !== visitorType) {
    summaryParts.push(`Visitor project: ${visitorType}`);
  }
  if (note) summaryParts.push(note);

  const email = reachableEmail(input.email);
  const phone = reachablePhone(input.phone);
  const rawEmail = input.email?.trim() ?? "";
  const rawPhone = input.phone?.trim() ?? "";

  const attribution = consultationAttribution(input.attribution, input.email);
  const body: Record<string, unknown> = {
    ...attribution,
    brand: P5_HANDYMAN_BRAND,
    name: input.name.trim(),
    form: P5_CONSULTATION_FORM,
    source: consultationSource(attribution),
    sourceDetail: "boisehandyman.co consultation",
  };

  if (attribution.first_utm_campaign || attribution.utm_campaign) body.originalCampaign = attribution.first_utm_campaign || attribution.utm_campaign;
  if (projectType) body.projectType = projectType;
  if (email) body.email = email;
  else if (!phone && rawEmail) body.email = rawEmail;
  if (phone) body.phone = phone;
  else if (!email && rawPhone) body.phone = rawPhone;

  const address = composeAddress(input.address, input.zip);
  if (address) body.address = address;
  const city = input.city?.trim();
  if (city) body.city = city;
  if (summaryParts.length) body.summary = summaryParts.join("\n\n");

  const externalId = p5ExternalId(input.inquiryId);
  if (externalId) {
    body.externalLeadId = externalId;
    body.external_id = externalId;
  }
  body.submission_kind = input.submissionKind ?? "initial";
  // p5 sends its team email before it answers, and the answer says whether it went.
  body.team_alert = "confirm";
  const teamNotes = teamNoteLines(input.teamNotes);
  if (teamNotes.length) body.team_notes = teamNotes;
  if (input.requestKind) body.request_kind = input.requestKind;
  if (input.preferredContact) {
    body.contact_preference = input.requestKind === "callback" ? "call" : P5_CONTACT_PREFERENCE[input.preferredContact];
  }
  const bestTime = input.bestTime?.trim();
  if (bestTime) body.best_time = bestTime;
  const timeline = input.timeline?.trim();
  if (timeline) body.timeline = timeline;
  if (input.files?.length) {
    body.files = input.files.map((file) => ({
      name: file.name,
      url: file.url,
      contentType: file.contentType,
      size: file.size,
    }));
  }
  return body;
}

type FetchLike = (url: string, init: RequestInit) => Promise<Response>;

/**
 * What p5 said about its own team email:
 *   sent     its mail server accepted the email
 *   failed   it did not, or it was still sending when p5 answered
 *   none     this post produced no p5 email (an exact repeat, or details that
 *            are waiting for their request)
 *   unknown  anything else: no answer, an error, a timeout, an older p5
 */
export type P5TeamAlert = "sent" | "failed" | "none" | "unknown";

export type P5BridgeResult = { forwarded: boolean; alert: P5TeamAlert };

/** p5 waits for HubSpot and its mail server in confirm mode, about 25 seconds at most. */
export const P5_BRIDGE_TIMEOUT_MS = 30_000;

/** Anything that is not exactly one of the three known answers is "unknown". */
export function readP5TeamAlert(answer: unknown): P5TeamAlert {
  if (!answer || typeof answer !== "object" || Array.isArray(answer)) return "unknown";
  const alert = (answer as Record<string, unknown>).alert;
  return alert === "sent" || alert === "failed" || alert === "none" ? alert : "unknown";
}

/**
 * POST the consultation to p5 intake and report what p5 answered. Never throws.
 * Callers must not await this on the visitor's success path: the visitor
 * response and the customer's email never wait on p5. Only this site's own
 * team email does, inside after().
 */
export async function forwardConsultationToP5Intake(
  input: ConsultationBridgeInput,
  fetchImpl: FetchLike = fetch,
  timeoutMs: number = P5_BRIDGE_TIMEOUT_MS,
): Promise<P5BridgeResult> {
  try {
    const body = buildP5IntakeBody(input);
    const res = await fetchImpl(P5_INTAKE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(
        `[p5-intake] Bridge rejected: ${res.status} ${detail.slice(0, 300)}`,
      );
      return { forwarded: false, alert: "unknown" };
    }
    // A body that is not JSON, or has no alert, is an answer we cannot read:
    // the request was forwarded, the team email is not confirmed.
    const answer: unknown = await res.json().catch(() => null);
    const alert = readP5TeamAlert(answer);
    console.info(`[p5-intake] Consultation forwarded (${res.status}), team email: ${alert}.`);
    return { forwarded: true, alert };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[p5-intake] Bridge failed: ${message}`);
    return { forwarded: false, alert: "unknown" };
  }
}
