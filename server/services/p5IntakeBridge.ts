import { consultationAttribution, consultationSource } from "../../lib/consultationAttribution";
/**
 * Fire-and-forget bridge from an accepted Handyman consultation to the
 * multi-brand intake on p5homeco.com.
 *
 * That route already creates the HubSpot contact, the mapped deal, and the
 * fail-open lead_created notice (p5 tip 8a33b28c). This repo must not take a
 * HubSpot dependency or a portal token. A bridge failure is logged and never
 * thrown, so the visitor response, the local save, Resend, and the BRC
 * dashboard forward stay independent of it.
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
};

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
 * POST the consultation to p5 intake. Never throws.
 * Callers must not await this on the visitor's success path.
 */
export async function forwardConsultationToP5Intake(
  input: ConsultationBridgeInput,
  fetchImpl: FetchLike = fetch,
): Promise<void> {
  try {
    const body = buildP5IntakeBody(input);
    const res = await fetchImpl(P5_INTAKE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      console.error(
        `[p5-intake] Bridge rejected: ${res.status} ${detail.slice(0, 300)}`,
      );
      return;
    }
    console.info(`[p5-intake] Consultation forwarded (${res.status}).`);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[p5-intake] Bridge failed: ${message}`);
  }
}
