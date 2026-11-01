/**
 * The one-screen request form and its "Have us call you" switch post to the
 * same /api/consultation pipeline. These pin the shapes the server accepts and
 * the callback marker every destination (database row, CRM notes, p5 intake,
 * internal email) carries, so a callback can never arrive looking like an
 * ordinary request or be rejected for a missing list.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import {
  CALLBACK_MARKER,
  MAX_PHOTOS,
  UNSPECIFIED_PROJECT_TYPE,
  appendPhotoLinks,
  consultationBodySchema,
  photoExtension,
  photoProblem,
  photoSafeName,
} from "../server/services/consultationRequest";
import { buildAdminEmailHtml, buildAdminSubject } from "../server/services/consultationEmail";
import { buildLeadNotes } from "../server/services/leadRecord";
import { buildP5IntakeBody, p5ProjectType } from "../server/services/p5IntakeBridge";

const ID = "4b82598a-24f7-48d3-a9b6-ab5a64c44438";

test("the one-screen request needs no project type or address", () => {
  const parsed = consultationBodySchema.safeParse({
    inquiryId: ID,
    name: "Jordan Example",
    phone: "(208) 555-0199",
    email: "",
    preferredContact: "text",
    message: "Patch two doorknob holes, rehang a closet door.",
  });
  assert.ok(parsed.success, JSON.stringify(parsed.success ? "" : parsed.error.flatten()));
  assert.equal(parsed.data.projectType, UNSPECIFIED_PROJECT_TYPE);
  assert.equal(parsed.data.address, "");
  assert.equal(parsed.data.requestKind, "quote");
  assert.equal(parsed.data.message, "Patch two doorknob holes, rehang a closet door.");
  // "task-list" is the value p5 already maps, so the CRM deal keeps a project type.
  assert.equal(p5ProjectType(parsed.data.projectType), "A multi-item home list");
});

test("a callback is name and phone only and is marked for every destination", () => {
  const parsed = consultationBodySchema.safeParse({
    inquiryId: ID,
    name: "Riley Example",
    phone: "208-555-0123",
    requestKind: "callback",
    bestTimeToCall: "Morning",
  });
  assert.ok(parsed.success, JSON.stringify(parsed.success ? "" : parsed.error.flatten()));
  const data = parsed.data;
  assert.equal(data.preferredContact, "phone", "a callback is a call whatever the old default said");
  assert.equal(data.message, `${CALLBACK_MARKER}: please call 208-555-0123. Best time: Morning.`);

  const lead = { ...data, message: data.message };
  assert.match(buildAdminSubject(lead, null), /^Callback request: Riley Example/);
  const html = buildAdminEmailHtml(lead, null, null);
  assert.match(html, /Callback Request/);
  assert.match(html, /Callback request: Riley asked us to call 208-555-0123/);
  assert.match(html, /CALLBACK REQUEST: please call/);
  const notes = buildLeadNotes(lead, null, null);
  assert.match(notes, /Request: CALLBACK REQUEST/);
  assert.match(notes, /Best time: Morning/);
  const intake = buildP5IntakeBody({ name: data.name, phone: data.phone, projectType: data.projectType, message: data.message, inquiryId: ID });
  assert.match(JSON.stringify(intake), /CALLBACK REQUEST/);
});

test("a callback still needs a callable number, and a full request its contact", () => {
  assert.equal(
    consultationBodySchema.safeParse({ inquiryId: ID, name: "Riley", phone: "123", requestKind: "callback" }).success,
    false,
  );
  // An email-preferred callback is still a call: the phone is what is checked.
  assert.equal(
    consultationBodySchema.safeParse({ inquiryId: ID, name: "Riley", phone: "2085550123", email: "", preferredContact: "email", requestKind: "callback" }).success,
    true,
  );
  assert.equal(
    consultationBodySchema.safeParse({ inquiryId: ID, name: "Jordan", phone: "", email: "nope", preferredContact: "email" }).success,
    false,
  );
  assert.equal(consultationBodySchema.safeParse({ inquiryId: ID, name: "J", phone: "2085550123" }).success, false);
});

test("older cached bundles that send the wizard's full body are still accepted unchanged", () => {
  const parsed = consultationBodySchema.safeParse({
    inquiryId: ID,
    name: "Ada Example",
    preferredContact: "email",
    phone: "",
    email: "ada@example.com",
    address: "123 Main St, Boise, ID 83702",
    zip: "83702",
    projectType: "drywall-repair",
    message: "Two holes",
    propertyProfile: null,
    estimate: null,
    website: "",
  });
  assert.ok(parsed.success);
  assert.equal(parsed.data.projectType, "drywall-repair");
  assert.equal(parsed.data.message, "Two holes");
  assert.equal(parsed.data.requestKind, "quote");
});

test("the preferred contact the visitor chose reaches the CRM notes and the internal email", () => {
  const parsed = consultationBodySchema.parse({
    inquiryId: ID,
    name: "Jordan Example",
    phone: "2085550199",
    preferredContact: "text",
    message: "List",
  });
  assert.match(buildLeadNotes(parsed, null, null), /Preferred contact: Text/);
  assert.match(buildAdminEmailHtml(parsed, null, null), /Preferred contact<\/td><td[^>]*>Text</);
  assert.match(buildAdminSubject(parsed, null), /^New consultation request: Jordan Example/);
});

test("photos: type, count and size checks, safe names and links after the list", () => {
  const ok = { type: "image/jpeg", name: "IMG 0001.JPG", size: 1024 };
  assert.equal(photoProblem([ok]), null);
  assert.equal(photoExtension({ type: "", name: "door.heic" }), "heic");
  assert.equal(photoExtension({ type: "application/pdf", name: "plan.pdf" }), null);
  assert.equal(photoExtension({ type: "image/svg+xml", name: "x.svg" }), null);
  assert.match(photoProblem(Array(MAX_PHOTOS + 1).fill(ok)) ?? "", /up to 4 photos/);
  assert.match(photoProblem([{ ...ok, size: 9 * 1024 * 1024 }]) ?? "", /8 MB/);
  assert.match(photoProblem([{ type: "text/html", name: "a.html", size: 10 }]) ?? "", /JPEG, PNG, WebP or HEIC/);
  assert.equal(photoSafeName("../../etc/passwd.jpg", "jpg"), "etc-passwd.jpg");
  assert.equal(
    appendPhotoLinks("Fix the gate", ["https://boisehandyman.co/api/documents/local/a"]),
    "Fix the gate\n\nPhotos:\nhttps://boisehandyman.co/api/documents/local/a",
  );
  assert.equal(appendPhotoLinks("Fix the gate", []), "Fix the gate");
});

test("the route parses through the shared schema and stores photos only after the spam and rate checks", () => {
  const source = readFileSync(new URL("../app/api/consultation/route.ts", import.meta.url), "utf8");
  assert.match(source, /const bodySchema = consultationBodySchema;/);
  const spam = source.indexOf("classifyLeadSpam(");
  const limit = source.indexOf("rateLimit(clientKeyFrom");
  const store = source.indexOf("await storePhotos(");
  const save = source.indexOf("saveAcceptedLead(db");
  assert.ok(spam > 0 && limit > spam && store > limit && save > store);
  assert.match(source, /scope: `\$\{data\.requestKind === "callback" \? "callback\|" : ""\}/);
  // The duplicate scope hashes the list as typed, before the photo links (which carry the inquiry id).
  const fingerprint = source.indexOf("const listScope = listFingerprint(data.message);");
  assert.ok(fingerprint > 0 && fingerprint < store);
  assert.match(source, /\|\$\{listScope\}`,/);
});
