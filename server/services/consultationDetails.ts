import { createHash, createHmac, timingSafeEqual } from "crypto";
import { z } from "zod";
import { extractZip } from "@/shared/addressValidation";
import { formatFileSize } from "@/shared/requestFiles";
import { TIMING_OPTIONS } from "@/shared/consultationChoices";
import { BEST_TIMES_TO_CALL, UNSPECIFIED_PROJECT_TYPE } from "@/server/services/consultationRequest";

/**
 * Step 2 of the request form: "Help us prepare (optional)" on the success
 * screen, and the files that upload after the request is saved.
 *
 * The request is saved first (POST /api/consultation). Its response carries
 * the saved row's id and a short-lived signed token. Uploads
 * (/api/consultation/files) and details (/api/consultation/details) present
 * both, so only the browser that sent the request can add to it, and only for
 * a couple of hours. The details MERGE into the same row: an answer the
 * visitor already gave is never overwritten, and an empty field never blanks
 * one. Everything added is also written as a "DETAILS ADDED" block in the
 * notes, which is what every destination already keeps.
 */

export const DETAILS_TOKEN_TTL_MS = 2 * 60 * 60 * 1000;

export { TIMING_OPTIONS };

export const DETAILS_MARKER = "DETAILS ADDED";

/**
 * The signing secret. A dedicated LEAD_DETAILS_SECRET if one is set, else the
 * site's existing SESSION_SECRET (already required for admin sessions and
 * edit tokens), else the lead fingerprint secret. Null means Step 2 and
 * uploads are switched off and the form says to text the files instead.
 */
export function detailsSecret(env: Record<string, string | undefined> = process.env): string | null {
  const candidates = [env.LEAD_DETAILS_SECRET, env.SESSION_SECRET, env.LEAD_FINGERPRINT_SECRET];
  for (const value of candidates) if (value && value.length >= 16) return value;
  return null;
}

function sign(secret: string, requestId: string, inquiryId: string, expiresAt: number): string {
  return createHmac("sha256", secret)
    .update(`consultation-details:v1|${requestId}|${inquiryId}|${expiresAt}`)
    .digest("base64url");
}

export function issueDetailsToken(
  input: { requestId: string; inquiryId: string },
  secret: string,
  now = Date.now(),
): { token: string; expiresAt: number } {
  const expiresAt = now + DETAILS_TOKEN_TTL_MS;
  return { token: `${expiresAt}.${sign(secret, input.requestId, input.inquiryId, expiresAt)}`, expiresAt };
}

export type TokenCheck = "ok" | "expired" | "invalid";

export function verifyDetailsToken(
  input: { requestId: string; inquiryId: string; token: string },
  secret: string | null,
  now = Date.now(),
): TokenCheck {
  if (!secret) return "invalid";
  const match = /^(\d{10,16})\.([A-Za-z0-9_-]{20,100})$/.exec(input.token);
  if (!match) return "invalid";
  const expiresAt = Number(match[1]);
  const expected = Buffer.from(sign(secret, input.requestId, input.inquiryId, expiresAt));
  const given = Buffer.from(match[2]);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return "invalid";
  // A token only lives as long as it said it would, and never longer than the TTL.
  if (expiresAt > now + DETAILS_TOKEN_TTL_MS + 60_000) return "invalid";
  if (now > expiresAt) return "expired";
  return "ok";
}

const optionalText = (max: number) =>
  z
    .string()
    .max(max)
    .optional()
    .transform((value) => value?.trim() || undefined);

export const detailsFieldsSchema = z
  .object({
    projectType: optionalText(100),
    address: optionalText(300),
    timing: z.enum(TIMING_OPTIONS).optional(),
    bestTimeToCall: z.enum(BEST_TIMES_TO_CALL).optional(),
    email: optionalText(200).refine((value) => !value || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value), {
      message: "Check the email address.",
    }),
    /** The list, for a callback request that did not send one. */
    message: optionalText(5_000),
  })
  .strict();

export type DetailsFields = z.infer<typeof detailsFieldsSchema>;

export const detailsBodySchema = z.object({
  requestId: z.string().uuid(),
  inquiryId: z.string().uuid(),
  token: z.string().max(200),
  details: detailsFieldsSchema.optional().default({}),
  /** Storage keys returned by /api/consultation/files for this request. */
  files: z.array(z.string().max(300)).max(10).optional().default([]),
  website: z.string().max(0).optional(),
});

export interface StoredLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  zip: string;
  address: string | null;
  city: string | null;
  projectType: string;
  message: string | null;
}

export interface DetailFile {
  key: string;
  name: string;
  url: string;
  contentType: string;
  size: number;
}

/** The storage prefix that ties an upload to one saved request. */
export function requestFilePrefix(requestId: string): string {
  return `consultation/${requestId}/`;
}

/** Stable reference for one details submission: the same post twice is one. */
export function detailsRef(details: DetailsFields, files: { key: string }[]): string {
  const normalized = JSON.stringify({
    d: Object.entries(details)
      .filter(([, value]) => value !== undefined && value !== "")
      .sort(([a], [b]) => a.localeCompare(b)),
    f: files.map((file) => file.key).sort(),
  });
  return createHash("sha256").update(normalized).digest("hex").slice(0, 12);
}

export interface MergeResult {
  duplicate: boolean;
  /** Columns to write. Only ever fills a blank; never empties a value. */
  update: Partial<Pick<StoredLead, "email" | "address" | "zip" | "projectType" | "message">>;
  /** The "DETAILS ADDED" block appended to the notes. */
  block: string;
  ref: string;
  /** What was added, for the destinations and the follow-up email. */
  added: { label: string; value: string }[];
}

function blank(value: string | null | undefined): boolean {
  return !value || !value.trim();
}

/**
 * Merge Step 2 into the saved request. Pure, so the rules are pinned by tests:
 * a blank never overwrites, an existing answer is kept (the new one is still
 * recorded in the block), and the same submission twice is a duplicate.
 */
export function mergeDetails(
  row: StoredLead,
  details: DetailsFields,
  files: DetailFile[],
  options: { projectLabel?: (value: string) => string; now?: Date } = {},
): MergeResult {
  const ref = detailsRef(details, files);
  const label = options.projectLabel ?? ((value: string) => value);
  if ((row.message ?? "").includes(`${DETAILS_MARKER} (ref ${ref}`)) {
    return { duplicate: true, update: {}, block: "", ref, added: [] };
  }

  const update: MergeResult["update"] = {};
  const added: MergeResult["added"] = [];

  if (details.projectType) {
    added.push({ label: "Type of work", value: label(details.projectType) });
    if (blank(row.projectType) || row.projectType === UNSPECIFIED_PROJECT_TYPE) update.projectType = details.projectType;
  }
  if (details.address) {
    added.push({ label: "Address", value: details.address });
    const onlyZip = /^\d{5}(-\d{4})?$/.test(details.address);
    if (!onlyZip && blank(row.address)) update.address = details.address;
    const zip = onlyZip ? details.address.slice(0, 5) : extractZip(details.address);
    if (zip && blank(row.zip)) update.zip = zip;
  }
  if (details.timing) added.push({ label: "Timing", value: details.timing });
  if (details.bestTimeToCall) added.push({ label: "Best time to call", value: details.bestTimeToCall });
  if (details.email) {
    added.push({ label: "Email", value: details.email });
    if (blank(row.email)) update.email = details.email;
  }
  if (details.message) added.push({ label: "List", value: details.message });
  if (files.length > 0) {
    added.push({
      label: "Files",
      value: files.map((file) => `${file.name} (${formatFileSize(file.size)}): ${file.url}`).join("\n"),
    });
  }

  const stamp = (options.now ?? new Date()).toISOString().slice(0, 16).replace("T", " ");
  const lines = added.map(({ label: name, value }) =>
    value.includes("\n") ? `${name}:\n${value}` : `${name}: ${value}`,
  );
  const block = `${DETAILS_MARKER} (ref ${ref}, ${stamp} UTC)\n${lines.join("\n")}`;
  update.message = row.message?.trim() ? `${row.message}\n\n${block}` : block;
  return { duplicate: false, update, block, ref, added };
}
