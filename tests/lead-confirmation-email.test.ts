/**
 * Lead confirmation wording and the Schedule now button. No mail is sent.
 */
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

import { buildAdminEmailHtml, buildCustomerEmailHtml, buildCustomerSubject } from "../server/services/consultationEmail";
import { buildEmailFooter, htmlToPlainText } from "../server/services/emailLayout";
import { buildRe10AdminEmail, buildRe10CustomerEmail } from "../server/services/re10Email";
import { EMPTY_REFINEMENTS } from "../shared/estimateEngine";
import { estimateRe10 } from "../shared/costs/re10Repairs";
import {
  ESTIMATE_ADJUST_NOTE,
  ESTIMATE_DISCLAIMER,
  ESTIMATE_FAMILY_PS,
  HANDYMAN_ACCENT,
  SCHEDULE_URL,
  SHARED_DISCLAIMER,
  decoratePreliminaryEstimateEmail,
  durationChoice,
  estimatePostscript,
  estimateScheduleLetter,
  leadConfirmationPlainText,
  requestLetter,
  scheduleIntentFor,
} from "../server/services/scheduleEmail";
import { estimateEmail } from "../lib/p5/estimateEmail.ts";
import { issueRecord } from "../lib/p5/estimateDocument.ts";
import { ESTIMATOR_BRAND } from "../lib/p5/brand.ts";

const BANNED = new RegExp(`${String.fromCharCode(0x2014)}|Perkins 5|showroom|\\bshop\\b`, "i");

function visible(html: string): string {
  return html.replace(/<!--[\s\S]*?-->/g, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ");
}

/** The words the owner approved for estimate emails, 16 November 2026. Pinned here, letter for letter. */
const ADJUST =
  "If something is missing, or you'd like to change the scope, the finishes or the timing, tell us. It's easy to adjust, and we'd rather get it right than have you guessing.";
const FAMILY_PS =
  "P.S. Anything else on your list? Boise Handyman Co is part of P5 Home Co, the company behind Boise Construction Co, Boise Remodeling Co and Boise Cabinet Co. So whether it's a few repairs, new cabinets, a full kitchen or bath remodel, an addition or a new home, tell us and we'll plan it alongside this project.";

const squash = (value: string) => value.replace(/\s+/g, " ").trim();
const count = (haystack: string, needle: string) => haystack.split(needle).length - 1;

/**
 * An estimate email: the Hey greeting, the invitation to adjust ahead of the
 * disclaimer, one Schedule now button, and the P.S. as the last paragraph in
 * both the HTML and the plain text. Only the shell footer (wordmark, address,
 * phone) may follow it.
 */
function assertEstimateWording(html: string, firstName: string): void {
  const text = leadConfirmationPlainText(html);
  const footer = squash(htmlToPlainText(buildEmailFooter()));

  for (const body of [squash(visible(html)), squash(text)]) {
    assert.ok(body.includes(`Hey ${firstName},`), "greets with Hey");
    assert.doesNotMatch(body, new RegExp(`\\bHi ${firstName}\\b`));
    assert.equal(count(body, ADJUST), 1, "the adjust paragraph appears once");
    assert.equal(count(body, FAMILY_PS), 1, "the P.S. appears once");
    assert.ok(body.indexOf(`Hey ${firstName},`) < body.indexOf(ADJUST));
    assert.ok(body.indexOf(ADJUST) < body.indexOf("We work hard to make that estimate"), "adjust comes before the disclaimer");
    assert.ok(body.indexOf("We work hard to make that estimate") < body.indexOf(FAMILY_PS));
    assert.ok(body.lastIndexOf("The Boise Handyman Co team") < body.indexOf(FAMILY_PS), "the P.S. follows the sign-off");
  }

  // Last paragraph: nothing but the shell footer comes after it.
  assert.ok(squash(text).endsWith(`${FAMILY_PS} ${footer}`), "plain text ends with the P.S. and the footer");
  const afterPs = html.slice(html.indexOf("P.S. Anything else on your list?"));
  const closing = afterPs.slice(afterPs.indexOf("</p>") + 4, afterPs.indexOf('<div class="footer"'));
  assert.equal(squash(visible(closing)), "", "no content between the P.S. and the footer");

  // One Schedule now button, to the booking page.
  assert.equal(count(html.replace(/<!--\[if mso\]>[\s\S]*?<!\[endif\]-->/g, ""), ">Schedule now<"), 1);
  assert.equal(count(text, SCHEDULE_URL), 1);
  assert.ok(text.includes(`Schedule now: ${SCHEDULE_URL}`));
  assert.equal(SCHEDULE_URL, "https://meetings-na2.hubspot.com/client3");
  assert.doesNotMatch(`${visible(html)}\n${text}`, BANNED);
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
  for (const html of [project, callback]) {
    const body = `${visible(html)}\n${leadConfirmationPlainText(html)}`;
    assert.match(body, /Hi Ada,/);
    assert.doesNotMatch(body, /Hey Ada/);
    assert.doesNotMatch(body, /P\.S\./);
    assert.doesNotMatch(body, /Anything else on your list/);
    assert.doesNotMatch(body, /It's easy to adjust/);
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
  for (const letter of [message, blank]) {
    const body = `${letter.text}\n${visible(letter.html)}`;
    assert.doesNotMatch(body, /Hey /);
    assert.doesNotMatch(body, /P\.S\./);
    assert.doesNotMatch(body, /Anything else on your list/);
    assert.doesNotMatch(body, /It's easy to adjust/);
  }
});

test("the estimate wording is the owner's, word for word, and lives in one module", () => {
  assert.equal(ESTIMATE_ADJUST_NOTE, ADJUST);
  assert.equal(ESTIMATE_FAMILY_PS, FAMILY_PS);
  const postscript = estimatePostscript();
  assert.equal(postscript.text, FAMILY_PS);
  assert.equal(squash(visible(postscript.html)), FAMILY_PS);

  const letter = estimateScheduleLetter({ firstName: "Ada", intro: "Here it is.", intent: "walkthrough" });
  const paragraphs = letter.text.split("\n\n");
  assert.equal(paragraphs[0], "Hey Ada,");
  assert.equal(paragraphs.indexOf(ADJUST) + 1, paragraphs.indexOf(ESTIMATE_DISCLAIMER), "adjust sits directly before the disclaimer");
  assert.ok(paragraphs.indexOf(`Schedule now: ${SCHEDULE_URL}`) < paragraphs.indexOf(ADJUST));
  assert.equal(paragraphs.at(-1), "The Boise Handyman Co team");
  const shown = squash(visible(letter.html));
  for (const paragraph of paragraphs) {
    if (!paragraph.startsWith("Schedule now:")) assert.ok(shown.includes(paragraph), paragraph);
  }
  assert.match(letter.html, />Schedule now</);
  // The letter is embedded above the estimate, so the P.S. is added by the email builder, at the end.
  assert.doesNotMatch(`${letter.text}\n${shown}`, /P\.S\./);
  assert.match(estimateScheduleLetter({ firstName: " ", intro: "Here it is.", intent: "consult" }).text, /^Hey there,/);

  // One copy of the words: the builders import them.
  const escaped = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  for (const file of ["server/services/consultationEmail.ts", "server/services/re10Email.ts", "server/services/re10Lead.ts", "app/api/consultation/route.ts"]) {
    const source = readFileSync(file, "utf8");
    assert.doesNotMatch(source, new RegExp(escaped("Anything else on your list")), file);
    assert.doesNotMatch(source, new RegExp(escaped("easy to adjust")), file);
  }
  for (const file of ["server/services/consultationEmail.ts", "server/services/re10Email.ts"]) {
    assert.match(readFileSync(file, "utf8"), /estimatePostscript\(\)\.html/, file);
  }
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
  assert.match(text, /The next step is a home walkthrough, so we can see the property and turn this estimate into a true bid/);
  assertEstimateWording(html, "Ada");
  const callback = buildCustomerEmailHtml({ ...lead, requestKind: "callback" }, estimate);
  assert.match(visible(callback), /15 minute option for a phone consult/);
  assert.match(visible(callback), /that estimate as realistic/);
  assertEstimateWording(callback, "Ada");

  // The team's copy of the same lead carries none of the customer wording.
  const admin = buildAdminEmailHtml(lead, estimate);
  const adminBody = `${visible(admin)}\n${leadConfirmationPlainText(admin).replace(`Schedule now: ${SCHEDULE_URL}`, "")}`;
  assert.doesNotMatch(adminBody, /P\.S\./);
  assert.doesNotMatch(adminBody, /Anything else on your list/);
  assert.doesNotMatch(adminBody, /It's easy to adjust/);
  assert.doesNotMatch(adminBody, /Hey Ada/);
  assert.doesNotMatch(admin, /meetings-na2\.hubspot\.com/);
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
  assert.match(text, /The next step is a home walkthrough, so we can see the property and turn this estimate into a true bid/);
  assertEstimateWording(html, "Dana");

  // The team's copy of an RE-10 lead carries none of the customer wording.
  const admin = buildRe10AdminEmail(
    { name: "Dana Smith", email: "d@example.invalid", phone: "2085550000", preferredContact: "email", role: "buyer", propertyAddress: "742 Elm St, Boise ID" },
    estimateRe10(
      [{ id: "1", kind: "toilet-repair", description: "Running toilet, guest bath" }],
      { occupancy: "vacant", access: "standard", daysToDeadline: 45, hasInspectionReport: true },
    ),
  );
  const adminBody = `${visible(admin)}\n${leadConfirmationPlainText(admin).replace(`Schedule now: ${SCHEDULE_URL}`, "")}`;
  assert.doesNotMatch(adminBody, /P\.S\./);
  assert.doesNotMatch(adminBody, /Anything else on your list/);
  assert.doesNotMatch(adminBody, /It's easy to adjust/);
  assert.doesNotMatch(adminBody, /Hey Dana/);
  assert.doesNotMatch(admin, /meetings-na2\.hubspot\.com/);
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

test("the document estimator's customer email is sent with the greeting, the schedule button, the adjust note and the P.S.; the team's is not", () => {
  const id = "0f1e2d3c-4b5a-4000-8000-00000000abcd";
  const contact = { name: "Ada Lovelace", email: "qa@example.invalid", phone: "(208) 555-0100" };
  const scope = { text: "Replace two interior doors.", answers: { service: "handyman", finish: "mid-range", location: "Boise, ID" }, uploads: [], uncertainFields: [] as string[] };
  const customer = {
    range: { low: 6800, high: 7500 },
    categoryRanges: [{ category: "Doors", low: 4000, high: 4400 }],
    lineItems: [],
    exclusions: ["Painting"],
    verificationItems: ["Confirm door style."],
    issue: issueRecord({ brandId: ESTIMATOR_BRAND.id, id, revision: 1, now: new Date("2026-11-16T18:00:00Z"), contact, scope }),
  };
  const record = { customer, contact, internal: { directCost: 4430, contractPrice: 7166, lines: [], warnings: [] } };
  const subject = "Your Boise Handyman Co preliminary estimate P5-0F1E2D3C";

  const keys = ["P5_LINK_SECRET", "DATABASE_URL", "REPLIT_DB_URL"] as const;
  const saved = keys.map((key) => process.env[key]);
  try {
    for (const withLink of [true, false]) {
      if (withLink) process.env.P5_LINK_SECRET = "offline-test-only";
      else for (const key of keys) delete process.env[key];
      const original = estimateEmail(id, record, false);
      assert.equal(original.html.includes("View or update your estimate online"), withLink);
      assert.match(original.html, />Hi Ada,<\/p>/);
      assert.ok(!original.text.includes(SCHEDULE_URL) && !original.html.includes(SCHEDULE_URL));

      const sent = decoratePreliminaryEstimateEmail({ subject, ...original });
      assert.match(sent.html, />Hey Ada,<\/p><p [^>]*>Thank you for using the Boise Handyman Co online estimator\./);
      assert.doesNotMatch(sent.html, />Hi Ada,</);
      // One button (the Outlook VML copy of it lives in a conditional comment).
      assert.equal(count(sent.html.replace(/<!--[\s\S]*?-->/g, ""), ">Schedule now<"), 1);
      assert.ok(sent.text.includes(`Schedule now: ${SCHEDULE_URL}`));
      assert.match(sent.html, new RegExp(HANDYMAN_ACCENT, "i"));
      const shown = squash(visible(sent.html));
      // Order: schedule, then adjust, then the disclaimer, and the P.S. is the last paragraph of the letter.
      for (const body of [sent.text, shown]) {
        assert.ok(body.indexOf("choose the 1 hour option") < body.indexOf(ADJUST));
        assert.ok(body.indexOf(ADJUST) < body.indexOf(ESTIMATE_DISCLAIMER));
        assert.ok(body.indexOf(ESTIMATE_DISCLAIMER) < body.indexOf(FAMILY_PS));
        assert.equal(count(body, FAMILY_PS), 1);
        assert.equal(count(body, ADJUST), 1);
      }
      assert.ok(sent.text.endsWith(`\n\n${FAMILY_PS}`));
      assert.ok(sent.html.indexOf(FAMILY_PS) < sent.html.lastIndexOf("boisehandyman.co"), "the P.S. sits above the footer");
      assert.ok(sent.html.endsWith("</table></td></tr></table></body></html>"));
      assert.doesNotMatch(`${sent.text}\n${shown}`, BANNED);
      // Nothing in the estimate itself moved, and no internal figure appeared.
      let at = 0;
      for (const line of original.text.split("\n").filter(Boolean)) {
        const found = sent.text.indexOf(line, at);
        assert.ok(found >= 0, `kept in order: ${line}`);
        at = found + line.length;
      }
      for (const kept of ["$6,800 to $7,500", "Painting", "Confirm door style."]) {
        assert.ok(original.html.includes(kept) && sent.html.includes(kept), kept);
      }
      assert.doesNotMatch(`${sent.text}\n${shown}`, /4,430|7,166|\$4,000|\$4,400/);
      // Sending twice changes nothing.
      const again = decoratePreliminaryEstimateEmail(sent);
      assert.equal(again.text, sent.text);
      assert.equal(again.html, sent.html);
    }
    process.env.P5_LINK_SECRET = "offline-test-only";
    const admin = estimateEmail(id, record, true);
    for (const teamSubject of ["Boise Handyman Co: internal estimate record (ref 0f1e2d3c)", "Boise Handyman Co: estimate delivery needs attention (ref 0f1e2d3c)", "Boise Handyman Co: Your project request REF"]) {
      const out = decoratePreliminaryEstimateEmail({ subject: teamSubject, ...admin });
      assert.equal(out.text, admin.text);
      assert.equal(out.html, admin.html);
      assert.ok(!out.text.includes(SCHEDULE_URL) && !out.html.includes(SCHEDULE_URL));
    }
  } finally {
    keys.forEach((key, i) => {
      if (saved[i] === undefined) delete process.env[key];
      else process.env[key] = saved[i];
    });
  }
  const adapter = readFileSync("lib/p5/deliveryAdapter.ts", "utf8");
  assert.match(adapter, /typeof decoratePreliminaryEstimateEmail==="function"/);
  assert.match(adapter, /subject:message\.subject,text:message\.text,html:message\.html/);
});
