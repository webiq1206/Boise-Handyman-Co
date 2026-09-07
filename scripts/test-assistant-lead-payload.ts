/* Regression guard: inspect assistant request construction without fetch/delivery. */
import assert from "node:assert/strict";
import { buildAssistantLeadRequest } from "../server/services/assistant/tools";

const request = buildAssistantLeadRequest(
  { name: "Jane Doe", email: "jane@example.test", phone: "2085550100", buildArea: "Boise", notes: "Paint a room" },
  "General inquiry (assistant chat)",
  undefined,
  "00000000-0000-4000-8000-000000000010",
);
assert.equal(request.endpoint, "/api/consultation");
assert.equal(request.body.inquiryId, "00000000-0000-4000-8000-000000000010");
assert.equal(request.body.website, "");
assert.equal(request.body.preferredContact, "email");
assert.equal(request.body.estimate, null);
assert.equal(request.body.projectType, "General inquiry (assistant chat)");
console.log("assistant lead payload checks passed");