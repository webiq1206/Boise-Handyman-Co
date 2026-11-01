/**
 * Quote form v2 (owner, 1 November 2026): the request is saved first, files
 * follow one upload each, and the optional Step 2 ("Help us prepare") adds to
 * the SAME request. These pin the token, the merge rules, the file checks and
 * the p5 intake payloads (initial and details) every lead reaches HubSpot by.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  DETAILS_MARKER,
  DETAILS_TOKEN_TTL_MS,
  detailsBodySchema,
  detailsSecret,
  issueDetailsToken,
  mergeDetails,
  requestFilePrefix,
  verifyDetailsToken,
  type DetailFile,
  type StoredLead,
} from "../server/services/consultationDetails";
import { consultationBodySchema } from "../server/services/consultationRequest";
import { buildP5IntakeBody } from "../server/services/p5IntakeBridge";
import { buildDetailsAddedEmailHtml, buildDetailsAddedSubject } from "../server/services/consultationDetailsEmail";
import {
  MAX_REQUEST_FILES,
  MAX_REQUEST_FILE_BYTES,
  REQUEST_FILE_ACCEPT,
  REQUEST_FILE_HINT,
  partitionRequestFiles,
  requestFileExtension,
  requestFileKind,
  requestFileProblem,
  requestFileSafeName,
} from "../shared/requestFiles";
import { jobLabel } from "../shared/consultationChoices";

const REQUEST = "8d6c1f5e-2b1a-4c3d-9e8f-0a1b2c3d4e5f";
const INQUIRY = "4b82598a-24f7-48d3-a9b6-ab5a64c44438";
const SECRET = "test-secret-at-least-thirty-two-characters";
const NOW = Date.UTC(2026, 10, 1, 15, 0, 0);

const ROW: StoredLead = {
  id: REQUEST,
  name: "Jordan Example",
  phone: "(208) 555-0199",
  email: "",
  zip: "",
  address: null,
  city: null,
  projectType: "task-list",
  message: "Patch two doorknob holes.\n\nFiles: 2 files are uploading. Links follow in a \"Details added\" update.",
};

const FILES: DetailFile[] = [
  {
    key: `${requestFilePrefix(REQUEST)}0123456789abcdef-hall-wall.jpg`,
    name: "hall-wall.jpg",
    url: `https://boisehandyman.co/api/documents/local/consultation%2F${REQUEST}%2F0123456789abcdef-hall-wall.jpg`,
    contentType: "image/jpeg",
    size: 2_400_000,
  },
  {
    key: `${requestFilePrefix(REQUEST)}fedcba9876543210-shelf-plan.pdf`,
    name: "shelf-plan.pdf",
    url: `https://boisehandyman.co/api/documents/local/consultation%2F${REQUEST}%2Ffedcba9876543210-shelf-plan.pdf`,
    contentType: "application/pdf",
    size: 310_000,
  },
];

/* ───────────── Step 1 payload */

test("Step 1 payload: the list, name, phone, optional email, contact choice and a pending-files count", () => {
  const parsed = consultationBodySchema.parse({
    inquiryId: INQUIRY,
    name: "Jordan Example",
    phone: "(208) 555-0199",
    email: "",
    preferredContact: "text",
    address: "",
    zip: "",
    projectType: "task-list",
    message: "Patch two doorknob holes.",
    requestKind: "quote",
    filesPending: 2,
    propertyProfile: null,
    estimate: null,
    website: "",
  });
  assert.equal(parsed.preferredContact, "text");
  assert.equal(parsed.requestKind, "quote");
  assert.match(parsed.message ?? "", /^Patch two doorknob holes\.\n\nFiles: 2 files are uploading/);
  // A callback is name and phone; its best time travels.
  const callback = consultationBodySchema.parse({
    inquiryId: INQUIRY,
    name: "Riley Example",
    phone: "208-555-0123",
    requestKind: "callback",
    bestTimeToCall: "Morning",
  });
  assert.equal(callback.preferredContact, "phone");
  assert.match(callback.message ?? "", /^CALLBACK REQUEST: please call 208-555-0123\. Best time: Morning\.$/);
});

/* ───────────── token */

test("token: issued for one request, verified, rejected when tampered, for another request, or expired", () => {
  const { token, expiresAt } = issueDetailsToken({ requestId: REQUEST, inquiryId: INQUIRY }, SECRET, NOW);
  assert.equal(expiresAt, NOW + DETAILS_TOKEN_TTL_MS);
  assert.equal(DETAILS_TOKEN_TTL_MS, 2 * 60 * 60 * 1000);
  const ok = { requestId: REQUEST, inquiryId: INQUIRY, token };
  assert.equal(verifyDetailsToken(ok, SECRET, NOW + 60_000), "ok");
  assert.equal(verifyDetailsToken(ok, SECRET, expiresAt + 1), "expired");
  assert.equal(verifyDetailsToken(ok, "another-secret-of-at-least-32-chars!!", NOW), "invalid");
  assert.equal(verifyDetailsToken(ok, null, NOW), "invalid");
  assert.equal(verifyDetailsToken({ ...ok, requestId: "11111111-1111-4111-8111-111111111111" }, SECRET, NOW), "invalid");
  assert.equal(verifyDetailsToken({ ...ok, inquiryId: "11111111-1111-4111-8111-111111111111" }, SECRET, NOW), "invalid");
  // Moving the expiry forward breaks the signature.
  const [, sig] = token.split(".");
  assert.equal(verifyDetailsToken({ ...ok, token: `${expiresAt + 3_600_000}.${sig}` }, SECRET, NOW), "invalid");
  assert.equal(verifyDetailsToken({ ...ok, token: "garbage" }, SECRET, NOW), "invalid");
  // A token minted far in the future (a leaked secret with a long expiry) is not honoured.
  const far = issueDetailsToken({ requestId: REQUEST, inquiryId: INQUIRY }, SECRET, NOW + 24 * 3_600_000);
  assert.equal(verifyDetailsToken({ ...ok, token: far.token }, SECRET, NOW), "invalid");
});

test("token secret: a dedicated secret, else SESSION_SECRET, else the lead fingerprint secret, else off", () => {
  assert.equal(detailsSecret({ LEAD_DETAILS_SECRET: "a".repeat(32), SESSION_SECRET: "b".repeat(32) }), "a".repeat(32));
  assert.equal(detailsSecret({ SESSION_SECRET: "b".repeat(32) }), "b".repeat(32));
  assert.equal(detailsSecret({ LEAD_FINGERPRINT_SECRET: "c".repeat(20) }), "c".repeat(20));
  assert.equal(detailsSecret({ SESSION_SECRET: "short" }), null);
  assert.equal(detailsSecret({}), null);
});

/* ───────────── details merge */

test("details merge: fills blanks only, never overwrites an answer, appends one DETAILS ADDED block", () => {
  const merged = mergeDetails(
    ROW,
    { projectType: "plumbing-repairs", address: "123 Main St, Boise, ID 83702", timing: "Soon", email: "jordan@example.com" },
    FILES,
    { projectLabel: jobLabel, now: new Date(NOW) },
  );
  assert.equal(merged.duplicate, false);
  assert.equal(merged.update.projectType, "plumbing-repairs", "task-list is the unspecified value, so it is refined");
  assert.equal(merged.update.address, "123 Main St, Boise, ID 83702");
  assert.equal(merged.update.zip, "83702");
  assert.equal(merged.update.email, "jordan@example.com");
  assert.ok(merged.update.message?.startsWith(ROW.message as string), "Step 1 notes are kept as they were");
  assert.match(merged.block, new RegExp(`^${DETAILS_MARKER} \\(ref [0-9a-f]{12}, 2026-11-01 15:00 UTC\\)`));
  assert.match(merged.block, /Type of work: Plumbing/);
  assert.match(merged.block, /Timing: Soon/);
  assert.match(merged.block, /Files:\nhall-wall\.jpg \(2\.3 MB\): https:\/\/boisehandyman\.co\/api\/documents\/local\//);
  assert.match(merged.block, /shelf-plan\.pdf \(303 KB\)/);

  // Existing answers stay; the new one is still on record in the block.
  const answered = mergeDetails(
    { ...ROW, email: "first@example.com", address: "9 Oak Ln", zip: "83704", projectType: "drywall-repair" },
    { projectType: "plumbing-repairs", address: "123 Main St, Boise, ID 83702", email: "second@example.com" },
    [],
  );
  assert.deepEqual(Object.keys(answered.update), ["message"]);
  assert.match(answered.block, /Email: second@example\.com/);

  // Blank fields never reach the row.
  const blankOnly = mergeDetails(ROW, { timing: "Just planning" }, []);
  assert.deepEqual(Object.keys(blankOnly.update), ["message"]);

  // A ZIP alone fills the ZIP, not the street address.
  const zipOnly = mergeDetails(ROW, { address: "83646" }, []);
  assert.equal(zipOnly.update.zip, "83646");
  assert.equal(zipOnly.update.address, undefined);
});

test("details merge is idempotent: the same post twice is saved once", () => {
  const details = { timing: "1 to 3 months" as const, address: "83702" };
  const first = mergeDetails(ROW, details, FILES);
  const second = mergeDetails({ ...ROW, message: first.update.message as string }, details, [...FILES].reverse());
  assert.equal(second.duplicate, true);
  assert.deepEqual(second.update, {});
  // A different post is not a duplicate.
  const third = mergeDetails({ ...ROW, message: first.update.message as string }, { timing: "Soon" }, []);
  assert.equal(third.duplicate, false);
});

test("details body: only known fields, known timing values, at most ten files, honeypot must be empty", () => {
  const ok = detailsBodySchema.safeParse({
    requestId: REQUEST,
    inquiryId: INQUIRY,
    token: "1.abc",
    details: { timing: "Soon", address: "  " },
    files: [FILES[0].key],
  });
  assert.ok(ok.success);
  assert.equal(ok.success && ok.data.details.address, undefined, "a blank is dropped, not saved");
  assert.equal(detailsBodySchema.safeParse({ requestId: REQUEST, inquiryId: INQUIRY, token: "x", details: { timing: "Tomorrow" } }).success, false);
  assert.equal(detailsBodySchema.safeParse({ requestId: REQUEST, inquiryId: INQUIRY, token: "x", details: { budget: "1" } }).success, false);
  assert.equal(detailsBodySchema.safeParse({ requestId: REQUEST, inquiryId: INQUIRY, token: "x", details: { email: "nope" } }).success, false);
  assert.equal(detailsBodySchema.safeParse({ requestId: REQUEST, inquiryId: INQUIRY, token: "x", files: Array(11).fill("k") }).success, false);
  assert.equal(detailsBodySchema.safeParse({ requestId: "not-a-uuid", inquiryId: INQUIRY, token: "x" }).success, false);
});

/* ───────────── files */

test("file validation: photos, HEIC and PDFs up to 20 MB each and ten in all; anything else is named and left out", () => {
  assert.equal(MAX_REQUEST_FILES, 10);
  assert.equal(MAX_REQUEST_FILE_BYTES, 20 * 1024 * 1024);
  assert.equal(REQUEST_FILE_ACCEPT, "image/*,application/pdf,.heic,.heif");
  assert.equal(REQUEST_FILE_HINT, "Optional. Photos, PDFs or drawings. Up to 10 files, 20 MB each.");
  assert.equal(requestFileExtension({ type: "application/pdf", name: "plan.pdf" }), "pdf");
  assert.equal(requestFileExtension({ type: "", name: "door.HEIC" }), "heic");
  assert.equal(requestFileExtension({ type: "application/octet-stream", name: "scan.pdf" }), "pdf");
  assert.equal(requestFileExtension({ type: "image/svg+xml", name: "x.svg" }), null);
  assert.equal(requestFileExtension({ type: "text/html", name: "x.pdf" }), null, "a declared type wins over the name");
  assert.equal(requestFileKind({ type: "application/pdf", name: "a.pdf" }), "pdf");
  assert.equal(requestFileKind({ type: "image/png", name: "a.png" }), "image");
  assert.equal(requestFileProblem({ type: "image/jpeg", name: "a.jpg", size: 1024 }), null);
  assert.match(requestFileProblem({ type: "image/jpeg", name: "big.jpg", size: MAX_REQUEST_FILE_BYTES + 1 }) ?? "", /^big\.jpg is larger than 20 MB/);
  assert.match(requestFileProblem({ type: "application/zip", name: "a.zip", size: 10 }) ?? "", /is not a photo or PDF/);
  assert.match(requestFileProblem({ type: "image/jpeg", name: "e.jpg", size: 0 }) ?? "", /is empty/);
  assert.equal(requestFileSafeName("../../etc/passwd.jpg", "jpg"), "etc-passwd.jpg");
  assert.equal(requestFileSafeName("Kitchen plan (rev 2).PDF", "pdf"), "Kitchen-plan-rev-2.pdf");

  const ok = (name: string) => ({ type: "image/jpeg", name, size: 1000 });
  const nine = Array.from({ length: 9 }, (_, i) => ok(`p${i}.jpg`));
  const { accepted, problems } = partitionRequestFiles(
    [ok("p0.jpg"), ok("new.jpg"), ok("one-too-many.jpg"), { type: "text/plain", name: "notes.txt", size: 5 }],
    nine,
  );
  assert.deepEqual(accepted.map((f) => f.name), ["new.jpg"], "a duplicate is skipped, the tenth is added");
  assert.equal(problems.length, 2);
  assert.match(problems[0], /up to 10 files\. one-too-many\.jpg was not added/);
  assert.match(problems[1], /notes\.txt is not a photo or PDF/);
});

test("the files endpoint checks the token, the type and size, and the count, and stores under the request's own prefix", () => {
  const source = readFileSync(new URL("../app/api/consultation/files/route.ts", import.meta.url), "utf8");
  const limit = source.indexOf("rateLimit(clientKeyFrom");
  const token = source.indexOf("verifyDetailsToken(");
  const type = source.indexOf("requestFileProblem(file)");
  const count = source.indexOf("storedCount(prefix)");
  const store = source.indexOf("uploadFile(key");
  assert.ok(limit > 0 && token > limit && type > token && count > type && store > count);
  assert.match(source, /randomBytes\(8\)/, "every stored key has a random part");
  assert.match(source, /form\.get\("website"\)/, "honeypot");
  assert.doesNotMatch(source, /access: "public"|list\(/);
});

/* ───────────── p5 intake payloads (HubSpot) */

test("intake payload, initial: external_id, request_kind, contact_preference and submission_kind", () => {
  const body = buildP5IntakeBody({
    name: "Jordan Example",
    phone: "(208) 555-0199",
    email: "",
    projectType: "task-list",
    message: "Patch two doorknob holes.\n\nPreferred contact: Text",
    inquiryId: INQUIRY,
    requestKind: "quote",
    preferredContact: "text",
    submissionKind: "initial",
  });
  assert.equal(body.external_id, `boisehandyman-consultation:${INQUIRY}`);
  assert.equal(body.externalLeadId, body.external_id, "today's p5 dedupes on externalLeadId; the same id on both");
  assert.equal(body.submission_kind, "initial");
  assert.equal(body.request_kind, "quote");
  assert.equal(body.contact_preference, "text");
  assert.equal(body.files, undefined);
  assert.equal(body.brand, "Boise Handyman Co");

  const call = buildP5IntakeBody({ name: "Riley", phone: "2085550123", inquiryId: INQUIRY, requestKind: "callback", preferredContact: "phone", bestTime: "Morning" });
  assert.equal(call.request_kind, "callback");
  assert.equal(call.contact_preference, "call");
  assert.equal(call.best_time, "Morning");
  assert.equal(call.submission_kind, "initial");
});

test("intake payload, details: same external_id, files with links, timeline, submission_kind details", () => {
  const merged = mergeDetails(ROW, { timing: "Soon", address: "123 Main St, Boise, ID 83702" }, FILES, { now: new Date(NOW) });
  const body = buildP5IntakeBody({
    name: ROW.name,
    phone: ROW.phone,
    email: "",
    address: "123 Main St, Boise, ID 83702",
    zip: "83702",
    projectType: "task-list",
    message: merged.block,
    inquiryId: INQUIRY,
    requestKind: "quote",
    timeline: "Soon",
    files: FILES.map(({ name, url, contentType, size }) => ({ name, url, contentType, size })),
    submissionKind: "details",
  });
  assert.equal(body.external_id, `boisehandyman-consultation:${INQUIRY}`);
  assert.equal(body.submission_kind, "details");
  assert.equal(body.timeline, "Soon");
  assert.deepEqual(body.files, [
    { name: "hall-wall.jpg", url: FILES[0].url, contentType: "image/jpeg", size: 2_400_000 },
    { name: "shelf-plan.pdf", url: FILES[1].url, contentType: "application/pdf", size: 310_000 },
  ]);
  assert.match(String(body.summary), /^DETAILS ADDED \(ref /, "the details block leads, ready to append to the deal");
  assert.match(String(body.summary), /shelf-plan\.pdf \(303 KB\): https:/, "file links are in the deal text too");
  assert.ok(JSON.stringify(body).length < 32 * 1024, "inside the p5 intake body limit");
});

test("the details follow-up email names the person and links each file", () => {
  const merged = mergeDetails(ROW, { timing: "Soon" }, FILES);
  assert.equal(buildDetailsAddedSubject(ROW), "Details added: Jordan Example");
  const html = buildDetailsAddedEmailHtml(ROW, merged.added);
  assert.match(html, /Jordan Example added to the request they sent earlier/);
  assert.match(html, new RegExp(`<a href="${FILES[1].url.replace(/[.?]/g, "\\$&")}"[^>]*>shelf-plan\\.pdf \\(303 KB\\)</a>`));
  assert.match(html, /Timing<\/td><td[^>]*>Soon/);
});

test("the details route validates the token before reading the row and forwards to every destination", () => {
  const source = readFileSync(new URL("../app/api/consultation/details/route.ts", import.meta.url), "utf8");
  const limit = source.indexOf("rateLimit(clientKeyFrom");
  const token = source.indexOf("verifyDetailsToken(");
  const read = source.indexOf(".from(consultationRequests)");
  const dup = source.indexOf("if (merged.duplicate)");
  const write = source.indexOf("db.update(consultationRequests)");
  assert.ok(limit > 0 && token > limit && read > token && dup > read && write > dup);
  for (const destination of ["forwardConsultationToP5Intake(", "forwardToLeadDashboard(", "buildDetailsAddedEmailHtml("]) {
    assert.ok(source.indexOf(destination) > write, `${destination} runs after the merge is saved`);
  }
  assert.match(source, /submissionKind: "details"/);
  assert.match(source, /key\.startsWith\(prefix\)/, "only files stored under this request are accepted");
  assert.doesNotMatch(source, /await\s+forwardConsultationToP5Intake/);
});
