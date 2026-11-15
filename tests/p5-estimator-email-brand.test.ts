/**
 * Renders every Boise Handyman Co estimator email. Does not send mail.
 */
import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import {PGlite} from "@electric-sql/pglite";
import {ESTIMATOR_BRAND} from "../lib/p5/brand.ts";
import {ESTIMATOR_FROM, isTransientEmailError} from "../lib/p5/deliveryAdapter.ts";
import {assertCopy, emailBrandFrom, internalDeliveryTo, tierNextStep} from "../lib/p5/emailKit.ts";
import {emptyIntakeDetails} from "../lib/p5/intakeContract.ts";
import {renderIntakeEmail} from "../lib/p5/intakeEmail.ts";
import {routeIntake} from "../lib/p5/intakePolicy.ts";
import {projectReviewHandler} from "../lib/p5/reviewRequest.ts";
import {estimateEmail} from "../lib/p5/estimateEmail.ts";
import {EMAIL_FIXTURES, recordFor, renderFixture, storedRange} from "./estimator-email-fixtures.ts";

const PREPARED = "Boise Handyman Co prepared this estimate.";
const LOGO = "https://boisehandyman.co/brand/png/wordmark/light/boise-handyman-co-wordmark-charcoal-accent-1200w.png";
const TIER_LINE: Record<string, RegExp> = {
  small: /quick visit/,
  standard: /home walkthrough/,
  major: /planning consultation/,
  withheld: /home walkthrough/,
};

test("the saved-estimate link uses readable normal-size button text", () => {
  const previous = process.env.P5_LINK_SECRET;
  process.env.P5_LINK_SECRET = "isolated-render-only-signed-link-fixture";
  try {
    const id = "12345678-1234-4234-8234-123456789abc";
    const message = estimateEmail(id, recordFor(EMAIL_FIXTURES[0]), false);
    const style = message.html.match(/<a href="[^"]+" style="([^"]+)">View or update your estimate online<\/a>/)?.[1];
    assert.ok(style, "a configured saved estimate renders its signed link");
    const background = style.match(/(?:^|;)background:(#[a-f0-9]{6})/i)?.[1];
    const foreground = style.match(/(?:^|;)color:(#[a-f0-9]{6})/i)?.[1];
    assert.ok(background && foreground);
    const luminance = (hex: string) => {
      const values = [1, 3, 5].map(start => parseInt(hex.slice(start, start + 2), 16) / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
      return values[0] * .2126 + values[1] * .7152 + values[2] * .0722;
    };
    const a = luminance(background), b = luminance(foreground);
    assert.ok((Math.max(a, b) + .05) / (Math.min(a, b) + .05) >= 4.5, "15px text meets 4.5:1");
    assert.ok(message.html.includes(`/estimate/scope?estimate=${id}&amp;t=`));
  } finally {
    if (previous === undefined) delete process.env.P5_LINK_SECRET;
    else process.env.P5_LINK_SECRET = previous;
  }
});

test("brand.ts supplies this site to the shared kit", () => {
  assert.equal(ESTIMATOR_BRAND.name, "Boise Handyman Co");
  assert.equal(ESTIMATOR_BRAND.domain, "boisehandyman.co");
  assert.equal(ESTIMATOR_BRAND.email, "hello@boisehandyman.co");
  assert.equal(ESTIMATOR_BRAND.phone, "(208) 477-1169");
  assert.equal(ESTIMATOR_BRAND.accent, "#C56B4A");
  assert.equal(ESTIMATOR_BRAND.ink, "#383837");
  assert.equal(ESTIMATOR_BRAND.cityLine, "Meridian, ID 83646");
  assert.equal(ESTIMATOR_FROM, "P5 Home Co <hello@p5homeco.com>");
  assert.equal(internalDeliveryTo("test", ESTIMATOR_BRAND), "hello@p5homeco.com");
  assert.equal(internalDeliveryTo("alert", ESTIMATOR_BRAND), "hello@p5homeco.com");
  const mail = emailBrandFrom(ESTIMATOR_BRAND);
  assert.equal(mail.name, "Boise Handyman Co");
  assert.equal(mail.accent, "#C56B4A");
  assert.equal(mail.logoUrl, LOGO);
  assert.equal(mail.siteUrl, "https://boisehandyman.co");
  assert.equal(mail.cityLine, "Meridian, ID 83646");
  assert.equal(mail.charcoal, "#383837");
});

test("every stored fixture renders this brand, and P5 Home Co stays in From", () => {
  assert.equal(EMAIL_FIXTURES.length, 5);
  const seen = new Set<string>();
  for (const fixture of EMAIL_FIXTURES) {
    const rendered = renderFixture(fixture);
    seen.add(rendered.tier);
    assert.equal(rendered.tier, fixture.tier);
    for (const kind of ["admin", "customer"] as const) {
      const message = rendered[kind];
      const body = `${message.html}\n${message.text}`;
      assert.ok(message.html.startsWith("<!doctype html>"), fixture.id);
      assert.match(message.html, /Boise Handyman Co/);
      assert.match(message.html, new RegExp(LOGO.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
      assert.match(message.html, /boisehandyman\.co/);
      assert.match(message.html, /#C56B4A/i);
      assert.match(message.html, /#383837/i);
      assert.doesNotMatch(body, /p5homeco\.com/i);
      assert.doesNotMatch(body, /P5 Home Co/);
      assert.doesNotMatch(body, /is a DBA of/);
      assert.doesNotMatch(body, /showroom|\bshop\b/i);
      assert.doesNotMatch(body, /4031|wapoot/i);
      assert.doesNotMatch(body, new RegExp("[" + String.fromCharCode(0x2013, 0x2014) + "]"));
      if (kind === "customer") {
        assert.doesNotMatch(body, /111,111|222,222/);
        assert.ok(message.text.includes(PREPARED));
        assert.match(message.text, /Meridian, ID 83646/);
        assert.match(message.text, TIER_LINE[fixture.tier]);
        assert.ok(message.text.includes(tierNextStep(fixture.high)));
      }
      assertCopy(message.html, message.text, {requireDisclaimer: kind === "customer"});
    }
    if (fixture.tier === "withheld") {
      assert.equal(storedRange(fixture), "");
      assert.match(rendered.customer.text, /Pricing pending review|closer look|not priced/i);
      assert.doesNotMatch(rendered.customer.text, /\$\d/);
    } else {
      const range = storedRange(fixture);
      assert.ok(rendered.customer.html.includes(range), `${fixture.id} customer html missing ${range}`);
      assert.ok(rendered.customer.text.includes(range), `${fixture.id} customer text missing ${range}`);
      assert.ok(rendered.admin.html.includes(range), `${fixture.id} admin html missing ${range}`);
      assert.match(rendered.customer.text, /Schedule now/);
      assert.ok(rendered.customer.text.includes("https://meetings-na2.hubspot.com/client3"));
    }
    if (fixture.uploads.length) assert.match(rendered.admin.html, /View uploaded files/);
    else assert.doesNotMatch(rendered.admin.html, /View uploaded files/);
    assert.doesNotMatch(rendered.admin.html, /Open in QuickBooks/);
    if (fixture.phone) assert.match(rendered.admin.html, /tel:\+1208555/);
    else assert.doesNotMatch(rendered.admin.html, />Call</);
  }
  assert.deepEqual([...seen].sort(), ["major", "small", "standard", "withheld"]);
});

test("intake and review mail use this brand and do not name the parent site", () => {
  const snapshot = {
    schema: 1 as const,
    projectId: "handyman:12345678-1234-4234-8234-123456789abc",
    draftId: "12345678-1234-4234-8234-123456789abc",
    originSite: "handyman" as const,
    currentSite: "handyman" as const,
    revision: 1,
    contextVersion: 0,
    savedAt: "2099-01-02T12:00:00Z",
    contact: {name: "Ada Cole", email: "ada.cole@example.com", phone: "2085550142", preferredContact: "either" as const},
    details: emptyIntakeDetails(),
    scope: {text: "Hang three shelves.", answers: {service: "handyman"}, extraction: null, uploads: []},
    routing: routeIntake("handyman", "handyman"),
    unresolved: [],
  };
  for (const team of [false, true]) {
    const message = renderIntakeEmail(snapshot, team, team ? [{name: "shelf.jpg", size: 1200, url: "https://files.example.com/shelf.jpg", attached: false}] : []);
    const body = `${message.html}\n${message.text}`;
    assert.match(message.html, /Boise Handyman Co/);
    assert.match(message.html, /#C56B4A/i);
    assert.match(message.html, /boisehandyman\.co/);
    assert.match(message.html, /hello@boisehandyman\.co/);
    assert.match(message.text, /Meridian, ID 83646/);
    assert.doesNotMatch(body, /P5 Home Co|p5homeco\.com|is a DBA of/);
    assert.doesNotMatch(body, new RegExp("[" + String.fromCharCode(0x2013, 0x2014) + "]"));
    if (!team) assert.match(message.text, /Schedule now/);
  }
});

test("a dropped connection retries once, and a refused customer send alerts hello@p5homeco.com once", async () => {
  assert.equal(isTransientEmailError(Object.assign(new Error("socket hang up"), {code: "ECONNRESET"})), true);
  assert.equal(isTransientEmailError(new Error("550 mailbox unavailable")), false);
  const source = readFileSync("lib/p5/deliveryAdapter.ts", "utf8");
  const calls: {to?: string; from?: string; subject?: string}[] = [];
  let attempts = 0;
  const send = async (body: {to?: string; from?: string; subject?: string}) => {
    calls.push(body);
    if (body.to === "hello@p5homeco.com" && body.subject?.includes("was not delivered")) return {data: {id: "alert-accepted"}};
    attempts += 1;
    if (body.to === "ada.cole@example.com" && attempts === 1) throw Object.assign(new Error("socket hang up"), {code: "ECONNRESET"});
    if (body.to === "nia.brooks@example.com") throw new Error("550 mailbox unavailable");
    return {data: {id: "mock-accepted"}};
  };
  const exports: Record<string, unknown> = {};
  const deps: Record<string, unknown> = {
    "./emailReplyTo.ts": {safeEmailReplyTo: (value: string, fallback: string) => value || fallback},
    "./brand": {ESTIMATOR_BRAND},
    "./boundedCrmPayload": {buildCrmPayload: () => ({})},
    "./keyedCrm": {crmIdentity: () => ({}), deliverKeyedCrm: async () => "crm"},
    "../../server/services/emailTransport": {getUncachableEmailClient: async () => ({client: {emails: {send}}, fromEmail: "hello@boisehandyman.co"})},
    "../../server/services/emailLayout": {getAdminRecipientEmails: async () => ["hello@boisehandyman.co"]},
  };
  vm.runInNewContext(ts.transpileModule(source, {compilerOptions: {module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022}}).outputText, {
    exports,
    require: (name: string) => {
      assert.ok(Object.hasOwn(deps, name), `Unexpected adapter dependency: ${name}`);
      return deps[name];
    },
    Buffer,
    console,
    process: {env: {}},
    Set,
  });
  const sendEmail = exports.sendEmail as (input: {to: string; subject: string; text: string; attachments: []; key: string}) => Promise<string>;
  const recovered = await sendEmail({to: "ada.cole@example.com", subject: "Your estimate", text: "Hello", attachments: [], key: "retry-key"});
  assert.equal(recovered, "mock-accepted");
  assert.equal(attempts, 2);
  assert.equal(calls.filter((call) => call.to === "ada.cole@example.com").length, 2);
  assert.equal(calls[0].from, ESTIMATOR_FROM);
  await assert.rejects(() => sendEmail({to: "nia.brooks@example.com", subject: "Your estimate", text: "Hello", attachments: [], key: "fail-key"}));
  await assert.rejects(() => sendEmail({to: "nia.brooks@example.com", subject: "Your estimate", text: "Hello", attachments: [], key: "fail-key"}));
  const alerts = calls.filter((call) => call.to === "hello@p5homeco.com");
  assert.equal(alerts.length, 1);
  assert.equal(alerts[0].from, ESTIMATOR_FROM);
  assert.match(String(alerts[0].subject), /Boise Handyman Co/);
});

test("review request mail is this brand", async () => {
  const db = new PGlite();
  const id = "12345678-1234-4234-8234-123456789abc";
  await db.exec("CREATE TABLE p5_estimator_work(draft_id uuid,work_key text,payload jsonb);CREATE TABLE p5_estimator_drafts(id uuid PRIMARY KEY,revision integer,status text);INSERT INTO p5_estimator_drafts VALUES('12345678-1234-4234-8234-123456789abc',1,'draft')");
  let html = "";
  let text = "";
  const handler = projectReviewHandler({
    readDraft: async () => ({id, brand: ESTIMATOR_BRAND.id, revision: 1, status: "draft" as const, updatedAt: "", text: "Hang three shelves.", answers: {service: "handyman"}, extraction: null, reviewed: null, uploads: [], contact: {name: "Ada Cole", email: "ada.cole@example.com", phone: "2085550142"}}),
    query: async (sql: string, values: unknown[] = []) => (await db.query(sql, values)).rows,
    adminRecipients: async () => ["hello@boisehandyman.co"],
    sendEmail: async (input: {html?: string; text: string}) => {
      html = input.html || "";
      text = input.text;
      return "render-only";
    },
  });
  try {
    const response = await handler(new Request("https://boisehandyman.co/api/p5-estimator/review", {method: "POST", headers: {"x-p5-draft-id": id, "x-p5-draft-key": "a".repeat(64), "Content-Type": "application/json"}, body: JSON.stringify({name: "Ada Cole", email: "ada.cole@example.com", phone: "2085550142"})}));
    assert.equal(response.status, 200);
    assert.match(html, /Boise Handyman Co/);
    assert.match(html, /#C56B4A/i);
    assert.ok(html.includes(LOGO));
    assert.match(html, /Meridian, ID 83646/);
    assert.match(html, /boisehandyman\.co/);
    assert.doesNotMatch(`${html}\n${text}`, /P5 Home Co|p5homeco\.com/);
  } finally {
    await db.close();
  }
});
