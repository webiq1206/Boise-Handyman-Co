import test from "node:test";
import assert from "node:assert/strict";
import { requireConsultationReceipt } from "../lib/consultationReceipt";
for (const value of [null, undefined, {}, { success: true }, { accepted: false }, { accepted: false, duplicate: true }, { accepted: "true" }]) {
  test(`rejects an unconfirmed receipt: ${JSON.stringify(value)}`, () => assert.throws(() => requireConsultationReceipt(value), /could not confirm/));
}
const saved = { accepted: true, persisted: true, requestId: "consultation:test", submissionId: "test", notificationStatus: "unconfirmed" };
test("saved request does not require a notification receipt", () => assert.equal(requireConsultationReceipt(saved).accepted, true));
test("replay flag is preserved to suppress repeat conversions", () => assert.equal(requireConsultationReceipt({ ...saved, replayed: true }).replayed, true));
test("non-string submission IDs are not propagated", () => assert.equal(requireConsultationReceipt({ ...saved, submissionId: {} }).submissionId, undefined));
test("accepts the existing Handyman durable acceptance contract", () => assert.equal(requireConsultationReceipt({accepted:true}).accepted, true));
