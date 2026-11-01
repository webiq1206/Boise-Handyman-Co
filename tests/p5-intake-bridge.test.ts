import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { SITE_CONFIG } from "../shared/siteConfig";
import {
  P5_CONSULTATION_FORM,
  P5_HANDYMAN_BRAND,
  P5_INTAKE_URL,
  P5_PROJECT_TYPE_BY_VISITOR_LABEL,
  UNMAPPED_P5_PROJECT_TYPES,
  buildP5IntakeBody,
  forwardConsultationToP5Intake,
  p5ProjectType,
} from "../server/services/p5IntakeBridge";

/** Values p5 hubspotProjectType keeps at tip 8a33b28c (enum or alias key). */
const ACCEPTED_BY_P5 = new Set([
  "handyman",
  "Home repairs or handyman work",
  "re10",
  "Drywall or trim repair",
  "Mounting or installation",
  "Deck or exterior repair",
  "A multi-item home list",
  "Custom home",
  "Semi-custom home",
  "Build on land I own",
  "kitchen",
  "bathroom",
  "whole-home",
  "addition",
  "Home addition",
  "adu",
  "Accessory dwelling unit (ADU)",
  "Basement finishing",
  "new-construction",
]);

const FORM_SLUGS: Record<string, string> = {
  "drywall-repair": "Drywall or trim repair",
  "painting-touch-ups": "handyman",
  "plumbing-repairs": "handyman",
  "electrical-repairs": "handyman",
  "carpentry-trim-repair": "Drywall or trim repair",
  "mounting-assembly": "Mounting or installation",
  "fence-deck-gutter-repair": "Deck or exterior repair",
  "home-maintenance": "handyman",
  "task-list": "A multi-item home list",
  other: "other",
};

test("brand string is the p5 BRANDS value and the live site name", () => {
  assert.equal(P5_HANDYMAN_BRAND, "Boise Handyman Co");
  assert.equal(SITE_CONFIG.name, P5_HANDYMAN_BRAND);
});

test("known consultation choices map onto p5 project types, and unknown ones pass through", () => {
  for (const [slug, expected] of Object.entries(FORM_SLUGS)) {
    assert.equal(p5ProjectType(slug), expected, slug);
  }
  for (const label of UNMAPPED_P5_PROJECT_TYPES) {
    assert.equal(p5ProjectType(label), label);
    assert.equal(P5_PROJECT_TYPE_BY_VISITOR_LABEL[label], undefined);
  }
  for (const [from, to] of Object.entries(P5_PROJECT_TYPE_BY_VISITOR_LABEL)) {
    assert.ok(ACCEPTED_BY_P5.has(to), `${from} -> ${to} is not a p5 alias or HubSpot option`);
  }
  assert.equal(p5ProjectType("  handyman  "), "handyman");
  assert.equal(p5ProjectType("Home repairs or handyman work"), "Home repairs or handyman work");
  assert.equal(p5ProjectType(""), null);
});

test("intake body uses the fields the p5 route already reads", () => {
  const body = buildP5IntakeBody({
    name: "  Ada Example  ",
    email: "ada@example.com",
    phone: "(208) 555-0100",
    address: "123 Main St",
    city: "Boise",
    zip: "83702",
    projectType: "painting-touch-ups",
    message: "Two rooms and a door.",
    inquiryId: "11111111-1111-4111-8111-111111111111",
  });
  assert.deepEqual(body, {
    brand: "Boise Handyman Co",
    name: "Ada Example",
    form: P5_CONSULTATION_FORM,
    source: "Other",
    sourceDetail: "boisehandyman.co consultation",
    projectType: "handyman",
    email: "ada@example.com",
    phone: "(208) 555-0100",
    address: "123 Main St, 83702",
    city: "Boise",
    summary: "Visitor project: painting-touch-ups\n\nTwo rooms and a door.",
    externalLeadId: "boisehandyman-consultation:11111111-1111-4111-8111-111111111111",
    external_id: "boisehandyman-consultation:11111111-1111-4111-8111-111111111111",
    submission_kind: "initial",
  });
});

test("a junk optional phone is left off when the email can still be stored", () => {
  const body = buildP5IntakeBody({
    name: "Ada Example",
    email: "ada@example.com",
    phone: "555",
    projectType: "other",
    message: "Not sure yet.",
  });
  assert.equal(body.email, "ada@example.com");
  assert.equal(body.phone, undefined);
  assert.equal(body.projectType, "other");
  assert.equal(body.summary, "Not sure yet.");
});

test("phone-only consultations omit an empty email", () => {
  const body = buildP5IntakeBody({
    name: "Ada Example",
    email: "",
    phone: "2085550100",
    projectType: "task-list",
    address: "123 Main St, 83702",
    zip: "83702",
  });
  assert.equal(body.email, undefined);
  assert.equal(body.phone, "2085550100");
  assert.equal(body.address, "123 Main St, 83702");
  assert.equal(body.projectType, "A multi-item home list");
  assert.match(String(body.summary), /Visitor project: task-list/);
});

test("bridge posts once and swallows transport and HTTP failures", async () => {
  const calls: Array<{ url: string; init: RequestInit }> = [];
  const ok = async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(JSON.stringify({ ok: true, accepted: true }), { status: 201 });
  };
  await forwardConsultationToP5Intake(
    { name: "Ada Example", email: "ada@example.com", projectType: "home-maintenance" },
    ok,
  );
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, P5_INTAKE_URL);
  assert.equal(calls[0].init.method, "POST");
  const sent = JSON.parse(String(calls[0].init.body));
  assert.equal(sent.brand, "Boise Handyman Co");
  assert.equal(sent.projectType, "handyman");
  assert.equal(sent.form, "Handyman consultation");

  await assert.doesNotReject(() =>
    forwardConsultationToP5Intake(
      { name: "Ada Example", email: "ada@example.com", projectType: "other" },
      async () => {
        throw new Error("network down");
      },
    ),
  );
  await assert.doesNotReject(() =>
    forwardConsultationToP5Intake(
      { name: "Ada Example", email: "ada@example.com", projectType: "other" },
      async () => new Response("no", { status: 500 }),
    ),
  );
});

test("consultation success path schedules the bridge without awaiting it", () => {
  const source = readFileSync(new URL("../app/api/consultation/route.ts", import.meta.url), "utf8");
  const acceptedGate = source.indexOf("if (!accepted.accepted)");
  const bridge = source.indexOf("forwardConsultationToP5Intake(");
  const keptAlive = source.indexOf("after(() => bridge)");
  const resend = source.indexOf("await getUncachableEmailClient");
  const dashboard = source.indexOf("forwardToLeadDashboard(");
  assert.ok(acceptedGate >= 0 && bridge > acceptedGate, "bridge runs only after a durable accept");
  assert.ok(keptAlive > bridge, "bridge is kept alive with after(), not awaited");
  assert.ok(dashboard > acceptedGate, "BRC dashboard forward still runs on accept");
  assert.ok(resend > bridge, "Resend still runs and is not gated on the bridge");
  assert.doesNotMatch(source, /await\s+forwardConsultationToP5Intake/);
  assert.doesNotMatch(source, /HUBSPOT_TOKEN|@hubspot/);
});
