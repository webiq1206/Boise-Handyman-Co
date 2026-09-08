import { createHmac } from "crypto";
import { eq, sql } from "drizzle-orm";
import { inquiryLedger } from "@/shared/schema";
import type { db as httpDb } from "@/lib/db";

export type AcceptedLeadResult =
  | { accepted: true; duplicate: false }
  | { accepted: false; duplicate: true }
  | { accepted: false; duplicate: false; error: "persistence_unavailable" | "save_failed" };

/**
 * The HTTP Neon driver (`@/lib/db`). It is the driver every other durable
 * write on this site uses and the one that is known to work from the
 * production deployment. The websocket pool in `server/db.ts` timed out on
 * the live site (every lead submission answered 503 after 15 s), so the
 * ledger no longer depends on an interactive transaction.
 */
export type LeadDb = NonNullable<typeof httpDb>;

function fingerprint(contact: { email?: string; phone?: string }): string {
  const secret = process.env.LEAD_FINGERPRINT_SECRET || process.env.DATABASE_URL;
  if (!secret) throw new Error("LEAD_FINGERPRINT_SECRET is required to accept leads");
  const value = `${(contact.email || "").trim().toLowerCase()}|${(contact.phone || "").replace(/\D/g, "")}`;
  return createHmac("sha256", secret).update(value).digest("hex");
}

function monthBucket(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

let ledgerEnsured: Promise<void> | null = null;

/**
 * The ledger table is applied by `migrations/0001_inquiry_ledger.sql` through
 * `db:push`, but a deployment whose database was provisioned without that
 * step must still accept leads, so the table is created on first use. Every
 * statement is idempotent.
 */
export function ensureInquiryLedgerTable(db: LeadDb): Promise<void> {
  if (!ledgerEnsured) {
    ledgerEnsured = (async () => {
      await db.execute(sql`CREATE TABLE IF NOT EXISTS "inquiry_ledger" (
        "id" varchar PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
        "inquiry_id" varchar(100) NOT NULL,
        "contact_fingerprint" varchar(128) NOT NULL,
        "duplicate_key" varchar(128) NOT NULL,
        "route" varchar(40) NOT NULL,
        "accepted_at" timestamp DEFAULT now() NOT NULL,
        "metadata" jsonb DEFAULT '{}'::jsonb NOT NULL
      )`);
      await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "inquiry_ledger_inquiry_id_unique" ON "inquiry_ledger" ("inquiry_id")`);
      await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS "inquiry_ledger_duplicate_key_unique" ON "inquiry_ledger" ("duplicate_key")`);
      await db.execute(sql`CREATE INDEX IF NOT EXISTS "inquiry_ledger_contact_fingerprint_idx" ON "inquiry_ledger" ("contact_fingerprint")`);
    })().catch((error) => {
      ledgerEnsured = null;
      throw error;
    });
  }
  return ledgerEnsured;
}

/**
 * Claim the inquiry in the ledger, then save the PII lead.
 *
 * The ledger insert is the duplicate guard: its unique keys reject a second
 * copy of the same inquiry id, and the same contact plus scope inside one
 * month. The HTTP driver has no interactive transactions, so the two writes
 * are ordered instead: if the lead save fails after the claim succeeded, the
 * claim is released again so the visitor's retry is not reported as a
 * duplicate.
 */
export async function saveAcceptedLead(
  db: LeadDb | null,
  input: {
    inquiryId: string;
    route: "estimate-lead" | "consultation" | "re10";
    contact: { email?: string; phone?: string };
    /** Stable non-message scope such as project and normalized property/city. */
    scope: string;
    bucket?: string;
    metadata?: Record<string, string | boolean | number | undefined>;
    saveLead: (tx: LeadDb) => Promise<void>;
  },
): Promise<AcceptedLeadResult> {
  if (!db) return { accepted: false, duplicate: false, error: "persistence_unavailable" };
  let claimed = false;
  try {
    await ensureInquiryLedgerTable(db);
    const contactFingerprint = fingerprint(input.contact);
    // This expires naturally each month, so a later genuine request is not
    // suppressed, while fresh browser IDs cannot recount the same inquiry.
    const duplicateKey = createHmac("sha256", process.env.LEAD_FINGERPRINT_SECRET || process.env.DATABASE_URL || "")
      .update(`${contactFingerprint}|${input.scope.trim().toLowerCase()}|${input.bucket ?? monthBucket()}`)
      .digest("hex");
    const inserted = await db.insert(inquiryLedger).values({
      inquiryId: input.inquiryId,
      route: input.route,
      contactFingerprint,
      duplicateKey,
      metadata: input.metadata ?? {},
    }).onConflictDoNothing().returning({ id: inquiryLedger.id });
    if (inserted.length === 0) return { accepted: false, duplicate: true } as const;
    claimed = true;
    await input.saveLead(db);
    return { accepted: true, duplicate: false } as const;
  } catch (error) {
    console.error("[acceptedLead] durable save failed", error);
    if (claimed) {
      await db.delete(inquiryLedger).where(eq(inquiryLedger.inquiryId, input.inquiryId)).catch((releaseError) => {
        console.error("[acceptedLead] could not release the ledger claim", releaseError);
      });
    }
    return { accepted: false, duplicate: false, error: "save_failed" };
  }
}
