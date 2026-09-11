/* Isolated acceptance checks. No production DB, CRM, email, or browser endpoint. */
import assert from "node:assert/strict";
import { saveAcceptedLead } from "../server/services/acceptedLead";
import { classifyLeadSpam } from "../server/services/leadSpam";
import { rateLimit } from "../lib/rateLimit";
import { googleAdsConversionPayload } from "../lib/analytics";

process.env.LEAD_FINGERPRINT_SECRET = "test-only-secret";
const committed = new Set<string>();
const inquiryToKeys = new Map<string, string[]>();
let leadWrites = 0;
const fakeDb = {
  execute: async () => undefined,
  insert: () => ({
    values: (row: { inquiryId?: string; duplicateKey?: string }) => {
      if (!row.duplicateKey) return Promise.resolve(undefined);
      return {
        onConflictDoNothing: () => ({
          returning: async () => {
            if (committed.has(row.inquiryId!) || committed.has(row.duplicateKey!)) return [];
            const keys = [row.inquiryId!, row.duplicateKey!];
            keys.forEach((key) => committed.add(key));
            inquiryToKeys.set(row.inquiryId!, keys);
            return [{ id: row.inquiryId }];
          },
        }),
      };
    },
  }),
  delete: () => ({
    where: () => {
      const pending = [...inquiryToKeys.entries()].at(-1);
      if (pending) {
        pending[1].forEach((key) => committed.delete(key));
        inquiryToKeys.delete(pending[0]);
      }
      return Promise.resolve(undefined);
    },
  }),
};
const contact = { email: "person@example.test", phone: "2085550100" };
async function save(id: string, scope = "painting|boise", fail = false) {
  return saveAcceptedLead(fakeDb, {
    inquiryId: id, route: "estimate-lead", contact, scope, bucket: "2026-02",
    saveLead: async () => {
      if (fail) throw new Error("insert failure");
      leadWrites++;
    },
  });
}
async function main() {
  const id1 = "00000000-0000-4000-8000-000000000001";
  assert.equal((await save(id1)).accepted, true, "new lead accepted");
  assert.equal((await save(id1)).duplicate, true, "same ID same route duplicate");
  // Same inquiry ID is authoritative across quote/follow-up routes.
  assert.equal((await saveAcceptedLead(fakeDb, {
    inquiryId: id1, route: "consultation", contact, scope: "remodel|different address", bucket: "2026-02",
    saveLead: async () => { leadWrites++; },
  })).duplicate, true);
  assert.equal((await save("00000000-0000-4000-8000-000000000002")).duplicate, true, "fresh ID same payload duplicate");
  assert.equal((await save("00000000-0000-4000-8000-000000000003", "painting|meridian")).accepted, true, "different inquiry accepted");

  const retry = "00000000-0000-4000-8000-000000000004";
  assert.equal((await save(retry, "deck|boise", true)).accepted, false, "failed lead save rejected");
  assert.equal((await save(retry, "deck|boise")).accepted, true, "rollback permits retry");
  assert.equal((await saveAcceptedLead(null, {
    inquiryId: "00000000-0000-4000-8000-000000000005", route: "re10", contact: {}, scope: "re10|site",
    saveLead: async () => { throw new Error("must not run"); },
  })).error, "persistence_unavailable");

  // The same `website` field is sent by estimate, consultation, and RE-10.
  assert.equal(classifyLeadSpam({ honeypot: "https://spam.test" }).spam, true);
  assert.equal(classifyLeadSpam({ name: "Test", message: "normal project" }).reason, "test_junk");
  assert.equal(classifyLeadSpam({ name: "Jane", message: "https://a.test https://b.test https://c.test" }).reason, "url_stuffing");
  assert.equal(classifyLeadSpam({ name: "Jane", message: "aaaaaaaaaaaa repair" }).reason, "repeated_characters");
  assert.equal(classifyLeadSpam({ name: "Jane", message: "Need a kitchen repair, please." }).spam, false);
  const rateKey = `isolated-${Date.now()}`;
  assert.equal(rateLimit(rateKey, 2, 60_000).ok, true);
  assert.equal(rateLimit(rateKey, 2, 60_000).ok, true);
  assert.equal(rateLimit(rateKey, 2, 60_000).ok, false);
  assert.deepEqual(googleAdsConversionPayload(), { send_to: "AW-18354188204/LE2vCPXstO8cEKzf-q9E" });
  assert.deepEqual(Object.keys(googleAdsConversionPayload()), ["send_to"], "analytics has no PII");
  assert.equal(leadWrites, 3);
  console.log("accepted-lead fake-ledger checks passed");
}
main().catch((error) => { console.error(error); process.exitCode = 1; });