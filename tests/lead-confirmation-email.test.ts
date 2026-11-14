/**
 * Lead confirmation wording and the Schedule now button. No mail is sent.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildCustomerEmailHtml, buildCustomerSubject } from "../server/services/consultationEmail";
import { buildRe10CustomerEmail } from "../server/services/re10Email";
import { EMPTY_REFINEMENTS } from "../shared/estimateEngine";
import {
  ESTIMATE_DISCLAIMER,
  HANDYMAN_ACCENT,
  SCHEDULE_URL,
  SHARED_DISCLAIMER,
  durationChoice,
  leadConfirmationPlainText,
  requestLetter,
  scheduleIntentFor,
} from "../server/services/scheduleEmail";

const BANNED = new RegExp(`${String.fromCharCode(0x2014)}|Perkins 5|showroom|\\bshop\\b`, "i");

function visible(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
}

const lead = {
  name: "Ada Example",
  phone: "(208) 555-0100",
  email: "ada@example.invalid",
  address: "",
  projectType: "task-list",
  message: "Patch two holes.",
  preferredContact: "email" as const,
};

test("a project request names the 1 hour walkthrough and a callback names the 15 minute consult", () => {
  const project = buildCustomerEmailHtml({ ...lead, requestKind: "quote" }, null);
  const callback = buildCustomerEmailHtml({ ...lead, requestKind: "callback" }, null);
  assert.equal(buildCustomerSubject({ ...lead, requestKind: "quote" }, null), "We received your request | Boise Handyman Co");
  assert.match(visible(project), /Thanks for reaching out to Boise Handyman Co/);
  assert.match(visible(project), /someone from the team will follow up shortly/);
  assert.match(visible(project), new RegExp(durationChoice("walkthrough").replace(/[.]/g, "\\.")));
  assert.match(visible(callback), new RegExp(durationChoice("consult")));
  assert.match(visible(project), /We work hard to make any estimate we share as realistic as we can/);
  assert.match(visible(project), /within your budget/);
  for (const html of [project, callback]) {
    assert.match(html, new RegExp(SCHEDULE_URL.replace(/[.]/g, "\\.")));
    assert.match(html, /background-color:#383837/);
    assert.match(html, /color:#ffffff/);
    assert.match(html, /v:roundrect/);
    assert.match(html, /width="100%"/);
    assert.match(html, new RegExp(HANDYMAN_ACCENT, "i"));
    assert.match(html, />Schedule now</);
    assert.doesNotMatch(`${visible(html)}`, BANNED);
    const text = leadConfirmationPlainText(html);
    assert.ok(text.includes(`Schedule now: ${SCHEDULE_URL}`));
    assert.doesNotMatch(text, /v:roundrect/);
    assert.match(text, /within your budget/);
  }
  const chat = buildCustomerEmailHtml({ ...lead, message: "Submitted via assistant chat | hallway paint" }, null);
  assert.match(visible(chat), /15 minute option for a phone consult/);
  assert.equal(scheduleIntentFor({ requestKind: "callback" }), "consult");
  assert.equal(scheduleIntentFor({ requestKind: "quote" }), "walkthrough");
  assert.equal(scheduleIntentFor({ form: "Site Chat" }), "consult");
});

test("the request letter matches the parent short-form copy", () => {
  const message = requestLetter({ firstName: "Ada", intent: "walkthrough" });
  assert.match(message.text, /^Hi Ada,/);
  assert.match(message.text, /choose the 1 hour option for a home walkthrough/);
  assert.ok(message.text.includes(SHARED_DISCLAIMER));
  assert.ok(message.text.includes(`Schedule now: ${SCHEDULE_URL}`));
  assert.match(message.text, /call \(208\) 477-1169/);
  assert.match(message.text, /The Boise Handyman Co team/);
  assert.doesNotMatch(`${message.text}\n${visible(message.html)}`, BANNED);
  const blank = requestLetter({ firstName: "  ", intent: "consult" });
  assert.match(blank.text, /^Hi there,/);
  assert.match(blank.text, /15 minute option for a phone consult/);
});

test("a planning range confirmation uses the walkthrough disclaimer and keeps its subject", () => {
  const estimate = {
    project: "kitchen" as const,
    finish: "mid-range" as const,
    sqft: 180,
    priceLow: 12000,
    priceHigh: 18000,
    roi: 0,
    confidence: "Planning range",
    refinements: EMPTY_REFINEMENTS,
    included: [] as string[],
  };
  const html = buildCustomerEmailHtml(lead, estimate);
  assert.equal(buildCustomerSubject(lead, estimate), "Your Kitchen planning range | Boise Handyman Co");
  const text = visible(html);
  assert.match(text, /Here is the planning range you built/);
  assert.match(text, /choose the 1 hour option/);
  assert.match(text, new RegExp(ESTIMATE_DISCLAIMER.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").slice(0, 40)));
  assert.match(text, /\$12,000 to \$18,000/);
  assert.doesNotMatch(text, /firm number|firm price|guaranteed price/);
  assert.match(html, />Schedule now</);
  assert.doesNotMatch(text, BANNED);
  const callback = buildCustomerEmailHtml({ ...lead, requestKind: "callback" }, estimate);
  assert.match(visible(callback), /15 minute option for a phone consult/);
  assert.match(visible(callback), /that estimate as realistic/);
});

test("the RE-10 confirmation is a 1 hour walkthrough and keeps the reviewed pricing policy", () => {
  const html = buildRe10CustomerEmail(
    {
      name: "Dana Smith",
      email: "d@example.invalid",
      phone: "2085550000",
      preferredContact: "email",
      role: "buyer",
      propertyAddress: "742 Elm St, Boise ID",
    },
    {
      price: 840,
      validDays: 14,
      categories: [{ trade: "drywall", itemCount: 1, items: [{ description: "Patch a hole", quantityAssumed: false }] }],
      needsOnsite: [{ description: "Foundation crack", why: "Needs a look" }],
      uncertainty: [],
      assumptions: ["Standard access"],
    },
  );
  const text = visible(html);
  assert.match(text, /choose the 1 hour option/);
  assert.match(text, /We work hard to make that estimate as realistic as we can/);
  assert.match(html, /background-color:#383837/);
  assert.match(html, />Schedule now</);
  assert.match(text, /\$840/);
  assert.match(text, /Held for 14 days/);
  assert.match(text, /agreed in writing/);
  assert.match(text, /Not included: needs an onsite look/);
  assert.doesNotMatch(text, BANNED);
  assert.ok(leadConfirmationPlainText(html).includes(SCHEDULE_URL));
});

test("customer mail still sends only when the lead left an email address", () => {
  const route = readFileSync("app/api/consultation/route.ts", "utf8");
  assert.match(route, /if \(data\.email\)/);
  assert.match(route, /leadConfirmationPlainText\(customerHtml\)/);
  const re10 = readFileSync("server/services/re10Lead.ts", "utf8");
  assert.match(re10, /if \(contact\.email\)/);
  assert.match(re10, /leadConfirmationPlainText\(customerHtml\)/);
  const form = readFileSync("components/ConsultationForm.tsx", "utf8");
  assert.match(form, /phone/);
  assert.doesNotMatch(form, /Schedule now/);
});
