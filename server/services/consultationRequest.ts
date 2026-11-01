import { z } from "zod";
import { estimateSchema } from "@/shared/estimatePayload";
import { MAX_REQUEST_FILES } from "@/shared/requestFiles";

/**
 * Request body for POST /api/consultation, kept outside the route file so the
 * accepted shapes (the one-screen request and "Have us call you") are testable
 * without a database (tests/consultation-request.test.ts).
 */

const propertyProfileSchema = z
  .object({
    formattedAddress: z.string(),
    city: z.string(),
    state: z.string(),
    zip: z.string(),
  })
  .passthrough()
  .optional()
  .nullable();

// The consultation form may arrive with no estimate at all (someone who came
// straight to the contact page), so the shared object is wrapped as optional.
export const optionalEstimateSchema = estimateSchema.optional().nullable();

/**
 * Project type filed when the visitor did not pick one. The one-screen form
 * asks for the list itself, not a category, and "task-list" is the value the
 * old wizard sent for "A list or something else": the p5 intake bridge maps it
 * to "A multi-item home list" and the lead dashboard files it as before.
 */
export const UNSPECIFIED_PROJECT_TYPE = "task-list";

/** The one plain line every destination leads with for a callback request. */
export const CALLBACK_MARKER = "CALLBACK REQUEST";

export const BEST_TIMES_TO_CALL = ["Any time", "Morning", "Midday", "Afternoon"] as const;

export const consultationBodySchema = z
  .object({
    name: z.string().min(2),
    /**
     * Only the visitor's chosen contact method is required (see superRefine
     * below) - matches the same preferred-contact pattern already shipped in
     * the RE-10 wizard. Defaults to "email" so older cached client bundles
     * that never send this field behave exactly as before (email required).
     */
    preferredContact: z.enum(["email", "phone", "text"]).optional().default("email"),
    phone: z.string().optional().default(""),
    email: z.string().optional().default(""),
    /**
     * Optional: the one-screen form keeps the service address under "Add more
     * detail (optional)", and a callback request asks for a name and a number
     * only.
     */
    address: z.string().max(300).optional().default(""),
    zip: z.string().optional(),
    /** Optional on the one-screen form; absent or blank becomes "task-list". */
    projectType: z
      .string()
      .max(100)
      .optional()
      .transform((value) => value?.trim() || UNSPECIFIED_PROJECT_TYPE),
    message: z.string().max(5_000).optional(),
    /**
     * "callback" is the form's "Have us call you" switch: name and phone only,
     * through this same pipeline. CALLBACK_MARKER leads the notes so the
     * database row, the CRM and the internal email all show it.
     */
    requestKind: z.enum(["quote", "callback"]).optional().default("quote"),
    bestTimeToCall: z.string().trim().max(60).optional(),
    /**
     * How many files the visitor attached. The lead is saved and forwarded
     * first; the files follow one request each (/api/consultation/files) and
     * reach every destination as a "Details added" update.
     */
    filesPending: z.number().int().min(0).max(MAX_REQUEST_FILES).optional(),
    propertyProfile: propertyProfileSchema,
    estimate: optionalEstimateSchema,
    /* Set by the client when the visitor already submitted the estimate gate,
       which already sent admin + customer emails via /api/estimate-lead.
       Prevents duplicate email sends when the same person submits both forms. */
    skipEmail: z.boolean().optional(),
    inquiryId: z.string().uuid(),
    website: z.string().max(0).optional(),
    attribution: z.record(z.string().max(100)).optional(),
  })
  .superRefine((data, ctx) => {
    // A callback is a phone call by definition, whatever the radio said.
    const contact = data.requestKind === "callback" ? "phone" : data.preferredContact;
    if (contact === "email") {
      if (!z.string().email().safeParse(data.email).success) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["email"], message: "Valid email required" });
      }
    } else if (data.phone.replace(/\D/g, "").length < 10) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["phone"], message: "Valid phone required" });
    }
  })
  .transform((data) => ({
    ...data,
    preferredContact: data.requestKind === "callback" ? ("phone" as const) : data.preferredContact,
    message: withFilesPending(composeConsultationMessage(data), data.filesPending),
  }));

export type ConsultationBody = z.infer<typeof consultationBodySchema>;

const CONTACT_LABELS = { phone: "Call", text: "Text", email: "Email" } as const;

export function preferredContactLabel(value: "email" | "phone" | "text"): string {
  return CONTACT_LABELS[value];
}

/**
 * The notes every destination stores. A callback request leads with one plain
 * line the team cannot miss; the visitor's own words follow unchanged. A full
 * request keeps the visitor's list exactly as typed, then the photo links.
 */
export function composeConsultationMessage(input: {
  requestKind?: "quote" | "callback";
  bestTimeToCall?: string;
  phone?: string;
  message?: string;
}): string | undefined {
  const typed = input.message?.trim() ? input.message : undefined;
  if (input.requestKind !== "callback") return typed;
  const best = input.bestTimeToCall?.trim();
  const header = `${CALLBACK_MARKER}: please call ${input.phone?.trim() || "the number above"}${
    best ? `. Best time: ${best}` : ""
  }.`;
  return typed ? `${header}\n\n${typed}` : header;
}

/**
 * The notes plus the visitor's contact choice, for a destination that has no
 * field for it (the p5 intake). A callback already says "please call".
 */
export function withPreferredContact(
  message: string | undefined,
  requestKind: "quote" | "callback",
  preferredContact: "email" | "phone" | "text",
): string | undefined {
  if (requestKind === "callback") return message;
  const line = `Preferred contact: ${CONTACT_LABELS[preferredContact]}`;
  return message?.trim() ? `${message}\n\n${line}` : line;
}

/* ───────────────────────────── attachments */

/**
 * The line every destination gets when the visitor attached files: the lead
 * itself is sent first and never waits on an upload, so the team knows links
 * are on the way in a "Details added" follow-up.
 */
export function filesPendingLine(count: number | undefined): string | null {
  if (!count || count < 1) return null;
  return `Files: ${count} ${count === 1 ? "file is" : "files are"} uploading. Links follow in a "Details added" update.`;
}

/** The visitor's notes plus the pending-files line, when there is one. */
export function withFilesPending(message: string | undefined, count: number | undefined): string | undefined {
  const line = filesPendingLine(count);
  if (!line) return message;
  return message?.trim() ? `${message}\n\n${line}` : line;
}
