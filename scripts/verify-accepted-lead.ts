/**
 * Proves the lead ledger without an interactive transaction, against an
 * in-process Postgres (pglite), the way the HTTP Neon driver runs it live:
 *
 *   1. a first inquiry is accepted and the lead saver runs once
 *   2. the same inquiry id again is reported as a duplicate, the saver not run
 *   3. the same contact and scope in the same month is a duplicate too
 *   4. a saver failure releases the claim, so the visitor's retry is accepted
 *   5. a different month bucket for the same contact is accepted again
 *
 * Run: npm run verify:accepted-lead
 */
import assert from "node:assert/strict";
import { PGlite } from "@electric-sql/pglite";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "../shared/schema";
import { saveAcceptedLead, type LeadDb } from "../server/services/acceptedLead";

async function main() {
  process.env.LEAD_FINGERPRINT_SECRET ||= "verify-accepted-lead";
  const pg = new PGlite();
  // The service is typed against the neon-http client; pglite exposes the
  // same query builder surface, which is all the service uses.
  const db = drizzle(pg, { schema }) as unknown as LeadDb;
  const saved: string[] = [];
  const base = {
    route: "estimate-lead" as const,
    contact: { email: "Test@Example.com", phone: "(208) 555-0100" },
    scope: "drywall|Boise",
    bucket: "2026-09",
  };

  let r = await saveAcceptedLead(db, { ...base, inquiryId: "inq-1", saveLead: async () => { saved.push("inq-1"); } });
  assert.deepEqual(r, { accepted: true, duplicate: false }, "first inquiry accepted");
  assert.deepEqual(saved, ["inq-1"]);

  r = await saveAcceptedLead(db, { ...base, inquiryId: "inq-1", saveLead: async () => { saved.push("again"); } });
  assert.deepEqual(r, { accepted: false, duplicate: true }, "same inquiry id is a duplicate");
  assert.deepEqual(saved, ["inq-1"], "saver not run for a duplicate");

  r = await saveAcceptedLead(db, { ...base, inquiryId: "inq-2", contact: { email: "test@example.com", phone: "2085550100" }, saveLead: async () => { saved.push("inq-2"); } });
  assert.deepEqual(r, { accepted: false, duplicate: true }, "same contact and scope this month is a duplicate");

  const silent = console.error;
  console.error = () => {};
  r = await saveAcceptedLead(db, { ...base, inquiryId: "inq-3", scope: "painting|Boise", saveLead: async () => { throw new Error("simulated outage"); } });
  console.error = silent;
  assert.deepEqual(r, { accepted: false, duplicate: false, error: "save_failed" }, "saver failure is reported");
  r = await saveAcceptedLead(db, { ...base, inquiryId: "inq-3", scope: "painting|Boise", saveLead: async () => { saved.push("inq-3"); } });
  assert.deepEqual(r, { accepted: true, duplicate: false }, "retry after a failed save is accepted, not a duplicate");
  assert.deepEqual(saved, ["inq-1", "inq-3"]);

  r = await saveAcceptedLead(db, { ...base, inquiryId: "inq-4", bucket: "2026-10", saveLead: async () => { saved.push("inq-4"); } });
  assert.deepEqual(r, { accepted: true, duplicate: false }, "a new month accepts the same contact again");

  const rows = await pg.query<{ n: number }>("SELECT count(*)::int AS n FROM inquiry_ledger");
  assert.equal(rows.rows[0].n, 3, "one ledger row per accepted inquiry");
  await pg.close();
  console.log("verify:accepted-lead: ledger claim, duplicate guard and claim release verified (pglite).");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
