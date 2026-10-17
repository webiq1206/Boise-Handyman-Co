import { createHash, randomUUID } from "node:crypto";
import { enhancedEmail, enhancedPhoneNumber } from "@/lib/googleAdsConversion";
import { query } from "@/lib/p5/database";

export const ENHANCED_CONVERSION_COOKIE = "p5_allow_enhanced";

const CREATE_TABLE = `CREATE TABLE IF NOT EXISTS enhanced_conversion_suppressions (
  id varchar PRIMARY KEY,
  kind varchar(16) NOT NULL,
  value_hash varchar(64) NOT NULL,
  created_at timestamp DEFAULT now() NOT NULL
)`;
const CREATE_INDEX = `CREATE UNIQUE INDEX IF NOT EXISTS enhanced_conversion_suppressions_kind_hash_unique ON enhanced_conversion_suppressions (kind, value_hash)`;

export type SuppressionKind = "email" | "phone";
export type SuppressionHash = { kind: SuppressionKind; hash: string };

let tableReady: Promise<void> | null = null;

/** Tests swap databases. Production keeps one idempotent setup. */
export function clearEnhancedConversionSuppressionReady(): void {
  tableReady = null;
}

export function ensureEnhancedConversionSuppressionTable(): Promise<void> {
  if (!tableReady) {
    tableReady = (async () => {
      await query(CREATE_TABLE);
      await query(CREATE_INDEX);
    })().catch((error) => {
      tableReady = null;
      throw error;
    });
  }
  return tableReady;
}

export function sha256Hex(value: string): string {
  return createHash("sha256").update(value, "utf8").digest("hex");
}

/** Hashes of the same normalized email and E.164 phone the tag would send. Raw values are not returned. */
export function suppressionHashes(contact: { email?: string | null; phone?: string | null }): SuppressionHash[] {
  const hashes: SuppressionHash[] = [];
  const email = enhancedEmail(contact.email ?? undefined);
  const phone = enhancedPhoneNumber(contact.phone ?? undefined);
  if (email) hashes.push({ kind: "email", hash: sha256Hex(email) });
  if (phone) hashes.push({ kind: "phone", hash: sha256Hex(phone) });
  return hashes;
}

export async function addEnhancedConversionSuppression(contact: { email?: string | null; phone?: string | null }): Promise<SuppressionHash[]> {
  const hashes = suppressionHashes(contact);
  if (hashes.length === 0) throw new Error("Provide an email address or a 10-digit US phone number.");
  await ensureEnhancedConversionSuppressionTable();
  for (const item of hashes) {
    await query(
      `INSERT INTO enhanced_conversion_suppressions (id, kind, value_hash) VALUES ($1, $2, $3) ON CONFLICT (kind, value_hash) DO NOTHING`,
      [randomUUID(), item.kind, item.hash],
    );
  }
  return hashes;
}

/**
 * False when either normalized hash is on the list, or when the lookup fails.
 * A missing contact stays allowed. The lead and the conversion still proceed.
 */
export async function allowEnhancedConversions(contact: { email?: string | null; phone?: string | null }): Promise<boolean> {
  const hashes = suppressionHashes(contact);
  if (hashes.length === 0) return true;
  try {
    await ensureEnhancedConversionSuppressionTable();
    const rows = await query(
      `SELECT value_hash FROM enhanced_conversion_suppressions WHERE value_hash IN (${hashes.map((_, index) => `$${index + 1}`).join(", ")})`,
      hashes.map((item) => item.hash),
    );
    return rows.length === 0;
  } catch (error) {
    console.error("[enhanced-conversion] suppression check unavailable", error instanceof Error ? error.message : error);
    return false;
  }
}

export function enhancedConversionCookie(allowed: boolean): string {
  return `${ENHANCED_CONVERSION_COOKIE}=${allowed ? "1" : "0"}; Path=/; Max-Age=120; SameSite=Lax`;
}

/** Missing cookie means the submit response did not suppress this visitor. */
export function enhancedConversionCookieAllows(cookieHeader: string | null | undefined): boolean {
  if (!cookieHeader) return true;
  const match = cookieHeader.match(/(?:^|; )p5_allow_enhanced=([^;]*)/);
  if (!match) return true;
  return decodeURIComponent(match[1]) !== "0";
}

function isFinishedLead(body: unknown): boolean {
  if (!body || typeof body !== "object") return false;
  const value = body as { accepted?: unknown; result?: unknown };
  return value.accepted === true || value.result != null;
}

/**
 * Adds allowEnhancedConversions to a finished lead response and a short cookie
 * the estimator can read. The estimator client is shared and does not take the
 * new field, so the cookie carries the same decision. Other responses stay intact.
 */
export async function responseWithEnhancedDecision(
  response: Response,
  contact: { email?: string | null; phone?: string | null } | null,
): Promise<Response> {
  if (response.status !== 200) return response;
  const type = response.headers.get("content-type") || "";
  if (!type.includes("json")) return response;
  let body: unknown;
  try {
    body = await response.json();
  } catch {
    return response;
  }
  const headers = new Headers(response.headers);
  headers.delete("content-length");
  if (!isFinishedLead(body)) {
    return Response.json(body, { status: response.status, headers });
  }
  const allowed = await allowEnhancedConversions(contact ?? {});
  headers.append("set-cookie", enhancedConversionCookie(allowed));
  return Response.json(
    { ...(body as Record<string, unknown>), allowEnhancedConversions: allowed },
    { status: response.status, headers },
  );
}
