import { createHmac } from "crypto";
import { inquiryLedger } from "@/shared/schema";

export type AcceptedLeadResult =
  | { accepted: true; duplicate: false }
  | { accepted: false; duplicate: true }
  | { accepted: false; duplicate: false; error: "persistence_unavailable" | "save_failed" };

type DbLike = {
  transaction: <T>(work: (tx: any) => Promise<T>) => Promise<T>;
};

function fingerprint(contact: { email?: string; phone?: string }): string {
  const secret = process.env.LEAD_FINGERPRINT_SECRET || process.env.DATABASE_URL;
  if (!secret) throw new Error("LEAD_FINGERPRINT_SECRET is required to accept leads");
  const value = `${(contact.email || "").trim().toLowerCase()}|${(contact.phone || "").replace(/\D/g, "")}`;
  return createHmac("sha256", secret).update(value).digest("hex");
}

function monthBucket(date = new Date()): string {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

/** Save the acceptance ledger and the PII lead in one transaction. */
export async function saveAcceptedLead(
  db: DbLike | null,
  input: {
    inquiryId: string;
    route: "estimate-lead" | "consultation" | "re10";
    contact: { email?: string; phone?: string };
    /** Stable non-message scope such as project and normalized property/city. */
    scope: string;
    bucket?: string;
    metadata?: Record<string, string | boolean | number | undefined>;
    saveLead: (tx: any) => Promise<void>;
  },
): Promise<AcceptedLeadResult> {
  if (!db) return { accepted: false, duplicate: false, error: "persistence_unavailable" };
  try {
    return await db.transaction(async (tx) => {
      const contactFingerprint = fingerprint(input.contact);
      // This expires naturally each month, so a later genuine request is not
      // suppressed, while fresh browser IDs cannot recount the same inquiry.
      const duplicateKey = createHmac("sha256", process.env.LEAD_FINGERPRINT_SECRET || process.env.DATABASE_URL || "")
        .update(`${contactFingerprint}|${input.scope.trim().toLowerCase()}|${input.bucket ?? monthBucket()}`)
        .digest("hex");
      const inserted = await tx.insert(inquiryLedger).values({
        inquiryId: input.inquiryId,
        route: input.route,
        contactFingerprint,
        duplicateKey,
        metadata: input.metadata ?? {},
      }).onConflictDoNothing().returning({ id: inquiryLedger.id });
      if (inserted.length === 0) return { accepted: false, duplicate: true } as const;
      await input.saveLead(tx);
      return { accepted: true, duplicate: false } as const;
    });
  } catch (error) {
    console.error("[acceptedLead] durable save failed", error);
    return { accepted: false, duplicate: false, error: "save_failed" };
  }
}